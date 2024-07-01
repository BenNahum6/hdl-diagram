const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const JSON5 = require('json5');
const hdl_parser = require('hdl-parser');
const os = require('os');
const netlistsvg = require('netlistsvg');


function convertHdlToYosysJson(hdlJson) {
    if (!hdlJson || typeof hdlJson !== 'object') {
        throw new Error("Invalid HDL JSON input");
    }

    const yosysJson = {
        modules: {}
    };

    // Extract module name
    const moduleName = hdlJson.name;
    if (!moduleName) {
        throw new Error("HDL JSON must have a 'name' property");
    }

    yosysJson.modules[moduleName] = {
        ports: {},
        cells: {}
    };

    let bitCounter = 1;
    const portMap = {};

    // Process definitions for ports
    hdlJson.definitions.forEach(definition => {
        if (definition.type === 'IN' || definition.type === 'OUT') {
            definition.pins.forEach(pin => {
                yosysJson.modules[moduleName].ports[pin.name] = {
                    direction: definition.type === 'IN' ? 'input' : 'output',
                    bits: [bitCounter]
                };
                portMap[pin.name] = bitCounter;
                bitCounter++;
            });
        }
    });

    // Process parts for cells
    hdlJson.parts.forEach((part, index) => {
        const cellName = `${part.name}${index + 1}`;
        yosysJson.modules[moduleName].cells[cellName] = {
            type: "$" + part.name,
            port_directions: {},
            connections: {}
        };

        // Add port directions from part definitions
        part.connections.forEach(connection => {
            const fromPin = connection.from.pin;
            const toPin = connection.to.pin;

            if (fromPin && !yosysJson.modules[moduleName].cells[cellName].port_directions[fromPin]) {
                yosysJson.modules[moduleName].cells[cellName].port_directions[fromPin] = 'input';
            }

            if (toPin && !yosysJson.modules[moduleName].cells[cellName].port_directions[toPin]) {
                yosysJson.modules[moduleName].cells[cellName].port_directions[toPin] = 'output';
            }
        });

        // Process connections
        part.connections.forEach(connection => {
            const fromPin = connection.from.pin || connection.from.const;
            const toPin = connection.to.pin || connection.to.const;

            if (!portMap[fromPin]) {
                portMap[fromPin] = bitCounter++;
            }

            if (!portMap[toPin] && typeof toPin === 'string') {
                portMap[toPin] = bitCounter++;
            }

            // Update connections
            yosysJson.modules[moduleName].cells[cellName].connections[fromPin] = [portMap[toPin]];
        });
    });

    return yosysJson;
}



function saveYosysJson(yosysJson) {
    // Convert yosysJson to JSON string
    const jsonString = JSON.stringify(yosysJson, null, 2);
    const filePath = path.join(__dirname, 'yosys.json');
    // Write JSON string to file
    fs.writeFile(filePath, jsonString, (err) => {
        if (err) {
            console.error('Error saving Yosys JSON file:', err);
            return;
        }
        console.log(`Yosys JSON file saved successfully at: ${filePath}`);
        
    });
    return filePath;
}

// Function to load and display SVG in VSCode
async function displaySvgInVSCode(svgFilePath) {
    try {
        const svgUri = vscode.Uri.file(svgFilePath);
        const document = await vscode.workspace.openTextDocument(svgUri);
        await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
        vscode.window.showInformationMessage(`SVG generated successfully and opened in VSCode.`);
    } catch (error) {
        vscode.window.showErrorMessage(`Error opening SVG file: ${error.message}`);
    }
}


function renderJsonWithNetlistsvg(jsonPath, outputPath) {
    const netlistsvgCommand = `netlistsvg ${jsonPath} -o ${outputPath}`;

    exec(netlistsvgCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error rendering JSON with netlistsvg: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`netlistsvg stderr: ${stderr}`);
            return;
        }
        
        console.log('SVG rendered successfully:', outputPath);
    });
}

function showSvgInWebView(context, svgContent) {
    const panel = vscode.window.createWebviewPanel(
        'svgViewer', // Unique ID
        'HDL-diagram Viewer', // Title
        vscode.ViewColumn.One, // Column to show the panel
        {
            enableScripts: true // Allow scripts in the WebView
        }
    );

    // Construct the HTML content with embedded SVG
    panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <style>
        body {
            background-color: white; /* Set background color to white */
            margin: 0; /* Remove default margin */
            padding: 0; /* Remove default padding */
        }
    </style>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SVG Viewer</title>
        </head>
        <body>
            ${svgContent} <!-- SVG content here -->
        </body>
        </html>
    `;
}

function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "hdl-diagram" is now active!');

    let disposable = vscode.commands.registerCommand('hdl-diagram.helloWorld', function () {

        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            return;
        }
        
        let hdlCode = editor.document.getText();
        // console.log(hdlCode);;
        let parsedJSON
        // checking if the user's code have some Syntax errors
        try{
            parsedJSON = hdl_parser.parse(hdlCode);
            console.log();
        }catch(err){
            vscode.window.showInformationMessage(err.toString());
            return
        }

        const yosysJson = convertHdlToYosysJson(parsedJSON);
        
        const svgPath = path.join(__dirname, 'svgTest.svg');

        const yosysPath = saveYosysJson(yosysJson);
        renderJsonWithNetlistsvg(yosysPath,svgPath);

        console.log(yosysPath)
        const svgContent = fs.readFileSync(svgPath, 'utf8'); // Read SVG file content


        showSvgInWebView(context, svgContent);
       


    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
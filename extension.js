const vscode = require('vscode');
const hdl_parser = require('hdl-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Congratulations, your extension "Hdl-Diagram" is now active!');

    let panel = null;

    // Function to process and update SVG
    const processAndUpdateSvg = async (document) => {
        let textPath = document.uri.fsPath;

        if (!textPath.endsWith(".hdl")) {
            vscode.window.showInformationMessage("Error: this file does not end with .hdl");
            return;
        }

        let userCodeText = document.getText();
        let parsedUserText;

        try {
            parsedUserText = hdl_parser.parse(userCodeText);
        } catch (err) {
            vscode.window.showInformationMessage(err.toString());
            return;
        }

        const yosysJson = convertHdlToYosysJson(parsedUserText);
        const svgPath = path.join(__dirname, 'svgFile.svg');
        const yosysPath = saveYosysJson(yosysJson);
        const skinFilePath = path.join(__dirname,'skinFile.svg');

        await renderJsonWithNetlistsvg(yosysPath, svgPath,skinFilePath);

        const svgContent = await waitForFile(svgPath);

        if (panel) {
            panel.webview.html = generateWebviewContent(svgContent, parsedUserText);
        } else {
            panel = vscode.window.createWebviewPanel(
                'svgViewer', 
                'HDL-diagram Viewer', 
                vscode.ViewColumn.One, 
                { enableScripts: true, retainContextWhenHidden: true }
            );
            panel.webview.html = generateWebviewContent(svgContent, parsedUserText);
            panel.onDidDispose(() => { panel = null; }, null, context.subscriptions);
        }
    };

    let disposable = vscode.commands.registerCommand('hdl-diagram.helloWorld', function () {
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            return;
        }

        processAndUpdateSvg(editor.document);
    });

    context.subscriptions.push(disposable);

    vscode.workspace.onDidSaveTextDocument((document) => {
        if (document === vscode.window.activeTextEditor.document) {
            processAndUpdateSvg(document);
        }
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};


function convertHdlToYosysJson(hdlJson) {
    if (!hdlJson || typeof hdlJson !== 'object') {
        throw new Error("Invalid HDL JSON input");
    }

    const yosysJson = {
        modules: {}
    };

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

    // Convert ports
    hdlJson.definitions.forEach(definition => {
        if (definition.type === 'IN' || definition.type === 'OUT') {
            definition.pins.forEach(pin => {
                yosysJson.modules[moduleName].ports[pin.name.toUpperCase()] = {
                    direction: definition.type === 'IN' ? 'input' : 'output',
                    bits: [bitCounter]
                };
                portMap[pin.name.toUpperCase()] = bitCounter;
                bitCounter++;
            });
        }
    });

    // Convert parts to cells
    hdlJson.parts.forEach((part, index) => {
        const cellName = `${part.name}${index + 1}`;
        yosysJson.modules[moduleName].cells[cellName] = {
            type: "$" + part.name.toLowerCase(),
            port_directions: {},
            connections: {}
        };

        part.connections.forEach(connection => {
            const fromPin = connection.from.pin.toUpperCase();
            const toPin = connection.to.pin.toUpperCase();

            // Check and set port directions based on the defined ports
            if (fromPin && !yosysJson.modules[moduleName].cells[cellName].port_directions[fromPin]) {
                let portDirection = 'output';
                if (yosysJson.modules[moduleName].ports[fromPin]) {
                    portDirection = yosysJson.modules[moduleName].ports[fromPin].direction;
                }
                yosysJson.modules[moduleName].cells[cellName].port_directions[fromPin] = portDirection;
            }

            if (toPin && !yosysJson.modules[moduleName].cells[cellName].port_directions[toPin]) {
                let portDirection = 'input';
                if (yosysJson.modules[moduleName].ports[toPin]) {
                    portDirection = yosysJson.modules[moduleName].ports[toPin].direction;
                }
                yosysJson.modules[moduleName].cells[cellName].port_directions[toPin] = portDirection;
            }

            // Assign bit numbers to ports
            if (!portMap[fromPin]) {
                portMap[fromPin] = bitCounter++;
            }

            if (!portMap[toPin] && typeof toPin === 'string') {
                portMap[toPin] = bitCounter++;
            }

            // Add connections
            if (!yosysJson.modules[moduleName].cells[cellName].connections[fromPin]) {
                yosysJson.modules[moduleName].cells[cellName].connections[fromPin] = [];
            }

            yosysJson.modules[moduleName].cells[cellName].connections[fromPin].push(portMap[toPin]);
        });
    });

    return yosysJson;
}





function saveYosysJson(yosysJson) {
    const jsonString = JSON.stringify(yosysJson, null, 2);
    const filePath = path.join(__dirname, 'yosysJsonFile.json');

    fs.writeFileSync(filePath, jsonString);

    return filePath;
}


async function renderJsonWithNetlistsvg(jsonPath, outputPath,skinFilePath) {
    return new Promise((resolve, reject) => {
        const netlistsvgCommand = `netlistsvg ${jsonPath} -o ${outputPath} --skin ${skinFilePath}`;

        exec(netlistsvgCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error rendering JSON with netlistsvg: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`netlistsvg stderr: ${stderr}`);
                reject(new Error(stderr));
                return;
            }

            resolve();
        });
    });
}

async function waitForFile(filePath, timeout = 5000, interval = 100) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`File ${filePath} not found within timeout period.`);
}

function generateWebviewContent(svgContent, parsedUserText) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
         <h1>Chip ${parsedUserText.name}</h1>
         <h2>To update your diagram simply press CTRL + S</h2>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SVG Viewer</title>
        </head>
        <body>
            <div class="hdlDiagram">
                ${svgContent}
            </div>
            <style>

                .hdlDiagram {
                    padding: 7vh;
                    border: 2px solid black;
                }
                body {
                    background-color: white;
                    display: grid;
                    place-items: center;
                }
                h1 {
                    color: black;
                    font-size: 30px;
                    text-align: center;
                }
            </style>
        </html>
    `;
}

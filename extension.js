// // The module 'vscode' contains the VS Code extensibility API
// // Import the module and reference it with the alias vscode in your code below
// const vscode = require('vscode');
// const hdl_parser = require('hdl-parser');
// // const path = require('path');
// // const path = require('path');
// // This method is called when your extension is activated
// // Your extension is activated the very first time the command is executed

// /**
//  * @param {vscode.ExtensionContext} context
//  */
// function activate(context) {

// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('Congratulations, your extension "hdl-diagram" is now active!');

// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with  registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	let disposable = vscode.commands.registerCommand('hdl-diagram.helloWorld', function () {

// 		let userCode = vscode.window.activeTextEditor.document;
// 		let textPath = userCode.uri.fsPath;
// 		// let dirPath = path.dirname(textPath);

// 		//checking to see if the user's code file ends with .hdl
// 		if (!textPath.endsWith(".hdl")){
// 			vscode.window.showInformationMessage("Error: this file does not ends with .hdl");
// 			return;
// 		}

// 		let parsedUserText;
// 		let userCodeText = userCode.getText();

// 		// checking if the user's code have some Syntax errors
// 		try{
// 			parsedUserText = hdl_parser.parse(userCodeText);
            
// 		}catch(err){
// 			vscode.window.showInformationMessage(err.toString());
// 			return
// 		}

// 		// the data of the chip itself, that "parts" will be analyze after
// 		let INmainPin = [];
// 		let OUTmainPin = [];
// 		for (let i = 0; i < parsedUserText.definitions.length; i++) {
// 			const definition = parsedUserText.definitions[i];
        
// 			if (definition.type === "IN") {
// 				for (let j = 0; j < definition.pins.length; j++) {
// 					INmainPin.push(definition.pins[j].name);
// 				}
// 			}
        
// 			if (definition.type === "OUT") {
// 				for (let j = 0; j < definition.pins.length; j++) {
// 					OUTmainPin.push(definition.pins[j].name);
// 				}
// 			}
// 		}

// 		// Inserts the connection names into the array
// 		let parts1 = [];
// 		for (let i = 0; i < parsedUserText.parts.length; i++) {
// 			parts1.push(parsedUserText.parts[i].name);
// 			// console.log(parsedUserText.parts[i].name);	
// 		}


// 		for (let i = 0; i < parts1.length; i++) {
// 			console.log(parts1[i]);
// 			parsedUserText.parts[i].connections.forEach((connection, index) => {
// 				console.log(connection);

// 				// const fromPin = connection.from.pin;
// 				// const fromBits = connection.from.bits;
// 				// const toPin = connection.to.pin || null;
// 				// const toBits = connection.to.bits || null;
// 				// const toConst = connection.to.const || null;
            
// 				// console.log(`Connection ${index + 1}:`);
// 				// console.log(`  From - Pin: ${fromPin}, Bits: ${fromBits}`);
                
// 				// if (toPin) {
// 				// console.log(`  To - Pin: ${toPin}, Bits: ${toBits}`);
// 				// } else if (toConst) {
// 				// console.log(`  To - Const: ${toConst}`);
// 				// }
// 			});
// 		}
          
// 		  // Extract parts from the JSON data
// 		  const parts = parsedUserText.parts;
          
// 		  // Create the dictionary of connections
// 		//   const connectionsDict = createConnectionsDict(parts);
          
// 		//   console.log(connectionsDict);
          

        


// 		// debug output to check the analyze, just for us
// 		vscode.window.showInformationMessage(INmainPin.toString());
// 		vscode.window.showInformationMessage(OUTmainPin.toString());
// 		vscode.window.showInformationMessage(parts1.toString());

// 	});

// 	context.subscriptions.push(disposable);
// }

// // This method is called when your extension is deactivated
// function deactivate() {}

// module.exports = {
// 	activate,
// 	deactivate
// }


const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const JSON5 = require('json5');
const hdl_parser = require('hdl-parser');
const os = require('os');




// // Function to get the directory path of the currently active file
// function getFilePath() {
// 	// Check if there's an active text editor
// 	let editor = vscode.window.activeTextEditor;
// 	if (editor) {
// 		// Get the URI of the currently open file
// 		let uri = editor.document.uri;
// 		// Convert the URI to a file path
// 		let filePath = uri.fsPath;
// 		// Return the directory path of the file
// 		return path.dirname(filePath);
// 	} else {
// 		// If no active text editor, use the workspace root path
// 		return vscode.workspace.rootPath;
// 	}
// }

// function SaveJsonFile(parsedJSON, name){

// 	// Convert JSON object to JSON5 string
// 	const jsonString = JSON5.stringify(parsedJSON, null, 2); // null, 2 for pretty-printing with 2 spaces;
// 	console.log(jsonString)

// 	const filePath = path.join(__dirname, name); // Specify the path and filename
// 	console.log(filePath)

// 	fs.writeFile(filePath, jsonString, 'utf8', (err) => {
// 		if (err) {
// 			console.error('Error writing JSON file:', err);
// 			return;
// 		}
// 		console.log('JSON file has been saved:', filePath);
// 	});
    
// 	return filePath
// }

function convertHdlToNetlist(hdlJson) {
    if (!hdlJson || typeof hdlJson !== 'object') {
        throw new Error("Invalid HDL JSON input");
    }

    const netlistJson = {
        modules: {}
    };

    // Extract module name
    const moduleName = hdlJson.name;
    if (!moduleName) {
        throw new Error("HDL JSON must have a 'name' property");
    }

    netlistJson.modules[moduleName] = {
        ports: {},
        cells: {}
    };

    let bitCounter = 1;
    const portMap = {};

    // Process definitions for ports
    hdlJson.definitions.forEach(definition => {
        if (definition.type === 'IN' || definition.type === 'OUT') {
            definition.pins.forEach(pin => {
                netlistJson.modules[moduleName].ports[pin.name] = {
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
        netlistJson.modules[moduleName].cells[cellName] = {
            type: part.name,
            connections: {}
        };

        // Handle port_directions if applicable
        if (part.port_directions) {
            netlistJson.modules[moduleName].cells[cellName].port_directions = part.port_directions;
        }

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

            netlistJson.modules[moduleName].cells[cellName].connections[connection.from.pin] = [portMap[toPin]];
        });

        // Handle attributes if applicable
        if (part.attributes) {
            netlistJson.modules[moduleName].cells[cellName].attributes = part.attributes;
        }
    });

    return netlistJson;
}

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
            type: part.name,
            connections: {}
        };

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

            yosysJson.modules[moduleName].cells[cellName].connections[connection.from.pin] = {
                bits: [portMap[toPin]]
            };
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

// function generateNetlistAndSVG(parsedJSON) {
// 	const netlistJSON = JSON5.stringify(parsedJSON, null, 2); // null, 2 for pretty-printing with 2 spaces;
// 	console.log(netlistJSON);
// 	const netlistFilePath = path.join(__dirname, 'generated_netlist.json');
    
// 	// Write netlist JSON to file
// 	fs.writeFileSync(netlistFilePath, netlistJSON, 'utf8');
  
// 	// Execute netlistsvg command
// 	exec(`netlistsvg ${netlistFilePath} -o generated_output.svg`, (error, stdout, stderr) => {
// 	  if (error) {
// 		console.error(`Error: ${error.message}`);
// 		return;
// 	  }
// 	  if (stderr) {
// 		console.error(`Error: ${stderr}`);
// 		return;
// 	  }
// 	  console.log(`SVG generated successfully! Output: ${stdout}`);
// 	});
// }

// // Function to generate netlist using Yosys
// function generateNetlist(yosysJsonFilePath) {
//     return new Promise((resolve, reject) => {
//         exec(`yosys -p 'read_json ${yosysJsonFilePath}; synth; write_json netlist.json'`, (error, stdout, stderr) => {
//             if (error) {
//                 reject(new Error(`Yosys error: ${error.message}`));
//                 return;
//             }
//             if (stderr) {
//                 reject(new Error(`Yosys stderr: ${stderr}`));
//                 return;
//             }
//             resolve('netlist.json'); // Resolve with path to generated netlist JSON file
//         });
//     });
// }

// Function to generate netlist using Yosys
function generateNetlist(yosysJsonFilePath) {
    console.log(yosysJsonFilePath);
    return new Promise((resolve, reject) => {
        exec(`yosys -p 'read_json ${yosysJsonFilePath}; synth; write_json netlist.json'`, (error, stdout, stderr) => {
            if (error) {
                console.log(error);
                reject(new Error(`Yosys error: ${error.message}`));
                return;
            }
            if (stderr) {
                console.log("line 366");
                reject(new Error(`Yosys stderr: ${stderr}`));
                return;
            }
            resolve(path.join(path.dirname(yosysJsonFilePath), 'netlist.json')); // Resolve with path to generated netlist JSON file
        });
    });
}

// // Function to generate netlist using Yosys
// function generateNetlist(yosysJsonFilePath) {
//     return new Promise((resolve, reject) => {
//         exec(`yosys -p 'read_json ${yosysJsonFilePath}; synth; write_json netlist.json'`, (error, stdout, stderr) => {
//             if (error) {
//                 reject(new Error(`Yosys error: ${error.message}`));
//                 return;
//             }
//             if (stderr) {
//                 reject(new Error(`Yosys stderr: ${stderr}`));
//                 return;
//             }
//             resolve(path.join(path.dirname(yosysJsonFilePath), 'netlist.json')); // Resolve with path to generated netlist JSON file
//         });
//     });
// }

// Function to generate SVG from netlist using netlistsvg
function generateSvgFromNetlist(netlistFilePath) {
    return new Promise((resolve, reject) => {
        exec(`netlistsvg ${netlistFilePath} -o generated_output.svg`, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`netlistsvg error: ${error.message}`));
                return;
            }
            if (stderr) {
                reject(new Error(`netlistsvg stderr: ${stderr}`));
                return;
            }
            resolve(path.join(path.dirname(netlistFilePath), 'generated_output.svg')); // Resolve with path to generated SVG file
        });
    });
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

// Example function to demonstrate usage
async function processNetlistAndDisplay() {
    try {
        // Replace this with your own logic to generate or load netlist.json
        const netlistFilePath = '/path/to/netlist.json';

        // Generate SVG from netlist using netlistsvg
        const svgFilePath = await generateSvgFromNetlist(netlistFilePath);

        // Display SVG in VSCode
        await displaySvgInVSCode(svgFilePath);
    } catch (error) {
        vscode.window.showErrorMessage(`Error processing netlist and displaying SVG: ${error.message}`);
    }
}

function displayJsonInVSCode(filePath) {
    // // Resolve the full path of the file
    const fullPath = path.resolve(filePath);

    // Use VSCode command to open file
    const command = `code --wait ${fullPath}`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error('Error opening file in VSCode:', err);
            return;
        }
        console.log('File opened successfully in VSCode.');
    });
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
        
        const yosysPath = saveYosysJson(yosysJson);
        console.log(yosysPath)
        displayJsonInVSCode(yosysPath);



    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
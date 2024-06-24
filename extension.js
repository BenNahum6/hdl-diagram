// // The module 'vscode' contains the VS Code extensibility API
// // Import the module and reference it with the alias vscode in your code below
// const vscode = require('vscode');
const hdl_parser = require('hdl-parser');
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



// Function to generate SVG from JSON file using netlistsvg
function generateNetlistAndSVG(netlistFilePath, outputSVGPath) {

	const netlistsvgCommand = `netlistsvg "${netlistFilePath}" -o "${outputSVGPath}"`;

	exec(netlistsvgCommand, (error, stdout, stderr) => {
		if (error) {
			vscode.window.showErrorMessage(`Error 1: ${error.message}`);
			return;
		}
		if (stderr) {
			vscode.window.showErrorMessage(`Error 2: ${stderr}`);
			return;
		}
		vscode.window.showInformationMessage(`SVG generated successfully! Output: ${outputSVGPath}`);

		// Open the generated SVG file in VSCode
		vscode.workspace.openTextDocument(outputSVGPath).then(doc => {
			vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
		});
	});

	console.log(netlistsvgCommand);
}

// Function to get the directory path of the currently active file
function getFilePath() {
	// Check if there's an active text editor
	let editor = vscode.window.activeTextEditor;
	if (editor) {
		// Get the URI of the currently open file
		let uri = editor.document.uri;
		// Convert the URI to a file path
		let filePath = uri.fsPath;
		// Return the directory path of the file
		return path.dirname(filePath);
	} else {
		// If no active text editor, use the workspace root path
		return vscode.workspace.rootPath;
	}
}

function SaveJsonFile(parsedJSON, name){

	// Convert JSON object to JSON5 string
	const jsonString = JSON5.stringify(parsedJSON, null, 2); // null, 2 for pretty-printing with 2 spaces;
	console.log(jsonString)

	const filePath = path.join(__dirname, name); // Specify the path and filename
	console.log(filePath)

	fs.writeFile(filePath, jsonString, 'utf8', (err) => {
		if (err) {
			console.error('Error writing JSON file:', err);
			return;
		}
		console.log('JSON file has been saved:', filePath);
	});
	
	return filePath
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

		const newJsonPath = SaveJsonFile(parsedJSON, 'data.json');
		const OutputPath = 'c:\Users\Ben\hdl-diagram-master\hdl-diagram-master\hdl-diagram\generated_output.svg';
		// OutputPath += `\\newOne`;

		// let jsonFilePath = getCurrentFilePath();
		// console.log(jsonFilePath);

		try {
			generateNetlistAndSVG(newJsonPath,OutputPath);
			
		} catch (error) {
			vscode.window.showErrorMessage(`Error parsing HDL code: ${error.message}`);
		}
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
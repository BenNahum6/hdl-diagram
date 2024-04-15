// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const hdl_parser = require('hdl-parser');
// const path = require('path');
// const path = require('path');
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "hdl-diagram" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('hdl-diagram.helloWorld', function () {

		let userCode = vscode.window.activeTextEditor.document;
		let textPath = userCode.uri.fsPath;
		// let dirPath = path.dirname(textPath);

		//checking to see if the user's code file ends with .hdl
		if (!textPath.endsWith(".hdl")){
			vscode.window.showInformationMessage("Error: this file does not ends with .hdl");
			return;
		}

		let parsedUserText;
		let userCodeText = userCode.getText();

		// checking if the user's code have some Syntax errors
		try{
			parsedUserText = hdl_parser.parse(userCodeText);
			
		}catch(err){
			vscode.window.showInformationMessage(err.toString());
			return
		}

		// the data of the chip itself, that "parts" will be analyze after
		let INmainPin = [];
		let OUTmainPin = [];
		for (let i = 0; i < parsedUserText.definitions.length; i++) {
			const definition = parsedUserText.definitions[i];
		
			if (definition.type === "IN") {
				for (let j = 0; j < definition.pins.length; j++) {
					INmainPin.push(definition.pins[j].name);
				}
			}
		
			if (definition.type === "OUT") {
				for (let j = 0; j < definition.pins.length; j++) {
					OUTmainPin.push(definition.pins[j].name);
				}
			}
		}

		// debug output to check the analyze, just for us
		vscode.window.showInformationMessage(INmainPin.toString());
		vscode.window.showInformationMessage(OUTmainPin.toString());
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

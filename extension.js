// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const hdl_parser = require('hdl-parser');
const path = require("path");

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

	let extensionExcute = vscode.commands.registerCommand('nand2tetris-hdl-visualizer.visualize', function () {
		// The code you place here will be executed every time your command is executed

		// get paths of current document and directory
		let doc = vscode.window.activeTextEditor.document;
		let doc_path = doc.uri.fsPath;
		let dir_path = path.dirname(doc_path);

		// check if document is hdl file
		if (!doc_path.endsWith(".hdl")) {
			vscode.window.showInformationMessage("Error: Input file does not have the .hdl extension.");
			return;
		}		
		
		// parse hdl file and check if the file has proper hdl syntax
		let doc_phdl;
		let doc_text = doc.getText();
		try {
			doc_phdl = hdl_parser.parse(doc_text);
		}
		catch(err) {
			vscode.window.showInformationMessage(err.toString());
			return;
		}
	});


	context.subscriptions.push(extensionExcute);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
};
# Hdl-Diagram VSCode Extension

This is the README for your extension "hdl-diagram". After writing up a brief description, we recommend including the following sections.

## Overview

Hdl-Diagram is a Visual Studio Code extension that provides real-time visualization of HDL (Hardware Description Language) files. This extension parses HDL files, converts them to a JSON representation suitable for yosys, and renders the circuit diagram as an SVG using in the VSCode panel.

## Features

* Parses .hdl files to extract circuit information.
![image](https://github.com/user-attachments/assets/f5497ff9-f510-4211-b9f3-cfef9583177f)

* Converts HDL data into yosys-compatible JSON.
* Uses netlistsvg to render circuit diagrams as SVG.
* Automatically updates the diagram on file save.

## Installation

Clone the repository to your local machine:

bash
Copy code
git clone https://github.com/your-repo/hdl-diagram
Navigate to the extension directory:

bash
Copy code
cd hdl-diagram
Install dependencies:

bash
Copy code
npm install
Open the extension in Visual Studio Code:

bash
Copy code
code .
Run the extension:

Press F5 to open a new VSCode window with the extension loaded.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

open source.

## Working with Markdown

You can author your README using Visual Studio Code.  Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux)
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux)
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**

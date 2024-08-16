## Overview

Hdl-Diagram is a Visual Studio Code extension that provides real-time visualization of HDL (Hardware Description Language) files. This extension parses HDL files, converts them to a JSON representation suitable for yosys, and renders the circuit diagram as an SVG using in the VSCode panel.
we used [Netlistsvg](https://github.com/nturley/netlistsvg) to create SVG diagram file.

## Installation
our extension downloading all necessary packages, we advice you to download [Netlistsvg](https://github.com/nturley/netlistsvg). if there are errors with it.

we advice you to run VScode as administrator (Right Click + Run as administrator)

1. download the Extension in VScode MarketPlace(Extensions), search "HDL-Diagram"

2. Or Run this command to install the code
```sh
git clone https://github.com/BenNahum6/hdl-diagram
```
after running this command, compile and run the code.

## How to run

1. Press F1 or "CTRL + SHIFT + P" to open command search.
2. Search "Visualize HDL-Diagram" Command to run the extension.
3. Press "CTRL + S" to update your diagram.

## Photo

![Image](Images/demoImage.png)

## License

open source.

**Enjoy!**

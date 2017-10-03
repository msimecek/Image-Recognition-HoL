# 0 - Preparation

In order to participate in this workshop, you need to install several pieces of software to your computer. I tried to design the workshop to be platform-independent, so that you can make it through on a Windows PC, macOS computer or Linux PC (or even Raspberry Pi, if you're interested...).

Please install:

* [Visual Studio Code](https://code.visualstudio.com/) for your platform
* C# Extension for VS Code
  * can be installed from the IDE itself 
  * or with this command: `code --install-extension ms-vscode.csharp`
* [.NET Core 2.0 SDK](https://www.microsoft.com/net/download/core) for your platform
* [Node.js](https://nodejs.org/en/)
* [Postman](https://www.getpostman.com/)
* and a web browser...

When you're done, check that everything has installed properly - open your terminal (command prompt) and try:

* `dotnet --version`
  * should return `2.0.0` (or newer) 
* `npm --version`
  * should return something like `3.10.9` (or newer)
* `code .`
  * should open Visual Studio Code with the current directory
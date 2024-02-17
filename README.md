# A discord bot dedicated to interacting with images

#### This bot was initially made with the purpose of centering images for the sake of tweeting them.

# How do I get started?
1. Clone the repository
2. Run `npm i --save-dev` in a terminal in the directory
3. Create a file called `.env` and put [your discord application](https://discord.com/developers/applications)'s `token` & `clientId` inside
4. Run `node .` in your terminal
5. Done!

## How do I make my own command?

1. Create a new file in the `commands` folder (the name of the file does not matter)
2. Import `createCommand.js`
3. Return the result of `createCommand()` as your `module.exports`

Usage:
```js
module.exports = createCommand(command_name, description, image_manipulator, data_manipulator?)
// command_name: The name of the command. This is what the user will see & type
// description: The text the user sees after typing the name of your command
// image_manipulator: The function which the image and interaction is passed to
// data_manipulator (OPTIONAL): The function which can manipulate the information the command contains, such as any extra arguments in your command
```

Example:
```js
// commands/greyscale.js
const createCommand = require("../createCommand")

module.exports = createCommand("greyscale", "Turns an image greyscale", image => image.greyscale())
```
For an example containing a `data_manipulator` function, see [caption.js](commands/caption.js) or [resize.js](commands/resize.js)
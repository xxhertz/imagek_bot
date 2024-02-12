# A discord bot dedicated to interacting with images

#### This bot was initially made with the purpose of centering images for the sake of tweeting them.

# How do I get started?
1. Clone the repository
2. Run `npm i --save-dev` in a terminal in the directory
3. Put [your discord application](https://discord.com/developers/applications)'s `token` & `clientId` inside the `token.json` file
4. Run `node .` in your terminal
5. Done!

## How do I make my own command?

1. Create a new file in the `commands` folder (the name of the file does not matter)
2. Import `createCommand.js`
3. Return the result of `createCommand()` as your `module.exports`

Usage:
```js
module.exports = createCommand(command_name, description, fn, data_manipulator?)
// command_name: The name of the command. This is what the user will see & type
// description: The text the user sees after typing the name of your command
// fn: The function which the image and interaction is passed to
// data_manipulator (OPTIONAL): The function which can manipulate the information the command contains, such as any extra arguments in your command
```

```js
createCommand("greyscale", "Turns an image greyscale", image => image.greyscale())
```
For an example containing a data_manipulator, see [the caption command](commands/caption.js)
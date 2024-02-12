const createCommand = require("../createCommand")

module.exports = createCommand("greyscale", "Removes the color from an image", async image => image.greyscale())
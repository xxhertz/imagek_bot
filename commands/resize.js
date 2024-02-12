const createCommand = require("../createCommand.js")

module.exports = createCommand("resize", "Resizes an image by a specified width and/or height", async (image, interaction) =>
	image.resize({
		width: interaction.options.getNumber("width"),
		height: interaction.options.getNumber("height"),
		fit: interaction.options.getString("resizetype") ?? "cover"
	}),
	builder => builder
		.addNumberOption(input => input
			.setName("width")
			.setDescription("Desired width of the image in pixels")
			.setMaxValue(2048)
			.setMinValue(1))
		.addNumberOption(input => input
			.setName("height")
			.setDescription("Desired height of the image in pixels")
			.setMaxValue(2048)
			.setMinValue(1))
		.addStringOption(input => input
			.setName("resizetype")
			.setDescription("The way you'd like the image to be resized")
			.setChoices({name: "crop", value: "cover"}, {name: "stretch", value: "fill"}))
)


const {getImageData, getPixel} = require("../helpers.js")
const createCommand = require("../createCommand")

// not a great caption, but showcases the full potential of createCommand
module.exports = createCommand("caption", "Captions an image", async (image, interaction) => {
	const image_data = await getImageData(image)
	const {width, height} = image_data.info
	const caption = interaction.options.getString("caption")
	const font_size = interaction.options.getNumber("font_size") ?? 40

	return image.extend({
		top: font_size + 60,
		bottom: 0,
		
		left: 0,
		right: 0,
		
		background: { r:255, g:255, b:255, alpha:255 }}).composite([{
		input: new Buffer.from(`<svg width="${width}" height="${font_size}" viewBox="0 0 ${width} ${font_size + 2}"> <text x="50%" y="50%" text-anchor="middle" dy="${font_size / 2}px" font-size="${font_size}px" fill="#000">${caption}</text> </svg>`),
		top: 0,
		left: 0	
	}])
}, command_builder => command_builder
	.addStringOption(option => option
		.setName("caption")
		.setDescription("Caption to place on the image")
		.setRequired(true)
	)
	.addNumberOption(option => option
		.setName("font_size")
		.setDescription("Font size of the caption")
		.setRequired(false)
	)
)
const {getImageData, getPixel} = require("../helpers.js")
const createCommand = require("../createCommand")

module.exports = createCommand("center", "Centers an image", async image => {
	const image_data = await getImageData(image)
	const {width, height} = image_data.info
	
	const [r, g, b, alpha] = getPixel(image_data, 0, 0)

	const post_trim = image.trim()
	const trim_data = await getImageData(post_trim)

	const width_diff = width - trim_data.info.width
	const height_diff = height - trim_data.info.height
	
	const even_width = width_diff % 2
	const even_height = height_diff % 2

	return post_trim.extend({
		top: (height_diff - even_height) / 2,
		bottom: (height_diff + even_height) / 2,
		
		left: (width_diff - even_width) / 2,
		right: (width_diff + even_width) / 2,
		
		background: { r, g, b, alpha }
	})
})
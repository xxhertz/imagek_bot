const {getImageData, getPixel} = require("../helpers.js")
const createCommand = require("../createCommand")

module.exports = createCommand("centertrim", "Centers and trims an image to have a symmetrical border", async image => {
	const image_data = await getImageData(image)
	const {width, height} = image_data.info
	
	const [r, g, b, alpha] = getPixel(image_data, 0, 0)

	const post_trim = image.trim()
	const trim_data = await getImageData(post_trim)

	const width_diff = width - trim_data.info.width
	const height_diff = height - trim_data.info.height
	
	const larger_number = width_diff >= height_diff ? width_diff : height_diff

	const even_check = larger_number % 2

	return post_trim.extend({
		top: (larger_number - even_check) / 2,
		bottom: (larger_number + even_check) / 2,
		
		left: (larger_number - even_check) / 2,
		right: (larger_number + even_check) / 2,
		
		background: { r, g, b, alpha }
	})
})

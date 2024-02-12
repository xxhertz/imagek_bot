const {getImageData, getPixel} = require("../helpers.js")
const createCommand = require("../createCommand")

module.exports = createCommand("centertrimaspect", "Centers and trims an image to have a symmetrical border based on the image's aspect ratio", async image => {
	const image_data = await getImageData(image)
	const {width, height} = image_data.info
	const aspect_ratio = width / height

	const [r, g, b, alpha] = getPixel(image_data, 0, 0)

	const post_trim = image.trim()
	const trim_data = await getImageData(post_trim)

	const width_diff = width - trim_data.info.width
	const height_diff = height - trim_data.info.height
	
	const height_number = width_diff >= height_diff ? width_diff : height_diff
	const width_number = Math.ceil(height_number * aspect_ratio)

	const even_check = height_number % 2
	const even_check_2 = width_number % 2

	return post_trim.extend({
		top: (height_number - even_check) / 2,
		bottom: (height_number + even_check) / 2,
		
		left: (width_number - even_check_2) / 2,
		right: (width_number + even_check_2) / 2,
		
		background: { r, g, b, alpha }
	})
})
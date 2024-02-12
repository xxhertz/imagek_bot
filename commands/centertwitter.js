const {getImageData, getPixel} = require("../helpers.js")
const createCommand = require("../createCommand")

const TWITTER_MIN = 3/4
const TWITTER_MAX = 5/1

module.exports = createCommand("centertwitter", "Centers and trims an image and then expands the border to fit into a twitter preview", async image => {
	const image_data = await getImageData(image)
	const {width, height} = image_data.info

	const [r, g, b, alpha] = getPixel(image_data, 0, 0)

	const post_trim = image.trim()
	const trim_data = await getImageData(post_trim)

	const trimmed_aspect = trim_data.info.width / trim_data.info.height

	let width_compensation = 1
	let height_compensation = 1
	if (trimmed_aspect > TWITTER_MAX) {
		// if width is 1000 and height is 100, width will get truncated to be 5:1 in the preview, and 1000/100 is 10:1
		// so "height compensation" is 2, which is the amount of height we need to multiply on the final image's height in order to get that 5:1 aspect ratio
		width_compensation = 1
		height_compensation = trimmed_aspect / TWITTER_MAX 
	} else if (trimmed_aspect < TWITTER_MIN) {
		// if the width is 584 and the height is 817, the height will get truncated to be 3:4 in the preview, and 584 / 817 is .716 (it has to be .75)
		// so "width compensation" would be 1.0475, being that the width needs to be ~5% larger to compensate
		width_compensation = TWITTER_MIN / trimmed_aspect
		height_compensation = 1
	}

	const width_diff = Math.ceil(width * width_compensation) - trim_data.info.width
	const height_diff = Math.ceil(height * height_compensation) - trim_data.info.height
	
	const even_check = height_diff % 2
	const even_check_2 = width_diff % 2

	return await post_trim.extend({
		top: (height_diff - even_check) / 2,
		bottom: (height_diff + even_check) / 2,
		
		left: (width_diff - even_check_2) / 2,
		right: (width_diff + even_check_2) / 2,
		
		background: { r, g, b, alpha }
	})
})

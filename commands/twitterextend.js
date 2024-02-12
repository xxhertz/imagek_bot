const {getImageData, genChoice} = require("../helpers.js")
const createCommand = require("../createCommand.js")

const TWITTER_MIN = 3/4
const TWITTER_MAX = 5/1

module.exports = createCommand("twitterextend", "Expands the border of an image to fit into a twitter preview", async (image, interaction) => {
	const image_data = await getImageData(image)
	const {width, height} = image_data.info
	const aspect_ratio = width / height

	let width_compensation = 1
	let height_compensation = 1
	if (aspect_ratio > TWITTER_MAX) {
		// if width is 1000 and height is 100, width will get truncated to be 5:1 in the preview, and 1000/100 is 10:1
		// so "height compensation" is 2, which is the amount of height we need to multiply on the final image's height in order to get that 5:1 aspect ratio
		width_compensation = 1
		height_compensation = aspect_ratio / TWITTER_MAX 
	} else if (aspect_ratio < TWITTER_MIN) {
		// if the width is 584 and the height is 817, the height will get truncated to be 3:4 in the preview, and 584 / 817 is .716 (it has to be .75)
		// so "width compensation" would be 1.0475, being that the width needs to be ~5% larger to compensate
		width_compensation = TWITTER_MIN / aspect_ratio
		height_compensation = 1
	} else {
		return interaction.editReply("This image doesn't need to be extended")
	}

	const compensated_width = (Math.ceil(width * width_compensation) - width) / 2
	const compensated_height = (Math.ceil(height * height_compensation) - height) / 2
	
	const even_check = compensated_height % 2
	const even_check_2 = compensated_width % 2

	return image.extend({
		top: compensated_height - even_check,
		bottom: compensated_height + even_check,
		
		left: compensated_width - even_check_2,
		right: compensated_width + even_check_2,
		
		extendWith: interaction.options.getString("filltype") ?? "background"
	})
}, builder => builder
	.addStringOption(input => input
		.setName("filltype")
		.setDescription("Changes the way the background is filled")
		.setRequired(false)
		.setChoices(
			genChoice("background"),
			genChoice("copy"),
			genChoice("mirror"),
			genChoice("repeat"))
	)
)


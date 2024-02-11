const token = require("./token.json").token
const clientId = CLIENTID
const guildId = GUILDID
const request = require("request")
const sharp = require("sharp")


/**
 * Promisified version of request.get
 * @param {String} url 
 * @returns {Promise<Buffer>} Response
 */
const download = async url => {
	return new Promise((resolve, reject) => {
		request({url, encoding: null}, (error, response, body) => {
			if (error)
				return reject(error)

			return resolve(body)
		})
	})
}

/**
 * Shorthandedly returns an image as a raw buffer, with 
 * @param {sharp.Sharp} image 
 * @returns {Promise<{ data: Buffer; info: OutputInfo }>}
 */
const getImageData = async image => await image.raw().toBuffer({resolveWithObject: true})

/**
 * Gets the color of a pixel from a buffer
 * @param {{ data: Buffer; info: sharp.OutputInfo }} image_buffer 
 * @param {Number} x 
 * @param {Number} y 
 * @returns {sharp.RGBA}
 */
const getPixel = (image_buffer, x, y) => {
	const {width, channels} = image_buffer.info
	const x_offset = y * width * channels 
	const start_position = x * channels + x_offset
	return image_buffer.data.subarray(start_position, start_position + channels)
}

// require the necessary discord.js classes (mostly boilerplate)
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, REST, Collection, Routes, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js')

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] })
client.commands = new Collection()

const command_list = []

// some JSDoc stuff i wrote for autocomplete and intellisense (extremely handy if you dont want to open documentation every 3 seconds if you're not familiar with sharp)
/**
 * @typedef {object} ResolverInOptions
 * @property {CommandInteractionOptionResolver} options
 * no idea why this isn't built in?
 * @typedef {CommandInteraction & ResolverInOptions} CommandInteractionWithOptionResolver
 */

/**
 * @callback ImageManipulator
 * @param {sharp.Sharp} image
 * @param {CommandInteractionWithOptionResolver} interaction
 */

/**
 * @callback DataManipulator
 * @param {SlashCommandBuilder} command_builder
 */

/**
 * This is the main function which is used. To prevent extremely repetitive code, this function runs all of the boilerplate code, and then passes a Sharp object to the function `fn`, and then replies to the interaction with the result.
 * @param {String} name The name of the command which users will type
 * @param {String} description The description of the command which users will see
 * @param {ImageManipulator} fn The image manipulation function
 * @param {DataManipulator} data_manipulator An optional function which allows you to modify the SlashCommandBuilder, to potentially add more arguments for example.
 */
const createCommand = (name, description, fn, data_manipulator) => {
	const command = {}

	// boilerplate command data
	command.data = new SlashCommandBuilder()
		.setName(name)
		.setDescription(description)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addAttachmentOption(option => option
			.setName("image")
			.setDescription("The image to manipulate")
			.setRequired(true)
		)

	// this allows the `createCommand` function to mutate the command data, an example
	// would be for the sake of adding more arguments (which can be seen in the unfinished caption command)
	if (data_manipulator)
		data_manipulator(command.data)
	
	/**
	 * @param {CommandInteractionWithOptionResolver} interaction 
	 */
	command.execute = async interaction => {
		// tell the user 
		await interaction.reply(`Working on ${name}-ing your image`)

		// get image data
		const image = interaction.options.getAttachment("image")
		
		// download image to memory
		const filedata = await download(image.proxyURL)
		
		// turn the image into a sharp object and pass it to our command function for manipulation
		const result = await fn(sharp(filedata), interaction)

		// turn our result from the function into a buffer, then turn that buffer into an attachment which we can send back to the user on discord
		const attachment = new AttachmentBuilder(await result.png().toBuffer())

		// reply to the interaction with the information and the image
		await interaction.editReply({embeds: [
			new EmbedBuilder()
				.setColor(0xc7a8ff)
				.addFields(
					{ name: 'Created by', value: interaction.user.username },
					{ name: 'Time took', value: `${Math.abs(Date.now() - interaction.createdTimestamp) / 1000}s` }
				)
				.setImage(`attachment://image.png`)
				.setTimestamp()
		], files: [attachment]})
		
	}
	command_list.push(command)
}

createCommand("center", "Centers an image", async image => {
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

createCommand("centertrim", "Centers and trims an image to have a symmetrical border", async image => {
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

createCommand("centertrimaspect", "Centers and trims an image to have a symmetrical border based on the image's aspect ratio", async image => {
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


const TWITTER_MIN = 3/4
const TWITTER_MAX = 5/1
createCommand("centertwitter", "Centers and trims an image and then expands the border to fit into a twitter preview", async image => {
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

createCommand("greyscale", "Removes the color from an image", async image => image.greyscale())

// not great, but showcases the full potential of createCommand
createCommand("caption", "Captions an image", async (image, interaction) => {
	const image_data = await getImageData(image)
	const {width, height} = image_data.info
	const caption = interaction.options.getString("caption")
	const font_size = interaction.options.getNumber("font_size") ?? 40

	return image.extend({
		top: font_size + 40,
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

const command_json = []

for (const command of command_list) {
	client.commands.set(command.data.name, command)
	command_json.push(command.data.toJSON())
}
// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${command_json.length} application (/) commands.`)
		const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: command_json })
		console.log(`Successfully reloaded ${data.length} application (/) commands.`)
	} catch (error) {
		console.error(error)
	}
})()


client.once(Events.ClientReady, c =>
	console.log(`Ready! Logged in as ${c.user.tag}`)
)

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return

	const command = interaction.client.commands.get(interaction.commandName)

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`)
		return
	}

	try {
		await command.execute(interaction)
	} catch (error) {
		console.error(error)
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
		}
	}
})


client.login(token)

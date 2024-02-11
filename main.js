const token = require("./token.json").token
const clientId = CLIENTID
const guildId = GUILDID
const request = require("request")
const sharp = require("sharp")


const download = async url => {
	return new Promise((resolve, reject) => {
		request({url, encoding: null}, (error, response, body) => {
			if (error)
				return reject(error)

			return resolve(body)
		})
	})
}

const getImageData = async image => await image.raw().toBuffer({resolveWithObject: true})

const getPixel = (image_buffer, x, y) => {
	const {width, channels} = image_buffer.info
	const x_offset = y * width * channels 
	const start_position = x * channels + x_offset
	return image_buffer.data.subarray(start_position, start_position + channels)
}

// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, REST, Collection, Routes, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js')


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] })
client.commands = new Collection()

const command_list = []
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

})

createCommand("greyscale", "Removes the color from an image", async image => image.greyscale())

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

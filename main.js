const token = require("./token.json").token
const clientId = CLIENTID
const guildId = GUILDID
const request = require("request")
const sharp = require("sharp")

const generateString = (length = 16) => {
    let result = ''
    const characters = 'abcdef0123456789'
    const charactersLength = characters.length
	for (let i = 0; i < length; i++)
		result += characters.charAt(Math.floor(Math.random() * charactersLength))
    return result
}

const download = async (url, filename) => {
	return new Promise((resolve, reject) => {
		request.get(url)
			.on('error', reject)
			.on('response', res => {
				res.pipe(fs.createWriteStream(`./jobs/${filename}`))
					.on('finish', resolve)
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
const createCommand = (name, description, fn) => {
	command_list.push({
		data: new SlashCommandBuilder()
			.setName(name)
			.setDescription(description)
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
			.addAttachmentOption(option => option
				.setName("image")
				.setDescription("The image to manipulate")
				.setRequired(true)
			),
		async execute(interaction) {
			// create a filename
			const jobid = generateString(32)
			await interaction.reply(`Working on ${name}-ing your image, job: ${jobid}`)
			// get image data
			const image = interaction.options.getAttachment("image")
			
			// download image to file
			await download(image.proxyURL, `${jobid}-input.png`)
		
			// do the image manipulation here and write to output file
			await (await fn(await sharp(`./jobs/${jobid}-input.png`), jobid)).png().toFile(`./jobs/${jobid}.png`)

			// turn the file into an attachment so it can be sent in the embed
			const file = new AttachmentBuilder(`./jobs/${jobid}.png`)

			// reply to the interaction with the information and the image
			await interaction.editReply({embeds: [
				new EmbedBuilder()
					.setColor(0xc7a8ff)
					.addFields(
						{ name: 'Job ID:', value: jobid },
						{ name: 'Created by', value: interaction.user.username },
					)
					.setImage(`attachment://${jobid}.png`)
					.setTimestamp()
			], files: [file]})
			
			// cleanup files
			fs.unlinkSync(`./jobs/${jobid}.png`)
			fs.unlinkSync(`./jobs/${jobid}-input.png`)
		}
	})
}

createCommand("center", "Centers an image", async (image, jobid) => {
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

createCommand("greyscale", "Removes the color from an image", async (image, jobid) => {
	return await image.greyscale()
})

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

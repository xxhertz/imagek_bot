const token = require("./token.json").token
const clientId = "1176025391262085201"
const guildId = "1069559738427256842"
const fs = require("fs")
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
	return image_buffer.data.slice(start_position, start_position + channels)
}

// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, REST, Collection, Routes, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js')


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.commands = new Collection();
const command_list = [
	{
		data: new SlashCommandBuilder()
			.setName('center')
			.setDescription('Centers an image')
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
			.addAttachmentOption(option => option
				.setName("image")
				.setDescription("The image to center")
				.setRequired(true)
			),
		async execute(interaction) {
			const image = interaction.options.getAttachment("image")
			
			const genned_key = generateString(32)
		
			await interaction.reply({embeds: [
				new EmbedBuilder()
					.setColor(0xB24AF7)
					.addFields(
						{ name: 'Key', value: genned_key },
						{ name: 'Duration', value: `${duration} days` },
						{ name: 'Created by', value: interaction.user.username },
					)
					.setTimestamp()
			]})
		}
	}
]

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

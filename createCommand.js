const sharp = require("sharp")
const {download} = require("./helpers")

// require the necessary discord.js classes
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js')

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
		// .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
		// if you wish to remove this, make sure to replace it with a `deferReply`, because if you don't, the app will crash
		// this is because discord gets mad if you don't reply within a certain timespan, and deferReply basically acknowledges a request from a user, giving you more time
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
	return command
}

module.exports = createCommand
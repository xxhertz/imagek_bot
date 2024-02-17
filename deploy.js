// 99% of this file is discord boilerplate
require("dotenv").config()
const {token, clientId} = process.env
const { Client, Events, GatewayIntentBits, REST, Collection, Routes, SlashCommandBuilder, Interaction } = require('discord.js')
const rest = new REST().setToken(token);

/**
 * @typedef command
 * @type {{data:SlashCommandBuilder, execute:function(Interaction)}} 
 *
 * @typedef {Client & {commands: Collection<string, command>}} ClientWithCommands
 * 
 * @typedef {Interaction & {client: ClientWithCommands}} InteractionWithClient
 *
 * @param {command[]} command_list 
 */

module.exports = command_list => {
	// Create a new client instance
	/** @type {ClientWithCommands} */
	const client = new Client({ intents: [GatewayIntentBits.Guilds] })
	client.commands = new Collection()

	const command_json = []
	for (const command of command_list) {
		client.commands.set(command.data.name, command)
		command_json.push(command.data.toJSON())
	}

	console.log(`Started refreshing ${command_json.length} application (/) commands.`)
	rest.put(Routes.applicationCommands(clientId), { body: command_json }).then(data => {
		console.log(`Successfully reloaded ${data.length} application (/) commands.`)
	})

	client.once(Events.ClientReady, c => console.log(`Ready! Logged in as ${c.user.tag}`))

	client.on(Events.InteractionCreate, _interaction => {
		/** type-wrapped interaction for intellisense @type {InteractionWithClient} interaction */
		const interaction = _interaction

		if (!interaction.isChatInputCommand()) return

		const command = interaction.client.commands.get(interaction.commandName)

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`)
			return
		}

		command.execute(interaction).catch(error => {
			console.error(error)
			if (interaction.replied || interaction.deferred)
				return interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })

			return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
		})
	})


	client.login(token)
}
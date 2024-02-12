// 99% of this file is discord boilerplate
const {token, clientId} = require("./token.json")
const { Client, Events, GatewayIntentBits, REST, Collection, Routes } = require('discord.js')
const rest = new REST().setToken(token);

module.exports = command_list => {
	// Create a new client instance
	const client = new Client({ intents: [GatewayIntentBits.Guilds] })
	client.commands = new Collection()

	const command_json = []
	for (const command of command_list) {
		client.commands.set(command.data.name, command)
		command_json.push(command.data.toJSON())
	}

	// and deploy your commands!
	(async () => {
		try {
			console.log(`Started refreshing ${command_json.length} application (/) commands.`)
			const data = await rest.put(Routes.applicationCommands(clientId), { body: command_json })
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
}
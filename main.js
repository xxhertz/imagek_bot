const fs = require("node:fs")
const deploy = require("./deploy")

const loadCommandByName = command => {
	console.log(`Loading ${command}.`)
	return require(`./commands/${command}`)
}

deploy(fs.readdirSync("./commands").map(loadCommandByName))
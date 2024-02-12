const request = require("request")
const {APIApplicationCommandOptionChoice} = require("discord.js")
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

/**
 * Turns a string into a choice object for `ApplicationCommandOption.addChoices`
 * @param {String} str 
 * @returns {APIApplicationCommandOptionChoice<string>}
 */
const genChoice = str => ({name: str, value: str})

module.exports = {download, getImageData, getPixel, genChoice}
const Command = require("..").Command;

module.exports = new Command({
	name: "emojis",
	alias: ["表情"],
	desc: "显示所有表情",
	fn: (cbody, msg, app) => {
		console.log(app.client.emojis);
		let emojis = app.client.emojis.keyArray();
		if (msg.guild) {
			emojis = emojis.concat(msg.guild.emojis.keyArray());
		}
		msg.reply(emojis.join(", "));
		return true;
	},
});
const Command = require("../command.js");

module.exports = new Command({
	name: "alive",
	alias: ["活着"],
	desc: "存活确认",
	fn: (cbody, msg, app) => {
		msg.reply("在哦");
		return true;
	},
});

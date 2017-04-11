const Command = require("../command.js");

module.exports = new Command({
	name: "alia",
	alias: ["称呼"],
	desc: "设置自己的称呼 每个频道一个",
	fn: (cbody, msg, app) => {
		if (cbody) {
			app.alias.setAlia(msg.author, msg.guild, cbody);
			msg.channel.send(`这样啊，${cbody}~`);
		} else {
			msg.reply(`你是叫${msg.sender}哦`);
		}
		return true;
	},
});
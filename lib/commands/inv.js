const Command = require("../command.js");

module.exports = new Command({
	name: "invite",
	alias: ["inv","邀请"],
	desc: "邀请到别的服务器",
	fn: (cbody, msg, app) => {
		msg.reply("点击以下网址邀请(需要该服务器邀请权限): \nhttps://discordapp.com/api/oauth2/authorize?client_id=${app.clientId}&scope=bot");
		return true;
	},
});
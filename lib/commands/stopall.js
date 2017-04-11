const Command = require("../command.js");

module.exports = new Command({
	name: "stopall",
	alias: ["clearlist","清空"],
	desc: "停止播放列表",
	fn: (cbody, msg, app) => {
		msg.reply("还没做出来");
		return true;
	},
});
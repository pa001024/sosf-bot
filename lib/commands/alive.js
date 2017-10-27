const Command = require("../command.js");

module.exports = new Command({
	name: "alive",
	alias: ["keep","心跳"],
	desc: "[SECRET] 保持心跳在线",
	perm: Command.PermLevel.SECRET,
	fn: (cbody, msg, app) => {
		msg.sender
		return true;
	},
});

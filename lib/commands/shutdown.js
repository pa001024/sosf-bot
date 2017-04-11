const Command = require("../command.js");

module.exports = new Command({
	name: "shutdown",
	alias: ["关闭", "close", "logout", "reset"],
	desc: "[CAUTION] 关闭机器人",
	perm: Command.PermLevel.CAUTION,
	fn: (cbody, msg, app) => {
		msg.channel.send("即将退出...").then(m => m.delete(2e3));
		app.logout();
		return true;
	},
});
const Command = require("..").Command;

module.exports = new Command({
	name: "shutdown",
	alias: ["关闭", "restart", "exit", "reset"],
	desc: "[CAUTION] 关闭机器人",
	perm: Command.PermLevel.CAUTION,
	fn: (cbody, msg, app) => {
		msg.channel.send("即将退出...").then(m => m.delete(2e3));
		msg.delete(2e3);
		app.logout();
		return true;
	},
});
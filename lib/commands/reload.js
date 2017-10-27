const Command = require("../command.js");

module.exports = new Command({
	name: "reload",
	alias: ["relo"],
	desc: "[CAUTION] 热加载指令",
	perm: Command.PermLevel.CAUTION,
	fn: (cbody, msg, app) => {
		app.reloadCommand();
		return true;
	},
});

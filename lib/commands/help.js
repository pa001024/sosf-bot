const Command = require("../command.js");

module.exports = new Command({
	name: "help",
	alias: ["指令列表", "ls", "?", "list"],
	desc: "显示指令列表",
	fn: (cbody, msg, app) => {
		let rst = "当前指令:\n```";
		for (var i in app.commands) {
			if (i == app.commands[i].name)
				rst += `${i}:${" ".repeat(i.length > 12 ? 0 : 12 - i.length)} ${app.commands[i].desc} (aka. ${app.commands[i].alias.join("/")})\n`;
		}
		rst += "```(本消息将在40秒后自动删除)";
		msg.channel.send(rst).then(m => m.delete(4e4));
		return true;
	},
});
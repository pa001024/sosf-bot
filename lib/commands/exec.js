const Command = require("../command.js");

module.exports = new Command({
	name: "exec",
	alias: ["e","eval"],
	desc: "[DANGER] js exec",
	perm: Command.PermLevel.DANGER,
	fn: (cbody, msg, app) => {
		if (cbody) {
			try {
				msg.channel.send(eval(cbody));
			}
			catch(e) {
				msg.channel.send(e);
			}
		}
		return true;
	},
});
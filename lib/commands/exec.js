const Command = require("../command.js");

module.exports = new Command({
	name: "exec",
	alias: ["e","eval"],
	desc: "[DANGER] js exec",
	perm: Command.PermLevel.DANGER,
	fn: (cbody, msg, app) => {
		if (cbody) {
			try {
				let ebody = eval(cbody);
				msg.channel.send(typeof ebody == "string" ? ebody : JSON.stringify(ebody))
					.then(m => m.delete(1e4));
			}
			catch(e) {
				msg.channel.send(typeof  e == "string" ? e : JSON.stringify(e))
					.then(m => m.delete(1e4));
			}
		}
		return true;
	},
});

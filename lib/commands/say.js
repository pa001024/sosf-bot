const Command = require("..").Command;

module.exports = new Command({
	name: "say",
	alias: ["w","说"],
	desc: "[SECRET] 说一句话",
	perm: Command.PermLevel.SECRET,
	fn: (cbody, msg, app) => {
		if (cbody) {
			msg.channel.send(cbody);
		}
		return true;
	},
});
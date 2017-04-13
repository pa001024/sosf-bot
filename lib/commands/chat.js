const Command = require("../command.js");

module.exports = new Command({
	name: "chat",
	alias: ["回复率"],
	desc: "设置AI自动回复概率 (0~1)",
	fn: (cbody, msg, app) => {
		let m, ai = app.actors.get("ai");
		if (!isNaN(+cbody)) {
			ai.replyRate = +cbody;
		} else if (cbody == "off") {
			ai.replyRate = 0;
		} else {
			msg.channel.send(`当前回复率为: ${ai.replyRate}`)
				.then(m => m.delete(1e4));
		}
		return true;
	},
});
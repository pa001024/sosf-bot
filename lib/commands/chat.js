const Command = require("..").Command;

module.exports = new Command({
	name: "chat",
	alias: ["回复率"],
	desc: "设置AI自动回复概率 (0~1)",
	fn: (cbody, msg, app) => {
		if (!isNaN(+cbody)) {
			app.config.replyRate = +cbody;
		} else if (cbody == "off") {
			app.config.replyRate = 0;
		} else {
			msg.channel.send(`当前回复率为: ${app.config.replyRate}`)
				.then(m => m.delete(1e4));
		}
		return true;
	},
});
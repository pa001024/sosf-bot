const Command = require("..").Command;

module.exports = new Command({
	name: "voice",
	alias: ["语音", "v"],
	desc: "开启或者关闭 (on/off) 语音服务",
	fn: (cbody, msg, app) => {
		let vc = app.actors.get("voice");
		if (cbody == "off") {
			vc.leave();
		} else if (cbody.match(/^\d(?:\.\d+)?$/)) {
			vc.setVol(+cbody);
		} else if (msg.member && msg.member.voiceChannel) {
			vc.join(msg.member.voiceChannel)
				.then(() => vc.playChannel = msg.channel);

			return true;
		}
		return false;
	},
});
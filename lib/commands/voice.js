const Command = require("../command.js");

module.exports = new Command({
	name: "voice",
	alias: ["语音","v"],
	desc: "开启或者关闭 (on/off) 语音服务",
	fn: (cbody, msg, app) => {
		if (cbody == "off") {
			app.actors.get("voice").leave();
		} else if (msg.member && msg.member.voiceChannel) {
			app.actors.get("voice").join(msg.member.voiceChannel);
			return true;
		}
		return false;
	},
});
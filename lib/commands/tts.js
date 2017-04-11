const Command = require("../command.js");

module.exports = new Command({
	name: "tts",
	alias: ["朗读"],
	desc: "朗读指定文字 或 开启或者关闭TTS服务(tts on/off)",
	fn: (cbody, msg, app) => {
		if (cbody == "on") {
			app.actors.get("voice").enable = true;
		} else if (cbody == "off") {
			app.actors.get("voice").enable = false;
		} else if(cbody == "") {
			msg.reply(`现在TTS服务处于${app.actors.get("voice").enable?"启用":"停用"}中`);
		} else {
			app.actors.get("voice").playTTS(cbody);
		}
		
		return false;
	},
});
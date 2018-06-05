const Command = require("..").Command;

module.exports = new Command({
	name: "tts",
	alias: ["读"],
	desc: "朗读指定文字 或 开启或者关闭TTS服务(tts on/off)",
	fn: (cbody, msg, app) => {
		let vc = app.actors.get("voice");
		if (cbody == "on") {
			vc.enableTTS = true;
		} else if (cbody == "off") {
			vc.enableTTS = false;
		} else if (cbody == "") {
			msg.reply(`现在TTS服务处于${vc.enableTTS ? "启用" : "停用"}中`);
		} else if (cbody == "?") {
			msg.reply(`TTS相关设置指令列表: 发音人选择per 语速spd 音量vol 语调pit`);
		} else if (cbody.startsWith("per")) {
			if (cbody.substr(3) && ~~cbody.substr(3) >= 0 && ~~cbody.substr(3) < 4)
				vc.ttsManager.ttsPerson = ~~cbody.substr(3); // ，默认为普通女声
			msg.reply(`当前发音人为:${vc.ttsPerson} 0为女声，1为男声，3为情感女声，4为情感男声`);
		} else if (cbody.startsWith("spd")) {
			if (cbody.substr(3) && ~~cbody.substr(3) >= 1 && ~~cbody.substr(3) <= 9)
				vc.ttsManager.ttsSpeed = ~~cbody.substr(3); // 速度
			msg.reply(`现在速度为:${vc.ttsSpeed}`);
		} else if (cbody.startsWith("pit")) {
			if (cbody.substr(3) && ~~cbody.substr(3) >= 1 && ~~cbody.substr(3) <= 9)
				vc.ttsManager.ttsPitch = ~~cbody.substr(3); // 语调
			msg.reply(`现在语调为:${vc.ttsPitch}`);
		} else if (cbody.startsWith("vol")) {
			if (cbody.substr(3) && ~~cbody.substr(3) >= 1 && ~~cbody.substr(3) <= 9)
				vc.ttsManager.ttsVol = ~~cbody.substr(3); // 大小
			msg.reply(`现在音量为:${vc.ttsVol}`);
		} else {
			app.actors.get("voice").playTTS(cbody);
		}

		return true;
	},
});

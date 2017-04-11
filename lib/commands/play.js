const Command = require("../command.js");

module.exports = new Command({
	name: "play",
	alias: ["播放", "addmusic", "点歌"],
	desc: "开始播放列表/设置音量/将指定id的歌曲(网易云)加入到播放列表 逗号分隔",
	fn: (cbody, msg, app) => {
		let m;
		if (cbody.match(/^\d(?:\.\d+)?$/)) {
			app.actors.get("voice").setVol(cbody*1);
		} else if (m = cbody.match(/^http:\/\/music\.163\.com\/.+[?&]id=(\d{4,12})/)) {
			app.actors.get("voice").addMusic(m[1], msg);
		} else if (cbody.match(/^http.+/)) {
			app.actors.get("voice").playURL(cbody);
		} else if (cbody.match(/\d{4,12}(?:,\d{4,12})*/)) {
			app.actors.get("voice").addMusic(cbody, msg);
		} else {
			app.actors.get("voice").play();
		}
		return true;
	},
});
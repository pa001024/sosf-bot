const Command = require("../command.js");

module.exports = new Command({
	name: "play",
	alias: ["播放", "addmusic", "点歌"],
	desc: "开始播放列表/设置音量/开关歌词/将指定id的歌曲(网易云)加入到播放列表 逗号分隔",
	fn: (cbody, msg, app) => {
		let m, voc = app.actors.get("voice");
		if (m = cbody.match(/^lrc (on|off)$/)) {
			voc.enableLyric = m[1] == "on";
		} else if (cbody.match(/^\d(?:\.\d+)?$/)) {
			voc.setVol(+cbody);
		} else if (m = cbody.match(/^http:\/\/music\.163\.com\/.+[?&]id=(\d{4,12})/)) {
			voc.addMusic(m[1], msg);
		} else if (cbody.match(/^http.+/)) {
			voc.playURL(cbody);
		} else if (cbody.match(/\d{4,12}(?:,\d{4,12})*/)) {
			voc.addMusic(cbody, msg);
		} else if (cbody) {
			voc.addMusicByName(cbody, msg);
		} else {
			voc.play(msg);
		}
		return true;
	},
});
const Command = require("..").Command;

module.exports = new Command({
	name: "play",
	alias: ["播放", "addmusic", "点歌", "p"],
	desc: `play: 开始播放列表/设置音量

play lrc <on|off>: 开关歌词
play <id>|<url>播放指定id|url的音乐(网易云) 逗号分隔 支持列表url
play l[ist] 播放列表
play r[andom] 乱序排列播放列表`,
	fn: (cbody, msg, app) => {
		let m, voc = app.actors.get("voice");
		if (m = cbody.match(/^lrc (on|off)$/)) {
			voc.enableLyric = m[1] == "on";
		} else if (cbody.match(/^\d(?:\.\d+)?$/)) {
			voc.setVol(+cbody);
		} else if (cbody.match(/^r(?:and(?:om)?)?$/)) {
			voc.randomize();
		} else if (m = cbody.match(/^(?:l|playlist|list) (\d{4,12})/)) {
			voc.addMusicByPlaylist(m[1], msg);
		} else if (m = cbody.match(/^(?:http:\/\/music\.163\.com\/)?(?:#\/)?playlist.*[?&]id=(\d{4,12})/)) {
			voc.addMusicByPlaylist(m[1], msg);
		} else if (m = cbody.match(/^(?:http:\/\/music\.163\.com\/)?(?:#\/)?song.*[?&]id=(\d{4,12})/)) {
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

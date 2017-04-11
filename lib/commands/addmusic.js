const Command = require("../command.js");

module.exports = new Command({
	name: "addmusic",
	alias: ["点歌"],
	desc: "将指定id的歌曲(网易云)加入到播放列表 逗号分隔",
	fn: (cbody, msg, app) => {
		app.actors.get("voice").addMusic(cbody, msg);
		return true;
	},
});
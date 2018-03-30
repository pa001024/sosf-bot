const Command = require("..").Command;

module.exports = new Command({
	name: "stop",
	alias: ["停止"],
	desc: "停止播放列表",
	fn: (cbody, msg, app) => {
		app.actors.get("voice").stop();
		return true;
	},
});
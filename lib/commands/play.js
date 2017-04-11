const Command = require("../command.js");

module.exports = new Command({
	name: "play",
	alias: ["播放"],
	desc: "开始播放列表",
	fn: (cbody, msg, app) => {
		app.actors.get("voice").play();
		return true;
	},
});
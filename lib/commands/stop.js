const Command = require("..").Command;

module.exports = new Command({
	name: "stop",
	alias: ["停止"],
	desc: "停止播放列表",
	fn: (cbody, msg, app) => {
		let vc = app.actors.get("voice");
		if (cbody == "all") {
			vc.stopAll();
		} else {
			vc.stop();
		}
		return true;
	},
});

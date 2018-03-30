const Command = require("..").Command;

module.exports = new Command({
	name: "teach",
	alias: ["调教", "t"],
	desc: "调教语句 (正则) 以||分割 末尾使用del删除 set覆盖 dela测试删除",
	perm: Command.PermLevel.INFO,
	fn: (cbody, msg, app) => {
		let rx = app.actors.get("re").rx;
		let frx = cbody.split("||"), qrx = frx[0], fl = frx.length - 1;
		if (fl < 1) {
			msg.reply("命令语法不正确: \nteach 正则表达式||回复语句[||回复$1][||del]");
			return false;
		}
		frx = frx.slice(1);
		if (fl == 1 && frx[0] == "del") {
			return rx.delReact(qrx);
		} else if (fl == 1 && frx[0] == "dela") {
			return rx.calDelReact(qrx);
		} else if (fl > 1) {
			if (frx[fl-1] == "del") {
				frx.pop(); --fl;
				rx.delReact(qrx, fl > 1 ? frx : frx[0]);
			} else if (frx[fl-1] == "set") {
				frx.pop(); --fl;
				rx.setReact(qrx, fl > 1 ? frx : frx[0])
			} else {
				rx.addReact(qrx, fl > 1 ? frx : frx[0]);
			}
		} else {
			let arx = fl > 1 ? frx : frx[0];
			rx.addReact(qrx, arx);
		}
		return true;
	},
});
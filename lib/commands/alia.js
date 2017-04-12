const Command = require("../command.js");

module.exports = new Command({
	name: "alia",
	alias: ["称呼"],
	desc: "设置自己/[SECRET]别人的称呼 每个频道不同",
	fn: (cbody, msg, app) => {
		let m;
		if (m = cbody.match(/^(?:<@)?(\d+)>?+ +(.+)/)) {
			let id = m[1]*1, alia = m[2];
			app.client.fetchUser(id)
			.then(user => {
				app.alias.setAlia(user, msg.guild, alia);
				msg.channel.send(`${user}现在叫${alia}~`).then(m => m.delete(1e4));;
			});
		} else if (cbody) {
			app.alias.setAlia(msg.author, msg.guild, cbody);
			msg.channel.send(`这样啊，${cbody}~`).then(m => m.delete(1e4));;
		} else {
			msg.reply(`你是叫${msg.sender}哦`).then(m => m.delete(1e4));;
		}
		return true;
	},
});
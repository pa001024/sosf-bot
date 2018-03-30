import fs from 'fs';
const Command = require("..").Command;
//r=a=>~~(a*Math.random());d=(f,m,n)=>new Array(m).fill(0).map(_=>n).map(f);d(r,3,6).join(" ")
module.exports = new Command({
	name: "add",
	alias: ["添加"],
	desc: "添加指令",
	perm: Command.PermLevel.INFO,
	fn: (cbody, msg, app) => {
		let che = cbody.substr(0, cbody.indexOf(" ")), ccc = cbody.substr(cbody.indexOf(" ")+1);
		if (che) {
			if (fs.existsSync(`./lib/commands/${che}.js`)) {
				msg.channel.send(`指令已存在~`).then(m => m.delete(1e4));
			} else {
				fs.writeFile(`./lib/commands/${che}.js`, `const Command = require("..").Command;

module.exports = new Command({
	name: "${che}",
	alias: [],
	desc: "添加的指令",
	fn: (cbody, msg, app) => {
		${ccc};
		return true;
	},
});`);
				msg.channel.send(`已添加指令~`).then(m => m.delete(1e4));
				app.reloadCommand();
			}
		} else {
			msg.channel.send(`语法错误~`).then(m => m.delete(1e4));
		}
		return true;
	},
});

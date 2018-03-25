const Command = require("../command.js");

module.exports = new Command({
	name: "roll",
	alias: [],
	desc: "丢骰子 如6d6",
	fn: (cbody, msg, app) => {
		let d=(f,m,n)=>new Array(m).fill(0).map(_=>n).map(f),m=cbody.match(/(\d+)d(\d+)/),f=d(a=>~~(1+(a-1)*Math.random()),+m[1],+m[2]).join(" ");
		f.length>256 ? msg.channel.send(f) : msg.channel.sendEmbed({title:f,color:0xf300f3});
		return true;
	},
});

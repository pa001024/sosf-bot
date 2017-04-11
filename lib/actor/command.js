// 指令处理
export class CommandActor {
	constructor(props) {
		this.prefix = props.prefix;
		this.app = props.app;
		this.commands = this.app.commands;
	}

	act(msg) {
		if (msg.content.startsWith(this.prefix)) {
			let txt = msg.content.substr(this.prefix.length);
			let chead = txt.split(" ")[0];
			let cbody = txt.substr(chead.length+1);
			let cmd = this.commands[chead];
			if (cmd) {
				let ret = cmd.exec(cbody, msg, this.app);
				if(ret) {
					console.log(`[CMD] ${msg.author.username}#${msg.author.discriminator} Execute command ${cmd.name} ${cbody}`);
					msg.react("✅").catch(err => {});
				} else if(ret == "Permission Denied") {
					msg.react("⛔").catch(err => {});
				}
				return true;
			}
		}
		return false;
	}
}
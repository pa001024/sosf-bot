// 指令处理
export class CommandActor {
	constructor(props) {
		this.prefix = props.prefix;
		this.app = props.app;
	}

	act(msg) {
		if (msg.content.startsWith(this.prefix)) {
			let txt = msg.content.substr(this.prefix.length);
			let chead = txt.split(" ")[0];
			let cbody = txt.substr(chead.length+1);
			let cmd = this.app.commands[chead];
			if (cmd) {
				let ret = cmd.exec(cbody, msg, this.app);
				if(ret == "Permission Denied") {
					msg.react("⛔").catch(e => {});
				} else if(ret) {
					this.app.log.debug(`[CMD] ${msg.uid} Execute command ${cmd.name} ${cbody}`);
					msg.react("✅").catch(e => {});
				}
				msg.delete(1e4).catch(e => {});
				return true;
			}
		}
		return false;
	}
}

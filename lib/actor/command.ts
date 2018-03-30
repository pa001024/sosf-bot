import { App } from '..';

// 指令处理
export class CommandActor {
	prefix: string;
	app: App;
	constructor(prefix: string, app: App) {
		this.prefix = prefix;
		this.app = app;
	}

	act(msg) {
		if (msg.content.startsWith(this.prefix)) {
			let txt = msg.content.substr(this.prefix.length);
			let chead = txt.split(" ")[0];
			let cbody = txt.substr(chead.length + 1);
			let cmd = this.app.commands[chead];
			if (cmd) {
				let ret = cmd.exec(cbody, msg, this.app);
				if (ret == "Permission Denied") {
					msg.react("⛔").catch(e => { });
				} else if (ret) {
					this.app.log.debug(`[CMD] ${msg.author.tag} Execute command ${cmd.name} ${cbody}`);
					msg.react("✅").catch(e => { });
				}
				if (this.app.config.deleteOriginCommandDelay > 0) {
					msg.delete(this.app.config.deleteOriginCommandDelay).catch(e => { });
				}
				return true;
			}
		}
		return false;
	}
}

import * as fs from 'fs';
import * as path from 'path';
import * as Discord from 'discord.js';
import * as log4js from 'log4js';

import { IFilter, PreFilter } from "./filter";
import { Actor, ActorArray, CommandActor, VoiceActor, REChatActor, AIChatActor } from "./actor";
import { UserAliaManager, UserPermissionManager } from "./manager";

log4js.configure({
	appenders: { vl: { type: 'console' }, ml: { type: 'file', filename: 'bot.log' } },
	categories: { default: { appenders: ['vl'], level: 'debug' }, v: { appenders: ['ml'], level: 'info' } }
});

const cfg = require('../config.js');
const bot = new Discord.Client();

/** 指令 */
export class Command {
	static PermLevel = {
		EVERY: 0,
		INFO: 1,
		SECRET: 2,
		CAUTION: 3,
		DANGER: 4
	};
	name: string;
	desc: string;
	alias: Array<string>;
	fn: Function;
	perm: number;
	constructor(props: any) {
		this.name = props.name;
		this.desc = props.desc;
		this.alias = props.alias;
		this.fn = props.fn;
		this.perm = props.perm || Command.PermLevel.EVERY;
	}

	exec(cbody: string, msg: Discord.Message, app: App) {
		if (app.perm.getPermission(msg.author) >= this.perm) {
			return this.fn && this.fn(cbody, msg, app) || false;
		} else {
			return "Permission Denied";
		}
	}
}

export class App {
	log: log4js.Logger;
	config: any;
	client: Discord.Client;
	commands: Map<string, Actor>;
	actors: ActorArray;
	filters: Array<IFilter>;
	alias: UserAliaManager;
	perm: UserPermissionManager;
	constructor(props: any) {
		this.config = props.config;
		this.client = props.client;
		this.commands = new Map<string, Actor>();
		this.actors = new ActorArray();
		this.log = log4js.getLogger("app");
		this.filters = [new PreFilter(props.prefix.main, this)];
		this.alias = new UserAliaManager(path.resolve(props.aliasFile));
		this.perm = new UserPermissionManager(path.resolve(props.permFile));
		this.actors.add("cmd", new CommandActor(props.prefix.cmd, this));
		this.actors.add("re", new REChatActor(props.prefix.chat, this, path.resolve(props.rxFile)));
		this.actors.add("voice", new VoiceActor(props.prefix.tts, this));
		this.actors.add("ai", new AIChatActor(props.prefix.chat, this, this.config.chat_api));
	}
	online() {
		if (this.config.activityName && this.config.activityName != "") {
			this.log.info("[App] Set Activity: " + this.config.activityName);
			bot.user.setActivity(this.config.activityName, { type: this.config.activityType || "PLAYING" });
		}
	}
	recive(msg: Discord.Message) {
		if (this.filters.every(a => a.checkMessage(msg))) {
			this.actors.array().some(a => this.actors.get(a).act(msg));
		}
	}
	addCommand(cmd: Command) {
		this.commands[cmd.name] = cmd;
		cmd.alias && cmd.alias.forEach(v => this.commands[v] = cmd);
	}
	reloadCommand() {
		Object.keys(this.commands).forEach(v => delete this.commands[v]);
		fs.readdirSync('./lib/commands/').forEach(file => {
			let mopath = "./commands/" + file;
			delete require.cache[require.resolve(mopath)];
			app.addCommand(require(mopath));
			app.log.debug(`[CMD] Loaded cmd ${file}`);
		});
	}
	logout() {
		app.actors.get("voice").stop();
		setTimeout(() => {
			this.log.info("[App] Bot shutdown");
			bot.destroy();
			process.exit(0);
		}, 5e3);
	}
}

let app = new App({
	name: cfg.name,
	config: cfg,
	client: bot,
	prefix: cfg.prefix,
	replyRate: cfg.replyRate,
	permFile: "config/permission.json",
	aliasFile: "config/alias.json",
	rxFile: "config/chat.json",
});

app.reloadCommand();

bot.on('ready', () => app.online());
bot.on('message', msg => app.recive(msg));
bot.login(cfg.token).then(() => {
	app.log.info('[App] Bot start');
});

bot.on('disconnect', () => {
	app.log.info("[App] Bot disconnect");
	setTimeout(() => {
		bot.destroy();
		process.exit(0);
	}, 3e3);
})

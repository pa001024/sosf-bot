import * as fs from 'fs';
import * as path from 'path';
import * as Discord from 'discord.js';
import * as log4js from 'log4js';

import { IFilter, PreFilter } from "./filter";
import { IActor, CommandActor, VoiceActor, REChatActor, AIChatActor } from "./actor";
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
	alias: string[];
	fn: (cbody: string, msg: Discord.Message, app: App) => boolean;
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

export interface Prefix {
	main: string;
	tts: string;
	cmd: string;
	chat: string[];
}

export interface AppConfig {
	name: string;
	clientId: string;
	token: string;
	activityType: Discord.ActivityType | number;
	activityName: string;
	prefix: Prefix;
	replyRate: number;
	deleteOriginCommandDelay: number;
	deleteReplyDelay: number;
	chat_api: string;
}

export class App {
	log: log4js.Logger;
	config: AppConfig;
	client: Discord.Client;
	commands: Map<string, Command>;
	actors: Map<string, IActor>;
	filters: IFilter[];
	alias: UserAliaManager;
	perm: UserPermissionManager;
	constructor(config: AppConfig, client: Discord.Client, permFile: string, aliasFile: string, rxFile: string) {
		this.config = config;
		this.client = client;
		this.commands = new Map();
		this.actors = new Map();
		this.log = log4js.getLogger("app");
		this.filters = [new PreFilter(config.prefix.main, this)];
		this.alias = new UserAliaManager(path.resolve(aliasFile));
		this.perm = new UserPermissionManager(path.resolve(permFile));
		this.actors.set("cmd", new CommandActor(config.prefix.cmd, this));
		this.actors.set("re", new REChatActor(config.prefix.chat, this, path.resolve(rxFile)));
		this.actors.set("voice", new VoiceActor(config.prefix.tts, this));
		this.actors.set("ai", new AIChatActor(config.prefix.chat, this, this.config.chat_api));
	}
	/**
	 * 查询信息的称呼
	 * @param msg 信息
	 */
	whois(msg: Discord.Message): string {
		return this.alias.getAlia(msg.member || msg.author, msg.guild)
	}

	online() {
		if (this.config.activityName && this.config.activityName != "") {
			this.log.info("[App] Set Activity: " + this.config.activityName);
			bot.user.setActivity(this.config.activityName, { type: this.config.activityType || "PLAYING" });
		}
	}
	reciveMessage(msg: Discord.Message) {
		if (this.filters.every(a => a.checkMessage(msg))) {
			let keys = this.actors.values(),
				actor: IteratorResult<IActor>,
				itor = () => {
					if (!(actor = keys.next()).done)
						actor.value.reciveMessage(msg).then(result => {
							if (!result) {
								itor();
							}
						});
				}
			itor();
		}
	}
	addCommand(cmd: Command) {
		this.commands.set(cmd.name, cmd)
		cmd.alias && cmd.alias.forEach(alia => this.commands.set(alia, cmd));
	}
	reloadCommand() {
		this.commands.clear();
		fs.readdirSync('./lib/commands/').forEach(file => {
			let mopath = "./commands/" + file;
			delete require.cache[require.resolve(mopath)];
			app.addCommand(require(mopath));
			app.log.debug(`[CMD] Loaded cmd ${file}`);
		});
	}
	logout() {
		(app.actors.get("voice") as VoiceActor).stop();
		setTimeout(() => {
			this.log.info("[App] Bot shutdown");
			bot.destroy();
			process.exit(0);
		}, 5e3);
	}
}

let app = new App(
	/*config:*/ cfg,
	/*client:*/ bot,
	/*permFile:*/ "config/permission.json",
	/*aliasFile:*/ "config/alias.json",
	/*rxFile:*/ "config/chat.json",
);

app.reloadCommand();

bot.on('ready', () => app.online());
bot.on('message', msg => app.reciveMessage(msg));
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

process.on('uncaughtException', (err) => {
	app.log.error(err as any);
});
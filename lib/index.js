'use strict';
import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import log4js from 'log4js';

import { PreFilter } from "./filter";
import { ActorArray, CommandActor, VoiceActor, REChatActor, AIChatActor } from "./actor";
import { UserAliaManager, UserPermissionManager } from "./manager";

log4js.configure({
	appenders: [
		{ type: 'console' },
		{ type: 'file', filename: 'bot.log' }
	]
});

const cfg = require('../config.js');
const bot = new Discord.Client();

class App {
	constructor(props) {
		this.config = props.config;
		this.client = props.client;
		this.commands = {};
		this.actors = new ActorArray();
		this.log = log4js.getLogger("app");
		this.prefilters = [new PreFilter({
			prefix: props.prefix.main,
			app: this
		})];
		this.alias = new UserAliaManager({
			file: path.resolve(props.aliasFile),
		});
		this.perm = new UserPermissionManager({
			file: path.resolve(props.permFile),
		});
		this.actors.add("cmd", new CommandActor({
			prefix: props.prefix.cmd,
			app: this,
		}));
		this.actors.add("re", new REChatActor({
			prefixs: props.prefix.chat,
			rx: path.resolve(props.rxFile),
			app: this
		}));
		this.actors.add("voice", new VoiceActor({
			prefix: props.prefix.tts,
			app: this
		}));
		this.actors.add("ai", new AIChatActor({
			prefixs: props.prefix.chat,
			api: cfg.chat_api,
			app: this
		}));
	}
	online() {
		if (this.config.activityName && this.config.activityName != "") {
			this.log.info("[App] Set Activity: " + this.config.activityName);
			bot.user.setActivity(this.config.activityName, {type: this.config.activityType || "PLAYING"});
		}
	}
	recive(msg) {
		if (this.prefilters.every(a => a.check(msg))) {
			this.actors.array().some(a => this.actors.get(a).act(msg));
		}
	}
	addCommand(cmd) {
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
		setTimeout(() => {
			this.log.info("[App] Bot shutdown");
			bot.destroy();
			process.exit(0);
		}, 5e3);
	}
}

var app = new App({
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
		bot.login(cfg.token).then(() => {
			app.log.info('[App] Bot restart');
		});
	}, 3e3);
})

// bot.setInterval(() => {
// 	if (condition) {

// 	}
// 	process.exit();
// }, 5e3)

'use strict';

import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import log4js from 'log4js';


import { PreFilter } from "./filter";
import { ActorArray, CommandActor, VoiceActor, KVChatActor, AIChatActor } from "./actor";
import { UserAliaManager, UserPermissionManager } from "./manager";

log4js.configure({
	appenders: [
		{ type: 'console' },
		{ type: 'file', filename: 'bot.log', category: 'cheese' }
	]
});
const cfg     = require('../config.js');
const bot     = new Discord.Client();

class App {
	commands = {};
	actors = new ActorArray();
	log = log4js.getLogger();

	constructor(props) {
		this.name = props.name || "未定义";
		this.client = props.client;
		this.prefilters = [new PreFilter({
			prefix: props.main_prefix,
			app: this
		})];
		this.alias = new UserAliaManager({
			file: path.resolve(props.aliasFile),
		});
		this.perm = new UserPermissionManager({
			file: path.resolve(props.permFile),
		});
		this.actors.add("cmd", new CommandActor({
			prefix: props.cmd_prefix,
			app: this
		}));
		this.actors.add("kvc", new KVChatActor({
			prefix: props.chat_prefix,
			kvjson: path.resolve(props.kvjson),
			app: this
		}));
		this.actors.add("voice", new VoiceActor({
			prefix: props.tts_prefix,
			app: this
		}));
		this.actors.add("ai", new AIChatActor({
			prefix: props.chat_prefix,
			app: this
		}));
	}
	online() {
		let gameName = "Shadow of Salted Fish";
		console.log("[App] Set game: " + gameName);
		bot.user.setGame(gameName);
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
	logout() {
		setTimeout(() => {
			console.log("[ADM] Bot shutdown");
			bot.destroy();
			process.exit(0);
		}, 5e3);
	}
}


var app = new App({
	name: cfg.name,
	client: bot,
	main_prefix: cfg.main_prefix,
	tts_prefix: cfg.tts_prefix,
	cmd_prefix: cfg.cmd_prefix,
	chat_prefix: cfg.chat_prefix,
	permFile: "config/permission.json",
	aliasFile: "config/alias.json",
	kvjson: "config/kv.json",
});

fs.readdirSync('./lib/commands/').forEach(file => {
	app.addCommand(require("./commands/" + file));
});

bot.on('ready', app.online);

bot.on('message', app.recive);

bot.login(cfg.token).then(() => {
  console.log('[App] Bot start');
});

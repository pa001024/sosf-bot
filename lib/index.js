'use strict';

import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';


import { PreFilter } from "./filter";
import { ActorArray, CommandActor, VoiceActor, KVChatActor, AIChatActor } from "./actor";
import { UserAliaManager, UserPermissionManager } from "./manager";

const cfg     = require('../config.js');
const pkg     = require('../package.json');
const bot     = new Discord.Client();

class App {
	constructor(props) {
		this.name = props.name || "未定义";
		this.client = props.client;
		this.prefilters = [new PreFilter({
			prefix: props.main_prefix,
			app: this
		})];
		this.commands = {};
		this.actors = new ActorArray();
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
		this.alias = new UserAliaManager({
			file: path.resolve(props.aliasFile),
		});
		this.perm = new UserPermissionManager({
			file: path.resolve(props.permFile),
		});
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
		}, 5e3);
	}
}


var app = new App({
	name: "小咸鱼",
	client: bot,
	main_prefix: "",
	tts_prefix: "",
	cmd_prefix: "--",
	chat_prefix: "",
	kvjson: "kv.json",
	permFile: "permission.json",
	aliasFile: "alias.json"
});

fs.readdirSync('./lib/commands/').forEach(file => {
	app.addCommand(require("./commands/" + file));
});

bot.on('ready', () => {
	app.online();
});

bot.on('message', msg => {
	app.recive(msg)
});

// bot.on('messageReactionAdd', (ract,user) => {
// 	console.log(ract.emoji);
// });

bot.login(cfg.token).then(() => {
  console.log('[App] Bot start');
});

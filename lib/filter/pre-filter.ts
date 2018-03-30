import { IFilter } from '.';
import { App } from '..';
import * as Discord from 'discord.js';

export class Filter implements IFilter {
    prefix: string;
    app: App;
    constructor(prefix: string, app: App) {
        this.prefix = prefix;
        this.app = app;
    }

    checkMessage(msg: Discord.Message): boolean {
        return false;
    }
}

/** 前级过滤 - 前缀 */
export class PreFilter extends Filter {
	constructor(prefix: string, app: App) { super(prefix, app); }
	checkMessage(msg: Discord.Message): boolean {
        if (msg.author.bot) return false;
        this.app.log.info(`${msg.author.tag}: ${msg.content}`);
		msg.content = msg.content.trim();
		return msg.content && msg.content.startsWith(this.prefix);
	}
}

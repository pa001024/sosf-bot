import * as Discord from 'discord.js';
export { CommandActor } from './command';
export { VoiceActor } from './voice';
import { App } from '..';
export * from './chat';

export class ActorArray {
	actors: Map<string, IActor>;
	actorslist: Array<IActor>;
	constructor() {
		this.actors = new Map<string, IActor>();
		this.actorslist = [];
	}

	add(name, actor) {
		this.actors.set(name, actor);
		this.actorslist.push(name);
	}

	array() {
		return this.actorslist;
	}

	get(name): any {
		return this.actors.get(name);
	}
}

export interface IActor {
	app: App;
	reciveMessage(msg: Discord.Message): boolean;
}
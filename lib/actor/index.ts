import * as Discord from 'discord.js';
export { CommandActor } from './command';
export { VoiceActor } from './voice';
export * from './chat';

export class ActorArray {
	actors: Map<string, Actor>;
	actorslist: Array<Actor>;
	constructor() {
		this.actors = new Map<string, Actor>();
		this.actorslist = [];
	}

	add(name, actor) {
		this.actors[name] = actor;
		this.actorslist.push(name);
	}

	array() {
		return this.actorslist;
	}

	get(name) {
		return this.actors[name];
	}
}

export interface Actor {
	act(msg: Discord.Message): boolean;
}
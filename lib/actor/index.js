export { CommandActor } from './command';
export { VoiceActor } from './voice';
export { KVChatActor, AIChatActor } from './chat';

export class ActorArray {
	constructor() {
		this.actors = {};
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

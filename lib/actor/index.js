import { CommandActor } from './command';
import { VoiceActor } from './voice';
import { KVChatActor, AIChatActor } from './chat';

class ActorArray {
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

export { ActorArray, CommandActor, VoiceActor, KVChatActor, AIChatActor };
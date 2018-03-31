import * as Discord from 'discord.js';
export { CommandActor } from './command';
export { VoiceActor } from './voice';
import { App } from '..';
export * from './chat';

export interface IActor {
	app: App;
	reciveMessage(msg: Discord.Message): Promise<boolean>;
}
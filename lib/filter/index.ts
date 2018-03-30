import * as Discord from 'discord.js';
import { App } from '..';
export { PreFilter } from './pre-filter';

export interface IFilter {
    checkMessage(msg: Discord.Message): boolean;
}

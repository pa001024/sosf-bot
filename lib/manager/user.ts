import * as fs from 'fs';
import * as Discord from 'discord.js';

export class UserAliaManager {
	file: string;
	alias: any;
	constructor(file: string) {
		this.file = file;
		this.alias = require(this.file);
	}
	setAlia(user: Discord.User | Discord.GuildMember, guild: Discord.Guild, alia: string) {
		this.alias[`${guild.id}|${user.id}`] = alia;
		this.save();
	}
	getAlia(user: Discord.User | Discord.GuildMember, guild: Discord.Guild, ): string {
		return this.alias[`${guild.id}|${user.id}`] || (user instanceof Discord.GuildMember && (user.displayName || user.user.username));
	}
	save() {
		fs.writeFileSync(this.file, JSON.stringify(this.alias), null);
	}
}

export class UserPermissionManager {
	file: string;
	perm: any;
	constructor(file: string) {
		this.file = file;
		this.perm = require(this.file);
	}
	setPermission(user: Discord.User, perm: number) {
		this.perm[user.id + ""] = perm;
		this.save();
	}
	getPermission(user): number {
		return this.perm[user.id + ""] || 0;
	}
	save() {
		fs.writeFileSync(this.file, JSON.stringify(this.perm), null);
	}
}
import fs from 'fs';

export class UserAliaManager {
	constructor(props) {
		this.file = props.file;
		this.alias = require(this.file);
	}
	setAlia(user, guild, alia) {
		this.alias[`${guild.id}|${user.id}`] = alia;
		this.save();
	}
	getAlia(user, guild) {
		return this.alias[`${guild.id}|${user.id}`] || user.displayName || user.username || user.user.username;
	}
	save() {
		fs.writeFileSync(this.file, JSON.stringify(this.alias), null);
	}
}

export class UserPermissionManager {
	constructor(props) {
		this.file = props.file;
		this.perm = require(this.file);
	}
	setPermission(user, perm) {
		this.perm[user.id+""] = perm;
		this.save();
	}
	getPermission(user) {
		return this.perm[user.id+""] || 0;
	}
	save() {
		fs.writeFileSync(this.file, JSON.stringify(this.perm), null);
	}
}
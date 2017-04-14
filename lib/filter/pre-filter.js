// 前级过滤 - 前缀
export class PreFilter {
	constructor(props) {
		this.prefix = props.prefix;
		this.app = props.app;
	}
	check(msg) {
		if (msg.author.bot) return false;
		msg.uid = `${msg.author.username}#${msg.author.discriminator}`;
		console.log(`${msg.uid}: ${msg.content}`);
		msg.sender = this.app.alias.getAlia(msg.member || msg.author, msg.guild || { id: null });
		msg.author.perm = this.app.perm.getPermission(msg.author);
		msg.content = msg.content.trim();
		return msg.content && msg.content.startsWith(this.prefix);
	}
}
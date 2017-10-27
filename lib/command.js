class Command {
	static PermLevel = {
		EVERY:   0,
		INFO:    1,
		SECRET:  2,
		CAUTION: 3,
		DANGER:  4
	};
	constructor(props) {
		this.name = props.name;
		this.desc = props.desc;
		this.alias = props.alias;
		this.fn = props.fn;
		this.perm = props.perm || Command.PermLevel.EVERY; // perm: Command.PermLevel.*
	}

	exec(cbody, msg, app) {
		if (msg.author.perm >= this.perm) {
			return this.fn && this.fn(cbody, msg, app) || false;
		} else {
			return "Permission Denied";
		}
	}
}

module.exports = Command;

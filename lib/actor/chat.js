// 聊天处理
export class KVChatActor {
	constructor(props) {
		this.prefix = props.prefix;
		this.kv = require(props.kvjson);
	}

	act(msg) {
		if (this.kv[msg.content]) {
			console.log(`[KV] Match ${msg.content} => ${this.kv[msg.content]}`);
			msg.channel.send(this.kv[msg.content]);
			return true;
		}
		return false;
	}

	add(k, v) {
		this.kv[k] = v;
	}
}

// TODO: NLP聊天处理
export class AIChatActor {
	constructor(props) {
		this.prefix = props.prefix;
	}

	act(msg) {
		return false;
	}
}
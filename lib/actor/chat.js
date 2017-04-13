import request from 'request';

// 聊天处理
export class KVChatActor {
	constructor(props) {
		this.prefix = props.prefix;
		this.kv = require(props.kvjson);
	}

	act(msg) {
		if (msg.content.startsWith(this.prefix)) {
			let txt = msg.content.substr(this.prefix.length);
			if (this.kv[txt]) {
				console.log(`[KV] Match ${txt} => ${this.kv[txt]}`);
				msg.channel.send(this.kv[txt]);
				return true;
			}
		}
		return false;
	}

	add(k, v) {
		this.kv[k] = v;
	}
}

// 聊天处理2
export class AIChatActor {
	constructor(props) {
		this.prefix = props.prefix;
		this.api = props.api;
		this.lastQuestion = {};
		this.lastAnwser = {};
		this.replyRate = 1;
	}

	apiCall(content) {
		let api = this.api.replace("<MSG>", encodeURI(content));
		return new Promise((resolve, reject) => {
			request(api, (e, r, body) => {
				if (e) return reject(e);
				resolve(body);
			});
		});
	}

	async act(msg) {
		if (msg.content.startsWith(this.prefix)) {
			let txt = msg.content.substr(this.prefix.length);
			let atoms = msg.channel.id || "G" + msg.channel.guild.id;
			let rst = await this.apiCall(txt);;
			if (this.lastAnwser[atoms] == txt && this.lastQuestion[msg.author.id] == rst) return false;
			this.lastAnwser[atoms] = rst;
			this.lastQuestion[msg.author.id] = txt;
			if (rst != "换个说法吧！根本听不懂你说的什么？" && Math.random() <= this.replyRate) {
				msg.channel.send(rst);
				return true;
			}
		}
		return false;
	}
}
import request from 'request';
import log4js from 'log4js';

// 聊天处理
export class REChatActor {
	constructor(props) {
		this.prefix = props.prefix;
		this.app = props.app;
		this.rx = require(props.rx);
		this.complied = Object.keys(this.rx).map(v => new RegExp(v));
	}

	act(msg) {
		if (msg.content.startsWith(this.prefix)) {
			let txt = msg.content.substr(this.prefix.length);
			if (!txt.trim()) return false;
			let r = this.complied.find(v => txt.match(v));
			if (r) {
				let a = txt.replace(r, () => {
					let ps = arguments;
					return this.rx[r.source].replace(/\$(\d)/g, (v,i) => ps[i]);
				});
				this.app.log.debug(`[KV] Match ${r.source} => ${txt}`);
				msg.channel.send(a);
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
			let L = { Q: msg.content.substr(this.prefix.length) };
			if(this.prefilter(L)) {
				L.A = await this.apiCall(L.Q);
				if (this.filter(L) && Math.random() <= this.replyRate) {
					msg.channel.send(L.A);
					return true;
				}
			}
		}
		return false;
	}

	filterRepeat(L) {
		let atoms = msg.channel.id || "G" + msg.channel.guild.id;
		if (this.lastAnwser[atoms] == L.Q && this.lastQuestion[msg.author.id] == L.A) return false;
		this.lastAnwser[atoms] = L.A;
		this.lastQuestion[msg.author.id] = L.Q;
	}

	prefilter(L) {
		let m;
		if (L.Q.match(/^\d+$/)) return false;
		if (m = L.Q.match(/^qq\s+(\d+)$/i)) L.Q = m[1];
		return true;
	}

	filter(L) {
		if (L.A == "换个说法吧！根本听不懂你说的什么？") return false;
		if (L.A.match(/分析结果:输入的QQ号码有误/)) return false;
		return true;
	}
}
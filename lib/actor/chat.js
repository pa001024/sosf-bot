import request from 'request';
import log4js from 'log4js';
import { REChatManager } from '../manager';

// 聊天处理
export class REChatActor {
	constructor(props) {
		this.prefixs = props.prefixs;
		this.app = props.app;
		this.rx = new REChatManager({ file: props.rx });
	}

	act(msg) {
		let prefix = this.prefixs.find(v => msg.content.startsWith(v));
		if (prefix || Math.random() <= this.app.config.replyRate) {
			let Q = msg.content.substr(prefix ? prefix.length : 0).replace(/^[\s\.,，　]+/, '');
			let A = this.rx.getReact(Q);
			if (A) {
				this.app.log.debug(`[RE] Match ${Q} => ${A}`);
				msg.channel.send(A);
				return true;
			}
		}
		return false;
	}
}

// 聊天处理2
export class AIChatActor {
	constructor(props) {
		this.prefixs = props.prefixs;
		this.app = props.app;
		this.api = props.api;
		this.lastQuestion = {};
		this.lastAnwser = {};
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
		let prefix = this.prefixs.find(v => msg.content.startsWith(v));
		if (prefix || Math.random() <= this.app.config.replyRate) {
			let L = { Q: msg.content.substr(prefix ? prefix.length : 0).replace(/^[\s\.,　]+/, '') };
			if(this.prefilter(L)) {
				L.A = await this.apiCall(L.Q);
				if (this.filter(L)) {
					this.app.log.debug(`[CHAT] ${L.Q} => ${L.A}`);
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
		if (L.A == "我知道哦~这首歌挺好听的呢") return false;
		if (L.A.match(/分析结果:输入的QQ号码有误|不怎么熟，要么你搜索下吧。/)) return false;
		if (L.A.match(/<Response>/)) return false;
		return true;
	}
}

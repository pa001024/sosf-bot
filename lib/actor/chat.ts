import * as request from 'request';
import { REChatManager } from '../manager';
import { App } from '..';
import * as Discord from 'discord.js';


// 聊天处理
export class REChatActor {
	prefixs: Array<string>;
	app: App;
	rx: REChatManager;
	constructor(prefixs: Array<string>, app: App, rxFile: string) {
		this.prefixs = prefixs;
		this.app = app;
		this.rx = new REChatManager(rxFile);
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

export class QA {
	Q: string;
	A: string;
	constructor(q: string, a = "") {
		this.Q = q;
		this.A = a;
	}
}

/** 聊天处理2 */
export class AIChatActor {
	prefixs: Array<string>;
	app: App;
	api: string;
	lastQuestion = new Map<string, string>();
	lastAnwser = new Map<string, string>();
	constructor(prefixs: Array<string>, app: App, api: string) {
		this.prefixs = prefixs;
		this.app = app;
		this.api = api;
	}

	apiCall(content: string): Promise<string> {
		let api = this.api.replace("<MSG>", encodeURI(content));
		return new Promise((resolve, reject) => {
			request(api, (e, r, body: string) => {
				if (e) return reject(e);
				resolve(body);
			});
		});
	}

	async act(msg: Discord.Message): Promise<boolean> {
		let prefix = this.prefixs.find(v => msg.content.startsWith(v));
		if (prefix || Math.random() <= this.app.config.replyRate) {
			let L = new QA(msg.content.substr(prefix ? prefix.length : 0).replace(/^[\s\.,　]+/, ''));
			if (this.prefilter(L)) {
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

	/**
	 * 重复过滤
	 * @param L 
	 * @param msg 信息
	 */
	filterRepeat(L: QA, msg: Discord.Message) {
		let atoms = msg.channel.id;
		if (this.lastAnwser[atoms] == L.Q && this.lastQuestion[msg.author.id] == L.A) return false;
		this.lastAnwser[atoms] = L.A;
		this.lastQuestion[msg.author.id] = L.Q;
	}

	prefilter(L: QA) {
		let m;
		if (L.Q.match(/^\d+$/)) return false;
		if (m = L.Q.match(/^qq\s+(\d+)$/i)) L.Q = m[1];
		return true;
	}

	filter(L: QA) {
		if (L.A == "换个说法吧！根本听不懂你说的什么？") return false;
		if (L.A == "我知道哦~这首歌挺好听的呢") return false;
		if (L.A.match(/分析结果:输入的QQ号码有误|不怎么熟，要么你搜索下吧。/)) return false;
		if (L.A.match(/<Response>/)) return false;
		return true;
	}
}

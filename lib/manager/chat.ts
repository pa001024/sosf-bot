import * as fs from 'fs';

/** 正则表达式自动回复 */
export class REChatManager {
	file: string;
	rx: any;
	complied: RegExp[];
	constructor(file: string) {
		this.file = file;
		this.rx = require(this.file);
		this.complied = Object.keys(this.rx).map(v => new RegExp(v, 'i'));
	}
	/**
	 * 删除回复
	 * @param qrx 匹配正则
	 * @param arx 回复表达式
	 */
	delReact(qrx: string, arx: string | string[] = null) {
		if (arx) {
			if (typeof this.rx[qrx] != "string") {
				if (typeof arx != "string") {
					arx.forEach(x => this.rx[qrx] = this.rx[qrx].filter((v: string) => v != x));
				} else {
					this.rx[qrx] = this.rx[qrx].filter((v: string) => v != arx);
				}
			} else if (this.rx[qrx] == arx) {
				this.complied = this.complied.filter(v => v.source != qrx);
				delete this.rx[qrx];
			}
		} else {
			this.complied = this.complied.filter(v => v.source != qrx);
			delete this.rx[qrx];
		}
		this.save();
		return this;
	}
	/**
	 * 触发并删除回复
	 * @param txt 测试用例
	 */
	calDelReact(txt: string): boolean {
		let r = this.complied.find(v => !!txt.match(v));
		if (r) {
			this.complied = this.complied.filter(v => v.source != r.source);
			delete this.rx[r.source];
			this.save();
			return true;
		}
		return false;
	}
	/**
	 * 设置回复(覆盖)
	 * @param qrx 匹配正则
	 * @param arx 回复表达式
	 */
	setReact(qrx: string, arx: string | string[]) {
		if (!this.rx[qrx]) this.complied.push(new RegExp(qrx, 'i'));
		this.rx[qrx] = arx;
		this.save();
		return this;
	}
	/**
	 * 设置回复(追加)
	 * @param qrx 匹配正则
	 * @param arx 回复表达式
	 */
	addReact(qrx: string, arx: string | string[]) {
		if (typeof this.rx[qrx] != "string") {
			if (typeof arx != "string") {
				this.rx[qrx] = this.rx[qrx].concat(arx);
			} else {
				this.rx[qrx].push(arx);
			}
		} else if (typeof this.rx[qrx] == "string") {
			if (typeof arx != "string") {
				this.rx[qrx] = [this.rx[qrx]].concat(arx);
			} else {
				this.rx[qrx] = [this.rx[qrx], arx];
			}
		} else {
			this.rx[qrx] = arx;
			this.complied.push(new RegExp(qrx, 'i'));
		}
		this.save();
		return this;
	}
	/**
	 * 触发并获取回复
	 * @param txt 测试用例
	 */
	getReact(txt: string) {
		let r = this.complied.find(v => !!txt.match(v));
		let a = null;
		txt.replace(r, (...ps: any[]) => {
			if (typeof this.rx[r.source] != "string") {
				let rdIndex = ~~(Math.random() * this.rx[r.source].length);
				a = this.rx[r.source][rdIndex].replace(/\$\d/g, v => ps[+v.substr(1)]);
			} else {
				a = this.rx[r.source].replace(/\$\d/g, v => ps[+v.substr(1)]);
			}
			return "";
		});
		return a;
	}
	/**
	 * 保存数据
	 */
	save() {
		fs.writeFileSync(this.file, JSON.stringify(this.rx), null);
		return this;
	}
}

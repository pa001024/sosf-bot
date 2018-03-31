import * as fs from 'fs';

/** 正则表达式自动回复 */
export class REChatManager {
	file: string;
	patterns: { [key: string]: string[] };
	complied: RegExp[];
	constructor(file: string) {
		this.file = file;
		this.patterns = require(this.file);
		this.complied = Object.keys(this.patterns).map(v => new RegExp(v, 'i'));
	}
	/**
	 * 删除回复
	 * @param queryRegex 匹配正则
	 * @param anwser 回复表达式
	 */
	delReact(queryRegex: string, anwser?: string | string[]) {
		if (anwser) {
			if (typeof this.patterns[queryRegex] != "string") {
				if (typeof anwser != "string") {
					anwser.forEach(x => this.patterns[queryRegex] = this.patterns[queryRegex].filter((v: string) => v != x));
				} else {
					this.patterns[queryRegex] = this.patterns[queryRegex].filter((v: string) => v != anwser);
				}
			} else if (this.patterns[queryRegex] == anwser) {
				this.complied = this.complied.filter(v => v.source != queryRegex);
				delete this.patterns[queryRegex];
			}
		} else {
			this.complied = this.complied.filter(v => v.source != queryRegex);
			delete this.patterns[queryRegex];
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
			delete this.patterns[r.source];
			this.save();
			return true;
		}
		return false;
	}
	/**
	 * 设置回复(覆盖)
	 * @param queryRegex 匹配正则
	 * @param anwser 回复表达式
	 */
	setReact(queryRegex: string, anwser: string | string[]) {
		if (!this.patterns[queryRegex]) this.complied.push(new RegExp(queryRegex, 'i'));
		if (typeof anwser == "string")
			this.patterns[queryRegex] = [anwser];
		else
			this.patterns[queryRegex] = anwser;
		this.save();
		return this;
	}
	/**
	 * 设置回复(追加)
	 * @param qrx 匹配正则
	 * @param arx 回复表达式
	 */
	addReact(queryRegex: string, anwser: string | string[]) {
		if (this.patterns[queryRegex]) {
			if (typeof anwser != "string") {
				this.patterns[queryRegex] = this.patterns[queryRegex].concat(anwser);
			} else {
				this.patterns[queryRegex].push(anwser);
			}
		} else {
			if (typeof anwser == "string")
				this.patterns[queryRegex] = [anwser];
			else
				this.patterns[queryRegex] = anwser;
			this.complied.push(new RegExp(queryRegex, 'i'));
		}
		this.save();
		return this;
	}
	/**
	 * 触发并获取回复
	 * @param txt 测试用例
	 */
	getReact(txt: string): string {
		let r = this.complied.find(v => !!txt.match(v));
		let anwser: string;
		txt.replace(r, (...groups: any[]) => {
			let rdIndex = ~~(Math.random() * this.patterns[r.source].length);
			anwser = this.patterns[r.source][rdIndex].replace(/\$\d/g, v => groups[+v.substr(1)]);
			return "";
		});
		return anwser;
	}
	/**
	 * 保存数据
	 */
	save() {
		fs.writeFileSync(this.file, JSON.stringify(this.patterns), null);
		return this;
	}
}

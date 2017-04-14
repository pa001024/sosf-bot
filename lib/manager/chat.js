import fs from 'fs';

export class REChatManager {
	constructor(props) {
		this.file = props.file;
		this.rx = require(this.file);
		this.complied = Object.keys(this.rx).map(v => new RegExp(v, 'i'));
	}
	// 删除回复
	delReact(qrx, arx = null) {
		if (arx) {
			if (typeof this.rx[qrx] == "array") {
				if (typeof arx == "array") {
					arx.forEach(x => this.rx[qrx] = this.rx[qrx].filter(v => v != x));
				} else {
					this.rx[qrx] = this.rx[qrx].filter(v => v != arx);
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
	// 触发并删除回复
	calDelReact(txt) {
		let r = this.complied.find(v => txt.match(v));
		if (r) {
			this.complied = this.complied.filter(v => v.source != r.source);
			delete this.rx[r.source];
			this.save();
			return true;
		}
		return false;
	}
	// 设置回复(覆盖)
	setReact(qrx, arx) {
		if (!this.rx[qrx]) this.complied.push(new RegExp(qrx, 'i'));
		this.rx[qrx] = arx;
		this.save();
		return this;
	}
	// 设置回复(追加)
	addReact(qrx, arx) {
		if (typeof this.rx[qrx] == "array") {
			if (typeof arx == "array") {
				this.rx[qrx] = this.rx[qrx].concat(arx);
			} else {
				this.rx[qrx].push(arx);
			}
		} else if(typeof this.rx[qrx] == "string") {
			if (typeof arx == "array") {
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
	getReact(txt) {
		let r = this.complied.find(v => txt.match(v));
		let a = null;
		txt.replace(r, () => {
			let ps = arguments;
			if (typeof this.rx[r.source] == "array") {
				let rdIndex = ~~(Math.random() * this.rx[r.source].length);
				a = this.rx[r.source][rdIndex].replace(/\$\d/g, v => ps[+v.substr(1)]);
			} else {
				a = this.rx[r.source].replace(/\$\d/g, v => ps[+v.substr(1)]);
			}
		});
		return a;
	}
	save() {
		fs.writeFileSync(this.file, JSON.stringify(this.rx), null);
		return this;
	}
}

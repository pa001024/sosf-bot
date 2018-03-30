import { EventEmitter } from 'events';

export class LrcParser extends EventEmitter {
	lrcs: string[];
	tags = {};
	playing = false;
	offset = 500;
	lines: Map<number, string[]>;
	times: number[];
	startStamp: number;
	curLine: number;
	timer: NodeJS.Timer;
	pauseStamp: number;
	constructor(lrcs: string[]) {
		super();
		this.lrcs = lrcs;

		// tag parse
		['ti', 'ar', 'al', 'offset', 'by'].forEach(tag => {
			let tn = lrcs[0].match(new RegExp('\\[' + tag + ':([^\\]]*)\\]', 'i'));
			this.tags[tag] = tn ? tn[1] : '';
		});

		this.lines = new Map<number, string[]>();
		this.lines[0] = ["~~~"];

		let timeExp = /\[(\d{2,})\:(\d{2}(?:\.\d{2,3})?)\]/g;

		// line parse 
		lrcs.forEach(lrc => lrc.split(/\n+/).filter(v => v.match(timeExp)).forEach(line => {
			let time;
			timeExp.lastIndex = 0;
			while (time = timeExp.exec(line)) {
				let _last = timeExp.lastIndex;
				timeExp.lastIndex = 0;
				let timeTag = time[1] * 6e4 + time[2] * 1e3;
				(this.lines[timeTag] || (this.lines[timeTag] = [])).push(line.replace(timeExp, ''));
				timeExp.lastIndex = _last;
			}
		}));

		this.times = Object.keys(this.lines).map(v => +v).sort((a, b) => a - b);
	}

	findLine(time) {
		for (let i = this.times.length - 1; i >= 0; --i) {
			if (time >= this.times[i]) return i;
		}
		return 0;
	}

	play(startTime = 0) {
		this.startStamp = Date.now() - startTime;
		this.curLine = this.findLine(startTime);
		this.playing = true;
		this.emit('start', this.times[this.curLine], this.lines[this.times[this.curLine]], this.times[this.curLine + 1] && this.lines[this.times[this.curLine + 1]]);

		let next = () => {
			if (!this.times[++this.curLine]) return;

			this.timer = setTimeout(() => {
				this.emit('update', this.times[this.curLine], this.lines[this.times[this.curLine]], this.times[this.curLine + 1] && this.lines[this.times[this.curLine + 1]]);
				next();
			}, this.times[this.curLine] - (Date.now() - this.startStamp + this.offset));
		};
		next();
	}

	toggle() {
		var now = Date.now();
		if (this.playing) {
			this.stop();
			this.pauseStamp = now;
		} else {
			this.play((this.pauseStamp || now) - (this.startStamp || now));
			delete this.pauseStamp;
		}
	}

	seek(offset) {
		this.startStamp -= offset;
		this.playing && this.play(Date.now() - this.startStamp);
	}

	stop() {
		this.playing = false;
		clearTimeout(this.timer);
		delete this.timer;
	}
}
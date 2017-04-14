import { EventEmitter } from 'events';

export class LrcParser extends EventEmitter {
	constructor(lrcs) {
		super();
		this.lrcs = lrcs;
		this.tags = {};
		this.playing = false;

		['ti','ar','al','offset','by'].forEach(tag => {
			let tn = lrcs[0].match(new RegExp('\\[' + tag + ':([^\\]]*)\\]', 'i'));
			this.tags[tag] = tn ? tn[1] : '';
		});

		this.lines = {};

		let timeExp = /\[(\d{2,})\:(\d{2}(?:\.\d{2,3})?)\]/g;

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

		this.times = Object.keys(this.lines).sort((a, b) => a - b);
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
		this.emit('start', this.times[this.curLine], this.lines[this.times[this.curLine]]);

		let next = () => {
			if (!this.times[++this.curLine]) {
				return;
			}

			this.timer = setTimeout(() => {
				this.emit('update', this.times[this.curLine], this.lines[this.times[this.curLine]]);
				next();
			}, this.times[this.curLine] - (Date.now() - this.startStamp));
		};
		next();
	}

	toggle() {
		var now = Date.now();
		if (this.playing) {
			this.stop();
			this.pauseStamp = now;
		} else {
			this.play((this.pauseStamp || now) - (this.startStamp || now), true);
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
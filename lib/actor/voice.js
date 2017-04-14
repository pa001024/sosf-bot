import request from 'request';
import ChildProcess from 'child_process';
import { CloudMusic, LrcParser } from '../addon';

// Voice
export class VoiceActor {
	constructor(props) {
		this.prefix = props.prefix;
		this.app = props.app;
		this.voiceconn = null;
		this.enable = true;
		this.musicQueue = [];
		this.session = null;
		this.vol = props.vol || 0.5;
		this.enableLyric = true;
	}

	// 点歌之类的
	async addMusic(mid, msg) {
		if (typeof mid == "string") {
			mid = mid.split(",");
			mid.forEach((v,i) => mid[i] = ~~v);
		}
		this.app.log.debug(`[MUS] Adding song ${mid}`);
		let data = await this.getMusicInfo(mid);
		if (data.songs && data.songs.length) {
			let addedSongs = [];
			for (let i = 0; i < data.songs.length; i++) {
				if (data.songs[i].mp3Url) {
					this.musicQueue.push(data.songs[i]);
					addedSongs.push(`${addedSongs.length+1}. ${data.songs[i].name} - ${data.songs[i].artists[0].name}`);
				}
			}
			if (addedSongs.length && !this.session) {
				this.play();
				if (this.enableLyric) {
					this.displayLyric(msg);
				}
			}
		}
	}

	async displayLyric(msg) {
		let muInfo = this.musicQueue[0],
			tplHead = `💿 \`${muInfo.name} - ${muInfo.artists[0].name}\`\n\n`;
		let lrc = await CloudMusic.getLyric(muInfo.id), slide;
		if (lrc.uncollected) {
			msg.channel.send(tplHead + "*无歌词*")
				.then(m => slide = m);
			setTimeout(() => {
				if (this.session) {
					this.session.on('end', () => {
						slide.delete(1e3);
					});
				}
			}, 2e3);
			return;
		}
		let lrcList = [];
		["lrc", "tlyric", "klyric"].forEach(v => lrc[v].lyric && lrcList.push(lrc[v].lyric));
		let player = new LrcParser(lrcList);
		player.on('start', (time, txts) => {
			txts && msg.channel.send(tplHead + txts.map(v => `**♪ ${v} ♪**`).join("\n"))
				.then(m => slide = m);
		});
		player.on('update', (time, txts) => {
			slide && txts && slide.edit(tplHead + txts.map(v => `**♪ ${v} ♪**`).join("\n"));
		});
		setTimeout(() => {
			if (this.session) {
				this.session.on('end', () => {
					slide.delete(1e3);
				});
			}
		}, 2e3);
		player.play();
	}

	setVol(volume) {
		this.vol = volume;
		if (this.session) {
			this.session.setVolume(this.vol);
		}
	}

	getMusicInfo(mid) {
		return CloudMusic.getInfo(mid);
	}

	getMusicURL(mid) {
		return CloudMusic.getURL(mid);
	}

	play() {
		if (!this.session) {
			this.playNext();
		} else {
			this.session.resume();
		}
	}

	async playNext() {
		if (!this.voiceconn) return;
		this.stop();
		if (!this.musicQueue.length) return;
		let data = await this.getMusicURL([this.musicQueue[0].id]);
		if (!(data && data.data && data.data[0] && data.data[0].url)) return;
		let reason = await this.playURL(data.data[0].url);
		if (this.musicQueue.length) {
			this.musicQueue = this.musicQueue.filter((v, i) => i > 0);
			if (reason != "cmd" && this.musicQueue[0]) {
				this.playNext();
			}
		}
	}

	stop() {
		this.session && this.session.end("cmd");
	}

	playURL(url, callback) {
		return new Promise((resolve, reject) => {
			if (!this.voiceconn) return reject("未连接到语音频道");

			let ffProcess = ChildProcess.spawn("ffmpeg", [
				'-analyzeduration', '0',
				'-loglevel', '0',
				'-i', '-',
				'-f', 's16le',
				'-ar', '48000',
				'-ac', '2',
				'-ss', '0',
				'pipe:1',
			], { stdio: ['pipe', 'pipe', 'ignore'] });
			request(url).pipe(ffProcess.stdin).on('error', e => this.app.log.error(e));
			this.session = this.voiceconn.playConvertedStream(ffProcess.stdout);

			if (this.session) {
				this.session.setVolume(this.vol);
				this.session.on("start", () => {
					callback && callback();
				});
				this.session.on("end", reason => {
					this.session = null;
					resolve(reason);
					// console.log("[VOC] session ended");
				}).on("error", e => reject(e));
			}
        });
	}

	join(vc) {
		let _this = this;
		vc.join().then(conn => {
				this.app.log.debug(`[Voice] Connected to ${conn.channel.name}`);
				_this.voiceconn = conn;

				conn.on("disconnect", () => {
					this.app.log.debug(`[Voice] Disconnected from ${conn.channel.name}`);
					_this.voiceconn = null;
				});

				// TODO: record
				conn.on("speaking", (user, speaking) => {
					if (!speaking) {

					}
				});
			})
			.catch(err => console.trace(err));
	}

	leave() {
		this.voiceconn.disconnect();
	}

	act(msg) {
		if (!this.enable || this.voiceconn == null || msg.tts ) return false;
		if (msg.content.startsWith(this.prefix)) {
			let txt = msg.content.substr(this.prefix.length);
			let fultex = `${msg.sender}说: ${txt}`;
			this.app.log.debug(`[TTS] Reading: ${fultex}`);
			this.playTTS(fultex);
		}
		return false;
	}

	playTTS(content) {
		if (this.session) return;
		// 发音人选择, 0为女声，1为男声，3为情感合成-度逍遥，4为情感合成-度丫丫，默认为普通女声
		const api_base = `http://tts.baidu.com/text2audio?per=0&idx=1&cuid=baidu_speech_demo&cod=2&lan=zh&ctp=1&pdt=1&spd=9&vol=5&pit=5&tex=`;
		
		let api = api_base + encodeURI(content);
		this.playURL(api);
	}
}
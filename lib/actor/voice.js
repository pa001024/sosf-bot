import request from 'request';
import ChildProcess from 'child_process';
import { CloudMusic, LrcParser } from '../addon';

// Voice
export class VoiceActor {
	constructor(props) {
		this.prefix = props.prefix;
		this.app = props.app;
		this.voiceconn = null;
		this.enableTTS = true;
		this.musicQueue = [];
		this.session = null;
		this.vol = props.vol || 0.5;
		this.enableLyric = true;
		this.playChannel = null;
		this.ttsPerson = 0; // 发音人选择, 0为女声，1为男声，3为情感合成-度逍遥，4为情感合成-度丫丫，默认为普通女声
		this.ttsSpeed = 7; // 速度
		this.ttsPitch = 5; // 语调
		this.ttsVol = 5; // 大小
	}

	// 点歌之类的
	async addMusic(mid, msg) {
		if (typeof mid == "string") {
			mid = mid.split(",");
			mid.forEach((v, i) => mid[i] = ~~v);
		}
		this.app.log.debug(`[MUS] Adding song ${mid}`);
		let data = await this.getMusicInfo(mid);
		if (data.songs && data.songs.length) {
			let addedSongs = [];
			for (let i = 0; i < data.songs.length; i++) {
				if (data.songs[i].name) {
					this.musicQueue.push(data.songs[i]);
					addedSongs.push(`${addedSongs.length + 1}. ${data.songs[i].name} - ${data.songs[i].artists[0].name}`);
				}
			}
			if (addedSongs.length) {
				msg.reply("已添加: \n\n" + addedSongs.join("\n"))
					.then(m => m.delete(1e4));
				if (!this.session) this.play(msg);
			}
		}
	}

	async addMusicByName(name, msg) {
		let info = await this.searchMusicInfo(name);
		if (info.result && info.result.songs[0]) {
			this.addMusic([info.result.songs[0].id], msg);
		}
	}

	async addMusicByPlaylist(id, msg) {
		let info = await this.getPlaylistInfo(id);
		if (info.result && info.result.tracks) {
			for (let i = 0; i < info.result.tracks.length; i++) {
				this.musicQueue.push(info.result.tracks[i]);
			}
			msg.channel.send({
				embed: {
					title: `💿已添加歌单: ${info.result.name}`,
					url: `http://music.163.com/playlist?id=${info.result.id}`,
					color: 0xF92672,
					description: `${info.result.tracks[0].name} - ${info.result.tracks[0].artists[0].name}`
					+ (info.result.tracks.length > 1 ? `\n${info.result.tracks[1].name} - ${info.result.tracks[1].artists[0].name}` : ""),
					thumbnail: {
						url: info.result.coverImgUrl,
					},
					footer: {
						text: `等${info.result.tracks.length}首音乐`
					}
				}
			});
			if (!this.session) this.play(msg);
		}
	}

	displayLyric(chan, muInfo, lrc) {
		let slide, slides = [],
			cT = a => `${~~(a / 6e4)}:${~~(a / 1e3 % 60) > 9 ? ~~(a / 1e3 % 60) : "0" + ~~(a / 1e3 % 60)}`, // 时间戳转0:00形式
			tplHead = `💿 \`${muInfo.name} - ${muInfo.artists[0].name}\` `,
			tplTime = `\`0:00 / ${cT(muInfo.duration)}\`\n\n`,
			addStopReact = (m) => {
				m.react('⏹');
				m.react('⏭');
				const filter = (reaction, user) => (reaction.emoji.name === '⏹' || reaction.emoji.name === '⏭') && user.id !== this.app.client.user.id;
				const col = m.createReactionCollector(filter, { time: muInfo.duration });
				col.on('collect', reaction => {
					col.stop();
					if (reaction.emoji.name === '⏭') {
						this.stop();
						setTimeout(() => this.playNext(), 1e3);
					}
					else
						this.stop();
				});
			};
		if (lrc.uncollected || lrc.nolyric) {
			chan.send(tplHead + "*无歌词*")
				.then(m => slides.push(m));
			setTimeout(() => {
				if (this.session) {
					this.session.on('end', () => {
						if (slides.length) slide = slides[slides.length - 1];
						if (slide) {
							tplTime = `\`${cT(muInfo.duration)} / ${cT(muInfo.duration)}\`\n\n`;
							slide.edit(tplHead + tplTime + `**- END -**`);
							slides.forEach(o => o.delete(5e3));
						}
					});
				}
			}, 2e3);
			return null;
		}
		let lrcList = [];
		["lrc", "tlyric", "klyric"].forEach(v => lrc[v] && lrc[v].lyric && lrcList.push(lrc[v].lyric));
		let player = new LrcParser(lrcList);
		player.on('start', (time, txts, next) => {
			if (txts[0] && txts[0].trim() == "") return;
			tplTime = `\`${cT(time)} / ${cT(muInfo.duration)}\`\n\n`;
			chan.send(tplHead + tplTime + txts.map(v => `**♪ ${v} ♪**`).join("\n") +
				(next ? "\n" + next.map(v => `♪ ${v} ♪`).join("\n") : ""))
				.then(m => { slides.push(m); addStopReact(m); });
		});
		player.on('update', (time, txts, next) => {
			if (txts[0] && txts[0].trim() == "") return;
			tplTime = `\`${cT(time)} / ${cT(muInfo.duration)}\`\n\n`;
			if (slides.length) slide = slides[slides.length - 1];
			if (slide) {
				slide.edit(tplHead + tplTime + txts.map(v => `**♪ ${v} ♪**`).join("\n") +
					(next ? "\n" + next.map(v => `♪ ${v} ♪`).join("\n") : ""));
			} else if (time > 2e3) {
				chan.send(tplHead + tplTime + txts.map(v => `**♪ ${v} ♪**`).join("\n") +
					(next ? "\n" + next.map(v => `♪ ${v} ♪`).join("\n") : ""))
					.then(m => { slides.push(m); addStopReact(m); });
			}
		});
		setTimeout(() => {
			if (this.session) {
				this.session.on('end', () => {
					slides.forEach(o => o.delete(1e3));
				});
			}
		}, 2e3);
		return player;
	}

	setVol(volume) {
		this.vol = volume;
		if (this.session) {
			this.session.setVolume(this.vol);
		}
	}

	searchMusicInfo(name) {
		return CloudMusic.search(name);
	}

	getPlaylistInfo(id) {
		return CloudMusic.getPlaylistInfo(id);
	}

	getMusicInfo(mid) {
		return CloudMusic.getInfo(mid);
	}

	getMusicURL(id) {
		return CloudMusic.getDownload(id);
	}

	getLyric(id) {
		return CloudMusic.getLyric(id);
	}

	play(msg) {
		if (this.playChannel != msg.channel) {
			this.playChannel = msg.channel;
			this.stop();
			this.leave();
			msg.member && msg.member.voiceChannel && this.join(msg.member.voiceChannel)
				.then(c => this.playNext());
		} else {
			if (this.session) {
				this.session.paused && this.session.resume();
			} else {
				this.playNext();
			}
		}
	}

	async playNext() {
		if (!this.voiceconn) return;
		this.stop();
		if (!this.musicQueue.length) return;
		let rst = await this.getMusicURL(this.musicQueue[0].id);
		if (!(rst.data && rst.data.url)) {
			this.app.log.warn(`[MUS] Failed to load mp3url for ${this.musicQueue[0].id}:\n`);
			this.app.log.warn(rst);
			this.musicQueue = this.musicQueue.slice(1);
			this.playNext();
			return;
		}
		let lrcPlayer = null;
		if (this.enableLyric && this.playChannel) {
			let lrc = await this.getLyric(this.musicQueue[0].id);
			lrcPlayer = this.displayLyric(this.playChannel, this.musicQueue[0], lrc);
			this.app.log.info(`[LRC] Setting offset: ${this.app.client.ping}ms`);
			lrcPlayer.offset = this.app.client.ping;
		}
		let reason = await this.playURL(rst.data.url, () => {
			lrcPlayer && lrcPlayer.play();
		});
		if (this.musicQueue.length) {
			this.musicQueue = this.musicQueue.slice(1);
			if (reason != "cmd") {
				this.playNext();
			} else {
				lrcPlayer && lrcPlayer.stop();
			}
		}
	}

	playURL(url, callback) {
		return new Promise((resolve, reject) => {
			if (!this.voiceconn) return reject("未连接到语音频道");
			try {
				let ffProcess = ChildProcess.spawn("ffmpeg",
					"-analyzeduration 0 -loglevel 0 -i - -f s16le -ar 48000 -ac 2 -ss 0 pipe:1".split(" "), {
						stdio: ['pipe', 'pipe', 'ignore']
					});
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
						this.app.log.info(`[VOC] url ${url} session ended`);
					}).on("error", e => reject(e));
				}
			} catch (e) {
				reject(e);
			}
		});
	}

	stop() {
		this.session && this.session.end("cmd");
	}

	join(vc) {
		return vc.join().then(conn => {
			this.app.log.debug(`[Voice] Connected to ${conn.channel.name}`);
			this.voiceconn = conn;

			conn.on("disconnect", () => {
				this.app.log.debug(`[Voice] Disconnected from ${conn.channel.name}`);
				this.voiceconn = null;
			});

			// TODO: record
			conn.on("speaking", (user, speaking) => {
				if (!speaking) {

				}
			});
		}).catch(err => this.app.log.error(err));
	}

	leave() {
		this.voiceconn && this.voiceconn.disconnect();
	}

	playTTS(content) {
		if (this.session) return;
		const api_base = `http://tts.baidu.com/text2audio?per=${this.ttsPerson}&idx=1&cuid=baidu_speech_demo&cod=2&lan=zh&ctp=1&pdt=1&spd=${this.ttsSpeed}&vol=${this.ttsVol}&pit=${this.ttsPitch}&tex=`;

		let api = api_base + encodeURI(content);
		this.playURL(api);
	}
	ract(rct) {

	}
	act(msg) {
		if (!this.enableTTS || !this.voiceconn || msg.tts || !msg.guild || msg.guild.id != this.voiceconn.channel.guild.id) return false;
		if (msg.content.startsWith(this.prefix)) {
			let txt = msg.content.substr(this.prefix.length);
			let fultex = `${msg.sender}说: ${txt}`;
			this.app.log.debug(`[TTS] Reading: ${fultex}`);
			this.playTTS(fultex);
		}
		return false;
	}
}
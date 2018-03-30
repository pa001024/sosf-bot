import * as request from 'request';
import * as ChildProcess from 'child_process';
import { CloudMusic, LrcParser } from '../addon';
import { App } from '..';
import { IActor } from '.';
import * as Discord from 'discord.js';

/** 声音组件 */
export class VoiceActor implements IActor {
	prefix: string;
	app: App;
	voiceconn: Discord.VoiceConnection;
	/** 启用TTS */
	enableTTS = false;
	/** 音乐队列 */
	musicQueue: any[] = [];
	session: Discord.StreamDispatcher;
	/** 总音量 */
	vol: number;
	/** 启用歌词 */
	enableLyric = true;
	playChannel: Discord.TextChannel;
	/** 发音人选择, 0为女声，1为男声，3为情感合成-度逍遥，4为情感合成-度丫丫，默认为普通女声 */
	ttsPerson = 0;
	/** 速度 */
	ttsSpeed = 7;
	/** 语调 */
	ttsPitch = 5;
	/** 大小 */
	ttsVol = 5;
	/**
	 * 创建声音组件
	 * @param {object} props 参数对象
	 */
	constructor(prefix: string, app: App, vol: number = 1) {
		this.prefix = prefix;
		this.app = app;
		this.vol = vol || 0.5; // 总音量
	}

	/**
	 * 添加音乐
	 * @param mid 音乐id
	 * @param msg 信息
	 */
	async addMusic(mid: string | number | Array<number>, msg: Discord.Message) {
		let musicIDs: Array<number>;
		if (typeof mid == "string") {
			musicIDs = new Array<number>();
			mid.split(",").forEach(v => +v > 0 && musicIDs.push(+v));
		} else if (typeof mid == "number") {
			musicIDs = [mid];
		}
		this.app.log.debug(`[MUS] Adding song ${mid}`);
		let data = await this.getMusicInfo(musicIDs);
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
					.then(m => m instanceof Discord.Message && m.delete(1e4));
				if (!this.session) this.play(msg);
			}
		}
	}

	/**
	 * 搜索添加音乐
	 * @param name 名称
	 * @param msg 信息
	 */
	async addMusicByName(name, msg) {
		let info = await this.searchMusicInfo(name);
		if (info.result && info.result.songs[0]) {
			this.addMusic([info.result.songs[0].id], msg);
		}
	}
	/**
	 * 添加歌单
	 * @param {number} id
	 * @param {Message} msg 
	 */
	async addMusicByPlaylist(id: number, msg: Discord.Message) {
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
					description: info.result.tracks.slice(0, 3).map(trank => `${trank.name} - ${trank.artists[0].name}`).join("\n"),
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

	/**
	 * 显示歌词
	 * @param chan 频道
	 * @param muInfo 音乐信息
	 * @param lrc 
	 */
	displayLyric(chan: Discord.TextChannel, muInfo: any, lrc: any) {
		let slide: Discord.Message, slides: Discord.Message[] = [],
			cT = (a: number) => `${~~(a / 6e4)}:${~~(a / 1e3 % 60) > 9 ? ~~(a / 1e3 % 60) : "0" + ~~(a / 1e3 % 60)}`, // 时间戳转0:00形式
			tplHead = `💿 \`${muInfo.name} - ${muInfo.artists[0].name}\` `,
			tplTime = `\`0:00 / ${cT(muInfo.duration)}\`\n\n`,
			addStopReact = (m: Discord.Message) => {
				m.react('⏹').then(_ => m.react('⏭'));
				const filter = (reaction: Discord.MessageReaction, user: Discord.User) =>
					(reaction.emoji.name === '⏹' || reaction.emoji.name === '⏭') && user.id !== this.app.client.user.id;
				const col = m.createReactionCollector(filter, {
					time: muInfo.duration
				});
				col.on('collect', reaction => {
					col.stop();
					if (reaction.emoji.name === '⏭') {
						this.stop();
						setTimeout(() => this.playNext(), 1e3);
					} else
						this.stop();
				});
			};
		if (lrc.uncollected || lrc.nolyric) {
			chan.send(tplHead + tplTime + "**- 无歌词 -**")
				.then(m => { if (m instanceof Discord.Message) { slides.push(m); addStopReact(m); } });
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
				.then(m => { if (m instanceof Discord.Message) { slides.push(m); addStopReact(m); } });
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
					.then(m => { if (m instanceof Discord.Message) { slides.push(m); addStopReact(m); } });
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

	/**
	 * 设置音量
	 * @param volume 音量大小 0-1
	 */
	setVol(volume: number) {
		this.vol = volume;
		if (this.session) {
			this.session.setVolume(this.vol);
		}
	}

	private searchMusicInfo(name: string): Promise<any> {
		return CloudMusic.search(name);
	}

	private getPlaylistInfo(id: number): Promise<any> {
		return CloudMusic.getPlaylistInfo(id);
	}

	private getMusicInfo(musicIDs: number[]): Promise<any> {
		return CloudMusic.getInfo(musicIDs);
	}

	private getMusicURL(id: number): Promise<any> {
		return CloudMusic.getDownload(id);
	}

	private getLyric(id: number): Promise<any> {
		return CloudMusic.getLyric(id);
	}

	play(msg: Discord.Message) {
		if (this.playChannel == null || this.playChannel.id != msg.channel.id) {
			if (msg.channel instanceof Discord.TextChannel)
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

	/** 播放下一首音乐 */
	async playNext() {
		if (!this.voiceconn) return;
		this.stop();
		if (!this.musicQueue.length) {
			this.app.log.info(`[MUS] musicQueue length is 0`);
			return;
		}
		let lrcPlayer: LrcParser;
		try {
			let rst = await this.getMusicURL(this.musicQueue[0].id);
			if (!(rst.data && rst.data.url)) {
				this.app.log.warn(`[MUS] Failed to load mp3url for ${this.musicQueue[0].id}:\n`);
				this.app.log.warn(rst);
				this.musicQueue = this.musicQueue.slice(1);
				this.playNext();
				return;
			}
			if (this.enableLyric && this.playChannel) {
				let lrc = await this.getLyric(this.musicQueue[0].id);
				lrcPlayer = this.displayLyric(this.playChannel, this.musicQueue[0], lrc);
				this.app.log.info(`[LRC] Set offset: ${~~this.app.client.ping}ms`);
				if (lrcPlayer) lrcPlayer.offset = ~~this.app.client.ping;
			}
			let reason = await this.playURL(rst.data.url, () => {
				lrcPlayer && lrcPlayer.play();
			});
			if (this.musicQueue.length) {
				this.musicQueue = this.musicQueue.slice(1);
				if (reason != "cmd") {
					this.playNext();
				} else {
					if (lrcPlayer) lrcPlayer.stop();
				}
			}
		} catch (e) {
			if (lrcPlayer) lrcPlayer.stop();
			this.app.log.error(e as any);
		}
	}

	/**
	 * 播放URL
	 * @param url 音乐地址
	 * @param callback 回调函数
	 */
	playURL(url: string, callback?: Function) {
		return new Promise<any>((resolve, reject) => {
			if (!this.voiceconn) return reject("未连接到语音频道");
			try {
				let ffProcess = ChildProcess.spawn("ffmpeg", "-analyzeduration 0 -loglevel 0 -i - -f s16le -ar 48000 -ac 2 -ss 0 pipe:1".split(" "), {
					stdio: ['pipe', 'pipe', 'ignore']
				});
				request(url).pipe(ffProcess.stdin).on('error', (err: any) => this.app.log.error(err));
				this.session = this.voiceconn.playConvertedStream(ffProcess.stdout);

				if (this.session) {
					this.session.setVolume(this.vol);
					this.session.on("start", () => {
						callback && callback();
					});
					this.session.on("end", reason => {
						this.session = null;
						resolve(reason);
						this.app.log.debug(`[VOC] url ${url} session ended`);
					}).on("error", e => reject(e));
				}
			} catch (e) {
				reject(e);
			}
		});
	}

	/**
	 * 停止播放
	 */
	stop() {
		if (this.session)
			this.session.end("cmd");
	}
	/**
	 * 停止全部播放
	 */
	stopAll() {
		this.musicQueue = [];
		this.stop();
	}

	/**
	 * 随机化播放列表
	 */
	randomize() {
		var len = this.musicQueue.length;
		for (var i = 0; i < len - 1; i++) {
			var index = ~~(Math.random() * (len - i));
			var temp = this.musicQueue[index];
			this.musicQueue[index] = this.musicQueue[len - i - 1];
			this.musicQueue[len - i - 1] = temp;
		}
	}

	join(vc: Discord.VoiceChannel) {
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
		if (this.voiceconn) {
			this.voiceconn.disconnect();
			this.voiceconn = null;
		}
	}

	playTTS(content: string) {
		if (this.session) return;
		const api_base = `http://tts.baidu.com/text2audio?per=${this.ttsPerson}&idx=1&cuid=baidu_speech_demo&cod=2&lan=zh&ctp=1&pdt=1&spd=${this.ttsSpeed}&vol=${this.ttsVol}&pit=${this.ttsPitch}&tex=`;

		let api = api_base + encodeURI(content);
		this.playURL(api);
	}
	reciveMessage(msg: Discord.Message) {
		if (!this.enableTTS || !this.voiceconn || msg.tts || !msg.guild || msg.guild.id != this.voiceconn.channel.guild.id) return false;
		if (msg.content.startsWith(this.prefix)) {
			let txt = msg.content.substr(this.prefix.length);
			let fultex = `${this.app.whois(msg)}说: ${txt}`;
			this.app.log.debug(`[TTS] Reading: ${fultex}`);
			this.playTTS(fultex);
		}
		return false;
	}
}

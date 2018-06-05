import * as request from 'request';
import * as ChildProcess from 'child_process';
import { CloudMusic, LrcParser } from '../addon';
import { App } from '..';
import { IActor } from '.';
import * as Discord from 'discord.js';
import { LyricInfo, Song, Lyric } from '../addon/cloudmusic';
import { LyricManager, BaiduTTSManager } from '../manager';

/** 声音组件 */
export class VoiceActor implements IActor {
	prefix: string;
	app: App;
	voiceconn: Discord.VoiceConnection;
	session: Discord.StreamDispatcher;
	/** 音乐队列 */
	musicQueue: Song[] = [];
	/** 总音量 */
	vol: number;
	playChannel: Discord.TextChannel;

	/** TTS */
	enableTTS = false;
	ttsManager = new BaiduTTSManager();

	/** 歌词 */
	enableLyric = true;
	lyricDisplay = new LyricManager();

	/**
	 * 创建声音组件
	 * @param prefix 指令前缀
	 * @param app
	 * @param vol
	 */
	constructor(prefix: string, app: App, vol: number = 1) {
		this.prefix = prefix;
		this.app = app;
		this.vol = vol;
	}

	/**
	 * 添加音乐
	 * @param mid 音乐id
	 * @param msg 信息
	 */
	async addMusic(mid: string | number | number[], msg: Discord.Message) {
		let musicIDs: number[];
		if (typeof mid == "string") {
			musicIDs = [];
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
	async addMusicByName(name: string, msg: Discord.Message) {
		let info = await this.searchMusicInfo(name);
		if (info.result && info.result.songs[0]) {
			this.addMusic([info.result.songs[0].id], msg);
		}
	}

	/**
	 * 添加歌单
	 * @param id
	 * @param msg 信息
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
					description: info.result.tracks.slice(0, 3).map((trank: { name: string, artists: { name: string }[] }) => `${trank.name} - ${trank.artists[0].name}`).join("\n"),
					thumbnail: {
						url: info.result.coverImgUrl,
					},
					footer: {
						text: `等${info.result.tracks.length}首音乐`
					}
				}
			}).then(m => {
				if (m instanceof Discord.Message) {
					m.react('❌');
					const filter = (reaction: Discord.MessageReaction, user: Discord.User) =>
						(reaction.emoji.name === '❌') && user.id !== this.app.client.user.id;
					const col = m.createReactionCollector(filter);
					col.on('collect', reaction => {
						col.stop();
						m.delete();
					});
				}
			});
			if (!this.session) this.play(msg);
		}
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

	private searchMusicInfo(name: string) {
		return CloudMusic.search(name);
	}

	private getPlaylistInfo(id: number) {
		return CloudMusic.getPlaylistInfo(id);
	}

	private getMusicInfo(musicIDs: number[]) {
		return CloudMusic.getInfo(musicIDs);
	}

	private getMusicURL(id: number) {
		return CloudMusic.getURL([id]);
	}

	private getLyric(id: number) {
		return CloudMusic.getLyric(id);
	}

	/**
	 * 开始播放
	 * @param msg 信息
	 */
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
			if (!(rst.data && rst.data[0] && rst.data[0].url)) {
				this.app.log.warn(`[MUS] Failed to load mp3url for ${this.musicQueue[0].id}:\n`);
				this.app.log.warn(rst as any);
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
			let reason = await this.playURL(rst.data[0].url, () => {
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

	displayLyric(chan: Discord.TextChannel, muInfo: Song, lrc: LyricInfo) {
		let slide: Discord.Message, slides: Discord.Message[] = [],
			timeToString = (a: number) => `${~~(a / 6e4)}:${~~(a / 1e3 % 60) > 9 ? ~~(a / 1e3 % 60) : "0" + ~~(a / 1e3 % 60)}`, // 时间戳转0:00形式
			tplHead = `💿 \`${muInfo.name} - ${muInfo.artists[0].name}\` `,
			tplTime = `\`0:00 / ${timeToString(muInfo.duration)}\`\n\n`,
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
							tplTime = `\`${timeToString(muInfo.duration)} / ${timeToString(muInfo.duration)}\`\n\n`;
							slide.edit(tplHead + tplTime + `**- END -**`);
							slides.forEach(o => o.delete(5e3));
						}
					});
				}
			}, 2e3);
			return null;
		}
		let lrcList: string[] = [];
		["lrc", "tlyric", "klyric"].forEach((v: keyof LyricInfo) => { lrc[v] && (lrc[v] as Lyric).lyric && lrcList.push((lrc[v] as Lyric).lyric); });
		let player = new LrcParser(lrcList);
		player.on('start', (curTime: number, curLine: string[], nxtLine: string[]) => {
			if (curLine[0] && curLine[0].trim() == "") return;
			tplTime = `\`${timeToString(curTime)} / ${timeToString(muInfo.duration)}\`\n\n`;
			chan.send(tplHead + tplTime + curLine.map(v => `**♪ ${v} ♪**`).join("\n") +
				(nxtLine ? "\n" + nxtLine.map(v => `♪ ${v} ♪`).join("\n") : ""))
				.then(m => { if (m instanceof Discord.Message) { slides.push(m); addStopReact(m); } });
		});
		player.on('update', (curTime: number, curLine: string[], nxtLine: string[]) => {
			if (curLine[0] && curLine[0].trim() == "") return;
			tplTime = `\`${timeToString(curTime)} / ${timeToString(muInfo.duration)}\`\n\n`;
			if (slides.length) slide = slides[slides.length - 1];
			if (slide) {
				slide.edit(tplHead + tplTime + curLine.map(v => `**♪ ${v} ♪**`).join("\n") +
					(nxtLine ? "\n" + nxtLine.map(v => `♪ ${v} ♪`).join("\n") : ""));
			} else if (curTime > 2e3) {
				chan.send(tplHead + tplTime + curLine.map(v => `**♪ ${v} ♪**`).join("\n") +
					(nxtLine ? "\n" + nxtLine.map(v => `♪ ${v} ♪`).join("\n") : ""))
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
	 * 播放URL
	 * @param url 音乐地址
	 * @param callback 回调函数
	 */
	playURL(url: string, callback?: Function) {
		return new Promise<any>((resolve, reject) => {
			if (!this.voiceconn) return reject("未连接到语音频道");
			this.session = this.voiceconn.playArbitraryInput(url);
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
		});
	}

	/**
	 * 播放文件
	 * @param fileName 文件名
	 * @param callback
	 */
	playFile(fileName: string, callback?: Function) {
		return new Promise((resolve, reject) => {
			if (!this.voiceconn) return reject("未连接到语音频道");
			this.session = this.voiceconn.playFile(fileName);
			if (this.session) {
				this.session.setVolume(this.vol);
				this.session.on("start", () => {
					callback && callback();
				});
				this.session.on("end", reason => {
					this.session = null;
					resolve(reason);
					this.app.log.debug(`[VOC] file ${fileName} session ended`);
				}).on("error", e => reject(e));
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

		let api = this.ttsManager.text2Speech(content);
		this.playURL(api);
	}

	async reciveMessage(msg: Discord.Message): Promise<boolean> {
		if (!this.enableTTS || !this.voiceconn || msg.tts || !msg.guild || msg.guild.id != this.voiceconn.channel.guild.id) return false;
		if (msg.content.startsWith(this.prefix)) {
			const emojiRx = /[\ud83c\udc00-\ud83c\udfff]|[\ud83d\udc00-\ud83d\udfff]|[\u2600-\u27ff]|<:[A-z0-9_]+:\d+>/g;
			let txt = msg.content.substr(this.prefix.length).replace(emojiRx, "");
			let fultex = `${this.app.whois(msg)}说: ${txt}`;
			this.app.log.debug(`[TTS] Reading: ${fultex}`);
			this.playTTS(fultex);
		}
		return false;
	}
}

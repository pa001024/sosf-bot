import * as request from 'request';
import { enCryptoNE, genRandom } from './necryp';

export interface EnhancePlayerURLInfo {
	data: [{ url: string, id: number, br: number, size: number, md5: string, code: number }]
}

export interface DownloadInfo {
	data: {
		id: number;
		url: string;
		br: number;
		size: number;
		md5: string;
		code: number;
		expi: number;
		type: string;
		gain: number;
		fee: number;
		uf?: any;
		payed: number;
		flag: number;
		canExtend: boolean;
	},
	code: number
}

export interface Artist {
	name: string;
	id: number;
	picId: number;
	img1v1Id: number;
	briefDesc: string;
	picUrl: string;
	img1v1Url: string;
	albumSize: number;
	alias: string[];
	trans: string;
	musicSize: number;
}

export interface Album {
	name: string;
	id: number;
	type: string;
	size: number;
	picId: number;
	blurPicUrl: string;
	companyId: number;
	pic: number;
	picUrl: string;
	publishTime: number;
	description: string;
	tags: string;
	company: string;
	briefDesc: string;
	artist: Artist;
	songs: Song[];
	alias: string[];
	status: number;
	copyrightId: number;
	commentThreadId: string;
	artists: Artist[];
	subType: string;
	transName?: string;
	picId_str?: string;
	transNames?: string[];
}

export interface Music {
	name?: string;
	id: number;
	size: number;
	extension: string;
	sr: number;
	dfsId: number;
	bitrate: number;
	playTime: number;
	volumeDelta: number;
}

export interface Song {
	name: string;
	id: number;
	position: number;
	alias: string[];
	status: number;
	fee: number;
	copyrightId: number;
	disc: string;
	no: number;
	artists: Artist[];
	album: Album;
	starred: boolean;
	popularity: number;
	score: number;
	starredNum: number;
	duration: number;
	playedNum: number;
	dayPlays: number;
	hearTime: number;
	ringtone?: any;
	crbt?: any;
	audition?: any;
	copyFrom: string;
	commentThreadId: string;
	rtUrl?: any;
	ftype: number;
	rtUrls: any[];
	copyright: number;
	transName?: string;
	sign?: any;
	hMusic: Music;
	mMusic: Music;
	lMusic: Music;
	bMusic: Music;
	mvid: number;
	rtype: number;
	rurl?: string;
	mp3Url?: string;
}

export interface MusicInfo {
	songs: Song[];
	equalizers: any;
	code: number;
}

export interface Creator {
	defaultAvatar: boolean;
	province: number;
	authStatus: number;
	followed: boolean;
	avatarUrl: string;
	accountStatus: number;
	gender: number;
	city: number;
	birthday: number;
	userId: number;
	userType: number;
	nickname: string;
	signature: string;
	description: string;
	detailDescription: string;
	avatarImgId: number;
	backgroundImgId: number;
	backgroundUrl: string;
	authority: number;
	mutual: boolean;
	expertTags?: any;
	experts?: any;
	djStatus: number;
	vipType: number;
	remarkName?: any;
	avatarImgIdStr: string;
	backgroundImgIdStr: string;
}

export interface Track {
	name: string;
	id: number;
	position: number;
	alias: string[];
	status: number;
	fee: number;
	copyrightId: number;
	disc: string;
	no: number;
	artists: Artist[];
	album: Album;
	starred: boolean;
	popularity: number;
	score: number;
	starredNum: number;
	duration: number;
	playedNum: number;
	dayPlays: number;
	hearTime: number;
	ringtone?: any;
	crbt?: any;
	audition?: any;
	copyFrom: string;
	commentThreadId: string;
	rtUrl?: any;
	ftype: number;
	rtUrls: any[];
	copyright: number;
	bMusic: Music;
	mp3Url?: any;
	mvid: number;
	rtype: number;
	rurl?: any;
	hMusic: Music;
	mMusic: Music;
	lMusic: Music;
}

export interface PlaylistInfo {
	result: {
		subscribers: any[];
		subscribed: boolean;
		creator: Creator;
		artists?: any;
		tracks: Track[];
		updateTime: number;
		privacy: number;
		newImported: boolean;
		specialType: number;
		anonimous: boolean;
		coverImgId: number;
		createTime: number;
		highQuality: boolean;
		commentThreadId: string;
		totalDuration: number;
		trackCount: number;
		userId: number;
		trackUpdateTime: number;
		playCount: number;
		coverImgUrl: string;
		cloudTrackCount: number;
		subscribedCount: number;
		ordered: boolean;
		tags: string[];
		status: number;
		adType: number;
		trackNumberUpdateTime: number;
		description: string;
		name: string;
		id: number;
		shareCount: number;
		coverImgId_str: string;
		commentCount: number;
	};
	code: number;
}

export interface User {
	id: number;
	status: number;
	demand: number;
	userid: number;
	nickname: string;
	uptime: number;
}

export interface Lyric {
	version: number;
	lyric: string;
}

export interface LyricInfo {
	sgc: boolean;
	sfy: boolean;
	qfy: boolean;
	transUser: User;
	lyricUser: User;
	lrc: Lyric;
	klyric: Lyric;
	tlyric: Lyric;
	uncollected?: boolean;
	nolyric?: boolean;
	code: number;
}

export interface SearchResult {
	result: {
		songs: Song[];
		songCount: number;
	};
	code: number;
}

// 网易云音乐 MP3URL解析
export class CloudMusic {
	/**
	 * 获取mp3地址
	 * @param id 音乐ID
	 * @param bitrate 码率
	 */
	static getDownload(id: string | number, bitrate: number = 96000): Promise<DownloadInfo> {
		let api = `http://music.163.com/api/song/enhance/download/url?br=${bitrate}&id=${id}`;

		return new Promise((resolve, reject) => {
			request(api, (err, res, body) => {
				if (err) return reject(err);
				let resultData = JSON.parse(body) as DownloadInfo;
				if (resultData.code == 200)
					resolve(resultData);
				else
					reject(resultData);
			});
		});
	}
	/**
	 * 获取mp3地址
	 * @param ids 获取mp3地址
	 */
	static getURL(ids: string[] | number[]): Promise<EnhancePlayerURLInfo> {
		let api = "http://music.163.com/weapi/song/enhance/player/url";
		let data = enCryptoNE({
			ids: JSON.stringify(ids),
			br: 96000, // bitrate
			csrf_token: genRandom(32)
		});

		return new Promise((resolve, reject) => {
			request.post({
				url: api,
				form: data
			}, (e, r, body) => {
				if (e) return reject(e);
				if (body) return resolve(JSON.parse(body));
			});
		});
	}
	/**
	 * 获取歌曲信息
	 * @param ids id数组
	 */
	static getInfo(ids: string[] | number[]): Promise<MusicInfo> {
		let api = `http://music.163.com/api/song/detail/?ids=${JSON.stringify(ids)}`;

		return new Promise((resolve, reject) => {
			request(api, (e, r, body) => {
				if (e) return reject(e);
				let d = JSON.parse(body);
				if (d.code == 200)
					resolve(d);
				else
					reject(d);
			});
		});
	}
	/**
	 * 获取歌单信息
	 * @param id 歌单id
	 */
	static getPlaylistInfo(id: number): Promise<PlaylistInfo> {
		let api = `http://music.163.com/api/playlist/detail/?id=${id}`;

		return new Promise((resolve, reject) => {
			request(api, (e, r, body) => {
				if (e) return reject(e);
				let d = JSON.parse(body);
				if (d.code == 200)
					resolve(d);
				else
					reject(d);
			});
		});
	}
	/**
	 * 获取歌词信息
	 * @param id 音乐id
	 */
	static getLyric(id: number): Promise<LyricInfo> {
		// let api = "http://music.163.com/api/song/media?id="+id;
		let api = "http://music.163.com/api/song/lyric?lv=-1&tv=-1&kv=-1&id=" + id;

		return new Promise((resolve, reject) => {
			request(api, (e, r, body) => {
				if (e) return reject(e);
				let d = JSON.parse(body);
				if (d.code == 200)
					resolve(d);
				else
					reject(d);
			});
		});
	}

	/**
		搜索
		retrun Promise<Object>: {
			result: {
				songs: [{
					name, id, 
				}],
				songCount
			},
			code = 200
		}
	*/
	static search(search: string, limit = 1, offset = 0, type = 1): Promise<SearchResult> {
		const api = "http://music.163.com/api/search/pc";
		let data = {
			s: search,
			limit: limit,
			offset: offset,
			type: type
		};

		return new Promise((resolve, reject) => {
			request.post({
				url: api,
				form: data
			}, (e, r, body) => {
				if (e) return reject(e);
				let d = JSON.parse(body);
				if (d.code == 200)
					resolve(d);
				else
					reject(d);
			});
		});
	}
}

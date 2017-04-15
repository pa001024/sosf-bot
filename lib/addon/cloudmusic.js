import request from 'request';
import { enCryptoNE, genRandom } from './necryp';

// 网易云音乐 MP3URL解析
export class CloudMusic {
	/**
		获取mp3地址
		retrun Promise<Object>: {
			data: { url, id, br, size, md5 },
			code = 200
		}
	*/
	static getDownload(id, br = 96000) {
		let api = `http://music.163.com/api/song/enhance/download/url?br=${br}&id=${id}`;

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
		获取mp3地址
		retrun Promise<Object>: {
			data: [{ url, id, br, size, md5, code = 200 }]
		}
	*/
	static getURL(ids) {
		let api = "http://music.163.com/weapi/song/enhance/player/url";
		let data = enCryptoNE({
			ids: JSON.stringify(ids),
			br: 96000, // bitrate
			csrf_token: genRandom(32)
		});

		return new Promise((resolve, reject) => {
			request.post({url: api, form: data}, (e, r, body) => {
				if (e) return reject(e);
				if (body) return resolve(JSON.parse(body));
			});
		});
	}
	/**
		获取歌曲信息
		retrun Promise<Object>: {
			songs: [{
				name, id,
				artists: [{ name, id, picUrl, alias, trans }],
				album: { name, id, picUrl, alias, trans },
			}],
			code = 200
		}
	*/
	static getInfo(ids) {
		let api = `http://music.163.com/api/song/detail/?ids=${JSON.stringify(ids)}`;

		return new Promise((resolve,reject) => {
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
		获取歌词信息
		retrun Promise<Object>: { lrc, tlytic, code = 200 }
	*/
	static getLyric(id) {
		// let api = "http://music.163.com/api/song/media?id="+id;
		let api = "http://music.163.com/api/song/lyric?lv=-1&tv=-1&kv=-1&id="+id; // kv=1?

		return new Promise((resolve,reject) => {
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
	static search(s, limit = 1, offset = 0, type = 1) {
		let data = s;
		if (typeof data != "object") data = { s: s, limit: limit, offset: offset, type: type };
		const api = "http://music.163.com/api/search/pc";

		return new Promise((resolve, reject) => {
			request.post({ url: api, form: data }, (e, r, body) => {
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


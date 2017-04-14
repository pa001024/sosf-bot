
import { LrcParser } from './lib/addon';


let json = '{"sgc":false,"sfy":true,"qfy":false,"transUser":{"id":29418288,"status":0,"demand":1,"userid":55886391,"nickname":"RainbowO3","uptime":1434769919176},"lyricUser":{"id":29418288,"status":0,"demand":0,"userid":67492924,"nickname":"狞狡","uptime":1433490199910},"lrc":{"version":7,"lyric":"[00:13.00]Step through the gate into Utopia\\n[00:18.89]Sink into a world of Melodia\\n[00:24.03]Black lace\\n[00:27.99]Euphoberia hurries away\\n[00:32.25]Tiny legs\\n[00:33.26]Leaves behind a track of cardioid\\n[00:37.91]Twisted creation\\n[00:40.54]Phosphorescent apparition\\n[00:43.26]Heart disorientation\\n[00:46.20]Bemusement\\n[00:48.88]Merry go ‘round and around\\n[00:51.61]Misery go ‘round and around\\n[00:53.30]Quandary go ‘round and around\\n[00:54.98]Merry go ‘round and around\\n[00:56.45]Tick-tock\\n[00:57.21]Time doesn’t stop\\n[01:01.09]Prepare your doubts\\n[01:03.16]Eat them up\\n[01:06.22]Quaff down\\n[01:07.12]The pass of thoughts\\n[01:09.05]Red sand flows out\\n[01:10.97]Sweet mouth\\n[01:13.26]The sky is painted in Lunacia\\n[01:18.49]Florets slashed open the rain of tears\\n[01:23.81]Misfortuna\\n[01:25.99]There is no escape, my dear\\n[01:32.10]The world undergoes Photosynthesia\\n[01:40.32]Transform endless anger to Ecstasia\\n[01:45.74]Connect your nerves\\n[01:48.26]To the system of Philosophiofantasia\\n"},"klyric":{"version":0},"tlyric":{"version":1,"lyric":"[by:RainbowO3]\\n[00:13.00]踏入乌托邦的大门\\n[00:18.89]沉入旋律的某种世界\\n[00:24.03]黑色花边\\n[00:27.99]千足虫匆忙跑开\\n[00:32.25]细小足肢\\n[00:33.26]留下心形线的轨迹\\n[00:37.91]交错的造物\\n[00:40.54]磷光的幽影\\n[00:43.26]迷乱的心向\\n[00:46.20]令人不解\\n[00:48.88]愉悦转啊又转\\n[00:51.61]悲伤转啊又转\\n[00:53.30]迷惑转啊又转\\n[00:54.98]愉悦转啊又转\\n[00:56.45]嘀嗒\\n[00:57.21]时间不止歇\\n[01:01.09]整理疑惑\\n[01:03.16]再吃下\\n[01:06.22]痛饮\\n[01:07.12]思想的腐液\\n[01:09.05]红砂流出\\n[01:10.97]甜美嘴边\\n[01:13.26]天空以月光染色\\n[01:18.49]碎花将泪藤斫开\\n[01:23.81]背时欠运\\n[01:25.99]无处可逃\\n[01:32.10]世界被光合作用\\n[01:40.32]将怨怒化为狂热\\n[01:45.74]将你的神经\\n[01:48.26]与贤者的幻想相连\\n"},"code":200}';

let lrc = JSON.parse(json);

let lrcList = [];
["lrc", "tlyric", "klyric"].forEach(v => lrc[v].lyric && lrcList.push(lrc[v].lyric));
let player = new LrcParser(lrcList);
player.on('start', (time, txts) => {
	console.log(time, txts);
});
player.on('update', (time, txts) => {
	console.log(time, txts);
});
player.on('end', () => {
	console.log("end");
});
player.play();

process.openStdin();
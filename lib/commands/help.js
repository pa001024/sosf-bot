const Command = require("../command.js");
const Discord = require("discord.js");

module.exports = new Command({
	name: "help",
	alias: ["指令列表", "ls", "?", "list"],
	desc: "显示指令列表",
	fn: (cbody, msg, app) => {
		if (cbody.trim() == "api") {
			let ch = new Discord.RichEmbed();
			ch.setTitle("第三方API列表(page 1/2)");
			ch.setDescription("提供: 小豆机器人")
			ch.setColor(0x9B73E2);
			ch.addField("报时", "msg=报时");
			ch.addField("每日一句", "msg=每日一句");
			ch.addField("抽签", "msg=抽签");
			ch.addField("猜谜", "msg=猜谜");
			ch.addField("笑话", "msg=笑话");
			ch.addField("糗事", "msg=糗事");
			ch.addField("QQ吉凶", "msg=QQ号(例如：msg=94113786)");
			ch.addField("md5加密", "msg=md5+空格+欲加密的内容(例如：md5加密admin)");
			ch.addField("计算", "msg=计算13-2");
			ch.addField("空气质量", "msg=城市名+空气质量(例如：msg=厦门空气质量)");
			ch.addField("天气", "msg=城市名+天气(例如：msg=厦门天气)");
			ch.addField("身份证", "msg=身份证号(例如：msg=330282197908022538)");
			ch.addField("ip查询", "msg=ip地址(例如：msg=112.64.235.86)");
			ch.addField("手机归属地", "msg=手机号(例如：msg=13838383838)");
			ch.addField("汉字转拼音", "msg=拼音+欲转的汉字(例如：msg=拼音小豆)");
			ch.addField("查快递", "msg=快递+单号(例如：msg=快递1106279322505)");
			ch.addField("藏头诗", "msg=藏头诗+开头的字(例如：藏头诗我为秋香)");
			ch.addField("翻译", "汉译英 msg=翻译+中文(例如：msg=翻译我爱你)");
			ch.addField("一言", "msg=一言(例如：msg=一言)");
			msg.author.sendEmbed(ch);

			let ch2 = new Discord.RichEmbed();
			ch2.setTitle("第三方API列表(page 2/2)");
			ch2.setDescription("提供: 小豆机器人")
			ch2.setColor(0x9B73E2);
			ch2.addField("银行卡", "msg=银行卡+卡号(例如：msg=银行卡6228481552887309119)");
			ch2.addField("人民币数字转大写", "msg=大写+数字(例如：msg=大写1542)");
			ch2.addField("人品", "msg=人品+姓名(例如：msg=人品刘小虎)");
			ch2.addField("磁力链接", "msg=磁力+电影名称(例如：msg=磁力变形金刚)");
			ch2.addField("周公解梦", "msg=梦见+梦中的事物(msg=梦见结婚)");
			ch2.addField("新华字典", "msg=字典+汉字(例如：msg=字典豆)");
			ch2.addField("汉语词典", "msg=词典+汉字(例如：msg=词典小豆)");
			ch2.addField("成语词典", "msg=成语+汉字(例如：msg=成语大智若愚)");
			ch2.addField("音乐下载", "msg=点歌+歌名(例如：msg=点歌小苹果)");
			ch2.addField("查歌词", "msg=歌词+歌名(例如：msg=歌词小苹果)");
			ch2.addField("疾病症状", "msg=疾病名+症状(例如：msg=感冒症状)");
			ch2.addField("疾病病因", "msg=疾病名+病因(例如：msg=感冒病因)");
			ch2.addField("疾病治疗", "msg=疾病名+怎么治疗(例如：msg=感冒怎么治疗)");
			ch2.addField("菜谱查询", "msg=菜名+的做法(例如：msg=豆沙包的做法)");
			ch2.addField("百科查询", "msg=什么是+名词(例如：msg=什么是机器人)");
			ch2.addField("历史上的今天", "msg=历史上的今天");
			ch2.addField("百家姓", "msg=李");
			ch2.addField("知道问答", "msg=***的原因 或 为什么***(例如：msg=引起头晕的原因 或者 msg=为什么我的电脑很卡)");
			ch2.addField("电影下载", "msg=电影+影片名(例如：msg=电影疯狂动物城)");
			ch2.addField("短网址转换", "msg=短网址+网页地址(例如：msg=短网址http://xxx)");
			ch2.addField("脑筋急转弯", "msg=脑筋急转弯(例如：msg=脑筋急转弯)");
			msg.author.sendEmbed(ch2);
		} else {
			let ch = new Discord.RichEmbed();
			ch.setTitle("指令列表");
			ch.setDescription(`使用方式: ${app.config.prefix.cmd}指令 [参数]`)
			ch.setColor(0x2095F0);
			ch.setFooter("查看第三方API指令请输入help api");
			for (var i in app.commands) {
				if (i == app.commands[i].name)
					ch.addField(i, `${app.commands[i].desc} (aka. ${app.commands[i].alias.join("/")}`);
			}
			msg.author.sendEmbed(ch);
		}
		if (msg.guild != null)
			msg.reply("已通过私聊发送帮助信息");
		return true;
	},
});
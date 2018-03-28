module.exports = {
    name: "小咸鱼",
    // 在 https://discordapp.com/developers/applications/me 下可以获取
    clientId: "2975*********784",
    token: "Mjk3NTg1NzIw******************2YZGKOelm4c-18",
	activityType: "LISTENING", // PLAYING,STREAMING,LISTENING,WATCHING
	activityName: "你说话 | --help",

    prefix: {
        // 全部信息的前缀 一般不使用
        main: "",
        // TTS功能的前缀
        tts: "",
        // 指令前缀
        cmd: "--",
        // 称呼
        chat: ["小咸鱼", "咸鱼", "fish"],
    },

    // 正常对话时的回复率 当加上称呼时无视本选项
    replyRate: 0.2,
    
	// 自动删除生效的指令的时间(需要"管理信息"权限) 0为不删除
	deleteOriginCommandDelay: 0,
	// 自动删除回复的时间 0为不删除
    deleteReplyDelay: 0,
    
    chat_api: "http://api.d****************************TkE4QUFBPT0&msg=<MSG>",
};

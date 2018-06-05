export interface TTSManager {
    text2Speech(txt: string): string;
}

export class BaiduTTSManager {
    /** 发音人选择, 0为女声，1为男声，3为情感合成-度逍遥，4为情感合成-度丫丫，默认为普通女声 */
    ttsPerson = 0;
    /** 速度 */
    ttsSpeed = 7;
    /** 语调 */
    ttsPitch = 5;
    /** 大小 */
    ttsVol = 5;

    text2Speech(txt: string): string {
        const api_base = `http://tts.baidu.com/text2audio?per=${this.ttsPerson}&idx=1&cuid=baidu_speech_demo&cod=2&lan=zh&ctp=1&pdt=1&spd=${this.ttsSpeed}&vol=${this.ttsVol}&pit=${this.ttsPitch}&tex=`;
        return api_base + encodeURI(txt);
    }
}
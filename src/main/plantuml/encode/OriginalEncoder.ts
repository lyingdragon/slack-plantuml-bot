/**
 * PlantUMLの変換サイトで使っている「よくわからないエンコード方式」を移植したもの。
 */
export default class OriginalEncoder {

    public encode64(data: string) {
        let r: string = '';
        for (let i = 0; i < data.length; i += 3) {
            let codes: number[] = [data.charCodeAt(i), 0, 0];
            if (i == data.length - 1) {
            } else if (i == data.length - 2) {
                codes[1] = data.charCodeAt(i + 1);
            } else {
                codes[1] = data.charCodeAt(i + 1);
                codes[2] = data.charCodeAt(i + 2);
            }
            r += this.append3bytes(codes);
        }
        return r;
    }

    private append3bytes(codes: number[]) {
        const c1 = codes[0] >> 2;
        const c2 = ((codes[0] & 0x3) << 4) | (codes[1] >> 4);
        const c3 = ((codes[1] & 0xF) << 2) | (codes[2] >> 6);
        const c4 = codes[2] & 0x3F;
        let r = "";
        r += this.encode6bit(c1 & 0x3F);
        r += this.encode6bit(c2 & 0x3F);
        r += this.encode6bit(c3 & 0x3F);
        r += this.encode6bit(c4 & 0x3F);
        return r;
    }

    private encode6bit(b: number) {
        if (b < 10) return String.fromCharCode(48 + b);
        b -= 10;
        if (b < 26) return String.fromCharCode(65 + b);
        b -= 26;
        if (b < 26) return String.fromCharCode(97 + b);
        b -= 26;
        if (b == 0) return '-';
        if (b == 1) return '_';
        return '?';
    }
}

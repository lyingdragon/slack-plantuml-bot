/**
 * PlantUMLの変換サイトで使っている「よくわからないエンコード方式」を移植したもの。
 */
export default class OriginalEncoder {

    public encode64(data: string) {
        let result: string = '';
        for (let i = 0; i < data.length; i += 3) {
            const max = (i < data.length) ? data.length - i : 3;
            let codes = [0, 0, 0];
            for (let j = 0; j < max; j++) {
                codes[j] = data.charCodeAt(i + j);
            }
            result += this.append3bytes(codes);
        }
        return result;
    }

    private append3bytes(codes: number[]) {
        let bitArray: number[] = [
            codes[0] >> 2,
            ((codes[0] & 0x3) << 4) | (codes[1] >> 4),
            ((codes[1] & 0xF) << 2) | (codes[2] >> 6),
            codes[2] & 0x3F
        ];
        let result = '';
        for (let i = 0; i < bitArray.length; i++) {
            result += this.encode6bit(bitArray[i] & 0x3F);
        }
        return result;
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

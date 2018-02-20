var OriginalEncoder = (function () {
    function OriginalEncoder() {
    }
    OriginalEncoder.prototype.encode64 = function (data) {
        var result = '';
        for (var i = 0; i < data.length; i += 3) {
            var max = (i < data.length) ? data.length - i : 3;
            var codes = Array(3);
            for (var j = 0; j < max; j++) {
                codes[j] = data.charCodeAt(i + j);
            }
            result += this.append3bytes(codes);
        }
        return result;
    };
    OriginalEncoder.prototype.append3bytes = function (codes) {
        var bitArray = [
            codes[0] >> 2,
            ((codes[0] & 0x3) << 4) | (codes[1] >> 4),
            ((codes[1] & 0xF) << 2) | (codes[2] >> 6),
            codes[2] & 0x3F
        ];
        var result = '';
        for (var i = 0; i < bitArray.length; i++) {
            result += this.encode6bit(bitArray[i] & 0x3F);
        }
        return result;
    };
    OriginalEncoder.prototype.encode6bit = function (baseCode) {
        var code = baseCode;
        if (code < 10)
            return String.fromCharCode(48 + code);
        code -= 10;
        if (code < 26)
            return String.fromCharCode(65 + code);
        code -= 26;
        if (code < 26)
            return String.fromCharCode(97 + code);
        code -= 26;
        if (code == 0)
            return '-';
        if (code == 1)
            return '_';
        return '?';
    };
    return OriginalEncoder;
}());
export default OriginalEncoder;
//# sourceMappingURL=OriginalEncoder.js.map
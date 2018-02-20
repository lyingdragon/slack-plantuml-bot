var DeflateBuffer = (function () {
    function DeflateBuffer() {
        this._next = null;
        this._len = 0;
        this._ptr = new Array(1024 * 8);
        this._off = 0;
    }
    Object.defineProperty(DeflateBuffer.prototype, "next", {
        get: function () {
            return this._next;
        },
        set: function (value) {
            this._next = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DeflateBuffer.prototype, "len", {
        get: function () {
            return this._len;
        },
        set: function (value) {
            this._len = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DeflateBuffer.prototype, "ptr", {
        get: function () {
            return this._ptr;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DeflateBuffer.prototype, "off", {
        get: function () {
            return this._off;
        },
        set: function (value) {
            this._off = value;
        },
        enumerable: true,
        configurable: true
    });
    return DeflateBuffer;
}());
export default DeflateBuffer;
//# sourceMappingURL=DeflateBuffer.js.map
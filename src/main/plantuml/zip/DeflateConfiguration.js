var DeflateConfiguration = (function () {
    function DeflateConfiguration(a, b, c, d) {
        this._goodLength = a;
        this._maxLazy = b;
        this._niceLength = c;
        this._maxChain = d;
    }
    Object.defineProperty(DeflateConfiguration.prototype, "max_chain", {
        get: function () {
            return this._maxChain;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DeflateConfiguration.prototype, "nice_length", {
        get: function () {
            return this._niceLength;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DeflateConfiguration.prototype, "max_lazy", {
        get: function () {
            return this._maxLazy;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DeflateConfiguration.prototype, "good_length", {
        get: function () {
            return this._goodLength;
        },
        enumerable: true,
        configurable: true
    });
    return DeflateConfiguration;
}());
export default DeflateConfiguration;
//# sourceMappingURL=DeflateConfiguration.js.map
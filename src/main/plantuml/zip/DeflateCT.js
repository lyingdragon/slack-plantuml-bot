var DeflateCT = (function () {
    function DeflateCT() {
        this._fc = 0;
        this._dl = 0;
    }
    Object.defineProperty(DeflateCT.prototype, "fc", {
        get: function () {
            return this._fc;
        },
        set: function (value) {
            this._fc = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DeflateCT.prototype, "dl", {
        get: function () {
            return this._dl;
        },
        set: function (value) {
            this._dl = value;
        },
        enumerable: true,
        configurable: true
    });
    return DeflateCT;
}());
export default DeflateCT;
//# sourceMappingURL=DeflateCT.js.map
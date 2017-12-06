export default class DeflateConfiguration {

    private readonly _maxChain: number; // reduce lazy search above this match length
    private readonly _niceLength: number; // do not perform lazy search above this match length
    private readonly _maxLazy: number; // quit search above this match length
    private readonly _goodLength: number;

    get max_chain(): number {
        return this._maxChain;
    }

    get nice_length():number {
        return this._niceLength;
    }

    get max_lazy():number {
        return this._maxLazy;
    }

    get good_length():number {
        return this._goodLength;
    }

    constructor(a: number, b: number, c: number, d: number) {
        this._goodLength = a;
        this._maxLazy = b;
        this._niceLength = c;
        this._maxChain = d;
    }

}
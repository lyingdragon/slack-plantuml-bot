export default class DeflateCT {

    private _fc: number;
    private _dl: number;

    constructor() {
        this._fc = 0; // frequency count or bit string
        this._dl = 0; // father node in Huffman tree or length of bit string
    }

    get fc(): number {
        return this._fc;
    }
    get dl(): number {
        return this._dl;
    }
    set fc(value: number) {
        this._fc = value;
    }
    set dl(value: number) {
        this._dl = value;
    }

}
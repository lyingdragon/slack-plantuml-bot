export default class DeflateConfiguration {
    public readonly max_chain: number; // reduce lazy search above this match length
    public readonly nice_length: number; // do not perform lazy search above this match length
    public readonly max_lazy: number; // quit search above this match length
    public readonly good_length: number;

    constructor(a: number, b: number, c: number, d: number) {
        this.good_length = a;
        this.max_lazy = b;
        this.nice_length = c;
        this.max_chain = d;
    }

}
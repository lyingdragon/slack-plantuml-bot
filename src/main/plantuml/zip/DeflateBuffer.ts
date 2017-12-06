export default class DeflateBuffer {

    private _next: DeflateBuffer | null = null;
    private _len: number = 0;
    private _ptr = new Array(1024 * 8);
    private _off: number = 0;

    get next(): DeflateBuffer | null {
        return this._next;
    }
    get len(): number {
        return this._len;
    }
    get ptr() {
        return this._ptr;
    }
    get off(): number {
        return this._off;
    }

    set next(value: DeflateBuffer | null) {
        this._next = value;
    }
    set len(value: number) {
        this._len = value;
    }
    set off(value: number) {
        this._off = value;
    }

}
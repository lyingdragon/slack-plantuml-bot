// http://s.plantuml.com/synchro.js のTypeScriptへの移植。

class zip_DeflateCT {

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

class zip_DeflateBuffer {

    private _next: zip_DeflateBuffer | null = null;
    private _len: number = 0;
    private _ptr = new Array(1024 * 8);
    private _off: number = 0;

    get next(): zip_DeflateBuffer | null {
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

    set next(value: zip_DeflateBuffer | null) {
        this._next = value;
    }
    set len(value: number) {
        this._len = value;
    }
    set off(value: number) {
        this._off = value;
    }

}

class zip_DeflateTreeDesc {
    public dyn_tree: Array<zip_DeflateCT>;	// the dynamic tree
    public static_tree: Array<zip_DeflateCT> | null;	// corresponding static tree or NULL
    public extra_bits: Array<number>;	// extra bits for each code or NULL
    public extra_base = 0;	// base index for extra_bits
    public elems = 0;		// max number of elements in the tree
    public max_length = 0;	// max bit length for the codes
    public max_code = 0;		// largest code with non zero frequency
}

class zip_DeflateConfiguration {
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

export default class OriginalZip {

    /* constant parameters */
    private readonly DEFAULT_LEVEL: number = 6;
    private readonly zip_WSIZE: number = 32768;		// Sliding Window size
    private readonly zip_STORED_BLOCK: number = 0;
    private readonly zip_STATIC_TREES: number = 1;
    private readonly zip_DYN_TREES: number = 2;

    /* for deflate */
    private readonly zip_FULL_SEARCH = true;
    private readonly zip_INBUFSIZ: number = 32768;	// Input buffer size
    private readonly zip_INBUF_EXTRA: number = 64;	// Extra buffer
    private readonly zip_OUTBUFSIZ: number = 1024 * 8;
    private readonly zip_window_size: number = 2 * this.zip_WSIZE;
    private readonly zip_MIN_MATCH: number = 3;
    private readonly zip_MAX_MATCH: number = 258;
    private readonly zip_BITS: number = 16;
    // for SMALL_MEM
    private readonly zip_LIT_BUFSIZE = 0x2000;
    private readonly zip_HASH_BITS: number = 13;
    // for MEDIUM_MEM
    private readonly zip_DIST_BUFSIZE: number = this.zip_LIT_BUFSIZE;
    private readonly zip_HASH_SIZE: number = 1 << this.zip_HASH_BITS;
    private readonly zip_HASH_MASK: number = this.zip_HASH_SIZE - 1;
    private readonly zip_WMASK: number = this.zip_WSIZE - 1;
    private readonly zip_NIL: number = 0; // Tail of hash chains
    private readonly zip_TOO_FAR: number = 4096;
    private readonly zip_MIN_LOOKAHEAD: number = this.zip_MAX_MATCH + this.zip_MIN_MATCH + 1;
    private readonly zip_MAX_DIST: number = this.zip_WSIZE - this.zip_MIN_LOOKAHEAD;
    private readonly zip_SMALLEST: number = 1;
    private readonly zip_MAX_BITS: number = 15;
    private readonly zip_MAX_BL_BITS: number = 7;
    private readonly zip_LENGTH_CODES: number = 29;
    private readonly zip_LITERALS: number = 256;
    private readonly zip_END_BLOCK: number = 256;
    private readonly zip_L_CODES: number = this.zip_LITERALS + 1 + this.zip_LENGTH_CODES;
    private readonly zip_D_CODES: number = 30;
    private readonly zip_BL_CODES: number = 19;
    private readonly zip_REP_3_6: number = 16;
    private readonly zip_REPZ_3_10: number = 17;
    private readonly zip_REPZ_11_138: number = 18;
    private readonly zip_HEAP_SIZE: number = 2 * this.zip_L_CODES + 1;
    private readonly zip_H_SHIFT: number = (this.zip_HASH_BITS + this.zip_MIN_MATCH - 1) / this.zip_MIN_MATCH;

    /* private readonly iables */
    private zip_free_queue: zip_DeflateBuffer | null;
    private zip_qhead: zip_DeflateBuffer | null;
    private zip_qtail: zip_DeflateBuffer;
    private zip_initflag: boolean;
    private zip_outbuf: Array<number>;
    private zip_outcnt: number;
    private zip_outoff: number;
    private zip_complete: boolean;
    private zip_window: Array<number>;
    private zip_d_buf: Array<number>;
    private zip_l_buf: Array<number>;
    private zip_prev: Array<number>;
    private zip_bi_buf: number;
    private zip_bi_valid: number;
    private zip_block_start: number;
    private zip_ins_h: number;
    private zip_hash_head: number;
    private zip_prev_match: number;  // TODO 在るメソッドでしか使ってない疑惑(method privateに出来そう)
    private zip_match_available: number;
    private zip_match_length: number;
    private zip_prev_length: number;
    private zip_strstart: number;
    private zip_match_start: number;
    private zip_eofile: boolean;
    private zip_lookahead: number;

    private zip_max_chain_length: number;
    private zip_max_lazy_match: number;
    private zip_good_match: number;
    private zip_nice_match: number;

    private zip_compr_level: number;
    private zip_dyn_ltree: Array<zip_DeflateCT>;
    private zip_dyn_dtree: Array<zip_DeflateCT>;
    private zip_static_ltree: Array<zip_DeflateCT>;
    private zip_static_dtree: Array<zip_DeflateCT>;
    private zip_bl_tree: Array<zip_DeflateCT>;
    private zip_l_desc: zip_DeflateTreeDesc;
    private zip_d_desc: zip_DeflateTreeDesc;
    private zip_bl_desc: zip_DeflateTreeDesc;
    private zip_bl_count: Array<number>;
    private zip_heap: Array<number>;
    private zip_heap_len: number;
    private zip_heap_max: number;
    private zip_depth: Array<number>;
    private zip_length_code: Array<number>;
    private zip_dist_code: Array<number>;
    private zip_base_length: Array<number>;
    private zip_base_dist: Array<number>;
    private zip_flag_buf: Array<number>;
    private zip_last_lit: number;
    private zip_last_dist: number;
    private zip_last_flags: number;
    private zip_flags: number;
    private zip_flag_bit: number;
    private zip_opt_len: number;
    private zip_static_len: number;
    private zip_deflate_data: string;
    private zip_deflate_pos: number;

    /* constant tables */
    private readonly zip_extra_lbits = new Array(0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0);
    private readonly zip_extra_dbits = new Array(0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13);
    private readonly zip_extra_blbits = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7);
    private readonly zip_bl_order = new Array(16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15);

    private readonly zip_configuration_table = new Array(
        new zip_DeflateConfiguration(0, 0, 0, 0),
        new zip_DeflateConfiguration(4, 4, 8, 4),
        new zip_DeflateConfiguration(4, 5, 16, 8),
        new zip_DeflateConfiguration(4, 6, 32, 32),
        new zip_DeflateConfiguration(4, 4, 16, 16),
        new zip_DeflateConfiguration(8, 16, 32, 32),
        new zip_DeflateConfiguration(8, 16, 128, 128),
        new zip_DeflateConfiguration(8, 32, 128, 256),
        new zip_DeflateConfiguration(32, 128, 258, 1024),
        new zip_DeflateConfiguration(32, 258, 258, 4096));

    public deflate = (str: string, level: number): string => {
        this.zip_deflate_data = str;
        this.zip_deflate_pos = 0;
        if (level == undefined) level = this.DEFAULT_LEVEL;
        this.zip_deflate_start(level);

        const buff: Array<number> = new Array(1024);
        let out = "";
        let i;
        while ((i = this.zip_deflate_internal(buff, 0, buff.length)) > 0) {
            for (let j = 0; j < i; j++) {
                out += String.fromCharCode(buff[j]);
            }
        }
        return out;
    }

    private zip_deflate_start = (level: number) => {
        let i;

        if (!level) level = this.DEFAULT_LEVEL;
        else if (level < 1) level = 1;
        else if (level > 9) level = 9;

        this.zip_compr_level = level;
        this.zip_initflag = false;
        this.zip_eofile = false;

        if (this.zip_outbuf != null) return;

        this.zip_free_queue = this.zip_qhead = null;
        this.zip_outbuf = new Array(this.zip_OUTBUFSIZ);
        this.zip_window = new Array(this.zip_window_size);
        this.zip_d_buf = new Array(this.zip_DIST_BUFSIZE);
        this.zip_l_buf = new Array(this.zip_INBUFSIZ + this.zip_INBUF_EXTRA);
        this.zip_prev = new Array(1 << this.zip_BITS);
        this.zip_dyn_ltree = new Array<zip_DeflateCT>(this.zip_HEAP_SIZE);
        for (i = 0; i < this.zip_HEAP_SIZE; i++)
            this.zip_dyn_ltree[i] = new zip_DeflateCT();
        this.zip_dyn_dtree = new Array(2 * this.zip_D_CODES + 1);
        for (i = 0; i < 2 * this.zip_D_CODES + 1; i++)
            this.zip_dyn_dtree[i] = new zip_DeflateCT();
        this.zip_static_ltree = new Array(this.zip_L_CODES + 2);
        for (i = 0; i < this.zip_L_CODES + 2; i++)
            this.zip_static_ltree[i] = new zip_DeflateCT();
        this.zip_static_dtree = new Array(this.zip_D_CODES);
        for (i = 0; i < this.zip_D_CODES; i++)
            this.zip_static_dtree[i] = new zip_DeflateCT();
        this.zip_bl_tree = new Array(2 * this.zip_BL_CODES + 1);
        for (i = 0; i < 2 * this.zip_BL_CODES + 1; i++)
            this.zip_bl_tree[i] = new zip_DeflateCT();
        this.zip_l_desc = new zip_DeflateTreeDesc();
        this.zip_d_desc = new zip_DeflateTreeDesc();
        this.zip_bl_desc = new zip_DeflateTreeDesc();
        this.zip_bl_count = new Array(this.zip_MAX_BITS + 1);
        this.zip_heap = new Array(2 * this.zip_L_CODES + 1);
        this.zip_depth = new Array(2 * this.zip_L_CODES + 1);
        this.zip_length_code = new Array(this.zip_MAX_MATCH - this.zip_MIN_MATCH + 1);
        this.zip_dist_code = new Array(512);
        this.zip_base_length = new Array(this.zip_LENGTH_CODES);
        this.zip_base_dist = new Array(this.zip_D_CODES);
        this.zip_flag_buf = new Array(this.zip_LIT_BUFSIZE / 8);
    }

    private zip_deflate_internal = (buff: Array<number>, off: number, buff_size: number): number => {
        let n;


        if (!this.zip_initflag) {
            this.zip_init_deflate();
            this.zip_initflag = true;
            if (this.zip_lookahead == 0) { // empty
                this.zip_complete = true;
                return 0;
            }
        }

        if ((n = this.zip_qcopy(buff, off, buff_size)) == buff_size)
            return buff_size;


        if (this.zip_complete) return n;

        if (this.zip_compr_level <= 3) // optimized for speed
            this.zip_deflate_fast();
        else
            this.zip_deflate_better();


        if (this.zip_lookahead == 0) {
            if (this.zip_match_available != 0)
                this.zip_ct_tally(0, this.zip_window[this.zip_strstart - 1] & 0xff);
            this.zip_flush_block(1);
            this.zip_complete = true;
        }


        return n + this.zip_qcopy(buff, n + off, buff_size - n);
    }

    private zip_init_deflate = () => {
        if (this.zip_eofile) return;
        this.zip_bi_buf = 0;
        this.zip_bi_valid = 0;
        this.zip_ct_init();
        this.zip_lm_init();

        this.zip_qhead = null;
        this.zip_outcnt = 0;
        this.zip_outoff = 0;

        if (this.zip_compr_level <= 3) {
            this.zip_prev_length = this.zip_MIN_MATCH - 1;
            this.zip_match_length = 0;
        }
        else {
            this.zip_match_length = this.zip_MIN_MATCH - 1;
            this.zip_match_available = 0;
        }

        this.zip_complete = false;
    }

    private zip_qcopy = (buff: Array<number>, off: number, buff_size: number): number => {
        let n: number;
        let i: number;
        let j: number;


        n = 0;
        while (this.zip_qhead != null && n < buff_size) {
            i = buff_size - n;
            if (i > this.zip_qhead.len)
                i = this.zip_qhead.len;
            //      System.arraycopy(qhead.ptr, qhead.off, buff, off + n, i);
            for (j = 0; j < i; j++)
                buff[off + n + j] = this.zip_qhead.ptr[this.zip_qhead.off + j];

            this.zip_qhead.off += i;
            this.zip_qhead.len -= i;
            n += i;
            if (this.zip_qhead.len == 0) {
                var p;
                p = this.zip_qhead;
                this.zip_qhead = this.zip_qhead.next;
                this.zip_reuse_queue(p);
            }
        }

        if (n == buff_size) return n;

        if (this.zip_outoff < this.zip_outcnt) {
            i = buff_size - n;
            if (i > this.zip_outcnt - this.zip_outoff)
                i = this.zip_outcnt - this.zip_outoff;


            // System.arraycopy(outbuf, outoff, buff, off + n, i);
            for (j = 0; j < i; j++)
                buff[off + n + j] = this.zip_outbuf[this.zip_outoff + j];
            this.zip_outoff += i;
            n += i;
            if (this.zip_outcnt == this.zip_outoff) {
                this.zip_outcnt = this.zip_outoff = 0;
            }
        }
        return n;
    }

    private zip_deflate_fast = () => {
        while (this.zip_lookahead != 0 && this.zip_qhead == null) {
            let flush; // set if current block must be flushed

            this.zip_INSERT_STRING();

            if (this.zip_hash_head != this.zip_NIL &&
                this.zip_strstart - this.zip_hash_head <= this.zip_MAX_DIST) {
                this.zip_match_length = this.zip_longest_match(this.zip_hash_head);
                if (this.zip_match_length > this.zip_lookahead)
                    this.zip_match_length = this.zip_lookahead;
            }
            if (this.zip_match_length >= this.zip_MIN_MATCH) {

                flush = this.zip_ct_tally(
                    this.zip_strstart - this.zip_match_start,
                    this.zip_match_length - this.zip_MIN_MATCH
                );
                this.zip_lookahead -= this.zip_match_length;

                if (this.zip_match_length <= this.zip_max_lazy_match) {
                    this.zip_match_length--; // string at strstart already in hash table
                    do {
                        this.zip_strstart++;
                        this.zip_INSERT_STRING();
                    } while (--this.zip_match_length != 0);
                    this.zip_strstart++;
                } else {
                    this.zip_strstart += this.zip_match_length;
                    this.zip_match_length = 0;
                    this.zip_ins_h = this.zip_window[this.zip_strstart] & 0xff;
                    this.zip_ins_h = ((this.zip_ins_h << this.zip_H_SHIFT) ^ (this.zip_window[this.zip_strstart + 1] & 0xff)) & this.zip_HASH_MASK;
                }
            } else {
                /* No match, output a literal byte */
                flush = this.zip_ct_tally(0, this.zip_window[this.zip_strstart] & 0xff);
                this.zip_lookahead--;
                this.zip_strstart++;
            }
            if (flush) {
                this.zip_flush_block(0);
                this.zip_block_start = this.zip_strstart;
            }

            while (this.zip_lookahead < this.zip_MIN_LOOKAHEAD && !this.zip_eofile)
                this.zip_fill_window();
        }
    }

    private zip_INSERT_STRING = () => {
        this.zip_ins_h = ((this.zip_ins_h << this.zip_H_SHIFT)
            ^ (this.zip_window[this.zip_strstart + this.zip_MIN_MATCH - 1] & 0xff))
            & this.zip_HASH_MASK;
        this.zip_hash_head = this.zip_head1(this.zip_ins_h);
        this.zip_prev[this.zip_strstart & this.zip_WMASK] = this.zip_hash_head;
        this.zip_head2(this.zip_ins_h, this.zip_strstart);
    }
    private zip_head1 = (i: number) => {
        return this.zip_prev[this.zip_WSIZE + i];
    }
    private zip_head2 = (i: number, val: number) => {
        return this.zip_prev[this.zip_WSIZE + i] = val;
    }

    private zip_longest_match = (cur_match: number) => {
        let chain_length: number = this.zip_max_chain_length; // max hash chain length
        let scanp: number = this.zip_strstart; // current string
        let matchp: number;		// matched string
        let len: number;		// length of current match
        let best_len: number = this.zip_prev_length;	// best match length so far

        let limit: number = (this.zip_strstart > this.zip_MAX_DIST ? this.zip_strstart - this.zip_MAX_DIST : this.zip_NIL);

        const strendp: number = this.zip_strstart + this.zip_MAX_MATCH;
        let scan_end1 = this.zip_window[scanp + best_len - 1];
        let scan_end = this.zip_window[scanp + best_len];

        if (this.zip_prev_length >= this.zip_good_match)
            chain_length >>= 2;

        do {
            matchp = cur_match;

            if (this.zip_window[matchp + best_len] != scan_end ||
                this.zip_window[matchp + best_len - 1] != scan_end1 ||
                this.zip_window[matchp] != this.zip_window[scanp] ||
                this.zip_window[++matchp] != this.zip_window[scanp + 1]) {
                continue;
            }

            scanp += 2;
            matchp++;

            do { } while (this.zip_window[++scanp] == this.zip_window[++matchp] &&
                this.zip_window[++scanp] == this.zip_window[++matchp] &&
                this.zip_window[++scanp] == this.zip_window[++matchp] &&
                this.zip_window[++scanp] == this.zip_window[++matchp] &&
                this.zip_window[++scanp] == this.zip_window[++matchp] &&
                this.zip_window[++scanp] == this.zip_window[++matchp] &&
                this.zip_window[++scanp] == this.zip_window[++matchp] &&
                this.zip_window[++scanp] == this.zip_window[++matchp] &&
                scanp < strendp);

            len = this.zip_MAX_MATCH - (strendp - scanp);
            scanp = strendp - this.zip_MAX_MATCH;

            if (len > best_len) {
                this.zip_match_start = cur_match;
                best_len = len;
                if (this.zip_FULL_SEARCH) {
                    if (len >= this.zip_MAX_MATCH) break;
                } else {
                    if (len >= this.zip_nice_match) break;
                }

                scan_end1 = this.zip_window[scanp + best_len - 1];
                scan_end = this.zip_window[scanp + best_len];
            }
        } while ((cur_match = this.zip_prev[cur_match & this.zip_WMASK]) > limit
            && --chain_length != 0);

        return best_len;
    }


    private zip_deflate_better = () => {
        while (this.zip_lookahead != 0 && this.zip_qhead == null) {
            this.zip_INSERT_STRING();

            this.zip_prev_length = this.zip_match_length;
            this.zip_prev_match = this.zip_match_start;
            this.zip_match_length = this.zip_MIN_MATCH - 1;

            if (this.zip_hash_head != this.zip_NIL &&
                this.zip_prev_length < this.zip_max_lazy_match &&
                this.zip_strstart - this.zip_hash_head <= this.zip_MAX_DIST) {

                this.zip_match_length = this.zip_longest_match(this.zip_hash_head);
                if (this.zip_match_length > this.zip_lookahead)
                    this.zip_match_length = this.zip_lookahead;

                if (this.zip_match_length == this.zip_MIN_MATCH &&
                    this.zip_strstart - this.zip_match_start > this.zip_TOO_FAR) {
                    this.zip_match_length--;
                }
            }
            if (this.zip_prev_length >= this.zip_MIN_MATCH &&
                this.zip_match_length <= this.zip_prev_length) {
                let flush; // set if current block must be flushed

                flush = this.zip_ct_tally(this.zip_strstart - 1 - this.zip_prev_match,
                    this.zip_prev_length - this.zip_MIN_MATCH);

                this.zip_lookahead -= this.zip_prev_length - 1;
                this.zip_prev_length -= 2;
                do {
                    this.zip_strstart++;
                    this.zip_INSERT_STRING();
                } while (--this.zip_prev_length != 0);
                this.zip_match_available = 0;
                this.zip_match_length = this.zip_MIN_MATCH - 1;
                this.zip_strstart++;
                if (flush) {
                    this.zip_flush_block(0);
                    this.zip_block_start = this.zip_strstart;
                }
            } else if (this.zip_match_available != 0) {
                if (this.zip_ct_tally(0, this.zip_window[this.zip_strstart - 1] & 0xff)) {
                    this.zip_flush_block(0);
                    this.zip_block_start = this.zip_strstart;
                }
                this.zip_strstart++;
                this.zip_lookahead--;
            } else {
                this.zip_match_available = 1;
                this.zip_strstart++;
                this.zip_lookahead--;
            }

            while (this.zip_lookahead < this.zip_MIN_LOOKAHEAD && !this.zip_eofile)
                this.zip_fill_window();
        }
    }

    /**
     * zip_ct_tally.
     * @param dist distance of matched string.
     * @param lc  match length-MIN_MATCH or unmatched char (if dist==0).
     */
    private zip_ct_tally = (dist: number, lc: number) => {

        
        this.zip_l_buf[this.zip_last_lit++] = lc;


        if (dist == 0) {
            this.zip_dyn_ltree[lc].fc++;
        } else {
            dist--;		    // dist = match distance - 1

            this.zip_dyn_ltree[this.zip_length_code[lc] + this.zip_LITERALS + 1].fc++;
            this.zip_dyn_dtree[this.zip_D_CODE(dist)].fc++;

            this.zip_d_buf[this.zip_last_dist++] = dist;
            this.zip_flags |= this.zip_flag_bit;
        }
        this.zip_flag_bit <<= 1;

        if ((this.zip_last_lit & 7) == 0) {
            this.zip_flag_buf[this.zip_last_flags++] = this.zip_flags;
            this.zip_flags = 0;
            this.zip_flag_bit = 1;
        }
        if (this.zip_compr_level > 2 && (this.zip_last_lit & 0xfff) == 0) {
            let out_length = this.zip_last_lit * 8;
            const in_length = this.zip_strstart - this.zip_block_start;

            for (let dcode = 0; dcode < this.zip_D_CODES; dcode++) {
                out_length += this.zip_dyn_dtree[dcode].fc * (5 + this.zip_extra_dbits[dcode]);
            }
            out_length >>= 3;
            if (this.zip_last_dist < (this.zip_last_lit / 2) && out_length < (in_length / 2)) return true;
        }
        return (this.zip_last_lit == this.zip_LIT_BUFSIZE - 1 ||
            this.zip_last_dist == this.zip_DIST_BUFSIZE);
    }

    private zip_D_CODE = (dist: number) => {
        return (dist < 256 ? this.zip_dist_code[dist]
            : this.zip_dist_code[256 + (dist >> 7)]) & 0xff;
    }


    private zip_ct_init = () => {
        let code: number;	// code value
        let dist: number;	// distance index

        if (this.zip_static_dtree[0].dl != 0) return; // ct_init already called

        const lDesc: zip_DeflateTreeDesc = this.zip_l_desc;
        lDesc.dyn_tree = this.zip_dyn_ltree;
        lDesc.static_tree = this.zip_static_ltree;
        lDesc.extra_bits = this.zip_extra_lbits;
        lDesc.extra_base = this.zip_LITERALS + 1;
        lDesc.elems = this.zip_L_CODES;
        lDesc.max_length = this.zip_MAX_BITS;
        lDesc.max_code = 0;

        this.zip_d_desc.dyn_tree = this.zip_dyn_dtree;
        this.zip_d_desc.static_tree = this.zip_static_dtree;
        this.zip_d_desc.extra_bits = this.zip_extra_dbits;
        this.zip_d_desc.extra_base = 0;
        this.zip_d_desc.elems = this.zip_D_CODES;
        this.zip_d_desc.max_length = this.zip_MAX_BITS;
        this.zip_d_desc.max_code = 0;

        this.zip_bl_desc.dyn_tree = this.zip_bl_tree;
        this.zip_bl_desc.static_tree = null;
        this.zip_bl_desc.extra_bits = this.zip_extra_blbits;
        this.zip_bl_desc.extra_base = 0;
        this.zip_bl_desc.elems = this.zip_BL_CODES;
        this.zip_bl_desc.max_length = this.zip_MAX_BL_BITS;
        this.zip_bl_desc.max_code = 0;

        let length = 0;
        for (code = 0; code < this.zip_LENGTH_CODES - 1; code++) {
            this.zip_base_length[code] = length;
            for (let n = 0; n < (1 << this.zip_extra_lbits[code]); n++)
                this.zip_length_code[length++] = code;
        }
        this.zip_length_code[length - 1] = code;

        dist = 0;
        for (code = 0; code < 16; code++) {
            this.zip_base_dist[code] = dist;
            for (let n = 0; n < (1 << this.zip_extra_dbits[code]); n++) {
                this.zip_dist_code[dist++] = code;
            }
        }
        dist >>= 7; // from now on, all distances are divided by 128
        for (; code < this.zip_D_CODES; code++) {
            this.zip_base_dist[code] = dist << 7;
            for (let n = 0; n < (1 << (this.zip_extra_dbits[code] - 7)); n++)
                this.zip_dist_code[256 + dist++] = code;
        }

        for (let bits = 0; bits <= this.zip_MAX_BITS; bits++)
            this.zip_bl_count[bits] = 0;
        let n = 0;
        while (n <= 143) { this.zip_static_ltree[n++].dl = 8; this.zip_bl_count[8]++; }
        while (n <= 255) { this.zip_static_ltree[n++].dl = 9; this.zip_bl_count[9]++; }
        while (n <= 279) { this.zip_static_ltree[n++].dl = 7; this.zip_bl_count[7]++; }
        while (n <= 287) { this.zip_static_ltree[n++].dl = 8; this.zip_bl_count[8]++; }

        this.zip_gen_codes(this.zip_static_ltree, this.zip_L_CODES + 1);

        /* The static distance tree is trivial: */
        for (n = 0; n < this.zip_D_CODES; n++) {
            this.zip_static_dtree[n].dl = 5;
            this.zip_static_dtree[n].fc = this.zip_bi_reverse(n, 5);
        }

        // Initialize the first block of the first file:
	    this.zip_init_block();
        
    }

    /**
     * zip_gen_codes.
     * @param tree the tree to decorate.
     * @param max_code largest code with non zero frequency.
     */
    private zip_gen_codes = (tree: Array<zip_DeflateCT>, max_code: number) => {
        const next_code = new Array(this.zip_MAX_BITS + 1); // next code value for each bit length
        let code = 0;		// running code value

        for (let bits = 1; bits <= this.zip_MAX_BITS; bits++) {
            code = ((code + this.zip_bl_count[bits - 1]) << 1);
            next_code[bits] = code;
        }

        for (let n = 0; n <= max_code; n++) {
            let len = tree[n].dl;
            if (len == 0)
                continue;
            // Now reverse the bits
            tree[n].fc = this.zip_bi_reverse(next_code[len]++, len);
        }
    }

    /**
     * zip_bi_reverse.
     * @param code the value to invert.
     * @param len its bit length.
     */
    private zip_bi_reverse = (code: number, len: number) => {
        let res = 0;
        do {
            res |= code & 1;
            code >>= 1;
            res <<= 1;
        } while (--len > 0);
        return res >> 1;
    }

    /**
     * @number true if this is the last block for a file
     */
    private zip_flush_block = (eof: number) => {

        
        let stored_len = this.zip_strstart - this.zip_block_start;	// length of input block
        this.zip_flag_buf[this.zip_last_flags] = this.zip_flags; // Save the flags for the last 8 items


        this.zip_build_tree(this.zip_l_desc);
        this.zip_build_tree(this.zip_d_desc);

        const max_blindex = this.zip_build_bl_tree(); // index of last bit length code of non zero freq

        
        let opt_lenb = (this.zip_opt_len + 3 + 7) >> 3;
        const static_lenb = (this.zip_static_len + 3 + 7) >> 3; // opt_len and static_len in bytes

        if (static_lenb <= opt_lenb)
            opt_lenb = static_lenb;
        if (stored_len + 4 <= opt_lenb // 4: two words for the lengths
            && this.zip_block_start >= 0) {
            let i;

            this.zip_send_bits((this.zip_STORED_BLOCK << 1) + eof, 3);  /* send block type */
            this.zip_bi_windup();		 /* align on byte boundary */
            this.zip_put_short(stored_len);
            this.zip_put_short(~stored_len);

            for (i = 0; i < stored_len; i++)
                this.zip_put_byte(this.zip_window[this.zip_block_start + i]);

        } else if (static_lenb == opt_lenb) {
            this.zip_send_bits((this.zip_STATIC_TREES << 1) + eof, 3);
            this.zip_compress_block(this.zip_static_ltree, this.zip_static_dtree);
        } else {

            
            this.zip_send_bits((this.zip_DYN_TREES << 1) + eof, 3);
            this.zip_send_all_trees(this.zip_l_desc.max_code + 1,
                this.zip_d_desc.max_code + 1,
                max_blindex + 1);
            this.zip_compress_block(this.zip_dyn_ltree, this.zip_dyn_dtree);
        }

        this.zip_init_block();

        if (eof != 0) this.zip_bi_windup();
    }

    /**
     * zip_send_bits.
     * @param value value to send. 
     * @param length  number of bits.
     */
    private zip_send_bits = (value: number, length: number) => {


        const BUF_SIZE = 16; // bit size of bi_buf
        if (this.zip_bi_valid > BUF_SIZE - length) {
            this.zip_bi_buf |= (value << this.zip_bi_valid);
            this.zip_put_short(this.zip_bi_buf);
            this.zip_bi_buf = (value >> (BUF_SIZE - this.zip_bi_valid));
            this.zip_bi_valid += length - BUF_SIZE;
        } else {
            this.zip_bi_buf |= value << this.zip_bi_valid;
            this.zip_bi_valid += length;
        }
    }

    private zip_bi_windup = () => {
        if (this.zip_bi_valid > 8) {
            this.zip_put_short(this.zip_bi_buf);
        } else if (this.zip_bi_valid > 0) {
            this.zip_put_byte(this.zip_bi_buf);
        }
        this.zip_bi_buf = 0;
        this.zip_bi_valid = 0;
    }

    private zip_put_short = (w: number) => {


        w &= 0xffff;
        if (this.zip_outoff + this.zip_outcnt < this.zip_OUTBUFSIZ - 2) {
            this.zip_outbuf[this.zip_outoff + this.zip_outcnt++] = (w & 0xff);
            this.zip_outbuf[this.zip_outoff + this.zip_outcnt++] = (w >>> 8);
        } else {
            this.zip_put_byte(w & 0xff);
            this.zip_put_byte(w >>> 8);
        }
    }

    private zip_put_byte = (c: number) => {
        this.zip_outbuf[this.zip_outoff + this.zip_outcnt++] = c;
        if (this.zip_outoff + this.zip_outcnt == this.zip_OUTBUFSIZ)
            this.zip_qoutbuf();
    }

    /**
     * zip_compress_block.
     * @param ltree literal tree. 
     * @param dtree distance tree.
     */
    private zip_compress_block = (ltree: Array<zip_DeflateCT>, dtree: Array<zip_DeflateCT>) => {

        let dist: number;		// distance of matched string
        let lc: number;		// match length or unmatched char (if dist == 0)
        let lx = 0;		// running index in l_buf
        let dx = 0;		// running index in d_buf
        let fx = 0;		// running index in flag_buf
        let flag = 0;	// current flags
        let code: number;		// the code to send
        let extra: number;		// number of extra bits to send

        if (this.zip_last_lit != 0) do {
            if ((lx & 7) == 0)
                flag = this.zip_flag_buf[fx++];

                
            lc = this.zip_l_buf[lx++] & 0xff;
            if ((flag & 1) == 0) {
                this.zip_SEND_CODE(lc, ltree); /* send a literal byte */
            } else {
                code = this.zip_length_code[lc];
                this.zip_SEND_CODE(code + this.zip_LITERALS + 1, ltree); // send the length code
                extra = this.zip_extra_lbits[code];
                if (extra != 0) {
                    lc -= this.zip_base_length[code];


                    this.zip_send_bits(lc, extra); // send the extra length bits
                }
                dist = this.zip_d_buf[dx++];
                code = this.zip_D_CODE(dist);
                this.zip_SEND_CODE(code, dtree);	  // send the distance code
                extra = this.zip_extra_dbits[code];
                if (extra != 0) {
                    dist -= this.zip_base_dist[code];

                    
                    this.zip_send_bits(dist, extra);   // send the extra distance bits
                }
            } // literal or match pair ?
            flag >>= 1;
        } while (lx < this.zip_last_lit);

        this.zip_SEND_CODE(this.zip_END_BLOCK, ltree);
    }

    private zip_SEND_CODE = (c: number, tree: Array<zip_DeflateCT>) => {
        this.zip_send_bits(tree[c].fc, tree[c].dl);
    }

    private zip_init_block = () => {
        // Initialize the trees.
        for (let n = 0; n < this.zip_L_CODES; n++) this.zip_dyn_ltree[n].fc = 0;
        for (let n = 0; n < this.zip_D_CODES; n++) this.zip_dyn_dtree[n].fc = 0;
        for (let n = 0; n < this.zip_BL_CODES; n++) this.zip_bl_tree[n].fc = 0;

        this.zip_dyn_ltree[this.zip_END_BLOCK].fc = 1;
        this.zip_opt_len = this.zip_static_len = 0;
        this.zip_last_lit = 0; 
        this.zip_last_dist = 0; 
        this.zip_last_flags = 0;
        this.zip_flags = 0;
        this.zip_flag_bit = 1;
    }

    private zip_send_all_trees = (lcodes: number, dcodes: number, blcodes: number) => { // number of codes for each tree
        
        
        this.zip_send_bits(lcodes - 257, 5); // not +255 as stated in appnote.txt
        this.zip_send_bits(dcodes - 1, 5);
        this.zip_send_bits(blcodes - 4, 4); // not -3 as stated in appnote.txt
        for (let rank = 0; rank < blcodes; rank++) {
            this.zip_send_bits(this.zip_bl_tree[this.zip_bl_order[rank]].dl, 3);
        }
        this.zip_send_tree(this.zip_dyn_ltree, lcodes - 1);
        this.zip_send_tree(this.zip_dyn_dtree, dcodes - 1);
    }

    /**
     * zip_send_tree.
     * @param tree the tree to be scanned.
     * @param max_code and its largest code of non zero frequency.
     */
    private zip_send_tree = (tree: Array<zip_DeflateCT>, max_code: number) => {

        let nextlen = tree[0].dl;	// length of next code

        /* tree[max_code+1].dl = -1; */  /* guard already set */
        let max_count = 7;		// max repeat count
        let min_count = 4;		// min repeat count
        if (nextlen == 0) {
            max_count = 138;
            min_count = 3;
        }

        let prevlen = -1;		// last emitted length
        let count = 0;		// repeat count of the current code
        for (let n = 0; n <= max_code; n++) {
            const curlen = nextlen;// length of current code
            nextlen = tree[n + 1].dl;
            if (++count < max_count && curlen == nextlen) {
                continue;
            } else if (count < min_count) {
                do { this.zip_SEND_CODE(curlen, this.zip_bl_tree); } while (--count != 0);
            } else if (curlen != 0) {
                if (curlen != prevlen) {
                    this.zip_SEND_CODE(curlen, this.zip_bl_tree);
                    count--;
                }
                // Assert(count >= 3 && count <= 6, " 3_6?");
                this.zip_SEND_CODE(this.zip_REP_3_6, this.zip_bl_tree);
                this.zip_send_bits(count - 3, 2);
            } else if (count <= 10) {
                this.zip_SEND_CODE(this.zip_REPZ_3_10, this.zip_bl_tree);
                this.zip_send_bits(count - 3, 3);
            } else {
                this.zip_SEND_CODE(this.zip_REPZ_11_138, this.zip_bl_tree);
                this.zip_send_bits(count - 11, 7);
            }
            count = 0;
            prevlen = curlen;
            if (nextlen == 0) {
                max_count = 138;
                min_count = 3;
            } else if (curlen == nextlen) {
                max_count = 6;
                min_count = 3;
            } else {
                max_count = 7;
                min_count = 4;
            }
        }
    }
    private zip_qoutbuf = () => {
        if (this.zip_outcnt != 0) {
            const q = this.zip_new_queue();
            if (this.zip_qhead == null)
                this.zip_qhead = this.zip_qtail = q;
            else
                this.zip_qtail = this.zip_qtail.next = q;
            q.len = this.zip_outcnt - this.zip_outoff;
            for (let i = 0; i < q.len; i++)
                q.ptr[i] = this.zip_outbuf[this.zip_outoff + i];
            this.zip_outcnt = this.zip_outoff = 0;
        }
    }

    private zip_new_queue = (): zip_DeflateBuffer => {
        let p: zip_DeflateBuffer;
        if (this.zip_free_queue != null) {
            p = this.zip_free_queue;
            this.zip_free_queue = this.zip_free_queue.next;
        } else {
            p = new zip_DeflateBuffer();
        }
        p.next = null;
        p.len = 0;
        p.off = 0;
        return p;
    }


    private zip_lm_init = () => {
        /* Initialize the hash table. */
        for (let j = 0; j < this.zip_HASH_SIZE; j++)
            this.zip_prev[this.zip_WSIZE + j] = 0;

        const tableItem = this.zip_configuration_table[this.zip_compr_level];
        this.zip_max_lazy_match = tableItem.max_lazy;
        this.zip_good_match = tableItem.good_length;
        if (!this.zip_FULL_SEARCH) this.zip_nice_match = tableItem.nice_length;
        this.zip_max_chain_length = tableItem.max_chain;

        this.zip_strstart = 0;
        this.zip_block_start = 0;

        this.zip_lookahead = this.zip_read_buff(this.zip_window, 0, 2 * this.zip_WSIZE);
        if (this.zip_lookahead <= 0) {
            this.zip_eofile = true;
            this.zip_lookahead = 0;
            return;
        }
        this.zip_eofile = false;

        while (this.zip_lookahead < this.zip_MIN_LOOKAHEAD && !this.zip_eofile)
            this.zip_fill_window();

        this.zip_ins_h = 0;
        for (let j = 0; j < this.zip_MIN_MATCH - 1; j++) {
            this.zip_ins_h = ((this.zip_ins_h << this.zip_H_SHIFT) ^ (this.zip_window[j] & 0xff)) & this.zip_HASH_MASK;
        }
    }

    private zip_read_buff = (buff: Array<number>, offset: number, n: number): number => {
        let i: number;
        for (i = 0; i < n && this.zip_deflate_pos < this.zip_deflate_data.length; i++)
            buff[offset + i] = this.zip_deflate_data.charCodeAt(this.zip_deflate_pos++) & 0xff;
        return i;
    }

    private zip_reuse_queue = (p: zip_DeflateBuffer) => {
        p.next = this.zip_free_queue;
        this.zip_free_queue = p;
    }

    private zip_fill_window = () => {
        let more = this.zip_window_size - this.zip_lookahead - this.zip_strstart;

        if (more == -1) {
            more--;
        } else if (this.zip_strstart >= this.zip_WSIZE + this.zip_MAX_DIST) {
            for (let n = 0; n < this.zip_WSIZE; n++)
                this.zip_window[n] = this.zip_window[n + this.zip_WSIZE];

            this.zip_match_start -= this.zip_WSIZE;
            this.zip_strstart -= this.zip_WSIZE; /* we now have strstart >= MAX_DIST: */
            this.zip_block_start -= this.zip_WSIZE;

            for (let n = 0; n < this.zip_HASH_SIZE; n++) {
                const m = this.zip_head1(n);
                this.zip_head2(n, m >= this.zip_WSIZE ? m - this.zip_WSIZE : this.zip_NIL);
            }
            for (let n = 0; n < this.zip_WSIZE; n++) {
                const m = this.zip_prev[n];
                this.zip_prev[n] = (m >= this.zip_WSIZE ? m - this.zip_WSIZE : this.zip_NIL);
            }
            more += this.zip_WSIZE;
        }
        if (!this.zip_eofile) {
            const n = this.zip_read_buff(this.zip_window, this.zip_strstart + this.zip_lookahead, more);
            if (n <= 0)
                this.zip_eofile = true;
            else
                this.zip_lookahead += n;
        }
    }

    private zip_build_tree = (desc: zip_DeflateTreeDesc) => { // the tree descriptor
        let tree: Array<zip_DeflateCT> = desc.dyn_tree;
        let stree = desc.static_tree;
        let elems = desc.elems;
        let max_code = -1;	// largest code with non zero frequency
        let node = elems;	// next internal node of the tree

        this.zip_heap_len = 0;
        this.zip_heap_max = this.zip_HEAP_SIZE;

        for (let n = 0; n < elems; n++) {
            if (tree[n].fc != 0) {
                this.zip_heap[++this.zip_heap_len] = max_code = n;
                this.zip_depth[n] = 0;
            } else
                tree[n].dl = 0;
        }

        while (this.zip_heap_len < 2) {
            let xnew = this.zip_heap[++this.zip_heap_len] = (max_code < 2 ? ++max_code : 0);
            tree[xnew].fc = 1;
            this.zip_depth[xnew] = 0;
            this.zip_opt_len--;
            if (stree != null)
                this.zip_static_len -= stree[xnew].dl;
        }
        desc.max_code = max_code;

        for (let n = this.zip_heap_len >> 1; n >= 1; n--)
            this.zip_pqdownheap(tree, n);

        do {
            const n = this.zip_heap[this.zip_SMALLEST];
            this.zip_heap[this.zip_SMALLEST] = this.zip_heap[this.zip_heap_len--];
            this.zip_pqdownheap(tree, this.zip_SMALLEST);

            const m = this.zip_heap[this.zip_SMALLEST];  // m = node of next least frequency

            this.zip_heap[--this.zip_heap_max] = n;
            this.zip_heap[--this.zip_heap_max] = m;

            tree[node].fc = tree[n].fc + tree[m].fc;
            if (this.zip_depth[n] > this.zip_depth[m] + 1)
                this.zip_depth[node] = this.zip_depth[n];
            else
                this.zip_depth[node] = this.zip_depth[m] + 1;
            tree[n].dl = tree[m].dl = node;

            this.zip_heap[this.zip_SMALLEST] = node++;
            this.zip_pqdownheap(tree, this.zip_SMALLEST);

        } while (this.zip_heap_len >= 2);

        this.zip_heap[--this.zip_heap_max] = this.zip_heap[this.zip_SMALLEST];

        this.zip_gen_bitlen(desc);

        this.zip_gen_codes(tree, max_code);
    }

    /**
     * 
     * @param tree the tree to restore.
     * @param k node to move down.
     */
    private zip_pqdownheap = (tree: Array<zip_DeflateCT>, k: number) => {
        let v = this.zip_heap[k];
        let j = k << 1;	// left son of k

        while (j <= this.zip_heap_len) {
            // Set j to the smallest of the two sons:
            if (j < this.zip_heap_len &&
                this.zip_SMALLER(tree, this.zip_heap[j + 1], this.zip_heap[j]))
                j++;

            // Exit if v is smaller than both sons
            if (this.zip_SMALLER(tree, v, this.zip_heap[j]))
                break;

            // Exchange v with the smallest son
            this.zip_heap[k] = this.zip_heap[j];
            k = j;
            // And continue down the tree, setting j to the left son of k
            j <<= 1;
        }
        this.zip_heap[k] = v;
    }

    private zip_SMALLER = (tree: Array<zip_DeflateCT>, n: number, m: number): boolean => {
        return tree[n].fc < tree[m].fc ||
            (tree[n].fc == tree[m].fc && this.zip_depth[n] <= this.zip_depth[m]);
    }

    private zip_gen_bitlen = (desc: zip_DeflateTreeDesc) => { // the tree descriptor

        const tree = desc.dyn_tree;
        const extra = desc.extra_bits;
        const base = desc.extra_base;
        const max_code = desc.max_code;
        const max_length = desc.max_length;
        const stree = desc.static_tree;

        for (let bits = 0; bits <= this.zip_MAX_BITS; bits++)
            this.zip_bl_count[bits] = 0;

        /* In a first pass, compute the optimal bit lengths (which may
         * overflow in the case of the bit length tree).
         */
        tree[this.zip_heap[this.zip_heap_max]].dl = 0; // root of the heap

        let overflow = 0;// number of elements with bit length too large
        let h: number;
        for (h = this.zip_heap_max + 1; h < this.zip_HEAP_SIZE; h++) {
            const n = this.zip_heap[h];
            let bits = tree[tree[n].dl].dl + 1;
            if (bits > max_length) {
                bits = max_length;
                overflow++;
            }
            tree[n].dl = bits;
            // We overwrite tree[n].dl which is no longer needed

            if (n > max_code)
                continue; // not a leaf node

            this.zip_bl_count[bits]++;
            let xbits = 0;// extra bits
            if (n >= base)
                xbits = extra[n - base];
            const f = tree[n].fc;// frequency
            this.zip_opt_len += f * (bits + xbits);
            if (stree != null)
                this.zip_static_len += f * (stree[n].dl + xbits);
        }
        if (overflow == 0) return;

        // This happens for example on obj2 and pic of the Calgary corpus

        // Find the first bit length which could increase:
        do {
            let bits = max_length - 1;
            while (this.zip_bl_count[bits] == 0)
                bits--;
            this.zip_bl_count[bits]--;		// move one leaf down the tree
            this.zip_bl_count[bits + 1] += 2;	// move one overflow item as its brother
            this.zip_bl_count[max_length]--;
            /* The brother of the overflow item also moves one step up,
             * but this does not affect bl_count[max_length]
             */
            overflow -= 2;
        } while (overflow > 0);

        /* Now recompute all bit lengths, scanning in increasing frequency.
         * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
         * lengths instead of fixing only the wrong ones. This idea is taken
         * from 'ar' written by Haruhiko Okumura.)
         */
        for (let bits = max_length; bits != 0; bits--) {
            let n = this.zip_bl_count[bits];
            while (n != 0) {
                const m = this.zip_heap[--h];
                if (m > max_code)
                    continue;
                if (tree[m].dl != bits) {
                    this.zip_opt_len += (bits - tree[m].dl) * tree[m].fc;
                    tree[m].fc = bits;
                }
                n--;
            }
        }
    }


    private zip_build_bl_tree(): number {
        this.zip_scan_tree(this.zip_dyn_ltree, this.zip_l_desc.max_code);
        this.zip_scan_tree(this.zip_dyn_dtree, this.zip_d_desc.max_code);

        this.zip_build_tree(this.zip_bl_desc);
        let max_blindex: number;
        for (max_blindex = this.zip_BL_CODES - 1; max_blindex >= 3; max_blindex--) {


            if (this.zip_bl_tree[this.zip_bl_order[max_blindex]].dl != 0) break;
        }
        this.zip_opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;


        return max_blindex;
    }

    /**
     * zip_scan_tree.
     * @param tree the tree to be scanned.
     * @param max_code and its largest code of non zero frequency.
     */
    private zip_scan_tree(tree: Array<zip_DeflateCT>, max_code: number) {

        let max_count = 7;		// max repeat count
        let min_count = 4;		// min repeat count
        let nextlen = tree[0].dl;	// length of next code
        if (nextlen == 0) {
            max_count = 138;
            min_count = 3;
        }
        tree[max_code + 1].dl = 0xffff; // guard

        let prevlen = -1;		// last emitted length
        let count = 0;		// repeat count of the current code
        for (let n = 0; n <= max_code; n++) {
            const curlen = nextlen; // length of current code
            nextlen = tree[n + 1].dl;
            if (++count < max_count && curlen == nextlen)
                continue;
            else if (count < min_count)
                this.zip_bl_tree[curlen].fc += count;
            else if (curlen != 0) {
                if (curlen != prevlen)
                    this.zip_bl_tree[curlen].fc++;
                this.zip_bl_tree[this.zip_REP_3_6].fc++;
            } else if (count <= 10)
                this.zip_bl_tree[this.zip_REPZ_3_10].fc++;
            else
                this.zip_bl_tree[this.zip_REPZ_11_138].fc++;
            count = 0;
            prevlen = curlen;
            if (nextlen == 0) {
                max_count = 138;
                min_count = 3;
            } else if (curlen == nextlen) {
                max_count = 6;
                min_count = 3;
            } else {
                max_count = 7;
                min_count = 4;
            }
        }
    }

}

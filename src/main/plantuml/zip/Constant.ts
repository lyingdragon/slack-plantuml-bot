import DeflateConfiguration from './DeflateConfiguration';

export default class Constant {

    /* constant parameters */
    public static readonly DEFAULT_LEVEL: number = 6;
    public static readonly WSIZE: number = 32768;		// Sliding Window size
    public static readonly STORED_BLOCK: number = 0;
    public static readonly STATIC_TREES: number = 1;
    public static readonly DYN_TREES: number = 2;

    /* for deflate */
    public static readonly FULL_SEARCH = true;
    public static readonly INBUFSIZ: number = 32768;	// Input buffer size
    public static readonly INBUF_EXTRA: number = 64;	// Extra buffer
    public static readonly OUTBUFSIZ: number = 1024 * 8;
    public static readonly WINDOW_SIZE: number = 2 * Constant.WSIZE;
    public static readonly MIN_MATCH: number = 3;
    public static readonly MAX_MATCH: number = 258;
    public static readonly BITS: number = 16;
    // for SMALL_MEM
    public static readonly LIT_BUFSIZE = 0x2000;
    public static readonly HASH_BITS: number = 13;
    // for MEDIUM_MEM
    public static readonly DIST_BUFSIZE: number = Constant.LIT_BUFSIZE;
    public static readonly HASH_SIZE: number = 1 << Constant.HASH_BITS;
    public static readonly HASH_MASK: number = Constant.HASH_SIZE - 1;
    public static readonly WMASK: number = Constant.WSIZE - 1;
    public static readonly NIL: number = 0; // Tail of hash chains
    public static readonly TOO_FAR: number = 4096;
    public static readonly MIN_LOOKAHEAD: number = Constant.MAX_MATCH + Constant.MIN_MATCH + 1;
    public static readonly MAX_DIST: number = Constant.WSIZE - Constant.MIN_LOOKAHEAD;
    public static readonly SMALLEST: number = 1;
    public static readonly MAX_BITS: number = 15;
    public static readonly MAX_BL_BITS: number = 7;
    public static readonly LENGTH_CODES: number = 29;
    public static readonly LITERALS: number = 256;
    public static readonly END_BLOCK: number = 256;
    public static readonly L_CODES: number = Constant.LITERALS + 1 + Constant.LENGTH_CODES;
    public static readonly D_CODES: number = 30;
    public static readonly BL_CODES: number = 19;
    public static readonly REP_3_6: number = 16;
    public static readonly REPZ_3_10: number = 17;
    public static readonly REPZ_11_138: number = 18;
    public static readonly HEAP_SIZE: number = 2 * Constant.L_CODES + 1;
    public static readonly H_SHIFT: number = (Constant.HASH_BITS + Constant.MIN_MATCH - 1) / Constant.MIN_MATCH;

    /* constant tables */
    public static readonly EXTRA_L_BITS = new Array(0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0);
    public static readonly EXTRA_D_BITS = new Array(0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13);
    public static readonly EXTRA_BL_BITS = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7);
    public static readonly BL_ORDER = new Array(16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15);

    public static readonly CONFIGURATION_TABLE = new Array(
        new DeflateConfiguration(0, 0, 0, 0),
        new DeflateConfiguration(4, 4, 8, 4),
        new DeflateConfiguration(4, 5, 16, 8),
        new DeflateConfiguration(4, 6, 32, 32),
        new DeflateConfiguration(4, 4, 16, 16),
        new DeflateConfiguration(8, 16, 32, 32),
        new DeflateConfiguration(8, 16, 128, 128),
        new DeflateConfiguration(8, 32, 128, 256),
        new DeflateConfiguration(32, 128, 258, 1024),
        new DeflateConfiguration(32, 258, 258, 4096)
    );

}
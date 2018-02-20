import DeflateCT from './DeflateCT';
import DeflateBuffer from './DeflateBuffer';
import DeflateTreeDesc from './DeflateTreeDesc';
import Constant from './Constant';
var OriginalZip = (function () {
    function OriginalZip() {
        var _this = this;
        this.deflate = function (str, level) {
            _this.deflate_data = str;
            _this.deflate_pos = 0;
            if (level == undefined)
                level = Constant.DEFAULT_LEVEL;
            _this.deflate_start(level);
            var buff = new Array(1024);
            var out = "";
            var i;
            while ((i = _this.deflate_internal(buff, 0, buff.length)) > 0) {
                for (var j = 0; j < i; j++) {
                    out += String.fromCharCode(buff[j]);
                }
            }
            return out;
        };
        this.deflate_start = function (level) {
            var i;
            if (!level)
                level = Constant.DEFAULT_LEVEL;
            else if (level < 1)
                level = 1;
            else if (level > 9)
                level = 9;
            _this.compr_level = level;
            _this.initflag = false;
            _this.eofile = false;
            if (_this.outbuf != null)
                return;
            _this.free_queue = _this.qhead = null;
            _this.outbuf = new Array(Constant.OUTBUFSIZ);
            _this.window = new Array(Constant.WINDOW_SIZE);
            _this.d_buf = new Array(Constant.DIST_BUFSIZE);
            _this.l_buf = new Array(Constant.INBUFSIZ + Constant.INBUF_EXTRA);
            _this.prev = new Array(1 << Constant.BITS);
            _this.dyn_ltree = new Array(Constant.HEAP_SIZE);
            for (i = 0; i < Constant.HEAP_SIZE; i++)
                _this.dyn_ltree[i] = new DeflateCT();
            _this.dyn_dtree = new Array(2 * Constant.D_CODES + 1);
            for (i = 0; i < 2 * Constant.D_CODES + 1; i++)
                _this.dyn_dtree[i] = new DeflateCT();
            _this.static_ltree = new Array(Constant.L_CODES + 2);
            for (i = 0; i < Constant.L_CODES + 2; i++)
                _this.static_ltree[i] = new DeflateCT();
            _this.static_dtree = new Array(Constant.D_CODES);
            for (i = 0; i < Constant.D_CODES; i++)
                _this.static_dtree[i] = new DeflateCT();
            _this.bl_tree = new Array(2 * Constant.BL_CODES + 1);
            for (i = 0; i < 2 * Constant.BL_CODES + 1; i++)
                _this.bl_tree[i] = new DeflateCT();
            _this.l_desc = new DeflateTreeDesc();
            _this.d_desc = new DeflateTreeDesc();
            _this.bl_desc = new DeflateTreeDesc();
            _this.bl_count = new Array(Constant.MAX_BITS + 1);
            _this.heap = new Array(2 * Constant.L_CODES + 1);
            _this.depth = new Array(2 * Constant.L_CODES + 1);
            _this.length_code = new Array(Constant.MAX_MATCH - Constant.MIN_MATCH + 1);
            _this.dist_code = new Array(512);
            _this.base_length = new Array(Constant.LENGTH_CODES);
            _this.base_dist = new Array(Constant.D_CODES);
            _this.flag_buf = new Array(Constant.LIT_BUFSIZE / 8);
        };
        this.deflate_internal = function (buff, off, buff_size) {
            var n;
            if (!_this.initflag) {
                _this.init_deflate();
                _this.initflag = true;
                if (_this.lookahead == 0) {
                    _this.complete = true;
                    return 0;
                }
            }
            if ((n = _this.qcopy(buff, off, buff_size)) == buff_size)
                return buff_size;
            if (_this.complete)
                return n;
            if (_this.compr_level <= 3)
                _this.deflate_fast();
            else
                _this.deflate_better();
            if (_this.lookahead == 0) {
                if (_this.match_available != 0)
                    _this.ct_tally(0, _this.window[_this.strstart - 1] & 0xff);
                _this.flush_block(1);
                _this.complete = true;
            }
            return n + _this.qcopy(buff, n + off, buff_size - n);
        };
        this.init_deflate = function () {
            if (_this.eofile)
                return;
            _this.bi_buf = 0;
            _this.bi_valid = 0;
            _this.ct_init();
            _this.lm_init();
            _this.qhead = null;
            _this.outcnt = 0;
            _this.outoff = 0;
            if (_this.compr_level <= 3) {
                _this.prev_length = Constant.MIN_MATCH - 1;
                _this.match_length = 0;
            }
            else {
                _this.match_length = Constant.MIN_MATCH - 1;
                _this.match_available = 0;
            }
            _this.complete = false;
        };
        this.qcopy = function (buff, off, buff_size) {
            var n;
            var i;
            var j;
            n = 0;
            while (_this.qhead != null && n < buff_size) {
                i = buff_size - n;
                if (i > _this.qhead.len)
                    i = _this.qhead.len;
                for (j = 0; j < i; j++)
                    buff[off + n + j] = _this.qhead.ptr[_this.qhead.off + j];
                _this.qhead.off += i;
                _this.qhead.len -= i;
                n += i;
                if (_this.qhead.len == 0) {
                    var p;
                    p = _this.qhead;
                    _this.qhead = _this.qhead.next;
                    _this.reuse_queue(p);
                }
            }
            if (n == buff_size)
                return n;
            if (_this.outoff < _this.outcnt) {
                i = buff_size - n;
                if (i > _this.outcnt - _this.outoff)
                    i = _this.outcnt - _this.outoff;
                for (j = 0; j < i; j++)
                    buff[off + n + j] = _this.outbuf[_this.outoff + j];
                _this.outoff += i;
                n += i;
                if (_this.outcnt == _this.outoff) {
                    _this.outcnt = _this.outoff = 0;
                }
            }
            return n;
        };
        this.deflate_fast = function () {
            while (_this.lookahead != 0 && _this.qhead == null) {
                var flush = void 0;
                _this.INSERT_STRING();
                if (_this.hash_head != Constant.NIL &&
                    _this.strstart - _this.hash_head <= Constant.MAX_DIST) {
                    _this.match_length = _this.longest_match(_this.hash_head);
                    if (_this.match_length > _this.lookahead)
                        _this.match_length = _this.lookahead;
                }
                if (_this.match_length >= Constant.MIN_MATCH) {
                    flush = _this.ct_tally(_this.strstart - _this.match_start, _this.match_length - Constant.MIN_MATCH);
                    _this.lookahead -= _this.match_length;
                    if (_this.match_length <= _this.max_lazy_match) {
                        _this.match_length--;
                        do {
                            _this.strstart++;
                            _this.INSERT_STRING();
                        } while (--_this.match_length != 0);
                        _this.strstart++;
                    }
                    else {
                        _this.strstart += _this.match_length;
                        _this.match_length = 0;
                        _this.ins_h = _this.window[_this.strstart] & 0xff;
                        _this.ins_h = ((_this.ins_h << Constant.H_SHIFT) ^ (_this.window[_this.strstart + 1] & 0xff)) & Constant.HASH_MASK;
                    }
                }
                else {
                    flush = _this.ct_tally(0, _this.window[_this.strstart] & 0xff);
                    _this.lookahead--;
                    _this.strstart++;
                }
                if (flush) {
                    _this.flush_block(0);
                    _this.block_start = _this.strstart;
                }
                while (_this.lookahead < Constant.MIN_LOOKAHEAD && !_this.eofile)
                    _this.fill_window();
            }
        };
        this.INSERT_STRING = function () {
            _this.ins_h = ((_this.ins_h << Constant.H_SHIFT)
                ^ (_this.window[_this.strstart + Constant.MIN_MATCH - 1] & 0xff))
                & Constant.HASH_MASK;
            _this.hash_head = _this.head1(_this.ins_h);
            _this.prev[_this.strstart & Constant.WMASK] = _this.hash_head;
            _this.head2(_this.ins_h, _this.strstart);
        };
        this.head1 = function (i) {
            return _this.prev[Constant.WSIZE + i];
        };
        this.head2 = function (i, val) {
            return _this.prev[Constant.WSIZE + i] = val;
        };
        this.longest_match = function (cur_match) {
            var chain_length = _this.max_chain_length;
            var scanp = _this.strstart;
            var matchp;
            var len;
            var best_len = _this.prev_length;
            var limit = (_this.strstart > Constant.MAX_DIST ? _this.strstart - Constant.MAX_DIST : Constant.NIL);
            var strendp = _this.strstart + Constant.MAX_MATCH;
            var scan_end1 = _this.window[scanp + best_len - 1];
            var scan_end = _this.window[scanp + best_len];
            if (_this.prev_length >= _this.good_match)
                chain_length >>= 2;
            do {
                matchp = cur_match;
                if (_this.window[matchp + best_len] != scan_end ||
                    _this.window[matchp + best_len - 1] != scan_end1 ||
                    _this.window[matchp] != _this.window[scanp] ||
                    _this.window[++matchp] != _this.window[scanp + 1]) {
                    continue;
                }
                scanp += 2;
                matchp++;
                do { } while (_this.window[++scanp] == _this.window[++matchp] &&
                    _this.window[++scanp] == _this.window[++matchp] &&
                    _this.window[++scanp] == _this.window[++matchp] &&
                    _this.window[++scanp] == _this.window[++matchp] &&
                    _this.window[++scanp] == _this.window[++matchp] &&
                    _this.window[++scanp] == _this.window[++matchp] &&
                    _this.window[++scanp] == _this.window[++matchp] &&
                    _this.window[++scanp] == _this.window[++matchp] &&
                    scanp < strendp);
                len = Constant.MAX_MATCH - (strendp - scanp);
                scanp = strendp - Constant.MAX_MATCH;
                if (len > best_len) {
                    _this.match_start = cur_match;
                    best_len = len;
                    if (Constant.FULL_SEARCH) {
                        if (len >= Constant.MAX_MATCH)
                            break;
                    }
                    else {
                        if (len >= _this.nice_match)
                            break;
                    }
                    scan_end1 = _this.window[scanp + best_len - 1];
                    scan_end = _this.window[scanp + best_len];
                }
            } while ((cur_match = _this.prev[cur_match & Constant.WMASK]) > limit
                && --chain_length != 0);
            return best_len;
        };
        this.deflate_better = function () {
            while (_this.lookahead != 0 && _this.qhead == null) {
                _this.INSERT_STRING();
                var prev_match = _this.match_start;
                _this.prev_length = _this.match_length;
                _this.match_length = Constant.MIN_MATCH - 1;
                if (_this.hash_head != Constant.NIL &&
                    _this.prev_length < _this.max_lazy_match &&
                    _this.strstart - _this.hash_head <= Constant.MAX_DIST) {
                    _this.match_length = _this.longest_match(_this.hash_head);
                    if (_this.match_length > _this.lookahead)
                        _this.match_length = _this.lookahead;
                    if (_this.match_length == Constant.MIN_MATCH &&
                        _this.strstart - _this.match_start > Constant.TOO_FAR) {
                        _this.match_length--;
                    }
                }
                if (_this.prev_length >= Constant.MIN_MATCH &&
                    _this.match_length <= _this.prev_length) {
                    var flush = void 0;
                    flush = _this.ct_tally(_this.strstart - 1 - prev_match, _this.prev_length - Constant.MIN_MATCH);
                    _this.lookahead -= _this.prev_length - 1;
                    _this.prev_length -= 2;
                    do {
                        _this.strstart++;
                        _this.INSERT_STRING();
                    } while (--_this.prev_length != 0);
                    _this.match_available = 0;
                    _this.match_length = Constant.MIN_MATCH - 1;
                    _this.strstart++;
                    if (flush) {
                        _this.flush_block(0);
                        _this.block_start = _this.strstart;
                    }
                }
                else if (_this.match_available != 0) {
                    if (_this.ct_tally(0, _this.window[_this.strstart - 1] & 0xff)) {
                        _this.flush_block(0);
                        _this.block_start = _this.strstart;
                    }
                    _this.strstart++;
                    _this.lookahead--;
                }
                else {
                    _this.match_available = 1;
                    _this.strstart++;
                    _this.lookahead--;
                }
                while (_this.lookahead < Constant.MIN_LOOKAHEAD && !_this.eofile)
                    _this.fill_window();
            }
        };
        this.ct_tally = function (dist, lc) {
            _this.l_buf[_this.last_lit++] = lc;
            if (dist == 0) {
                _this.dyn_ltree[lc].fc++;
            }
            else {
                dist--;
                _this.dyn_ltree[_this.length_code[lc] + Constant.LITERALS + 1].fc++;
                _this.dyn_dtree[_this.D_CODE(dist)].fc++;
                _this.d_buf[_this.last_dist++] = dist;
                _this.flags |= _this.flag_bit;
            }
            _this.flag_bit <<= 1;
            if ((_this.last_lit & 7) == 0) {
                _this.flag_buf[_this.last_flags++] = _this.flags;
                _this.flags = 0;
                _this.flag_bit = 1;
            }
            if (_this.compr_level > 2 && (_this.last_lit & 0xfff) == 0) {
                var out_length = _this.last_lit * 8;
                var in_length = _this.strstart - _this.block_start;
                for (var dcode = 0; dcode < Constant.D_CODES; dcode++) {
                    out_length += _this.dyn_dtree[dcode].fc * (5 + Constant.EXTRA_D_BITS[dcode]);
                }
                out_length >>= 3;
                if (_this.last_dist < (_this.last_lit / 2) && out_length < (in_length / 2))
                    return true;
            }
            return (_this.last_lit == Constant.LIT_BUFSIZE - 1 ||
                _this.last_dist == Constant.DIST_BUFSIZE);
        };
        this.D_CODE = function (dist) {
            return (dist < 256 ? _this.dist_code[dist]
                : _this.dist_code[256 + (dist >> 7)]) & 0xff;
        };
        this.ct_init = function () {
            var code;
            var dist;
            if (_this.static_dtree[0].dl != 0)
                return;
            var lDesc = _this.l_desc;
            lDesc.dyn_tree = _this.dyn_ltree;
            lDesc.static_tree = _this.static_ltree;
            lDesc.extra_bits = Constant.EXTRA_L_BITS;
            lDesc.extra_base = Constant.LITERALS + 1;
            lDesc.elems = Constant.L_CODES;
            lDesc.max_length = Constant.MAX_BITS;
            lDesc.max_code = 0;
            _this.d_desc.dyn_tree = _this.dyn_dtree;
            _this.d_desc.static_tree = _this.static_dtree;
            _this.d_desc.extra_bits = Constant.EXTRA_D_BITS;
            _this.d_desc.extra_base = 0;
            _this.d_desc.elems = Constant.D_CODES;
            _this.d_desc.max_length = Constant.MAX_BITS;
            _this.d_desc.max_code = 0;
            _this.bl_desc.dyn_tree = _this.bl_tree;
            _this.bl_desc.static_tree = null;
            _this.bl_desc.extra_bits = Constant.EXTRA_BL_BITS;
            _this.bl_desc.extra_base = 0;
            _this.bl_desc.elems = Constant.BL_CODES;
            _this.bl_desc.max_length = Constant.MAX_BL_BITS;
            _this.bl_desc.max_code = 0;
            var length = 0;
            for (code = 0; code < Constant.LENGTH_CODES - 1; code++) {
                _this.base_length[code] = length;
                for (var n_1 = 0; n_1 < (1 << Constant.EXTRA_L_BITS[code]); n_1++)
                    _this.length_code[length++] = code;
            }
            _this.length_code[length - 1] = code;
            dist = 0;
            for (code = 0; code < 16; code++) {
                _this.base_dist[code] = dist;
                for (var n_2 = 0; n_2 < (1 << Constant.EXTRA_D_BITS[code]); n_2++) {
                    _this.dist_code[dist++] = code;
                }
            }
            dist >>= 7;
            for (; code < Constant.D_CODES; code++) {
                _this.base_dist[code] = dist << 7;
                for (var n_3 = 0; n_3 < (1 << (Constant.EXTRA_D_BITS[code] - 7)); n_3++)
                    _this.dist_code[256 + dist++] = code;
            }
            for (var bits = 0; bits <= Constant.MAX_BITS; bits++)
                _this.bl_count[bits] = 0;
            var n = 0;
            while (n <= 143) {
                _this.static_ltree[n++].dl = 8;
                _this.bl_count[8]++;
            }
            while (n <= 255) {
                _this.static_ltree[n++].dl = 9;
                _this.bl_count[9]++;
            }
            while (n <= 279) {
                _this.static_ltree[n++].dl = 7;
                _this.bl_count[7]++;
            }
            while (n <= 287) {
                _this.static_ltree[n++].dl = 8;
                _this.bl_count[8]++;
            }
            _this.gen_codes(_this.static_ltree, Constant.L_CODES + 1);
            for (n = 0; n < Constant.D_CODES; n++) {
                _this.static_dtree[n].dl = 5;
                _this.static_dtree[n].fc = _this.bi_reverse(n, 5);
            }
            _this.init_block();
        };
        this.gen_codes = function (tree, max_code) {
            var next_code = new Array(Constant.MAX_BITS + 1);
            var code = 0;
            for (var bits = 1; bits <= Constant.MAX_BITS; bits++) {
                code = ((code + _this.bl_count[bits - 1]) << 1);
                next_code[bits] = code;
            }
            for (var n = 0; n <= max_code; n++) {
                var len = tree[n].dl;
                if (len == 0)
                    continue;
                tree[n].fc = _this.bi_reverse(next_code[len]++, len);
            }
        };
        this.bi_reverse = function (code, len) {
            var res = 0;
            do {
                res |= code & 1;
                code >>= 1;
                res <<= 1;
            } while (--len > 0);
            return res >> 1;
        };
        this.flush_block = function (eof) {
            var stored_len = _this.strstart - _this.block_start;
            _this.flag_buf[_this.last_flags] = _this.flags;
            _this.build_tree(_this.l_desc);
            _this.build_tree(_this.d_desc);
            var max_blindex = _this.build_bl_tree();
            var opt_lenb = (_this.opt_len + 3 + 7) >> 3;
            var static_lenb = (_this.static_len + 3 + 7) >> 3;
            if (static_lenb <= opt_lenb)
                opt_lenb = static_lenb;
            if (stored_len + 4 <= opt_lenb
                && _this.block_start >= 0) {
                var i = void 0;
                _this.send_bits((Constant.STORED_BLOCK << 1) + eof, 3);
                _this.bi_windup();
                _this.put_short(stored_len);
                _this.put_short(~stored_len);
                for (i = 0; i < stored_len; i++)
                    _this.put_byte(_this.window[_this.block_start + i]);
            }
            else if (static_lenb == opt_lenb) {
                _this.send_bits((Constant.STATIC_TREES << 1) + eof, 3);
                _this.compress_block(_this.static_ltree, _this.static_dtree);
            }
            else {
                _this.send_bits((Constant.DYN_TREES << 1) + eof, 3);
                _this.send_all_trees(_this.l_desc.max_code + 1, _this.d_desc.max_code + 1, max_blindex + 1);
                _this.compress_block(_this.dyn_ltree, _this.dyn_dtree);
            }
            _this.init_block();
            if (eof != 0)
                _this.bi_windup();
        };
        this.send_bits = function (value, length) {
            var BUF_SIZE = 16;
            if (_this.bi_valid > BUF_SIZE - length) {
                _this.bi_buf |= (value << _this.bi_valid);
                _this.put_short(_this.bi_buf);
                _this.bi_buf = (value >> (BUF_SIZE - _this.bi_valid));
                _this.bi_valid += length - BUF_SIZE;
            }
            else {
                _this.bi_buf |= value << _this.bi_valid;
                _this.bi_valid += length;
            }
        };
        this.bi_windup = function () {
            if (_this.bi_valid > 8) {
                _this.put_short(_this.bi_buf);
            }
            else if (_this.bi_valid > 0) {
                _this.put_byte(_this.bi_buf);
            }
            _this.bi_buf = 0;
            _this.bi_valid = 0;
        };
        this.put_short = function (w) {
            w &= 0xffff;
            if (_this.outoff + _this.outcnt < Constant.OUTBUFSIZ - 2) {
                _this.outbuf[_this.outoff + _this.outcnt++] = (w & 0xff);
                _this.outbuf[_this.outoff + _this.outcnt++] = (w >>> 8);
            }
            else {
                _this.put_byte(w & 0xff);
                _this.put_byte(w >>> 8);
            }
        };
        this.put_byte = function (c) {
            _this.outbuf[_this.outoff + _this.outcnt++] = c;
            if (_this.outoff + _this.outcnt == Constant.OUTBUFSIZ)
                _this.qoutbuf();
        };
        this.compress_block = function (ltree, dtree) {
            var dist;
            var lc;
            var lx = 0;
            var dx = 0;
            var fx = 0;
            var flag = 0;
            var code;
            var extra;
            if (_this.last_lit != 0)
                do {
                    if ((lx & 7) == 0)
                        flag = _this.flag_buf[fx++];
                    lc = _this.l_buf[lx++] & 0xff;
                    if ((flag & 1) == 0) {
                        _this.SEND_CODE(lc, ltree);
                    }
                    else {
                        code = _this.length_code[lc];
                        _this.SEND_CODE(code + Constant.LITERALS + 1, ltree);
                        extra = Constant.EXTRA_L_BITS[code];
                        if (extra != 0) {
                            lc -= _this.base_length[code];
                            _this.send_bits(lc, extra);
                        }
                        dist = _this.d_buf[dx++];
                        code = _this.D_CODE(dist);
                        _this.SEND_CODE(code, dtree);
                        extra = Constant.EXTRA_D_BITS[code];
                        if (extra != 0) {
                            dist -= _this.base_dist[code];
                            _this.send_bits(dist, extra);
                        }
                    }
                    flag >>= 1;
                } while (lx < _this.last_lit);
            _this.SEND_CODE(Constant.END_BLOCK, ltree);
        };
        this.SEND_CODE = function (c, tree) {
            _this.send_bits(tree[c].fc, tree[c].dl);
        };
        this.init_block = function () {
            for (var n = 0; n < Constant.L_CODES; n++)
                _this.dyn_ltree[n].fc = 0;
            for (var n = 0; n < Constant.D_CODES; n++)
                _this.dyn_dtree[n].fc = 0;
            for (var n = 0; n < Constant.BL_CODES; n++)
                _this.bl_tree[n].fc = 0;
            _this.dyn_ltree[Constant.END_BLOCK].fc = 1;
            _this.opt_len = _this.static_len = 0;
            _this.last_lit = 0;
            _this.last_dist = 0;
            _this.last_flags = 0;
            _this.flags = 0;
            _this.flag_bit = 1;
        };
        this.send_all_trees = function (lcodes, dcodes, blcodes) {
            _this.send_bits(lcodes - 257, 5);
            _this.send_bits(dcodes - 1, 5);
            _this.send_bits(blcodes - 4, 4);
            for (var rank = 0; rank < blcodes; rank++) {
                _this.send_bits(_this.bl_tree[Constant.BL_ORDER[rank]].dl, 3);
            }
            _this.send_tree(_this.dyn_ltree, lcodes - 1);
            _this.send_tree(_this.dyn_dtree, dcodes - 1);
        };
        this.send_tree = function (tree, max_code) {
            var nextlen = tree[0].dl;
            var max_count = 7;
            var min_count = 4;
            if (nextlen == 0) {
                max_count = 138;
                min_count = 3;
            }
            var prevlen = -1;
            var count = 0;
            for (var n = 0; n <= max_code; n++) {
                var curlen = nextlen;
                nextlen = tree[n + 1].dl;
                if (++count < max_count && curlen == nextlen) {
                    continue;
                }
                else if (count < min_count) {
                    do {
                        _this.SEND_CODE(curlen, _this.bl_tree);
                    } while (--count != 0);
                }
                else if (curlen != 0) {
                    if (curlen != prevlen) {
                        _this.SEND_CODE(curlen, _this.bl_tree);
                        count--;
                    }
                    _this.SEND_CODE(Constant.REP_3_6, _this.bl_tree);
                    _this.send_bits(count - 3, 2);
                }
                else if (count <= 10) {
                    _this.SEND_CODE(Constant.REPZ_3_10, _this.bl_tree);
                    _this.send_bits(count - 3, 3);
                }
                else {
                    _this.SEND_CODE(Constant.REPZ_11_138, _this.bl_tree);
                    _this.send_bits(count - 11, 7);
                }
                count = 0;
                prevlen = curlen;
                if (nextlen == 0) {
                    max_count = 138;
                    min_count = 3;
                }
                else if (curlen == nextlen) {
                    max_count = 6;
                    min_count = 3;
                }
                else {
                    max_count = 7;
                    min_count = 4;
                }
            }
        };
        this.qoutbuf = function () {
            if (_this.outcnt != 0) {
                var q = _this.new_queue();
                if (_this.qhead == null)
                    _this.qhead = _this.qtail = q;
                else
                    _this.qtail = _this.qtail.next = q;
                q.len = _this.outcnt - _this.outoff;
                for (var i = 0; i < q.len; i++)
                    q.ptr[i] = _this.outbuf[_this.outoff + i];
                _this.outcnt = _this.outoff = 0;
            }
        };
        this.new_queue = function () {
            var p = new DeflateBuffer();
            if (_this.free_queue != null) {
                p = _this.free_queue;
                _this.free_queue = _this.free_queue.next;
            }
            p.next = null;
            p.len = 0;
            p.off = 0;
            return p;
        };
        this.lm_init = function () {
            for (var j = 0; j < Constant.HASH_SIZE; j++)
                _this.prev[Constant.WSIZE + j] = 0;
            var tableItem = Constant.CONFIGURATION_TABLE[_this.compr_level];
            _this.max_lazy_match = tableItem.max_lazy;
            _this.good_match = tableItem.good_length;
            if (!Constant.FULL_SEARCH)
                _this.nice_match = tableItem.nice_length;
            _this.max_chain_length = tableItem.max_chain;
            _this.strstart = 0;
            _this.block_start = 0;
            _this.lookahead = _this.read_buff(_this.window, 0, 2 * Constant.WSIZE);
            if (_this.lookahead <= 0) {
                _this.eofile = true;
                _this.lookahead = 0;
                return;
            }
            _this.eofile = false;
            while (_this.lookahead < Constant.MIN_LOOKAHEAD && !_this.eofile)
                _this.fill_window();
            _this.ins_h = 0;
            for (var j = 0; j < Constant.MIN_MATCH - 1; j++) {
                _this.ins_h = ((_this.ins_h << Constant.H_SHIFT) ^ (_this.window[j] & 0xff)) & Constant.HASH_MASK;
            }
        };
        this.read_buff = function (buff, offset, n) {
            var i;
            for (i = 0; i < n && _this.deflate_pos < _this.deflate_data.length; i++)
                buff[offset + i] = _this.deflate_data.charCodeAt(_this.deflate_pos++) & 0xff;
            return i;
        };
        this.reuse_queue = function (p) {
            p.next = _this.free_queue;
            _this.free_queue = p;
        };
        this.fill_window = function () {
            var more = Constant.WINDOW_SIZE - _this.lookahead - _this.strstart;
            if (more == -1) {
                more--;
            }
            else if (_this.strstart >= Constant.WSIZE + Constant.MAX_DIST) {
                for (var n = 0; n < Constant.WSIZE; n++)
                    _this.window[n] = _this.window[n + Constant.WSIZE];
                _this.match_start -= Constant.WSIZE;
                _this.strstart -= Constant.WSIZE;
                _this.block_start -= Constant.WSIZE;
                for (var n = 0; n < Constant.HASH_SIZE; n++) {
                    var m = _this.head1(n);
                    _this.head2(n, m >= Constant.WSIZE ? m - Constant.WSIZE : Constant.NIL);
                }
                for (var n = 0; n < Constant.WSIZE; n++) {
                    var m = _this.prev[n];
                    _this.prev[n] = (m >= Constant.WSIZE ? m - Constant.WSIZE : Constant.NIL);
                }
                more += Constant.WSIZE;
            }
            if (!_this.eofile) {
                var n = _this.read_buff(_this.window, _this.strstart + _this.lookahead, more);
                if (n <= 0)
                    _this.eofile = true;
                else
                    _this.lookahead += n;
            }
        };
        this.build_tree = function (desc) {
            var tree = desc.dyn_tree;
            var stree = desc.static_tree;
            var elems = desc.elems;
            var max_code = -1;
            var node = elems;
            _this.heap_len = 0;
            _this.heap_max = Constant.HEAP_SIZE;
            for (var n = 0; n < elems; n++) {
                if (tree[n].fc != 0) {
                    _this.heap[++_this.heap_len] = max_code = n;
                    _this.depth[n] = 0;
                }
                else
                    tree[n].dl = 0;
            }
            while (_this.heap_len < 2) {
                var xnew = _this.heap[++_this.heap_len] = (max_code < 2 ? ++max_code : 0);
                tree[xnew].fc = 1;
                _this.depth[xnew] = 0;
                _this.opt_len--;
                if (stree != null)
                    _this.static_len -= stree[xnew].dl;
            }
            desc.max_code = max_code;
            for (var n = _this.heap_len >> 1; n >= 1; n--)
                _this.pqdownheap(tree, n);
            do {
                var n = _this.heap[Constant.SMALLEST];
                _this.heap[Constant.SMALLEST] = _this.heap[_this.heap_len--];
                _this.pqdownheap(tree, Constant.SMALLEST);
                var m = _this.heap[Constant.SMALLEST];
                _this.heap[--_this.heap_max] = n;
                _this.heap[--_this.heap_max] = m;
                tree[node].fc = tree[n].fc + tree[m].fc;
                if (_this.depth[n] > _this.depth[m] + 1)
                    _this.depth[node] = _this.depth[n];
                else
                    _this.depth[node] = _this.depth[m] + 1;
                tree[n].dl = tree[m].dl = node;
                _this.heap[Constant.SMALLEST] = node++;
                _this.pqdownheap(tree, Constant.SMALLEST);
            } while (_this.heap_len >= 2);
            _this.heap[--_this.heap_max] = _this.heap[Constant.SMALLEST];
            _this.gen_bitlen(desc);
            _this.gen_codes(tree, max_code);
        };
        this.pqdownheap = function (tree, k) {
            var v = _this.heap[k];
            var j = k << 1;
            while (j <= _this.heap_len) {
                if (j < _this.heap_len &&
                    _this.SMALLER(tree, _this.heap[j + 1], _this.heap[j]))
                    j++;
                if (_this.SMALLER(tree, v, _this.heap[j]))
                    break;
                _this.heap[k] = _this.heap[j];
                k = j;
                j <<= 1;
            }
            _this.heap[k] = v;
        };
        this.SMALLER = function (tree, n, m) {
            return tree[n].fc < tree[m].fc ||
                (tree[n].fc == tree[m].fc && _this.depth[n] <= _this.depth[m]);
        };
        this.gen_bitlen = function (desc) {
            var tree = desc.dyn_tree;
            var extra = desc.extra_bits;
            var base = desc.extra_base;
            var max_code = desc.max_code;
            var max_length = desc.max_length;
            var stree = desc.static_tree;
            for (var bits = 0; bits <= Constant.MAX_BITS; bits++)
                _this.bl_count[bits] = 0;
            tree[_this.heap[_this.heap_max]].dl = 0;
            var overflow = 0;
            var h;
            for (h = _this.heap_max + 1; h < Constant.HEAP_SIZE; h++) {
                var n = _this.heap[h];
                var bits = tree[tree[n].dl].dl + 1;
                if (bits > max_length) {
                    bits = max_length;
                    overflow++;
                }
                tree[n].dl = bits;
                if (n > max_code)
                    continue;
                _this.bl_count[bits]++;
                var xbits = 0;
                if (n >= base)
                    xbits = extra[n - base];
                var f = tree[n].fc;
                _this.opt_len += f * (bits + xbits);
                if (stree != null)
                    _this.static_len += f * (stree[n].dl + xbits);
            }
            if (overflow == 0)
                return;
            do {
                var bits = max_length - 1;
                while (_this.bl_count[bits] == 0)
                    bits--;
                _this.bl_count[bits]--;
                _this.bl_count[bits + 1] += 2;
                _this.bl_count[max_length]--;
                overflow -= 2;
            } while (overflow > 0);
            for (var bits = max_length; bits != 0; bits--) {
                var n = _this.bl_count[bits];
                while (n != 0) {
                    var m = _this.heap[--h];
                    if (m > max_code)
                        continue;
                    if (tree[m].dl != bits) {
                        _this.opt_len += (bits - tree[m].dl) * tree[m].fc;
                        tree[m].fc = bits;
                    }
                    n--;
                }
            }
        };
    }
    OriginalZip.prototype.build_bl_tree = function () {
        this.scan_tree(this.dyn_ltree, this.l_desc.max_code);
        this.scan_tree(this.dyn_dtree, this.d_desc.max_code);
        this.build_tree(this.bl_desc);
        var max_blindex;
        for (max_blindex = Constant.BL_CODES - 1; max_blindex >= 3; max_blindex--) {
            if (this.bl_tree[Constant.BL_ORDER[max_blindex]].dl != 0)
                break;
        }
        this.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
        return max_blindex;
    };
    OriginalZip.prototype.scan_tree = function (tree, max_code) {
        var max_count = 7;
        var min_count = 4;
        var nextlen = tree[0].dl;
        if (nextlen == 0) {
            max_count = 138;
            min_count = 3;
        }
        tree[max_code + 1].dl = 0xffff;
        var prevlen = -1;
        var count = 0;
        for (var n = 0; n <= max_code; n++) {
            var curlen = nextlen;
            nextlen = tree[n + 1].dl;
            if (++count < max_count && curlen == nextlen)
                continue;
            else if (count < min_count)
                this.bl_tree[curlen].fc += count;
            else if (curlen != 0) {
                if (curlen != prevlen)
                    this.bl_tree[curlen].fc++;
                this.bl_tree[Constant.REP_3_6].fc++;
            }
            else if (count <= 10)
                this.bl_tree[Constant.REPZ_3_10].fc++;
            else
                this.bl_tree[Constant.REPZ_11_138].fc++;
            count = 0;
            prevlen = curlen;
            if (nextlen == 0) {
                max_count = 138;
                min_count = 3;
            }
            else if (curlen == nextlen) {
                max_count = 6;
                min_count = 3;
            }
            else {
                max_count = 7;
                min_count = 4;
            }
        }
    };
    return OriginalZip;
}());
export default OriginalZip;
//# sourceMappingURL=OriginalZip.js.map
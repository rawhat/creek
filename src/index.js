"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.iterateAsync = exports.unfoldAsync = exports.iterate = exports.unfold = exports.from = exports.fromArray = void 0;
function fromArray(elems) {
    return new Stream(function* () {
        for (let elem of elems) {
            yield elem;
        }
    });
}
exports.fromArray = fromArray;
function from(n) {
    let num = n;
    return new Stream(function* () {
        while (true) {
            yield num++;
        }
    });
}
exports.from = from;
function unfold(initial, mapper) {
    let acc = initial;
    return new Stream(function* () {
        while (true) {
            const mapped = mapper(acc);
            if (mapped === undefined) {
                return;
            }
            acc = mapped[1];
            yield mapped[0];
        }
    });
}
exports.unfold = unfold;
function iterate(initial, mapper) {
    let acc;
    return new Stream(function* () {
        while (true) {
            if (!acc) {
                acc = initial;
                yield initial;
            }
            else {
                acc = mapper(acc);
                yield acc;
            }
        }
    });
}
exports.iterate = iterate;
function unfoldAsync(initial, mapper) {
    let acc = initial;
    return new AsyncStream(function () {
        return __asyncGenerator(this, arguments, function* () {
            while (true) {
                const mapped = yield __await(mapper(acc));
                if (mapped === undefined) {
                    return yield __await(void 0);
                }
                acc = mapped[1];
                yield yield __await(mapped[0]);
            }
        });
    });
}
exports.unfoldAsync = unfoldAsync;
function iterateAsync(initial, mapper) {
    let acc;
    return new AsyncStream(function () {
        return __asyncGenerator(this, arguments, function* () {
            while (true) {
                if (!acc) {
                    acc = initial;
                    yield yield __await(initial);
                }
                else {
                    acc = yield __await(mapper(acc));
                    yield yield __await(acc);
                }
            }
        });
    });
}
exports.iterateAsync = iterateAsync;
class AsyncStream {
    constructor(generator) {
        this.generator = generator;
    }
    // Transformers
    take(n) {
        const self = this;
        let count = 0;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_1, _a;
                try {
                    for (var self_1 = __asyncValues(self), self_1_1; self_1_1 = yield __await(self_1.next()), !self_1_1.done;) {
                        const elem = self_1_1.value;
                        if (count === n) {
                            return yield __await(void 0);
                        }
                        count++;
                        yield yield __await(elem);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (self_1_1 && !self_1_1.done && (_a = self_1.return)) yield __await(_a.call(self_1));
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            });
        });
    }
    takeUntil(test) {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_2, _a;
                try {
                    for (var self_2 = __asyncValues(self), self_2_1; self_2_1 = yield __await(self_2.next()), !self_2_1.done;) {
                        const elem = self_2_1.value;
                        if (test(elem)) {
                            return yield __await(void 0);
                        }
                        yield yield __await(elem);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (self_2_1 && !self_2_1.done && (_a = self_2.return)) yield __await(_a.call(self_2));
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            });
        });
    }
    flatten() {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_3, _a;
                try {
                    for (var self_3 = __asyncValues(self), self_3_1; self_3_1 = yield __await(self_3.next()), !self_3_1.done;) {
                        const elem = self_3_1.value;
                        if (Array.isArray(elem)) {
                            for (const inner of elem) {
                                yield yield __await(inner);
                            }
                        }
                        else {
                            yield yield __await(elem);
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (self_3_1 && !self_3_1.done && (_a = self_3.return)) yield __await(_a.call(self_3));
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            });
        });
    }
    map(mapper) {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_4, _a;
                try {
                    for (var self_4 = __asyncValues(self), self_4_1; self_4_1 = yield __await(self_4.next()), !self_4_1.done;) {
                        const elem = self_4_1.value;
                        yield yield __await(mapper(elem));
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (self_4_1 && !self_4_1.done && (_a = self_4.return)) yield __await(_a.call(self_4));
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            });
        });
    }
    filter(filter) {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_5, _a;
                try {
                    for (var self_5 = __asyncValues(self), self_5_1; self_5_1 = yield __await(self_5.next()), !self_5_1.done;) {
                        const elem = self_5_1.value;
                        if (filter(elem)) {
                            yield yield __await(elem);
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (self_5_1 && !self_5_1.done && (_a = self_5.return)) yield __await(_a.call(self_5));
                    }
                    finally { if (e_5) throw e_5.error; }
                }
            });
        });
    }
    // Consumer
    fold(initial, folder) {
        var e_6, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let acc = initial;
            try {
                for (var _b = __asyncValues(this.generator()), _c; _c = yield _b.next(), !_c.done;) {
                    const elem = _c.value;
                    acc = yield folder(elem, acc);
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_6) throw e_6.error; }
            }
            return acc;
        });
    }
    toArray() {
        var e_7, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const items = [];
            try {
                for (var _b = __asyncValues(this.generator()), _c; _c = yield _b.next(), !_c.done;) {
                    const elem = _c.value;
                    items.push(elem);
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_7) throw e_7.error; }
            }
            return items;
        });
    }
    [Symbol.asyncIterator]() {
        return this.generator();
    }
}
class Stream {
    constructor(generator) {
        this.generator = generator;
    }
    // Transformers
    take(n) {
        const self = this;
        let count = 0;
        return new Stream(function* () {
            for (const elem of self) {
                if (count === n) {
                    return;
                }
                count++;
                yield elem;
            }
        });
    }
    takeUntil(test) {
        const self = this;
        return new Stream(function* () {
            for (const elem of self) {
                if (test(elem)) {
                    return;
                }
                yield elem;
            }
        });
    }
    flatten() {
        const self = this;
        return new Stream(function* () {
            for (const elem of self) {
                if (Array.isArray(elem)) {
                    for (const inner of elem) {
                        yield inner;
                    }
                }
                else {
                    yield elem;
                }
            }
        });
    }
    map(mapper) {
        const self = this;
        return new Stream(function* () {
            for (const elem of self) {
                yield mapper(elem);
            }
        });
    }
    filter(filter) {
        const self = this;
        return new Stream(function* () {
            for (const elem of self) {
                if (filter(elem)) {
                    yield elem;
                }
            }
        });
    }
    // Consumer
    fold(initial, folder) {
        let acc = initial;
        for (const elem of this.generator()) {
            acc = folder(elem, acc);
        }
        return acc;
    }
    toArray() {
        const items = [];
        for (const elem of this.generator()) {
            items.push(elem);
        }
        return items;
    }
    // Lift to async
    mapAsync(mapper) {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                for (const elem of self) {
                    yield yield __await(yield __await(mapper(elem)));
                }
            });
        });
    }
    filterAsync(test) {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                for (const elem of self) {
                    if (yield __await(test(elem))) {
                        yield yield __await(elem);
                    }
                }
            });
        });
    }
    foldAsync(initial, folder) {
        return __awaiter(this, void 0, void 0, function* () {
            const self = this;
            let acc = initial;
            for (const elem of self) {
                acc = yield folder(elem, acc);
            }
            return acc;
        });
    }
    [Symbol.iterator]() {
        return this.generator();
    }
}

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
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromEvent = exports.iterateAsync = exports.unfoldAsync = exports.timer = exports.interval = exports.iterate = exports.unfold = exports.from = exports.fromArray = exports.of = void 0;
function of(elem) {
    return new Stream(function* () {
        yield elem;
    });
}
exports.of = of;
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
function interval(n) {
    let count = 0;
    return new AsyncStream(function () {
        return __asyncGenerator(this, arguments, function* () {
            while (true) {
                yield __await(delay(n));
                yield yield __await(count++);
            }
        });
    });
}
exports.interval = interval;
function timer(n) {
    return new AsyncStream(function () {
        return __asyncGenerator(this, arguments, function* () {
            yield __await(delay(n));
            yield yield __await(0);
        });
    });
}
exports.timer = timer;
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
function fromEvent(target, type) {
    return new AsyncStream(function () {
        return __asyncGenerator(this, arguments, function* () {
            let resolver = undefined;
            let promise = new Promise((resolve) => {
                resolver = resolve;
            });
            const setupPromise = () => {
                promise = new Promise((resolve) => {
                    resolver = resolve;
                });
            };
            setupPromise();
            const handler = (event) => {
                if (resolver) {
                    resolver(event);
                }
            };
            target.addEventListener(type, handler);
            while (true) {
                if (promise) {
                    const event = (yield __await(promise));
                    yield yield __await(event);
                    setupPromise();
                }
            }
        });
    });
}
exports.fromEvent = fromEvent;
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
    drop(n) {
        const self = this;
        let count = 0;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_2, _a;
                try {
                    for (var self_2 = __asyncValues(self), self_2_1; self_2_1 = yield __await(self_2.next()), !self_2_1.done;) {
                        const elem = self_2_1.value;
                        if (count++ < n) {
                            continue;
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
    takeUntil(test) {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_3, _a;
                try {
                    for (var self_3 = __asyncValues(self), self_3_1; self_3_1 = yield __await(self_3.next()), !self_3_1.done;) {
                        const elem = self_3_1.value;
                        if (test(elem)) {
                            return yield __await(void 0);
                        }
                        yield yield __await(elem);
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
    flatten() {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_4, _a;
                try {
                    for (var self_4 = __asyncValues(self), self_4_1; self_4_1 = yield __await(self_4.next()), !self_4_1.done;) {
                        const elem = self_4_1.value;
                        if (Array.isArray(elem)) {
                            yield __await(yield* __asyncDelegator(__asyncValues(elem)));
                        }
                        else {
                            yield yield __await(elem);
                        }
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
    map(mapper) {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_5, _a;
                try {
                    for (var self_5 = __asyncValues(self), self_5_1; self_5_1 = yield __await(self_5.next()), !self_5_1.done;) {
                        const elem = self_5_1.value;
                        yield yield __await(mapper(elem));
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
    flatMap(mapper) {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_6, _a;
                try {
                    for (var self_6 = __asyncValues(self), self_6_1; self_6_1 = yield __await(self_6.next()), !self_6_1.done;) {
                        const elem = self_6_1.value;
                        yield __await(yield* __asyncDelegator(__asyncValues(mapper(elem))));
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (self_6_1 && !self_6_1.done && (_a = self_6.return)) yield __await(_a.call(self_6));
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            });
        });
    }
    filter(filter) {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_7, _a;
                try {
                    for (var self_7 = __asyncValues(self), self_7_1; self_7_1 = yield __await(self_7.next()), !self_7_1.done;) {
                        const elem = self_7_1.value;
                        if (filter(elem)) {
                            yield yield __await(elem);
                        }
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (self_7_1 && !self_7_1.done && (_a = self_7.return)) yield __await(_a.call(self_7));
                    }
                    finally { if (e_7) throw e_7.error; }
                }
            });
        });
    }
    tap(effect) {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_8, _a;
                try {
                    for (var self_8 = __asyncValues(self), self_8_1; self_8_1 = yield __await(self_8.next()), !self_8_1.done;) {
                        const elem = self_8_1.value;
                        effect(elem);
                        yield yield __await(elem);
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (self_8_1 && !self_8_1.done && (_a = self_8.return)) yield __await(_a.call(self_8));
                    }
                    finally { if (e_8) throw e_8.error; }
                }
            });
        });
    }
    // Consumer
    fold(initial, folder) {
        var e_9, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let acc = initial;
            try {
                for (var _b = __asyncValues(this.generator()), _c; _c = yield _b.next(), !_c.done;) {
                    const elem = _c.value;
                    acc = yield folder(elem, acc);
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_9) throw e_9.error; }
            }
            return acc;
        });
    }
    toArray() {
        var e_10, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const items = [];
            try {
                for (var _b = __asyncValues(this.generator()), _c; _c = yield _b.next(), !_c.done;) {
                    const elem = _c.value;
                    items.push(elem);
                }
            }
            catch (e_10_1) { e_10 = { error: e_10_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_10) throw e_10.error; }
            }
            return items;
        });
    }
    forEach(func) {
        var e_11, _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (var _b = __asyncValues(this), _c; _c = yield _b.next(), !_c.done;) {
                    const elem = _c.value;
                    yield func(elem);
                }
            }
            catch (e_11_1) { e_11 = { error: e_11_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_11) throw e_11.error; }
            }
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
    flatten() {
        const self = this;
        return new Stream(function* () {
            for (const elem of self) {
                if (Array.isArray(elem)) {
                    yield* elem;
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
    flatMap(mapper) {
        const self = this;
        return new Stream(function* () {
            for (const elem of self) {
                yield* mapper(elem);
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
    tap(effect) {
        const self = this;
        return new Stream(function* () {
            for (const elem of self) {
                effect(elem);
                yield elem;
            }
        });
    }
    // Consumer
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
    drop(n) {
        const self = this;
        let count = 0;
        return new Stream(function* () {
            for (const elem of self) {
                if (count++ < n) {
                    continue;
                }
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
    forEach(func) {
        for (const elem of this) {
            func(elem);
        }
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
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

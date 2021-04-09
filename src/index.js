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
class Stream {
    constructor(generator, transforms = []) {
        this.transforms = [];
        this.generator = generator;
        this.transforms = transforms;
    }
    // Transformers
    map(mapper) {
        const wrappedMapper = (entry) => {
            if (entry.type === "skip") {
                return entry;
            }
            return { type: "value", value: mapper(entry.value) };
        };
        return new Stream(this.generator, this.transforms.concat(wrappedMapper));
    }
    filter(predicate) {
        const wrappedFilter = (entry) => {
            if (entry.type === "skip") {
                return entry;
            }
            if (!predicate(entry.value)) {
                return { type: "skip" };
            }
            return entry;
        };
        return new Stream(this.generator, this.transforms.concat(wrappedFilter));
    }
    flatMap(mapper) {
        const wrapped = (entry) => {
            if (entry.type === "skip") {
                return entry;
            }
            return { type: "flatten", value: mapper(entry.value) };
        };
        return new Stream(this.generator, this.transforms.concat(wrapped));
    }
    take(n) {
        let count = 0;
        const wrapper = (entry) => {
            if (entry.type === "skip") {
                return entry;
            }
            if (count === n) {
                return { type: "halt" };
            }
            count++;
            return { type: "value", value: entry.value };
        };
        return new Stream(this.generator, this.transforms.concat(wrapper));
    }
    takeUntil(predicate) {
        const wrapper = (entry) => {
            if (entry.type === "skip") {
                return entry;
            }
            if (predicate(entry.value)) {
                return { type: "halt" };
            }
            return entry;
        };
        return new Stream(this.generator, this.transforms.concat(wrapper));
    }
    drop(n) {
        let count = 0;
        const wrapper = (entry) => {
            if (entry.type === "skip") {
                return entry;
            }
            if (entry.type === "value" && count < n) {
                count++;
                return { type: "skip" };
            }
            return entry;
        };
        return new Stream(this.generator, this.transforms.concat(wrapper));
    }
    flatten() {
        const wrapper = (entry) => {
            if (entry.type === "skip") {
                return entry;
            }
            return { type: "flatten", value: entry.value };
        };
        return new Stream(this.generator, this.transforms.concat(wrapper));
    }
    // Consumers
    toArray() {
        let results = [];
        for (const elem of this.generator()) {
            const result = this.transform(elem);
            if (result.type === "value") {
                results.push(result.value);
            }
            else if (result.type === "flatten") {
                if (Array.isArray(result.value)) {
                    results.push(...result.value);
                }
                else {
                    results.push(result.value);
                }
            }
            else if (result.type === "halt") {
                break;
            }
            else {
                continue;
            }
        }
        return results;
    }
    fold(initial, reducer) {
        let accumulator = initial;
        for (const elem of this.generator()) {
            const result = this.transform(elem);
            if (result.type === "value") {
                accumulator = reducer(result.value, accumulator);
            }
            else if (result.type === "flatten") {
                if (Array.isArray(result.value)) {
                    accumulator = result.value.reduce((v, acc) => reducer(v, acc), accumulator);
                }
                else {
                    accumulator = reducer(result.value, accumulator);
                }
            }
            else if (result.type === "halt") {
                return accumulator;
            }
            else {
                continue;
            }
        }
        return accumulator;
    }
    forEach(effect) {
        for (const elem of this.generator()) {
            const result = this.transform(elem);
            if (result.type === "halt") {
                return;
            }
            if (result.type === "value") {
                effect(result.value);
            }
        }
    }
    transform(value) {
        let acc = { type: "value", value };
        for (const transform of this.transforms) {
            if (acc.type === "halt") {
                return acc;
            }
            if (acc.type === "skip") {
                continue;
            }
            acc = transform(acc);
        }
        return acc;
    }
    // Lift to async
    mapAsync(mapper) {
        const wrappedMapper = (entry) => __awaiter(this, void 0, void 0, function* () {
            if (entry.type === "skip") {
                return entry;
            }
            return { type: "value", value: mapper(yield entry.value) };
        });
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                for (const elem of self) {
                    yield yield __await(elem);
                }
            });
        }, this.transforms.concat(wrappedMapper));
    }
    filterAsync(predicate) {
        const self = this;
        const newStream = new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                for (const elem of self) {
                    yield yield __await(elem);
                }
            });
        }, this.transforms);
        return newStream.filter(predicate);
    }
    foldAsync(initial, reducer) {
        const self = this;
        const newStream = new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                for (const elem of self) {
                    yield yield __await(elem);
                }
            });
        }, this.transforms);
        return newStream.fold(initial, reducer);
    }
    [Symbol.iterator]() {
        const self = this;
        return (function* () {
            for (const elem of self.generator()) {
                const result = self.transform(elem);
                if (result.type === "halt") {
                    return;
                }
                if (result.type === "value") {
                    yield result.value;
                }
            }
        })();
    }
}
class AsyncStream {
    constructor(generator, transforms = []) {
        this.transforms = [];
        this.generator = generator;
        this.transforms = transforms;
    }
    // Transformers
    map(mapper) {
        const wrappedMapper = (entry) => __awaiter(this, void 0, void 0, function* () {
            if (entry.type === "skip") {
                return entry;
            }
            return { type: "value", value: mapper(yield entry.value) };
        });
        return new AsyncStream(this.generator, this.transforms.concat(wrappedMapper));
    }
    filter(predicate) {
        const wrappedFilter = (entry) => __awaiter(this, void 0, void 0, function* () {
            if (entry.type === "skip") {
                return entry;
            }
            if (!(yield predicate(yield entry.value))) {
                return { type: "skip" };
            }
            return entry;
        });
        return new AsyncStream(this.generator, this.transforms.concat(wrappedFilter));
    }
    flatMap(mapper) {
        const wrapped = (entry) => __awaiter(this, void 0, void 0, function* () {
            if (entry.type === "skip") {
                return entry;
            }
            return { type: "flatten", value: mapper(yield entry.value) };
        });
        return new AsyncStream(this.generator, this.transforms.concat(wrapped));
    }
    take(n) {
        let count = 0;
        const wrapper = (entry) => __awaiter(this, void 0, void 0, function* () {
            if (entry.type === "skip") {
                return entry;
            }
            if (count === n) {
                return { type: "halt" };
            }
            count++;
            return { type: "value", value: entry.value };
        });
        return new AsyncStream(this.generator, this.transforms.concat(wrapper));
    }
    takeUntil(predicate) {
        const wrapper = (entry) => __awaiter(this, void 0, void 0, function* () {
            if (entry.type === "skip") {
                return entry;
            }
            if (yield predicate(yield entry.value)) {
                return { type: "halt" };
            }
            return entry;
        });
        return new AsyncStream(this.generator, this.transforms.concat(wrapper));
    }
    drop(n) {
        let count = 0;
        const wrapper = (entry) => __awaiter(this, void 0, void 0, function* () {
            if (entry.type === "skip") {
                return entry;
            }
            if (entry.type === "value" && count < n) {
                count++;
                return { type: "skip" };
            }
            return entry;
        });
        return new AsyncStream(this.generator, this.transforms.concat(wrapper));
    }
    flatten() {
        const wrapper = (entry) => __awaiter(this, void 0, void 0, function* () {
            if (entry.type === "skip") {
                return entry;
            }
            return { type: "flatten", value: entry.value };
        });
        return new AsyncStream(this.generator, this.transforms.concat(wrapper));
    }
    // Consumers
    toArray() {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let results = [];
            try {
                for (var _b = __asyncValues(this.generator()), _c; _c = yield _b.next(), !_c.done;) {
                    const elem = _c.value;
                    const result = yield this.transform(elem);
                    if (result.type === "value") {
                        results.push(result.value);
                    }
                    else if (result.type === "flatten") {
                        if (Array.isArray(result.value)) {
                            results.push(...(yield Promise.all(result.value)));
                        }
                        else {
                            results.push(yield result.value);
                        }
                    }
                    else if (result.type === "halt") {
                        break;
                    }
                    else {
                        continue;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return results;
        });
    }
    fold(initial, reducer) {
        var e_2, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let accumulator = initial;
            try {
                for (var _b = __asyncValues(this.generator()), _c; _c = yield _b.next(), !_c.done;) {
                    const elem = _c.value;
                    const result = yield this.transform(elem);
                    if (result.type === "value") {
                        accumulator = yield reducer(yield result.value, accumulator);
                    }
                    else if (result.type === "flatten") {
                        if (Array.isArray(result.value)) {
                            accumulator = result.value.reduce((v, acc) => reducer(v, acc), accumulator);
                        }
                        else {
                            accumulator = yield reducer(yield result.value, accumulator);
                        }
                    }
                    else if (result.type === "halt") {
                        return accumulator;
                    }
                    else {
                        continue;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return accumulator;
        });
    }
    forEach(effect) {
        var e_3, _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (var _b = __asyncValues(this.generator()), _c; _c = yield _b.next(), !_c.done;) {
                    const elem = _c.value;
                    const result = yield this.transform(elem);
                    if (result.type === "halt") {
                        return;
                    }
                    if (result.type === "value") {
                        effect(yield result.value);
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
        });
    }
    transform(value) {
        return __awaiter(this, void 0, void 0, function* () {
            let acc = { type: "value", value };
            for (const transform of this.transforms) {
                if (acc.type === "halt") {
                    return acc;
                }
                if (acc.type === "skip") {
                    continue;
                }
                acc = yield transform(acc);
            }
            return acc;
        });
    }
    [Symbol.asyncIterator]() {
        const self = this;
        return (function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_4, _a;
                try {
                    for (var _b = __asyncValues(self.generator()), _c; _c = yield __await(_b.next()), !_c.done;) {
                        const elem = _c.value;
                        const result = yield __await(self.transform(elem));
                        if (result.type === "halt") {
                            return yield __await(void 0);
                        }
                        if (result.type === "value") {
                            yield yield __await(result.value);
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            });
        })();
    }
}
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncStream = void 0;
const index_1 = require("./index");
class AsyncStream {
    constructor(generator, transforms = []) {
        this.transforms = [];
        this.generator = generator;
        this.transforms = transforms;
    }
    getGenerator() {
        return this.generator();
    }
    // Transformers
    transform(initial, transformer) {
        let accumulator = initial;
        const wrappedMapper = (entry) => __awaiter(this, void 0, void 0, function* () {
            if (entry.type === "skip") {
                return entry;
            }
            const ret = yield transformer(yield entry.value, accumulator);
            if (!ret) {
                return { type: "halt" };
            }
            accumulator = ret[1];
            return { type: "value", value: ret[0] };
        });
        return new AsyncStream(this.generator, this.transforms.concat(wrappedMapper));
    }
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
    tap(effect) {
        const wrapper = (entry) => __awaiter(this, void 0, void 0, function* () {
            if (entry.type === "value") {
                effect(yield entry.value);
            }
            return entry;
        });
        return new AsyncStream(this.generator, this.transforms.concat(wrapper));
    }
    concat(other) {
        const self = this;
        return new AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_1, _a, e_2, _b;
                try {
                    for (var self_1 = __asyncValues(self), self_1_1; self_1_1 = yield __await(self_1.next()), !self_1_1.done;) {
                        const one = self_1_1.value;
                        yield yield __await(one);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (self_1_1 && !self_1_1.done && (_a = self_1.return)) yield __await(_a.call(self_1));
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                try {
                    for (var other_1 = __asyncValues(other), other_1_1; other_1_1 = yield __await(other_1.next()), !other_1_1.done;) {
                        const two = other_1_1.value;
                        yield yield __await(two);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (other_1_1 && !other_1_1.done && (_b = other_1.return)) yield __await(_b.call(other_1));
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            });
        });
    }
    withIndex() {
        let index = 0;
        const wrappedMapper = (entry) => __awaiter(this, void 0, void 0, function* () {
            if (entry.type === "skip") {
                return entry;
            }
            return { type: "value", value: [yield entry.value, index++] };
        });
        return new AsyncStream(this.generator, this.transforms.concat(wrappedMapper));
    }
    combine(...others) {
        const generators = [
            this[Symbol.asyncIterator](),
            ...others.map((gen) => gen[Symbol.asyncIterator]()),
        ];
        const promises = generators.map((generator, index) => __awaiter(this, void 0, void 0, function* () {
            const res = yield generator.next();
            return {
                index,
                generator: index,
                retVal: res,
            };
        }));
        const accumulator = {
            generators,
            queue: promises.reduce((acc, next, index) => (Object.assign(Object.assign({}, acc), { [index]: next })), {}),
        };
        return index_1.unfoldAsync(accumulator, ({ generators, queue }) => __awaiter(this, void 0, void 0, function* () {
            if (generators.length === 0 && Object.keys(queue).length === 0) {
                return;
            }
            let result = yield Promise.race(Object.values(queue));
            delete queue[result.index];
            if (result.retVal.done) {
                generators.splice(result.generator, 1);
                if (generators.length === 0 && Object.keys(queue).length === 0) {
                    return;
                }
                result = yield Promise.race(Object.values(queue));
                delete queue[result.index];
                if (result.retVal.done) {
                    return;
                }
            }
            const nextIndex = Math.max(...Object.keys(queue).map((n) => parseInt(n))) + 1;
            const next = generators[result.generator].next().then((res) => {
                return {
                    index: nextIndex,
                    generator: result.generator,
                    retVal: res,
                };
            });
            queue[nextIndex] = next;
            return [result.retVal.value, { generators, queue }];
        }));
    }
    // Consumers
    toArray() {
        var e_3, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let results = [];
            try {
                for (var _b = __asyncValues(this.generator()), _c; _c = yield _b.next(), !_c.done;) {
                    const elem = _c.value;
                    const result = yield this.applyTransforms(elem);
                    if (result.type === "value") {
                        results.push(yield result.value);
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
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return results;
        });
    }
    fold(initial, reducer) {
        var e_4, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let accumulator = initial;
            try {
                for (var _b = __asyncValues(this.generator()), _c; _c = yield _b.next(), !_c.done;) {
                    const elem = _c.value;
                    const result = yield this.applyTransforms(elem);
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
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_4) throw e_4.error; }
            }
            return accumulator;
        });
    }
    forEach(effect) {
        var e_5, _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (var _b = __asyncValues(this.generator()), _c; _c = yield _b.next(), !_c.done;) {
                    const elem = _c.value;
                    const result = yield this.applyTransforms(elem);
                    if (result.type === "halt") {
                        return;
                    }
                    if (result.type === "value") {
                        effect(yield result.value);
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_5) throw e_5.error; }
            }
        });
    }
    applyTransforms(value) {
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
                var e_6, _a;
                try {
                    for (var _b = __asyncValues(self.generator()), _c; _c = yield __await(_b.next()), !_c.done;) {
                        const elem = _c.value;
                        const result = yield __await(self.applyTransforms(elem));
                        if (result.type === "halt") {
                            return yield __await(void 0);
                        }
                        if (result.type === "value") {
                            yield yield __await(result.value);
                        }
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            });
        })();
    }
}
exports.AsyncStream = AsyncStream;

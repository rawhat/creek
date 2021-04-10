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
exports.Stream = void 0;
const asyncStream_1 = require("./asyncStream");
class Stream {
    constructor(generator, transforms = []) {
        this.transforms = [];
        this.generator = generator;
        this.transforms = transforms;
    }
    // Transformers
    transform(initial, transformer) {
        let accumulator = initial;
        const wrappedMapper = (entry) => {
            if (entry.type === "skip") {
                return entry;
            }
            const next = transformer(entry.value, accumulator);
            if (!next) {
                return { type: "halt" };
            }
            accumulator = next[1];
            return { type: "value", value: next[0] };
        };
        return new Stream(this.generator, this.transforms.concat(wrappedMapper));
    }
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
    tap(effect) {
        const wrapper = (entry) => {
            if (entry.type === "value") {
                effect(entry.value);
            }
            return entry;
        };
        return new Stream(this.generator, this.transforms.concat(wrapper));
    }
    concat(other) {
        const self = this;
        return new Stream(function* () {
            for (const one of self) {
                yield one;
            }
            for (const two of other) {
                yield two;
            }
        });
    }
    // Consumers
    toArray() {
        let results = [];
        for (const elem of this.generator()) {
            const result = this.applyTransforms(elem);
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
            const result = this.applyTransforms(elem);
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
            const result = this.applyTransforms(elem);
            if (result.type === "halt") {
                return;
            }
            if (result.type === "value") {
                effect(result.value);
            }
        }
    }
    applyTransforms(value) {
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
        return new asyncStream_1.AsyncStream(function () {
            return __asyncGenerator(this, arguments, function* () {
                var e_1, _a;
                try {
                    for (var self_1 = __asyncValues(self), self_1_1; self_1_1 = yield __await(self_1.next()), !self_1_1.done;) {
                        const elem = self_1_1.value;
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
        }, this.transforms.concat(wrappedMapper));
    }
    filterAsync(predicate) {
        const self = this;
        const newStream = new asyncStream_1.AsyncStream(function () {
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
        const newStream = new asyncStream_1.AsyncStream(function () {
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
                const result = self.applyTransforms(elem);
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
exports.Stream = Stream;

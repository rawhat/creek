export declare function of<T>(elem: T): Stream<T, T>;
export declare function fromArray<T>(elems: T[]): Stream<T, T>;
export declare function from(n: number): Stream<number, number>;
export declare function unfold<T, R>(initial: R, mapper: (v: R) => [T, R] | undefined): Stream<T, R>;
export declare function iterate<T>(initial: T, mapper: (v: T) => T): Stream<T, T>;
export declare function interval(n: number): AsyncStream<number, number>;
export declare function timer(n: number): AsyncStream<number, number>;
export declare function unfoldAsync<T, R>(initial: R, mapper: (v: R) => Promise<[T, R] | undefined>): AsyncStream<T, T>;
export declare function iterateAsync<T>(initial: T, mapper: (v: T) => Promise<T>): AsyncStream<T, T>;
declare type EventMap<T> = T extends EventTarget ? T extends WebSocket ? WebSocketEventMap : T extends HTMLElement ? HTMLElementEventMap : T extends Element ? ElementEventMap : never : never;
export declare function fromEvent<B extends EventTarget, T extends keyof EventMap<B> & string, E extends EventMap<B>[T]>(target: B, type: T): AsyncStream<E, E>;
declare class Stream<T, R> {
    private generator;
    private transforms;
    constructor(generator: () => Generator<T, void, void>, transforms?: Function[]);
    map<V>(mapper: (value: T) => V): Stream<T, V>;
    filter(predicate: (value: T) => boolean): Stream<T, R>;
    flatMap<V>(mapper: (value: T) => V): Stream<T, V>;
    take(n: number): Stream<T, R>;
    takeUntil(predicate: (value: T) => boolean): Stream<T, T>;
    drop(n: number): Stream<T, T>;
    flatten(): Stream<T, R>;
    toArray(): R[];
    fold<V>(initial: V, reducer: (next: R, accumulator: V) => V): V;
    forEach(effect: (value: R) => void): void;
    private transform;
    mapAsync<R>(mapper: (value: T) => Promise<R>): AsyncStream<R, unknown>;
    filterAsync(predicate: (value: R) => Promise<boolean>): AsyncStream<R, R>;
    foldAsync<V>(initial: V, reducer: (next: R, acc: V) => Promise<V>): Promise<V>;
    [Symbol.iterator](): Generator<R, void, unknown>;
}
declare class AsyncStream<T, R> {
    private generator;
    private transforms;
    constructor(generator: () => AsyncGenerator<T, void, void>, transforms?: Function[]);
    map<V>(mapper: (value: T) => Promise<V>): AsyncStream<T, V>;
    filter(predicate: (value: T) => Promise<boolean>): AsyncStream<T, T>;
    flatMap<V>(mapper: (value: T) => Promise<V>): AsyncStream<T, V>;
    take(n: number): AsyncStream<T, R>;
    takeUntil(predicate: (value: T) => Promise<boolean>): AsyncStream<T, T>;
    drop(n: number): AsyncStream<T, T>;
    flatten(): AsyncStream<T, R>;
    toArray(): Promise<R[]>;
    fold<V>(initial: V, reducer: (next: R, accumulator: V) => Promise<V>): Promise<V>;
    forEach(effect: (value: R) => void): Promise<void>;
    private transform;
    [Symbol.asyncIterator](): AsyncGenerator<R, void, unknown>;
}
export {};

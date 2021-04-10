import { AsyncStream } from "./asyncStream";
import { Stream } from "./stream";
export declare function of<T>(elem: T): Stream<T, T>;
export declare function fromArray<T>(elems: T[]): Stream<T, T>;
export declare function from(n: number): Stream<number, number>;
export declare function unfold<T, R>(
  initial: R,
  mapper: (v: R) => [T, R] | undefined
): Stream<T, R>;
export declare function iterate<T>(
  initial: T,
  mapper: (v: T) => T
): Stream<T, T>;
export declare function interval(n: number): AsyncStream<number, number>;
export declare function timer(n: number): AsyncStream<number, number>;
export declare function unfoldAsync<T, R>(
  initial: R,
  mapper: (v: R) => Promise<[T, R] | undefined>
): AsyncStream<T, T>;
export declare function iterateAsync<T>(
  initial: T,
  mapper: (v: T) => Promise<T>
): AsyncStream<T, T>;
declare type EventMap<T> = T extends EventTarget
  ? T extends WebSocket
    ? WebSocketEventMap
    : T extends HTMLElement
    ? HTMLElementEventMap
    : T extends Element
    ? ElementEventMap
    : never
  : never;
export declare function fromEvent<
  B extends EventTarget,
  T extends keyof EventMap<B> & string,
  E extends EventMap<B>[T]
>(target: B, type: T): AsyncStream<E, E>;
export {};

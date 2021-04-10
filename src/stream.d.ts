import { AsyncStream } from "./asyncStream";
export declare type StreamEntry<T> =
  | {
      type: "skip";
    }
  | {
      type: "value";
      value: T;
    }
  | {
      type: "flatten";
      value: T;
    };
export declare type StreamResult<T> =
  | StreamEntry<T>
  | {
      type: "halt";
    };
export declare class Stream<T, R> {
  private generator;
  private transforms;
  constructor(
    generator: () => Generator<T, void, void>,
    transforms?: Function[]
  );
  transform<V, M>(
    initial: V,
    transformer: (value: T, accumulator: V) => [M, V] | undefined
  ): Stream<T, unknown>;
  map<V>(mapper: (value: T) => V): Stream<T, V>;
  filter(predicate: (value: T) => boolean): Stream<T, R>;
  flatMap<V>(mapper: (value: T) => V): Stream<T, V>;
  take(n: number): Stream<T, R>;
  takeUntil(predicate: (value: T) => boolean): Stream<T, T>;
  drop(n: number): Stream<T, T>;
  flatten(): Stream<T, R>;
  tap(effect: (value: T) => void): Stream<T, T>;
  concat<V>(other: Stream<V, V>): Stream<R | V, R | V>;
  toArray(): R[];
  fold<V>(initial: V, reducer: (next: R, accumulator: V) => V): V;
  forEach(effect: (value: R) => void): void;
  private applyTransforms;
  mapAsync<R>(mapper: (value: T) => Promise<R>): AsyncStream<T, R>;
  filterAsync(predicate: (value: R) => Promise<boolean>): AsyncStream<R, R>;
  foldAsync<V>(
    initial: V,
    reducer: (next: R, acc: V) => Promise<V>
  ): Promise<V>;
  [Symbol.iterator](): Generator<R, void, unknown>;
}

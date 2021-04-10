import { StreamEntry } from "./stream";
export declare type AsyncStreamEntry<T> = StreamEntry<Promise<T> | T>;
export declare type AsyncStreamResult<T> =
  | {
      type: "halt";
    }
  | AsyncStreamEntry<T>;
export declare class AsyncStream<T, R> {
  private generator;
  private transforms;
  constructor(
    generator: () => AsyncGenerator<T, void, void>,
    transforms?: Function[]
  );
  getGenerator(): AsyncGenerator<T, void, void>;
  transform<V, N>(
    initial: V,
    transformer: (next: R, accumulator: V) => Promise<[N, V] | undefined>
  ): AsyncStream<T, unknown>;
  map<V>(mapper: (value: R) => Promise<V>): AsyncStream<T, V>;
  filter(predicate: (value: R) => Promise<boolean>): AsyncStream<T, T>;
  flatMap<V>(mapper: (value: R) => Promise<V>): AsyncStream<T, V>;
  take(n: number): AsyncStream<T, R>;
  takeUntil(predicate: (value: R) => Promise<boolean>): AsyncStream<T, R>;
  drop(n: number): AsyncStream<T, R>;
  flatten(): AsyncStream<T, R>;
  tap(effect: (value: R) => Promise<void>): AsyncStream<T, R>;
  concat<T1, R1>(other: AsyncStream<T1, R1>): AsyncStream<R | R1, R | R1>;
  withIndex(): AsyncStream<T, [R, number]>;
  combine<T1, R1>(a: AsyncStream<T1, R1>): AsyncStream<T | T1, R | R1>;
  combine<T1, R1, T2, R2>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>
  ): AsyncStream<T | T1 | T2, R | R1 | R2>;
  combine<T1, R1, T2, R2, T3, R3>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>
  ): AsyncStream<T | T1 | T2 | T3, R | R1 | R2 | R3>;
  combine<T1, R1, T2, R2, T3, R3, T4, R4>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>,
    d: AsyncStream<T4, R4>
  ): AsyncStream<T | T1 | T2 | T3 | T4, R | R1 | R2 | R3 | R4>;
  combine<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>,
    d: AsyncStream<T4, R4>,
    e: AsyncStream<T5, R5>
  ): AsyncStream<T | T1 | T2 | T3 | T4 | T5, R | R1 | R2 | R3 | R4 | R5>;
  combine<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5, T6, R6>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>,
    d: AsyncStream<T4, R4>,
    e: AsyncStream<T5, R5>,
    f: AsyncStream<T6, R6>
  ): AsyncStream<
    T | T1 | T2 | T3 | T4 | T5 | T6,
    R | R1 | R2 | R3 | R4 | R5 | R6
  >;
  combine<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5, T6, R6, T7, R7>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>,
    d: AsyncStream<T4, R4>,
    e: AsyncStream<T5, R5>,
    f: AsyncStream<T6, R6>,
    g: AsyncStream<T7, R7>
  ): AsyncStream<
    T | T1 | T2 | T3 | T4 | T5 | T6 | T7,
    R | R1 | R2 | R3 | R4 | R5 | R6 | R7
  >;
  combine<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5, T6, R6, T7, R7, T8, R8>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>,
    d: AsyncStream<T4, R4>,
    e: AsyncStream<T5, R5>,
    f: AsyncStream<T6, R6>,
    g: AsyncStream<T7, R7>,
    h: AsyncStream<T8, R8>
  ): AsyncStream<
    T | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8,
    R | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8
  >;
  combine<
    T1,
    R1,
    T2,
    R2,
    T3,
    R3,
    T4,
    R4,
    T5,
    R5,
    T6,
    R6,
    T7,
    R7,
    T8,
    R8,
    T9,
    R9
  >(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>,
    d: AsyncStream<T4, R4>,
    e: AsyncStream<T5, R5>,
    f: AsyncStream<T6, R6>,
    g: AsyncStream<T7, R7>,
    h: AsyncStream<T8, R8>,
    i: AsyncStream<T9, R9>
  ): AsyncStream<
    T | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9,
    R | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9
  >;
  combine<
    T1,
    R1,
    T2,
    R2,
    T3,
    R3,
    T4,
    R4,
    T5,
    R5,
    T6,
    R6,
    T7,
    R7,
    T8,
    R8,
    T9,
    R9,
    T10,
    R10
  >(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>,
    d: AsyncStream<T4, R4>,
    e: AsyncStream<T5, R5>,
    f: AsyncStream<T6, R6>,
    g: AsyncStream<T7, R7>,
    h: AsyncStream<T8, R8>,
    i: AsyncStream<T9, R9>,
    j: AsyncStream<T10, R10>
  ): AsyncStream<
    T | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10,
    R | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10
  >;
  toArray(): Promise<R[]>;
  fold<V>(
    initial: V,
    reducer: (next: R, accumulator: V) => Promise<V>
  ): Promise<V>;
  forEach(effect: (value: R) => void): Promise<void>;
  private applyTransforms;
  [Symbol.asyncIterator](): AsyncGenerator<R, void, unknown>;
}

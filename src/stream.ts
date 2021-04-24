import { AsyncStream } from "./asyncStream";

export type StreamEntry<T> =
  | { type: "skip" }
  | { type: "value"; value: T }
  | { type: "flatten"; value: T };

export type StreamResult<T> = StreamEntry<T> | { type: "halt" };

export class Stream<T, R> {
  private iterator: () => Iterator<T, void, void>;
  private transforms: Function[] = [];

  constructor(
    iterator: () => Iterator<T, void, void>,
    transforms: Function[] = []
  ) {
    this.iterator = iterator;
    this.transforms = transforms;
  }

  // Transformers

  transform<V, N>(
    initial: V,
    transformer: (
      value: R,
      accumulator: V
    ) => [N, V] | [{ flatten: N }, V] | [V] | undefined
  ) {
    let accumulator = initial;
    const wrappedMapper = (entry: StreamEntry<R>): StreamResult<N> => {
      if (entry.type === "skip") {
        return entry;
      }
      const next = transformer(entry.value, accumulator);
      if (!next) {
        return { type: "halt" };
      }
      if (next.length === 1) {
        accumulator = next[0];
        return { type: "skip" };
      }
      accumulator = next[1];
      if (typeof next[0] === "object" && "flatten" in next[0]) {
        return { type: "flatten", value: next[0].flatten };
      } else {
        return { type: "value", value: next[0] };
      }
    };
    return new Stream<T, N>(
      this.iterator,
      this.transforms.concat(wrappedMapper)
    );
  }

  map<V>(mapper: (entry: R) => V): Stream<T, V> {
    return this.transform(undefined, (entry, acc) => {
      return [mapper(entry), acc];
    });
  }

  filter(predicate: (entry: R) => boolean): Stream<T, R> {
    return this.transform(undefined, (entry, acc) => {
      if (!predicate(entry)) {
        return [acc];
      }
      return [entry, acc];
    });
  }

  flatMap<V>(mapper: (entry: R) => V) {
    return this.transform(undefined, (entry, acc) => {
      return [{ flatten: mapper(entry) }, acc];
    });
  }

  take(n: number): Stream<T, R> {
    return this.transform(0, (entry, acc) => {
      if (acc >= n) {
        return;
      }
      return [entry, acc + 1];
    });
  }

  takeUntil(predicate: (entry: R) => boolean) {
    return this.transform(undefined, (entry, acc) => {
      if (predicate(entry)) {
        return;
      }
      return [entry, acc];
    });
  }

  drop(n: number) {
    return this.transform(0, (entry, acc) => {
      if (acc < n) {
        return [acc + 1];
      }
      return [entry, acc];
    });
  }

  flatten() {
    return this.transform(undefined, (entry, acc) => {
      return [{ flatten: entry }, acc];
    });
  }

  tap(effect: (value: R) => void) {
    return this.transform(undefined, (entry, acc) => {
      effect(entry);
      return [entry, acc];
    });
  }

  concat<V>(other: Stream<V, V>): Stream<R | V, R | V> {
    return new Stream<R | V, R | V>(() => {
      let iterators = [this[Symbol.iterator](), other[Symbol.iterator]()];
      return {
        next: () => {
          const [iter, nextIter] = iterators;
          if (!iter) {
            return { done: true, value: undefined };
          }
          const { value, done } = iter.next();
          if (done) {
            if (!nextIter) {
              return { done: true, value: undefined };
            } else {
              iterators = iterators.slice(1);
              const { value, done } = nextIter.next();
              return { value, done };
            }
          }
          return value;
        },
      };
    });
  }

  zip<T1, R1>(a: Stream<T1, R1>): Stream<T | T1, (R | R1)[]>;
  zip<T1, R1, T2, R2>(
    a: Stream<T1, R1>,
    b: Stream<T2, R2>
  ): Stream<T | T1 | T2, (R | R1 | R2)[]>;
  zip<T1, R1, T2, R2, T3, R3>(
    a: Stream<T1, R1>,
    b: Stream<T2, R2>,
    c: Stream<T3, R3>
  ): Stream<T | T1 | T2 | T3, (R | R1 | R2 | R3)[]>;
  zip<T1, R1, T2, R2, T3, R3, T4, R4>(
    a: Stream<T1, R1>,
    b: Stream<T2, R2>,
    c: Stream<T3, R3>,
    d: Stream<T4, R4>
  ): Stream<T | T1 | T2 | T3 | T4, (R | R1 | R2 | R3 | R4)[]>;
  zip<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5>(
    a: Stream<T1, R1>,
    b: Stream<T2, R2>,
    c: Stream<T3, R3>,
    d: Stream<T4, R4>,
    e: Stream<T5, R5>
  ): Stream<T | T1 | T2 | T3 | T4 | T5, (R | R1 | R2 | R3 | R4 | R5)[]>;
  zip<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5, T6, R6>(
    a: Stream<T1, R1>,
    b: Stream<T2, R2>,
    c: Stream<T3, R3>,
    d: Stream<T4, R4>,
    e: Stream<T5, R5>,
    f: Stream<T6, R6>
  ): Stream<
    T | T1 | T2 | T3 | T4 | T5 | T6,
    (R | R1 | R2 | R3 | R4 | R5 | R6)[]
  >;
  zip<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5, T6, R6, T7, R7>(
    a: Stream<T1, R1>,
    b: Stream<T2, R2>,
    c: Stream<T3, R3>,
    d: Stream<T4, R4>,
    e: Stream<T5, R5>,
    f: Stream<T6, R6>,
    g: Stream<T7, R7>
  ): Stream<
    T | T1 | T2 | T3 | T4 | T5 | T6 | T7,
    (R | R1 | R2 | R3 | R4 | R5 | R6 | R7)[]
  >;
  zip<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5, T6, R6, T7, R7, T8, R8>(
    a: Stream<T1, R1>,
    b: Stream<T2, R2>,
    c: Stream<T3, R3>,
    d: Stream<T4, R4>,
    e: Stream<T5, R5>,
    f: Stream<T6, R6>,
    g: Stream<T7, R7>,
    h: Stream<T8, R8>
  ): Stream<
    T | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8,
    (R | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8)[]
  >;
  zip<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5, T6, R6, T7, R7, T8, R8, T9, R9>(
    a: Stream<T1, R1>,
    b: Stream<T2, R2>,
    c: Stream<T3, R3>,
    d: Stream<T4, R4>,
    e: Stream<T5, R5>,
    f: Stream<T6, R6>,
    g: Stream<T7, R7>,
    h: Stream<T8, R8>,
    i: Stream<T9, R9>
  ): Stream<
    T | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9,
    (R | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9)[]
  >;
  zip<
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
    a: Stream<T1, R1>,
    b: Stream<T2, R2>,
    c: Stream<T3, R3>,
    d: Stream<T4, R4>,
    e: Stream<T5, R5>,
    f: Stream<T6, R6>,
    g: Stream<T7, R7>,
    h: Stream<T8, R8>,
    i: Stream<T9, R9>,
    j: Stream<T10, R10>
  ): Stream<
    T | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10,
    (R | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10)[]
  >;
  zip(...others: Stream<any, any>[]) {
    const accumulator = others.map((other) => other[Symbol.iterator]());
    return this.transform(accumulator, (entry, acc) => {
      const nextValues = acc
        .map((n) => n.next())
        .filter((n) => !n.done)
        .map((n) => n.value);
      if (nextValues.length !== acc.length) {
        return;
      }
      return [[entry, ...nextValues], acc];
    });
  }

  // Consumers

  toArray(): R[] {
    return [...this];
  }

  fold<V>(initial: V, reducer: (next: R, accumulator: V) => V) {
    let accumulator = initial;
    for (const elem of this) {
      accumulator = reducer(elem, accumulator);
    }
    return accumulator;
  }

  forEach(effect: (value: R) => void) {
    for (const elem of this) {
      effect(elem);
    }
  }

  // Lift to async

  mapAsync<V>(mapper: (value: R) => Promise<V>) {
    const self = this;
    return new AsyncStream<R, R>(async function* () {
      for await (const elem of self) {
        yield elem;
      }
    }).map(mapper);
  }

  filterAsync(predicate: (value: R) => Promise<boolean>) {
    const self = this;
    return new AsyncStream<R, R>(async function* () {
      for (const elem of self) {
        yield elem;
      }
    }).filter(predicate);
  }

  async foldAsync<V>(initial: V, reducer: (next: R, acc: V) => Promise<V>) {
    let acc = initial;
    for (const elem of this) {
      acc = await reducer(elem, acc);
    }
    return acc;
  }

  [Symbol.iterator]() {
    const iter = this.iterator();
    let buffer: R[] = [];
    return {
      next: () => {
        while (true) {
          if (buffer.length > 0) {
            const [value, ...rest] = buffer;
            buffer = rest;
            return { value, done: false };
          }
          const value = iter.next();
          if (value.done) {
            return { done: true };
          }
          const mapped = this.applyTransforms(value.value);
          switch (mapped.type) {
            case "halt": {
              return { done: true };
            }
            case "skip": {
              continue;
            }
            case "flatten": {
              if (Array.isArray(mapped.value)) {
                const [value, ...rest] = mapped.value;
                buffer = buffer.concat(rest);
                return { value, done: false };
              } else {
                return { value: mapped.value, done: false };
              }
            }
            case "value": {
              return { value: mapped.value, done: false };
            }
          }
        }
      },
    };
  }

  private applyTransforms(value: T): StreamResult<R> {
    let acc = { type: "value", value };
    for (const transform of this.transforms) {
      if (acc.type === "halt") {
        return acc as StreamResult<R>;
      }
      if (acc.type === "skip") {
        continue;
      }
      acc = transform(acc);
    }
    return acc as StreamResult<R>;
  }
}

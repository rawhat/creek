import { StreamEntry } from "./stream";
import { unfoldAsync } from "./index";

export type AsyncStreamEntry<T> = StreamEntry<Promise<T> | T>;
export type AsyncStreamResult<T> = { type: "halt" } | AsyncStreamEntry<T>;

export class AsyncStream<T, R> {
  private iterator: () => AsyncIterator<T, void, void>;
  private transforms: Function[] = [];

  constructor(
    iterator: () => AsyncIterator<T, void, void>,
    transforms: Function[] = []
  ) {
    this.iterator = iterator;
    this.transforms = transforms;
  }

  // Transformers

  transform<V, N>(
    initial: V,
    transformer: (
      next: R,
      accumulator: V
    ) => Promise<[N, V] | [{ flatten: N }, V] | [V] | undefined>
  ) {
    let accumulator = initial;
    const wrappedMapper = async (
      entry: AsyncStreamEntry<R>
    ): Promise<AsyncStreamResult<N>> => {
      if (entry.type === "skip") {
        return entry;
      }
      const ret = await transformer(await entry.value, accumulator);
      if (!ret) {
        return { type: "halt" };
      }
      if (ret.length === 1) {
        accumulator = ret[0];
        return { type: "skip" };
      }
      accumulator = ret[1];
      if (typeof ret[0] === "object" && "flatten" in ret[0]) {
        return { type: "flatten", value: ret[0].flatten };
      } else {
        return { type: "value", value: ret[0] };
      }
    };

    return new AsyncStream<T, N>(
      this.iterator,
      this.transforms.concat(wrappedMapper)
    );
  }

  map<V>(mapper: (entry: R) => Promise<V>): AsyncStream<T, V> {
    return this.transform(undefined, async (entry, acc) => [
      await mapper(entry),
      acc,
    ]);
  }

  filter(predicate: (entry: R) => Promise<boolean>): AsyncStream<T, R> {
    return this.transform(undefined, async (entry, acc) => {
      if (!(await predicate(entry))) {
        return [acc];
      }
      return [entry, acc];
    });
  }

  flatMap<V>(mapper: (entry: R) => Promise<V>): AsyncStream<T, V> {
    return this.transform<undefined, V>(undefined, async (entry, acc) => [
      { flatten: await mapper(entry) },
      acc,
    ]);
  }

  take(n: number): AsyncStream<T, R> {
    return this.transform(0, async (entry, acc) => {
      if (acc >= n) {
        return;
      }
      return [entry, acc + 1];
    });
  }

  takeUntil(predicate: (entry: R) => Promise<boolean>) {
    return this.transform(undefined, async (entry, acc) => {
      if (await predicate(entry)) {
        return;
      }
      return [entry, acc];
    });
  }

  drop(n: number) {
    return this.transform(0, async (entry, acc) => {
      if (acc > n) {
        return [entry, acc];
      }
      return [acc + 1];
    });
  }

  flatten() {
    return this.transform(undefined, async (entry, acc) => {
      return [{ flatten: entry }, acc];
    });
  }

  tap(effect: (value: R) => Promise<void>) {
    return this.transform(undefined, async (entry, acc) => {
      effect(entry);
      return [entry, acc];
    });
  }

  concat<T1, R1>(other: AsyncStream<T1, R1>): AsyncStream<R | R1, R | R1> {
    const self = this;
    return new AsyncStream<R | R1, R | R1>(async function* () {
      for await (const one of self) {
        yield one;
      }
      for await (const two of other) {
        yield two;
      }
    });
  }

  withIndex(): AsyncStream<T, [R, number]> {
    return this.transform(0, async (entry, acc) => {
      return [[entry, acc], acc + 1];
    });
  }

  debounce(duration: number) {
    return this.transform(-1, async (entry, previous) => {
      const now = Date.now();
      if (now - previous < duration) {
        return [previous];
      }
      return [entry, now];
    });
  }

  zip<T1, R1>(a: AsyncStream<T1, R1>): AsyncStream<T | T1, (R | R1)[]>;
  zip<T1, R1, T2, R2>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>
  ): AsyncStream<T | T1 | T2, (R | R1 | R2)[]>;
  zip<T1, R1, T2, R2, T3, R3>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>
  ): AsyncStream<T | T1 | T2 | T3, (R | R1 | R2 | R3)[]>;
  zip<T1, R1, T2, R2, T3, R3, T4, R4>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>,
    d: AsyncStream<T4, R4>
  ): AsyncStream<T | T1 | T2 | T3 | T4, (R | R1 | R2 | R3 | R4)[]>;
  zip<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>,
    d: AsyncStream<T4, R4>,
    e: AsyncStream<T5, R5>
  ): AsyncStream<T | T1 | T2 | T3 | T4 | T5, (R | R1 | R2 | R3 | R4 | R5)[]>;
  zip<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5, T6, R6>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>,
    d: AsyncStream<T4, R4>,
    e: AsyncStream<T5, R5>,
    f: AsyncStream<T6, R6>
  ): AsyncStream<
    T | T1 | T2 | T3 | T4 | T5 | T6,
    (R | R1 | R2 | R3 | R4 | R5 | R6)[]
  >;
  zip<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5, T6, R6, T7, R7>(
    a: AsyncStream<T1, R1>,
    b: AsyncStream<T2, R2>,
    c: AsyncStream<T3, R3>,
    d: AsyncStream<T4, R4>,
    e: AsyncStream<T5, R5>,
    f: AsyncStream<T6, R6>,
    g: AsyncStream<T7, R7>
  ): AsyncStream<
    T | T1 | T2 | T3 | T4 | T5 | T6 | T7,
    (R | R1 | R2 | R3 | R4 | R5 | R6 | R7)[]
  >;
  zip<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5, T6, R6, T7, R7, T8, R8>(
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
    (R | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8)[]
  >;
  zip<T1, R1, T2, R2, T3, R3, T4, R4, T5, R5, T6, R6, T7, R7, T8, R8, T9, R9>(
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
    (R | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10)[]
  >;
  zip(...others: AsyncStream<any, any>[]) {
    const accumulator = others.map((other) => other[Symbol.asyncIterator]());
    return this.transform(accumulator, async (entry, acc) => {
      const nextValues = (await Promise.all(acc.map((next) => next.next())))
        .filter((n) => !n.done)
        .map((n) => n.value);
      if (nextValues.length !== acc.length) {
        return;
      }
      return [[entry, ...nextValues], acc];
    });
  }

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

  combine<V>(...others: AsyncStream<V, V>[]) {
    const iterators = [
      this[Symbol.asyncIterator](),
      ...others.map((gen) => gen[Symbol.asyncIterator]()),
    ];

    const promises = iterators.map(async (iterator, index) => {
      const res = await iterator.next();
      return {
        index,
        iterator: index,
        retVal: res,
      };
    });

    type QueueEntry = {
      index: number;
      iterator: number;
      retVal: IteratorResult<R | V>;
    };

    type Accumulator = {
      iterators: AsyncIterator<R | V>[];
      queue: { [index: number]: Promise<QueueEntry> };
    };

    const accumulator: Accumulator = {
      iterators,
      queue: promises.reduce(
        (acc, next, index) => ({
          ...acc,
          [index]: next,
        }),
        {}
      ),
    };

    return unfoldAsync(accumulator, async ({ iterators, queue }) => {
      if (iterators.length === 0 && Object.keys(queue).length === 0) {
        return;
      }

      let result = await Promise.race(Object.values(queue));
      delete queue[result.index];

      if (result.retVal.done) {
        iterators.splice(result.iterator, 1);
        if (iterators.length === 0 && Object.keys(queue).length === 0) {
          return;
        }
        result = await Promise.race(Object.values(queue));
        delete queue[result.index];
        if (result.retVal.done) {
          return;
        }
      }

      const nextIndex =
        Math.max(...Object.keys(queue).map((n) => parseInt(n))) + 1;
      const next = iterators[result.iterator].next().then((res) => {
        return {
          index: nextIndex,
          iterator: result.iterator,
          retVal: res,
        };
      });
      queue[nextIndex] = next;

      return [result.retVal.value, { iterators, queue }];
    });
  }

  // Consumers

  async toArray(): Promise<R[]> {
    let res = [];
    for await (const elem of this) {
      res.push(elem);
    }
    return res;
  }

  async fold<V>(initial: V, reducer: (next: R, accumulator: V) => Promise<V>) {
    let accumulator = initial;
    for await (const elem of this) {
      accumulator = await reducer(elem, accumulator);
    }
    return accumulator;
  }

  async forEach(effect: (value: R) => void) {
    for await (const elem of this) {
      effect(elem);
    }
  }

  [Symbol.asyncIterator]() {
    const iter = this.iterator();
    let buffer: R[] = [];

    return {
      next: async () => {
        while (true) {
          if (buffer.length > 0) {
            const [value, ...rest] = buffer;
            buffer = rest;
            return { value, done: false };
          }
          const value = await iter.next();
          if (value.done) {
            return { done: true, value: undefined };
          }
          const mapped = await this.applyTransforms(value.value);
          switch (mapped.type) {
            case "halt": {
              return { done: true, value: undefined };
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

  private async applyTransforms(value: T): Promise<AsyncStreamResult<R>> {
    let acc = { type: "value", value };
    for (const transform of this.transforms) {
      if (acc.type === "halt") {
        return acc as AsyncStreamResult<R>;
      }
      if (acc.type === "skip") {
        continue;
      }
      acc = await transform(acc);
    }
    return acc as AsyncStreamResult<R>;
  }
}

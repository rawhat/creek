import { StreamEntry } from "./stream";
import { unfoldAsync } from "./index";

export type AsyncStreamEntry<T> = StreamEntry<Promise<T> | T>;
export type AsyncStreamResult<T> = { type: "halt" } | AsyncStreamEntry<T>;

export class AsyncStream<T, R> {
  private generator: () => AsyncGenerator<T, void, void>;
  private transforms: Function[] = [];

  constructor(
    generator: () => AsyncGenerator<T, void, void>,
    transforms: Function[] = []
  ) {
    this.generator = generator;
    this.transforms = transforms;
  }

  public getGenerator(): AsyncGenerator<T, void, void> {
    return this.generator();
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
      this.generator,
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

  combine(...others: AsyncStream<any, any>[]) {
    const generators = [
      this[Symbol.asyncIterator](),
      ...others.map((gen) => gen[Symbol.asyncIterator]()),
    ];

    const promises = generators.map(async (generator, index) => {
      const res = await generator.next();
      return {
        index,
        generator: index,
        retVal: res,
      };
    });

    type QueueEntry = {
      index: number;
      generator: number;
      retVal: IteratorResult<R>;
    };

    type Accumulator = {
      generators: AsyncGenerator<any>[];
      queue: { [index: number]: Promise<QueueEntry> };
    };

    const accumulator: Accumulator = {
      generators,
      queue: promises.reduce(
        (acc, next, index) => ({
          ...acc,
          [index]: next,
        }),
        {}
      ),
    };

    return unfoldAsync(accumulator, async ({ generators, queue }) => {
      if (generators.length === 0 && Object.keys(queue).length === 0) {
        return;
      }

      let result = await Promise.race(Object.values(queue));
      delete queue[result.index];

      if (result.retVal.done) {
        generators.splice(result.generator, 1);
        if (generators.length === 0 && Object.keys(queue).length === 0) {
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
      const next = generators[result.generator].next().then((res) => {
        return {
          index: nextIndex,
          generator: result.generator,
          retVal: res,
        };
      });
      queue[nextIndex] = next;

      return [result.retVal.value, { generators, queue }];
    });
  }

  // Consumers

  async toArray(): Promise<R[]> {
    let results: R[] = [];
    for await (const elem of this.generator()) {
      const result = await this.applyTransforms(elem);
      if (result.type === "value") {
        results.push(await result.value);
      } else if (result.type === "flatten") {
        if (Array.isArray(result.value)) {
          results.push(...(await Promise.all(result.value)));
        } else {
          results.push(await result.value);
        }
      } else if (result.type === "halt") {
        break;
      } else {
        continue;
      }
    }
    return results;
  }

  async fold<V>(initial: V, reducer: (next: R, accumulator: V) => Promise<V>) {
    let accumulator = initial;
    for await (const elem of this.generator()) {
      const result = await this.applyTransforms(elem);
      if (result.type === "value") {
        accumulator = await reducer(await result.value, accumulator);
      } else if (result.type === "flatten") {
        if (Array.isArray(result.value)) {
          accumulator = result.value.reduce(
            (v, acc) => reducer(v, acc),
            accumulator
          );
        } else {
          accumulator = await reducer(await result.value, accumulator);
        }
      } else if (result.type === "halt") {
        return accumulator;
      } else {
        continue;
      }
    }
    return accumulator;
  }

  async forEach(effect: (value: R) => void) {
    for await (const elem of this.generator()) {
      const result = await this.applyTransforms(elem);
      if (result.type === "halt") {
        return;
      }
      if (result.type === "value") {
        effect(await result.value);
      }
    }
  }

  [Symbol.asyncIterator]() {
    const self = this;
    return (async function* () {
      for await (const elem of self.generator()) {
        const result = await self.applyTransforms(elem);
        if (result.type === "halt") {
          return;
        }
        if (result.type === "value") {
          yield result.value;
        }
      }
    })();
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

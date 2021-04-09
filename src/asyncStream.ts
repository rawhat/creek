import { StreamEntry } from "./stream";

export type AsyncStreamEntry<T> = StreamEntry<Promise<T>>;
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

  // Transformers

  map<V>(mapper: (value: T) => Promise<V>): AsyncStream<T, V> {
    const wrappedMapper = async (
      entry: AsyncStreamEntry<T>
    ): Promise<AsyncStreamEntry<V>> => {
      if (entry.type === "skip") {
        return entry;
      }
      return { type: "value", value: mapper(await entry.value) };
    };
    return new AsyncStream(
      this.generator,
      this.transforms.concat(wrappedMapper)
    );
  }

  filter(predicate: (value: T) => Promise<boolean>): AsyncStream<T, T> {
    const wrappedFilter = async (
      entry: AsyncStreamEntry<T>
    ): Promise<AsyncStreamEntry<T>> => {
      if (entry.type === "skip") {
        return entry;
      }
      if (!(await predicate(await entry.value))) {
        return { type: "skip" };
      }
      return entry;
    };
    return new AsyncStream(
      this.generator,
      this.transforms.concat(wrappedFilter)
    );
  }

  flatMap<V>(mapper: (value: T) => Promise<V>) {
    const wrapped = async (
      entry: AsyncStreamEntry<T>
    ): Promise<AsyncStreamEntry<V>> => {
      if (entry.type === "skip") {
        return entry;
      }
      return { type: "flatten", value: mapper(await entry.value) };
    };
    return new AsyncStream<T, V>(
      this.generator,
      this.transforms.concat(wrapped)
    );
  }

  take(n: number): AsyncStream<T, R> {
    let count = 0;
    const wrapper = async (
      entry: AsyncStreamEntry<T>
    ): Promise<AsyncStreamResult<T>> => {
      if (entry.type === "skip") {
        return entry;
      }
      if (count === n) {
        return { type: "halt" };
      }
      count++;
      return { type: "value", value: entry.value };
    };
    return new AsyncStream(this.generator, this.transforms.concat(wrapper));
  }

  takeUntil(predicate: (value: T) => Promise<boolean>) {
    const wrapper = async (
      entry: AsyncStreamEntry<T>
    ): Promise<AsyncStreamResult<T>> => {
      if (entry.type === "skip") {
        return entry;
      }
      if (await predicate(await entry.value)) {
        return { type: "halt" };
      }
      return entry;
    };
    return new AsyncStream<T, T>(
      this.generator,
      this.transforms.concat(wrapper)
    );
  }

  drop(n: number) {
    let count = 0;
    const wrapper = async (
      entry: AsyncStreamEntry<T>
    ): Promise<AsyncStreamResult<T>> => {
      if (entry.type === "skip") {
        return entry;
      }
      if (entry.type === "value" && count < n) {
        count++;
        return { type: "skip" };
      }
      return entry;
    };
    return new AsyncStream<T, T>(
      this.generator,
      this.transforms.concat(wrapper)
    );
  }

  flatten() {
    const wrapper = async (
      entry: AsyncStreamEntry<T>
    ): Promise<AsyncStreamEntry<T>> => {
      if (entry.type === "skip") {
        return entry;
      }
      return { type: "flatten", value: entry.value };
    };
    return new AsyncStream<T, R>(
      this.generator,
      this.transforms.concat(wrapper)
    );
  }

  tap(effect: (value: T) => Promise<void>) {
    const wrapper = async (
      entry: AsyncStreamEntry<T>
    ): Promise<AsyncStreamResult<T>> => {
      if (entry.type === "value") {
        effect(await entry.value);
      }
      return entry;
    };
    return new AsyncStream<T, R>(
      this.generator,
      this.transforms.concat(wrapper)
    );
  }

  concat<V>(other: AsyncStream<V, V>): AsyncStream<R | V, R | V> {
    const self = this;
    return new AsyncStream<R | V, R | V>(async function* () {
      for await (const one of self) {
        yield one;
      }
      for await (const two of other) {
        yield two;
      }
    });
  }

  // Consumers

  async toArray(): Promise<R[]> {
    let results: R[] = [];
    for await (const elem of this.generator()) {
      const result = await this.transform(elem);
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
      const result = await this.transform(elem);
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
      const result = await this.transform(elem);
      if (result.type === "halt") {
        return;
      }
      if (result.type === "value") {
        effect(await result.value);
      }
    }
  }

  private async transform(value: T): Promise<AsyncStreamResult<R>> {
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

  [Symbol.asyncIterator]() {
    const self = this;
    return (async function* () {
      for await (const elem of self.generator()) {
        const result = await self.transform(elem);
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

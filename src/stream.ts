import { AsyncStream, AsyncStreamEntry } from "./asyncStream";

export type StreamEntry<T> =
  | { type: "skip" }
  | { type: "value"; value: T }
  | { type: "flatten"; value: T };

export type StreamResult<T> = StreamEntry<T> | { type: "halt" };

export class Stream<T, R> {
  private generator: () => Generator<T, void, void>;
  private transforms: Function[] = [];

  constructor(
    generator: () => Generator<T, void, void>,
    transforms: Function[] = []
  ) {
    this.generator = generator;
    this.transforms = transforms;
  }

  // Transformers

  map<V>(mapper: (value: T) => V): Stream<T, V> {
    const wrappedMapper = (entry: StreamEntry<T>): StreamEntry<V> => {
      if (entry.type === "skip") {
        return entry;
      }
      return { type: "value", value: mapper(entry.value) };
    };
    return new Stream(this.generator, this.transforms.concat(wrappedMapper));
  }

  filter(predicate: (value: T) => boolean): Stream<T, R> {
    const wrappedFilter = (entry: StreamEntry<T>): StreamEntry<T> => {
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

  flatMap<V>(mapper: (value: T) => V) {
    const wrapped = (entry: StreamEntry<T>): StreamEntry<V> => {
      if (entry.type === "skip") {
        return entry;
      }
      return { type: "flatten", value: mapper(entry.value) };
    };
    return new Stream<T, V>(this.generator, this.transforms.concat(wrapped));
  }

  take(n: number): Stream<T, R> {
    let count = 0;
    const wrapper = (entry: StreamEntry<T>) => {
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

  takeUntil(predicate: (value: T) => boolean) {
    const wrapper = (entry: StreamEntry<T>) => {
      if (entry.type === "skip") {
        return entry;
      }
      if (predicate(entry.value)) {
        return { type: "halt" };
      }
      return entry;
    };
    return new Stream<T, T>(this.generator, this.transforms.concat(wrapper));
  }

  drop(n: number) {
    let count = 0;
    const wrapper = (entry: StreamEntry<T>) => {
      if (entry.type === "skip") {
        return entry;
      }
      if (entry.type === "value" && count < n) {
        count++;
        return { type: "skip" };
      }
      return entry;
    };
    return new Stream<T, T>(this.generator, this.transforms.concat(wrapper));
  }

  flatten() {
    const wrapper = (entry: StreamEntry<T>): StreamEntry<T> => {
      if (entry.type === "skip") {
        return entry;
      }
      return { type: "flatten", value: entry.value };
    };
    return new Stream<T, R>(this.generator, this.transforms.concat(wrapper));
  }

  tap(effect: (value: T) => void) {
    const wrapper = (entry: StreamEntry<T>): StreamEntry<T> => {
      if (entry.type === "value") {
        effect(entry.value);
      }
      return entry;
    };
    return new Stream<T, T>(this.generator, this.transforms.concat(wrapper));
  }

  concat<V>(other: Stream<V, V>): Stream<R | V, R | V> {
    const self = this;
    return new Stream<R | V, R | V>(function* () {
      for (const one of self) {
        yield one;
      }
      for (const two of other) {
        yield two;
      }
    })
  }

  // Consumers

  toArray(): R[] {
    let results: R[] = [];
    for (const elem of this.generator()) {
      const result = this.transform(elem);
      if (result.type === "value") {
        results.push(result.value);
      } else if (result.type === "flatten") {
        if (Array.isArray(result.value)) {
          results.push(...result.value);
        } else {
          results.push(result.value);
        }
      } else if (result.type === "halt") {
        break;
      } else {
        continue;
      }
    }
    return results;
  }

  fold<V>(initial: V, reducer: (next: R, accumulator: V) => V) {
    let accumulator = initial;
    for (const elem of this.generator()) {
      const result = this.transform(elem);
      if (result.type === "value") {
        accumulator = reducer(result.value, accumulator);
      } else if (result.type === "flatten") {
        if (Array.isArray(result.value)) {
          accumulator = result.value.reduce(
            (v, acc) => reducer(v, acc),
            accumulator
          );
        } else {
          accumulator = reducer(result.value, accumulator);
        }
      } else if (result.type === "halt") {
        return accumulator;
      } else {
        continue;
      }
    }
    return accumulator;
  }

  forEach(effect: (value: R) => void) {
    for (const elem of this.generator()) {
      const result = this.transform(elem);
      if (result.type === "halt") {
        return;
      }
      if (result.type === "value") {
        effect(result.value);
      }
    }
  }

  private transform(value: T): StreamResult<R> {
    let acc = { type: "value", value };
    for (const transform of this.transforms) {
      if (acc.type === "halt") {
        return acc as StreamEntry<R>;
      }
      if (acc.type === "skip") {
        continue;
      }
      acc = transform(acc);
    }
    return acc as StreamEntry<R>;
  }

  // Lift to async

  mapAsync<R>(mapper: (value: T) => Promise<R>) {
    const wrappedMapper = async (
      entry: AsyncStreamEntry<T>
    ): Promise<AsyncStreamEntry<R>> => {
      if (entry.type === "skip") {
        return entry;
      }
      return { type: "value", value: mapper(await entry.value) };
    };
    const self = this;
    return new AsyncStream<T, R>(async function* () {
      for await (const elem of self) {
        yield (elem as unknown) as T;
      }
    }, this.transforms.concat(wrappedMapper));
  }

  filterAsync(predicate: (value: R) => Promise<boolean>) {
    const self = this;
    const newStream = new AsyncStream<R, R>(async function* () {
      for (const elem of self) {
        yield elem;
      }
    }, this.transforms);
    return newStream.filter(predicate);
  }

  foldAsync<V>(initial: V, reducer: (next: R, acc: V) => Promise<V>) {
    const self = this;
    const newStream = new AsyncStream<R, R>(async function* () {
      for (const elem of self) {
        yield elem;
      }
    }, this.transforms);
    return newStream.fold<V>(initial, reducer);
  }

  [Symbol.iterator]() {
    const self = this;
    return (function* () {
      for (const elem of self.generator()) {
        const result = self.transform(elem);
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

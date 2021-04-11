import { AsyncStream } from "./asyncStream";

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
      this.generator,
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
    const self = this;
    return new Stream<R | V, R | V>(function* () {
      for (const one of self) {
        yield one;
      }
      for (const two of other) {
        yield two;
      }
    });
  }

  // Consumers

  toArray(): R[] {
    return [...this[Symbol.iterator]()];
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

  foldAsync<V>(initial: V, reducer: (next: R, acc: V) => Promise<V>) {
    const self = this;
    return new AsyncStream<R, R>(async function* () {
      for (const elem of self) {
        yield elem;
      }
    }, this.transforms).fold<V>(initial, reducer);
  }

  [Symbol.iterator]() {
    const self = this;
    return (function* () {
      for (const elem of self.generator()) {
        const result = self.applyTransforms(elem);
        if (result.type === "halt") {
          return;
        }
        if (result.type === "flatten") {
          if (Array.isArray(result.value)) {
            yield* result.value;
          } else {
            yield result.value;
          }
        }
        if (result.type === "value") {
          yield result.value;
        }
      }
    })();
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

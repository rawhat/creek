export function of<T>(elem: T) {
  return new Stream<T, T>(function* () {
    yield elem;
  });
}

export function fromArray<T>(elems: T[]) {
  return new Stream<T, T>(function* () {
    for (let elem of elems) {
      yield elem;
    }
  });
}

export function from(n: number) {
  let num = n;
  return new Stream<number, number>(function* () {
    while (true) {
      yield num++;
    }
  });
}

export function unfold<T, R>(initial: R, mapper: (v: R) => [T, R] | undefined) {
  let acc = initial;
  return new Stream<T, R>(function* () {
    while (true) {
      const mapped = mapper(acc);
      if (mapped === undefined) {
        return;
      }
      acc = mapped[1];
      yield mapped[0];
    }
  });
}

export function iterate<T>(initial: T, mapper: (v: T) => T) {
  let acc: T;
  return new Stream<T, T>(function* () {
    while (true) {
      if (!acc) {
        acc = initial;
        yield initial;
      } else {
        acc = mapper(acc);
        yield acc;
      }
    }
  });
}

export function interval(n: number) {
  let count = 0;
  return new AsyncStream<number, number>(async function* () {
    while (true) {
      await delay(n);
      yield count++;
    }
  });
}

export function timer(n: number) {
  return new AsyncStream<number, number>(async function* () {
    await delay(n);
    yield 0;
  });
}

export function unfoldAsync<T, R>(
  initial: R,
  mapper: (v: R) => Promise<[T, R] | undefined>
) {
  let acc = initial;
  return new AsyncStream<T, T>(async function* () {
    while (true) {
      const mapped = await mapper(acc);
      if (mapped === undefined) {
        return;
      }
      acc = mapped[1];
      yield mapped[0];
    }
  });
}

export function iterateAsync<T>(initial: T, mapper: (v: T) => Promise<T>) {
  let acc: T;
  return new AsyncStream<T, T>(async function* () {
    while (true) {
      if (!acc) {
        acc = initial;
        yield initial;
      } else {
        acc = await mapper(acc);
        yield acc;
      }
    }
  });
}

type EventMap<T> = T extends EventTarget
  ? T extends WebSocket
    ? WebSocketEventMap
    : T extends HTMLElement
    ? HTMLElementEventMap
    : T extends Element
    ? ElementEventMap
    : never
  : never;

export function fromEvent<
  B extends EventTarget,
  T extends keyof EventMap<B> & string,
  E extends EventMap<B>[T]
>(target: B, type: T): AsyncStream<E, E> {
  return new AsyncStream<E, E>(async function* () {
    let resolver: ((event: E) => void) | undefined = undefined;
    let promise = new Promise((resolve) => {
      resolver = resolve;
    });
    const setupPromise = () => {
      promise = new Promise((resolve) => {
        resolver = resolve;
      });
    };
    setupPromise();
    const handler = (event: E) => {
      if (resolver) {
        resolver(event);
      }
    };
    target.addEventListener(
      type,
      handler as EventListenerOrEventListenerObject
    );

    while (true) {
      if (promise) {
        const event = ((await promise) as unknown) as E;
        yield event;
        setupPromise();
      }
    }
  });
}

type StreamEntry<T> =
  | { type: "skip" }
  | { type: "value"; value: T }
  | { type: "flatten"; value: T };
type StreamResult<T> = StreamEntry<T> | { type: "halt" };

class Stream<T, R> {
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

type AsyncStreamEntry<T> = StreamEntry<Promise<T>>;
type AsyncStreamResult<T> = { type: "halt" } | AsyncStreamEntry<T>;

class AsyncStream<T, R> {
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

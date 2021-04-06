export class Stream<T> {
  private generator: AsyncIterator<T>;

  constructor(generator: AsyncIterator<T>) {
    this.generator = generator;
  }

  // Generators

  static fromArray<T>(elems: T[]) {
    let items = elems;
    return new Stream<T>({
      next: async () => {
        const next = items[0];
        items = items.slice(1);
        if (!next) {
          return { done: true } as IteratorResult<T>;
        }
        return { value: next, done: false };
      }
    })
  }

  static from(n: number) {
    let num = n;
    return new Stream<number>({
      next: async () => {
        return {value: num++, done: false};
      }
    });
  }

  static unfold<T, R>(
    initial: R,
    mapper: (v: R) => Promise<[T, R] | undefined>
  ) {
    let acc = initial;
    return new Stream<T>({
      next: async () => {
        const result = await mapper(acc);
        if (result === undefined) {
          return {value: undefined, done: true};
        }
        acc = result[1];
        return {value: result[0], done: false};
      }
    });
  }

  // Transformers

  takeUntil(test: (value: T) => boolean) {
    return new Stream<T>({
      next: async () => {
        const {value, done} = await this.generator.next();
        if (done) {
          return {value, done};
        }
        if (test(value)) {
          return {value, done: true};
        }
        return {value, done: false};
      }
    });
  }

  flatten() {
    let list: T[] = [];
    return new Stream<T>({
      next: async () => {
        const next = list.pop();
        if (next) {
          return {value: next, done: false};
        }
        const nextItems = await this.generator.next();
        if (!nextItems || nextItems.done) {
          return {done: true} as IteratorResult<T>;
        }
        if (Array.isArray(nextItems.value)) {
          const [next, ...l] = nextItems.value;
          list = l;
          return {value: next, done: false};
        }
        return nextItems;
      }
    });
  }

  map<R>(mapper: (value: T) => R) {
    return new Stream<R>({
      next: async () => {
        const {value, done} = await this.generator.next();
        if (!value || done) {
          return { done: true } as IteratorResult<R>;
        }
        return { value: mapper(value), done: false }
      }
    })
  }

  filter(filter: (value: T) => boolean) {
    return new Stream<T>({
      next: async () => {
        const {value, done} = await this.generator.next();
        if (!value || done) {
          return { done: true } as IteratorResult<T>;
        }
        if (filter(value)) {
          return { value: value, done: false };
        }
        return { done: false } as IteratorResult<T>;
      }
    })
  }

  // Consumer

  async toArray(): Promise<T[]> {
    let items = [];
    for await (let elem of this) {
      items.push(elem);
    }
    return items;
  }

  [Symbol.asyncIterator]() {
    return this.generator;
  }
}

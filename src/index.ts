export function of<T>(elem: T) {
  return new Stream<T>(function* () {
    yield elem;
  });
}

export function fromArray<T>(elems: T[]) {
  return new Stream<T>(function* () {
    for (let elem of elems) {
      yield elem;
    }
  });
}

export function from(n: number) {
  let num = n;
  return new Stream<number>(function* () {
    while (true) {
      yield num++;
    }
  });
}

export function unfold<T, R>(initial: R, mapper: (v: R) => [T, R] | undefined) {
  let acc = initial;
  return new Stream<T>(function* () {
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
  return new Stream<T>(function* () {
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
  return new AsyncStream<number>(async function* () {
    while (true) {
      await delay(n);
      yield count++;
    }
  });
}

export function timer(n: number) {
  return new AsyncStream<number>(async function* () {
    await delay(n);
    yield 0;
  });
}

export function unfoldAsync<T, R>(
  initial: R,
  mapper: (v: R) => Promise<[T, R] | undefined>
) {
  let acc = initial;
  return new AsyncStream<T>(async function* () {
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
  return new AsyncStream<T>(async function* () {
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

class AsyncStream<T> {
  private generator: () => AsyncGenerator<T, void, void>;

  constructor(generator: () => AsyncGenerator<T, void, void>) {
    this.generator = generator;
  }

  // Transformers

  take(n: number) {
    const self = this;
    let count = 0;
    return new AsyncStream<T>(async function* () {
      for await (const elem of self) {
        if (count === n) {
          return;
        }
        count++;
        yield elem;
      }
    });
  }

  drop(n: number) {
    const self = this;
    let count = 0;
    return new AsyncStream<T>(async function* () {
      for await (const elem of self) {
        if (count++ < n) {
          continue;
        }
        yield elem;
      }
    });
  }

  takeUntil(test: (value: T) => boolean) {
    const self = this;
    return new AsyncStream<T>(async function* () {
      for await (const elem of self) {
        if (test(elem)) {
          return;
        }
        yield elem;
      }
    });
  }

  flatten() {
    const self = this;
    return new AsyncStream<T>(async function* () {
      for await (const elem of self) {
        if (Array.isArray(elem)) {
          yield* elem;
        } else {
          yield elem;
        }
      }
    });
  }

  map<R>(mapper: (value: T) => R) {
    const self = this;
    return new AsyncStream<R>(async function* () {
      for await (const elem of self) {
        yield mapper(elem);
      }
    });
  }

  flatMap<R>(mapper: (value: T) => R[]) {
    const self = this;
    return new AsyncStream<R>(async function* () {
      for await (const elem of self) {
        yield* mapper(elem);
      }
    });
  }

  filter(filter: (value: T) => boolean) {
    const self = this;
    return new AsyncStream<T>(async function* () {
      for await (const elem of self) {
        if (filter(elem)) {
          yield elem;
        }
      }
    });
  }

  // Consumer

  async fold<R>(initial: R, folder: (value: T, accum: R) => Promise<R>) {
    let acc = initial;
    for await (const elem of this.generator()) {
      acc = await folder(elem, acc);
    }
    return acc;
  }

  async toArray(): Promise<T[]> {
    const items: T[] = [];
    for await (const elem of this.generator()) {
      items.push(elem);
    }
    return items;
  }

  async forEach(func: (value: T) => Promise<void>) {
    for await (const elem of this) {
      await func(elem);
    }
  }

  [Symbol.asyncIterator]() {
    return this.generator();
  }
}

class Stream<T> {
  private generator: () => Generator<T, void, void>;

  constructor(generator: () => Generator<T, void, void>) {
    this.generator = generator;
  }

  // Transformers

  flatten() {
    const self = this;
    return new Stream<T>(function* () {
      for (const elem of self) {
        if (Array.isArray(elem)) {
          yield* elem;
        } else {
          yield elem;
        }
      }
    });
  }

  map<R>(mapper: (value: T) => R) {
    const self = this;
    return new Stream<R>(function* () {
      for (const elem of self) {
        yield mapper(elem);
      }
    });
  }

  flatMap<R>(mapper: (value: T) => R[]) {
    const self = this;
    return new Stream<R>(function* () {
      for (const elem of self) {
        yield* mapper(elem);
      }
    });
  }

  filter(filter: (value: T) => boolean) {
    const self = this;
    return new Stream<T>(function* () {
      for (const elem of self) {
        if (filter(elem)) {
          yield elem;
        }
      }
    });
  }

  // Consumer

  take(n: number) {
    const self = this;
    let count = 0;
    return new Stream<T>(function* () {
      for (const elem of self) {
        if (count === n) {
          return;
        }
        count++;
        yield elem;
      }
    });
  }

  drop(n: number) {
    const self = this;
    let count = 0;
    return new Stream<T>(function* () {
      for (const elem of self) {
        if (count++ < n) {
          continue;
        }
        yield elem;
      }
    });
  }

  takeUntil(test: (value: T) => boolean) {
    const self = this;
    return new Stream<T>(function* () {
      for (const elem of self) {
        if (test(elem)) {
          return;
        }
        yield elem;
      }
    });
  }

  fold<R>(initial: R, folder: (value: T, accum: R) => R) {
    let acc = initial;
    for (const elem of this.generator()) {
      acc = folder(elem, acc);
    }
    return acc;
  }

  toArray(): T[] {
    const items: T[] = [];
    for (const elem of this.generator()) {
      items.push(elem);
    }
    return items;
  }

  forEach(func: (value: T) => void) {
    for (const elem of this) {
      func(elem);
    }
  }

  // Lift to async

  mapAsync<R>(mapper: (value: T) => Promise<R>) {
    const self = this;
    return new AsyncStream<R>(async function* () {
      for (const elem of self) {
        yield await mapper(elem);
      }
    });
  }

  filterAsync(test: (value: T) => Promise<boolean>) {
    const self = this;
    return new AsyncStream<T>(async function* () {
      for (const elem of self) {
        if (await test(elem)) {
          yield elem;
        }
      }
    });
  }

  async foldAsync<R>(initial: R, folder: (value: T, accum: R) => Promise<R>) {
    const self = this;
    let acc = initial;
    for (const elem of self) {
      acc = await folder(elem, acc);
    }
    return acc;
  }

  [Symbol.iterator]() {
    return this.generator();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

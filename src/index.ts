import { AsyncStream } from "./asyncStream";
import { Stream } from "./stream";

export function of<T>(elem: T) {
  let done = false;
  return new Stream<T, T>(() => ({
    next: () => {
      if (done) {
        return { done: true, value: undefined };
      }
      return { value: elem, done: false };
    },
  }));
}

export function fromArray<T>(elems: T[]) {
  let index = 0;
  return new Stream<T, T>(() => ({
    next: () => {
      if (index >= elems.length) {
        return { done: true, value: undefined };
      }
      return { value: elems[index++], done: false };
    },
  }));
}

export function from(n: number) {
  let num = n;
  return new Stream<number, number>(() => ({
    next: () => {
      return { value: num++, done: false };
    },
  }));
}

export function unfold<T, R>(initial: R, mapper: (v: R) => [T, R] | undefined) {
  let acc = initial;
  return new Stream<T, R>(() => ({
    next: () => {
      const mapped = mapper(acc);
      if (mapped === undefined) {
        return { done: true, value: undefined };
      }
      acc = mapped[1];
      return { value: mapped[0], done: false };
    },
  }));
}

export function iterate<T>(initial: T, mapper: (v: T) => T) {
  let acc: T;
  return new Stream<T, T>(() => ({
    next: () => {
      if (!acc) {
        acc = initial;
        return { value: initial, done: false };
      } else {
        acc = mapper(acc);
        return { value: acc, done: false };
      }
    },
  }));
}

export function interval(n: number) {
  let count = 0;
  return new AsyncStream<number, number>(async function* () {
    while (true) {
      yield count++;
      await delay(n);
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

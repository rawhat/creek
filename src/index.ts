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

type HasListener<S, Event extends string> =
  | (S extends { addListener: (event: Event, listener: (...args: any[]) => any) => any } ? S : never)
  | (S extends { addEventListener: (event: Event, listener: (...args: any[]) => any) => any } ? S : never);

type ListenerArguments<S, Event> =
| (S extends { addListener: (event: Event, listener: (...args: infer F) => any) => any } ? F : never)
| (S extends { addEventListener: (event: Event, listener: (...args: infer F) => any) => any } ? F : never);

export function fromEvent<Event extends string, S>(target: HasListener<S, Event>, type: Event) {
  type CallbackArgs = ListenerArguments<S, Event>;
  return new AsyncStream<CallbackArgs, CallbackArgs>(async function* () {
    let resolver: ((event: CallbackArgs) => void) | undefined = undefined;
    let promise: Promise<CallbackArgs> = new Promise((resolve) => {
      resolver = resolve;
    });
    const setupPromise = () => {
      promise = new Promise((resolve) => {
        resolver = resolve;
      });
    };
    setupPromise();
    const handler = (...args: CallbackArgs) => {
      if (resolver) {
        resolver(args);
      }
    };
    if ('addEventListener' in target) {
      target.addEventListener(type, handler);
    } else if ('addListener' in target) {
      target.addListener(type, handler);
    } else {
      throw Error(
        'Invalid target passed as event source.  ' +
        'Must provide either `addEventListener` or `addListener` method'
      );
    }

    while (true) {
      if (promise) {
        const event = await promise;
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

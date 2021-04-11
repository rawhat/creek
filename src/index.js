"use strict";
var __await =
  (this && this.__await) ||
  function (v) {
    return this instanceof __await ? ((this.v = v), this) : new __await(v);
  };
var __asyncGenerator =
  (this && this.__asyncGenerator) ||
  function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator)
      throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []),
      i,
      q = [];
    return (
      (i = {}),
      verb("next"),
      verb("throw"),
      verb("return"),
      (i[Symbol.asyncIterator] = function () {
        return this;
      }),
      i
    );
    function verb(n) {
      if (g[n])
        i[n] = function (v) {
          return new Promise(function (a, b) {
            q.push([n, v, a, b]) > 1 || resume(n, v);
          });
        };
    }
    function resume(n, v) {
      try {
        step(g[n](v));
      } catch (e) {
        settle(q[0][3], e);
      }
    }
    function step(r) {
      r.value instanceof __await
        ? Promise.resolve(r.value.v).then(fulfill, reject)
        : settle(q[0][2], r);
    }
    function fulfill(value) {
      resume("next", value);
    }
    function reject(value) {
      resume("throw", value);
    }
    function settle(f, v) {
      if ((f(v), q.shift(), q.length)) resume(q[0][0], q[0][1]);
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromEvent = exports.iterateAsync = exports.unfoldAsync = exports.timer = exports.interval = exports.iterate = exports.unfold = exports.from = exports.fromArray = exports.of = void 0;
const asyncStream_1 = require("./asyncStream");
const stream_1 = require("./stream");
function of(elem) {
  return new stream_1.Stream(function* () {
    yield elem;
  });
}
exports.of = of;
function fromArray(elems) {
  return new stream_1.Stream(function* () {
    for (let elem of elems) {
      yield elem;
    }
  });
}
exports.fromArray = fromArray;
function from(n) {
  let num = n;
  return new stream_1.Stream(function* () {
    while (true) {
      yield num++;
    }
  });
}
exports.from = from;
function unfold(initial, mapper) {
  let acc = initial;
  return new stream_1.Stream(function* () {
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
exports.unfold = unfold;
function iterate(initial, mapper) {
  let acc;
  return new stream_1.Stream(function* () {
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
exports.iterate = iterate;
function interval(n) {
  let count = 0;
  return new asyncStream_1.AsyncStream(function () {
    return __asyncGenerator(this, arguments, function* () {
      while (true) {
        yield __await(delay(n));
        yield yield __await(count++);
      }
    });
  });
}
exports.interval = interval;
function timer(n) {
  return new asyncStream_1.AsyncStream(function () {
    return __asyncGenerator(this, arguments, function* () {
      yield __await(delay(n));
      yield yield __await(0);
    });
  });
}
exports.timer = timer;
function unfoldAsync(initial, mapper) {
  let acc = initial;
  return new asyncStream_1.AsyncStream(function () {
    return __asyncGenerator(this, arguments, function* () {
      while (true) {
        const mapped = yield __await(mapper(acc));
        if (mapped === undefined) {
          return yield __await(void 0);
        }
        acc = mapped[1];
        yield yield __await(mapped[0]);
      }
    });
  });
}
exports.unfoldAsync = unfoldAsync;
function iterateAsync(initial, mapper) {
  let acc;
  return new asyncStream_1.AsyncStream(function () {
    return __asyncGenerator(this, arguments, function* () {
      while (true) {
        if (!acc) {
          acc = initial;
          yield yield __await(initial);
        } else {
          acc = yield __await(mapper(acc));
          yield yield __await(acc);
        }
      }
    });
  });
}
exports.iterateAsync = iterateAsync;
function fromEvent(target, type) {
  return new asyncStream_1.AsyncStream(function () {
    return __asyncGenerator(this, arguments, function* () {
      let resolver = undefined;
      let promise = new Promise((resolve) => {
        resolver = resolve;
      });
      const setupPromise = () => {
        promise = new Promise((resolve) => {
          resolver = resolve;
        });
      };
      setupPromise();
      const handler = (event) => {
        if (resolver) {
          resolver(event);
        }
      };
      target.addEventListener(type, handler);
      while (true) {
        if (promise) {
          const event = yield __await(promise);
          yield yield __await(event);
          setupPromise();
        }
      }
    });
  });
}
exports.fromEvent = fromEvent;
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

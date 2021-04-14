# creek

Lazy list methods, based loosely on the `Elixir.Stream` module.

## Generators

### `stream.of`

Creates a stream from a value.

```javascript
const s = stream.of(1);
// Stream<1>
```

### `stream.fromArray`

Creates a stream from an array.

```javascript
const s = stream.fromArray([1, 2, 3]);
// Stream<1, 2, 3>
```

### `stream.from`

Creates an infinite stream of numbers starting from `n`.

```javascript
const s = stream.from(1);
// Stream<1, 2, 3, ...>
```

### `stream.fromEvent`

Creates a stream from an event listener callback. Should handle any EventTarget,
with type-safety on the message type.

```javascript
const ws = new WebSocket("ws://localhost/echo");
const s = stream.fromEvent(ws, "message");
ws.send("hello, world!");
// AsyncStream<MessageEvent("hello, world!")>
```

### `stream.unfold`

Generates consecutive values from a base value and an accumulator, which
determines when the computation is completed.

```javascript
const s = stream.unfold(1, (accumulator) => {
  if (accumulator > 10) {
    return;
  }

  return [accumulator, accumulator + 1];
});
// Stream<1, 2, ..., 10>
```

### `stream.iterate`

Creates an infinite stream from the initial value, where subsequent values are
generated from the iterator function.

```javascript
const s = stream.iterate(1, (n) => n + 1);
// Stream<1, 2, 3, ...>
```

### `stream.unfoldAsync`

Similar to `unfold` above, but the accumulator method is asynchronous.

```javascript
const s = stream.unfoldAsync("value", async (value) => {
  const next = await someFunction(value);
  if (!next) {
    return;
  }
  return [next, value];
});
// AsyncStream<"value", "next", ...>
```

### `stream.iterateAsync`

Similar to `iterate` above, but the iterator is asynchronous.

```javascript
const s = stream.iterateAsync(1, async (n) => {
  const toAdd = await getAddValue(n);
  return n + toAdd;
});
// AsyncStream<1, 1 + toAdd, ...>
```

### `stream.interval`

Emits incrementing numbers at the given interval, in milliseconds.

```javascript
stream.interval(1000).forEach((n) => {
  console.log(n);
});
// 0  (1s)
// 1  (2s)
//  ...
```

### `stream.timer`

Emits a `0` after the given number of milliseconds.

```javascript
const s = await stream.timer(1000).toArray();
// [0] (1s)
```

## Transformers

### `stream.transform`

Enables pretty much all of the existing transformers, and any others, on streams.
Maintains an accumulator, similar to `unfold`, and emits values based on that,
if it exists.

```javascript
// Equivalent to take(3)
const s = stream.from(1).transform(0, (n, acc) => {
  if (acc >= 3) {
    return;
  }
  return [n, acc + 1];
});
// Stream<1, 2, 3>
```

### `stream.map`

Applies the given mapper function to transform stream elements.

```javascript
const s = stream.from(1).map((n) => n * 2);
// Stream<2, 4, 6, ...>
```

### `stream.flatMap`

Performs the mapping as in `stream.map`, and then flattens the results.

```javascript
const s = stream.from(1).map((n) => [n, n * 2]);
// Stream<1, 2, 2, 4, 3, 6, 4, 8>
```

### `stream.filter`

Removes values from the stream for which the predicate is not truthy.

```javascript
const s = stream.from(1).filter((n) => n % 2 === 0);
// Stream<2, 4, 6, ...>
```

### `stream.drop`

Skips `n` values from the stream, then resumes emitting.

```javascript
const s = stream.from(1).drop(3);
// Stream<4, 5, 6, ...>
```

### `stream.flatten`

Flattens a stream of nested values.

```javascript
const s = stream
  .from(1)
  .map((n) => [n, n])
  .flatten();
// Stream<1, 1, 2, 2, 3, 3, ...>
```

### `stream.tap`

Performs the provided callback as a side-effect and returns the value back to
the stream.

```javascript
const s = stream.from(1).tap((n) => console.log("value is", n));
// value is 1
// value is 2
// ...
```

### `stream.concat`

Appends the entries from another stream onto the end of the current. The left
stream must be finite.

```javascript
const s1 = stream.fromArray([1, 2, 3]);
const s2 = stream.fromArray([4, 5, 6]);
const s3 = s1.concat(s2);
// Stream<1, 2, 3, 4, 5, 6>
```

### `stream.withIndex`

Converts the stream entry to a tuple with the index of the element.

```javascript
const s = stream.fromArray([1, 2, 3]).withIndex();
// Stream<[1, 0], [2, 1], [3, 2]>
```

### `stream.zip`

Takes a value from each stream and emits one combined value. Halts whenever
any stream completes.

```javascript
const s1 = stream.fromArray([1, 2, 3, 4]);
const s2 = stream.fromArray(["a", "b", "c"]);
const s3 = s1.zip(s2);

// Stream<[1, "a"], [2, "b"], [3, "c"]>
```

### `asyncStream.debounce`

Limit the frequency of events to some interval.

```javascript
const s1 = stream.interval(10).take(2).debounce(11);
// AsyncStream<0>
```

### `asyncStream.combine`

Interleave multiple asynchronous streams. Chaining this method will interleave
the combined streams. The ordering matters, as well as how you chain them. The
examples below attept to distinguish the ordering.

```javascript
const s1 = stream.fromArray([1, 2, 3]).mapAsync(async (n) => n);
const s2 = stream.fromArray(["a", "b", "c"]).mapAsync(async (n) => n);
const s3 = stream.fromArray([true, false, true]).mapAsync(async (n) => n);

s1.combine(s2, s3);
// AsyncStream<1, "a", true, 2, "b", false, 3, "c", true>

const t1 = stream.fromArray([1, 2, 3]).mapAsync(async (n) => n);
const t2 = stream.fromArray(["a", "b", "c"]).mapAsync(async (n) => n);
const t3 = stream.fromArray([true, false, true]).mapAsync(async (n) => n);

s1.combine(s2).combine(s3);
// AsyncStream<true, 2, false, "a", true, "4", "b", "c">
```

## Consumers

### `stream.take`

Pulls `n` values from the stream.

```javascript
const s = stream.from(1).take(3);
// Stream<1, 2, 3>
```

### `stream.takeUntil`

Pulls values from stream until predicate is truthy.

```javascript
const s = stream.from(1).takeUntil((n) => n > 3);
// Stream<1, 2, 3>
```

### `stream.forEach`

Perform side-effect for each element of the stream.

```javascript
const s = stream
  .from(1)
  .take(3)
  .forEach((n) => {
    console.log(n);
  });
// 1
// 2
// 3
```

### `stream.fold`

Collect stream values into collection, similar to `array.reduce`. The stream
must be finite.

```javascript
const s = stream
  .from(1)
  .take(3)
  .fold(0, (n, acc) => n + acc);
// 6
```

### `stream.toArray`

Converts a stream to array. The stream must be finite.

```javascript
const s = stream.from(1).take(3).toArray();
// [1, 2, 3]
```

## Lifts

### `stream.mapAsync`

Lifts a synchronous stream via an asynchronous mapping function.

```javascript
const s = stream.from(1).mapAsync(async (n) => {
  const mapped = await slowlyDouble(n);
  return mapped;
});
// AsyncStream<2, 4, 6, ...>
```

### `stream.filterAsync`

Lifts a synchronous stream to asynchronous, with an async filter predicate.

```javascript
const s = stream.fromArray([user1, user2, user3]).filterAsync(async (user) => {
  const status = await getUserStatus(user);
  return status === Status.LoggedIn;
});
// AsyncStream<user2>
```

### `stream.foldAsync`

Collects a synchronous stream through an asynchronous fold method. The stream
must be finite.

```javascript
const s = stream
  .fromArray([user1, user2, user3])
  .foldAsync({}, async (user, acc) => {
    const status = await getUserStatus(user);
    return { ...acc, [status]: (acc[status] ?? []).concat(user) };
  });
// {[Status.LoggedIn]: [user2], [Status.Unauthenticated: [user1, user3]]}
```

### `Symbol.iterator` and `Symbol.asyncIterator`

The streams also have defined iterator methods that expose their underlying
generators. This can be used to manually iterate through the values of the
stream.

```javascript
const s = stream.from(1);
let sum = 0;
for (const elem of s) {
  if (elem > 5) {
    break;
  }
  sum += elem;
}
console.log("sum is", sum);
// sum is 10
```

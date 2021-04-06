import {Stream} from "../src";

describe("Stream", () => {
  it("should maintain array through `from` to `to`", async () => {
    const arr = await Stream.fromArray([1, 2, 3]).toArray();

    expect(arr).toStrictEqual([1, 2, 3])
  })

  it("should count up with `from` up to `value`", async () => {
    const arr = await Stream.from(1).takeUntil(n => n > 10).toArray();

    expect(arr).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  })

  it("should unfold to a value", async () => {
    const res = await Stream
      .unfold(1, async acc => {
        if (acc > 4) {
          return;
        }
        return [acc % 2 === 0, acc + 1];
      })
      .toArray();

    expect(res).toStrictEqual([false, true, false, true]);
  })

  it("should flatten nested values", async () => {
    function getCounter() {
      let count = 0;
      return () => {
        if (count > 3) {
          return;
        }
        return [count++];
      }
    }
    const res = await Stream
      .unfold(getCounter(), async counter => {
        const value = counter();
        if (!value) {
          return;
        }

        return [value, counter];
      })
      .flatten()
      .toArray()

    expect(res).toStrictEqual([0, 1, 2, 3]);
  })

  it("should filter out values", async () => {
    const res = await Stream
      .from(1)
      .filter(n => n % 2 === 0)
      .takeUntil(n => n > 10)
      .toArray();

    expect(res).toStrictEqual([2, 4, 6, 8, 10]);
  })
})

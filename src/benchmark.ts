import * as stream from "./index";

function range(a: number, b: number) {
  return Array.from(Array(b - a)).map((_, i) => i + a);
}

async function benchmark<T>(label: string, fn: () => Promise<T>, log = false) {
  console.time(label);
  const res: T = await fn();
  if (log) {
    console.log(`${label} result is`, res);
  }
  console.timeEnd(label);
}

async function runBenchmarks() {
  await benchmark("array map", async () => {
    const array = range(1, 10000);
    const arrResult = array.map((n) => n * 2);
    return arrResult;
  });

  await benchmark("array filter", async () => {
    const array = range(1, 10000);
    const arrResult = array.filter((n) => n % 2 === 0);
    return arrResult;
  });

  await benchmark("array reduce", async () => {
    const array = range(1, 10000);
    const arrResult = array.reduce((a, b) => a + b, 0);
    return arrResult;
  });

  await benchmark("array combination", async () => {
    const array = range(1, 10000);
    const arrResult = array
      .map((n) => n * 2)
      .filter((n) => n % 2 === 0)
      .map((n) => n / 2)
      .filter((n) => n ** 2 < 2500)
      .reduce((a, b) => a + b, 0);
    return arrResult;
  });

  await benchmark("array async map", async () => {
    const array = range(1, 10000);
    const arrResult = await Promise.all(array.map(async (n) => n * 2));
    return arrResult;
  });

  await benchmark("stream map", async () => {
    return stream
      .from(0)
      .take(10000)
      .map((n) => n * 2)
      .toArray();
  });

  await benchmark("stream filter", async () => {
    return stream
      .from(1)
      .take(10000)
      .filter((n) => n % 2 === 0)
      .toArray();
  });

  await benchmark("stream fold", async () => {
    return stream
      .from(1)
      .take(10000)
      .fold(0, (a, b) => a + b);
  });

  await benchmark("stream combination", async () => {
    return stream
      .from(1)
      .take(10000)
      .map((n) => n * 2)
      .filter((n) => n % 2 === 0)
      .map((n) => n / 2)
      .filter((n) => n ** 2 < 2500)
      .fold(0, (a, b) => a + b);
  });

  await benchmark("stream async map", async () => {
    return await stream
      .from(1)
      .take(10000)
      .mapAsync(async (n) => n * 2)
      .toArray();
  });

  await benchmark("stream async fold", async () => {
    return await stream
      .from(1)
      .take(10000)
      .foldAsync(0, async (a, b) => a + b);
  });
}

runBenchmarks().catch((err) => console.error("Benchmarks failed", err));

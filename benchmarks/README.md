# BENCHMARKS

- Benchmark basic

```bash
pnpm run build
node ./benchmarks/basic.js
```

Tested on Nodejs 24.11.1
Macbook Pro AppleM4 Pro (macos 15.7.2)

```bash
┌─────────┬──────────────────────┬───────────┐
│ (index) │ library              │ ops/sec   │
├─────────┼──────────────────────┼───────────┤
│ 0       │ 'Pino'               │ '500,000' │
│ 1       │ '@ekino/logger v3.x' │ '444,247' │
│ 3       │ 'Winston'            │ '184,536' │
└─────────┴──────────────────────┴───────────┘
```

- Benchmark with complex object

```bash
pnpm run build
node ./benchmarks/complex.js
```

Tested on Nodejs 24.11.1
Macbook Pro AppleM4 Pro (macos 15.7.2)

```bash
┌─────────┬──────────────────────┬──────────┐
│ (index) │ library              │ ops/sec  │
├─────────┼──────────────────────┼──────────┤
│ 0       │ 'Pino'               │ '55,021' │
│ 1       │ '@ekino/logger v3.x' │ '39,088' │
│ 2       │ 'Winston'            │ '5,604'  │
└─────────┴──────────────────────┴──────────┘
```


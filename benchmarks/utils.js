import { Suite } from '@jonahsnider/benchmark'
import pino from 'pino'
import * as winston from 'winston'
import * as logger3 from '../lib/esm/index.js'

/**
 * Initializes loggers for benchmarking.
 */
export const initializeLoggers = () => {
    logger3.setLevel('info')

    return {
        ekinoLoggerV3: logger3.createLogger('benchmark'),
        pinoLogger: pino({
            level: 'info',
            prettyPrint: false,
            destination: pino.destination({ sync: true }),
        }),
        winstonLogger: winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            transports: [new winston.transports.Console()],
        }),
    }
}

/**
 * Sets up the benchmark suite.
 * @param {string} name Name of the benchmark suite
 */
export const createBenchmarkSuite = (name) => {
    return new Suite(name, {
        warmup: { trials: 3000 },
        run: { trials: 10_000 },
    })
}

/**
 * Generates a nested object for complex benchmarks.
 * @param {number} numKeys Number of keys in each object
 * @param {number} depth Depth of the nested object
 * @param {number} [currentDepth=1] Current depth of the object
 */
export const generateNestedObject = (numKeys, depth, currentDepth = 1) => {
    if (currentDepth > depth) return null

    const obj = {}
    for (let i = 0; i < numKeys; i++) {
        const key = `key_${currentDepth}_${i}`
        obj[key] =
            currentDepth === depth
                ? {
                      stringValue: `string_${currentDepth}_${i}`,
                      numberValue: i * 10,
                      boolValue: i % 2 === 0,
                      arrayValue: Array.from({ length: 3 }, (_, j) => `arrayItem_${j}`),
                  }
                : generateNestedObject(numKeys, depth, currentDepth + 1)
    }
    return obj
}

/**
 * Formats benchmark results into a console table.
 * @param {Array<[string, import('@ekino/logger').Histogram]>} results
 */
export const formatResultsTable = (results) => {
    return [...results]
        .map(([library, histogram]) => [library, Math.round(1e9 / histogram.percentile(50))])
        .sort(([, a], [, b]) => b - a)
        .map(([library, opsPerSec]) => ({
            library,
            'ops/sec': opsPerSec.toLocaleString(),
        }))
}

/**
 * Runs the benchmark suite and displays results after a dynamic timeout.
 * @param {Suite} suite Benchmark suite instance
 * @param {number} timeout Timeout value in milliseconds
 */
export const runSuiteWithDynamicTimeout = async (suite, timeout = 1000) => {
    const startTime = performance.now()

    const results = await suite.run()

    const endTime = performance.now()
    const executionTime = endTime - startTime
    const timeoutValue = executionTime + timeout

    const table = formatResultsTable(results)

    setTimeout(() => console.table(table), timeoutValue)
}

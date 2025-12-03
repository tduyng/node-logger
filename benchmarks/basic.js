#!/usr/bin/env node

import { createBenchmarkSuite, initializeLoggers, runSuiteWithDynamicTimeout } from './utils.js'

const { ekinoLoggerV3, pinoLogger, winstonLogger } = initializeLoggers()

const suite = createBenchmarkSuite('Logger Benchmark - Basic')
const logObject = {
    user: 'John Doe',
    action: 'Test Action',
    timestamp: new Date(),
    details: {
        ipAddress: '192.168.1.1',
        location: 'New York',
        permissions: ['read', 'write', 'admin'],
        metadata: { session: 'abcdef12345', retries: 2 },
    },
}
const contextId = 'a037df3b-dbee-448e-9abb-8024d867ccc8'

suite
    .addTest('@ekino/logger v3.x', () => {
        ekinoLoggerV3.info(
            contextId,
            'This is a benchmark log message for @ekino/logger v3.x',
            logObject
        )
    })
    .addTest('Winston', () => {
        winstonLogger.info('This is a benchmark log message for Winston', logObject)
    })
    .addTest('Pino', () => {
        pinoLogger.info({
            ctxId: contextId,
            ...logObject,
            message: 'This is a benchmark log message for Pino',
        })
    })

await runSuiteWithDynamicTimeout(suite)

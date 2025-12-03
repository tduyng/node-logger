import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Logger, LoggerConfig, LogLevel } from '../src/index.js'
import * as loggerModule from '../src/index.js'
import * as outputs from '../src/output_adapters.js'

describe('Logger Module', () => {
    let logger: Logger

    const sharedConfig: LoggerConfig = {
        loggers: {},
        levels: ['trace', 'debug', 'info', 'warn', 'error', 'none'],
        outputs: [outputs.json, outputs.pretty],
        level: 3,
        namespaces: [],
        globalContext: {},
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

    describe('createLogger', () => {
        it('should create a logger instance', () => {
            const newLogger = loggerModule.createLogger('newLogger')
            expect(newLogger).toBeDefined()
            expect(newLogger).not.toBe(logger)
        })

        it('should return the same logger for the same namespace', () => {
            logger = loggerModule.createLogger('test:logger')
            const newLogger = loggerModule.createLogger('test:logger')
            expect(newLogger).toBe(logger)
        })
    })

    describe('setNamespaces', () => {
        let config: LoggerConfig

        beforeEach(() => {
            config = { ...sharedConfig, namespaces: [] }
        })

        it('should set namespaces correctly', () => {
            loggerModule.setNamespaces('routeA', config)
            const parsedNamespaces = config.namespaces

            expect(parsedNamespaces.length).toBeGreaterThan(0)
            expect(parsedNamespaces[0]?.regex?.test('routeA')).toBe(true)
        })

        it('should handle invalid namespace input', () => {
            expect(() => loggerModule.setNamespaces('invalid*namespace', config)).not.toThrow()
        })
    })

    describe('setLevel', () => {
        it('should set the log level correctly', () => {
            const config = {
                ...sharedConfig,
            }
            loggerModule.setLevel('info', config)
            expect(config.level).toBe(2)
        })

        it('should throw an error for invalid log level', () => {
            expect(() => loggerModule.setLevel('invalidLevel' as unknown as LogLevel)).toThrow(
                'Invalid log level: invalidLevel'
            )
        })
    })

    describe('setOutput', () => {
        it('should set the output adapter', () => {
            const config = {
                ...sharedConfig,
            }
            const outputAdapter = vi.fn()
            loggerModule.setOutput(outputAdapter, config)

            expect(config.outputs).toContainEqual(outputAdapter)
        })

        it('should set the output adapters array', () => {
            const config = {
                ...sharedConfig,
            }
            const outputAdapter = vi.fn()
            loggerModule.setOutput([outputAdapter], config)

            expect(config.outputs).toContainEqual(outputAdapter)
        })
    })

    describe('setGlobalContext', () => {
        it('should set global context correctly', () => {
            const config = {
                ...sharedConfig,
            }
            const globalContext = { user: 'testUser' }
            loggerModule.setGlobalContext(globalContext, config)
            expect(config.globalContext).toEqual(globalContext)
        })
    })

    describe('logging methods', () => {
        const outputMock = vi.fn()
        const now = new Date('2021-01-01T00:00:00Z')
        let config: LoggerConfig

        beforeAll(() => {
            vi.useFakeTimers().setSystemTime(now)
        })

        beforeEach(() => {
            outputMock.mockClear()
            config = {
                loggers: {},
                levels: ['trace', 'debug', 'info', 'warn', 'error', 'none'],
                outputs: [outputMock],
                level: 3,
                namespaces: [],
                globalContext: {},
            }
        })
        afterAll(() => {
            outputMock.mockRestore()
            vi.useRealTimers()
        })

        it('should call output adapter with log data, metadata, message, and data', () => {
            loggerModule.setNamespaces('test1:*', config)
            loggerModule.setLevel('info', config)
            loggerModule.setOutput([outputMock])

            const log = loggerModule.createLogger('test1:subTest1')

            log.warn('ctxId', 'test', { someData: 'someValue' })

            expect(outputMock).toHaveBeenCalledOnce()

            const outputArg = outputMock.mock.calls[0]?.[0]
            expect(outputArg.namespace).toBe('test1:subTest1')
            expect(outputArg.level).toBe('warn')
            expect(outputArg.time.getTime()).toBe(now.getTime())
            expect(outputArg.contextId).toBe('ctxId')
            expect(outputArg.message).toBe('test')
            expect(outputArg.data).toEqual({ someData: 'someValue' })
        })

        it('should log and create auto contextId when do not given context id', () => {
            loggerModule.setNamespaces('test2:*', config)
            loggerModule.setLevel('warn', config)
            loggerModule.setOutput([outputMock])

            const log = loggerModule.createLogger('test2:subTest2')

            log.error('test', { someData: 'someValue' })

            expect(outputMock).toHaveBeenCalledOnce()

            const outputArg = outputMock.mock.calls[0]?.[0]
            expect(outputArg.namespace).toBe('test2:subTest2')
            expect(outputArg.level).toBe('error')
            expect(outputArg.time.getTime()).toBe(now.getTime())
            expect(outputArg.contextId).toMatch(uuidRegex)
            expect(outputArg.message).toBe('test')
            expect(outputArg.data).toEqual({ someData: 'someValue' })
        })

        it('should not log if level is below the configured log level', () => {
            loggerModule.setNamespaces('test3:*', config)
            loggerModule.setLevel('warn', config)
            loggerModule.setOutput([outputMock])

            const log = loggerModule.createLogger('test3:subTest3')

            log.debug('ctxId', 'test', { someData: 'someValue' })

            expect(outputMock).not.toHaveBeenCalled()
        })

        it('should log if forceLogging is enabled regardless of level', () => {
            loggerModule.setNamespaces('test4:*', config)
            loggerModule.setLevel('warn', config)
            loggerModule.setOutput([outputMock])

            const log = loggerModule.createLogger('test4:subTest4', true)

            log.debug('ctxId', 'test', { someData: 'someValue' })

            expect(outputMock).toHaveBeenCalledOnce()

            const outputArg = outputMock.mock.calls[0]?.[0]
            expect(outputArg.namespace).toBe('test4:subTest4')
            expect(outputArg.level).toBe('debug')
            expect(outputArg.time.getTime()).toBe(now.getTime())
            expect(outputArg.contextId).toBe('ctxId')
            expect(outputArg.message).toBe('test')
            expect(outputArg.data).toEqual({ someData: 'someValue' })
        })

        it('should respect namespace-specific log levels', () => {
            config.loggers = {} // Reset loggers cache
            loggerModule.setNamespaces('test5:*=debug', config)
            loggerModule.setLevel('warn', config)
            loggerModule.setOutput([outputMock], config)

            const log = loggerModule.createLogger('test5:subTest5', false, config)

            log.debug('ctxId', 'debug message', { someData: 'someValue' })

            expect(outputMock).toHaveBeenCalledOnce()

            const outputArg = outputMock.mock.calls[0]?.[0]
            expect(outputArg.namespace).toBe('test5:subTest5')
            expect(outputArg.level).toBe('debug')
            expect(outputArg.message).toBe('debug message')
        })
    })

    describe('id function', () => {
        it('should generate a unique id', () => {
            const uniqueId = loggerModule.id()
            expect(uniqueId).toMatch(uuidRegex)
        })
    })
})

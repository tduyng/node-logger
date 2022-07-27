import * as outputAdapters from '../src/output_adapters'
import * as logger from '../src'
import colors from 'colors/safe'
const prettyOutput = require('prettyoutput')

describe('outputAdapters', () => {
    let writeOutputStub: jest.SpyInstance

    beforeAll(() => {
        writeOutputStub = jest.spyOn(process.stdout, 'write')
    })
    beforeEach(() => {
        writeOutputStub.mockImplementation(() => {})
        logger.setOutput([])
    })

    afterEach(() => writeOutputStub.mockClear())
    afterAll(() => writeOutputStub.mockRestore())

    const fakeTimer = (time: Date): void => {
        jest.useFakeTimers()
        jest.setSystemTime(time)
    }
    const time = new Date(1547205226232)
    const timePrettied = '2019-01-11 12:13:46'

    describe('twoDigitNumber', () => {
        it('should return number with 0 prefix when number is smaller than 10', () => {
            expect(outputAdapters.twoDigitNumber(3)).toEqual('03')
            expect(outputAdapters.twoDigitNumber(1)).toEqual('01')
            expect(outputAdapters.twoDigitNumber(9)).toEqual('09')
        })

        it('should same value of number and convert it to string', () => {
            expect(outputAdapters.twoDigitNumber(88)).toEqual('88')
        })

        it('should return empty string when input is undefined', () => {
            expect(outputAdapters.twoDigitNumber(undefined)).toEqual('')
        })
    })

    describe('json', () => {
        it('should write a Json Object with expected data and an \\n to stdout if enabled', () => {
            const now = new Date()

            const log: logger.Log = {
                level: 'warn',
                namespace: 'test1',
                time: now,
                contextId: 'ctxId',
                meta: { field1: 'value1' },
                message: 'test',
                data: { someData: 'someValue' },
            }

            outputAdapters.json(log)

            expect(writeOutputStub).toHaveBeenCalledTimes(2)
            const firstCall = writeOutputStub.mock.calls[0][0]
            const secondCall = writeOutputStub.mock.calls[1][0]
            const parsedObject = JSON.parse(firstCall)

            expect(parsedObject.namespace).toEqual(log.namespace)
            expect(parsedObject.level).toEqual(log.level)
            expect(parsedObject.time).toEqual(log.time?.toISOString())
            expect(parsedObject.contextId).toEqual(log.contextId)
            expect(parsedObject.field1).toEqual(log.meta?.field1)
            expect(parsedObject.message).toEqual(log.message)
            expect(parsedObject.data).toEqual(log.data)
            expect(secondCall).toEqual('\n')
        })

        it('JSON Output Adapter should work if used by logger', () => {
            logger.setNamespaces('test:*')
            logger.setLevel('info')
            logger.setOutput(outputAdapters.json)
            const now = new Date()
            fakeTimer(now)

            const log = logger.createLogger('test:subTest')
            log.warn('ctxId', 'test', { someData: 'someValue' })

            expect(writeOutputStub).toHaveBeenCalledTimes(2)
            const firstCall = writeOutputStub.mock.calls[0][0]
            const secondCall = writeOutputStub.mock.calls[1][0]
            const parsedObject = JSON.parse(firstCall)

            expect(parsedObject.namespace).toEqual('test:subTest')
            expect(parsedObject.level).toEqual('warn')
            expect(parsedObject.time).toEqual(now.toISOString())
            expect(parsedObject.contextId).toEqual('ctxId')
            expect(parsedObject.message).toEqual('test')
            expect(parsedObject.data).toEqual({ someData: 'someValue' })
            expect(secondCall).toEqual('\n')

            jest.useRealTimers()
        })

        it('should return output without time', () => {
            const log: logger.Log = {
                level: 'warn',
                namespace: 'test1',
                time: undefined,
                contextId: 'ctxId',
                meta: { field1: 'value1' },
                message: 'test',
                data: { someData: 'someValue' },
            } as unknown as logger.Log

            outputAdapters.json(log)

            expect(writeOutputStub).toHaveBeenCalledTimes(2)
            const firstCall = writeOutputStub.mock.calls[0][0]
            const parsedObject = JSON.parse(firstCall)

            expect(parsedObject.time).toBeUndefined()
        })
    })

    describe('pretty', () => {
        let prettyTimeStub: jest.SpyInstance

        beforeAll(() => {
            prettyTimeStub = jest.spyOn(outputAdapters, 'prettyTime')
        })
        beforeEach(() => {
            prettyTimeStub.mockImplementation(() => timePrettied)
        })

        afterEach(() => prettyTimeStub.mockClear())
        afterAll(() => prettyTimeStub.mockRestore())

        it('pretty output adapter should write yaml like data and an \\n to stdout if enabled', () => {
            const logInstance: logger.Log = {
                level: 'warn',
                namespace: 'test1',
                time,
                contextId: 'ctxId',
                meta: { field1: 'value1' },
                message: 'test',
                data: { someData: 'someValue' },
            }

            outputAdapters.pretty(logInstance)

            const infos = `${timePrettied} (${logInstance.namespace}) [warn] : `
            const output = {
                contextId: logInstance.contextId,
                meta: logInstance.meta,
                data: logInstance.data,
            }
            const result = `${infos}${colors['yellow'](logInstance.message || '')}\n${prettyOutput(output, { maxDepth: 6 }, 2)}`
            const firstCall = writeOutputStub.mock.calls[0][0]
            const secondCall = writeOutputStub.mock.calls[1][0]

            expect(writeOutputStub).toHaveBeenCalledWith(result)
            expect(writeOutputStub).toHaveBeenCalledTimes(2)
            expect(firstCall).toEqual(result)
            expect(secondCall).toEqual('\n')
        })

        it('pretty output adapter should work if used by logger', () => {
            logger.setNamespaces('test:*')
            logger.setLevel('info')
            logger.setOutput(outputAdapters.pretty)

            const log = logger.createLogger('test:*')
            log.warn('ctxId', 'test', { someData: 'someValue' })
            let logInstance = {
                level: 'info',
                time,
                namespace: 'test:*',
                contextId: 'ctxId',
                message: 'test',
                data: { someData: 'someValue' },
            } as unknown as logger.Log

            const infos = `${timePrettied} (${logInstance.namespace}) [warn] : `
            const output = {
                contextId: logInstance.contextId,
                meta: {},
                data: logInstance.data,
            }
            const result = `${infos}${colors['yellow']('test')}\n${prettyOutput(output, { maxDepth: 6 }, 2)}`

            const firstCall = writeOutputStub.mock.calls[0][0]
            const secondCall = writeOutputStub.mock.calls[1][0]

            expect(writeOutputStub).toHaveBeenCalledWith(result)
            expect(writeOutputStub).toHaveBeenCalledTimes(2)
            expect(firstCall).toEqual(result)
            expect(secondCall).toEqual('\n')
        })

        it('should use default level when level of loggerInstance is not defined', () => {
            const logInstance = {
                namespace: 'test3',
                time: new Date(1547205226232),
                contextId: 'ctxId',
                meta: { field1: 'value1' },
                message: 'test',
                data: { someData: 'someValue' },
                level: 'error',
            } as unknown as logger.Log

            outputAdapters.pretty(logInstance)

            const infos = `${timePrettied} (${logInstance.namespace}) [error] : `
            const output = {
                contextId: logInstance.contextId,
                meta: logInstance.meta,
                data: logInstance.data,
            }
            const result = `${infos}${colors['red'](logInstance.message)}\n${prettyOutput(output, { maxDepth: 6 }, 2)}`

            expect(writeOutputStub).toHaveBeenCalledWith(result)
            expect(writeOutputStub).toHaveBeenCalledTimes(2)
        })

        it('should called with empty output when contextId, meta et data fields are missing in logger instance', () => {
            const logInstance = {
                namespace: 'test3',
                time: new Date(1547205226232),
                message: 'test',
            } as unknown as logger.Log
            const emptyOutput = { contextId: undefined, meta: undefined, data: undefined }

            outputAdapters.pretty(logInstance)

            const infos = `${timePrettied} (${logInstance.namespace}) [error] : `
            const result = `${infos}${colors['red'](logInstance.message)}\n${prettyOutput(emptyOutput, { maxDepth: 6 }, 2)}`

            expect(writeOutputStub).toHaveBeenCalledWith(result)
            expect(writeOutputStub).toHaveBeenCalledTimes(2)
        })

        it('should  use empty message when it is undefined', () => {
            const logInstance = {
                namespace: 'test3',
                time: new Date(1547205226232),
            } as logger.Log

            outputAdapters.pretty(logInstance)
            const emptyOutput = { contextId: undefined, meta: undefined, data: undefined }

            const infos = `${timePrettied} (${logInstance.namespace}) [error] : `
            const result = `${infos}${colors['red']('')}\n${prettyOutput(emptyOutput, { maxDepth: 6 }, 2)}`

            expect(writeOutputStub).toHaveBeenCalledWith(result)
            expect(writeOutputStub).toHaveBeenCalledTimes(2)
        })
    })

    describe('prettyTime', () => {
        it('should return undefined when time is undefined', () => {
            expect(outputAdapters.prettyTime(undefined)).toBeUndefined()
        })

        it('should return formatted time value', () => {
            const time = new Date(1547205226232)
            expect(outputAdapters.prettyTime(time)).toBe('2019-01-11 11:13:46')
        })
    })
})

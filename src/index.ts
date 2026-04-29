import crypto from 'node:crypto'
import type {
    Log,
    Logger,
    LoggerConfig,
    LoggerMethods,
    LogLevel,
    LogMethod,
    NameSpaceConfig,
    OutputAdapter,
} from './definitions.js'
import * as outputs from './output_adapters.js'
import * as outputUtils from './output_utils.js'

/************* LOCAL STATE *************/
const defaultConfig: Readonly<LoggerConfig> = {
    loggers: {},
    levels: ['trace', 'debug', 'info', 'warn', 'error', 'none'],
    outputs: [outputs.json],
    level: 3, // default to warn
    namespaces: [],
    globalContext: {},
}

const sharedConfig: LoggerConfig = {
    ...defaultConfig,
}

/************* HELPER FUNCTION *************/

const log = (
    namespace: string,
    level: LogLevel,
    contextId: string | undefined,
    message: string | Record<string, unknown> | undefined,
    data: Record<string, unknown> | undefined,
    forceLogging: boolean | undefined,
    config: LoggerConfig
): void => {
    if (!forceLogging && !config.loggers[namespace]?.isLevelEnabled(level)) return

    const definedContextId = contextId || id()
    const logInstance: Log = {
        level,
        time: new Date(),
        namespace,
        contextId: definedContextId,
        meta: config.globalContext,
        message: typeof message === 'string' ? message : definedContextId,
        data: outputUtils.isObject(message) ? message : data,
    }

    writeLog(logInstance, config)
}

const isLevelEnabled = outputUtils.memoize(
    (namespace: string, level: number, config: LoggerConfig): boolean => {
        let nsLevel = config.level
        let nsMatch = false
        for (const ns of config.namespaces.slice().reverse()) {
            if (ns.regex?.test(namespace)) {
                nsMatch = true
                if (ns.level !== undefined) {
                    nsLevel = ns.level
                    break
                }
            }
        }

        return nsMatch && level >= nsLevel
    }
)

const writeLog = (logInstance: Log, config: LoggerConfig): void => {
    for (const output of config.outputs) {
        output(logInstance)
    }
}

const parseNamespace = (namespace: string): NameSpaceConfig | undefined => {
    const matches = /([^=]*)(=(.*))?/.exec(namespace)
    if (!matches) return undefined

    const regex = new RegExp(`^${matches[1]?.replace(/\*/g, '.*?')}$`)
    const level = matches[3] ? defaultConfig.levels.indexOf(matches[3] as LogLevel) : undefined
    return { regex, level }
}

/************* EXPORT FUNCTIONS *************/

export const createLogger = (
    namespace = '',
    canForceWrite = false,
    config = sharedConfig
): Logger => {
    if (config.loggers[namespace]) return config.loggers[namespace]

    const enabledLevels: Record<LogLevel, boolean | undefined> = {
        trace: undefined,
        debug: undefined,
        info: undefined,
        warn: undefined,
        error: undefined,
        none: undefined,
    }
    const logger: LoggerMethods = {}

    config.levels.forEach((level, idx) => {
        const levelIsEnabled = isLevelEnabled(namespace, idx, config) || canForceWrite
        enabledLevels[level] = levelIsEnabled
        if (levelIsEnabled) {
            logger[level] = ((...args: unknown[]) => {
                if (typeof args[0] === 'string' && typeof args[1] === 'string') {
                    // Handle the dual signature: (contextId, message, data?, forceLogging?)
                    const [contextId, message, data, forceLogging] = args
                    log(
                        namespace,
                        level,
                        contextId as string,
                        message as string,
                        data as Record<string, unknown>,
                        forceLogging as boolean | undefined,
                        config
                    )
                } else {
                    // Handle the signature: (message, data?, forceLogging?)
                    const [message, data, forceLogging] = args
                    log(
                        namespace,
                        level,
                        undefined,
                        message as string,
                        data as Record<string, unknown>,
                        forceLogging as boolean | undefined,
                        config
                    )
                }
            }) as LogMethod
        } else {
            logger[level] = () => {}
        }
    })

    logger.isLevelEnabled = (level: LogLevel) => enabledLevels[level]
    logger.canForceWrite = canForceWrite

    // Cache the logger
    config.loggers[namespace] = logger as Logger
    return logger as Logger
}

/**
 * Return an id that can be used as a contextId
 */
export const id = (): string => crypto.randomUUID()

/**
 * Define enabled / disabled namespaces
 */
export const setNamespaces = (namespaceStr: string, config = sharedConfig): void => {
    config.namespaces = namespaceStr
        .split(',')
        .map(parseNamespace)
        .filter(Boolean) as NameSpaceConfig[]
}

/**
 * Change log level
 */
export const setLevel = (level: LogLevel, config = sharedConfig): void => {
    const levelIndex = config.levels.indexOf(level)
    if (levelIndex === -1) throw new Error(`Invalid log level: ${level}`)
    config.level = levelIndex
}

/**
 * Set outputs transport to use
 */
export const setOutput = (
    outputAdapters: OutputAdapter[] | OutputAdapter,
    config = sharedConfig
): void => {
    config.outputs = Array.isArray(outputAdapters) ? outputAdapters : [outputAdapters]
}

/**
 * Set a global context to append to all logs,
 * useful to append application/service name globally for example.
 * Be warned this context will be added to all logs,
 * even those from third party libraries if they use this module.
 */
export const setGlobalContext = (context: Record<string, unknown>, config = sharedConfig): void => {
    config.globalContext = { ...context }
}

/************* INIT *************/
const namespaces = process.env.LOGS || '*'
const logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'warn'

setNamespaces(namespaces)
setLevel(logLevel)

/************* EXPORT *************/
export * from './definitions.js'
export { outputs, outputUtils }
export default {
    createLogger,
    setLevel,
    setNamespaces,
    setOutput,
    setGlobalContext,
    id,
    outputUtils,
    outputs,
}

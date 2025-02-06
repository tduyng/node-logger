import type { ReplacerFunction } from './definitions.js'

/**
 * Replace circular reference when used with JSON.stringify
 * Usage : JSON.stringify(element, getCircularReplacer())
 */
export const getCircularReplacer = (): ReplacerFunction => {
    const seen = new WeakSet()
    return (_key: string | number, value: unknown): unknown => {
        if (isObject(value)) {
            if (seen.has(value)) return
            seen.add(value)
        }
        return value
    }
}

/**
 * JSON.stringify with support for errors descriptions
 * You should add a try catch around it to avoid error
 * @param {*} log - json object
 * @returns {string} - stringified log or error log if can not stringify
 */
export const stringifyLog = (log: Record<string, unknown>): string => {
    try {
        return JSON.stringify(log)
    } catch (e) {
        return JSON.stringify(log, getCircularReplacer())
    }
}

export const isObject = (val: unknown): val is Record<string, unknown> =>
    !!val && typeof val === 'object' && !Array.isArray(val)

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const memoize = <T extends (...args: any[]) => unknown>(fn: T): T => {
    const cache = new Map<string, ReturnType<T>>()
    return ((...args: unknown[]) => {
        const key = JSON.stringify(args)
        if (cache.has(key)) return cache.get(key) as ReturnType<T>
        const result = fn(...args)
        cache.set(key, result as ReturnType<T>)
        return result
    }) as T
}

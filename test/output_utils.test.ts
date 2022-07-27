import * as outputUtils from '../src/output_utils'

describe('outputUtils', () => {
    describe('stringify', () => {
        let getCircularReplacerSpy: jest.SpyInstance

        beforeAll(() => {
            getCircularReplacerSpy = jest.spyOn(outputUtils, 'getCircularReplacer')
        })

        afterEach(() => getCircularReplacerSpy.mockClear())
        afterAll(() => getCircularReplacerSpy.mockRestore())

        it('should work properly on a non cyclic object', () => {
            const obj = {
                a: '1',
                b: '2',
            }

            const value = outputUtils.stringify(obj)
            expect(value).toEqual('{"a":"1","b":"2"}')
            expect(getCircularReplacerSpy).toHaveBeenCalledTimes(0)
        })

        it('should work even with circular references', () => {
            const obj: Record<string, unknown> = {
                a: '1',
                b: '2',
            }
            obj.d = obj

            const value = outputUtils.stringify(obj)
            expect(value).toEqual('{"a":"1","b":"2"}')
            expect(getCircularReplacerSpy).toHaveBeenCalled()
        })

        it('should work for a cyclic object', () => {
            let circularReference: Record<string, unknown> = { otherData: 123 }
            circularReference.myself = circularReference

            expect(outputUtils.stringify(circularReference)).toEqual('{"otherData":123}')
            expect(getCircularReplacerSpy).toHaveBeenCalled()
        })
    })

    describe('errorToJson', () => {
        it('should expose error stack through a json stringify', () => {
            const e = new Error()
            const result = outputUtils.errorToJson(e)

            expect(result.stack).toEqual(e.stack)
        })
    })

    describe('isObject', () => {
        it('should return true when input is object', () => {
            expect(outputUtils.isObject({})).toEqual(true)
            expect(outputUtils.isObject({ a: { b: 'c' } })).toEqual(true)
        })

        it('should return true when input is not object', () => {
            expect(outputUtils.isObject(null)).toEqual(false)
            expect(outputUtils.isObject(undefined)).toEqual(false)
            expect(outputUtils.isObject(0)).toEqual(false)
            expect(outputUtils.isObject('string')).toEqual(false)
            expect(outputUtils.isObject(1)).toEqual(false)
            expect(outputUtils.isObject([])).toEqual(false)
            expect(outputUtils.isObject([1])).toEqual(false)
            expect(outputUtils.isObject(['1'])).toEqual(false)
            expect(outputUtils.isObject([1, '1'])).toEqual(false)
            expect(outputUtils.isObject(true)).toEqual(false)
            expect(outputUtils.isObject(false)).toEqual(false)
        })
    })
})

const collectPromises: <T>(promisedList: Promise<T[]>, promisedElement: Promise<T>) => Promise<T[]> =
    async (promisedList, promisedElement) => {
        const list = await promisedList
        list.push(await promisedElement)
        return list
    }

const resolvedPromiseOf: <T>(value: T) => Promise<T> =
    value => new Promise(resolve => resolve(value))

const withDelay: <T>(delay: number) => (fn: () => Promise<T>) => Promise<T> =
    delay => async fn =>
        new Promise((resolve, reject) =>
            setTimeout(
                () => fn().then(res => resolve(res))
                    .catch(e => reject(e)),
                delay
            )
        )

const withInterval: <T>(delay: number) => (fn: () => void) => void =
    delay => fn => setInterval(fn, delay)

let nextCacheId = 0
const memoize: <T>(fn: (...args: any[]) => T) => (...args: any[]) => T =
    fn => {
        const cacheId = `__memoize_cache_${nextCacheId++}`
        return function (...args) {
            this[cacheId] = this[cacheId] || new Map<string, any>()
            const cache = this[cacheId]
            const serializedArgs = JSON.stringify(args)
            if (!cache.has(serializedArgs)) {
                cache.set(serializedArgs, fn.apply(this, ...args))
            }
            return cache.get(serializedArgs)
        }
    }

const Memoized: () => MethodDecorator =
    () => (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
        if ("value" in descriptor) {
            const func = descriptor.value
            descriptor.value = memoize(func)
        } else if ("get" in descriptor) {
            const func = <any>descriptor.get
            descriptor.get = memoize(func)
        }
        return descriptor
    }

const sum: (acc: number, c: number) => number = (acc, c) => acc + c

const average: (nums: number[]) => number = nums => nums.reduce(sum, 0) / Math.max(1, nums.length)

export {
    collectPromises,
    resolvedPromiseOf,
    withDelay,
    withInterval,
    sum,
    average,
    memoize,
    Memoized
}

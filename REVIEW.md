# ReactX Code Review

## Overview

ReactX is an experimental state management library for React that provides transparent reactive state management. It acts as a wrapper around MobX, offering a simpler API with patterns inspired by React Query for async data fetching and mutations.

## What It Does

ReactX provides several key primitives:

1. **`reactive(target)`**: Creates reactive state from objects/classes with automatic React re-rendering
2. **`immutableReactive(target)`**: Creates reactive state with immutable update patterns
3. **`query(fetcher)`**: Manages async data fetching with suspense support, revalidation, and subscription lifecycle
4. **`mutation(mutator)`**: Manages async mutations with pending states and error handling
5. **Devtools Integration**: Built-in support for Overmind devtools for debugging state changes
6. **Babel/SWC Plugins**: Automatically wraps React components with MobX observer

## Technical Approach

### Core Architecture

- **Proxy-based Reactivity**: Uses JavaScript Proxies to intercept property access and mutations
- **MobX Foundation**: Built on top of MobX for the reactive system (`observable`, `computed`, `autorun`)
- **Lazy Initialization**: Properties on custom class instances are lazily converted to observables on first access
- **Caching**: Uses WeakMaps to cache proxies and prevent duplicate wrapping
- **Path Tracking**: Maintains property paths for devtools integration

### Query Pattern

The Query class implements a sophisticated async data fetching pattern:

- **Blocking Promise Pattern**: Uses a blocking promise during SSR/initial render to avoid state changes during render
- **Subscription Management**: Tracks component subscriptions and aborts requests when no components are subscribed
- **Revalidation**: Distinguishes between full refetch and revalidation (keeping existing data)
- **Suspense Support**: Creates promise objects with `status` property for React Suspense integration

### Mutation Pattern

The Mutation class provides async action management:

- **Optimistic Updates**: Exposes pending params for optimistic UI updates
- **Request Cancellation**: Aborts previous mutations when new ones are triggered
- **Transaction Batching**: Uses MobX transactions for atomic state updates

## Issues Found

### Critical Bugs

1. **Debug Logging in Production** (src/proxy.ts):
   - Line 261: `console.log("WTF, key", key)`
   - Line 270: `console.log("SETTING VALUE", key, v)`
   - Line 488: `console.log("ACTION", key, path)`
   - These should be removed or wrapped in development guards

2. **Duplicate State Initialization** (src/query.ts:133-149):
   ```typescript
   this.state = observable({
     error: null,
     value: null,
     isRevalidating: false,
     isFetching: true,
     promise: createPendingPromise(blockingPromise.promise),
   });

   this.state = observable({ // Duplicate!
     error: null,
     value: null,
     isRevalidating: false,
     isFetching: true,
     promise: createPendingPromise(blockingPromise.promise),
   });
   ```

3. **Test/API Mismatch** (src/index.test.ts):
   - Tests reference `reactive.readonly()` which doesn't exist in the exported API
   - Tests import an `Observer` class that isn't present in the source
   - This suggests either outdated tests or missing implementation

4. **Type Safety Issues**:
   - Multiple `@ts-ignore` comments (proxy.ts:362, immutableProxy.ts:80)
   - These should be properly typed

### Performance Concerns

1. **No Proxy Cache Cleanup**: While WeakMaps are used for caching (which is good), there's no explicit cleanup mechanism. The WeakMap will hold references as long as the target objects exist.

2. **Expensive Property Access** (src/proxy.ts:186-323):
   - Custom class instance property access triggers complex logic every time
   - Creates computed values, autoruns, and boxed observables on first access
   - Could benefit from memoization or lazy evaluation strategies

3. **Devtools Overhead**:
   - Devtools proxies and autoruns run even when devtools aren't connected
   - No production build guards to strip devtools code
   - Every action/mutation creates tracking overhead

4. **autorun Proliferation** (src/proxy.ts:283-321):
   - An autorun is created for every property access on custom classes
   - These persist for the lifetime of the object
   - Could lead to memory leaks in long-running apps

5. **Redundant State Checks**: Query getters (error, value, isFetching, etc.) all check `internalState.current !== "ACTIVE"` which could be optimized with a single check.

### Design Issues

1. **Mixed Responsibilities**:
   - The proxy.ts file handles both reactive state AND devtools tracking
   - Should be separated for better maintainability and tree-shaking

2. **Devtools Always Included**:
   - Devtools code is always bundled, even in production
   - No conditional imports or tree-shaking support
   - The `Devtools` class should be in a separate package or have better dead-code elimination

3. **Mutation State Reset** (src/mutation.ts:131):
   - On error, the mutation state is reset to IDLE immediately
   - This happens before the promise rejection is handled
   - Could cause race conditions if multiple mutations fire quickly

4. **No Readonly Implementation**:
   - Tests extensively test `reactive.readonly()` functionality
   - This API doesn't exist in the actual exports
   - Either implement it or remove the tests

5. **Error Handling in Queries**:
   - Rejected promises in queries are caught silently (line 344-348)
   - While this prevents unhandled promise warnings, it might hide real errors
   - Consider logging or providing a way to track these

### API/Ergonomics Issues

1. **Inconsistent Naming**:
   - `reactive()` vs `immutableReactive()` - the latter is exported as `immutableReactive` but internally uses `createImmutableProxy`
   - Consider `reactive()` and `reactive.immutable()` for consistency

2. **Development Flag API** (src/proxy.ts:384-394):
   ```typescript
   reactive(target, development: boolean | string = false)
   ```
   - Boolean OR string is confusing
   - Should be an options object: `{ devtools?: boolean | string }`

3. **Query Subscribe Pattern**:
   - Returns an unsubscribe function but no way to know if subscribed
   - Could provide `isSubscribed` property

4. **Missing Documentation**:
   - No JSDoc comments on public APIs
   - The behavior of `query.fetch()` vs `query.revalidate()` isn't clear from code

## Recommendations

### High Priority

1. **Remove debug console.logs** from src/proxy.ts
2. **Fix duplicate state initialization** in src/query.ts
3. **Align tests with implementation** - remove readonly tests or implement the feature
4. **Add production guards** for devtools code:
   ```typescript
   if (process.env.NODE_ENV !== 'production') {
     // devtools code
   }
   ```

### Medium Priority

1. **Separate devtools code** into a separate entry point for better tree-shaking
2. **Add proper TypeScript types** instead of `@ts-ignore`
3. **Optimize property access** for custom class instances - consider pre-processing or caching the descriptor checks
4. **Add JSDoc documentation** to all public APIs
5. **Improve API ergonomics** with options objects instead of positional parameters

### Low Priority

1. **Consider lifecycle hooks** for queries/mutations (onSuccess, onError)
2. **Add query cache key support** for more granular control
3. **Provide built-in optimistic updates** pattern for mutations
4. **Add performance benchmarks** to track proxy overhead
5. **Consider React 19 specific optimizations** (use() hook support)

## Strengths

1. **Clean API**: The basic API is intuitive and easy to understand
2. **Good Suspense Integration**: Query implementation handles React Suspense well
3. **Automatic Observation**: Babel/SWC plugin removes boilerplate
4. **Request Cancellation**: Proper AbortController usage for cleanup
5. **MobX Foundation**: Leveraging battle-tested reactivity system
6. **Proxy Caching**: Prevents duplicate wrapping of same objects

## Overall Assessment

ReactX shows promise as a simpler alternative to MobX with modern React patterns. The core reactivity mechanism is solid, and the Query/Mutation patterns are well-designed. However, there are several production-readiness concerns:

- Debug code needs to be removed
- Tests don't match implementation
- Performance optimizations needed for large apps
- Devtools integration needs to be optional for production

The library is currently suitable for **experimentation and prototyping** but would benefit from addressing the critical issues before being used in production applications.

**Rating**: 6.5/10 for current state, potential for 8.5/10 with improvements

## Questions for Author

1. Is `reactive.readonly()` planned for implementation or should tests be removed?
2. What's the migration path from MobX? Is this intended as a drop-in replacement?
3. Are there plans for React Compiler compatibility?
4. Should devtools be an optional peer dependency?
5. What's the expected bundle size target for the library?

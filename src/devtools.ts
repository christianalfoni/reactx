/**
 * Devtools integration for reactx
 *
 * This is a separate entry point to enable tree-shaking.
 * Import from 'reactx/devtools' to use devtools functionality.
 *
 * @example
 * ```typescript
 * import { reactive } from 'reactx';
 * import { DevtoolsObserver } from 'reactx/devtools';
 *
 * // Only in development
 * const observer = process.env.NODE_ENV !== 'production'
 *   ? new DevtoolsObserver('localhost:3031')
 *   : undefined;
 *
 * const state = reactive({ count: 0 }, { observer });
 * ```
 */

export { DevtoolsObserver } from "./DevtoolsObserver";
export { Devtools } from "./Devtool";
export type { Message, DevtoolsMessage } from "./Devtool";

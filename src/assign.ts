import { transaction } from "mobx";

/**
 * Base class that provides type-safe property assignment with discriminated union support.
 *
 * This utility enables you to define discriminated unions as class state types and ensures that
 * property assignments are validated against the union type. All assignments are wrapped in a MobX
 * transaction for optimal reactivity performance.
 *
 * @template T - The discriminated union type that defines valid property combinations
 *
 * @example
 * ```typescript
 * type AUTHENTICATING = {
 *   isAuthenticating: true
 *   user: null
 * }
 *
 * type AUTHENTICATED = {
 *   isAuthenticating: false,
 *   user: string
 * }
 *
 * type AUTH = AUTHENTICATING | AUTHENTICATED
 *
 * class Auth extends Assign<AUTH> {
 *   isAuthenticating = false
 *   user = null
 *
 *   login(username: string) {
 *     // Type-safe: ensures all properties match the AUTHENTICATED state
 *     this.assign({
 *       isAuthenticating: false,
 *       user: username
 *     })
 *   }
 *
 *   startAuth() {
 *     // Type-safe: ensures all properties match the AUTHENTICATING state
 *     this.assign({
 *       isAuthenticating: true,
 *       user: null
 *     })
 *   }
 * }
 * ```
 *
 * @remarks
 * The assign method uses MobX transactions internally, ensuring that multiple property updates
 * trigger only a single reaction cycle. This is important for maintaining consistent state
 * when working with discriminated unions where multiple properties need to change atomically.
 */
export class Assign<T extends object> {
  protected assign(object: T) {
    transaction(() => {
      Object.assign(this, object);
    });
  }
}

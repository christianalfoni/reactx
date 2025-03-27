# Bonsify

> Single reactive primitive for performant state management in React

State management is most performant when you use a mutable reactive primitive external to components and the reconciler. **Bonsify** provides a single reactive primitive of `reactive`. It is mutable, but from React it is readonly and guarantees value comparison. That means you can still use `useMemo`, `useEffect` etc. Combine this with the patterns introduced in the following sections, and you can scale your application to any size without performance issues.

- [Constructor](./docs/01_pattern_constructor.md)
- [Protected State](./docs/02_pattern_protected_state.md)
- [State Tree](./docs/03_pattern_state_tree.md)
- [Component State Contract](./docs/04_pattern_component_state_contract.md)
- [Explicit States](./docs/05_pattern_explicit_states.md)
- [Data Fetching](./docs/06_pattern_data_fetching.md)
- [Promises](./docs/07_pattern_promises.md)
- [Environment Dependencies](./docs/08_pattern_environment_dependencies.md)
- [Multiple UX](./docs/09_pattern_multiple_ux.md)

## Get Started

```sh
npm install bonsify
```

Automatic observation in components using [observing-components](https://github.com/christianalfoni/observing-components).

```ts
import babelPlugin from "bonsify/babel-plugin";
import swcPlugin from "bonsify/swc-plugin";
```

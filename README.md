# Mobx Reactive

> Single reactive primitive for complex and performant state management in React

## Get Started

```sh
npm install mobx-reactive
```

Automatic observation in components using [observing-components](https://github.com/christianalfoni/observing-components).

```ts
import babelPlugin from "mobx-reactive/babel-plugin";
import swcPlugin from "mobx-reactive/swc-plugin";
```

## Why Mobx Reactive?

Mobx at its core is a performant and flexible reactive system. It was originaly introduced for classes, but as React has evolved it is time to rethink how **simple** Mobx can be. With a single `reactive` primitive, transparent observation in components and functional patterns for state management it has never been simpler to embrace external state management with benefits such as:

- 🕸 Handle state management complexity without the overhead of the reconciler
- 🍎 Use plain JavaScript to mutate state
- 🌲 Gain flexibility in adjusting your UI as components or mostly local state, if any
- 📺 Derive the state to different targets like web, reactive native or just a mobile web version

## Mental Model

With **Mobx Reactive** think about the state management as the application itself. React just derives a view from that state. The goal is to make your components as minimal and simple as possible. There is enough complexity in components with elements, styling and dynamic content. Use **Mobx Reactive** to handle the complexity of state management.

Explore the **patterns** that will help you build performant and complex state management in React applications.

- [Constructor](./docs/01_pattern_constructor.md)
- [Protected State](./docs/02_pattern_protected_state.md)
- [State Tree](./docs/03_pattern_state_tree.md)
- [Component State Contract](./docs/04_pattern_component_state_contract.md)
- [Explicit States](./docs/05_pattern_explicit_states.md)
- [Data Fetching](./docs/06_pattern_data_fetching.md)
- [Promises](./docs/07_pattern_promises.md)
- [Environment Dependencies](./docs/08_pattern_environment_dependencies.md)
- [Multiple UX](./docs/09_pattern_multiple_ux.md)

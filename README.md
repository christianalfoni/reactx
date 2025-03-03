# Bonsify

> Patterns for well-structured, artfully maintained components and state management.

Building an application is about wielding UI complexity and state complexity. React is a master at managing UI complexity, but comes short as state complexity increases. Bonsify is a set of patterns that helps you manage component and state management complexity. It does this by grounding you in a core **constructor pattern** you can apply to both components and state management.

Complex state management is proven to be best solved by using a reactive primitive for state. To start using the Bonsify patterns for state management you need to choose a reactive primitive that components can observe. **Bonsify** provides its own `reactive` primitive, but you can can choose `observable` from [Mobx](https://mobx.js.org/README.html), `signal` from [Preact Signals](https://preactjs.com/guide/v10/signals/) or whatever other reactive primitive you have experience with.

[Go to patterns](./docs/01_pattern_constructor.md)

## Using reactive from Bonsify

```sh
npm install bonsify
```

Automatic observation in components using [observing-components](https://github.com/christianalfoni/observing-components).

```ts
import babelPlugin from "bonsify/babel-plugin";
import swcPlugin from "bonsify/swc-plugin";
```

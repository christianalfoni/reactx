# Bonsify

> Patterns for well-structured, artfully maintained components and state management.

Building an application is about wielding UI complexity and state complexity. React is a master at managing UI complexity, but comes short as state complexity increases. Bonsify is a set of patterns that helps you manage component and state complexity. It does this by grounding you in a core **constructor pattern** you can apply to both components and state management.

Complex state management is proven to be best solved by using a reactive primitive for state. To start using the Bonsify patterns for state management you need to choose a reactive primitive that components can observe. **Bonsify** provides its own `reactive` primitive, but you can can choose `observable` from [Mobx](https://mobx.js.org/README.html), `reactive` from [Vue Reactivity](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) or whatever other reactive primitive you have experience with.

[Go to patterns](./docs/01_pattern_constructor.md) to learn more or set up your reactive primitives first:

## Bonsify

```sh
npm install bonsify
```

Automatic observation in components using [observing-components](https://github.com/christianalfoni/observing-components).

```ts
import babelPlugin from "bonsify/babel-plugin";
import swcPlugin from "bonsify/swc-plugin";
```

## Mobx

[mobx](https://mobx.js.org/README.html) - [mobx-react-observer](https://github.com/christianalfoni/mobx-react-observer)

```sh
npm install mobx mobx-react-observer
```

```ts
import babelPlugin from "mobx-react-observer/babel-plugin";
import swcPlugin from "mobx-react-observer/swc-plugin";
```

## Vue Reactivity

[@vue/reactivity](https://mobx.js.org/README.html) - [vue-reactivity-react-observer](https://www.npmjs.com/package/mobx-react-lite)

```sh
npm install @vue/reactivity vue-reactivity-react-observer
```

```ts
import babelPlugin from "vue-reactivity-react-observer/babel-plugin";
import swcPlugin from "vue-reactivity-react-observer/swc-plugin";
```

## Preact Signals

[@preact/signals](https://preactjs.com/guide/v10/signals/) - [@preact/signals-react-transform](https://github.com/preactjs/signals/blob/HEAD/packages/react-transform/README.md)

```sh
npm install @preact/signals @preact/signals-react-transform
```

```js
// babel.config.js
module.exports = {
  plugins: [["module:@preact/signals-react-transform"]],
};
```

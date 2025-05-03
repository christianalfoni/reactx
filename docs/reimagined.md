# Reimagined

MobX has been a cornerstone in the JavaScript ecosystem for state management since its inception. Originally introduced as Mobservable by Michel Weststrate at ReactiveConf, it offered a novel approach to state management through transparent reactive programming. The initial reception was mixed, partly due to its unconventional name and concepts. However, after rebranding to MobX, it gained widespread recognition and adoption.

Over the years, both JavaScript and React have undergone significant transformations which have prompted a reimagining of MobX. On one end Mobx has become more complex because of `async/await`, leading to the `flow` utility using the low level generator primitives of the language. On the other end React has moved completely away from classes, creating a new set of patterns and paradigms.

Despite the evolution of the ecosystem, MobX remains a battle-tested and exceptionally performant solution. Its ability to observe changes at any nested level of the state and embrace JavaScript’s natural mutability sets it apart. However, to stay aligned with modern development practices, MobX can benefit from a refreshed approach.

## Truly transparent

Traditionally with Mobx you have to use decorators or functions to configure the reactivity of your state management. With **Mobx Lite** we flip this around and let React tell your state management what needs to be reactive. With the automatic observation of components there is only one single place in your code that you see reference to the reactive system... where you expose your state to React using `reactive`.

## No actions

**Mobx Lite** has no actions. It does not need to. The `reactive` proxy used to expose your state management to React will not only lazily "reactify" your state management, it also prevents any mutations happening directly from React. All class methods called from React are bound to the class instance as well.

## No reactions

The mechanisms of a reaction is used to enable **computed** properties and observation in components, but in actual state management code it creates indirection. Indirection is bad because it allows one line of code to implicitly affect some other line of code, maybe in a different file. **Mobx Lite** does not even expose reactions for that very reason.

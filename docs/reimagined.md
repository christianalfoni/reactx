# Reimagined

MobX has been a cornerstone in the JavaScript ecosystem for state management since its inception. Originally introduced as Mobservable by Michel Weststrate at ReactiveConf, it offered a novel approach to state management through transparent reactive programming. The initial reception was mixed, partly due to its unconventional name and concepts. However, after rebranding to MobX, it gained widespread recognition and adoption. ￼ ￼

Over the years, both JavaScript and React have undergone significant transformations which have prompted a reimagining of MobX. On one end Mobx has become more complex because of `async/await`, leading to the `flow` utility using the low level generator primitives of the language. On the other end React has moved completely away from classes, creating a new set of patterns and paradigms.

Despite the evolution of the ecosystem, MobX remains a battle-tested and exceptionally performant solution. Its ability to observe changes at any nested level of the state and embrace JavaScript’s natural mutability sets it apart. However, to stay aligned with modern development practices, MobX can benefit from a refreshed approach.

## No actions

**Mobx Lite** has no actions. It rather allows you to define a piece of state as `readonly`. This means that you can not mutate the state, but everything inside the state scope can. This prevents challenges with asynchronous methods and there is no need to adopt low level generators.

## No reactions

The mechanisms of a reaction is used to enable **computed** properties and observation in components, but in actual state management code it creates indirection. **Mobx Lite** does not even expose reactions for that very reason.

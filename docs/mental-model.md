# Mental Model

React components represents the UI of the application. It is a tree of elements and styling, encapsulated by a component and composed into a tree.

![](./ui.png){width=250px}

When you start introducing state in React, that state is defined with the elements and the styling. Some components defines state and others only consume parent props.

![](./ui-state.png){width=250px}

As your application grows though, the state and the UI represented in your component tree starts to diverge.

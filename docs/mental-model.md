# Mental Model

Components have become the fundamental building blocks for modern application development. These components are organized into a tree structure that represents your application's UI.

![UI Tree Structure](./ui.png){width=250px .light-only}
![UI Tree Structure Dark Mode](./ui-dark.png){width=250px .dark-only}

Each component can define UI elements, their associated styles, and manage state to handle dynamic interactions.

![Components with State and Styling](./ui-2.png){width=250px .light-only}
![Components with State and Styling Dark Mode](./ui-2-dark.png){width=250px .dark-only}

However, not all components handle elements and state equally—some components are purely presentational (elements only), some are stateful (state only), and others combine both. As your application grows more complex and requires greater sharing of state across components, managing state within components can quickly become cumbersome. The UI tree and individual components expand significantly, making it increasingly difficult to differentiate clearly between state management and UI elements.

At a point it is better to separate state management from your UI components:

![Separate State Management](./ui-3.png){width=250px .light-only}
![Separate State Management Dark Mode](./ui-3-dark.png){width=250px .dark-only}

This separation results in a clearer, simpler UI component tree and a more manageable and organized state. Context is the "React way" of achieving this separation, where **ReactX** gives you an object oriented "just code" way of achieving this separation.

By leveraging **ReactX** for external state management and **React** for your UI, you ensure that each tool focuses on its strength—ReactX effectively manages state and data complexity, while React excels in crafting intuitive, responsive user interfaces.

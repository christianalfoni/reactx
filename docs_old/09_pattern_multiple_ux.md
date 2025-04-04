# Pattern: Multiple UX

Doing responsive design can be a huge challenge in rich applications. Unlike websites, the user experience of an application is many times more complex. Often features can only be responsibly implemented for a desktop experience. The result of this challenge is often that the mobile experienc is overlooked or in best case it tries it best to adjust to the primary desktop experience.

When you externally manage the state of your application you open up an opportunity to have a first class desktop experience and a first class mobile experience. That does not mean they are not responsive. Desktops have different sized screens and mobiles alike. But the fundamental user experience can be separated.

You still pass your state at the top of your application:

```tsx
// Your state management
const state = State();

render(<App state={state} />);
```

But your `App` component will completely change out the experience based on the current size of the screen:

```tsx
import React, { useState, useEffect } from "react";

function App({ state }) {
  // Define breakpoint (e.g., 768px for desktop)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isDesktop ? (
    <DesktopExperience state={state} />
  ) : (
    <MobileExperience state={state} />
  );
}

export default App;
```

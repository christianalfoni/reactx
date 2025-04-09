# Multiple UX

Doing responsive design can be a huge challenge in rich applications. Unlike websites, the user experience of an application is more complex. Often features can only be responsibly implemented for a desktop experience. The result of this challenge is often that the mobile experience is overlooked or in best case it tries its best to adjust to the primary desktop experience.

When you externally manage the state of your application you open up an opportunity to have a first class desktop experience and a first class mobile experience. That does not mean they are not responsive. Desktops have different sized screens and mobiles alike, but now you are also able to have to completely separate implementations and features for each device.

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
```

:::

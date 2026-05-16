# Multiple UX

When you manage state externally, nothing stops you from having two completely separate UI trees — one for desktop, one for mobile — both backed by the same state.

This is different from responsive CSS. A desktop experience and a mobile experience often have fundamentally different features and interaction patterns. Rather than compromising both into a single component tree, you can implement each properly and switch between them at the top level.

```tsx
import { app } from "./app";

function Root() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isDesktop ? <DesktopApp /> : <MobileApp />;
}
```

Both `<DesktopApp />` and `<MobileApp />` import from `app` directly. They share all state, but each renders it in whatever way suits the platform best.

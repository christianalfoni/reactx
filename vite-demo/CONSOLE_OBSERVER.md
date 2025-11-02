# Console Observer in Todo Demo

The vite-demo now includes the `ConsoleObserver` for debugging reactive state changes.

## How to Use

The ConsoleObserver is already integrated in `src/App.tsx`:

```typescript
import { reactive, ConsoleObserver } from "reactx";

const consoleObserver = new ConsoleObserver({
  colors: true,    // Enable colored console output
  verbose: false,  // Set to true to see full event data
});

const state = reactive(todoState, { observer: consoleObserver });
```

**Note:** The variable is named `consoleObserver` (not `observer`) to avoid conflicts with the `observer` HOC from mobx-react-lite that the babel plugin automatically injects.

## What You'll See

Open your browser console (F12) when running the demo at http://localhost:5177/ and you'll see color-coded logs for all reactive events:

### Event Types Logged

1. **🟢 TRACK** (green) - Property tracking via autorun
   - Triggered when reactive properties are accessed
   - Example: `[timestamp] TRACK todos = Array(3)`

2. **🟣 COMPUTED** (magenta) - Computed property evaluations
   - Triggered when getters are accessed
   - Example: `[timestamp] COMPUTED filteredTodos = Array(2) (eval #1)`

3. **🔵 ACTION START/END** (blue) - Action boundaries
   - Triggered when methods are called
   - Example: `[timestamp] ACTION START addTodo (0 args)`
   - Example: `[timestamp] ACTION END 2.34ms`

4. **🟡 MUTATE** (yellow) - Property mutations during actions
   - Triggered when properties are modified within actions
   - Example: `[timestamp] MUTATE todos.0.completed (set)`

5. **🟦 EXEC START/END** (cyan) - Execution lifecycle
   - Tracks the internal execution of actions
   - Shows timing: `[timestamp] EXEC END (sync) 1.23ms`

6. **🟣 METHOD** (magenta) - Instance method calls
   - Triggered when methods on instances are called during actions
   - Example: `[timestamp] METHOD storage.save() -> undefined`

## Try It Out

1. Start the dev server: `npm run dev`
2. Open http://localhost:5177/ in your browser
3. Open the browser console (F12)
4. Interact with the todo app:
   - **Add a todo**: Watch `ACTION START`, `MUTATE`, `METHOD`, `EXEC END`, `ACTION END`
   - **Toggle a todo**: See property mutations on the todo item
   - **Change filter**: Observe `MUTATE` on filter property and `COMPUTED` on filteredTodos
   - **Delete a todo**: Track the array mutation

## Customize Verbosity

To see more detailed information, modify `src/App.tsx`:

```typescript
const observer = new ConsoleObserver({
  colors: true,
  verbose: true,  // Shows full event data including execution IDs, paths, etc.
});
```

## Disable Observer

To disable logging, simply remove the observer option:

```typescript
const state = reactive(todoState); // No observer
```

## Performance Impact

The ConsoleObserver has minimal performance impact:
- Only logs to console (no network calls)
- Can be easily disabled in production
- Timestamp and formatting overhead is negligible

## Integration with Other Tools

The ConsoleObserver is separate from the DevtoolsObserver:
- **ConsoleObserver**: For quick debugging in the browser console
- **DevtoolsObserver**: For integration with Overmind Devtools (WebSocket-based)

You can use both simultaneously if needed!

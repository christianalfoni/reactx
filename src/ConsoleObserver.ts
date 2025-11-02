import { ReactiveObserver, ReactiveEvent } from "./events";

/**
 * ConsoleObserver implements the ReactiveObserver interface and logs
 * reactive events to the console for debugging purposes.
 *
 * @example
 * ```typescript
 * import { reactive } from 'reactx';
 * import { ConsoleObserver } from 'reactx/console';
 *
 * const observer = new ConsoleObserver({ colors: true });
 * const state = reactive({ count: 0 }, { observer });
 * ```
 */
export class ConsoleObserver implements ReactiveObserver {
  private colors: boolean;
  private verbose: boolean;

  /**
   * Creates a new ConsoleObserver instance
   * @param options Configuration options
   * @param options.colors Enable colored output (default: true)
   * @param options.verbose Show full event data (default: false)
   */
  constructor(
    options: {
      colors?: boolean;
      verbose?: boolean;
    } = {}
  ) {
    this.colors = options.colors ?? true;
    this.verbose = options.verbose ?? false;
  }

  private getColor(eventType: string): string {
    if (!this.colors) return "";

    const colors: Record<string, string> = {
      init: "\x1b[36m", // Cyan
      "property:mutated": "\x1b[33m", // Yellow
      "property:tracked": "\x1b[32m", // Green
      "computed:evaluated": "\x1b[35m", // Magenta
      "action:start": "\x1b[34m", // Blue
      "action:end": "\x1b[34m", // Blue
      "execution:start": "\x1b[36m", // Cyan
      "execution:end": "\x1b[36m", // Cyan
      "instance:method": "\x1b[35m", // Magenta
    };

    return colors[eventType] || "\x1b[0m";
  }

  private resetColor(): string {
    return this.colors ? "\x1b[0m" : "";
  }

  private formatValue(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === "object") {
      const keys = Object.keys(value);
      return keys.length > 3
        ? `{ ${keys.slice(0, 3).join(", ")} ... (${keys.length} keys) }`
        : `{ ${keys.join(", ")} }`;
    }
    return String(value);
  }

  private formatPath(path: string[]): string {
    return path.length > 0 ? path.join(".") : "(root)";
  }

  onEvent(event: ReactiveEvent): void {
    const color = this.getColor(event.type);
    const reset = this.resetColor();
    const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);

    switch (event.type) {
      case "init":
        console.log(
          `${color}[${timestamp}] INIT${reset}`,
          this.verbose ? event.data : "System initialized"
        );
        break;

      case "property:mutated": {
        const { executionPath, mutations } = event.data;
        mutations.forEach((mutation) => {
          console.log(
            `${color}[${timestamp}] MUTATE${reset}`,
            mutation.propertyPath,
            `(${mutation.operation})`,
            this.verbose ? mutation.args : ""
          );
        });
        break;
      }

      case "property:tracked": {
        const { path, value } = event.data;
        console.log(
          `${color}[${timestamp}] TRACK${reset}`,
          this.formatPath(path),
          "=",
          this.formatValue(value)
        );
        break;
      }

      case "computed:evaluated": {
        const { path, value, evaluationCount } = event.data;
        console.log(
          `${color}[${timestamp}] COMPUTED${reset}`,
          this.formatPath(path),
          "=",
          this.formatValue(value),
          `(eval #${evaluationCount})`
        );
        break;
      }

      case "action:start": {
        const { executionId, path, args } = event.data;
        console.log(
          `${color}[${timestamp}] ACTION START${reset}`,
          this.formatPath(path),
          this.verbose ? `[${executionId}]` : "",
          this.verbose ? args : `(${args.length} args)`
        );
        break;
      }

      case "action:end": {
        const { executionId, duration, error } = event.data;
        const durationStr = duration ? `${duration.toFixed(2)}ms` : "";
        const errorStr = error ? `ERROR: ${error.message}` : "";
        console.log(
          `${color}[${timestamp}] ACTION END${reset}`,
          this.verbose ? `[${executionId}]` : "",
          durationStr,
          errorStr
        );
        break;
      }

      case "execution:start": {
        const { executionId, name, path } = event.data;
        console.log(
          `${color}[${timestamp}] EXEC START${reset}`,
          name,
          `at ${this.formatPath(path)}`,
          this.verbose ? `[${executionId}]` : ""
        );
        break;
      }

      case "execution:end": {
        const { executionId, duration, isAsync, error } = event.data;
        const asyncStr = isAsync ? "(async)" : "(sync)";
        const durationStr = duration ? `${duration.toFixed(2)}ms` : "";
        const errorStr = error ? `ERROR: ${error.message}` : "";
        console.log(
          `${color}[${timestamp}] EXEC END${reset}`,
          asyncStr,
          durationStr,
          errorStr,
          this.verbose ? `[${executionId}]` : ""
        );
        break;
      }

      case "instance:method": {
        const { methodName, methodPath, args, result, error } = event.data;
        const errorStr = error ? `ERROR: ${error.message}` : "";
        console.log(
          `${color}[${timestamp}] METHOD${reset}`,
          `${this.formatPath(methodPath)}.${methodName}()`,
          errorStr || `-> ${this.formatValue(result)}`,
          this.verbose ? args : ""
        );
        break;
      }
    }
  }
}

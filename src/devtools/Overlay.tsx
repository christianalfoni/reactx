import React, { useState, useCallback, useRef, useEffect, CSSProperties } from "react";
import { observer } from "mobx-react-lite";
import { devtoolsStore, ActionEntry, ActionEvent, ServiceCallEntry } from "./store";
import { JsonNode, Primitive } from "./JsonNode";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#0f0f0f",
  surface: "#1a1a1a",
  surfaceHover: "#222222",
  border: "#2a2a2a",
  accent: "#8b5cf6",
  accentDim: "#4c1d95",
  text: "#e5e7eb",
  muted: "#6b7280",
  green: "#34d399",
  red: "#f87171",
  yellow: "#fbbf24",
  blue: "#60a5fa",
};

// ─── Resize hook ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "reactx-devtools-width";
const DEFAULT_WIDTH = 440;
const MIN_WIDTH = 280;
const MAX_WIDTH = 900;

function useResizableWidth() {
  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parseInt(stored, 10))) : DEFAULT_WIDTH;
  });
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
  }, [width]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      const delta = startX.current - e.clientX;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(next);
    }
    function onMouseUp() {
      if (!dragging.current) return;
      dragging.current = false;
      setWidth((w) => {
        localStorage.setItem(STORAGE_KEY, String(w));
        return w;
      });
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return { width, onMouseDown };
}

// ─── Layout helpers ───────────────────────────────────────────────────────────
const s = {
  panel: {
    position: "fixed",
    bottom: "12px",
    right: "12px",
    height: "540px",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "12px",
    color: C.text,
    boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
    overflow: "hidden",
    zIndex: 2147483647,
  } as CSSProperties,

  badge: {
    position: "fixed",
    bottom: "12px",
    right: "12px",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: "9999px",
    padding: "6px 14px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "12px",
    color: C.text,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    zIndex: 2147483647,
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
    userSelect: "none",
  } as CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    padding: "10px 14px",
    borderBottom: `1px solid ${C.border}`,
    gap: "8px",
    flexShrink: 0,
  } as CSSProperties,

  scrollArea: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  } as CSSProperties,
} as const;

// ─── Hover helpers ────────────────────────────────────────────────────────────
const hoverOn = (e: React.MouseEvent) =>
  ((e.currentTarget as HTMLElement).style.background = C.surfaceHover);
const hoverOff = (e: React.MouseEvent) =>
  ((e.currentTarget as HTMLElement).style.background = "transparent");

const baseBtn: CSSProperties = {
  width: "100%",
  background: "none",
  border: "none",
  color: C.text,
  display: "flex",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
};

// ─── Inline args ─────────────────────────────────────────────────────────────

function InlineArg({ value }: { value: any }) {
  if (value === null || typeof value !== "object") {
    return <Primitive value={value} />;
  }
  if (Array.isArray(value)) {
    return <span style={{ color: "#4b5563" }}>[{value.length}]</span>;
  }
  return <span style={{ color: "#4b5563" }}>{"{…}"}</span>;
}

function InlineArgs({ args }: { args: any[] }) {
  const parenColor = "#4b5563";
  if (args.length === 0) {
    return <span style={{ color: parenColor }}>()</span>;
  }
  return (
    <span style={{ color: parenColor }}>
      (
      {args.map((a, i) => (
        <React.Fragment key={i}>
          <InlineArg value={a} />
          {i < args.length - 1 && ", "}
        </React.Fragment>
      ))}
      )
    </span>
  );
}

// ─── Expandable args ─────────────────────────────────────────────────────────

function ExpandableArgs({ args }: { args: any[] }) {
  const [open, setOpen] = useState(false);

  if (args.length === 0) {
    return <span style={{ color: "#4b5563" }}>()</span>;
  }

  return (
    <span
      onClick={() => setOpen((o) => !o)}
      style={{ cursor: "pointer", color: "#4b5563" }}
    >
      {open ? (
        <span style={{ display: "inline-block", verticalAlign: "top" }}>
          (
          {args.map((arg, i) => (
            <React.Fragment key={i}>
              {arg !== null && typeof arg === "object" ? (
                <>
                  <span style={{ color: "#374151" }}>{Array.isArray(arg) ? "[" : "{"}</span>
                  <JsonNode value={arg} defaultOpen hideRoot depth={1} />
                  <span style={{ color: "#374151" }}>{Array.isArray(arg) ? "]" : "}"}</span>
                </>
              ) : (
                <JsonNode value={arg} defaultOpen hideRoot depth={1} />
              )}
              {i < args.length - 1 && (
                <span style={{ color: "#4b5563" }}>,</span>
              )}
            </React.Fragment>
          ))}
          )
        </span>
      ) : (
        <InlineArgs args={args} />
      )}
    </span>
  );
}

// ─── State tab ────────────────────────────────────────────────────────────────

const InstanceItem = observer(function InstanceItem({
  name,
}: {
  name: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ ...baseBtn, padding: "8px 14px", fontSize: "12px" }}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
      >
        <span style={{ color: C.muted, fontSize: "10px" }}>
          {open ? "▼" : "▶"}
        </span>
        <span style={{ color: C.accent, fontWeight: 600 }}>{name}</span>
      </button>

      {open && (
        <div style={{ padding: "2px 14px 10px 28px", fontFamily: "ui-monospace, monospace", fontSize: "11px" }}>
          <span style={{ color: "#374151" }}>{"{"}</span>
          <JsonNode
            value={devtoolsStore.stateSnapshot[name]}
            defaultOpen={true}
            hideRoot
            depth={1}
            computedPaths={devtoolsStore.computedPaths}
            pathPrefix={name}
          />
          <span style={{ color: "#374151" }}>{"}"}</span>
        </div>
      )}
    </div>
  );
});

// ─── Event list (chronological, recursive) ────────────────────────────────────

const mono: CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "11px",
  lineHeight: "1.8",
};

function ChangeList({
  changes,
  indent,
}: {
  changes: ActionEvent[];
  indent: number;
}) {
  return (
    <>
      {changes.map((ev, i) => {
        if (ev.kind === "mutation") {
          return <MutationRow key={i} mutation={ev.mutation} indent={indent} />;
        }
        if (ev.kind === "serviceCall") {
          return (
            <ServiceCallRow key={i} call={ev.serviceCall} indent={indent} />
          );
        }
        return (
          <NestedActionRow key={ev.action.id} entry={ev.action} indent={indent} />
        );
      })}
    </>
  );
}

function MutationRow({
  mutation,
  indent,
}: {
  mutation: { path: string; operation: string; args: any[] };
  indent: number;
}) {
  const [open, setOpen] = useState(false);

  const displayPath = mutation.path.includes(".") ? mutation.path.slice(mutation.path.indexOf(".") + 1) : mutation.path;

  const isSet = mutation.operation === "set";
  const displayValue = isSet ? mutation.args[0] : undefined;
  const isComplex = isSet && displayValue !== null && typeof displayValue === "object";

  if (!isComplex) {
    return (
      <div
        style={{
          ...mono,
          display: "flex",
          alignItems: "baseline",
          gap: "6px",
          padding: `2px 14px 2px ${indent}px`,
        }}
      >
        <span style={{ color: C.green, flexShrink: 0 }}>{displayPath}</span>
        {isSet ? (
          <>
            <span style={{ color: "#4b5563" }}>=</span>
            <Primitive value={displayValue} />
          </>
        ) : (
          <span style={{ color: C.muted }}>
            .{mutation.operation}({mutation.args.map(String).join(", ")})
          </span>
        )}
      </div>
    );
  }

  const keyCount = Array.isArray(displayValue)
    ? displayValue.length
    : Object.keys(displayValue).length;
  const collapsedLabel = Array.isArray(displayValue) ? `[${keyCount}]` : `{${keyCount}}`;

  return (
    <div style={mono}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          ...baseBtn,
          ...mono,
          padding: `2px 14px 2px ${indent}px`,
        }}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
      >
        <span style={{ color: C.green }}>{displayPath}</span>
        <span style={{ color: "#4b5563" }}>=</span>
        {!open && <span style={{ color: C.muted }}>{collapsedLabel}</span>}
      </button>
      {open && (
        <div style={{ padding: `0 14px 4px ${indent + 14}px` }}>
          <JsonNode value={displayValue} depth={0} defaultOpen />
        </div>
      )}
    </div>
  );
}

const ServiceCallRow = observer(function ServiceCallRow({
  call,
  indent,
}: {
  call: ServiceCallEntry;
  indent: number;
}) {
  const [resultOpen, setResultOpen] = useState(false);

  const displayName = call.path.slice(1).concat(call.name).join(".");
  const hasComplexResult =
    !call.isPending && call.result !== undefined && typeof call.result === "object";
  const hasPrimitiveResult =
    !call.isPending && call.result !== undefined && typeof call.result !== "object";

  return (
    <div style={mono}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "6px",
          padding: `2px 14px 2px ${indent}px`,
        }}
      >
        {call.isAsync && (
          <span style={{ color: C.yellow, fontSize: "10px" }}>
            {call.isPending ? "pending" : "async"}
          </span>
        )}
        <span style={{ color: C.blue }}>{displayName}</span>
        <ExpandableArgs args={call.args} />
        {hasPrimitiveResult && (
          <>
            <span style={{ color: "#4b5563" }}>→</span>
            <Primitive value={call.result} />
          </>
        )}
        {hasComplexResult && (
          <button
            onClick={() => setResultOpen((o) => !o)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}
          >
            <span style={{ color: "#4b5563" }}>→</span>
            <InlineArg value={call.result} />
          </button>
        )}
        {call.error && <span style={{ color: C.red, fontSize: "10px" }}>error</span>}
      </div>
      {resultOpen && hasComplexResult && (
        <div style={{ padding: `2px 14px 4px ${indent + 14}px` }}>
          <JsonNode value={call.result} defaultOpen depth={0} />
        </div>
      )}
      {call.error && (
        <div style={{ padding: `0 14px 4px ${indent + 14}px`, color: C.red }}>
          {String(call.error)}
        </div>
      )}
    </div>
  );
});

const NestedActionRow = observer(function NestedActionRow({
  entry,
  indent,
}: {
  entry: ActionEntry;
  indent: number;
}) {
  const lastDot = entry.name.lastIndexOf(".");
  const method = lastDot === -1 ? entry.name : entry.name.slice(lastDot + 1);

  return (
    <div style={{ borderLeft: `2px solid ${C.accentDim}`, marginLeft: indent, marginTop: "2px", marginBottom: "2px" }}>
      <div
        style={{
          ...mono,
          display: "flex",
          alignItems: "baseline",
          gap: "4px",
          padding: "2px 14px 2px 8px",
        }}
      >
        {entry.isAsync && (
          <span style={{ color: C.yellow, fontSize: "10px" }}>async</span>
        )}
        <span style={{ color: C.text }}>{method}</span>
        <ExpandableArgs args={entry.args} />
        {entry.duration !== undefined && (
          <span style={{ color: C.muted, fontSize: "10px" }}>{entry.duration}ms</span>
        )}
        {entry.status === "error" && (
          <span style={{ color: C.red, fontSize: "10px" }}>error</span>
        )}
      </div>
      {entry.changes.length > 0 && (
        <ChangeList changes={entry.changes} indent={8} />
      )}
    </div>
  );
});

// ─── Top-level action row ─────────────────────────────────────────────────────
const ActionItem = observer(function ActionItem({
  entry,
}: {
  entry: ActionEntry;
}) {
  const lastDot = entry.name.lastIndexOf(".");
  const instance = lastDot === -1 ? "" : entry.name.slice(0, lastDot);
  const method = lastDot === -1 ? entry.name : entry.name.slice(lastDot + 1);

  const isRunning = entry.status === "running";
  const isError = entry.status === "error";

  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "6px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "6px",
          padding: "7px 14px",
          fontFamily: "ui-monospace, monospace",
          fontSize: "11px",
        }}
      >
        {entry.isAsync && (
          <span style={{ color: C.yellow, fontSize: "10px" }}>async</span>
        )}
        <span>
          {instance && <span style={{ color: C.accent }}>{instance}</span>}
          {instance && <span style={{ color: C.muted }}>.</span>}
          <span style={{ color: C.text, fontWeight: 600 }}>{method}</span>
        </span>
        <ExpandableArgs args={entry.args} />
        <span style={{ flex: 1 }} />
        {isRunning && (
          <span style={{ color: C.yellow, fontSize: "10px" }}>running</span>
        )}
        {isError && (
          <span style={{ color: C.red, fontSize: "10px" }}>error</span>
        )}
        {entry.duration !== undefined && (
          <span style={{ color: C.muted, fontSize: "10px", minWidth: "32px", textAlign: "right" }}>
            {entry.duration}ms
          </span>
        )}
      </div>
      {entry.changes.length === 0 && !isRunning ? (
        <div
          style={{
            padding: "4px 14px 4px 28px",
            color: C.muted,
            fontFamily: "ui-monospace, monospace",
            fontSize: "11px",
          }}
        >
          no changes
        </div>
      ) : (
        <ChangeList changes={entry.changes} indent={28} />
      )}
    </div>
  );
});

// ─── Tab button ───────────────────────────────────────────────────────────────
function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? C.surface : "transparent",
        border: `1px solid ${active ? C.border : "transparent"}`,
        borderRadius: "6px",
        color: active ? C.text : C.muted,
        padding: "3px 10px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "11px",
      }}
    >
      {label}
    </button>
  );
}

// ─── Root overlay ─────────────────────────────────────────────────────────────
export const Overlay = observer(function Overlay() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"state" | "actions">("state");
  const close = useCallback(() => setOpen(false), []);
  const { width, onMouseDown } = useResizableWidth();

  const instanceNames = Object.keys(devtoolsStore.stateSnapshot);
  const actionCount = devtoolsStore.actions.length;

  if (!open) {
    return (
      <button style={s.badge} onClick={() => setOpen(true)}>
        <span style={{ color: C.accent, fontSize: "14px" }}>⬡</span>
        <span>ReactX</span>
      </button>
    );
  }

  return (
    <div style={{ ...s.panel, width }}>
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          cursor: "ew-resize",
          borderRadius: "12px 0 0 12px",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = C.border)}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      />
      {/* Header */}
      <div style={s.header}>
        <span style={{ color: C.accent, fontSize: "15px" }}>⬡</span>
        <span style={{ fontWeight: 600, color: C.text, marginRight: "4px" }}>
          ReactX
        </span>
        <span style={{ color: C.muted }}>DevTools</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: "2px" }}>
          <Tab
            label="State"
            active={tab === "state"}
            onClick={() => setTab("state")}
          />
          <Tab
            label="Actions"
            active={tab === "actions"}
            onClick={() => setTab("actions")}
          />
        </div>
        <button
          onClick={close}
          style={{
            background: "none",
            border: "none",
            color: C.muted,
            cursor: "pointer",
            fontSize: "16px",
            lineHeight: 1,
            padding: "0 0 0 8px",
            fontFamily: "inherit",
          }}
        >
          ×
        </button>
      </div>

      {/* State tab */}
      {tab === "state" && (
        <div style={s.scrollArea}>
          {instanceNames.length === 0 ? (
            <div
              style={{
                padding: "32px 14px",
                color: C.muted,
                textAlign: "center",
              }}
            >
              No reactive state observed yet.
              <br />
              Call <code style={{ color: C.accent }}>reactive()</code> and
              render a component that reads state.
            </div>
          ) : (
            instanceNames.map((name) => (
              <InstanceItem key={name} name={name} />
            ))
          )}
        </div>
      )}

      {/* Actions tab */}
      {tab === "actions" && (
        <div style={s.scrollArea}>
          {actionCount === 0 ? (
            <div
              style={{
                padding: "32px 14px",
                color: C.muted,
                textAlign: "center",
              }}
            >
              No actions recorded yet.
              <br />
              Call a method on a reactive instance.
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: "6px 14px",
                  borderBottom: `1px solid ${C.border}`,
                  color: C.muted,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <span>{actionCount} actions</span>
                <button
                  onClick={() => devtoolsStore.clearActions()}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.muted,
                    cursor: "pointer",
                    fontSize: "11px",
                    fontFamily: "inherit",
                    padding: 0,
                  }}
                >
                  clear
                </button>
              </div>
              {devtoolsStore.actions.map((entry) => (
                <ActionItem key={entry.id} entry={entry} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
});

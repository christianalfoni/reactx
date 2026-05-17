import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { CLASS_NAME_KEY } from "./store";

// ─── Tokens (must stay in sync with Overlay.tsx) ─────────────────────────────
const C = {
  bg: "#0f0f0f",
  surfaceHover: "#1e1e1e",
  border: "#2a2a2a",
  text: "#e5e7eb",
  muted: "#6b7280",
  mutedDim: "#374151",
  accent: "#8b5cf6",
  green: "#34d399",
  red: "#f87171",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  purple: "#a78bfa",
};

// ─── Primitive renderer ───────────────────────────────────────────────────────
export function Primitive({ value }: { value: unknown }) {
  if (value === null) return <span style={{ color: C.muted }}>null</span>;
  if (value === undefined)
    return <span style={{ color: C.muted }}>undefined</span>;
  if (typeof value === "boolean")
    return <span style={{ color: C.blue }}>{String(value)}</span>;
  if (typeof value === "number")
    return <span style={{ color: C.green }}>{value}</span>;
  if (typeof value === "string") {
    const display = value.length > 60 ? value.slice(0, 60) + "…" : value;
    return <span style={{ color: C.yellow }}>"{display}"</span>;
  }
  if (typeof value === "function")
    return <span style={{ color: C.purple }}>Function</span>;
  return <span style={{ color: C.text }}>{String(value)}</span>;
}

// ─── Collapsed summary ────────────────────────────────────────────────────────
function CollapsedSummary({ value }: { value: object }) {
  if (Array.isArray(value)) {
    return (
      <span style={{ color: C.muted }}>
        {"["}
        {value.length}
        {"]"}
      </span>
    );
  }
  const className = (value as any)[CLASS_NAME_KEY] as string | undefined;
  const count = Object.keys(value).filter(
    (k) => typeof (value as any)[k] !== "function"
  ).length;
  return (
    <span style={{ color: C.muted }}>
      {className && (
        <span style={{ color: C.accent, fontStyle: "italic", marginRight: "4px" }}>{className}</span>
      )}
      {"{"}
      {count}
      {"}"}
    </span>
  );
}

// ─── Core JsonNode ────────────────────────────────────────────────────────────

export interface JsonNodeProps {
  value: unknown;
  /** Key/index label to show to the left of the value */
  label?: string | number;
  depth?: number;
  /** Auto-expand this node on first render */
  defaultOpen?: boolean;
  /** Skip the root toggle header and always render children directly */
  hideRoot?: boolean;
  /** Set of dot-joined paths (relative to this node's root) that are computed */
  computedPaths?: Set<string>;
  /** Dot-joined path from the root to this node, used to match computedPaths */
  pathPrefix?: string;
}

/**
 * Recursive JSON tree node. Wrapped with `observer` so any reactive proxy
 * values passed in are tracked: expanding a node subscribes to those reads
 * and the node re-renders automatically when they change.
 */
export const JsonNode = observer(function JsonNode({
  value,
  label,
  depth = 0,
  defaultOpen = false,
  hideRoot = false,
  computedPaths,
  pathPrefix = "",
}: JsonNodeProps) {
  const [open, setOpen] = useState(defaultOpen);

  const isComputed =
    computedPaths !== undefined &&
    pathPrefix !== undefined &&
    pathPrefix !== "" &&
    computedPaths.has(pathPrefix);

  const isArray = Array.isArray(value);
  const isObject =
    !isArray && value !== null && typeof value === "object";
  const isExpandable = isArray || isObject;

  const paddingLeft = depth * 14;
  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    gap: "6px",
    paddingLeft,
    lineHeight: "1.8",
    fontFamily: "ui-monospace, monospace",
    fontSize: "11px",
    minHeight: "20px",
  };

  // ── Label ─────────────────────────────────────────────────────────────────
  const labelNode = label !== undefined && (
    <span
      style={{
        color: isComputed ? C.accent : typeof label === "number" ? C.purple : C.muted,
        flexShrink: 0,
        minWidth: typeof label === "number" ? "24px" : "0",
        fontStyle: isComputed ? "italic" : undefined,
      }}
    >
      {label}
      {isComputed && <span style={{ fontSize: "9px", marginLeft: "3px", opacity: 0.7 }}>⊙</span>}
    </span>
  );

  // ── Primitive leaf ────────────────────────────────────────────────────────
  if (!isExpandable) {
    return (
      <div style={rowStyle}>
        {labelNode}
        <Primitive value={value} />
      </div>
    );
  }

  // ── hideRoot: skip the toggle header, render children directly ───────────
  if (hideRoot) {
    const keys = isArray
      ? Array.from({ length: (value as unknown[]).length }, (_, i) => i)
      : (Object.keys(value as object) as Array<string | number>).filter(
          (k) => typeof (value as any)[k] !== "function",
        ).sort();
    return (
      <>
        {keys.map((k) => {
          const childPath = pathPrefix ? `${pathPrefix}.${String(k)}` : String(k);
          return (
            <JsonNode
              key={String(k)}
              value={(value as any)[k]}
              label={k}
              depth={depth}
              computedPaths={computedPaths}
              pathPrefix={childPath}
            />
          );
        })}
      </>
    );
  }

  // ── Object / Array ────────────────────────────────────────────────────────
  const keys = isArray
    ? Array.from({ length: (value as unknown[]).length }, (_, i) => i)
    : (Object.keys(value as object) as Array<string | number>).filter(
        (k) => typeof (value as any)[k] !== "function"
      ).sort();

  const [openBracket, closeBracket] = isArray ? ["[", "]"] : ["{", "}"];
  const className = !isArray
    ? ((value as any)[CLASS_NAME_KEY] as string | undefined)
    : undefined;

  return (
    <>
      {/* Header row */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)}
        style={{
          ...rowStyle,
          cursor: "pointer",
          userSelect: "none",
          borderRadius: "4px",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background = C.surfaceHover)
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = "transparent")
        }
      >
        {labelNode}

        {open ? (
          <>
            {className && (
              <span style={{ color: C.accent, fontStyle: "italic" }}>{className}</span>
            )}
            <span style={{ color: C.mutedDim }}>{openBracket}</span>
          </>
        ) : (
          <CollapsedSummary value={value as object} />
        )}
      </div>

      {/* Children */}
      {open &&
        keys.map((k) => {
          const childPath = pathPrefix
            ? `${pathPrefix}.${String(k)}`
            : String(k);
          return (
            <JsonNode
              key={String(k)}
              value={(value as any)[k]}
              label={k}
              depth={depth + 1}
              computedPaths={computedPaths}
              pathPrefix={childPath}
            />
          );
        })}

      {/* Closing bracket */}
      {open && (
        <div
          style={{
            ...rowStyle,
            color: C.mutedDim,
          }}
        >
          {closeBracket}
        </div>
      )}
    </>
  );
});

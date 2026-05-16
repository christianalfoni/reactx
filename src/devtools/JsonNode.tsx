import React, { useState } from "react";
import { observer } from "mobx-react-lite";

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
  arrow: "#4b5563",
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
  const keys = Object.keys(value).filter(
    (k) => typeof (value as any)[k] !== "function"
  );
  const preview = keys.slice(0, 3).join(", ");
  return (
    <span style={{ color: C.muted }}>
      {"{ "}
      {preview}
      {keys.length > 3 ? ", …" : ""}
      {" }"}
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
}: JsonNodeProps) {
  const [open, setOpen] = useState(defaultOpen);

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
        color: typeof label === "number" ? C.purple : C.muted,
        flexShrink: 0,
        minWidth: typeof label === "number" ? "24px" : "0",
      }}
    >
      {label}
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

  // ── Object / Array ────────────────────────────────────────────────────────
  const keys = isArray
    ? Array.from({ length: (value as unknown[]).length }, (_, i) => i)
    : (Object.keys(value as object) as Array<string | number>).filter(
        (k) => typeof (value as any)[k] !== "function"
      );

  const [openBracket, closeBracket] = isArray ? ["[", "]"] : ["{", "}"];

  return (
    <>
      {/* Header row */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
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
        {/* Expand/collapse chevron */}
        <span
          style={{
            color: C.arrow,
            fontSize: "9px",
            flexShrink: 0,
            width: "10px",
            marginLeft: -14,
            paddingLeft: depth === 0 ? 0 : undefined,
          }}
        >
          {open ? "▼" : "▶"}
        </span>

        {labelNode}

        {open ? (
          <span style={{ color: C.mutedDim }}>{openBracket}</span>
        ) : (
          <CollapsedSummary value={value as object} />
        )}
      </div>

      {/* Children */}
      {open &&
        keys.map((k) => (
          <JsonNode
            key={String(k)}
            value={(value as any)[k]}
            label={k}
            depth={depth + 1}
          />
        ))}

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

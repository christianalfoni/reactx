import React, { useState, useCallback, CSSProperties } from "react";
import { observer } from "mobx-react-lite";
import { devtoolsStore, InstanceEntry, ActionEntry, Mutation } from "./store";
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
};

// ─── Layout helpers ───────────────────────────────────────────────────────────
const s = {
  panel: {
    position: "fixed",
    bottom: "12px",
    right: "12px",
    width: "440px",
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

// ─── Instance section ─────────────────────────────────────────────────────────
// InstanceItem passes the reactive proxy directly to JsonNode.
// Since JsonNode is an observer, every property it reads inside an expanded
// node is tracked — the subtree re-renders automatically when those change.
const InstanceItem = observer(function InstanceItem({
  entry,
}: {
  entry: InstanceEntry;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          color: C.text,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
          fontSize: "12px",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background = C.surfaceHover)
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = "transparent")
        }
      >
        <span style={{ color: C.muted, fontSize: "10px" }}>
          {open ? "▼" : "▶"}
        </span>
        <span style={{ color: C.accent, fontWeight: 600 }}>{entry.name}</span>
      </button>

      {/* JSON tree */}
      {open && (
        <div style={{ padding: "2px 14px 10px 14px" }}>
          <JsonNode value={entry.proxy} defaultOpen={true} depth={0} />
        </div>
      )}
    </div>
  );
});

// ─── Mutation row ─────────────────────────────────────────────────────────────
function MutationRow({ mutation }: { mutation: Mutation }) {
  const [open, setOpen] = useState(false);

  const dotIdx = mutation.label.indexOf(".");
  const prop =
    dotIdx === -1 ? mutation.label : mutation.label.slice(dotIdx + 1);

  const bothPrimitive =
    (mutation.oldValue === null ||
      typeof mutation.oldValue !== "object") &&
    (mutation.newValue === null ||
      typeof mutation.newValue !== "object");

  if (bothPrimitive) {
    // Compact single-line display for primitive changes.
    return (
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "6px",
          padding: "3px 14px 3px 28px",
          fontFamily: "ui-monospace, monospace",
          fontSize: "11px",
          lineHeight: "1.8",
        }}
      >
        <span style={{ color: C.muted, flexShrink: 0, minWidth: "80px" }}>
          {prop}
        </span>
        <span style={{ color: C.green }}>
          <Primitive value={mutation.newValue} />
        </span>
      </div>
    );
  }

  // Expandable display for object/array changes.
  return (
    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "11px" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          color: C.text,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 14px 3px 20px",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
          fontSize: "11px",
          lineHeight: "1.8",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background = C.surfaceHover)
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = "transparent")
        }
      >
        <span style={{ color: "#4b5563", fontSize: "9px" }}>
          {open ? "▼" : "▶"}
        </span>
        <span style={{ color: C.muted }}>{prop}</span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 6px 28px" }}>
          <JsonNode value={mutation.newValue} depth={0} />
        </div>
      )}
    </div>
  );
}

// ─── Action row ───────────────────────────────────────────────────────────────
function ActionItem({ entry }: { entry: ActionEntry }) {
  const [open, setOpen] = useState(false);

  const dotIdx = entry.label.indexOf(".");
  const instance =
    dotIdx === -1 ? entry.label : entry.label.slice(0, dotIdx);
  const method = dotIdx === -1 ? "" : entry.label.slice(dotIdx + 1);

  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          color: C.text,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 14px",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "ui-monospace, monospace",
          fontSize: "11px",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background = C.surfaceHover)
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = "transparent")
        }
      >
        <span style={{ color: "#4b5563", fontSize: "9px", flexShrink: 0 }}>
          {open ? "▼" : "▶"}
        </span>
        <span style={{ color: C.muted, flexShrink: 0 }}>{time}</span>
        <span style={{ color: C.accent }}>{instance}</span>
        <span style={{ color: C.muted }}>.</span>
        <span style={{ color: C.text, fontWeight: 600 }}>{method}</span>

        <span style={{ flex: 1 }} />

        {entry.mutations.length > 0 && (
          <span
            style={{
              background: "#1a2e1a",
              color: C.green,
              borderRadius: "9999px",
              padding: "1px 7px",
              fontSize: "10px",
              flexShrink: 0,
            }}
          >
            {entry.mutations.length}{" "}
            {entry.mutations.length === 1 ? "change" : "changes"}
          </span>
        )}

        <span
          style={{
            color: C.muted,
            fontSize: "10px",
            flexShrink: 0,
            minWidth: "32px",
            textAlign: "right",
          }}
        >
          {entry.duration}ms
        </span>
      </button>

      {open && (
        <div style={{ paddingBottom: "6px" }}>
          {entry.mutations.length === 0 ? (
            <div
              style={{
                padding: "4px 14px 4px 28px",
                color: C.muted,
                fontFamily: "ui-monospace, monospace",
                fontSize: "11px",
              }}
            >
              no state changes
            </div>
          ) : (
            entry.mutations.map((m, i) => <MutationRow key={i} mutation={m} />)
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function Tab({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
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
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            background: C.accentDim,
            color: C.accent,
            borderRadius: "9999px",
            padding: "0 5px",
            fontSize: "10px",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Root overlay ─────────────────────────────────────────────────────────────
export const Overlay = observer(function Overlay() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"state" | "actions">("state");
  const close = useCallback(() => setOpen(false), []);

  const instanceCount = devtoolsStore.instances.length;
  const actionCount = devtoolsStore.actions.length;

  if (!open) {
    return (
      <button style={s.badge} onClick={() => setOpen(true)}>
        <span style={{ color: C.accent, fontSize: "14px" }}>⬡</span>
        <span>ReactX</span>
        {instanceCount > 0 && (
          <span
            style={{
              background: C.accentDim,
              color: C.accent,
              borderRadius: "9999px",
              padding: "0 5px",
              fontSize: "10px",
            }}
          >
            {instanceCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div style={s.panel}>
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
            badge={instanceCount}
          />
          <Tab
            label="Actions"
            active={tab === "actions"}
            onClick={() => setTab("actions")}
            badge={actionCount}
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
          {devtoolsStore.instances.length === 0 ? (
            <div
              style={{ padding: "32px 14px", color: C.muted, textAlign: "center" }}
            >
              No reactive instances registered yet.
              <br />
              Call <code style={{ color: C.accent }}>reactive()</code> to
              register state.
            </div>
          ) : (
            devtoolsStore.instances.map((entry) => (
              <InstanceItem key={entry.name} entry={entry} />
            ))
          )}
        </div>
      )}

      {/* Actions tab */}
      {tab === "actions" && (
        <div style={s.scrollArea}>
          {devtoolsStore.actions.length === 0 ? (
            <div
              style={{ padding: "32px 14px", color: C.muted, textAlign: "center" }}
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
                  onClick={() => (devtoolsStore.actions.length = 0)}
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

import React from "react";
import { createRoot } from "react-dom/client";
import { devtoolsStore } from "./store";
import { Overlay } from "./Overlay";

// Guard against double-registration (e.g. HMR).
if (!(globalThis as any).__REACTX_DEVTOOLS__) {
  // Expose the registration hook so reactive() can call it without importing
  // from this module directly (which would pull devtools into the main bundle).
  (globalThis as any).__REACTX_DEVTOOLS__ = {
    register(target: any, proxy: any) {
      devtoolsStore.register(target, proxy);
    },
  };

  // Drain any instances that called reactive() before this script loaded.
  // This is the common case: app modules execute before the injected devtools
  // script because both are <script type="module"> and run in document order.
  const queue: Array<{ target: any; proxy: any }> =
    (globalThis as any).__REACTX_DEVTOOLS_QUEUE__ ?? [];
  for (const { target, proxy } of queue) {
    devtoolsStore.register(target, proxy);
  }
  delete (globalThis as any).__REACTX_DEVTOOLS_QUEUE__;

  // Mount the overlay into a Shadow DOM root so our styles never bleed into
  // (or get overridden by) the host application's CSS.
  const host = document.createElement("div");
  host.id = "reactx-devtools-host";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  // Shadow DOM doesn't inherit document styles, but box-sizing and resets
  // still matter for our own elements.
  const style = document.createElement("style");
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #0f0f0f; }
    ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 9999px; }
  `;
  shadow.appendChild(style);

  const container = document.createElement("div");
  shadow.appendChild(container);

  createRoot(container).render(React.createElement(Overlay));
}

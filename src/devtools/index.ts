import React from "react";
import { createRoot } from "react-dom/client";
import { _devHooks, _stateChangeQueue, _computedQueue } from "../proxy";
import { devtoolsStore } from "./store";
import { Overlay } from "./Overlay";

// Guard against double-registration (e.g. HMR).
if (!(globalThis as any).__REACTX_DEVTOOLS__) {
  (globalThis as any).__REACTX_DEVTOOLS__ = true;

  // Wire the proxy hooks to the devtools store.
  // _devHooks is a shared object reference passed into every reactive() proxy,
  // so assigning here affects all existing and future proxies.
  Object.assign(_devHooks, {
    onStateChange: (d: any) => devtoolsStore.handleStateChange(d),
    onComputed: (d: any) => devtoolsStore.handleComputed(d),
    onActionStart: (d: any) => devtoolsStore.handleActionStart(d),
    onActionEnd: (d: any) => devtoolsStore.handleActionEnd(d),
    onMutation: (d: any) => devtoolsStore.handleMutation(d),
    onServiceCall: (d: any) => devtoolsStore.handleServiceCall(d),
    onServiceCallResult: (d: any) => devtoolsStore.handleServiceCallResult(d),
  });

  // Replay any state/computed changes that fired before devtools loaded.
  for (const d of _stateChangeQueue.splice(0)) {
    devtoolsStore.handleStateChange(d);
  }
  for (const d of _computedQueue.splice(0)) {
    devtoolsStore.handleComputed(d);
  }

  // Mount the overlay into a Shadow DOM root so our styles never bleed into
  // (or get overridden by) the host application's CSS.
  const host = document.createElement("div");
  host.id = "reactx-devtools-host";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

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

import { makeObservable, observable, action, spy, runInAction } from "mobx";
import { _devHooks } from "../proxy";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface InstanceEntry {
  name: string;
  target: any;
  proxy: any;
}

export interface Mutation {
  /** MobX debug name, e.g. "App.count" */
  label: string;
  oldValue: any;
  newValue: any;
}

export interface ActionEntry {
  id: number;
  /** e.g. "App.increment" */
  label: string;
  timestamp: number;
  duration: number;
  mutations: Mutation[];
}

// ─── Store ────────────────────────────────────────────────────────────────────

class DevtoolsStore {
  instances: InstanceEntry[] = [];
  actions: ActionEntry[] = [];

  /**
   * While a method is executing, all spy mutations are collected here.
   * Null outside of an action — cheap check, no overhead in production
   * because _devHooks.onMethod is also null there.
   */
  private _pending: Mutation[] | null = null;
  private _nextId = 0;

  constructor() {
    makeObservable(this, {
      instances: observable,
      actions: observable,
      register: action,
    });

    // Collect observable-box mutations that fire while a method is running.
    spy((event: any) => {
      if (
        this._pending &&
        event.type === "update" &&
        event.observableKind === "value" &&
        typeof event.debugObjectName === "string" &&
        event.debugObjectName.includes(".")
      ) {
        this._pending.push({
          label: event.debugObjectName,
          oldValue: event.oldValue,
          newValue: event.newValue,
        });
      }
    });
  }

  // ── Registration ──────────────────────────────────────────────────────────

  register(target: any, proxy: any) {
    if (this.instances.some((e) => e.target === target)) return;
    this.instances.push({
      name: target?.constructor?.name ?? "Object",
      target,
      proxy,
    });
  }

  // ── Action tracking ───────────────────────────────────────────────────────

  private _trackAction(
    label: string,
    invoke: (...args: unknown[]) => unknown,
  ): unknown {
    const mutations: Mutation[] = [];
    const id = this._nextId++;
    const start = performance.now();

    // Point _pending at the mutations buffer for this action so the spy
    // handler knows where to write during the method's execution.
    this._pending = mutations;

    let result: unknown;
    try {
      result = invoke();
    } catch (err) {
      this._pending = null;
      this._commit(id, label, mutations, start);
      throw err;
    }

    // Async action: keep collecting until the Promise settles, then commit.
    if (result instanceof Promise) {
      return result.finally(() => {
        this._pending = null;
        this._commit(id, label, mutations, start);
      });
    }

    // Sync action: all mutations have fired synchronously — commit now.
    // _pending is cleared first so the spy ignores any reactions triggered
    // by the commit itself (e.g. a computed re-evaluating).
    this._pending = null;
    this._commit(id, label, mutations, start);
    return result;
  }

  /**
   * Add the completed action to the observable list in a single runInAction
   * so the overlay gets one re-render that already has all mutations in it.
   *
   * Critically, this must happen AFTER _pending is cleared and AFTER invoke()
   * has returned — otherwise the overlay could render before mutations are
   * collected (MobX fires reactions synchronously on observable changes).
   */
  private _commit(
    id: number,
    label: string,
    mutations: Mutation[],
    start: number,
  ) {
    runInAction(() => {
      this.actions.unshift({
        id,
        label,
        timestamp: Date.now(),
        duration: Math.round(performance.now() - start),
        mutations,
      });
      if (this.actions.length > 100) this.actions.length = 100;
    });
  }
}

export const devtoolsStore = new DevtoolsStore();

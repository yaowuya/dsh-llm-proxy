/**
 * Plugin-local external store for useSyncExternalStore. Callers publish new
 * snapshots instead of mutating values that consumers may still hold.
 */
export function createSnapshotStore<T>(initial: T) {
  let snapshot = initial
  const listeners = new Set<() => void>()

  return {
    getSnapshot: (): T => snapshot,
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    set: (next: T): void => {
      if (Object.is(snapshot, next)) return
      snapshot = next
      for (const listener of listeners) listener()
    },
  }
}

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSnapshotStore } from '../src/client/snapshot-store.ts'

test('snapshot references stay stable between replacements without changing the old snapshot', () => {
  const initial = { status: 'loading', writable: false }
  const store = createSnapshotStore(initial)
  const previous = store.getSnapshot()

  assert.strictEqual(store.getSnapshot(), previous)

  const ready = { status: 'ready', writable: true }
  store.set(ready)

  assert.strictEqual(store.getSnapshot(), ready)
  assert.strictEqual(store.getSnapshot(), store.getSnapshot())
  assert.notStrictEqual(store.getSnapshot(), previous)
  assert.deepEqual(previous, { status: 'loading', writable: false })
})

test('subscribers synchronously read the new snapshot when it is published', () => {
  const store = createSnapshotStore({ revision: 0 })
  const observed = []
  store.subscribe(() => observed.push(store.getSnapshot().revision))
  store.subscribe(() => observed.push(store.getSnapshot().revision))

  store.set({ revision: 1 })

  assert.deepEqual(observed, [1, 1])
})

test('unsubscribing stops notifications without removing other subscribers', () => {
  const store = createSnapshotStore({ revision: 0 })
  const first = []
  const second = []
  const unsubscribe = store.subscribe(() => first.push(store.getSnapshot().revision))
  store.subscribe(() => second.push(store.getSnapshot().revision))

  store.set({ revision: 1 })
  unsubscribe()
  unsubscribe()
  store.set({ revision: 2 })

  assert.deepEqual(first, [1])
  assert.deepEqual(second, [1, 2])
})

test('setting the current snapshot reference does not notify subscribers', () => {
  const initial = { revision: 0 }
  const store = createSnapshotStore(initial)
  let notifications = 0
  store.subscribe(() => notifications++)

  store.set(initial)
  assert.equal(notifications, 0)

  const next = { revision: 1 }
  store.set(next)
  store.set(next)
  assert.equal(notifications, 1)
})

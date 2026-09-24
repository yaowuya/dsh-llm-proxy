/**
 * Client page wiring check: drives the built bundle's apply() through a real
 * cordis context with the three services the host provides, then exercises the
 * field specs the controller hands the official form model.
 *
 * The host's own SettingsFormModel is not loaded here — it is a browser bundle
 * whose package ships its runtime deps undeclared, so pulling it into a node
 * test would mean installing them for reasons unrelated to this plugin. What
 * this test owns is the wiring and the specs, and the stub below implements
 * just enough of the SettingsFormScope contract to reach them.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { Context, Service } from '@deepseek-ai/cordis'

/** Records the specs the controller hands it, and stages through them. */
class StubFormModel {
  constructor(scope, specs) {
    this.scope = scope
    this.specs = new Map(specs.map((spec) => [spec.field, spec]))
    this.staged = new Map()
    this.disposed = false
  }
  shell() {
    return { available: this.scope.getSnapshot().status === 'ready', writable: this.scope.getSnapshot().writable, dirty: this.staged.size > 0, invalid: false, saving: false, failed: false }
  }
  field(field) {
    const staged = this.staged.get(field)
    if (staged === undefined) {
      return { text: this.specs.get(field).format(this.scope.getSnapshot().value?.[field]), overridden: false, invalid: false }
    }
    const write = staged.clear ? { kind: 'clear' } : this.specs.get(field).parse(staged.text)
    return { text: staged.text, overridden: write?.kind === 'set', invalid: write === undefined }
  }
  bind(project) {
    const store = { value: project(), getSnapshot() { return this.value }, subscribe: () => () => {} }
    store.value = project()
    return store
  }
  actions() {
    return {
      edit: (field, text) => { this.staged.set(field, { text, clear: false }) },
      resetField: (field) => { this.staged.set(field, { text: '', clear: true }) },
      save: () => {}, discard: () => { this.staged.clear() },
    }
  }
  dispose() { this.disposed = true }
}

let lastForm = null
const primitives = {
  SettingsFormModel: class extends StubFormModel {
    constructor(scope, specs) { super(scope, specs); lastForm = this }
  },
  SettingsForm: () => null,
  SettingsValueField: () => null,
}

/**
 * Bring a value back across the VM realm boundary. The bundle is evaluated in
 * its own context, so its arrays and objects carry that realm's prototypes and
 * would fail a deepStrictEqual prototype check despite matching structurally.
 */
const plain = (value) => JSON.parse(JSON.stringify(value))

/** Load the built bundle and return its plugin exports. */
function loadPlugin() {
  let entry
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  runInNewContext(source, {
    window: { __ModuleLoader__: { load(value) { entry = value } } },
  }, { filename: 'lib/client.js', timeout: 1000 })
  const table = new Map([
    ['react', {}],
    ['react/jsx-runtime', {}],
    ['@deepseek-ai/dsh-client-ui-primitives', primitives],
  ])
  return entry.factory((specifier) => {
    assert.ok(table.has(specifier), `require("${specifier}") missed the module table`)
    return table.get(specifier)
  })
}

/** A host-shaped cordis context, plus the handles the assertions need. */
function mountHost() {
  const registrations = []
  class LocaleService extends Service {
    constructor(ctx) { super(ctx, 'locale'); this.dict = undefined }
    register(ns, dict) { this.dict = dict; return () => {} }
    bind(ns) { return (key) => `${ns}.${key}=${this.dict.zh[key]}` }
  }
  class SlotsService extends Service {
    constructor(ctx) { super(ctx, 'slots') }
    // The real registry runs the registration once the slot it names is on
    // the ledger, and hands back the disposer that ends it. The Plugins page
    // declares plugins.item, so running it now is the case under test.
    inject(name, fn) { this.injected = { name, fn }; return fn() }
    register(options, Component) { registrations.push({ options, Component }); return () => {} }
  }
  class ConfigFormsService extends Service {
    constructor(ctx) {
      super(ctx, 'configForms')
      this.watched = undefined
      this.entryId = undefined
      this.served = new Set()
      this.snapshot = { status: 'ready', value: {}, base: {}, user: {}, writable: true, revision: 1 }
    }
    get(entryId) { this.entryId = entryId; return { ...snapshotFace(this.snapshot) } }
    /**
     * Mirror the host's own watch: the registration lives exactly while the
     * Host serves one of the watched namespaces, and is torn down when it
     * stops. `serve()` in the tests drives it.
     */
    whileServed(namespaces, register) {
      this.watched = namespaces
      let off
      this.sync = () => {
        const watched = namespaces.some((ns) => this.served.has(ns))
        if (watched && off === undefined) off = register(new Set(this.served))
        else if (!watched && off !== undefined) { off(); off = undefined }
      }
      this.sync()
      return () => { off?.(); off = undefined }
    }
  }
  const ctx = new Context()
  const locale = new LocaleService(ctx)
  const slots = new SlotsService(ctx)
  const configForms = new ConfigFormsService(ctx)
  return { ctx, locale, slots, configForms, registrations }
}

/** The read/write face SettingsFormScope requires, over a fixed snapshot. */
function snapshotFace(snapshot) {
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
    mutate: async () => true,
  }
}

test('apply registers the page into plugins.item while the Host serves the namespace', () => {
  const plugin = loadPlugin()
  const host = mountHost()
  plugin.apply(host.ctx)

  assert.equal(plugin.inject.length, 3)
  assert.deepEqual(Array.from(plugin.inject), ['slots', 'locale', 'configForms'])

  // Copy is registered under this plugin's own namespace.
  assert.equal(host.locale.dict.zh.title, '模型代理（dsh-llm-proxy）')

  // The page tracks the llm-proxy namespace, and the entry form it binds is
  // the Host's own for that same namespace.
  assert.deepEqual(plain(host.configForms.watched), ['llm-proxy'])
  assert.equal(host.configForms.entryId, 'llm-proxy')

  // Nothing registers until the Host says it serves the namespace.
  assert.equal(host.registrations.length, 0)
  host.configForms.served.add('llm-proxy')
  host.configForms.sync()

  assert.equal(host.registrations.length, 1)
  const { options, Component } = host.registrations[0]
  assert.equal(options.name, 'plugins.item')
  assert.equal(options.id, 'llm-proxy')
  assert.equal(options.order, 50)
  assert.equal(options.locale, 'settings.llm-proxy')
  assert.equal(options.label(), 'settings.llm-proxy.title=模型代理（dsh-llm-proxy）')
  assert.equal(typeof Component, 'function')

  // The inject face is what the renderer binds the card's props from.
  const face = options.inject()
  assert.equal(typeof face.hooks.llmProxyCard.getSnapshot, 'function')
  assert.equal(typeof face.save, 'function')
  assert.equal(typeof face.discard, 'function')
  assert.equal(typeof face.edit, 'function')
  assert.equal(typeof face.resetField, 'function')
  assert.equal(typeof face.listModels, 'function')
  assert.equal(typeof face.test, 'function')
  assert.equal(typeof face.select, 'function')
  assert.equal(typeof face.selection, 'function')
})

test('the page mounts no trace when the Host does not serve the namespace', () => {
  const plugin = loadPlugin()
  const host = mountHost()
  plugin.apply(host.ctx)
  host.configForms.served.add('some-other-plugin')
  host.configForms.sync()
  assert.equal(host.registrations.length, 0)
})

test('proxyHost refuses a blank draft instead of clearing the route target', () => {
  const scope = snapshotFace({ status: 'ready', value: { proxyHost: '10.0.0.1' }, base: {}, user: {}, writable: true, revision: 1 })
  buildController(scope)

  const spec = lastForm.specs.get('proxyHost')
  assert.equal(spec.format('10.0.0.1'), '10.0.0.1')
  assert.equal(spec.format(undefined), '')
  assert.deepEqual(plain(spec.parse('  10.0.0.2  ')), { kind: 'set', value: '10.0.0.2' })
  // A blank host is a rejected draft: it blocks the save, it does not unroute.
  assert.equal(spec.parse('   '), undefined)
})

test('numeric specs accept only whole numbers inside the field range', () => {
  buildController(snapshotFace({ status: 'ready', value: {}, base: {}, user: {}, writable: true, revision: 1 }))

  const port = lastForm.specs.get('proxyPort')
  assert.equal(port.format(7897), '7897')
  assert.equal(port.format(undefined), '')
  assert.deepEqual(plain(port.parse('8080')), { kind: 'set', value: 8080 })
  assert.deepEqual(plain(port.parse('')), { kind: 'clear' })
  for (const bad of ['0', '65536', '-1', '7.5', 'abc']) {
    assert.equal(port.parse(bad), undefined, `port accepted ${bad}`)
  }

  const retries = lastForm.specs.get('retries')
  assert.deepEqual(plain(retries.parse('10')), { kind: 'set', value: 10 })
  assert.equal(retries.parse('11'), undefined)

  const interval = lastForm.specs.get('retryIntervalMs')
  assert.deepEqual(plain(interval.parse('60000')), { kind: 'set', value: 60000 })
  assert.equal(interval.parse('60001'), undefined)
})

test('model lists round-trip through the newline-joined draft', () => {
  const stored = { proxiedModels: ['b.ai/flash', 'b.ai/vision'], multimodalModels: ['b.ai/vision'] }
  buildController(snapshotFace({ status: 'ready', value: stored, base: {}, user: {}, writable: true, revision: 1 }))

  const proxied = lastForm.specs.get('proxiedModels')
  assert.equal(proxied.format(stored.proxiedModels), 'b.ai/flash\nb.ai/vision')
  // A non-array value is treated as absent rather than stringified into the UI.
  assert.equal(proxied.format(undefined), '')
  assert.equal(proxied.format('nope'), '')
  assert.equal(proxied.format(['ok', 42]), 'ok')

  assert.deepEqual(plain(proxied.parse('b.ai/flash\n\n  b.ai/vision  ')), {
    kind: 'set', value: ['b.ai/flash', 'b.ai/vision'],
  })
  // An empty selection clears the field so it re-inherits the base layer.
  assert.deepEqual(plain(proxied.parse('  \n ')), { kind: 'clear' })

  assert.equal(lastForm.specs.get('multimodalModels').format(stored.multimodalModels), 'b.ai/vision')
})

test('every field the page surfaces is declared to the form', () => {
  buildController(snapshotFace({ status: 'ready', value: {}, base: {}, user: {}, writable: true, revision: 1 }))
  assert.deepEqual(
    plain([...lastForm.specs.keys()]),
    ['proxyHost', 'proxyPort', 'proxiedModels', 'multimodalModels', 'retries', 'retryIntervalMs'],
  )
})

/**
 * Build the controller the way index.ts does, against a fixed entry form.
 * The bundle only exports apply/inject, so the controller is reached the same
 * way the host reaches it: through apply, with configForms.get handing back
 * the scope under test and the slot machinery stubbed out.
 */
function buildController(scope) {
  const plugin = loadPlugin()
  const stub = {
    effect: (fn) => { fn(); return () => {} },
    locale: { register: () => () => {}, bind: () => (key) => key },
    slots: { inject: () => () => {}, register: () => () => {} },
    configForms: { get: () => scope, whileServed: () => () => {} },
  }
  plugin.apply(stub)
  return lastForm
}

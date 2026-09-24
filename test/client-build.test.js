/**
 * Client-bundle build check: verifies lib/client.js exists (run `npm run
 * build` first) and carries the loader handoff, the plugin id, the
 * plugins.item page registration and the apply/inject exports the shell
 * expects.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

test('client factory loads with only the host module table', () => {
  // Model the host boundary independently of the build's external allowlist.
  // The bundle only needs the primitives at load time; SettingsFormModel is
  // touched when a page mounts, not when the module is evaluated.
  const modules = new Map([
    ['react', {}],
    ['react/jsx-runtime', {}],
    ['@deepseek-ai/dsh-client-ui-primitives', {}],
  ])
  let entry
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  runInNewContext(source, {
    window: { __ModuleLoader__: { load(value) { entry = value } } },
  }, { filename: 'lib/client.js', timeout: 1000 })
  assert.equal(entry?.id, '@superfish058/dsh-llm-proxy')
  const plugin = entry.factory((specifier) => {
    assert.ok(modules.has(specifier), `client-modules: require("${specifier}") missed the module table`)
    return modules.get(specifier)
  })
  assert.equal(typeof plugin.apply, 'function')
  // Every name here must be a service the host actually provides. A name it
  // does not is a hard cordis gate, so the entry would sit pending forever
  // instead of failing loudly — the failure this bundle is built to avoid.
  assert.deepEqual(Array.from(plugin.inject), ['slots', 'locale', 'configForms'])
})

test('client bundle is built and well-formed', () => {
  const path = new URL('../lib/client.js', import.meta.url)
  assert.ok(existsSync(path), 'lib/client.js missing — run `npm run build` first')
  const source = readFileSync(path, 'utf8')
  assert.ok(source.includes('window.__ModuleLoader__.load'), 'loader handoff present')
  assert.ok(source.includes('"@superfish058/dsh-llm-proxy"'), 'scoped bundle id stamped')
  // The Plugins page is a LIST slot: entries are addressed by id and placed by
  // order, and it reads entry.options.id / entry.options.order.
  assert.ok(source.includes('"plugins.item"'), 'plugins.item page registration present')
  assert.ok(source.includes('"llm-proxy"'), 'page id present')
  assert.ok(source.includes('order: 50'), 'page order present')
  assert.ok(source.includes('configForms'), 'official configForms channel used')
  assert.ok(!source.includes('settingsScope'), 'retired settingsScope service is gone')
  assert.ok(!source.includes('settings.plugin.item'), 'retired slot name is gone')
  assert.ok(/exports\.apply\s*=/.test(source), 'apply exported')
  assert.ok(/exports\.inject\s*=/.test(source), 'inject exported')
})

test('client manifest is declared in package.json', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(pkg.dsh?.client, 'dsh.client manifest missing')
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.deepEqual(Array.from(pkg.dsh.client.inject), ['slots', 'locale', 'configForms'])
  assert.deepEqual(pkg.exports?.['./client'], './lib/client.js')
})

// Host-contract check: every service this plugin's client entry injects must
// actually be provided by the DSH build installed on this machine.
//
// This is the check that catches the class of bug this rewrite fixed: a
// service name in the static `inject` array is a hard cordis gate, so a name
// the host does not provide leaves the entry pending forever instead of
// failing loudly — "web boot: 1 entry did not activate" with no cause.
//
// Run against the DSH install's own client bundles plus the profile's, then
// compares the set against our declared inject list.
//
// Usage: node test/host-contract-check.mjs  (needs a DSH install)
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const DSH = join(homedir(), 'AppData/Roaming/npm/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai')
const PROFILE = join(homedir(), '.dsh/profiles/web/node_modules')

/** Every client bundle under a node_modules tree, deepest package wins. */
function collectClientBundles(root) {
  const found = []
  let entries
  try { entries = readdirSync(root, { withFileTypes: true }) } catch { return found }
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
    const dir = join(root, entry.name)
    if (entry.name.startsWith('@')) { found.push(...collectClientBundles(dir)); continue }
    for (const candidate of [join(dir, 'lib/client.js'), join(dir, 'client/client.js')]) {
      if (existsSync(candidate)) found.push(candidate)
    }
  }
  return found
}

const bundles = [...collectClientBundles(DSH), ...collectClientBundles(PROFILE)]
if (bundles.length === 0) {
  console.error('no DSH client bundles found — run this on a machine with DSH installed')
  process.exit(2)
}

/** Service names a bundle provides: `super(ctx, "name")` in a Service subclass. */
function providedBy(source) {
  return [...source.matchAll(/super\(\s*\w+\s*,\s*["'`]([^"'`]+)["'`]\s*\)/g)].map((m) => m[1])
}

/** Service names a bundle declares it needs, across every inject array. */
function requiredBy(source) {
  return [...source.matchAll(/inject\s*=\s*\[([^\]]*)\]/g)]
    .flatMap((m) => [...m[1].matchAll(/["']([^"']+)["']/g)].map((n) => n[1]))
}

const provided = new Set()
const required = new Set()
for (const path of bundles) {
  const source = readFileSync(path, 'utf8')
  for (const name of providedBy(source)) provided.add(name)
  for (const name of requiredBy(source)) required.add(name)
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const ours = pkg.dsh.client.inject

console.log(`host bundles scanned: ${bundles.length}`)
console.log(`host services provided: ${provided.size}`)
console.log(`our inject: ${JSON.stringify(ours)}`)
console.log()

let fail = false
for (const name of ours) {
  // A service the host neither provides nor itself requires is the failure
  // mode: nothing will ever satisfy the gate.
  const ok = provided.has(name) || required.has(name)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : ' — provided by no host bundle'}`)
  if (!ok) fail = true
}

// The retired name is the one that caused the outage; keep it out loudly.
if (ours.includes('settingsScope')) {
  console.log('FAIL  settingsScope is injected again — the host does not provide it')
  fail = true
}

process.exit(fail ? 1 : 0)

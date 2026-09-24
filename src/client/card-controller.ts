/**
 * The 模型代理 page's controller — the browser half of the llm-proxy settings
 * surface.
 *
 * The Host is the settings authority. `configForms.get(entryId)` hands this
 * page the official entry form for the `llm-proxy` namespace, and
 * `SettingsFormModel` on top of it owns everything a settings page has to get
 * right: staging drafts, the revision-fenced write, the reset-to-composition
 * gesture, and refusing a save whose drafts the field specs reject. Nothing
 * here writes settings directly — the file only projects that form's state for
 * the card and answers the two questions the browser structurally cannot.
 *
 * Those two are host-side operations, not settings: the selectable model list
 * is resolved against the Host's provider registries, and one connection probe
 * has to ride this package's global dispatcher with the Authorization header
 * assembled server-side. Both ride this package's loopback bridge.
 */
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type {
  SettingsFieldSpec,
  SettingsFieldState,
  SettingsFormActions,
  SettingsFormScope,
  SettingsFormShell,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { SettingsFormModel } from '@deepseek-ai/dsh-client-ui-primitives'

/** Settings namespace owned by the plugin (mirrors lib/settings.js). */
export const LLM_PROXY_NAMESPACE = 'llm-proxy'

/** Bridge route prefix (same-origin, loopback-only). */
const SETTINGS_BRIDGE_PREFIX = '/api/dsh-llm-proxy/settings'

/** The two section fields holding a model selection. */
export type ModelListField = 'proxiedModels' | 'multimodalModels'

/** The `llm-proxy` section this page edits. */
export interface ProxySettings {
  /** Proxy hostname/IP; blank inherits the schema default. */
  proxyHost?: string
  /** Proxy port (1–65535). */
  proxyPort?: number
  /** Model keys routed through the proxy, `<providerId>/<modelId>`. */
  proxiedModels?: string[]
  /** Model keys advertised as accepting image input. */
  multimodalModels?: string[]
  /** Max retry attempts on a failed request. */
  retries?: number
  /** Milliseconds between retry attempts. */
  retryIntervalMs?: number
}

/** One selectable model row (host bridge `/models`). */
export interface ProxyModelRow {
  key: string
  providerId: string
  modelId: string
  name: string
  providerLabel: string
  host: string
  inputModalities: string[]
}

/** One connection-test outcome (host bridge `/test`). */
export interface TestResult {
  key: string
  ok: boolean
  status?: number
  latencyMs?: number
  viaProxy?: boolean
  multimodal?: boolean
  code?: string
  message?: string
}

/** What the page renders: the form's own state plus one projection per field. */
export interface LlmProxyCardState extends SettingsFormShell {
  proxyHost: SettingsFieldState
  proxyPort: SettingsFieldState
  proxiedModels: SettingsFieldState
  multimodalModels: SettingsFieldState
  retries: SettingsFieldState
  retryIntervalMs: SettingsFieldState
}

/** The registration-side face the page's slot entry injects. */
export interface LlmProxyCardFace extends SettingsFormActions {
  hooks: {
    /** Page snapshot bound by the renderer as useLlmProxyCard. */
    llmProxyCard: SnapshotStore<LlmProxyCardState>
  }
  /** The Host's selectable model list; empty when the bridge is unreachable. */
  listModels: () => Promise<ProxyModelRow[]>
  /** Probe one model key against the saved routing. */
  test: (key: string) => Promise<TestResult>
  /** Stage a new selection for one of the two model-list fields. */
  select: (field: ModelListField, keys: string[]) => void
  /** The model keys one list field currently stages. */
  selection: (field: ModelListField) => string[]
}

/** One bridge RPC result envelope. */
interface BridgeResult {
  ok: boolean
  value?: unknown
  code?: string
  message?: string
}

/**
 * Read the model-key list a section field carries. A non-array, or a list
 * with a non-string member, is treated as absent rather than trusted: the Host
 * is the authority, but a half-valid list would render as a stringified mess.
 */
function modelKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

/** The draft text for a model selection, and the selection it parses back to. */
const joinKeys = (keys: string[]): string => keys.join('\n')
const splitKeys = (text: string): string[] =>
  text.split('\n').map((line) => line.trim()).filter((line) => line !== '')

/**
 * A whole-number field with the page's own range. `parse` returning undefined
 * is what blocks the save: the form keeps the draft staged and shows the field
 * as invalid, so the user corrects it instead of retyping.
 */
function rangedNumberField(field: string, min: number, max: number): SettingsFieldSpec {
  return {
    field,
    format: (value) => (typeof value === 'number' && Number.isFinite(value) ? String(value) : ''),
    parse: (text) => {
      const trimmed = text.trim()
      if (trimmed === '') return { kind: 'clear' }
      if (!/^\d+$/.test(trimmed)) return undefined
      const parsed = Number(trimmed)
      if (parsed < min || parsed > max) return undefined
      return { kind: 'set', value: parsed }
    },
  }
}

/**
 * The proxy host. A blank draft is rejected rather than cleared: clearing the
 * host would leave the plugin with nowhere to route, and the schema default
 * (`127.0.0.1`) is reached through the reset control instead.
 */
const proxyHostField: SettingsFieldSpec = {
  field: 'proxyHost',
  format: (value) => (typeof value === 'string' ? value : ''),
  parse: (text) => {
    const trimmed = text.trim()
    if (trimmed === '') return undefined
    return { kind: 'set', value: trimmed }
  },
}

/**
 * A model-key list. The staged draft is the selection joined by newlines: the
 * multi-select writes it back through `select`, and the join/split round trip
 * is lossless because a model key never contains a newline.
 */
function modelListField(field: ModelListField): SettingsFieldSpec {
  return {
    field,
    format: (value) => joinKeys(modelKeys(value)),
    parse: (text) => {
      const keys = splitKeys(text)
      return keys.length === 0 ? { kind: 'clear' } : { kind: 'set', value: keys }
    },
  }
}

/** Every field spec the page stages, in save order. */
const FIELD_SPECS: SettingsFieldSpec[] = [
  proxyHostField,
  rangedNumberField('proxyPort', 1, 65535),
  modelListField('proxiedModels'),
  modelListField('multimodalModels'),
  rangedNumberField('retries', 0, 10),
  rangedNumberField('retryIntervalMs', 0, 60000),
]

/** Post one call to the loopback bridge. */
async function callBridge<T>(fetchFn: typeof fetch, path: string, body: unknown): Promise<T | null> {
  try {
    const response = await fetchFn(SETTINGS_BRIDGE_PREFIX + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) return null
    const parsed: unknown = await response.json()
    if (typeof parsed !== 'object' || parsed === null) return null
    const result = parsed as BridgeResult
    return result.ok ? (result.value as T) : null
  } catch {
    return null
  }
}

/** Fetch the selectable model list from the host bridge. */
async function fetchModels(fetchFn: typeof fetch): Promise<ProxyModelRow[]> {
  const value = await callBridge<{ models?: unknown }>(fetchFn, '/models', {})
  if (value === null || !Array.isArray(value.models)) return []
  return value.models.filter((row): row is ProxyModelRow => (
    typeof row === 'object' && row !== null
    && typeof (row as ProxyModelRow).key === 'string'
    && typeof (row as ProxyModelRow).name === 'string'
  ))
}

/** Probe one model key from the host (rides the proxy routing + retry). */
async function probeModel(fetchFn: typeof fetch, key: string): Promise<TestResult> {
  const result = await callBridge<TestResult>(fetchFn, '/test', { key })
  if (result === null) {
    return { key, ok: false, code: 'internal', message: 'settings bridge unreachable' }
  }
  return result
}

/**
 * Bridges the Host's `llm-proxy` entry form and this package's loopback bridge
 * onto the 模型代理 page.
 */
export class LlmProxyCardController {
  private readonly form: SettingsFormModel<ProxySettings>
  private readonly actions: SettingsFormActions
  private readonly store: SnapshotStore<LlmProxyCardState>
  private readonly fetchFn: typeof fetch
  private readonly face: LlmProxyCardFace

  /**
   * @param scope - the Host's entry form for the `llm-proxy` namespace.
   * @param fetchFn - the page's fetch, for the two host-side bridge calls.
   */
  constructor(scope: SettingsFormScope<ProxySettings>, fetchFn: typeof fetch) {
    this.fetchFn = fetchFn
    this.form = new SettingsFormModel(scope, FIELD_SPECS)
    this.actions = this.form.actions()
    this.store = this.form.bind(() => this.projection())
    this.face = {
      hooks: { llmProxyCard: this.store },
      ...this.actions,
      listModels: () => fetchModels(this.fetchFn),
      test: (key) => probeModel(this.fetchFn, key),
      select: (field, keys) => { this.actions.edit(field, joinKeys(keys)) },
      selection: (field) => splitKeys(this.form.field(field).text),
    }
  }

  private projection(): LlmProxyCardState {
    return {
      ...this.form.shell(),
      proxyHost: this.form.field('proxyHost'),
      proxyPort: this.form.field('proxyPort'),
      proxiedModels: this.form.field('proxiedModels'),
      multimodalModels: this.form.field('multimodalModels'),
      retries: this.form.field('retries'),
      retryIntervalMs: this.form.field('retryIntervalMs'),
    }
  }

  /**
   * Build the face the page's slot registration injects.
   * @returns the page's snapshot, the form's actions, and the bridge calls.
   */
  inject(): LlmProxyCardFace {
    return this.face
  }

  /** Release the form's subscription to the entry form. */
  dispose(): void {
    this.form.dispose()
  }
}

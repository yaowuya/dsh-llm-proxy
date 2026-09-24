/**
 * 模型代理 plugin page: the form behind 设置 → 插件 → 模型代理, registered into
 * the Plugins page's `plugins.item` slot (declared by
 * @deepseek-ai/dsh-client-ui-plugin-manager) while the Host serves the
 * `llm-proxy` namespace.
 *
 * The Plugins page owns the title, the one-liner and the expand/collapse, so
 * this component only answers the two views it is asked for: a `summary` line
 * in the list, and the `page` body once the card is opened.
 *
 * Every control stages a draft; nothing writes until the form's save does. The
 * proxy endpoint and the retry policy use the official value fields, while the
 * two model lists keep their own multi-select and per-row connection probe —
 * those answers come from the Host over this package's loopback bridge.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { SettingsForm, SettingsValueField } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the plugin-manager SlotMap merge (the 'plugins.item' entry
// the Plugins page declares at runtime).
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type { LlmProxyCardFace, LlmProxyCardState, ProxyModelRow, TestResult } from './card-controller.ts'
import type { en } from './locales.ts'
import styles from './proxy-model.module.css'

/** Copy of the page, bound to this plugin's dictionary. */
type T = (key: keyof typeof en) => string

/** Props delivered by the slot outlet (inject face spread flat). */
export type ProxyModelCardProps =
  PropsRuntime<'plugins.item'>
  & PropsLocale<'settings.llm-proxy'>
  & InjectFace<LlmProxyCardFace>

/** Schema defaults mirrored from lib/index.js, shown as placeholders. */
const DEFAULTS = {
  proxyHost: '127.0.0.1',
  proxyPort: 7897,
  retries: 3,
  retryIntervalMs: 1000,
} as const

/**
 * Display label for a model row: `[厂商] 模型名`. The vendor prefix is dropped
 * when the model name already carries it (e.g. B.AI names are already
 * "deepseek-v4-flash（B.AI）", so the bracketed prefix would just repeat it).
 */
function rowLabel(row: ProxyModelRow): string {
  return row.providerLabel !== '' && !row.name.includes(row.providerLabel)
    ? `[${row.providerLabel}] ${row.name}`
    : row.name
}

/** One labeled value field, wired to the form's staged state. */
function ValueField(props: {
  id: string
  label: string
  hint: string
  field: LlmProxyCardState[keyof Pick<LlmProxyCardState, 'proxyHost' | 'proxyPort' | 'retries' | 'retryIntervalMs'>]
  disabled: boolean
  numeric?: boolean
  placeholder?: string
  t: T
  onEdit: (text: string) => void
  onReset: () => void
}): ReactNode {
  const { id, label, hint, field, disabled, numeric, placeholder, t, onEdit, onReset } = props
  return (
    <SettingsValueField
      id={id}
      label={label}
      hint={hint}
      text={field.text}
      overridden={field.overridden}
      invalid={field.invalid}
      overriddenLabel={t('overridden')}
      resetLabel={t('reset')}
      invalidLabel={t('invalidRange')}
      disabled={disabled}
      numeric={numeric}
      placeholder={placeholder}
      onEdit={onEdit}
      onReset={onReset}
    />
  )
}

/** The two model sections share one shape: a label, a selection, an add list. */
function ModelSection(props: {
  id: string
  label: string
  hint: string
  selected: string[]
  models: ProxyModelRow[]
  modelsFailed: boolean
  t: T
  /** The test bar and its per-row probe are only worth it for proxied models. */
  testable?: boolean
  onSelect: (keys: string[]) => void
  onTest: (key: string) => void
  testingKey: string | null
  testResults: Record<string, TestResult>
}): ReactNode {
  const {
    id, label, hint, selected, models, modelsFailed, t,
    testable = false, onSelect, onTest, testingKey, testResults,
  } = props
  const rowOf = (key: string): ProxyModelRow | undefined => models.find((m) => m.key === key)
  const options = models.filter((row) => !selected.includes(row.key))

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldHint}>{hint}</span>
      {modelsFailed
        ? <p className={styles.status}>{t('formUnavailable')}</p>
        : models.length === 0
          ? <p className={styles.status}>{t('formUnavailable')}</p>
          : (
            <ul className={styles.rowList}>
              {selected.map((key) => {
                const row = rowOf(key)
                const result = testResults[key]
                return (
                  <li key={key} className={styles.rowWrap}>
                    <div className={styles.row}>
                      <span className={styles.rowLabel}>{row ? rowLabel(row) : key}</span>
                      {testable && (
                        <button
                          type="button"
                          className={styles.rowTest}
                          data-testid="test-proxied-model"
                          disabled={testingKey !== null}
                          onClick={() => { void onTest(key) }}
                        >
                          {testingKey === key ? t('testing') : t('test')}
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.rowRemove}
                        data-testid="remove-model"
                        onClick={() => { onSelect(selected.filter((k) => k !== key)) }}
                      >
                        {t('remove')}
                      </button>
                    </div>
                    {result !== undefined && (
                      <span
                        className={`${styles.testResult} ${result.ok ? styles.testResultOk : styles.testResultError}`}
                        data-testid="test-proxied-result"
                      >
                        {result.ok ? '✓ ' : '✗ '}{result.ok ? t('testOk') : t('testFail')}
                        {result.ok ? formatTestDetail(result, t) : `：${result.message ?? result.code ?? ''}`}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
      <select
        className={styles.select}
        data-testid={`add-${id}-model`}
        value=""
        disabled={models.length === 0}
        onChange={(event) => {
          if (event.target.value === '') return
          onSelect([...selected, event.target.value])
          event.target.value = ''
        }}
      >
        <option value="">{t('selectModel')}</option>
        {options.map((row) => (
          <option key={row.key} value={row.key}>
            {rowLabel(row)}
            {row.inputModalities.includes('image') ? `（${t('multimodalBadge')}）` : ''}
          </option>
        ))}
      </select>
      {testable && selected.length > 0 && (
        <span className={styles.testBarHint}>{t('testBarHint')}</span>
      )}
    </div>
  )
}

/** One-line test detail: `· 200 · 38ms · 经代理 · 多模态已开启`. */
function formatTestDetail(result: TestResult, t: T): string {
  const parts: string[] = []
  if (typeof result.status === 'number') parts.push(String(result.status))
  if (typeof result.latencyMs === 'number') parts.push(`${result.latencyMs}ms`)
  parts.push(result.viaProxy ? t('testViaProxy') : t('testDirect'))
  if (result.multimodal) parts.push(t('testMultimodalOn'))
  return parts.length > 0 ? ` · ${parts.join(' · ')}` : ''
}

/** The page body: the whole form, with the official frame's save. */
function CardBody(props: ProxyModelCardProps): ReactNode {
  const { t, useLlmProxyCard, listModels, test, select, selection, edit, resetField } = props
  const state = useLlmProxyCard((snapshot) => snapshot)
  const [models, setModels] = useState<ProxyModelRow[]>([])
  const [modelsFailed, setModelsFailed] = useState(false)
  const [testingKey, setTestingKey] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})

  // The selectable list is Host state the bridge answers for; it does not
  // change with the form, so one fetch per page mount is enough.
  useEffect(() => {
    let cancelled = false
    void listModels().then((rows) => {
      if (cancelled) return
      setModels(rows)
      setModelsFailed(rows.length === 0)
    })
    return () => { cancelled = true }
  }, [listModels])

  const handleTest = async (key: string): Promise<void> => {
    setTestingKey(key)
    const result = await test(key)
    setTestResults((previous) => ({ ...previous, [key]: result }))
    setTestingKey(null)
  }

  const disabled = !state.writable

  return (
    <SettingsForm
      labels={{
        unavailable: t('formUnavailable'),
        readOnly: t('formReadOnly'),
        saveFailed: t('formSaveFailed'),
        save: t('formSave'),
        saving: t('formSaving'),
      }}
      state={state}
      onSave={props.save}
      onDiscard={props.discard}
    >
      <div className={styles.fieldRow}>
        <ValueField
          id="plugin-config-llm-proxy-host"
          label={t('fieldProxyHost')}
          hint={t('fieldProxyHostHint')}
          field={state.proxyHost}
          disabled={disabled}
          placeholder={DEFAULTS.proxyHost}
          t={t}
          onEdit={(text) => { edit('proxyHost', text) }}
          onReset={() => { resetField('proxyHost') }}
        />
        <ValueField
          id="plugin-config-llm-proxy-port"
          label={t('fieldProxyPort')}
          hint={t('fieldProxyPortHint')}
          field={state.proxyPort}
          disabled={disabled}
          numeric
          placeholder={String(DEFAULTS.proxyPort)}
          t={t}
          onEdit={(text) => { edit('proxyPort', text) }}
          onReset={() => { resetField('proxyPort') }}
        />
      </div>

      <ModelSection
        id="proxied"
        label={t('fieldProxiedModels')}
        hint={t('fieldProxiedModelsHint')}
        selected={selection('proxiedModels')}
        models={models}
        modelsFailed={modelsFailed}
        testingKey={testingKey}
        testResults={testResults}
        testable
        t={t}
        onSelect={(keys) => { select('proxiedModels', keys) }}
        onTest={(key) => { void handleTest(key) }}
      />

      <ModelSection
        id="multimodal"
        label={t('fieldMultimodalModels')}
        hint={t('fieldMultimodalModelsHint')}
        selected={selection('multimodalModels')}
        models={models}
        modelsFailed={modelsFailed}
        testingKey={testingKey}
        testResults={testResults}
        t={t}
        onSelect={(keys) => { select('multimodalModels', keys) }}
        onTest={(key) => { void handleTest(key) }}
      />

      <div className={styles.fieldRow}>
        <ValueField
          id="plugin-config-llm-proxy-retries"
          label={t('fieldRetries')}
          hint={t('fieldRetriesHint')}
          field={state.retries}
          disabled={disabled}
          numeric
          placeholder={String(DEFAULTS.retries)}
          t={t}
          onEdit={(text) => { edit('retries', text) }}
          onReset={() => { resetField('retries') }}
        />
        <ValueField
          id="plugin-config-llm-proxy-retry-interval"
          label={t('fieldRetryIntervalMs')}
          hint={t('fieldRetryIntervalMsHint')}
          field={state.retryIntervalMs}
          disabled={disabled}
          numeric
          placeholder={String(DEFAULTS.retryIntervalMs)}
          t={t}
          onEdit={(text) => { edit('retryIntervalMs', text) }}
          onReset={() => { resetField('retryIntervalMs') }}
        />
      </div>
    </SettingsForm>
  )
}

/**
 * The 模型代理 page as the Plugins page asks for it: the one-liner in the
 * plugin list, and the settings form once the card is opened.
 */
export function ProxyModelCard(props: ProxyModelCardProps): ReactNode {
  const { view, t, useLlmProxyCard } = props
  if (view === 'summary') return t('description')
  if (useLlmProxyCard === undefined || t === undefined) return null
  return <CardBody {...props} />
}

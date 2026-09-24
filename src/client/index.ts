/**
 * dsh-llm-proxy — browser half. Registers the 模型代理 page inside 设置 → 插件
 * via the `plugins.item` slot (declared at runtime by
 * @deepseek-ai/dsh-client-ui-plugin-manager), whose card shows the configurable
 * proxy-model form. Settings ride the Host's official `configForms` entry form
 * for the `llm-proxy` namespace, so the Host stays the authority on what it
 * stores; the model list and the connection probe answer over this package's
 * loopback bridge, because both need the Host's provider registry and the
 * global dispatcher the browser has no access to.
 *
 * The page mounts only while the Host serves its namespace: a deployment that
 * never composes this plugin shows no trace of the page (see
 * `configForms.whileServed`).
 *
 * Export discipline: cross-plugin collaboration goes through cordis services
 * (`slots`, `locale`, `configForms`); the bundle purity gate forbids value
 * imports of other @deepseek-ai packages.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the ui-settings Context merge (ctx.configForms).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the renderer Context merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls the plugin-manager SlotMap merge (the 'plugins.item' entry
// the Plugins page declares at runtime).
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { ProxyModelCard } from './ProxyModelCard.tsx'
import type { ProxyModelCardProps } from './ProxyModelCard.tsx'
import { LLM_PROXY_NAMESPACE, LlmProxyCardController } from './card-controller.ts'
import { en, zh, type ProxyKey } from './locales.ts'

export type { ProxyModelCardProps } from './ProxyModelCard.tsx'
export type { ProxyKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The 模型代理 page copy. */
    'settings.llm-proxy': ProxyKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'settings.llm-proxy'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'configForms']

/**
 * Register the 模型代理 page once the Host serves the llm-proxy namespace, and
 * bind it to the official entry form.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-llm-proxy: copy dictionaries')

  const controller = new LlmProxyCardController(
    ctx.configForms.get(LLM_PROXY_NAMESPACE),
    (input, init) => fetch(input, init),
  )
  ctx.effect(() => () => controller.dispose(), 'dsh-llm-proxy: entry form subscription')

  const face = controller.inject()
  ctx.effect(() => ctx.configForms.whileServed([LLM_PROXY_NAMESPACE], () => (
    ctx.slots.inject('plugins.item', () => ctx.slots.register({
      name: 'plugins.item',
      // The Plugins page is a list slot: an entry is addressed by its id and
      // placed by its order (the official pages occupy 10/20/30/40).
      id: 'llm-proxy',
      order: 50,
      // Registration-time copy and the page share one bound translate; copy
      // freshness rides the locale revision.
      label: () => ctx.locale.bind(NS)('title'),
      locale: NS,
      inject: () => face,
    }, ProxyModelCard))
  )), 'dsh-llm-proxy: page')
}

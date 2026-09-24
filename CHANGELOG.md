# Changelog

## v1.2.1 (2026-09-24)

- **修复设置页看不到「模型代理」卡片**：宿主 DSH `0.1.7-rc.1` 改了设置契约，而插件宿主半边还停在旧契约，导致 `llm-proxy` 命名空间从未出现在 `settings.describe()` 里——客户端表单恒为 `unavailable`，`configForms.whileServed` 永不触发，卡片不注册。实测：`describe()` 返回 17–20 个命名空间（含第三方插件的 `codex-subscription` / `ui-git-graph` / `web-ui-pet`），唯独没有 `llm-proxy`。
  - **`Config` 字段标记 `.volatile()`**：`SettingsForms.describe()` 会把每个 entry 过一遍 `volatileForm(schema)`，只保留 volatile 子树。旧 Config 六个字段全是裸 schema，整个 form 被过滤成空，entry 直接被跳过。官方插件同理（`dsh-agent-loop` 的 `maxParallelToolCalls` 等）。
  - **改用新的 seam**：`ctx.settings.register()` 在新版本已不存在（现为 `configure` / `update` / `mutate` / `describe`，按 profile entry id 寻址）。新增 `settingsScopeFor()`，把 `describe()` + `settings/document-updated` 投影成插件既有的 `{ get, watch }` 接口，下游 live-apply 逻辑不变。
  - **`plainConfig()` 剥离 volatile 包装**：标记 volatile 后字段不再是裸值，而是 cosmokit wrapper；cordis 原样传给 `apply`，故入口处统一读穿（语义与宿主 `plainConfig` 一致）。
- 测试：假 seam 全部改为新契约（移除 `register`），新增 volatile 标记断言与「外部命名空间不触发重装」用例；69 个用例全绿。

## v1.2.0 (2026-09-24)

- **修复插件在 web 启动时挂起**：`pending (waiting for service: settingsScope)` / `web boot: 1 entry did not activate`。根因是客户端半边按 `@deepseek-ai/dsh-client-*@0.1.0-rc.7` 的契约构建，而宿主 DSH `0.1.7-rc.1` 提供的是另一条包线——它的 70 个客户端插件没有一个注册 `settingsScope`（整个安装目录 grep 命中 0）。静态 `inject` 是 Cordis 硬门禁，服务永不出现时 `apply()` 永远不会被调用。同宿主的 `dshmarket` / `dsh-codex-subscription` 同样需要该服务但都不放进静态 inject（用 `ctx.inject([...], cb)` 软注入），所以它们正常启动。
- **对齐宿主设置契约**：客户端构建依赖 `@deepseek-ai/dsh-client-*` 由 `0.1.0-rc.7` 升至 `0.1.7-rc.1`；设置读写改走官方 `configForms.get('llm-proxy')` 入口表单（`SettingsFormModel` 负责暂存、revision 围栏写入、恢复默认、非法草稿拦截），删除 `LlmProxySettingsBinder` 及其「官方 scope + loopback bridge 二选一」兼容层。
- **对齐槽位契约**：页面由 `settings.plugin.item`（keyed，需 `key`）改为 `plugins.item`（list，需 `id` + `order: 50`），并用 `configForms.whileServed` 包裹——宿主不再服务该命名空间时页面不留下任何痕迹。
- **卡片重写**：宿主插件页自带标题、摘要与展开/收起，卡片只负责 `summary` 一行与 `page` 表单；代理地址/端口/重试策略改用官方 `SettingsValueField` + `SettingsForm` 框架，两个模型多选与逐行「测试连接」保留自有 UI，但暂存与保存沿用官方表单。
- **保留桥接的只剩两条**：`/models` 与 `/test` 需要宿主的 provider 注册表与全局 dispatcher，浏览器做不了；`/describe`、`/mutate` 客户端不再调用（宿主侧路由暂留，无风险）。
- 客户端 bundle 由 46.9 kB 降到 26.9 kB，外部依赖收敛为 `react` / `react/jsx-runtime` / `@deepseek-ai/dsh-client-ui-primitives`。
- 新增测试 `test/client-page.test.js`（6 个用例：注册接线、`whileServed` 行为、各字段 format/parse 边界）与 `test/host-contract-check.mjs`（校验本插件 inject 的每个服务名确实由宿主提供——即本次故障的回归护栏）。

## v1.1.0 (2026-08-24)

- **测试连接**：走代理的模型列表每行新增「测试连接」按钮。宿主侧新增 loopback 桥接端点 `POST /api/dsh-llm-proxy/settings/test`，对被勾选模型发一个最小 `chat/completions` 探测请求（走插件自己的全局 dispatcher，即真实代理路径），返回 HTTP 状态 / 耗时 / 是否经代理 / 多模态是否开启；网络超时、认证失败、限流、服务端错误都有明确提示（`lib/connection-test.js`）。
- 凭据不出宿主机：探测请求的 `Authorization` 头在宿主侧组装，卡片只收到结构化结果字段。
- 客户端卡片每行显示 ✓ 连接成功（状态 · 耗时 · 经代理/直连 · 多模态）或 ✗ 连接失败（原因），新增 zh/en 文案与样式。
- **测试连接可靠性修复**：
  - `findTestTarget` 改为基于 `listModels` 匹配，设置卡 UI 能勾选的模型测试必然可解析；`llm-deepseek` 为空文档（`llm-deepseek: {}`）时回退官方内置目录（默认 `https://api.deepseek.com` + `DEEPSEEK_API_KEY`），官方 DeepSeek 模型不再报「未找到模型」。
  - 测试失败时读取并脱敏显示提供方响应 body（截断 2KB），HTTP 400/401/… 直接给出真实原因而不是只有状态码。
  - 探测请求 `max_tokens` 从 1 调整为 8：B.AI 等提供方要求 `max_tokens > 2`，旧值会返回 HTTP 400。
  - 新增 `lib/deepseek-official.js` 共享 llm-deepseek 官方默认（baseURL / apiKeyEnv / 内置模型目录），`listModels` / `findTestTarget` / `resolveProxyHosts` 三处统一回退。
  - 设置卡文案精简：测试连接提示（小字，注明「走已保存配置、改勾选后先保存」）、走代理按 API 地址整组生效、多模态说明。
- 新增测试 `test/connection-test.test.js`（19 个用例）。

## v1.0.9 (2026-08-24)

- **多模态模型镜像**：新增设置项 `multimodalModels`。用户在设置卡「多模态模型」区勾选模型后，宿主侧 `syncMultimodal()` 会把 `[text, image]` 镜像写进所属 provider 命名空间（`llm-pi-ai` 的 `models[].input` 或目录型 `modelOverrides[].input`；`llm-deepseek` 的 `models[].inputModalities`），取消勾选自动还原官方默认；已声明为文本的模型发图不再被 `UNSUPPORTED_CONTENT` 拒绝（对应 B.AI / 官方识图模型）。
- 客户端卡片新增「多模态模型」区（`ProxyModelCard.tsx`）+ zh/en 文案 + 🖼 多模态徽章。
- **深色模式保存按钮修复**：主按钮文字色改用 DSH 官方主按钮一致的 `--dsw-alias-label-primary-foreground`（替换此前会让深色下偏灰的 `--dsw-alias-label-primary-inverted`），深色下文字从混浊的 `#353638` 修正为清晰近黑 `#0f1115`，与平台标准完全一致。
- **设置卡「一直加载中」修复**：`LlmProxySettingsBinder` 兼容层此前只在官方 scope 报告 `unavailable` 时才启动桥接兜底，且 `project()` 会把「官方仍 loading」直接透出——一旦官方 describe 镜像没有沉降出本命名空间的视图，卡片会永久停在「加载中」，即使桥接已经 `ready`。现改为只要官方不是 `ready` 就启动桥接，并在取值时优先任意已 `ready` 的来源（官方 → 桥接），构建时也先 `publish()` 一次，避免卡在初始 loading。
- 原生 `<select>/<input>` 深色模式修复（`color-scheme` + `body[data-ds-dark-theme]` 兜底）。
- 新增测试 `test/multimodal-mirror.test.js`（5 个用例）。

## v1.0.8 (2026-08-21)

- **深色模式修复**：客户端卡片 CSS 用了 7 个主题不存在的别名变量（`--dsw-alias-line-default` / `line-strong` / `accent-default` / `accent-strong` / `bg-subtle` / `danger-default` / `success-default`），深色模式下全部回退浅色硬编码，导致按钮文字浅色+浅底不可读、边框浅色刺眼；已替换为主题真实存在的变量（`border-l2` / `border-l3` / `state-business-primary` / `state-error-primary` / `state-success-primary` / `button-primary-fill` / `button-primary-hover` / `bg-layer-2`），主按钮文字色改用 `--dsw-alias-label-primary-inverted`（浅色=白字，深色=深灰字）

## v1.0.7 (2026-08-19)

- **rc.7 兼容修复**：官方 `settings.plugin.item` 槽位由 `list`（要求 `id`）改为 `keyed`（要求 `key`），注册参数同步改为 `key: 'llm-proxy'`，修复 rc.7 上「Failed to load plugins … keyed slot requires options.key」
- 构建依赖（`dsh-settings` / `dsh-client-*`）升至 `0.1.0-rc.7`，类型声明与 rc.7 运行时一致

## v1.0.6 (2026-08-19)

- 客户端卡片文案字典与官方 `settings.plugins` 规范对齐（小版本直发，未单独记录）

## v1.0.5 (2026-08-19)

- 客户端卡片文案字典与官方 `settings.plugins` 规范对齐（小版本直发，未单独记录）

## v1.0.4 (2026-08-19)

- npm 发布元数据：新增 `repository` / `publishConfig.access=public` / `author` / `homepage` / `bugs`
- README 新增 npm 安装方式（`dsh plugin add @superfish058/dsh-llm-proxy`）
- 新增 GitHub Actions CI（build + test）

## v1.0.3 (2026-08-19)

- pi-ai 目录回退：只配了 `apiKeyEnv`、未写 `models` 的 provider（如 `xiaomi`），模型列表从 pi-ai 内置目录补齐，与官方模型选择器同步
- retryPolicy 镜像：卡片 `retries`/`retryIntervalMs` 镜像进选中 provider 官方 `retryPolicy`，取消勾选自动还原

## v1.0.2 (2026-08-18)

- 冷启动 provider 命名空间未注册时的退避重试，不再需要手动「恢复默认再保存」

## v1.0.1 (2026-08-18)

- 客户端 bundle id 作用域化；精简中文 README

## v1.0.0 (2026-08-18)

- 首版：按模型走代理（Clash 等）+ 失败自动重试，设置页实时生效

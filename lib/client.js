window.__ModuleLoader__.load({
	id: "@superfish058/dsh-llm-proxy",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:D:\01-code\dsh-llm-proxy\src\client\proxy-model.module.css.mjs
		const css = ".mwOVfa_status{color:var(--dsw-alias-label-tertiary,#6b7280);margin:4px 0;font-size:13px;line-height:1.5}.mwOVfa_field{flex-direction:column;gap:4px;display:flex}.mwOVfa_fieldRow{gap:10px;display:flex}.mwOVfa_fieldRow>*{flex:1 1 0;min-width:0}.mwOVfa_fieldLabel{color:var(--dsw-alias-label-primary,#1f2329);font-size:13px;font-weight:500}.mwOVfa_fieldHint{color:var(--dsw-alias-label-tertiary,#6b7280);font-size:12px;line-height:1.45}.mwOVfa_rowList{flex-direction:column;gap:6px;margin:0;padding:0;list-style:none;display:flex}.mwOVfa_row{align-items:center;gap:6px;display:flex}.mwOVfa_rowLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-primary,#1f2329);flex:1 1 0;font-size:13px;overflow:hidden}.mwOVfa_select{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,#d0d7de);background:var(--dsw-alias-bg-layer-2,#f6f8fa);width:100%;color:var(--dsw-alias-label-primary,#1f2329);color-scheme:light;border-radius:6px;padding:6px 8px;font-size:13px}.mwOVfa_select:focus{outline:2px solid var(--dsw-alias-state-business-primary,#4f8cff);outline-offset:-1px}body[data-ds-dark-theme] .mwOVfa_select{color-scheme:dark}.mwOVfa_select option{background:var(--dsw-alias-bg-layer-2,#f6f8fa);color:var(--dsw-alias-label-primary,#1f2329)}.mwOVfa_rowRemove{border:1px solid var(--dsw-alias-border-l2,#d0d7de);background:var(--dsw-alias-bg-layer-2,#f6f8fa);color:var(--dsw-alias-label-secondary,#4b5563);cursor:pointer;border-radius:6px;flex:none;padding:4px 8px;font-size:12px}.mwOVfa_rowRemove:hover{border-color:var(--dsw-alias-state-error-primary,#d1242f);color:var(--dsw-alias-state-error-primary,#d1242f)}.mwOVfa_testBarHint{color:var(--dsw-alias-label-tertiary,#6b7280);font-size:11px;line-height:1.4}.mwOVfa_rowWrap{flex-direction:column;gap:2px;display:flex}.mwOVfa_rowTest{border:1px solid var(--dsw-alias-border-l2,#d0d7de);background:var(--dsw-alias-bg-layer-2,#f6f8fa);color:var(--dsw-alias-label-secondary,#4b5563);cursor:pointer;border-radius:6px;flex:none;padding:4px 8px;font-size:12px}.mwOVfa_rowTest:hover{border-color:var(--dsw-alias-state-business-primary,#4f8cff);color:var(--dsw-alias-state-business-primary,#4f8cff)}.mwOVfa_rowTest:disabled{opacity:.55;cursor:default}.mwOVfa_testResult{padding-left:2px;font-size:12px;line-height:1.4}.mwOVfa_testResultOk{color:var(--dsw-alias-state-success-primary,#1a7f37)}.mwOVfa_testResultError{color:var(--dsw-alias-state-error-primary,#d1242f)}";
		const tagId = "@superfish058/dsh-llm-proxy/proxy-model.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@superfish058/dsh-llm-proxy";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var proxy_model_module_css_default = {
			"testResult": "mwOVfa_testResult",
			"testResultOk": "mwOVfa_testResultOk",
			"rowLabel": "mwOVfa_rowLabel",
			"rowRemove": "mwOVfa_rowRemove",
			"rowWrap": "mwOVfa_rowWrap",
			"rowTest": "mwOVfa_rowTest",
			"testResultError": "mwOVfa_testResultError",
			"field": "mwOVfa_field",
			"select": "mwOVfa_select",
			"testBarHint": "mwOVfa_testBarHint",
			"status": "mwOVfa_status",
			"rowList": "mwOVfa_rowList",
			"fieldLabel": "mwOVfa_fieldLabel",
			"fieldRow": "mwOVfa_fieldRow",
			"row": "mwOVfa_row",
			"fieldHint": "mwOVfa_fieldHint"
		};
		//#endregion
		//#region src/client/ProxyModelCard.tsx
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
		/** Schema defaults mirrored from lib/index.js, shown as placeholders. */
		const DEFAULTS = {
			proxyHost: "127.0.0.1",
			proxyPort: 7897,
			retries: 3,
			retryIntervalMs: 1e3
		};
		/**
		* Display label for a model row: `[厂商] 模型名`. The vendor prefix is dropped
		* when the model name already carries it (e.g. B.AI names are already
		* "deepseek-v4-flash（B.AI）", so the bracketed prefix would just repeat it).
		*/
		function rowLabel(row) {
			return row.providerLabel !== "" && !row.name.includes(row.providerLabel) ? `[${row.providerLabel}] ${row.name}` : row.name;
		}
		/** One labeled value field, wired to the form's staged state. */
		function ValueField(props) {
			const { id, label, hint, field, disabled, numeric, placeholder, t, onEdit, onReset } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
				id,
				label,
				hint,
				text: field.text,
				overridden: field.overridden,
				invalid: field.invalid,
				overriddenLabel: t("overridden"),
				resetLabel: t("reset"),
				invalidLabel: t("invalidRange"),
				disabled,
				numeric,
				placeholder,
				onEdit,
				onReset
			});
		}
		/** The two model sections share one shape: a label, a selection, an add list. */
		function ModelSection(props) {
			const { id, label, hint, selected, models, modelsFailed, t, testable = false, onSelect, onTest, testingKey, testResults } = props;
			const rowOf = (key) => models.find((m) => m.key === key);
			const options = models.filter((row) => !selected.includes(row.key));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: proxy_model_module_css_default.field,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: proxy_model_module_css_default.fieldLabel,
						children: label
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: proxy_model_module_css_default.fieldHint,
						children: hint
					}),
					modelsFailed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: proxy_model_module_css_default.status,
						children: t("formUnavailable")
					}) : models.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: proxy_model_module_css_default.status,
						children: t("formUnavailable")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: proxy_model_module_css_default.rowList,
						children: selected.map((key) => {
							const row = rowOf(key);
							const result = testResults[key];
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
								className: proxy_model_module_css_default.rowWrap,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: proxy_model_module_css_default.row,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: proxy_model_module_css_default.rowLabel,
											children: row ? rowLabel(row) : key
										}),
										testable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: proxy_model_module_css_default.rowTest,
											"data-testid": "test-proxied-model",
											disabled: testingKey !== null,
											onClick: () => {
												onTest(key);
											},
											children: testingKey === key ? t("testing") : t("test")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: proxy_model_module_css_default.rowRemove,
											"data-testid": "remove-model",
											onClick: () => {
												onSelect(selected.filter((k) => k !== key));
											},
											children: t("remove")
										})
									]
								}), result !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: `${proxy_model_module_css_default.testResult} ${result.ok ? proxy_model_module_css_default.testResultOk : proxy_model_module_css_default.testResultError}`,
									"data-testid": "test-proxied-result",
									children: [
										result.ok ? "✓ " : "✗ ",
										result.ok ? t("testOk") : t("testFail"),
										result.ok ? formatTestDetail(result, t) : `：${result.message ?? result.code ?? ""}`
									]
								})]
							}, key);
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
						className: proxy_model_module_css_default.select,
						"data-testid": `add-${id}-model`,
						value: "",
						disabled: models.length === 0,
						onChange: (event) => {
							if (event.target.value === "") return;
							onSelect([...selected, event.target.value]);
							event.target.value = "";
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
							value: "",
							children: t("selectModel")
						}), options.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
							value: row.key,
							children: [rowLabel(row), row.inputModalities.includes("image") ? `（${t("multimodalBadge")}）` : ""]
						}, row.key))]
					}),
					testable && selected.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: proxy_model_module_css_default.testBarHint,
						children: t("testBarHint")
					})
				]
			});
		}
		/** One-line test detail: `· 200 · 38ms · 经代理 · 多模态已开启`. */
		function formatTestDetail(result, t) {
			const parts = [];
			if (typeof result.status === "number") parts.push(String(result.status));
			if (typeof result.latencyMs === "number") parts.push(`${result.latencyMs}ms`);
			parts.push(result.viaProxy ? t("testViaProxy") : t("testDirect"));
			if (result.multimodal) parts.push(t("testMultimodalOn"));
			return parts.length > 0 ? ` · ${parts.join(" · ")}` : "";
		}
		/** The page body: the whole form, with the official frame's save. */
		function CardBody(props) {
			const { t, useLlmProxyCard, listModels, test, select, selection, edit, resetField } = props;
			const state = useLlmProxyCard((snapshot) => snapshot);
			const [models, setModels] = (0, react.useState)([]);
			const [modelsFailed, setModelsFailed] = (0, react.useState)(false);
			const [testingKey, setTestingKey] = (0, react.useState)(null);
			const [testResults, setTestResults] = (0, react.useState)({});
			(0, react.useEffect)(() => {
				let cancelled = false;
				listModels().then((rows) => {
					if (cancelled) return;
					setModels(rows);
					setModelsFailed(rows.length === 0);
				});
				return () => {
					cancelled = true;
				};
			}, [listModels]);
			const handleTest = async (key) => {
				setTestingKey(key);
				const result = await test(key);
				setTestResults((previous) => ({
					...previous,
					[key]: result
				}));
				setTestingKey(null);
			};
			const disabled = !state.writable;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.SettingsForm, {
				labels: {
					unavailable: t("formUnavailable"),
					readOnly: t("formReadOnly"),
					saveFailed: t("formSaveFailed"),
					save: t("formSave"),
					saving: t("formSaving")
				},
				state,
				onSave: props.save,
				onDiscard: props.discard,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: proxy_model_module_css_default.fieldRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
							id: "plugin-config-llm-proxy-host",
							label: t("fieldProxyHost"),
							hint: t("fieldProxyHostHint"),
							field: state.proxyHost,
							disabled,
							placeholder: DEFAULTS.proxyHost,
							t,
							onEdit: (text) => {
								edit("proxyHost", text);
							},
							onReset: () => {
								resetField("proxyHost");
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
							id: "plugin-config-llm-proxy-port",
							label: t("fieldProxyPort"),
							hint: t("fieldProxyPortHint"),
							field: state.proxyPort,
							disabled,
							numeric: true,
							placeholder: String(DEFAULTS.proxyPort),
							t,
							onEdit: (text) => {
								edit("proxyPort", text);
							},
							onReset: () => {
								resetField("proxyPort");
							}
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelSection, {
						id: "proxied",
						label: t("fieldProxiedModels"),
						hint: t("fieldProxiedModelsHint"),
						selected: selection("proxiedModels"),
						models,
						modelsFailed,
						testingKey,
						testResults,
						testable: true,
						t,
						onSelect: (keys) => {
							select("proxiedModels", keys);
						},
						onTest: (key) => {
							handleTest(key);
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelSection, {
						id: "multimodal",
						label: t("fieldMultimodalModels"),
						hint: t("fieldMultimodalModelsHint"),
						selected: selection("multimodalModels"),
						models,
						modelsFailed,
						testingKey,
						testResults,
						t,
						onSelect: (keys) => {
							select("multimodalModels", keys);
						},
						onTest: (key) => {
							handleTest(key);
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: proxy_model_module_css_default.fieldRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
							id: "plugin-config-llm-proxy-retries",
							label: t("fieldRetries"),
							hint: t("fieldRetriesHint"),
							field: state.retries,
							disabled,
							numeric: true,
							placeholder: String(DEFAULTS.retries),
							t,
							onEdit: (text) => {
								edit("retries", text);
							},
							onReset: () => {
								resetField("retries");
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
							id: "plugin-config-llm-proxy-retry-interval",
							label: t("fieldRetryIntervalMs"),
							hint: t("fieldRetryIntervalMsHint"),
							field: state.retryIntervalMs,
							disabled,
							numeric: true,
							placeholder: String(DEFAULTS.retryIntervalMs),
							t,
							onEdit: (text) => {
								edit("retryIntervalMs", text);
							},
							onReset: () => {
								resetField("retryIntervalMs");
							}
						})]
					})
				]
			});
		}
		/**
		* The 模型代理 page as the Plugins page asks for it: the one-liner in the
		* plugin list, and the settings form once the card is opened.
		*/
		function ProxyModelCard(props) {
			const { view, t, useLlmProxyCard } = props;
			if (view === "summary") return t("description");
			if (useLlmProxyCard === void 0 || t === void 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CardBody, { ...props });
		}
		//#endregion
		//#region src/client/card-controller.ts
		/** Settings namespace owned by the plugin (mirrors lib/settings.js). */
		const LLM_PROXY_NAMESPACE = "llm-proxy";
		/** Bridge route prefix (same-origin, loopback-only). */
		const SETTINGS_BRIDGE_PREFIX = "/api/dsh-llm-proxy/settings";
		/**
		* Read the model-key list a section field carries. A non-array, or a list
		* with a non-string member, is treated as absent rather than trusted: the Host
		* is the authority, but a half-valid list would render as a stringified mess.
		*/
		function modelKeys(value) {
			if (!Array.isArray(value)) return [];
			return value.filter((entry) => typeof entry === "string");
		}
		/** The draft text for a model selection, and the selection it parses back to. */
		const joinKeys = (keys) => keys.join("\n");
		const splitKeys = (text) => text.split("\n").map((line) => line.trim()).filter((line) => line !== "");
		/**
		* A whole-number field with the page's own range. `parse` returning undefined
		* is what blocks the save: the form keeps the draft staged and shows the field
		* as invalid, so the user corrects it instead of retyping.
		*/
		function rangedNumberField(field, min, max) {
			return {
				field,
				format: (value) => typeof value === "number" && Number.isFinite(value) ? String(value) : "",
				parse: (text) => {
					const trimmed = text.trim();
					if (trimmed === "") return { kind: "clear" };
					if (!/^\d+$/.test(trimmed)) return void 0;
					const parsed = Number(trimmed);
					if (parsed < min || parsed > max) return void 0;
					return {
						kind: "set",
						value: parsed
					};
				}
			};
		}
		/**
		* The proxy host. A blank draft is rejected rather than cleared: clearing the
		* host would leave the plugin with nowhere to route, and the schema default
		* (`127.0.0.1`) is reached through the reset control instead.
		*/
		const proxyHostField = {
			field: "proxyHost",
			format: (value) => typeof value === "string" ? value : "",
			parse: (text) => {
				const trimmed = text.trim();
				if (trimmed === "") return void 0;
				return {
					kind: "set",
					value: trimmed
				};
			}
		};
		/**
		* A model-key list. The staged draft is the selection joined by newlines: the
		* multi-select writes it back through `select`, and the join/split round trip
		* is lossless because a model key never contains a newline.
		*/
		function modelListField(field) {
			return {
				field,
				format: (value) => joinKeys(modelKeys(value)),
				parse: (text) => {
					const keys = splitKeys(text);
					return keys.length === 0 ? { kind: "clear" } : {
						kind: "set",
						value: keys
					};
				}
			};
		}
		/** Every field spec the page stages, in save order. */
		const FIELD_SPECS = [
			proxyHostField,
			rangedNumberField("proxyPort", 1, 65535),
			modelListField("proxiedModels"),
			modelListField("multimodalModels"),
			rangedNumberField("retries", 0, 10),
			rangedNumberField("retryIntervalMs", 0, 6e4)
		];
		/** Post one call to the loopback bridge. */
		async function callBridge(fetchFn, path, body) {
			try {
				const response = await fetchFn(SETTINGS_BRIDGE_PREFIX + path, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(body)
				});
				if (!response.ok) return null;
				const parsed = await response.json();
				if (typeof parsed !== "object" || parsed === null) return null;
				const result = parsed;
				return result.ok ? result.value : null;
			} catch {
				return null;
			}
		}
		/** Fetch the selectable model list from the host bridge. */
		async function fetchModels(fetchFn) {
			const value = await callBridge(fetchFn, "/models", {});
			if (value === null || !Array.isArray(value.models)) return [];
			return value.models.filter((row) => typeof row === "object" && row !== null && typeof row.key === "string" && typeof row.name === "string");
		}
		/** Probe one model key from the host (rides the proxy routing + retry). */
		async function probeModel(fetchFn, key) {
			const result = await callBridge(fetchFn, "/test", { key });
			if (result === null) return {
				key,
				ok: false,
				code: "internal",
				message: "settings bridge unreachable"
			};
			return result;
		}
		/**
		* Bridges the Host's `llm-proxy` entry form and this package's loopback bridge
		* onto the 模型代理 page.
		*/
		var LlmProxyCardController = class {
			form;
			actions;
			store;
			fetchFn;
			face;
			/**
			* @param scope - the Host's entry form for the `llm-proxy` namespace.
			* @param fetchFn - the page's fetch, for the two host-side bridge calls.
			*/
			constructor(scope, fetchFn) {
				this.fetchFn = fetchFn;
				this.form = new _deepseek_ai_dsh_client_ui_primitives.SettingsFormModel(scope, FIELD_SPECS);
				this.actions = this.form.actions();
				this.store = this.form.bind(() => this.projection());
				this.face = {
					hooks: { llmProxyCard: this.store },
					...this.actions,
					listModels: () => fetchModels(this.fetchFn),
					test: (key) => probeModel(this.fetchFn, key),
					select: (field, keys) => {
						this.actions.edit(field, joinKeys(keys));
					},
					selection: (field) => splitKeys(this.form.field(field).text)
				};
			}
			projection() {
				return {
					...this.form.shell(),
					proxyHost: this.form.field("proxyHost"),
					proxyPort: this.form.field("proxyPort"),
					proxiedModels: this.form.field("proxiedModels"),
					multimodalModels: this.form.field("multimodalModels"),
					retries: this.form.field("retries"),
					retryIntervalMs: this.form.field("retryIntervalMs")
				};
			}
			/**
			* Build the face the page's slot registration injects.
			* @returns the page's snapshot, the form's actions, and the bridge calls.
			*/
			inject() {
				return this.face;
			}
			/** Release the form's subscription to the entry form. */
			dispose() {
				this.form.dispose();
			}
		};
		//#endregion
		//#region src/client/locales.ts
		/**
		* The `settings.llm-proxy` locale dictionaries for the 模型代理 page.
		* Keys track exactly the UI-surfaced fields (proxyHost/proxyPort,
		* proxiedModels, multimodalModels, retries/retryIntervalMs) plus the frame
		* copy the official SettingsForm renders on the plugin's own behalf.
		*/
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			title: "模型代理（dsh-llm-proxy）",
			description: "选中的模型请求走代理并自动重试。",
			formUnavailable: "设置服务不可用，无法读取或写入代理配置。",
			formReadOnly: "当前配置为只读，无法保存。",
			formSaveFailed: "保存被拒绝，请检查取值后重试。",
			formSave: "保存",
			formSaving: "保存中…",
			fieldProxyHost: "代理地址（proxyHost）",
			fieldProxyHostHint: "代理服务器主机或 IP，不必是本机。",
			fieldProxyPort: "代理端口（proxyPort）",
			fieldProxyPortHint: "代理服务端口（1–65535）。",
			fieldProxiedModels: "走代理的模型（proxiedModels）",
			fieldProxiedModelsHint: "按 API 地址走代理：选中一个模型会将该地址下的所有模型都路由到代理。",
			fieldRetries: "重试次数（retries）",
			fieldRetriesHint: "请求失败（网络错误 / 429 / 5xx）时的最大重试次数（0–10）。",
			fieldRetryIntervalMs: "重试间隔（retryIntervalMs）",
			fieldRetryIntervalMsHint: "每次重试之间的等待毫秒数（0–60000）。",
			selectModel: "选择模型…",
			remove: "移除",
			overridden: "已自定义",
			reset: "恢复默认",
			invalidRange: "端口或数值超出允许范围。",
			invalidEmpty: "代理地址不能为空。",
			fieldMultimodalModels: "多模态模型（multimodalModels）",
			fieldMultimodalModelsHint: "勾选后模型声明支持图片输入，DSH 不再拒绝发图；取消勾选自动还原。",
			multimodalBadge: "🖼 多模态",
			test: "测试连接",
			testing: "测试中…",
			testOk: "连接成功",
			testFail: "连接失败",
			testViaProxy: "经代理",
			testDirect: "直连",
			testMultimodalOn: "多模态已开启",
			testBarHint: "「测试连接」走已保存的配置，改代理勾选后请先保存再测试。"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			title: "Proxy Model (dsh-llm-proxy)",
			description: "Selected models route through the proxy with automatic retries.",
			formUnavailable: "Settings service unavailable; the proxy configuration cannot be read or written.",
			formReadOnly: "This configuration is read-only and cannot be saved.",
			formSaveFailed: "The Host refused the save; check the values and try again.",
			formSave: "Save",
			formSaving: "Saving…",
			fieldProxyHost: "Proxy host (proxyHost)",
			fieldProxyHostHint: "Proxy server hostname or IP; does not have to be this machine.",
			fieldProxyPort: "Proxy port (proxyPort)",
			fieldProxyPortHint: "Proxy service port (1–65535).",
			fieldProxiedModels: "Proxied models (proxiedModels)",
			fieldProxiedModelsHint: "Proxy routing is per API base URL: selecting one model also routes all models sharing that host.",
			fieldRetries: "Retries (retries)",
			fieldRetriesHint: "Max retry attempts on failure (network error / 429 / 5xx), 0–10.",
			fieldRetryIntervalMs: "Retry interval (retryIntervalMs)",
			fieldRetryIntervalMsHint: "Milliseconds between retry attempts (0–60000).",
			selectModel: "Select model…",
			remove: "Remove",
			overridden: "Overridden",
			reset: "Reset to defaults",
			invalidRange: "Port or numeric value out of range.",
			invalidEmpty: "Proxy host must not be empty.",
			fieldMultimodalModels: "Multimodal models (multimodalModels)",
			fieldMultimodalModelsHint: "Checked models are advertised as accepting image input; unchecking restores the official defaults.",
			multimodalBadge: "🖼 Multimodal",
			test: "Test",
			testing: "Testing…",
			testOk: "Connected",
			testFail: "Failed",
			testViaProxy: "via proxy",
			testDirect: "direct",
			testMultimodalOn: "multimodal on",
			testBarHint: "Test uses the saved routing; save before testing a newly proxied model."
		};
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "settings.llm-proxy";
		/** Required services (cordis fiber inject). */
		const inject = [
			"slots",
			"locale",
			"configForms"
		];
		/**
		* Register the 模型代理 page once the Host serves the llm-proxy namespace, and
		* bind it to the official entry form.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-llm-proxy: copy dictionaries");
			const controller = new LlmProxyCardController(ctx.configForms.get(LLM_PROXY_NAMESPACE), (input, init) => fetch(input, init));
			ctx.effect(() => () => controller.dispose(), "dsh-llm-proxy: entry form subscription");
			const face = controller.inject();
			ctx.effect(() => ctx.configForms.whileServed([LLM_PROXY_NAMESPACE], () => ctx.slots.inject("plugins.item", () => ctx.slots.register({
				name: "plugins.item",
				id: "llm-proxy",
				order: 50,
				label: () => ctx.locale.bind(NS)("title"),
				locale: NS,
				inject: () => face
			}, ProxyModelCard))), "dsh-llm-proxy: page");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
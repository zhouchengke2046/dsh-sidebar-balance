// dsh-sidebar-balance — browser half (v2).
//
// Hand-authored client bundle in the DSH module-loader factory format.
//
// Layout: shadows the sidebar's `settings.trigger` single seat (priority -1,
// lowest wins) so the balance amount lives on the SAME row as the Settings
// trigger: gear icon + "设置" on the left, balance amount on the right. The
// surrounding SettingsRoot button keeps its original click-to-open behavior.
//
// Hover: a frosted-glass (backdrop-blur) floating card showing BOTH the
// DeepSeek official account balance (total / topped-up / granted) and the
// OpenCode Go plan quota (rolling / weekly / monthly, percent + reset).
//
// All styling uses the DSH alias design tokens (--dsw-alias-*), so it blends
// in with the native sidebar in light and dark themes.
window.__ModuleLoader__.load({
	id: "dsh-sidebar-balance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");

		// ── styles (injected once) ──────────────────────────────────────────
		const CSS_ID = "dsh-sidebar-balance/widget.css";
		if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="' + CSS_ID + '"]') === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-sidebar-balance";
			tag.dataset.pluginCss = CSS_ID;
			tag.textContent = [
				// Row inside the settings trigger button (wide sidebar).
				".psb-row{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0}",
				".psb-left{display:flex;align-items:center;gap:6px;min-width:0;color:var(--dsw-alias-label-primary)}",
				".psb-left svg{flex:none;opacity:.9}",
				".psb-label{font-size:12px;line-height:18px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
				// Balance amount: plain right-aligned text on the same row — no box, no
				// divider; interaction separation is functional only (its own
				// click/hover handlers never affect the settings trigger).
				".psb-amt{display:flex;align-items:center;gap:5px;flex:none;font-size:12px;line-height:18px;font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;white-space:nowrap;cursor:pointer;user-select:none}",
				".psb-amt:hover{color:var(--dsw-alias-label-secondary)}",
				".psb-dot{width:6px;height:6px;border-radius:50%;flex:none}",
				".psb-ring{flex:none}",
				".psb-num{display:inline-block;white-space:nowrap}",
				".psb-num-out{animation:psb-num-out .15s ease both}",
				".psb-num-in{animation:psb-num-in .22s ease}",
				"@keyframes psb-num-out{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-5px)}}",
				"@keyframes psb-num-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}",
				".psb-ring-fill{animation:psb-ring-in .6s ease}",
				"@keyframes psb-ring-in{from{stroke-dashoffset:42.2}}",
				// Rail (collapsed sidebar): keep the plain trigger visuals.
				".psb-rail{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--dsw-alias-label-primary)}",
				// Frosted-glass floating card (polished).
				".psb-tip{position:fixed;z-index:9999;min-width:252px;max-width:320px;padding:14px 14px 12px;border-radius:14px;background:color-mix(in srgb, var(--dsw-alias-bg-layer-2) 74%, transparent);-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2) 55%, transparent);box-shadow:0 4px 12px rgba(0,0,0,.10), 0 20px 48px rgba(0,0,0,.22);color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px;animation:psb-pop .18s ease-out;transform-origin:bottom left}",
				"@keyframes psb-pop{from{opacity:0;transform:translateY(-100%) scale(.97)}to{opacity:1;transform:translateY(-100%) scale(1)}}",
				".psb-tip-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}",
				".psb-tip-title{display:flex;align-items:center;gap:6px;font-size:12px;line-height:18px;font-weight:600;color:var(--dsw-alias-label-primary)}",
				".psb-tip-title svg{color:var(--dsw-alias-brand-primary)}",
				".psb-refresh{cursor:pointer;border:none;background:none;padding:3px;border-radius:6px;color:var(--dsw-alias-label-secondary);display:flex;align-items:center}",
				".psb-refresh:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}",
				// DeepSeek balance card: big amount + status pill + sub rows.
				".psb-ds-card{background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2) 50%, transparent);border-radius:10px;padding:10px 12px;margin-bottom:10px}",
				".psb-ds-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px}",
				".psb-ds-lbl{font-size:11px;line-height:16px;font-weight:500;color:var(--dsw-alias-label-tertiary)}",
				".psb-ds-status{font-size:10px;line-height:16px;padding:0 8px;border-radius:8px;background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 16%, transparent);color:var(--dsw-alias-state-success-primary);font-weight:600}",
				".psb-ds-status.bad{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 16%, transparent);color:var(--dsw-alias-state-error-primary)}",
				".psb-ds-amt{display:flex;align-items:center;gap:8px;font-size:22px;line-height:28px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.01em;color:var(--dsw-alias-label-primary)}",
				".psb-ds-amt .psb-dot{width:8px;height:8px}",
				".psb-ds-amt .sym{font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}",
				".psb-ds-sub{display:flex;gap:14px;margin-top:3px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}",
				".psb-ds-sub b{font-weight:600;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}",
				// OpenCode Go section.
				".psb-sec-title{font-size:11px;line-height:16px;font-weight:600;color:var(--dsw-alias-label-secondary);margin-bottom:8px}",
				".psb-go-row{display:flex;flex-direction:column;margin-bottom:9px}",
				".psb-go-row:last-child{margin-bottom:0}",
				".psb-go-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:4px}",
				".psb-go-name{font-size:11px;line-height:15px;color:var(--dsw-alias-label-secondary)}",
				".psb-go-pct{font-size:11px;line-height:15px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}",
				".psb-track{box-sizing:border-box;height:5px;border-radius:3px;background:color-mix(in srgb, var(--dsw-alias-border-l2) 65%, transparent);overflow:hidden;margin-bottom:3px}",
				".psb-fill{height:100%;border-radius:3px;box-shadow:inset 0 1px 0 rgba(255,255,255,.22);transition:width .4s ease;animation:psb-bar-in .55s ease}",
				"@keyframes psb-bar-in{from{width:0}}",
				".psb-meta{display:flex;justify-content:flex-end;font-size:10px;line-height:14px;color:var(--dsw-alias-label-tertiary)}",
				".psb-err{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}",
				".psb-spin{animation:psb-spin .8s linear infinite;transform-origin:center}@keyframes psb-spin{to{transform:rotate(360deg)}}",
				".psb-dot.loading{animation:psb-pulse .9s ease-in-out infinite}@keyframes psb-pulse{0%,100%{opacity:.45;transform:scale(.75)}50%{opacity:1;transform:scale(1.15)}}",
			].join("");
			document.head.appendChild(tag);
		}

		// ── helpers ─────────────────────────────────────────────────────────
		function fmtCurrency(currency) {
			if (currency === "CNY") return "¥";
			if (currency === "USD") return "$";
			if (currency === "EUR") return "€";
			if (currency === "GBP") return "£";
			return currency ? currency + " " : "";
		}

		function fmtAmount(value) {
			const n = Number(value);
			if (!Number.isFinite(n)) return null;
			return n.toFixed(2);
		}

		function timeUntil(iso) {
			const target = new Date(iso).getTime();
			if (!Number.isFinite(target)) return "";
			const diff = target - Date.now();
			if (diff <= 0) return "即将重置";
			const mins = Math.floor(diff / 60000);
			if (mins < 60) return mins + "分后重置";
			const hours = Math.floor(mins / 60);
			if (hours < 24) return hours + "小时" + (mins % 60) + "分后重置";
			return Math.floor(hours / 24) + "天" + (hours % 24) + "小时后重置";
		}

		function pctColor(percent) {
			if (percent >= 90) return "var(--dsw-alias-state-error-primary)";
			if (percent >= 70) return "var(--dsw-alias-state-warn-primary)";
			return "var(--dsw-alias-state-success-primary)";
		}

		function balColor(value) {
			const n = Number(value);
			if (!Number.isFinite(n)) return "var(--dsw-alias-label-tertiary)";
			if (n < 1) return "var(--dsw-alias-state-error-primary)";
			if (n < 10) return "var(--dsw-alias-state-warn-primary)";
			return "var(--dsw-alias-state-success-primary)";
		}

		// Exit-then-enter number swap so refreshing never hard-cuts a digit.
		// `tick` changes on a successful refresh; the old text plays a short
		// fade-out, then the new text fades in.
		function useSwapText(value, tick) {
			const [state, setState] = react.useState({ display: value, phase: "in" });
			const lastTick = react.useRef(tick);
			const latest = react.useRef(value);
			react.useEffect(() => {
				latest.current = value;
				if (tick === lastTick.current) return;
				lastTick.current = tick;
				setState((prev) => ({ display: prev.display, phase: "out" }));
				const timer = window.setTimeout(() => {
					setState({ display: latest.current, phase: "in" });
				}, 150);
				return () => window.clearTimeout(timer);
			}, [tick, value]);
			return state;
		}

		function SwapText({ value, tick, className }) {
			const { display, phase } = useSwapText(value, tick);
			const cls = ["psb-num", phase === "out" ? "psb-num-out" : "psb-num-in", className].filter(Boolean).join(" ");
			return react_jsx_runtime.jsx("span", { className: cls, children: display });
		}


		/** Settings gear icon (Feather "settings", stroke currentColor). */
		function GearIcon() {
			return react_jsx_runtime.jsx("svg", {
				width: 15,
				height: 15,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.8,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true,
				children: [
					react_jsx_runtime.jsx("circle", { cx: 12, cy: 12, r: 3 }),
					react_jsx_runtime.jsx("path", {
						d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
					})
				]
			});
		}

		/** Small consumption-progress ring (OpenCode Go plan total). */
		function GoRing({ percent, title }) {
			const p = Number(percent);
			const has = Number.isFinite(p);
			const clamped = has ? Math.max(0, Math.min(100, p)) : 0;
			const R = 6.5;
			const C = 2 * Math.PI * R;
			const color = has ? pctColor(clamped) : "var(--dsw-alias-label-tertiary)";
			return react_jsx_runtime.jsx("svg", {
				width: 16,
				height: 16,
				viewBox: "0 0 18 18",
				className: "psb-ring",
				title: title,
				"aria-hidden": true,
				children: [
					react_jsx_runtime.jsx("circle", { cx: 9, cy: 9, r: R, fill: "none", stroke: "var(--dsw-alias-border-l2)", strokeWidth: 2.2 }),
					react_jsx_runtime.jsx("circle", {
						cx: 9,
						cy: 9,
						r: R,
						fill: "none",
						className: "psb-ring-fill",
						stroke: color,
						strokeWidth: 2.2,
						strokeLinecap: "round",
						strokeDasharray: C,
						strokeDashoffset: C * (1 - clamped / 100),
						transform: "rotate(-90 9 9)",
						style: { transition: "stroke-dashoffset .4s ease, stroke .3s ease" }
					})
				]
			});
		}

		// ── component ───────────────────────────────────────────────────────
		/**
		 * Renders inside the settings trigger button: [⚙ 设置] left, [amount]
		 * right; hover opens the frosted-glass card with both balances.
		 * @param {{ wide?: boolean }} props - trigger seat owner props.
		 */
		function TriggerWithBalance(props) {
			const [bal, setBal] = react.useState({ data: null, error: null });
			const [go, setGo] = react.useState({ data: null, error: null, loading: false });
			const [tip, setTip] = react.useState(null); // { x, y }
			const [stamp, setStamp] = react.useState(0);
			const [animTick, setAnimTick] = react.useState(0);
			const [balLoading, setBalLoading] = react.useState(false);
			const hideTimer = react.useRef(null);

			// Poll the DeepSeek balance every 60s.
			react.useEffect(() => {
				let alive = true;
				const load = async () => {
					setBalLoading(true);
					try {
						const res = await fetch("/api/dsh-sidebar-balance/balance", { cache: "no-store" });
						const json = await res.json().catch(() => null);
						if (!alive) return;
						if (!res.ok || json === null || json.error) {
							setBal((prev) => ({ data: prev.data, error: String((json && json.error) || "HTTP " + res.status) }));
						} else {
							setBal({ data: json, error: null });
							setAnimTick((t) => t + 1);
						}
					} catch (e) {
						if (!alive) return;
						setBal((prev) => ({ data: prev.data, error: String((e && e.message) || e) }));
					} finally {
						if (alive) setBalLoading(false);
					}
				};
				load();
				const timer = window.setInterval(load, 60000);
				return () => { alive = false; window.clearInterval(timer); };
			}, [stamp]);

			const loadGo = async () => {
				setGo((g) => ({ ...g, loading: true }));
				try {
					const res = await fetch("/api/dsh-sidebar-balance/opencode", { cache: "no-store" });
					const json = await res.json().catch(() => null);
					if (!res.ok || json === null || json.error) {
						setGo((prev) => ({ data: prev.data, error: String((json && json.error) || "HTTP " + res.status) }));
					} else {
						setGo({ data: json, error: null });
						setAnimTick((t) => t + 1);
					}
				} catch (e) {
					setGo((prev) => ({ data: prev.data, error: String((e && e.message) || e) }));
				} finally {
					setGo((g) => ({ ...g, loading: false }));
				}
			};

			// Keep the Go consumption ring fresh: load on mount + every 60s.
			react.useEffect(() => {
				loadGo();
				const timer = window.setInterval(loadGo, 60000);
				return () => window.clearInterval(timer);
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, []);

			const openTip = (e) => {
				if (hideTimer.current) { window.clearTimeout(hideTimer.current); hideTimer.current = null; }
				const rect = e.currentTarget.getBoundingClientRect();
				setTip({ x: Math.round(rect.left), y: Math.round(rect.top) });
				if (!go.data && !go.loading) loadGo();
			};
			const closeTip = () => {
				if (hideTimer.current) window.clearTimeout(hideTimer.current);
				hideTimer.current = window.setTimeout(() => setTip(null), 220);
			};
			const tipEnter = () => {
				if (hideTimer.current) { window.clearTimeout(hideTimer.current); hideTimer.current = null; }
			};
			const refreshAll = () => {
				setStamp((s) => s + 1);
				loadGo();
			};


			const b = bal.data;
			// Go plan "total" consumption = the monthly window (fallback:
			// weekly / rolling) — drives the常驻 progress ring.
			const goWin = go.data ? (go.data.monthly || go.data.weekly || go.data.rolling || null) : null;
			const goPercent = goWin && typeof goWin.percent === "number" ? goWin.percent : null;
			const amount = b ? fmtAmount(b.total_balance) : null;
			const amountText = amount === null ? (b ? "—" : "…") : fmtCurrency(b.currency) + amount;
			const dotColor = b ? balColor(b.total_balance) : "var(--dsw-alias-label-tertiary)";
			const loading = balLoading || go.loading;

			// ── tooltip body: DeepSeek balance card + OpenCode Go section ──
			let dsCard = null;
			if (b) {
				const sym = fmtCurrency(b.currency);
				dsCard = react_jsx_runtime.jsx("div", { className: "psb-ds-card", children: [
					react_jsx_runtime.jsx("div", { className: "psb-ds-top", children: [
						react_jsx_runtime.jsx("span", { className: "psb-ds-lbl", children: "DeepSeek 账户" }),
						react_jsx_runtime.jsx("span", { className: "psb-ds-status" + (b.is_available ? "" : " bad"), children: b.is_available ? "可用" : "不可用" })
					] }),
					react_jsx_runtime.jsx("div", { className: "psb-ds-amt", children: [
						react_jsx_runtime.jsx("span", { className: "psb-dot", style: { background: dotColor } }),
						react_jsx_runtime.jsx("span", { className: "sym", children: sym }),
						react_jsx_runtime.jsx(SwapText, { tick: animTick, value: amount ?? "—" })
					] }),
					react_jsx_runtime.jsx("div", { className: "psb-ds-sub", children: [
						react_jsx_runtime.jsx("span", { children: ["充值 ", react_jsx_runtime.jsx("b", { children: react_jsx_runtime.jsx(SwapText, { tick: animTick, value: sym + (b.topped_up_balance ?? "—") }) })] }),
						react_jsx_runtime.jsx("span", { children: ["赠送 ", react_jsx_runtime.jsx("b", { children: react_jsx_runtime.jsx(SwapText, { tick: animTick, value: sym + (b.granted_balance ?? "—") }) })] })
					] })
				] });
				if (bal.error) {
					dsCard = react_jsx_runtime.jsx(react.Fragment, { children: [
						dsCard,
						react_jsx_runtime.jsx("div", { className: "psb-err", children: "获取最新余额失败，请稍后再试" + (bal.error ? " (" + bal.error + ")" : "") })
					] });
				}
			} else if (bal.error) {
				dsCard = react_jsx_runtime.jsx("div", { className: "psb-err", children: "获取最新余额失败，请稍后再试" + (bal.error ? " (" + bal.error + ")" : "") });
			} else {
				dsCard = react_jsx_runtime.jsx("div", { className: "psb-err", children: "加载中…" });
			}

			let goSection = null;
			if (go.data) {
				const defs = [
					{ key: "rolling", label: "滚动 (5h)" },
					{ key: "weekly", label: "周" },
					{ key: "monthly", label: "月" }
				];
				const rows = [];
				for (const d of defs) {
					const w = go.data[d.key];
					if (!w || typeof w.percent !== "number") continue;
					rows.push(react_jsx_runtime.jsx("div", {
						className: "psb-go-row",
						children: [
							react_jsx_runtime.jsx("div", {
								className: "psb-go-head",
								children: [react_jsx_runtime.jsx("span", { className: "psb-go-name", children: d.label }), react_jsx_runtime.jsx(SwapText, { className: "psb-go-pct", tick: animTick, value: w.percent + "%" })]
							}),
							react_jsx_runtime.jsx("div", {
								className: "psb-track",
								children: react_jsx_runtime.jsx("div", {
									key: "fill-" + d.key + "-" + animTick,
									className: "psb-fill",
									style: { width: Math.max(0, Math.min(100, w.percent)) + "%", background: pctColor(w.percent) }
								})
							}),
							react_jsx_runtime.jsx("div", {
								className: "psb-meta",
								children: w.status === "ok"
									? (w.resetsAt ? timeUntil(w.resetsAt) : "")
									: ("状态: " + w.status)
							})
						]
					}, d.key));
				}
				goSection = rows.length > 0
					? react_jsx_runtime.jsx(react.Fragment, { children: rows })
					: react_jsx_runtime.jsx("div", { className: "psb-err", children: "暂无窗口数据" });
				if (go.error) {
					goSection = react_jsx_runtime.jsx(react.Fragment, { children: [
						goSection,
						react_jsx_runtime.jsx("div", { className: "psb-err", children: "获取 OpenCode Go 套餐用量失败，请稍后再试" + (go.error ? " (" + go.error + ")" : "") })
					] });
				} else if (go.loading) {
					goSection = react_jsx_runtime.jsx(react.Fragment, { children: [
						goSection,
						react_jsx_runtime.jsx("div", { className: "psb-err", children: "加载中…" })
					] });
				}
			} else if (go.error) {
				goSection = react_jsx_runtime.jsx("div", { className: "psb-err", children: "获取 OpenCode Go 套餐用量失败，请稍后再试" + (go.error ? " (" + go.error + ")" : "") });
			} else {
				goSection = react_jsx_runtime.jsx("div", { className: "psb-err", children: "加载中…" });
			}

			const tipEl = tip === null ? null : react_jsx_runtime.jsx("div", {
				className: "psb-tip",
				style: {
					left: tip.x < 8 ? 8 : tip.x,
					top: (tip.y - 8) < 0 ? 8 : tip.y - 8,
					transform: "translateY(-100%)"
				},
				onMouseEnter: tipEnter,
				onMouseLeave: closeTip,
				onMouseDown: (e) => e.stopPropagation(),
				onClick: (e) => e.stopPropagation(),
				children: [
					react_jsx_runtime.jsx("div", {
						className: "psb-tip-head",
						children: [
							react_jsx_runtime.jsx("span", {
								className: "psb-tip-title",
								children: [
									react_jsx_runtime.jsx("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: [
										react_jsx_runtime.jsx("path", { d: "M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-9Z" }),
										react_jsx_runtime.jsx("path", { d: "M3 10h18M7 15h4" })
									] }),
									react_jsx_runtime.jsx("span", { children: "账户概览" })
								]
							}),
							react_jsx_runtime.jsx("button", {
								type: "button",
								className: "psb-refresh" + (loading ? " psb-spin" : ""),
								title: "刷新",
								onClick: (e) => {
									e.stopPropagation();
									refreshAll();
								},
								children: react_jsx_runtime.jsx("svg", { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: react_jsx_runtime.jsx("path", { d: "M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" }) })
							})
						]
					}),
					dsCard,
					react_jsx_runtime.jsx("div", { className: "psb-sec-title", children: "OpenCode Go 套餐" }),
					goSection
				]
			});


			const rail = react_jsx_runtime.jsx("span", {
				className: "psb-rail",
				onMouseEnter: openTip,
				onMouseLeave: closeTip,
				children: react_jsx_runtime.jsx(GearIcon, {})
			});

			// Rail (collapsed): the settings button is icon-only; keep the plain
			// icon (amount would not fit). Hover card still works.
			if (!props.wide) {
				return react_jsx_runtime.jsx(react.Fragment, { children: [rail, tipEl] });
			}

			return react_jsx_runtime.jsx(react.Fragment, { children: [
				react_jsx_runtime.jsx("div", {
					className: "psb-row",
					children: [
						// Left: the settings trigger itself — clicks bubble to the
						// surrounding SettingsRoot button and open the settings panel.
						react_jsx_runtime.jsx("span", {
							className: "psb-left",
							children: [react_jsx_runtime.jsx(GearIcon, {}), react_jsx_runtime.jsx("span", { className: "psb-label", children: "设置" })]
						}),
						// Right: the balance amount, plain text at the row's end. It has its own
						// click (refresh only) and hover (card) handlers; it must
						// never open settings.
						react_jsx_runtime.jsx("span", {
							className: "psb-amt",
							onMouseEnter: openTip,
							onMouseLeave: closeTip,
							onClick: (e) => {
								e.stopPropagation();
								refreshAll();
							},
							children: [
								react_jsx_runtime.jsx("span", { className: "psb-dot" + (loading ? " loading" : ""), style: { background: dotColor } }),
								react_jsx_runtime.jsx(SwapText, { tick: animTick, value: amountText }),
								react_jsx_runtime.jsx(GoRing, {
									key: "ring-" + animTick,
									percent: goPercent,
									title: goPercent === null
										? "OpenCode Go 套餐加载中…"
										: ("OpenCode Go 套餐已用 " + Math.round(goPercent) + "%")
								})
							]
						})
					]
				}),
				tipEl
			] });
		}



		// ── cordis plugin entry ────────────────────────────────────────────
		const inject = ["slots"];

		function apply(ctx) {
			ctx.effect(() => ctx.slots.register({
				name: "settings.trigger",
				id: "dsh-sidebar-balance",
				priority: -1,
				label: "设置"
			}, TriggerWithBalance), "dsh-sidebar-balance: trigger row");

		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
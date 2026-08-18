// @ts-check
/**
 * dsh-sidebar-balance — host half.
 *
 * Two same-origin JSON routes the browser widget polls (keys never leave the
 * host process):
 *   - GET /api/dsh-sidebar-balance/balance   — DeepSeek official account
 *     balance (`GET https://api.deepseek.com/user/balance`), key resolved via
 *     the DSH credentials service (`DEEPSEEK_API_KEY` by default).
 *   - GET /api/dsh-sidebar-balance/opencode  — OpenCode Go plan quota
 *     (`GET https://opencode.ai/zen/go/v1/usage`), key resolved via the DSH
 *     credentials service (`OPENCODE_GO_API_KEY` by default).
 *
 * The browser bundle is self-hosted at `/dsh-sidebar-balance/client.js` and
 * its boot-graph row injected through the official `webServer.tapIndex` API,
 * so the widget works from any installation location (profile-installed
 * third-party packages are otherwise not scanned by client-modules).
 *
 * Configuration (loader-entry `config` in the bundle patch / profile patch):
 *   balanceApiKeyEnv    credential ref for the DeepSeek key (default DEEPSEEK_API_KEY)
 *   balanceBaseUrl      DeepSeek API base  (default https://api.deepseek.com)
 *   opencodeApiKeyEnv   credential ref for the OpenCode Go key (default OPENCODE_GO_API_KEY)
 *   opencodeBaseUrl     OpenCode Go gateway base (default https://opencode.ai/zen/go)
 *   cacheMs             host-side cache TTL for both routes (default 30000)
 *   timeoutMs           upstream fetch timeout (default 15000)
 */

import { readFileSync, openSync, writeSync, closeSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";

export const name = "dsh-sidebar-balance";

/** Required host services. */
export const inject = ["webServer", "credentials"];

const DEFAULTS = {
	balanceApiKeyEnv: "DEEPSEEK_API_KEY",
	balanceBaseUrl: "https://api.deepseek.com",
	opencodeApiKeyEnv: "OPENCODE_GO_API_KEY",
	opencodeBaseUrl: "https://opencode.ai/zen/go",
	cacheMs: 30_000,
	timeoutMs: 15_000,
	// Restart support (sidebar widget "重启" button).
	restartEnabled: true,
	restartCommand: "", // "" auto-detects; else e.g. "launchctl kickstart -k gui/501/com.dsh.web"
	restartLabel: "com.dsh.web",
	restartDelayMs: 600
};

/**
 * Resolve a credential reference through the DSH credentials service
 * (process env, `$DSH_HOME/.credentials.yaml`, `.env` layers).
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {string} refName
 */
async function resolveKey(ctx, refName) {
	const hit = await ctx.credentials.resolve(refName);
	return hit?.value ?? null;
}

/** GET a JSON endpoint with Bearer auth and a timeout. */
async function getJSON(baseUrl, path, apiKey, timeoutMs) {
	const res = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
		headers: { Authorization: `Bearer ${apiKey}` },
		signal: AbortSignal.timeout(timeoutMs)
	});
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
	}
	return await res.json();
}

/**
 * Small TTL + in-flight cache: several open tabs never hammer the upstream.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {number} ttlMs
 */
function makeCache(fn, ttlMs) {
	/** @type {{ at: number, promise: Promise<T> } | null} */
	let slot = null;
	return () => {
		const now = Date.now();
		if (slot !== null && now - slot.at < ttlMs) return slot.promise;
		const promise = fn().catch((error) => {
			if (slot?.promise === promise) slot = null;
			throw error;
		});
		slot = { at: now, promise };
		return promise;
	};
}

/**
 * Inject one graph row into the index.html boot manifest
 * (`window.__DSH_BOOT__ = [...]`), skipping when the id is already present.
 * @param {string} html
 * @param {{ id: string, url: string, rev: string, inject?: string[], immediately?: boolean }} row
 */
function injectGraphRow(html, row) {
	const marker = "window.__DSH_BOOT__ = ";
	const start = html.indexOf(marker);
	if (start === -1) return html;
	const bodyStart = start + marker.length;
	const end = html.indexOf("</script>", bodyStart);
	if (end === -1) return html;
	let graph;
	try {
		graph = JSON.parse(html.slice(bodyStart, end).trim());
	} catch {
		return html;
	}
	if (!Array.isArray(graph)) return html;
	if (graph.some((entry) => entry !== null && typeof entry === "object" && entry.id === row.id)) return html;
	graph.push(row);
	return html.slice(0, bodyStart) + JSON.stringify(graph).replaceAll("<", "\\u003c") + html.slice(end);
}

/**
 * Resolve the restart command. A configured `restartCommand` string is split
 * on whitespace into { command, args }. Otherwise, on macOS with a launchd
 * agent label, default to `launchctl kickstart -k gui/<uid>/<label>`.
 * @param {string} configured
 * @param {string} label
 * @returns {{ command: string, args: string[] } | null}
 */
function parseRestartCommand(configured, label) {
	const trimmed = String(configured ?? "").trim();
	if (trimmed !== "") {
		const parts = trimmed.split(/\s+/);
		return { command: parts[0], args: parts.slice(1) };
	}
	if (process.platform === "darwin" && typeof process.getuid === "function") {
		return { command: "launchctl", args: ["kickstart", "-k", "gui/" + process.getuid() + "/" + label] };
	}
	return null;
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {Record<string, unknown>} rawConfig - loader entry config (bundle patch).
 */
export function apply(ctx, rawConfig = {}) {
	const cfg = { ...DEFAULTS, ...(rawConfig ?? {}) };

	const balanceOnce = makeCache(async () => {
		const key = await resolveKey(ctx, cfg.balanceApiKeyEnv);
		if (key === null) throw new Error(`未配置 DeepSeek API key(credentials: ${cfg.balanceApiKeyEnv})`);
		const body = await getJSON(cfg.balanceBaseUrl, "/user/balance", key, cfg.timeoutMs);
		// Normalize the DeepSeek response: { is_available, balance_infos: [{currency, total_balance, granted_balance, topped_up_balance}] }
		const info = Array.isArray(body?.balance_infos) ? body.balance_infos[0] ?? null : null;
		return {
			is_available: body?.is_available ?? false,
			currency: info?.currency ?? "CNY",
			total_balance: info?.total_balance ?? null,
			granted_balance: info?.granted_balance ?? null,
			topped_up_balance: info?.topped_up_balance ?? null
		};
	}, cfg.cacheMs);

	const opencodeOnce = makeCache(async () => {
		const key = await resolveKey(ctx, cfg.opencodeApiKeyEnv);
		if (key === null) throw new Error(`未配置 OpenCode Go key(credentials: ${cfg.opencodeApiKeyEnv})`);
		const body = await getJSON(cfg.opencodeBaseUrl, "/v1/usage", key, cfg.timeoutMs);
		// Pass through the official shape: { usage: { rolling|weekly|monthly: { status, percent, resetsAt } } }
		return body?.usage ?? null;
	}, cfg.cacheMs);

	const jsonRoute = (loader) => async (_req, res) => {
		res.setHeader("content-type", "application/json; charset=utf-8");
		res.setHeader("cache-control", "no-store");
		try {
			res.end(JSON.stringify(await loader()));
		} catch (error) {
			res.statusCode = 502;
			res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
		}
	};

	ctx.webServer.register({
		kind: "exact",
		path: "/api/dsh-sidebar-balance/balance",
		handler: jsonRoute(balanceOnce)
	});
	ctx.webServer.register({
		kind: "exact",
		path: "/api/dsh-sidebar-balance/opencode",
		handler: jsonRoute(opencodeOnce)
	});

	// ── restart route ─────────────────────────────────────────────────────
	// The dsh web process runs as the launchd agent `com.dsh.web` (KeepAlive),
	// so the most reliable "restart" is: from a detached child, try the clean
	// launchctl kickstart first, then unconditionally SIGTERM our own PID —
	// launchd's KeepAlive restarts the job either way, picking up new bundle
	// layers. Everything we do is logged to /tmp/psb-restart.log.
	const RESTART_LOG = "/tmp/psb-restart.log";
	const logRestart = (line) => {
		try {
			const fd = openSync(RESTART_LOG, "a");
			writeSync(fd, `${new Date().toISOString()} ${line}\n`);
			closeSync(fd);
		} catch {
			// logging is best-effort
		}
	};
	if (cfg.restartEnabled) {
		ctx.webServer.register({
			kind: "exact",
			path: "/api/dsh-sidebar-balance/restart",
			handler: async (_req, res) => {
				res.setHeader("content-type", "application/json; charset=utf-8");
				const spec = parseRestartCommand(cfg.restartCommand, cfg.restartLabel);
				if (spec === null) {
					res.statusCode = 501;
					res.end(JSON.stringify({ ok: false, error: "当前环境不支持自动重启,请手动执行重启命令" }));
					return;
				}
				res.end(JSON.stringify({ ok: true, message: "重启指令已发送,服务即将重启" }));
				const ownPid = process.pid;
				const delay = Number(cfg.restartDelayMs);
				const at = Number.isFinite(delay) ? Math.max(delay, 100) : 600;
				logRestart(`restart requested; ownPid=${ownPid}; command=${[spec.command, ...spec.args].join(" ")}`);
				setTimeout(() => {
					// Detached shell: try the clean kickstart, then (after a
					// grace period) SIGTERM our own PID so launchd KeepAlive
					// respawns the job even if kickstart silently failed.
					const script =
						`${JSON.stringify(spec.command)} ${spec.args.map((a) => JSON.stringify(a)).join(" ")}; ` +
						`sleep 2; kill -TERM ${ownPid} 2>/dev/null; true`;
					try {
						const child = spawn("sh", ["-c", script], {
							detached: true,
							stdio: ["ignore", "ignore", "ignore"]
						});
						child.unref();
						logRestart(`spawned detached restart child pid=${child.pid ?? 0}`);
					} catch (error) {
						logRestart(`spawn failed: ${error instanceof Error ? error.message : String(error)}`);
					}
				}, at);
			}
		});
	}

	// ── self-host the browser bundle ──────────────────────────────────────
	const bundlePath = new URL("./client.js", import.meta.url);
	let bundleBytes = null;
	try {
		bundleBytes = readFileSync(bundlePath);
	} catch {
		// lib/client.js missing — widget unavailable; the routes still work.
	}
	if (bundleBytes !== null) {
		const rev = createHash("sha1").update(bundleBytes).digest("hex").slice(0, 12);
		ctx.webServer.register({
			kind: "exact",
			path: "/dsh-sidebar-balance/client.js",
			handler: async (_req, res) => {
				res.setHeader("content-type", "text/javascript; charset=utf-8");
				res.setHeader("cache-control", "no-cache");
				res.end(bundleBytes);
			}
		});
		ctx.webServer.tapIndex((html) => injectGraphRow(html, {
			id: "dsh-sidebar-balance",
			url: `/dsh-sidebar-balance/client.js?rev=${rev}`,
			rev,
			inject: ["@deepseek-ai/dsh-client-runtime"],
			immediately: true
		}));
	}
}
# dsh-sidebar-balance

> 极简主义 · 原生适配 · 零配置的 DeepSeek Harness 余额插件
> Minimalist, native-adaptive, zero-config balance widget for DeepSeek Harness.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-DeepSeek%20Harness-blue)](https://github.com/topics/dsh-plugin)
[![version](https://img.shields.io/badge/version-0.1.0-4176E6)](package.json)

一个「长在原生界面里」的余额小组件:常驻侧边栏底部,与「设置」同一行,不新增按钮、不改变布局。默认显示 **DeepSeek 官方账户余额**,右侧一枚 **OpenCode Go 套餐消耗圆环**;鼠标悬浮弹出磨砂玻璃卡片,同时展示 DeepSeek 余额明细与 Go 套餐三窗口余量。重启 dsh 由独立的 [dsh-restart](https://github.com/zhouchengke2046/dsh-restart) 插件负责,本插件只关注余额与用量。

---

```
┌─────────────────────────────┐
│ ⚙ 设置          ● ¥4.98 ◯   │ ← 常驻行:与设置同排,金额+Go 消耗圆环
└─────────────────────────────┘
        │ 悬浮
        ▼
┌──────────────────────────────┐
│ 💳 账户概览              ↻   │ ← 磨砂玻璃悬浮卡片
│ ┌──────────────────────────┐ │
│ │ DeepSeek 账户      [可用] │ │
│ │ ● ¥4.98                 │ │
│ │ 充值 ¥4.98 · 赠送 ¥0.00  │ │
│ └──────────────────────────┘ │
│ OpenCode Go 套餐             │
│ 滚动 (5h) 23% · 周 14% · 月 8%│
└──────────────────────────────┘
```

## 🖼️ 预览 / Preview

用模拟数据渲染的独立视觉预览(常驻行 + 悬浮卡,支持系统深浅色):直接打开 [docs/preview.html](docs/preview.html) 查看。

## ✨ 特性 / Features

- **🪶 极简主义** —— 单行融入侧边栏底部,与「设置」同排(设置靠左、金额靠右),不新增入口、不改变布局;金额是纯文字,无胶囊、无边框;`host` 半**零 npm 依赖**,整个插件零构建、纯手写 bundle
- **🎨 原生适配** —— 100% 消费 DSH 设计令牌(`--dsw-alias-*`),浅色/深色主题自动适配;注册在官方 `settings.trigger` 槽位,点击行为与内置完全一致(点击设置区域=打开设置,点击金额=仅刷新,绝不误触)
- **💰 双余额一屏看** —— 常驻 DeepSeek 官方余额(状态色圆点:≥10 绿 / 1–10 黄 / <1 红)+ **OpenCode Go 套餐消耗进度圆环**(取月窗口为套餐总量,≥70% 变黄、≥90% 变红);悬浮卡片同时给出 DeepSeek 明细(总/充值/赠送/状态)与 Go 三窗口(滚动 5h / 周 / 月:百分比 + 进度条 + 重置倒计时)
- **🔐 安全默认** —— API Key 只在宿主进程内解析(DSH credentials 服务),浏览器只拿到数字;数据路由全部同源/loopback,key 永不进入浏览器
- **📦 三路安装** —— npm / GitHub / 本地路径;纯 JS 零构建,git 安装**无需 allowBuilds** 授权
- **🔄 自动刷新** —— 余额与圆环每 60 秒刷新,点击立即刷新,失败优雅降级(保留旧值并标注)

## 🚀 安装 / Install

需要 DSH `0.1.0-rc.6+`(web profile)与 Node.js ≥ 18。

```sh
# 方式 A:GitHub(无需构建授权,纯源码即可运行)
dsh plugin --profile web add github:zhouchengke2046/dsh-sidebar-balance

# 方式 B:本地目录
dsh plugin --profile web add /path/to/dsh-sidebar-balance

# 方式 C:npm(发布后)
dsh plugin --profile web add dsh-sidebar-balance
```

然后**重启** `dsh web`(可用独立插件 [dsh-restart](https://github.com/zhouchengke2046/dsh-restart) 在设置页一键完成)并硬刷新页面(Cmd/Ctrl+Shift+R)。

## 🎯 使用 / Usage

- **常驻行**:侧边栏底部与「设置」同排 —— 左侧 ⚙ 设置(点击打开设置面板),右侧余额金额 + Go 消耗圆环;**点击金额只刷新、绝不打开设置**
- **悬浮**:鼠标移到金额上,弹出磨砂玻璃卡片,同时显示 DeepSeek 余额明细和 OpenCode Go 三窗口套餐余量,卡片内「刷新」按钮立即更新
- 侧边栏折叠(rail)时仅保留 ⚙ 图标,悬浮卡片照常可用

## ⚙️ 配置 / Configuration

零配置开箱即用,依赖 credentials 中的两个 key:

| Credential | 用途 |
|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek 官方余额(`GET /user/balance`) |
| `OPENCODE_GO_API_KEY` | OpenCode Go 套餐用量(`GET /zen/go/v1/usage`) |

可选覆盖(profile 的 `cordis.patch.yml`;重启功能见 [dsh-restart](https://github.com/zhouchengke2046/dsh-restart)):

```yaml
- insert:
    - id: dsh-sidebar-balance
      name: dsh-sidebar-balance
      config:
        balanceApiKeyEnv: DEEPSEEK_API_KEY
        balanceBaseUrl: https://api.deepseek.com
        opencodeApiKeyEnv: OPENCODE_GO_API_KEY
        opencodeBaseUrl: https://opencode.ai/zen/go
        cacheMs: 30000
        timeoutMs: 15000
```

## 🔧 卸载 / Uninstall

```sh
dsh plugin --profile web remove dsh-sidebar-balance
```

## 🏗️ 原理 / How it works

| 部分 | 文件 | 说明 |
|---|---|---|
| Host 半 | `lib/index.js` | 零依赖 Cordis 插件:两个同源 JSON 路由(`/api/dsh-sidebar-balance/balance`、`/opencode`),凭证经 credentials 服务解析;客户端 bundle 自托管于 `/dsh-sidebar-balance/client.js` 并经 `webServer.tapIndex` 注入 boot 图 |
| Browser 半 | `lib/client.js` | `window.__ModuleLoader__.load` 手写 bundle,注册进 `settings.trigger` 槽(priority -1 影子替换,单一槽位最低优先级渲染,行为与内置一致);磨砂玻璃卡片(backdrop-filter + 设计令牌);SVG 进度圆环 |
| 组合层 | `cordis.patch.yml` | `dsh.bundle` 补丁层,`dsh plugin add` 自动挂载 |

> 第三方 client 包不会被 client-modules 扫描,所以浏览器端通过 host 路由自托管 + `tapIndex` 注入,保证任意安装位置都能加载(与生态内同类方案一致)。

## 📋 兼容性 / Compatibility

- DeepSeek Harness `0.1.0-rc.6+`(web profile)
- Node.js ≥ 18
- 跨平台:纯 JS + 标准浏览器 CSS,无原生模块(重启能力由 [dsh-restart](https://github.com/zhouchengke2046/dsh-restart) 提供)

## 📄 License

MIT —— 见 [LICENSE](LICENSE)

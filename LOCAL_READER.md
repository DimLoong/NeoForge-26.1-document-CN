# NeoForge 26.1 中文阅读版（本地）

本仓库是 [NeoForged 官方文档](https://docs.neoforged.net) 的本地化副本，将 **NeoForge 26.1（当前版本）** 的正文文档翻译为简体中文，并将站点改造为**默认暗色、支持明暗切换、带阅读进度记忆**的现代技术文档阅读器。**仅供个人学习阅读**。

翻译工作在独立分支 `local-zh-reader` 上进行，未改动 Git 中的英文历史，也未删除其他版本与原有资源。

## 项目用途

- 基于 **Docusaurus 3**（React 19）的静态文档站，非新建项目。
- 只翻译 NeoForge 26.1（`docs/` 目录，即 Docusaurus 的 `current` 版本）。
- 历史版本（`versioned_docs/version-1.20.4` ~ `version-1.21.11`）保持英文原样，未翻译、未删除。

## 环境与命令

| 项 | 值 |
| --- | --- |
| Node 版本 | 项目 `.node-version` 要求 `24.15.0`（`engines` 为 `>=24`）。本机以 Node 22.18 亦可正常安装与构建；建议使用 24。 |
| 包管理器 | **npm**（仅存在 `package-lock.json`） |

```bash
# 安装依赖
npm install

# 本地开发服务器（热更新）
npm run start

# 正式构建（输出到 build/）
npm run build

# 本地预览构建产物
npm run serve

# 清理缓存与动态生成的分节
npm run clear

# 为标题生成显式 heading id（Docusaurus 内置）
npm run write-heading-ids
```

> 注意：`npm run start` / `npm run build` 会先执行 `node scripts/initialize.js`，从远程仓库克隆并生成 `primer/docs`、`toolchain/docs/plugins` 两个**动态分节**（NeoGradle / ModDevGradle / 版本导读等）。**首次**运行需要联网，且 NeoGradle 仓库较大，克隆可能耗时数分钟；生成后目录存在即不再重复克隆。这些动态分节是外部内容、每次构建可被覆盖，**不在本次翻译范围内**。

## 翻译范围

**已翻译（简体中文）**
- `docs/` 下全部 **77 篇 `.md`** 正文（NeoForge 26.1）。
- 16 个 `docs/**/_category_.json` 的侧边栏分类 `label`。
- 首页 `src/pages/index.md` 的可见文本与卡片文案。
- 导航栏、页脚、站点标题/标语（`docusaurus.config.js`）。
- 界面 UI 文本（上一页/下一页、提示框标签、搜索等）由 Docusaurus 内置 `zh-Hans` 翻译自动提供（`i18n.defaultLocale = 'zh-Hans'`）。

**未翻译（保持英文）**
- 所有历史版本 `versioned_docs/*`。
- 动态生成的 `primer/`、`toolchain/`（外部仓库内容，构建时覆盖）。
- `user/`、`modpack/` 独立文档集与 `src/pages/contributing.md`（贡献者向，非 26.1 正文）。
- 所有代码块内容（含注释）、代码标识符、路径、命令、URL —— 按技术翻译规范逐字保留。

## 主题（明暗模式）实现位置

- 颜色与排版：`src/css/custom.css`（`:root` 为亮色变量，`html[data-theme='dark']` 为暗色变量；完整设计两套主题）。
- 默认暗色配置：`docusaurus.config.js` 的 `themeConfig.colorMode`（`defaultMode: 'dark'`、`disableSwitch: false`、`respectPrefersColorScheme: false`）。
- 三栏阅读布局（左目录 / 中正文 / 右锚点）沿用 Docusaurus 文档布局，由 `custom.css` 精细化。

## 阅读进度实现位置

- 组件目录：`src/components/ReadingProgress/`
  - `index.tsx` —— 顶部进度条、滚动追踪、位置恢复、侧边栏滚动持久化、侧边栏已读标记。
  - `ContinueReading.tsx` —— 顶栏“继续阅读”入口与“清除阅读记录”（二次确认）。
  - `storage.ts` —— localStorage 读写（SSR 安全、节流、防无限增长）。
  - `types.ts` —— 类型定义。
  - `styles.module.css` —— 组件样式。
- 全局挂载：`src/theme/Root/index.tsx`（跨页面导航持续存在，`BrowserOnly` 仅客户端）。
- “继续阅读”注册：`src/theme/NavbarItem/ComponentTypes.tsx`（自定义 `custom-continueReading` navbar item）；原有的 `NavbarItem` 覆盖迁移到 `src/theme/NavbarItem/index.js`。

### localStorage 键名

```
neoforge-reader:v1:last-document   # 最后阅读的页面 pathname
neoforge-reader:v1:sidebar-scroll  # 左侧边栏滚动位置
neoforge-reader:v1:documents       # 各页面进度集合(DocumentProgress)
```

`DocumentProgress` 结构：`{ pathname, version, scrollY, progress(0~1), completed, lastReadAt, title }`。
- 当前页进度条随滚动更新，写入节流约 300ms。
- 阅读达到 90% 视为 `completed`。
- 重新进入页面：**无 hash** 时恢复上次 `scrollY`；**有 hash** 时优先跳转锚点。
- `documents` 上限 200 条，超出按最近阅读时间裁剪，避免无限增长。
- 支持多标签页 `storage` 事件同步“继续阅读”状态。

### 如何清除阅读记录

点击顶栏“继续阅读”按钮 → 弹出面板 → “清除记录” → 二次确认“确认清除”。仅删除上述 3 个 `neoforge-reader:v1:*` 键，**不调用 `localStorage.clear()`**，不影响主题选择等其他数据。

## 已知限制

- **搜索**：仍使用原项目的线上 Algolia（`docusaurus.config.js` 的 `algolia`）。其索引为英文官方站，本地中文内容不会被该索引覆盖；离线时搜索不可用。未引入本地全文搜索以避免增加复杂度与构建风险（详见 `translation/qa-report.md`）。
- **动态分节需联网**：见上文 `initialize.js` 说明。
- **历史遗留破损锚点**：原英文文档本身存在少量 broken anchors（如 `#TODO`、大小写不匹配的锚点），构建时为警告（`onBrokenAnchors` 默认 `warn`），不影响构建成功；本次未擅自改动这些原文事实。详见 `translation/qa-report.md`。
- 无独立 `tsc` 类型检查步骤（原项目即如此，TS 由 Babel 转译）。

## 相关产物

- `translation/glossary.md` —— 术语表
- `translation/manifest.json` —— 文件清单与状态
- `translation/status.json` —— 每文件翻译状态
- `translation/qa-report.md` —— 质量与验证报告

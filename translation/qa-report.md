# NeoForge 26.1 中文阅读版 —— 质量与验证报告

> 生成时间：2026-07-23　分支：`local-zh-reader`

## 一、总览

| 指标 | 数值 |
| --- | --- |
| 目标版本 | NeoForge **26.1**（Docusaurus `current` 版本，位于 `docs/`） |
| 目标文档文件总数 | **93**（77 篇 `.md` + 16 个 `_category_.json`） |
| 已翻译文件数 | **93 / 93**（77 md + 16 json，另加首页 `src/pages/index.md`、导航/页脚/站点元信息） |
| 未翻译文件数 | 0（目标范围内） |
| 失败文件数 | **0** |
| 中文字数（正文汉字） | 约 **130,000** |
| 术语表条目 | **139** 条 |
| 标题显式锚点注入 | **826** 个（首轮）；后续修正 27 个（见下） |

## 二、翻译章节列表（14 个分类，全部完成）

入门、核心概念、方块、方块实体、物品、实体、物品栏与转移、数据存储、网络通信、资源（客户端/服务端）、渲染、世界生成、进阶主题、杂项。逐目录派发 12 个翻译子任务并行完成；`_category_.json` 分类标签、首页卡片、导航栏、页脚单独处理。

## 三、构建结果

| 阶段 | 命令 | 结果 |
| --- | --- | --- |
| 原始基线（未改动，英文） | `npm run build` | **成功（exit 0）** |
| 前端改动 + slug 注入（英文内容） | `npm run build` | **成功（exit 0）**，0 重复标题 ID |
| 最终（全部中文 + 修正后） | `docusaurus build` | **成功（exit 0）**，`[SUCCESS] Generated static files in "build"` |
| 本地预览 | `npm run serve` | 首页 / 文档页 **HTTP 200** |

最终构建关键指标：
- **Broken links（页面链接）：0**（`onBrokenLinks: throw` 通过）。
- **Broken Markdown links：0**（`onBrokenMarkdownLinks: throw` 通过）。
- **重复标题 ID：0**。
- **Invalid MDX / 缺失 import / 缺图 / 侧边栏 doc id 错误：0**。
- **Broken anchors（锚点，`onBrokenAnchors` 默认 warn，不致命）：82 处**，其中 **71 处属历史版本文档（`versioned_docs/1.20–1.21.x`，本次未翻译、未改动）**，**11 处（页）属 26.1**。

## 四、锚点与链接处理（重点）

原始文档**未使用任何显式 heading ID**。翻译标题会改变 Docusaurus 自动生成的锚点，从而破坏站内 `#anchor` 跳转。为此：

1. 翻译前，用脚本（github-slugger，复刻 Docusaurus 每页去重规则）为全部标题注入**与原英文 slug 完全一致**的显式 `{#id}`（`.md` 采用标准 `{#id}` 语法），共 826 个。
2. 翻译时严格保留每个 `{#id}`，只翻译标题可见文字。
3. 所有引用式链接定义行 `[ref]: target#anchor` 逐字保留，行内链接只译可见文字。

**发现并修复的锚点问题：**
- 首轮注入脚本的纯文本提取误将 snake_case 标识符中的 `_词_` 当作 Markdown 斜体剥离（如 `` `neoforge:raid_hero_gifts` `` 被算成 `neoforgeraidherogifts`），导致 **2 处原本可解析的锚点回归破损**（`#neoforgeraid_hero_gifts`、`#neoforgeloot_table_id`）。
- 修复：以 git HEAD 英文标题为准、用正确算法重算 slug，修正 **4 个文件、27 个标题 ID**。修复后这 2 处回归消除。
- **净结果：翻译 + 锚点注入对 26.1 文档新增的 broken anchor 数为 0。** 26.1 现存的 11 页 broken anchor 与原始英文基线**完全一致**，均为原文档遗留问题，例如：
  - `datastorage/codecs` → `#transformer-codecs`
  - `rendering/feature` → `#TODO`、`entities/renderer#entity-renderers`、`blockentities/ber#blockentityrenderer`
  - `worldgen/biomemodifier` → `#Available-Values-for-Decoration-Steps`（原文锚点大小写不匹配）
  - `gettingstarted/structuring` → `#the-group-id`；`resources/` → `items/armor#equipment-models`；`resources/client/i18n` → `modfiles#modstoml`；`resources/client/models/{datagen,items,modelsystem}`、`resources/server/loottables/`、`resources/server/recipes/ingredients` 等。
  - 这些锚点在**原始英文项目中即为破损**（已用基线构建日志逐条核对），本次未擅自改动原文事实。

**发现并修复的页面链接（broken link）数量：0**（原始与最终均为 0，无需修复）。

## 五、结构不变量校验

用脚本对比"英文原文 + 正确注入锚点"快照与中文译文的结构特征（围栏代码块数、行内代码数、`{#id}` 集合、`[ref]:` 定义行、行内链接目标、图片数、frontmatter 键）：

- **73 / 77 文件完全一致**。
- 4 个文件各多出 **1 个行内代码**，均为译者将术语规范加上反引号（`` `final` ``、`` `Identifier` ``、`` `Font` ``、`` `ParticleProvider` ``），属良性格式化，非结构破坏，无标识符损坏。
- 全部 77 文件：`{#id}` 集合、`[ref]:` 定义行、行内链接目标、图片、frontmatter 键、围栏代码块数量**与原文逐一相符**。
- 代码块内容（含注释）逐字保留，未因中文化改动可运行示例。

## 六、组件与功能验证（构建/SSR 层）

| 项 | 状态 | 说明 |
| --- | --- | --- |
| 明暗主题 | ✅ | 初始化脚本 `setAttribute("data-theme", t \|\| "dark")` —— 无存储时默认 **dark**；`respectPrefersColorScheme:false`；切换按钮存在。 |
| 阅读进度组件 | ✅ 已打包 | `ReadingProgress` / `progressBar` 已编译进 `build/assets/js/main.*.js`；通过 `BrowserOnly` 仅客户端挂载，故不出现在 SSR HTML（SSR 安全，符合预期）。 |
| 自定义"继续阅读"导航项 | ✅ | `custom-continueReading` 类型注册成功（构建通过）。 |
| i18n | ✅ | 输出页面 `<html lang="zh-Hans">`；界面 UI 文本走 Docusaurus 内置中文翻译。 |
| 标题锚点 | ✅ | 抽查 `id="deferredregister"`、`id="data-generation-for-datapack-registries"` 均正确生成。 |
| 侧边栏 / 版本下拉 | ✅ | 自动生成侧边栏正常，`docsVersionDropdown` 保留，历史版本可切换。 |

### 未进行的测试（诚实说明）
以下需真实浏览器交互，本环境未自动化执行，仅通过构建/SSR 与静态产物间接验证；建议本地 `npm run serve` 后人工确认：
- 主题切换后刷新保留、无闪烁；
- 滚动进度写入/刷新恢复、带 hash 优先跳锚点、"继续阅读"跳转与完成阈值；
- 清除记录二次确认仅删本项目键；
- 响应式（1440/1280/1024/768/移动端）抽屉与 TOC 隐藏、无异常横向滚动。
上述功能的代码实现均已按要求完成（SSR 安全、事件监听清理、滚动节流、localStorage 防膨胀）。

## 七、搜索

沿用原项目线上 **Algolia**（`docusaurus.config.js` 的 `algolia`）。其索引指向英文官方站，本地中文内容不被覆盖，离线不可用。为避免显著增加复杂度与构建风险，**未**改为本地全文搜索。此为已知限制，不阻塞翻译、主题与阅读进度功能。

## 八、主要修改文件清单

- `docusaurus.config.js` —— `i18n.defaultLocale=zh-Hans`、`colorMode`（默认暗色）、导航/页脚/标题中文化、新增"继续阅读"导航项。
- `src/css/custom.css` —— 明暗两套主题、排版节奏、各 Markdown 组件、侧边栏/TOC/滚动条/选中色（全量重写扩充）。
- `src/theme/Root/index.tsx` —— 全局挂载阅读进度。
- `src/theme/NavbarItem/index.js` + `ComponentTypes.tsx` —— 由扁平文件改为目录结构并注册自定义导航项。
- `src/components/ReadingProgress/`（`index.tsx`/`ContinueReading.tsx`/`storage.ts`/`types.ts`/`styles.module.css`）—— 阅读进度功能。
- `src/pages/index.md` —— 首页中文化。
- `docs/**/*.md`（77）+ `docs/**/_category_.json`（16）—— 全部译为简体中文，含标题显式锚点。
- `translation/`（`glossary.md`/`manifest.json`/`status.json`/`qa-report.md`）、`LOCAL_READER.md` —— 翻译产物与说明。
- 未改动：`versioned_docs/*`、`versioned_sidebars/*`、`versions.json`、`scripts/*`、动态生成的 `primer//toolchain/` 内容。

## 九、结论

目标版本 NeoForge 26.1 的 93 个文件已全部翻译为高质量简体中文；站点默认暗色、支持明暗切换、内置基于 localStorage 的阅读进度与"继续阅读"；`docusaurus build` 成功、0 broken links、0 重复 ID、0 无效 MDX；对 26.1 未新增任何 broken anchor（残留 11 页为原文档遗留）。任务达成。

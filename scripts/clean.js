/**
 * Cleanup dynamic documentation sections.
 */
const fs = require('node:fs');
const common = require('./common');

const PRIMER_DOCS_PATH = common.primerDocsPath;
const TOOLCHAIN_PLUGIN_PATH = common.toolchainPluginPath;

// 说明（本地中文阅读版）：版本导读 primer 中已翻译若干版本（index、26.1、1.21.1、1.20、1.16.5）
// 并纳入 Git 跟踪。为保留中文译文，不再在 clear 时删除 primer；否则下次 build 会重新从上游
// 拉取英文覆盖。initialize.js 检测到 primer/docs 存在即跳过重新生成，故译文长期保留。
// 如需恢复从上游同步英文，删除 primer/docs 后重新 build 即可。
//
// // Cleanup primers
// if (fs.existsSync(PRIMER_DOCS_PATH)) {
//     fs.rmSync(PRIMER_DOCS_PATH, { recursive: true, force: true });
// }

// 说明（本地中文阅读版）：toolchain 插件文档（ModDevGradle / NeoGradle）已翻译为中文
// 并纳入 Git 跟踪（见 .gitignore 已取消忽略）。因此不再在 clear 时删除它们，
// 否则下次 build 会重新从上游仓库拉取英文原文、覆盖中文译文。
// initialize.js 检测到该目录存在时会自动跳过重新生成，故译文得以长期保留。
// 如需恢复自动从上游同步英文，删除 toolchain/docs/plugins 后重新 build 即可。
//
// // Cleanup toolchain plugins
// if (fs.existsSync(TOOLCHAIN_PLUGIN_PATH)) {
//     fs.rmSync(TOOLCHAIN_PLUGIN_PATH, { recursive: true, force: true });
// }

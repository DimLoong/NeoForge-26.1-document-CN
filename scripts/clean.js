/**
 * Cleanup dynamic documentation sections.
 */
const fs = require('node:fs');
const common = require('./common');

const PRIMER_DOCS_PATH = common.primerDocsPath;
const TOOLCHAIN_PLUGIN_PATH = common.toolchainPluginPath;

// Cleanup primers
if (fs.existsSync(PRIMER_DOCS_PATH)) {
    fs.rmSync(PRIMER_DOCS_PATH, { recursive: true, force: true });
}

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

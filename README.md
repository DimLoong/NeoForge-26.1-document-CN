<p align="center">
  <img src="static/img/index%20illu%200.webp" alt="NeoForge 文档插图" width="33%" height="auto" />
</p>

<h1 align="center">NeoForge 非官方中文文档</h1>

<p align="center">
  面向 Minecraft Mod 开发者的 NeoForge 非官方简体中文文档。
</p>

<p align="center">
<a href="https://neoforge-docs-cn.dimloong.workers.dev/">在线阅读此文档</a>
·
<a href="https://docs.neoforged.net/">官方英文文档</a>
·
<a href="https://github.com/neoforged/Documentation">上游仓库</a>
·
<a href="https://github.com/DimLoong/NeoForge-26.1-document-CN/issues">反馈问题</a>
</p>

## 关于本项目

本仓库基于 [NeoForged 官方文档](https://github.com/neoforged/Documentation)进行中文本地化，并使用 [Docusaurus 3](https://docusaurus.io/) 构建。内容涵盖 NeoForge Mod 开发、工具链、用户指南、整合包开发与不同 Minecraft 版本的迁移导读。

这是由社区维护的**非官方翻译版本**，可能存在翻译错误、内容缺失或落后于上游的情况。涉及 API 行为、版本兼容性与发布决策时，请以官方英文文档和对应版本源码为准。

## 翻译进度

| 内容                                | 状态                     |
| ----------------------------------- | ------------------------ |
| NeoForge 26.1 文档                  | 已翻译                   |
| NeoForge 1.21–1.21.1 文档           | 已翻译                   |
| 26.1、1.21.1、1.20、1.16.5 版本导读 | 部分内容已翻译           |
| 其他历史版本                        | 保留上游内容，持续维护中 |

版本选择器中的“已翻译”标记表示该版本的主体文档已有中文内容，但不代表所有页面、代码注释和外部链接均已完成本地化。

## 本地预览

环境要求：

- [Node.js 24](https://nodejs.org/)（具体版本见 `.node-version` 或 `.nvmrc`）
- npm

安装依赖并启动开发服务器：

```bash
npm ci
npm run start
```

启动后可在终端显示的本地地址预览文档；大多数内容和样式修改都会自动刷新。

## 构建

```bash
npm run build
```

构建产物会生成在 `build/` 目录中。提交改动前建议至少执行一次完整构建，以检查无效链接、MDX 语法和版本化文档配置。

如需在本地检查构建结果：

```bash
npm run serve
```

## 内容结构

```text
docs/                当前版本 NeoForge 文档
versioned_docs/      历史版本 NeoForge 文档
primer/docs/         各 Minecraft / NeoForge 版本导读
toolchain/           工具链文档
user/                用户指南
modpack/             整合包开发文档
src/pages/           首页等自定义页面
src/css/             站点样式
static/              Logo、首页背景和插图等静态资源
```

## 参与贡献

欢迎修正错译、补充遗漏内容或改进页面体验。提交修改时请：

1. 确认目标文档所属的 Minecraft / NeoForge 版本。
2. 保留代码、类名、方法名、命令和路径等技术标识的原文。
3. 尽量让术语在不同页面之间保持一致。
4. 使用 `npm run build` 验证站点能够正常构建。

若问题来自上游英文文档，请优先向 [NeoForged Documentation](https://github.com/neoforged/Documentation) 反馈。

## 许可证

文档内容沿用上游项目的许可证与版权声明。NeoForged、NeoForge、Minecraft 及相关名称和素材的权利归各自所有者所有。

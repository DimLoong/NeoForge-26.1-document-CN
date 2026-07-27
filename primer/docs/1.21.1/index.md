---
title: 1.21 -> 1.21.1
sidebar_position: 13
---
# Minecraft 1.21 -> 1.21.1 Mod 迁移导读 {#minecraft-121---1211-mod-migration-primer}

本文概览性、非详尽地介绍如何将你的 Mod 从 1.21 迁移到 1.21.1。文中不涉及任何具体的 Mod 加载器，只关注原版类的改动。所有给出的名称均使用官方的 mojang 映射。

本导读采用 [Creative Commons Attribution 4.0 International](http://creativecommons.org/licenses/by/4.0/) 许可证授权，欢迎将其用作参考，并保留链接，以便其他读者也能阅读本导读。

如有任何错误或遗漏的信息，请在本仓库提交 issue，或在 Neoforged Discord 服务器中 ping @ChampionAsh5357。

## 小型迁移 {#minor-migrations}

以下列出一些有用或有趣的新增、改动与移除，它们不足以在导读中单独成节。

### 新增 {#additions}

- `net.minecraft.commands.arguments.selector.EntitySelectorParser#allowSelectors` —— 返回可用的选择器提供者是否至少具备创造模式权限。
- `net.minecraft.world.level.block.entity.BlockEntity#isValidBlockState` —— 返回该方块状态能否拥有当前的方块实体。

### 移除 {#removed}

- `net.minecraft.commands.arguments.selector.EntitySelectorParser(StringReader)`

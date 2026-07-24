---
sidebar_position: 1
---

# 安装 NeoForge 客户端 {#installing-a-neoforge-client}

_本文假设你[已安装正确版本的 Java][java]，并且使用（原版）Minecraft 启动器。如果你使用的是[第三方启动器][launchers]，请改为查阅其相应文档。_

## 安装 {#installing}

安装 NeoForge 的步骤：

- 关闭你的 Minecraft 启动器。
- 从 [NeoForged 官网][neoforged] 下载 `.jar` 安装程序。
- 确保已选择 `Install client`，然后点击 `Proceed`。
- 打开 Minecraft 启动器，此时应当出现一个 NeoForged 的运行选项。

尽管你可以直接使用该运行选项，但在处理带 Mod 的实例时，我们建议改用自定义启动配置，以便将 Mod 与原版游戏隔离开。为此，Minecraft 启动器允许你在 Installations 标签页中创建自定义配置：

- 前往 Installations 标签页。
- 点击 "New Installation"。
- 为新的安装配置命名。
- 选择所需的 NeoForge 版本。
- 选择游戏目录。该目录应当是标准 [`.minecraft`][dotminecraft] 目录之外的一个单独文件夹。
- 点击 "Install" 并启动该配置。

## 添加 Mod {#adding-mods}

首次启动游戏后，指定的游戏目录中会出现一个 `mods` 文件夹。你需要把 Mod 文件放到这里。

Mod 文件只应从可信来源下载。我们通常建议你从 [CurseForge][curseforge] 或 [Modrinth][modrinth] 获取 Mod。

## 更新 {#updating}

要更新你的 NeoForge 版本，只需按上文所述下载并运行新版 NeoForge 的安装程序即可。然后，前往启动器的 Installations 标签页，将你 NeoForge 配置中的版本改为新版本。

:::danger
更新 NeoForge 或 Mod 前，请务必备份你的世界！

要备份世界，打开游戏目录并选中 `saves` 子文件夹。然后，把以你世界名称命名的文件夹（例如 `New World`）复制到一个安全的位置。

如果更新过程中出现任何问题，删除更新后的世界文件夹，将 NeoForge 和/或 Mod 降回之前使用的版本，然后把你的世界备份复制回 `saves` 文件夹。
:::

## 安装整合包 {#installing-modpacks}

Minecraft 启动器不提供自动安装整合包（即成套 Mod 及其关联配置文件的集合）的功能。这通常属于[第三方启动器][launchers]的范畴。

:::tip
如果你要自己制作整合包，我们建议你看看[整合包文档][modpack]，其中有一些实用技巧。
:::

[curseforge]: https://www.curseforge.com/minecraft/search?class=mc-mods
[dotminecraft]: https://minecraft.wiki/w/.minecraft
[java]: index.md#java
[launchers]: launchers.md
[modpack]: /modpack/docs
[modrinth]: https://modrinth.com/mods
[neoforged]: https://neoforged.net

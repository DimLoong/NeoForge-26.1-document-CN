---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 故障排查与常见问题 {#troubleshooting--faq}

本页列出了安装或运行 NeoForge 整合包时的一些常见问题。如果这里没有涵盖你的问题，请参阅 [获取支持][support] 一节。

## 安装 Java 或 NeoForge {#installing-java-or-neoforge}

### 我下载了安装程序文件，但没办法运行它！ {#i-downloaded-the-installer-file-but-i-have-no-way-of-running-it}

请参阅 [安装 Java][installjava] 一节。是的，即便你已经装有 Minecraft: Java Edition 也一样。

### 我安装了 Java，但版本还是不对！ {#i-installed-java-but-im-still-getting-the-wrong-version}

这很可能意味着你的 PATH 变量未设置，或设置有误。PATH 变量是一个系统变量，用于告诉电脑在哪里找到 Java。要修复它，请根据你的操作系统执行以下操作：

<Tabs defaultValue="windows">
  <TabItem value="windows" label="Windows">
下载并运行 [Jarfix 程序][jarfix]。
  </TabItem>
  <TabItem value="macos" label="MacOS">
打开 Finder。在 Finder 中打开 Applications/Utilities 文件夹，双击 Terminal。

运行以下命令：

- `echo export "JAVA_HOME=\$(/usr/libexec/java_home)" >> ~/.zshenv`
- `echo export "PATH=$PATH:$JAVA_HOME/bin" >> ~/.zshenv`

然后，关闭 Terminal 并重试。
  </TabItem>
  <TabItem value="linux" label="Linux">
许多常见的 Linux 发行版都有专门管理 PATH 变量的程序。请参阅它们各自的 Java 安装说明：

<ul>
  <li>[在 Arch 上安装 Java][arch]</li>
  <li>[在 Debian 上安装 Java][debian]</li>
  <li>[在 Fedora 上安装 Java][fedora]</li>
  <li>[在 Ubuntu 上安装 Java][ubuntu]</li>
</ul>

如果你使用的是其他发行版，则需要自行查找该发行版对应的方法，或通过控制台手动设置 PATH 变量。

为此，打开你所用 Linux 发行版的终端。常见名称有 `GNOME Terminal` 或 `Konsole`，但具体可能因你的实际环境而异。

找到 Java 的存放位置。通常类似于 `/usr/lib/jvm/java-21-openjdk-amd64`。

运行以下命令：

- `echo export "JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64/" >> ~/.bashrc`（如有需要，请把路径替换为实际路径）
- `echo export "PATH=$PATH:$JAVA_HOME/bin" >> ~/.bashrc`

然后，关闭终端并重试。
  </TabItem>
</Tabs>

### 我遇到一个报错，说 "Could not find or load main class @user_jvm_args.txt"，该怎么办？ {#i-am-getting-an-error-saying-could-not-find-or-load-main-class-user_jvm_argstxt-what-do-i-do}

这通常有两个常见原因：

- 你运行的 Java 版本过旧。请参阅 [安装 Java][installjava] 一节。
- 你的电脑上装有多个版本的 Java，可能其中一个是你刚刚才安装的，但电脑仍在使用旧版本。这意味着你的 PATH 变量设置不正确。请按照[此处][wrongjava]列出的步骤操作。

## 游玩 NeoForge {#playing-neoforge}

<!--
This subsection is used as the target for links.neoforged.net/early-display-errors. Avoid changing the title, or update the short link target as well if necessary.
-->
### 早期显示错误 {#early-display-errors}

如果你正在阅读本节，那么你很可能是被启动早期出现的某条错误消息重定向到这里的。原因是在尝试构建"早期加载进度"窗口时出了问题，这通常意味着你系统的图形设置有问题。

- 参阅 [Minecraft 官方的视频与图形问题 FAQ][mcdriver]，并按其中列出的步骤操作。
- 如果这没有帮助，尝试更新你的显卡驱动。见下方 [我遇到画面问题！][visual]。
- 如果这也没有帮助，请[到 Discord 服务器上找我们聊聊][support]，因为显然有很严重的问题。不过，作为一种变通办法：
    - 打开你的实例文件夹。如果你使用[第三方启动器][launcher]，它们通常会提供一个类似"Open Instance Folder"（打开实例文件夹）的按钮。如果你使用原版启动器，请使用你在[带 Mod 的配置][clientinstall]中设置的文件夹。
    - 进入 `config` 文件夹。
    - 用你喜欢的文本编辑器（例如 Windows 记事本）打开 `fml.toml` 文件。
    - 将 `earlyWindowControl=true` 这一行改为 `earlyWindowControl=false`。
    - 保存修改后的文件。
    - 再次尝试启动游戏。

### 我的游戏卡顿！该怎么办？ {#my-game-is-lagging-what-can-i-do}

先判断问题出在服务端还是客户端（或两者都有）。

- 如果你的游戏帧率（每秒帧数，FPS）很低，请阅读 [我的客户端卡顿！该怎么办？][clientlag]
- 如果你的游戏帧率还算不错，但世界卡顿（机器运转过慢、生物移动画面滞后等），请阅读 [我的服务端卡顿！该怎么办？][serverlag]

### 我的服务端卡顿！该怎么办？ {#my-server-is-lagging-what-can-i-do}

这可能有多种原因。一个常见的元凶是附近有太多实体（即生物或掉落物）或方块实体（即箱子、机器等）。

如果你想确切了解是什么在造成卡顿，可以尝试使用 [Spark][spark] Mod。Spark 是一个性能分析器，能告诉你各个代码路径分别耗时多少。使用方法：

- 加入一个世界。
- 运行 `/spark profiler` 命令。
- 等待几分钟。
- 运行 `/spark profiler --stop` 命令。
- 打开链接查看，或者，如果你看不懂，把它发到 [Discord 服务器][support] 的 `#user-support` 频道，我们会尽力帮你。

### 我的客户端卡顿！该怎么办？ {#my-client-is-lagging-what-can-i-do}

这通常是因为 Minecraft 本身并不是一款经过很好优化的游戏，而 Mod 可能会让情况更糟。

如果你正在使用光影，很有可能是你的显卡不够强、带不动它们。尝试禁用光影，看看问题是否得到解决。

如果你想确切了解是什么在造成卡顿，可以尝试使用 [Spark][spark] Mod。Spark 是一个性能分析器，能告诉你各个代码路径分别耗时多少。使用方法：

- 加入一个世界。
- 运行 `/sparkc profiler` 命令。（注意这里用的是 `/sparkc`，而不是分析服务端所用的 `/spark`。）
- 等待几分钟。
- 运行 `/sparkc profiler --stop` 命令。
- 打开链接查看，或者，如果你看不懂，把它发到 [Discord 服务器][support] 的 `#user-support` 频道，我们会尽力帮你。

### 我该如何找出有问题的 Mod？ {#how-do-i-find-a-faulty-mod}

如果你需要找出有问题的 Mod，却毫无头绪从何下手，那么最好的办法或许是使用二分查找。二分查找是一种常用的方法，用于在众多事物中找出有问题的那个，而无需逐一排查。用在 Mod 上，具体如下：

1. 移除现有 Mod 的一半，把它们放进另一个文件夹。
    - 确保依赖关系（即需要其他 Mod 的 Mod）保持完整。
2. 运行游戏。
3. 查看问题是否仍然存在。
    - 如果是：以当前保留的 Mod 为基础，从第 1 步重复。
    - 如果否：把最近添加的那批 Mod 换成最近移出去的那批，然后从第 1 步重复。
4. 如此重复，直到你找出有问题的 Mod。

### 我遇到画面问题！ {#i-am-having-visual-issues}

画面问题往往由过旧的显卡驱动引起。请根据你的显卡品牌更新显卡驱动：[AMD][amd] | [Intel][intel] | [NVIDIA][nvidia]

如果更新显卡驱动后问题仍然存在，请参阅 [获取支持][support]。

## 获取支持 {#getting-support}

如果这里没有涵盖你的问题，欢迎随时加入 [Discord 服务器][discord]，在 `#user-support` 频道寻求帮助。这样做时，如果可以的话，请提供以下信息：

- 一份日志（一种特殊的文本文件）。
    - 如果你在安装过程中遇到问题，日志与安装程序本身位于同一位置，文件名在安装程序名称后附加了 `.jar`（如果你启用了文件扩展名显示，则为 `.log`）。
    - 如果你在游戏过程中遇到问题，日志位于你的实例文件夹中。进入 `logs` 文件夹，使用名为 `debug` 的文件，如果你启用了文件扩展名显示，则为 `debug.log`。
- 一份 [Spark 报告][sparkreport]（如果你生成过的话）。

### 找不到 `debug.log`！ {#there-is-no-debuglog}

如果你使用 [CurseForge 应用][curseforge] 游玩，有可能是该应用禁用了 `debug.log` 文件的创建。如果是这种情况，你需要重新启用它。操作方法：

- 打开 Settings（左下角的齿轮图标）。
- 在 Game-Specific Settings 下，找到 Minecraft。
- 在 Advanced 下，打开 "Enable Forge debug.log" 选项。

然后，重新启动游戏以生成一份全新的 `debug.log`。

如果你没有使用 CurseForge，或者你使用了 CurseForge 并已启用日志选项，但仍然没有 `debug.log`，那么有可能是游戏在 `debug.log` 得以创建之前就崩溃了。这种情况下，启动器日志可以为我们提供帮助。

要获取启动器日志，打开你的 [`.minecraft`][dotminecraft] 文件夹，找到 `launcher_log` 文件（如果你启用了文件扩展名显示，则为 `launcher_log.txt`）。

### 我的 .minecraft 文件夹在哪里？ {#where-is-my-minecraft-folder}

根据你的操作系统，`.minecraft` 文件夹可在以下位置找到：

<Tabs defaultValue="windows">
  <TabItem value="windows" label="Windows">
`%APPDATA%\.minecraft`
  </TabItem>
  <TabItem value="macos" label="MacOS">
`~/Library/Application Support/minecraft`
  </TabItem>
  <TabItem value="linux" label="Linux">
`~/.minecraft`
  </TabItem>
</Tabs>

[amd]: https://www.amd.com/en/support
[arch]: https://wiki.archlinux.org/title/Java
[clientinstall]: client.md#installing
[clientlag]: #my-client-is-lagging-what-can-i-do
[curseforge]: launchers.md#curseforge-app
[debian]: https://wiki.debian.org/Java
[discord]: https://discord.neoforged.net/
[dotminecraft]: #where-is-my-minecraft-folder
[fedora]: https://docs.fedoraproject.org/en-US/quick-docs/installing-java
[intel]: https://www.intel.com/content/www/us/en/support/detect.html
[installjava]: index.md#installing-java
[jarfix]: https://johann.loefflmann.net/en/software/jarfix/index.html
[launcher]: launchers.md
[mcdriver]: https://aka.ms/mcdriver
[nvidia]: https://www.nvidia.com/download/index.aspx
[serverlag]: #my-server-is-lagging-what-can-i-do
[spark]: https://www.curseforge.com/minecraft/mc-mods/spark
[sparkreport]: #my-game-is-lagging-what-can-i-do
[support]: #getting-support
[ubuntu]: https://ubuntu.com/tutorials/install-jre
[visual]: #i-am-having-visual-issues
[wrongjava]: #i-installed-java-but-im-still-getting-the-wrong-version

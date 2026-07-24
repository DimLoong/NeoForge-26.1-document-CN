---
sidebar_position: 0
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# NeoForge 用户指南 {#neoforge-user-guide}

无论你是普通玩家、整合包开发者还是服务端管理员，本指南都旨在帮助你完成让电脑运行 NeoForge 的准备工作，并解答一些常见问题。

本指南主要介绍如何使用 Mojang 提供的官方 Minecraft 启动器安装 NeoForge。此外还有若干第三方启动器，它们大多能自动完成这一过程，[第三方启动器][launchers]一文介绍了其中一部分。

## Java {#java}

要运行 NeoForge，你首先需要在电脑上安装 Java。Java 是 Minecraft 和 NeoForge 所用的编程语言。Minecraft 会通过启动器下载所需的 Java 版本，而 NeoForge 则要求你自行安装 Java。

所需的 Java 版本因你想运行的 Minecraft 版本而异：

| Minecraft version | Java version |
|:-----------------:|:------------:|
|   1.20.2-1.20.4   |      17      |
|   1.20.5-latest   |      21      |

:::info
虽然 Minecraft **1.20.1** 也有对应的 NeoForge，但我们建议在该版本上改用 Forge，因为 Forge 对 Minecraft 1.20.1 的支持时间更长。我们只推荐在 Minecraft 1.20.2 及更新版本上使用 NeoForge。
:::

### 检测 Java {#testing-for-java}

_如果你确定自己没有安装 Java，可以直接跳到 [安装 Java][installingjava]。_

很多情况下，你的系统可能已经装有 Java。因此，你需要先确认版本是否正确。

- 打开终端。具体操作方式取决于你所使用的操作系统：

<Tabs defaultValue="windows">
  <TabItem value="windows" label="Windows">
在左下角的开始菜单中搜索 `Command Prompt` 并按回车。
  </TabItem>
  <TabItem value="macos" label="MacOS">
打开 Finder。在 Finder 中打开 Applications/Utilities 文件夹，双击 Terminal。
  </TabItem>
  <TabItem value="linux" label="Linux">
打开你所用 Linux 发行版的终端。常见名称有 `GNOME Terminal` 或 `Konsole`，但具体可能因你的实际环境而异。
  </TabItem>
</Tabs>

- 输入以下命令：`java -version` 并按回车。
- 如果显示错误，说明尚未安装 Java，你可以跳到 [安装 Java][installingjava] 一节。
- 如果已安装 Java，你应该会看到类似下面的输出：
```
openjdk version "21.0.4" 2024-07-16 LTS
OpenJDK Runtime Environment Temurin-21.0.4+7 (build 21.0.4+7-LTS)
OpenJDK 64-Bit Server VM Temurin-21.0.4+7 (build 21.0.4+7-LTS, mixed mode, sharing)
```
- 确认 `version` 后面的第一个数字与目标 Minecraft 版本所需的 Java 版本一致。
  - 例如，`openjdk version "21.0.4" 2024-07-16 LTS` 是 Java 21，适用于 Minecraft 1.20.5 及更新版本。
  - 如果版本不匹配，你需要 [安装正确的 Java 版本][installingjava]。
- 如果一切顺利，请继续前往 [安装 NeoForge][installingneoforge]。

### 安装 Java {#installing-java}

安装 Java 的方式取决于你的操作系统。请务必确认你获取的是正确的 Java 版本，并且是 64 位版本，因为现代版本的 Minecraft 已不再支持 32 位的 Java。

<Tabs defaultValue="windows">
  <TabItem value="windows" label="Windows">
从 [Adoptium 项目](https://adoptium.net/temurin/releases/?version=21&os=windows) 下载 JDK 的 `.msi` 安装包。在文件系统中打开刚下载的 `.msi` 文件，双击并按照安装程序完成安装。
  </TabItem>
  <TabItem value="windows_server" label="Windows (Server)">
使用以下 `winget` 命令下载 JDK（如有需要请修改版本号）：

```
winget install -e --id=Microsoft.OpenJDK.21
```
  </TabItem>
  <TabItem value="macos" label="MacOS">
从 [Adoptium 项目](https://adoptium.net/temurin/releases/?version=21&os=mac) 下载 JDK 的 `.pkg` 安装包。在文件系统中打开刚下载的 `.pkg` 文件，双击并按照安装程序完成安装。
  </TabItem>
  <TabItem value="linux" label="Linux">
打开你所用 Linux 发行版的终端。常见名称有 `GNOME Terminal` 或 `Konsole`，但具体可能因你的实际环境而异。

然后，使用系统的包管理器（例如 Ubuntu 和 Debian 上的 `apt`、CentOS 上的 `yum`、Fedora 上的 `dnf`，或 Arch 上的 `pacman`）安装 Java。软件包的确切名称可能不同，但一般来说 `openjdk-21`（如有需要请替换版本号）之类的名称通常是不错的选择。

某些发行版还提供了安装 Java 的文档和/或额外工具：

<ul>
  <li>[在 Arch 上安装 Java][arch]</li>
  <li>[在 Debian 上安装 Java][debian]</li>
  <li>[在 Fedora 上安装 Java][fedora]</li>
  <li>[在 Ubuntu 上安装 Java][ubuntu]</li>
</ul>

  </TabItem>
</Tabs>

安装完成后，建议再次 [检测 Java][testingforjava]，以确保一切正常。

## 安装 NeoForge {#installing-neoforge}

成功安装 Java 后，你就可以安装 NeoForge 本身了。

- 如果你想在单人模式下游玩 NeoForge，或加入 NeoForge 服务端，请阅读 [安装 NeoForge 客户端][client]。
- 如果你想使用 NeoForge 运行服务端，请阅读 [安装 NeoForge 服务端][server]。

## 更多帮助 {#further-help}

本指南涵盖了你作为 NeoForge 用户可能遇到的大多数问题，但并不追求面面俱到，你仍可能碰到这里未涉及的问题。

常见问题可在 [故障排查与常见问题][faq] 一文中找到。如需进一步支持，请参阅常见问题中的 [获取支持][support] 一节。

[arch]: https://wiki.archlinux.org/title/Java
[client]: client.md
[debian]: https://wiki.debian.org/Java
[faq]: faq.md
[fedora]: https://docs.fedoraproject.org/en-US/quick-docs/installing-java
[installingjava]: #installing-java
[installingneoforge]: #installing-neoforge
[launchers]: launchers.md
[server]: server.md
[support]: faq.md#getting-support
[testingforjava]: #testing-for-java
[ubuntu]: https://ubuntu.com/tutorials/install-jre

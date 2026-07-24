---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 安装 NeoForge 服务端 {#installing-a-neoforge-server}

_本文假设你[已安装正确版本的 Java][java]。_

## 安装 {#installing}

<Tabs defaultValue="unix">
  <TabItem value="unix" label="UNIX-like (Linux, macOS, FreeBSD, etc.)">
在 Linux、macOS、BSD 或任何类 UNIX 操作系统上运行 NeoForge 服务端，前提是你会使用基本的终端命令。


- 进入你想要安装服务端的文件夹。
- 使用以下命令从 Maven 下载 `.jar` 安装程序（请按需替换版本号和 `-beta` 标签）：
<Tabs defaultValue="linux">
  <TabItem value="linux" label="GNU/Linux">
```shell
wget https://maven.neoforged.net/releases/net/neoforged/neoforge/21.4.111-beta/neoforge-21.4.111-beta-installer.jar
```
</TabItem>
<TabItem value="mac" label="macOS">
```shell
curl -LO https://maven.neoforged.net/releases/net/neoforged/neoforge/21.4.111-beta/neoforge-21.4.111-beta-installer.jar
```
</TabItem>
<TabItem value="freebsd" label="FreeBSD">
```shell
fetch https://maven.neoforged.net/releases/net/neoforged/neoforge/21.4.111-beta/neoforge-21.4.111-beta-installer.jar
```
</TabItem>
<TabItem value="openbsd" label="OpenBSD">
```shell
ftp https://maven.neoforged.net/releases/net/neoforged/neoforge/21.4.111-beta/neoforge-21.4.111-beta-installer.jar
```
</TabItem>
</Tabs>
- 使用 `java -jar /path/to/neoforge-installer.jar --installServer` 运行安装程序。
- （可选）在新生成的 `user_jvm_args.txt` 文件中修改分配给服务端的内存量，以及可能需要的其他 JVM 参数。更多信息请参见该文件中的注释。
- 使用 `./run.sh` 启动服务端。首次运行时它会自动关闭。
- 打开 `eula.txt` 文件，将 `eula=false` 改为 `eula=true`。这样做即表示你同意在运营该服务端时遵守 [Minecraft EULA][eula]。
- 再次使用 `./run.sh` 启动服务端。

现在你的服务端应该可以正常运行了。你可能还需要做一些环境配置，例如在系统和/或网络的防火墙中开放 Minecraft 端口（默认为 25565）。如果你打算让服务端 24/7 运行，还应当安排一个 cronjob 或类似机制来定期重启。
  </TabItem>
  <TabItem value="windows" label="Windows">
在 Windows 上运行 NeoForge 服务端，前提是你会使用基本的终端命令。

- 进入你想要安装服务端的文件夹。
- 使用 `curl` 从 Maven 下载 `.jar` 安装程序（请按需替换版本号和 `-beta` 标签）：
```shell
curl -O https://maven.neoforged.net/releases/net/neoforged/neoforge/21.4.111-beta/neoforge-21.4.111-beta-installer.jar
```
- 使用 `java -jar /path/to/neoforge-installer.jar --installServer` 运行安装程序。
- （可选）在新生成的 `user_jvm_args.txt` 文件中修改分配给服务端的内存量，以及可能需要的其他 JVM 参数。更多信息请参见该文件中的注释。
- 使用 `.\run.bat` 启动服务端。首次运行时它会自动关闭。
- 打开 `eula.txt` 文件，将 `eula=false` 改为 `eula=true`。这样做即表示你同意在运营该服务端时遵守 [Minecraft EULA][eula]。
- 再次使用 `.\run.bat` 启动服务端。

现在你的服务端应该可以正常运行了。你可能还需要做一些环境配置，例如在系统和/或网络的防火墙中开放 Minecraft 端口（默认为 25565）。如果你打算让服务端 24/7 运行，还应当在 Windows 任务计划程序中安排一个任务来定期重启。
  </TabItem>
</Tabs>

## 添加 Mod {#adding-mods}

首次启动游戏后，会出现一个 `mods` 文件夹。你需要把 Mod 文件放到这里。

Mod 文件只应从可信来源下载。我们通常建议你从 [CurseForge][curseforge] 或 [Modrinth][modrinth] 获取 Mod。

## 更新 {#updating}

要更新服务端的 NeoForge 版本，只需像处理旧版本那样，下载并运行新版本的安装程序即可。安装程序会在需要的地方自动替换对旧版本的引用。

:::danger
更新 NeoForge 或 Mod 前，请务必备份你的世界！
:::

## 安装整合包 {#installing-modpacks}

在服务端上安装现成的整合包往往需要一些额外的设置。由于整合包是[第三方启动器][launchers]的功能，因此在服务端上安装整合包需要用到这样一款启动器。

- 按上文所述安装一个服务端。
- 在你的启动器中，如果该整合包提供了 "server pack"（服务端包），则单独安装一个服务端包实例；否则，单独安装一个普通整合包实例。
- 将新安装实例的全部内容移动到服务端的游戏文件夹中。
- （可选）从服务端移除客户端 Mod。
  - 哪些属于客户端 Mod 并不总是很明确，往往需要反复试验。客户端 Mod 常见的功能是视觉方面的，例如启用光影或额外的资源包特性。
  - 如果你安装的是服务端包，这一步应该已经替你完成了。
- 使用 `./run.sh`（Linux）或 `.\run.bat`（Windows）启动服务端。

## 参见 {#see-also}

- [Minecraft Wiki][wiki] 上的 [搭建 Java 版服务器][wiki1] 和 [服务器维护][wiki2] —— 注意这些文章讲的是搭建原版 Minecraft 服务器，而非带 Mod 的服务器

[curseforge]: https://www.curseforge.com/minecraft/search?class=mc-mods
[eula]: https://www.minecraft.net/en-us/eula
[java]: index.md#java
[launchers]: launchers.md
[modrinth]: https://modrinth.com/mods
[wiki]: https://minecraft.wiki/
[wiki1]: https://minecraft.wiki/w/Tutorial:Setting_up_a_Java_Edition_server
[wiki2]: https://minecraft.wiki/w/Tutorial:Server_maintenance

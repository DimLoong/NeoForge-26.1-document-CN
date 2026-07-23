# NeoForge 入门 {#getting-started-with-neoforge}

本节介绍如何搭建 NeoForge 工作区，以及如何运行和测试你的 Mod。

## 前置条件 {#prerequisites}

- 熟悉 Java 编程语言，尤其是它的面向对象、多态、泛型和函数式特性。
- 已安装 Java 25 开发工具包（JDK）和 64 位 Java 虚拟机（JVM）。NeoForge 推荐并官方支持 [Microsoft 构建版 OpenJDK][jdk]，但其他任意 JDK 应当也能正常工作。

:::caution
请确保你使用的是 64 位 JVM。一种检查方法是在终端中运行 `java -version`。Minecraft 不支持 32 位 JVM。
:::

- 熟悉你所选的集成开发环境（IDE）。
    - NeoForge 官方支持 [IntelliJ IDEA][intellij] 和 [Eclipse][eclipse]，二者都内置了 Gradle 支持。不过，任何 IDE 都可以使用，从 Netbeans、Visual Studio Code 到 Vim 或 Emacs 皆可。
- 熟悉 [Git][git] 和 [GitHub][github]。这在技术上并非必需，但会让你的开发过程轻松许多。

## 搭建工作区 {#setting-up-the-workspace}

- 前往 [Mod Generator][modgen] 网页，输入 Mod 名称（以及可选的 mod id）、包名、Minecraft 版本，并选择 Gradle 插件（[ModDevGradle][mdg] 或 [NeoGradle][ng]），点击 “Download Mod Project”，然后解压下载得到的 ZIP 文件。
- 打开你的 IDE 并导入这个 Gradle 项目。Eclipse 和 IntelliJ IDEA 会自动完成导入。如果你使用的 IDE 不会自动导入，也可以通过 `gradlew` 终端命令完成。
    - 首次执行时，Gradle 会下载 NeoForge 的所有依赖（包括 Minecraft 本身）并对其反编译。这可能会花费相当长的时间（视你的硬件和网络状况而定，最长可达一小时）。
    - 每当你修改了 Gradle 文件后，都需要重新加载这些 Gradle 变更，可以通过 IDE 中的 “Reload Gradle” 按钮，或再次使用 `gradlew` 终端命令来完成。

## 自定义你的 Mod 信息 {#customizing-your-mod-information}

Mod 的许多基本属性都可以在 `gradle.properties` 文件中修改，包括 Mod 名称、Mod 版本等基础信息。更多信息请参见 `gradle.properties` 文件中的注释，或参见 [`gradle.properties` 文件的文档][properties]。

如果你想在此之外进一步修改构建流程，可以编辑 `build.gradle` 和 `settings.gradle` 文件。NeoForge 提供的 Gradle 插件（[ModDevGradle][mdg] 或 [NeoGradle][ng]）提供了若干配置选项，其中一部分在构建脚本中以注释形式作了说明。

:::caution
只有在你清楚自己在做什么的情况下，才去编辑 `build.gradle` 和 `settings.gradle` 文件。所有基本属性都可以通过 `gradle.properties` 设置。
:::

## 构建与测试你的 Mod {#building-and-testing-your-mod}

要构建你的 Mod，请运行 `gradlew build`。这会在 `build/libs` 中输出一个名为 `<archivesBaseName>-<version>.jar` 的文件。`<archivesBaseName>` 和 `<version>` 是由 `build.gradle` 设置的属性，默认分别为 `gradle.properties` 文件中的 `mod_id` 和 `mod_version` 值；如有需要，可以在 `build.gradle` 中修改。生成的 JAR 文件随后可以放入启用了 NeoForge 的 Minecraft 环境的 `mods` 文件夹中，或上传到 Mod 分发平台。

要在测试环境中运行你的 Mod，你可以使用生成的运行配置，或使用相应的任务（例如 `gradlew runClient`）。这会从对应的运行目录（例如 `runs/client` 或 `runs/server`）启动 Minecraft，并附带任何指定的源集（source set）。默认的 MDK 包含 `main` 源集，因此凡是写在 `src/main/java` 中的代码都会被应用。

### 服务端测试 {#server-testing}

如果你运行的是专用服务端，无论是通过运行配置还是 `gradlew runServer`，服务端都会立即关闭。你需要编辑运行目录中的 `eula.txt` 文件来接受 Minecraft EULA。

接受之后，服务端会加载并在 `localhost`（默认为 `127.0.0.1`）下可用。然而，你仍然无法加入，因为服务端默认会以在线模式（online mode）启动，而这需要认证（Dev 玩家不具备该认证）。要解决这个问题，请再次停止服务端，并将 `server.properties` 文件中的 `online-mode` 属性设为 `false`。现在启动你的服务端，应该就可以连接了。

:::tip
你应当始终在专用服务端环境中测试你的 Mod。这也包括[纯客户端 Mod][client]，因为它们在服务端加载时不应产生任何行为。
:::

[client]: ../concepts/sides.md
[eclipse]: https://www.eclipse.org/downloads/
[git]: https://www.git-scm.com/
[github]: https://github.com/
[intellij]: https://www.jetbrains.com/idea/
[jdk]: https://learn.microsoft.com/en-us/java/openjdk/download#openjdk-25
[mdg]: https://github.com/neoforged/ModDevGradle
[modgen]: https://neoforged.net/mod-generator/
[ng]: https://github.com/neoforged/NeoGradle
[properties]: modfiles.md#gradleproperties

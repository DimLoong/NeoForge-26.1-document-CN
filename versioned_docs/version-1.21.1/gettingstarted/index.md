# NeoForge 入门 {#getting-started-with-neoforge}

本节介绍如何搭建 NeoForge 工作区，以及如何运行和测试你的 Mod。

## 前置条件 {#prerequisites}

- 熟悉 Java 编程语言，特别是它的面向对象、多态、泛型和函数式特性。
- 已安装 Java 21 开发套件（JDK）与 64 位 Java 虚拟机（JVM）。 NeoForge 推荐并官方支持 [Microsoft 构建的 OpenJDK][jdk]，但其他任何 JDK 也应当可用。

:::caution
请确保你使用的是 64 位 JVM。一种检查方式是在终端中运行 `java -version`。 Minecraft 不支持 32 位 JVM。
:::

- 熟悉一款你自己选择的集成开发环境（IDE）。
      - NeoForge 官方支持 [IntelliJ IDEA][intellij] 和 [Eclipse][eclipse]，两者都内置了 Gradle 支持。不过，任何 IDE 都可以使用，从 Netbeans、 Visual Studio Code 到 Vim 或 Emacs 皆可。
- 熟悉 [Git][git] 和 [GitHub][github]。这在技术上并非必需，但会让你的开发轻松很多。

## 搭建工作区 {#setting-up-the-workspace}

- 打开 Mod 开发套件（MDK）（[ModDevGradle][mdgmdk] 或 [NeoGradle][ngmdk]）的 GitHub 仓库，点击 "Use this template"，然后把新创建的仓库克隆到本地。
      - 如果你不想使用 GitHub，或者想获取某个较早提交的模板，也可以下载仓库的 ZIP 压缩包（在 Code -> Download ZIP 处）并解压。
- 打开你的 IDE 并导入这个 Gradle 项目。 Eclipse 和 IntelliJ IDEA 会自动完成导入。如果你的 IDE 不会自动导入，也可以通过 `gradlew` 终端命令来完成。
      - 首次执行时，Gradle 会下载 NeoForge 的所有依赖，包括 Minecraft 本身，并对它们进行反编译。这可能需要相当长的时间（视你的硬件和网络状况，最多可达一小时）。
      - 每当你修改 Gradle 文件后，都需要重新加载 Gradle 变更，可以通过 IDE 中的 "Reload Gradle" 按钮，或者再次通过 `gradlew` 终端命令来完成。

## 自定义你的 Mod 信息 {#customizing-your-mod-information}

Mod 的许多基本属性都可以在 `gradle.properties` 文件中修改，包括 Mod 名称、 Mod 版本等基础内容。更多信息请参见 `gradle.properties` 文件中的注释，或参见 [`gradle.properties` 文件的文档][properties]。

如果你还想进一步修改构建流程，可以编辑 `build.gradle` 文件。 NeoGradle 作为 NeoForge 的 Gradle 插件，提供了若干配置选项，其中一部分已在 `build.gradle` 文件的注释中作了说明。完整文档请参见 [NeoGradle 文档][neogradle]。

:::caution
只有在你清楚自己在做什么时，才去编辑 `build.gradle` 和 `settings.gradle` 文件。所有基本属性都可以通过 `gradle.properties` 设置。
:::

## 构建并测试你的 Mod {#building-and-testing-your-mod}

要构建你的 Mod，运行 `gradlew build`。这会在 `build/libs` 中输出一个名为 `<archivesBaseName>-<version>.jar` 的文件。 `<archivesBaseName>` 和 `<version>` 是由 `build.gradle` 设置的属性，默认分别取自 `gradle.properties` 文件中的 `mod_id` 和 `mod_version` 值；如有需要，可以在 `build.gradle` 中修改。生成的 JAR 文件随后可以放入启用了 NeoForge 的 Minecraft 环境的 `mods` 文件夹，或上传到 Mod 分发平台。

要在测试环境中运行你的 Mod，你可以使用生成的运行配置，或使用相关联的任务（例如 `gradlew runClient`）。这会从对应的运行目录（例如 `runs/client` 或 `runs/server`）启动 Minecraft，同时应用指定的所有源集（source set）。默认的 MDK 包含 `main` 源集，因此写在 `src/main/java` 中的任何代码都会生效。

### 服务端测试 {#server-testing}

如果你要运行专用服务端，无论是通过运行配置还是 `gradlew runServer`，服务端都会立即关闭。你需要通过编辑运行目录中的 `eula.txt` 文件来接受 Minecraft EULA。

接受之后，服务端将会加载，并在 `localhost`（默认为 `127.0.0.1`）上可用。不过，你仍然无法加入，因为服务端默认会进入在线模式，而在线模式需要身份验证（Dev 玩家并不具备）。要解决这个问题，请再次停止服务端，并将 `server.properties` 文件中的 `online-mode` 属性设为 `false`。现在启动服务端，你应当就能连接了。

:::tip
你应当始终在专用服务端环境中测试你的 Mod。这也包括[仅客户端 Mod][client]，因为它们在服务端加载时不应做任何事情。
:::

[client]: ../concepts/sides.md
[eclipse]: https://www.eclipse.org/downloads/
[git]: https://www.git-scm.com/
[github]: https://github.com/
[intellij]: https://www.jetbrains.com/idea/
[jdk]: https://learn.microsoft.com/en-us/java/openjdk/download#openjdk-21
[mdgmdk]: https://github.com/NeoForgeMDKs/MDK-1.21-ModDevGradle
[ngmdk]: https://github.com/NeoForgeMDKs/MDK-1.21-NeoGradle
[neogradle]: https://docs.neoforged.net/neogradle/docs/
[properties]: modfiles.md#gradleproperties

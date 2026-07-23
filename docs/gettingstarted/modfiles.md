# Mod 文件 {#mod-files}

Mod 文件负责确定哪些 Mod 被打包进你的 JAR、在 “Mods” 菜单中显示哪些信息，以及你的 Mod 应当如何被加载到游戏中。

## `gradle.properties` {#gradleproperties}

`gradle.properties` 文件保存了 Mod 的各种常用属性，例如 mod id 或 Mod 版本。在构建期间，Gradle 会读取这些文件中的值，并将它们内联到多个位置，例如 [neoforge.mods.toml][neoforgemodstoml] 文件。这样，你只需在一处修改值，它们就会自动应用到所有位置。

大多数值也在 [MDK 的 `gradle.properties` 文件][mdkgradleproperties] 中以注释形式作了说明。

| 属性                  | 描述                                                                                                                                                                                                             | 示例                                    |
|---------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------|
| `org.gradle.jvmargs`      | 允许你向 Gradle 传递额外的 JVM 参数。最常见的用途是为 Gradle 分配更多或更少的内存。注意这是针对 Gradle 本身，而非 Minecraft。                                                                 | `org.gradle.jvmargs=-Xmx3G`                |
| `org.gradle.daemon`       | Gradle 在构建时是否使用守护进程。                                                                                                                                                                                     | `org.gradle.daemon=false`                  |
| `org.gradle.parallel`     | Gradle 是否派生（fork）多个 JVM 以并行执行项目。                                                                                                                                                                                     | `org.gradle.parallel=false`                  |
| `org.gradle.caching`      | Gradle 是否复用先前构建的任务输出。                                                                                                                                                                                     | `org.gradle.caching=false`                  |
| `org.gradle.configuration-cache`  | Gradle 是否复用先前构建的构建配置。                                                                                                                                                                                     | `org.gradle.configuration-cache=false`                  |
| `org.gradle.debug`        | Gradle 是否设为调试模式。调试模式主要意味着更多的 Gradle 日志输出。注意这是针对 Gradle 本身，而非 Minecraft。                                                                                                | `org.gradle.debug=false`                   |
| `minecraft_version`       | 你正在开发所针对的 Minecraft 版本。必须与 `neo_version` 匹配。                                                                                                                                                                | `minecraft_version=1.20.6`                 |
| `minecraft_version_range` | 本 Mod 可使用的 Minecraft 版本范围，采用 [Maven 版本范围][mvr] 形式。注意 [快照、预发布版和候选发布版][mcversioning] 不保证能正确排序，因为它们不遵循 Maven 版本规则。    | `minecraft_version_range=[1.20.6,1.21)`    |
| `neo_version`             | 你正在开发所针对的 NeoForge 版本。必须与 `minecraft_version` 匹配。关于 NeoForge 版本机制的更多信息，参见 [NeoForge 版本][neoversioning]。                                                           | `neo_version=20.6.62`                      |
| `mod_id`                  | 参见 [Mod ID][modid]。                                                                                                                                                                                                                | `mod_id=examplemod`                        |
| `mod_name`                | 你的 Mod 的人类可读显示名称。默认情况下，这只能在 Mod 列表中看到；不过，诸如 [JEI][jei] 这类 Mod 也会在物品提示框中醒目地显示 Mod 名称。                                                | `mod_name=Example Mod`                     |
| `mod_license`             | 你的 Mod 所采用的许可证。建议将其设为你所使用的 [SPDX 标识符][spdx] 和/或指向许可证的链接。你可以访问 https://choosealicense.com/ 来帮助挑选你想使用的许可证。 | `mod_license=MIT`                          |
| `mod_version`             | 你的 Mod 的版本，显示在 Mod 列表中。更多信息参见 [版本页面][versioning]。                                                                                                                          | `mod_version=1.0`                          |
| `mod_group_id`            | 参见 [Group ID][group]。                                                                                                                                                                                                              | `mod_group_id=com.example.examplemod`      |

### Mod ID {#the-mod-id}

Mod ID 是你的 Mod 与其他 Mod 相区分的主要方式。它被用于各种各样的地方，包括作为你的 Mod 的[注册表][registration]命名空间，以及作为你的[资源包和数据包][resource]命名空间。存在两个 id 相同的 Mod 会导致游戏无法加载。

因此，你的 Mod ID 应当是独特且易记的。通常，它会是你的 Mod 显示名称（但为小写），或其某种变体。Mod ID 只能包含小写字母、数字和下划线，且长度必须在 2 到 64 个字符之间（含两端）。

:::info
在 `gradle.properties` 文件中修改此属性会自动将变更应用到所有位置，唯独你主 Mod 类中的 [`@Mod` 注解][javafml] 除外。在那里，你需要手动修改它，使其与 `gradle.properties` 文件中的值一致。
:::

### Group ID {#the-group-id}

虽然 `build.gradle` 中的 `group` 属性只有在你打算把 Mod 发布到 Maven 时才是必需的，但始终正确设置它被视为良好实践。这一步已通过 `gradle.properties` 的 `mod_group_id` 属性为你完成。

Group ID 应设为你的顶级包（top-level package）。更多信息参见 [打包][packaging]。

```properties
# In your gradle.properties file
mod_group_id=com.example
```

你 Java 源码（`src/main/java`）中的包现在也应符合这一结构，用一个内层包来表示 mod id：

```text
com
- example (top-level package specified in group property)
    - mymod (the mod id)
        - MyMod.java (renamed ExampleMod.java)
```

## `neoforge.mods.toml` {#neoforgemodstoml}

`neoforge.mods.toml` 文件位于 `src/main/resources/META-INF/neoforge.mods.toml`，是一个采用 [TOML][toml] 格式的文件，用于定义你的 Mod 的元数据。它还包含关于你的 Mod 应如何被加载到游戏中的附加信息，以及在 “Mods” 菜单中展示的显示信息。[MDK 提供的 `neoforge.mods.toml` 文件][mdkneoforgemodstoml] 包含了解释每一条目的注释，这里将对它们作更详细的说明。

`neoforge.mods.toml` 可以分为三部分：与 Mod 文件相关联的非 Mod 专属属性；Mod 属性，每个 Mod 各占一节；以及依赖配置，每个 Mod 的依赖各占一节。与 `neoforge.mods.toml` 文件相关的部分属性是强制的；强制属性必须指定值，否则将抛出异常。

:::note
在默认 MDK 中，Gradle 会用 `gradle.properties` 文件中指定的值替换此文件里的各种属性。例如，`license="${mod_license}"` 这一行意味着 `license` 字段会被 `gradle.properties` 中的 `mod_license` 属性替换。像这样被替换的值应当在 `gradle.properties` 中修改，而不是在这里修改。
:::

### 非 Mod 专属属性 {#non-mod-specific-properties}

非 Mod 专属属性是与 JAR 本身相关联的属性，用于指明如何加载这些 Mod 以及任何附加的全局元数据。

| 属性             | 类型     | 默认值        | 描述                                                                                                                                                                                                                                                                                                                                         | 示例                                                                        |
|----------------------|----------|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| `modLoader`          | string   | `javafml`      | 这些 Mod 使用的语言加载器。可用于支持替代性的语言结构，例如用 Kotlin 对象作为主文件，或用不同的方式确定入口点，例如通过接口或方法。NeoForge 提供了 Java 加载器 [`"javafml"`][javafml]。  | `modLoader="javafml"`                                                          |
| `loaderVersion`      | string   | `""`           | 语言加载器可接受的版本范围，以 [Maven 版本范围][mvr] 表示。对于 `javafml`，目前是版本 `1`。若未指定版本，则任何版本的 Mod 加载器均可使用。                                                                                                                                                                                      | `loaderVersion="[1,)"`                                                         |
| `license`            | string   | **强制**  | 本 JAR 中的 Mod 所采用的许可证。建议将其设为你所使用的 [SPDX 标识符][spdx] 和/或指向许可证的链接。你可以访问 https://choosealicense.com/ 来帮助挑选你想使用的许可证。                                                                                              | `license="MIT"`                                                                |
| `showAsResourcePack` | boolean  | `false`        | 当为 `true` 时，这些 Mod 的资源会在 “Resource Packs” 菜单中作为一个单独的资源包显示，而不是与 “Mod Resources” 包合并。                                                                                                                                                                           | `showAsResourcePack=true`                                                      |
| `showAsDataPack`     | boolean  | `false`        | 当为 `true` 时，这些 Mod 的数据文件会在 “Data Packs” 菜单中作为一个单独的数据包显示，而不是与 “Mod Data” 包合并。                                                                                                                                                                           | `showAsDataPack=true`                                                          |
| `services`           | array    | `[]`           | 你的 Mod 所使用的服务数组。它作为 NeoForge 对 Java 平台模块系统实现的一部分，被 Mod 所创建的模块所消费。                                                                                                                                                                                   | `services=["net.neoforged.neoforgespi.language.IModLanguageProvider"]`         |
| `properties`         | table    | `{}`           | 替换属性的表。它被 `StringSubstitutor` 用来将 `${file.<key>}` 替换为其对应的值。                                                                                                                                                                                                                    | `properties={"example"="1.2.3"}`（随后可通过 `${file.example}` 引用） |
| `issueTrackerURL`    | string   | _无_      | 一个用于报告和跟踪这些 Mod 问题的地址 URL。                                                                                                                                                                                                                                                                                            | `"https://github.com/neoforged/NeoForge/issues"`                               |

:::note
`services` 属性在功能上等价于指定 [模块中的 `uses` 指令][uses]，它允许[加载给定类型的服务][serviceload]。

或者，也可以在 `src/main/resources/META-INF/services` 文件夹内的服务文件中定义它，其中文件名是服务的全限定名，文件内容是要加载的服务的名称（另可参见 [AtlasViewer Mod 的这个示例][atlasviewer]）。
:::

### Mod 专属属性 {#mod-specific-properties}

Mod 专属属性通过 `[[mods]]` 标头与指定的 Mod 绑定。这是一个[表数组][array]；在下一个标头出现之前，所有键/值属性都会附加到该 Mod。

```toml
# Properties for examplemod1
[[mods]]
modId = "examplemod1"

# Properties for examplemod2
[[mods]]
modId = "examplemod2"
```

| 属性         | 类型     | 默认值                      | 描述                                                                                                                                                                                                                                                                    | 示例                                                         |
|------------------|----------|------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| `modId`          | string   | **强制**                | 参见 [Mod ID][modid]。                                                                                                                                                                                                                                                       | `modId="examplemod"`                                            |
| `namespace`      | string   | `modId` 的值             | Mod 的覆盖命名空间。它同样必须是有效的 [mod ID][modid]，但可以额外包含点号或短横线。目前未被使用。                                                                                                                                        | `namespace="example"`                                           |
| `version`        | string   | `"1"`                        | Mod 的版本，最好采用 [Maven 版本的某种变体][versioning]。当设为 `${file.jarVersion}` 时，它会被替换为 JAR 清单中 `Implementation-Version` 属性的值（在开发环境中显示为 `0.0NONE`）。 | `version="1.20.2-1.0.0"`                                        |
| `displayName`    | string   | `modId` 的值             | Mod 的显示名称。用于在界面上表示该 Mod（例如 Mod 列表、Mod 不匹配提示）。                                                                                                                                                                        | `displayName="Example Mod"`                                     |
| `description`    | string   | `'''MISSING DESCRIPTION'''`  | 在 Mod 列表界面显示的 Mod 描述。建议使用[多行字面量字符串][multiline]。此值也是可翻译的，更多信息参见 [翻译 Mod 元数据][i18n]。                                                                | `description='''This is an example.'''`                         |
| `logoFile`       | string   | _无_                    | 在 Mod 列表界面使用的图片文件的名称和扩展名。该位置必须是从 JAR 或源集根目录开始的绝对路径（例如 main 源集的 `src/main/resources`）。有效的文件名字符包括小写字母（`a-z`）、数字（`0-9`）、斜杠（`/`）、下划线（`_`）、点号（`.`）和短横线（`-`）。完整字符集为 `[a-z0-9_-.]`。                                                                  | `logoFile="test/example_logo.png"`                              |
| `logoBlur`       | boolean  | `true`                       | 渲染 `logoFile` 时使用 `GL_LINEAR*`（true）还是 `GL_NEAREST*`（false）。简单来说，这决定了缩放 logo 时是否将其模糊化。                                                                                    | `logoBlur=false`                                                |
| `updateJSONURL`  | string   | _无_                    | 一个指向 JSON 的 URL，供[更新检查器][update]用来确认你正在游玩的 Mod 是否为最新版本。                                                                                                                                                               | `updateJSONURL="https://example.github.io/update_checker.json"` |
| `modUrl`         | string   | _无_                    | 指向 Mod 下载页的 URL。目前未被使用。                                                                                                                                                                                                                       | `modUrl="https://neoforged.net/"`                               |
| `credits`        | string   | _无_                    | 在 Mod 列表界面显示的 Mod 鸣谢与致谢。                                                                                                                                                                                                             | `credits="The person over here and there."`                     |
| `authors`        | string   | _无_                    | 在 Mod 列表界面显示的 Mod 作者。                                                                                                                                                                                                                           | `authors="Example Person"`                                      |
| `displayURL`     | string   | _无_                    | 在 Mod 列表界面显示的、指向 Mod 展示页的 URL。                                                                                                                                                                                                             | `displayURL="https://neoforged.net/"`                           |
| `enumExtensions` | string   | _无_                    | 用于[枚举扩展][enumextension]的 JSON 文件路径。                                                                                                                                                                                                          | `enumExtensions="META_INF/enumextensions.json"`                 |
| `featureFlags`   | string   | _无_                    | 用于[特性标志][featureflags]的 JSON 文件路径。                                                                                                                                                                                                            | `featureFlags="META-INF/feature_flags.json"`                    |

#### 特性 {#features}

特性系统允许 Mod 要求在加载系统时，某些设置、软件或硬件必须可用。当某个特性未被满足时，Mod 加载将失败，并向用户告知该要求。这些配置使用[表数组][array] `[[features.<modid>]]` 创建，其中 `modid` 是消费该特性的 Mod 的标识符。目前，NeoForge 提供以下特性：

| 特性          | 描述                                                                                                                                                                                                | 示例                             |
|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------|
| `javaVersion`   | Java 版本可接受的版本范围，以 [Maven 版本范围][mvr] 表示。这应当是 Minecraft 所使用的受支持版本。                                                       | `javaVersion="[17,)"`  |

#### Mod 属性 {#mod-properties}

Mod 属性系统是一个由任意键映射到值、并与特定 Mod 相关联的映射表。当一个 Mod 文件定义了多个提供不同元数据的 Mod 时，这会很有用。之后，可以通过 `IModInfo#getModProperties` 从该映射中获取某个键对应的对象值，从而得到特定的属性值。这些配置使用[表数组][array] `[[modproperties.<modid>]]` 创建，其中 `modid` 是消费所定义属性的 Mod 的标识符。

```java
// Assume we have two mods `mod1` and `mod2` with the following property configuration
// [[modproperties.mod1]]
// key="value1"
// [[modproperties.mod2]]
// key="value2"

@Mod("mod1")
public class ModOne {

    private final String key;

    public ModOne(ModContainer container) {
        // Will store 'value1' in key
        this.key = (String) container.getModInfo().getModProperties().get("key");
    }
}

@Mod("mod2")
public class ModTwo {

    private final String key;

    public ModTwo(ModContainer container) {
        // Will store 'value2' in key
        this.key = (String) container.getModInfo().getModProperties().get("key");
    }
}
```

### 访问转换器专属属性 {#access-transformer-specific-properties}

[访问转换器专属属性][accesstransformer] 通过 `[[accessTransformers]]` 标头与指定的访问转换器绑定。这是一个[表数组][array]；在下一个标头出现之前，所有键/值属性都会附加到该访问转换器。访问转换器标头是可选的；但一旦指定，其所有元素都是强制的。

| 属性 |  类型  |    默认值    |             描述              |     示例     |
|:--------:|:------:|:-------------:|:------------------------------------:|:----------------|
| `file`   | string | **强制** | 参见 [添加 AT][accesstransformer]。 | `file="at.cfg"` |

### Mixin 配置属性 {#mixin-configuration-properties}

[Mixin 配置属性][mixinconfig] 通过 `[[mixins]]` 标头与指定的 mixin 配置绑定。这是一个[表数组][array]；在下一个标头出现之前，所有键/值属性都会附加到该 mixin 块。mixin 标头是可选的；但一旦指定，其所有元素都是强制的。

| 属性 |  类型  |    默认值    |             描述                       |     示例                       |
|:--------:|:------:|:-------------:|:---------------------------------------------:|:----------------------------------|
| `config` | string | **强制** | mixin 配置文件的位置。 | `config="examplemod.mixins.json"` |
| `requiredMods` | array | `[]` | 这些 mixin 得以应用所必须存在的 Mod ID。 | `requiredMods=["sodium"]` |
| `behaviorVersion` | string | _无_ | 要匹配其行为的 [fabric mixin 版本](https://github.com/FabricMC/Mixin/tags)。必须介于默认行为版本（每次 neo 离开破坏性变更窗口时固定一次）与运行时所存在的 fabric mixin 版本之间。 | `behaviorVersion="0.17.1"` |

### 依赖配置 {#dependency-configurations}

Mod 可以指定它们的依赖，这些依赖会在加载 Mod 之前由 NeoForge 检查。这些配置使用[表数组][array] `[[dependencies.<modid>]]` 创建，其中 `modid` 是消费该依赖的 Mod 的标识符。

| 属性       | 类型    | 默认值        | 描述                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 示例                                      |
|----------------|---------|----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| `modId`        | string  | **强制**  | 作为依赖添加的 Mod 的标识符。                                                                                                                                                                                                                                                                                                                                                                                                                                           | `modId="jei"`                                |
| `type`         | string  | `"required"`   | 指定此依赖的性质：`"required"` 为默认值，若缺少该依赖则阻止 Mod 加载；`"optional"` 在缺少该依赖时不会阻止 Mod 加载，但仍会验证该依赖是否兼容；`"incompatible"` 在存在该依赖时阻止 Mod 加载；`"discouraged"` 在存在该依赖时仍允许 Mod 加载，但会向用户显示警告。 | `type="incompatible"`                        |
| `reason`       | string  | _无_      | 一条可选的、面向用户的消息，用于说明为何需要此依赖，或为何与之不兼容。                                                                                                                                                                                                                                                                                                                                                                                    | `reason="integration"`                       |
| `versionRange` | string  | `""`           | 语言加载器可接受的版本范围，以 [Maven 版本范围][mvr] 表示。空字符串匹配任意版本。                                                                                                                                                                                                                                                                                                                                       | `versionRange="[1, 2)"`                      |
| `ordering`     | string  | `"NONE"`       | 定义本 Mod 必须在此依赖之前（`"BEFORE"`）还是之后（`"AFTER"`）加载。如果加载顺序无关紧要，返回 `"NONE"`。                                                                                                                                                                                                                                                                                                                                    | `ordering="AFTER"`                           |
| `side`         | string  | `"BOTH"`       | 此依赖必须存在的[物理端][sides]：`"CLIENT"`、`"SERVER"` 或 `"BOTH"`。                                                                                                                                                                                                                                                                                                                                                                         | `side="CLIENT"`                              |
| `referralUrl`  | string  | _无_      | 指向该依赖下载页的 URL。目前未被使用。                                                                                                                                                                                                                                                                                                                                                                                                            | `referralUrl="https://library.example.com/"` |

:::danger
两个 Mod 的 `ordering` 可能因循环依赖而导致崩溃，例如 Mod A 必须在 Mod B 之前（`"BEFORE"`）加载，而与此同时 Mod B 又必须在 Mod A 之前（`"BEFORE"`）加载。
:::

## Mod 入口点 {#mod-entrypoints}

现在 `neoforge.mods.toml` 已经填写完毕，我们需要为 Mod 提供一个入口点。入口点本质上就是执行 Mod 的起始位置。入口点本身由 `neoforge.mods.toml` 中所使用的语言加载器决定。

### `javafml` 与 `@Mod` {#javafml-and-mod}

`javafml` 是 NeoForge 为 Java 编程语言提供的语言加载器。入口点通过一个带有 `@Mod` 注解的公有类来定义。`@Mod` 的值必须包含 `neoforge.mods.toml` 中指定的某个 mod id。之后，所有初始化逻辑（例如[注册事件][events]或[添加 `DeferredRegister`][registration]）都可以在该类的构造函数中指定。

主 Mod 类只能有一个公有构造函数，否则将抛出 `RuntimeException`。该构造函数可以按**任意**顺序拥有以下**任意**参数；它们都不是明确必需的。但不允许有重复的参数。

参数类型     | 描述                                                                                              |
------------------|----------------------------------------------------------------------------------------------------------|
`IEventBus`       | [Mod 专属事件总线][modbus]（注册、事件等所需）                             |
`ModContainer`    | 持有本 Mod 元数据的抽象容器                                                       |
`FMLModContainer` | 由 `javafml` 定义的、持有本 Mod 元数据的实际容器；是 `ModContainer` 的扩展 |
`Dist`            | 本 Mod 正在其上加载的[物理端][sides]                                                        |

```java
@Mod("examplemod") // Must match a mod id in the neoforge.mods.toml
public class ExampleMod {
    // Valid constructor, only uses two of the available argument types
    public ExampleMod(IEventBus modBus, ModContainer container) {
        // Initialize logic here
    }
}
```

默认情况下，`@Mod` 注解会在两[端][sides]加载。可以通过指定 `dist` 参数来改变这一点：

```java
// Must match a mod id in the neoforge.mods.toml
// This mod class will only be loaded on the physical client
@Mod(value = "examplemod", dist = Dist.CLIENT) 
public class ExampleModClient {
    // Valid constructor
    public ExampleModClient(FMLModContainer container, IEventBus modBus, Dist dist) {
        // Initialize client-only logic here
    }
}
```

:::note
`neoforge.mods.toml` 中的条目不一定需要对应的 `@Mod` 注解。同样，`neoforge.mods.toml` 中的一个条目也可以有多个 `@Mod` 注解，例如当你想把公共逻辑与纯客户端逻辑分开时。
:::

[accesstransformer]: ../advanced/accesstransformers.md#adding-ats
[array]: https://toml.io/en/v1.0.0#array-of-tables
[atlasviewer]: https://github.com/XFactHD/AtlasViewer/blob/1.20.2/neoforge/src/main/resources/META-INF/services/xfacthd.atlasviewer.platform.services.IPlatformHelper
[events]: ../concepts/events.md
[features]: #features
[group]: #the-group-id
[i18n]: ../resources/client/i18n.md#translating-mod-metadata
[javafml]: #javafml-and-mod
[jei]: https://www.curseforge.com/minecraft/mc-mods/jei
[mcversioning]: versioning.md#minecraft
[mdkgradleproperties]: https://github.com/NeoForgeMDKs/MDK-26.1-NeoGradle/blob/main/gradle.properties
[mdkneoforgemodstoml]: https://github.com/NeoForgeMDKs/MDK-26.1-NeoGradle/blob/main/src/main/resources/META-INF/neoforge.mods.toml
[neoforgemodstoml]: #neoforgemodstoml
[mixinconfig]: https://github.com/SpongePowered/Mixin/wiki/Introduction-to-Mixins---The-Mixin-Environment#mixin-configuration-files
[modbus]: ../concepts/events.md#event-buses
[modid]: #the-mod-id
[multiline]: https://toml.io/en/v1.0.0#string
[mvr]: https://maven.apache.org/enforcer/enforcer-rules/versionRanges.html
[neoversioning]: versioning.md#neoforge
[packaging]: structuring.md#packaging
[registration]: ../concepts/registries.md#deferredregister
[resource]: ../resources/index.md
[serviceload]: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ServiceLoader.html#load(java.lang.Class)
[sides]: ../concepts/sides.md
[spdx]: https://spdx.org/licenses/
[toml]: https://toml.io/
[update]: ../misc/updatechecker.md
[uses]: https://docs.oracle.com/javase/specs/jls/se21/html/jls-7.html#jls-7.7.3
[versioning]: versioning.md
[enumextension]: ../advanced/extensibleenums.md
[featureflags]: ../advanced/featureflags.md

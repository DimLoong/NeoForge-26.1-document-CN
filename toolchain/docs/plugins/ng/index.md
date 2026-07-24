# NeoGradle {#neogradle}
[![Release](https://github.com/neoforged/NeoGradle/actions/workflows/release.yml/badge.svg?branch=NG_7.0)](https://github.com/neoforged/NeoGradle/actions/workflows/release.yml)

---

Minecraft mod 开发框架，供 NeoForge 与 FML 在 Gradle 构建系统中使用。

若想快速上手，可参考 [NeoForge Mod Development Kit](https://github.com/neoforged/MDK) 是如何使用 NeoGradle 的。

要查看 NeoGradle 的最新可用版本，请访问 [NeoForged 项目页面](https://projects.neoforged.net/neoforged/neogradle)。

## 插件 {#plugins}

NeoGradle 拆分为若干个可以相互独立应用的插件。

### Userdev 插件 {#userdev-plugin}

该插件用于借助 NeoForge 构建 Mod。对于 Mod 开发者而言，多数情况下这是你唯一会用到的插件。

```gradle
plugins {
  id 'net.neoforged.gradle.userdev' version '<neogradle_version>'
}

dependencies {
  implementation 'net.neoforged:neoforge:<neoforge_version>'
}
```

#### <a id="userdev-access-transformer" /> 访问转换器 {#a-iduserdev-access-transformer--access-transformers}
userdev 插件提供了为你的 Mod 配置访问转换器（Access Transformer）的方式。
你需要在资源目录中创建一个访问转换器配置文件，然后配置 userdev 插件来使用它。
```groovy
accessTransformers {
    file 'src/main/resources/META-INF/accesstransformer.cfg'
}
```
这里的路径由你自行决定，且无需包含在最终的 jar 中。

##### <a id="userdev-access-transformers-from-dependencies" /> 来自依赖 {#a-iduserdev-access-transformers-from-dependencies--from-dependencies}
当你希望在转换过程中使用某个依赖提供的访问转换器时，可以借助 `consume` 与 `consumeApi` 依赖收集器来实现：
```groovy
accessTransformers {
    consume 'net.something.group:module:1.0.0-version' //Use the access transformers published by this dependency.
    consumeApi 'net.something.group:module:1.0.0-version' //Use the access transformers published by this dependency, and expose it for your consumers as a dependency as well.
}
```

或者，你也可以分别使用 `accessTransformer` 或 `accessTransformerApi` 配置来处理这一点：
```groovy
dependencies {
    accessTransformer 'net.something.group:module:1.0.0-version' //Use the access transformers published by this dependency.
    accessTransformerApi 'net.something.group:module:1.0.0-version' //Use the access transformers published by this dependency, and expose it for your consumers as a dependency as well.
}
```

#### <a id="userdev-interface-injections" /> 接口注入 {#a-iduserdev-interface-injections--interface-injections}
userdev 插件提供了为你的 Mod 配置接口注入的方式。
这使得你可以拥有一个反编译后的 Minecraft 制品，其中已经静态地应用了你想通过 mixin 注入的接口。
这种方式的优点在于，你可以在代码中使用这些接口，而 mixin 会被应用到接口上，而不是实现这些接口的类上。
```groovy   
interfaceInjections {
    file 'src/main/resources/META-INF/interfaceinjection.json'
}
```
关于该文件格式的更多信息，请参见[这里](https://github.com/neoforged/JavaSourceTransformer?tab=readme-ov-file#interface-injection)。

##### <a id="userdev-interface-injections-from-dependencies" /> 来自依赖 {#a-iduserdev-interface-injections-from-dependencies--from-dependencies}
当你希望在注入过程中包含某个依赖提供的接口时，可以借助 `consume` 与 `consumeApi` 依赖收集器来实现：
```groovy
interfaceInjections {
    consume 'net.something.group:module:1.0.0-version' //Use the interface injections published by this dependency.
    consumeApi 'net.something.group:module:1.0.0-version' //Use the interface injections published by this dependency, and expose it for your consumers as a dependency as well.
}
```

或者，你也可以分别使用 `interfaceInjection` 或 `interfaceInjectionApi` 配置来处理这一点：
```groovy
dependencies {
    interfaceInjection 'net.something.group:module:1.0.0-version' //Use the interface injections published by this dependency.
    interfaceInjectionApi 'net.something.group:module:1.0.0-version' //Use the interface injections published by this dependency, and expose it for your consumers as a dependency as well.
}
```

#### userdev 插件的依赖管理 {#dependency-management-by-the-userdev-plugin}
当该插件检测到对 NeoForge 的依赖时，它会立即行动起来，创建必要的 NeoForm 运行时任务，从而构建出一个包含所请求 NeoForge 版本的、可用的 Minecraft JAR 文件。
此外（如果通过约定进行了相应配置，而这也是默认行为），它还会为你的项目创建运行配置，并将必要的依赖添加到该运行配置的类路径中。

##### 版本目录 {#version-catalogues}
使用 Gradle 的现代版本目录功能意味着依赖会在尽可能晚的时刻才被添加，无论那是否发生在脚本求值期间。
这意味着如果你使用该功能，有时可能无法完全按照你的期望来配置默认的运行配置。
在这种情况下，禁用运行配置的约定并手动配置它们或许更为有利。

请参见以下示例：

_lib.versions.toml:_
```toml
[versions]
# Neoforge Settings
neoforge = "+"

[libraries]
neoforge = { group = "net.neoforged", name = "neoforge", version.ref = "neoforge" }
```
_build.gradle:_
```groovy
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}
            
dependencies {
    implementation(libs.neoforge)
}

runs {
    configureEach { run ->
        run.modSource sourceSets.main
    }
    
    client { }
    server { }
    datagen { }
    gameTestServer { }
    junit { }
}
```
你不需要创建全部五种不同的运行配置，只需创建你需要的那些即可。
这是因为在 Gradle 实际添加依赖的那个时间点，我们已经无法再创建任何新的运行配置，但在依赖被添加时我们仍然可以为你配置它们。

#### <a id="userdev-binary-mode" /> 二进制补丁模式 {#a-iduserdev-binary-mode--binary-patch-mode}
当 userdev 插件检测到应当禁用反编译器时，它会修改 NeoForm 流水线。
在这种情况下，它会运行一个完全独立的子系统，即二进制补丁器（binary patcher），来生成一个近似生产环境的 jar，
然后将二进制补丁应用到该 jar 上。这样设置起来明显更快，对缓存与磁盘占用也更友好，但不会
生成用于调试的源码 jar。

二进制模式在以下两种条件之一满足时启用：
- 环境变量 `CI` 包含 `true`
- Gradle 属性 `neogradle.subsystems.decompiler.enabled` 被设为 `false`

:::warning
目前该模式仅对 UserDev 插件可用，未来最终也会移植到 NeoForm 插件。
:::

### Common 插件 {#common-plugin}
#### <a id="common-dep-management" /> 可用的依赖管理 {#a-idcommon-dep-management--available-dependency-management}
##### <a id="common-dep-management-extra-jar" /> Extra Jar {#a-idcommon-dep-management-extra-jar--extra-jar}
common 插件为 Minecraft 的 extra-jar 提供依赖管理。
这是一个特殊的 jar，仅包含 Minecraft 的资源与素材，不含任何代码。
它适用于那些希望依赖 Minecraft 资源、但不依赖其代码的 Mod。
```gradle
plugins {
  id 'net.neoforged.gradle.common' version '<neogradle_version>'
}

dependencies {
  implementation "net.minecraft:client:<minecraft_version>:client-extra"
}
```

#### Jar-In-Jar 支持 {#jar-in-jar-support}
common 插件为 jar-in-jar 依赖提供支持，无论是在发布时还是在你消费它们时。
##### 消费 Jar-In-Jar 依赖 {#consuming-jar-in-jar-dependencies}
如果你想依赖一个使用了 jar-in-jar 依赖的项目，可以在你的 build.gradle 中添加如下内容来实现：
```groovy
dependencies {
    implementation "project.with:jar-in-jar:1.2.3"
}
```
显然，你需要把 `project.with:jar-in-jar:1.2.3` 替换为你想依赖的项目的实际坐标，
并且可以使用任意配置来确定你依赖的作用域。

##### <a id="common-jar-in-jar-publishing" /> 发布 {#a-idcommon-jar-in-jar-publishing--publishing}
如果你想发布一个 jar-in-jar 依赖，可以在你的 build.gradle 中添加如下内容来实现：
```groovy
dependencies {
    jarJar("project.you.want.to:include-as-jar-in-jar:[my.lowe.supported.version,potentially.my.upper.supported.version)") {
        version {
            prefer "the.version.you.want.to.use"
        }
    }
}
```
这里需要重点注意的是，必须指定一个版本范围。jar-in-jar 依赖不支持直接使用单一版本。
如果你需要指定单一版本，可以将版本范围的上下界都设为同一版本来实现：`[the.version.you.want.to.use]`。

###### <a id="common-jar-in-jar-publishing-moves-and-collisions" /> 处理被迁移的 Jar-In-Jar 依赖 {#a-idcommon-jar-in-jar-publishing-moves-and-collisions--handling-of-moved-jar-in-jar-dependencies}
当依赖从一个 GAV 迁移到另一个时，通常会发布一个转移坐标，可能通过 maven-metadata.xml、单独的 pom 文件，或通过 Gradle 的 available-at 元数据实现。
这可能导致依赖的实际版本与你所指定的版本不同。
最好将你的依赖更新到新的 GAV，以避免将来出现问题和混淆。

#### 管理运行配置 {#managing-runs}
common 插件提供了在项目中管理运行配置的方式。
其主要目的是确保无论你使用 vanilla、neoform、platform 还是 userdev 模块，都能始终以相同的方式管理运行配置。
```groovy
plugins {
  id 'net.neoforged.gradle.common' version '<neogradle_version>'
}

runs {
    //...Run configuration
}
```

##### <a id="common-runs-configuring-runs" /> 配置运行配置 {#a-idcommon-runs-configuring-runs--configuring-runs}
当你在项目中创建一个运行配置时，它最初是空的。
如果你不使用运行类型（run type），也不像下文所述那样从另一个运行配置克隆配置，那么你就必须自行配置该运行配置。
```groovy
runs {
    someRun {
        isIsSingleInstance true //This will make the run a single instance run, meaning that only one instance of the run can be run at a time
        mainClass 'com.example.Main' //This will set the main class of the run
        arguments 'arg1', 'arg2' //This will set the arguments of the run
        jvmArguments '-Xmx4G' //This will set the jvm arguments of the run
        isClient true //This will set the run to be a client run
        isServer true //This will set the run to be a server run
        isDataGenerator true //This will set the run to be a data gen run
        isGameTest true //This will set the run to be a game test run
        isJUnit true //This will set the run to be a junit run, indicating that a Unit Test environment should be used and not a normal run
        environmentVariables 'key1': 'value1', 'key2': 'value2' //This will set the environment variables of the run
        systemProperties 'key1': 'value1', 'key2': 'value2' //This will set the system properties of the run
        classPath.from project.configurations.runtimeClasspath //This will add an element to just the classpath of this run
        
        shouldBuildAllProjects true //This will set the run to build all projects before running
        workingDirectory file('some/path') //This will set the working directory of the run
    }
}
```
除了这些基础配置之外，你随时可以查阅 [Runs DSL 对象](https://github.com/neoforged/NeoGradle/blob/a203b3428fe1ec367bd523b1f2b3c97ab1eeb599/dsl/common/src/main/groovy/net/neoforged/gradle/dsl/common/runs/run/Run.groovy) 来了解还有哪些其他选项可用。

##### <a id="common-runs-configuring-types" /> 配置运行类型 {#a-idcommon-runs-configuring-types--configuring-run-types}
如果你使用的运行类型并非来自某个 SDK（例如 userdev 插件提供的那些），可以按如下方式配置它们：
```groovy
runs {
    someRun {
        isIsSingleInstance true //This will make the runs of this type a single instance run, meaning that only one instance of the run can be run at a time
        mainClass 'com.example.Main' //This will set the main class of the runs of this type
        arguments 'arg1', 'arg2' //This will set the arguments of the runs of this type
        jvmArguments '-Xmx4G' //This will set the jvm arguments of the runs of this type
        isClient true //This will set the run to be a client runs of this type
        isServer true //This will set the run to be a server runs of this type
        isDataGenerator true //This will set the run to be a data gen runs of this type
        isGameTest true //This will set the run to be a game test runs of this type
        isJUnit true //This will set the run to be a junit runs of this type, indicating that a Unit Test environment should be used and not a normal run
        environmentVariables 'key1': 'value1', 'key2': 'value2' //This will set the environment variables of the runs of this type
        systemProperties 'key1': 'value1', 'key2': 'value2' //This will set the system properties of the runs of this type
        classPath.from project.configurations.runtimeClasspath //This will add an element to just the classpath of this runs of this type
    }
}
```

##### <a id="common-runs-configuration-types" /> 运行配置的类型 {#a-idcommon-runs-configuration-types--types-of-runs}
common 插件管理运行配置的存在，但它本身并不创建或配置某个运行配置。
它只是确保当你创建一个运行配置时，会基于该运行配置本身的设置为其创建对应的任务与 IDE 运行配置。

要基于给定模板来配置运行配置，就有了运行类型的概念。
例如，如果你使用 userdev 插件，它会从你所依赖的各个 SDK 加载运行类型，并允许你基于这些类型来配置运行配置。

###### <a id="common-runs-configuration-types-disable-by-name" /> 按名称配置运行配置 {#a-idcommon-runs-configuration-types-disable-by-name--configuring-runs-by-name}
首先，默认情况下 common 插件会将任何名称与某个运行类型相同的运行配置按该运行类型进行配置。你可以通过如下设置为某个运行配置禁用这一行为：
```groovy
runs {
    someRun {
        configureFromTypeWithName false
    }
}
```

###### <a id="common-runs-configuration-types-configure-by-type" /> 使用类型配置运行配置 {#a-idcommon-runs-configuration-types-configure-by-type--configuring-run-using-types}
如果你想基于某个运行类型来配置运行配置，可以通过如下设置实现：
```groovy
runs {
    someRun {
        runType 'client' //In case you want to configure the run type based on its name
        configure runTypes.client //In case you want to configure the run type based on the run type object, this might not always be possible, due to the way gradle works
        
        //The following method is deprecated and will be removed in a future release
        configure 'client'
    }
}
```
在将运行配置实体化为任务或 IDE 运行配置的过程中，若找不到相应的运行类型，上述两种写法都会抛出异常。

##### <a id="common-runs-configuration-runs" /> 运行配置的配置 {#a-idcommon-runs-configuration-runs--configuration-of-runs}
当一个运行配置被添加时，common 插件还会检视它，判断是否有任何 SDK 或 MDK 被添加到其某个源集（sourceset）中，
如果有，就给该 SDK/MDK 一个机会，向该运行配置添加其自身的设置。
这使得像 NeoForge 这样的提供方能够为你预先配置运行配置。

然而，如果你像下面这样设置运行配置：
```groovy
runs {
    someRun {
        modSource sourceSets.some_version_a_sourceset
        modSource sourceSets.some_version_b_sourceset
    }
}
```
其中相关源集的编译类路径上都依赖于给定的 SDK 版本，而这些版本彼此不同，此时就会引发错误。
这是因为 common 插件无法确定该运行配置应使用哪个版本的 SDK。
要修复这一点，请选择其中一个版本并将其添加到运行配置中：
```groovy
runs {
    someRun {
        modSource sourceSets.some_version_a_sourceset
    }
}
```
或者
```groovy
runs {
    someRun {
        modSource sourceSets.some_version_b_sourceset
    }
}
```

###### <a id="common-runs-configuration-types-configure-by-run" /> 使用另一个运行配置来配置运行配置 {#a-idcommon-runs-configuration-types-configure-by-run--configuring-run-using-another-run}
此外，你还可以把一个运行配置克隆到另一个运行配置中：
```groovy
runs {
    someRun {
        run 'client' //In case you want to clone the client run into the someRun
        configure runTypes.client //In case you want to clone the client run type into the someRun
    }
}
```

##### 在运行配置中使用 DevLogin {#using-devlogin-in-runs}
DevLogin 工具能让你在开发过程中登录 Minecraft 账户，而无需使用 Minecraft 启动器。
在首次启动时，它会向你显示一个用于登录 Minecraft 账户的链接，随后你就可以用该工具登录你的账户。
凭据会缓存在你的本地机器上，之后的登录会复用它们，因此只有当令牌过期时才需要重新登录。
运行配置子系统使用该工具，在所有客户端运行配置中启用已登录的游玩体验。
该工具可以通过以下属性进行配置：
```properties
neogradle.subsystems.devLogin.enabled=<true/false>
```
默认情况下，该子系统是启用的，它会为你准备好登录 Minecraft 账户所需的一切，不过你仍需在你想要的那些运行配置上启用它。
如果你想禁用这一点，可以把该属性设为 false，这样你就不会被要求登录，而是使用一个随机的、未登录的开发账户。

###### <a id="common-runs-devlogin-configuration" /> 逐个运行配置进行配置 {#a-idcommon-runs-devlogin-configuration--per-run-configuration}
如果你想为每个运行配置分别配置 dev login 工具，可以在你的运行配置中设置以下属性来实现：
```groovy
runs {
    someRun {
        devLogin {
            enabled true
        }
    }
}
```
这会为该运行配置启用 dev login 工具。
默认情况下，dev login 工具是禁用的，且只能为客户端运行配置启用。

:::warning
如果你为非客户端的运行配置启用 dev login 工具，你将会收到一条错误信息。
:::

此外，还可以为 dev login 工具使用不同的用户配置文件（profile），只需在你的运行配置中设置以下属性即可：
```groovy
runs {
    someRun {
        devLogin {
            profile '<profile>'
        }
    }
}
```
如果未设置，则会使用默认的配置文件。关于配置文件的更多信息，请参见 DevLogin 文档：[DevLogin by Covers1624](https://github.com/covers1624/DevLogin/blob/main/README.md#multiple-accounts)

###### 配置 {#configurations}
为了把 dev login 工具添加到你的运行配置中，我们会创建一个自定义配置（configuration），并将 dev login 工具添加进去。
该配置是为你注册到运行配置中作为 mod 源集的第一个源集而创建的。
该配置的后缀可以按你的个人偏好自定义，只需在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.devLogin.configurationSuffix=<suffix>
```
默认情况下，后缀被设为 "DevLoginLocalOnly"。
我们采用这种方式来创建一个仅运行时（runtime only）的配置，它不会泄漏给你项目的其他消费者。

##### 在运行配置中使用 RenderDoc {#using-renderdoc-in-runs}
RenderDoc 工具能让你从游戏中捕获帧，并在其帧调试器中检视它们。
我们的连接器实现可以被可选地注入，以便与你的游戏一同启动 RenderDoc。

###### <a id="common-runs-renderdoc-configuration" /> 逐个运行配置进行配置 {#a-idcommon-runs-renderdoc-configuration--per-run-configuration}
如果你想为每个运行配置分别配置 render doc 工具，可以在你的运行配置中设置以下属性来实现：
```groovy
runs {
    someRun {
        renderDoc {
            enabled true
        }
    }
}
```
这会为该运行配置启用 render doc 工具。
默认情况下，render doc 工具是禁用的，且只能为客户端运行配置启用。

:::warning
如果你为非客户端的运行配置启用 render doc 工具，你将会收到一条错误信息。
:::

##### 资源处理 {#resource-processing}
Gradle 通过 `processResources` 任务（或非 main 源集的等价任务）开箱即用地支持资源处理。
然而，没有任何 IDE 对此开箱即用地提供支持。为了给你带来最佳体验，NeoGradle 会在你运行游戏之前替你执行 `processResources` 任务。

如果你使用 IDEA 并启用了 "Build and Run using IntelliJ IDEA" 选项，那么 NeoGradle 还会额外修改它的运行配置，
以确保在游戏启动前运行 `processResources` 任务，并将其输出重定向到你构建目录中的一个独立位置，而这些经过处理的
资源会在你的运行过程中被使用。

:::warning
这意味着 IDEA 编译过程创建的资源文件不会被使用，你也不应指望它们是最新的。
:::

##### IDEA 兼容性 {#idea-compatibility}
由于 IDEA 从行号槽（gutter）启动单元测试的方式，如果你使用 IDEA 的测试引擎运行，就无法重新配置这类测试。
为了支持这种场景，NeoGradle 默认会重新配置 IDEA 的测试默认设置，以支持在单元测试环境中运行这些测试。

然而，由于存在诸多情形，无法为所有人都正确地配置这些默认设置，如果你有非标准的测试设置，可以像下面这样配置默认设置：
```groovy
idea {
    unitTests {
        //Normal run properties, and sourceset configuration as if you are configuring a run:
        modSource sourceSets.anotherTestSourceSet
    }
}
```

如果你想禁用该功能，可以禁用相关的约定，参见 [禁用约定](#disabling-conventions)。

#### <a id="common-dep-sourceset-management" /> 源集管理 {#a-idcommon-dep-sourceset-management--sourceset-management}
common 插件提供了一种让你在项目中更轻松地管理源集的方式。
特别地，它允许你轻松地依赖另一个源集，或继承其依赖。

:::warning
不过，需要知道的重要一点是，你只能对来自同一项目的源集这样做。
如果你试图依赖来自另一个项目的源集，NeoGradle 会抛出异常。
:::

##### <a id="common-dep-sourceset-management-inherit" /> 继承依赖 {#a-idcommon-dep-sourceset-management-inherit--inheriting-dependencies}
如果你想继承另一个源集的依赖，可以在你的 build.gradle 中添加如下内容来实现：
```groovy
sourceSets {
    someSourceSet {
        inherit.from sourceSets.someOtherSourceSet
    }
}
```

##### <a id="common-dep-sourceset-management-depend" /> 依赖另一个源集 {#a-idcommon-dep-sourceset-management-depend--depending-on-another-sourceset}
如果你想依赖另一个源集，可以在你的 build.gradle 中添加如下内容来实现：
```groovy
sourceSets {
    someSourceSet {
        depends.on sourceSets.someOtherSourceSet
    }
}
```

### NeoForm Runtime 插件 {#neoform-runtime-plugin}
该插件启用 NeoForm 运行时的使用，并允许项目直接依赖经过反混淆、但在其他方面
未经修改的 Minecraft 制品。

该插件由其他插件在内部使用，通常只在高级用例中才需要它。

```gradle
plugins {
  id 'net.neoforged.gradle.neoform' version '<neogradle_version>'
}

dependencies {
  // For depending on a Minecraft JAR-file with both client- and server-classes
  implementation "net.minecraft:neoform_joined:<neoform-version>"
  
  // For depending on the Minecraft client JAR-file
  implementation "net.minecraft:neoform_client:<neoform-version>"
  
  // For depending on the Minecraft dedicated server JAR-file
  implementation "net.minecraft:neoform_server:<neoform-version>"
}
```

## 应用 Parchment 映射 {#apply-parchment-mappings}

为了在反编译后的 Minecraft 源码中获得人类可读的参数名以及 Javadoc，可以在 Minecraft 源码被重新编译之前，
将来自 [Parchment 项目](https://parchmentmc.org) 的众包数据应用到源码上。

目前这仅在应用 NeoGradle userdev 插件时受支持。

最基本的配置方式是在 gradle.properties 中使用以下属性：
```
neogradle.subsystems.parchment.minecraftVersion=1.20.2
neogradle.subsystems.parchment.mappingsVersion=2023.12.10
```

该子系统还提供了 Gradle DSL 并支持更多参数，在下面的 Gradle 代码片段中有相应说明：

```gradle
subsystems {
  parchment {
    // The Minecraft version for which the Parchment mappings were created.
    // This does not necessarily need to match the Minecraft version your mod targets
    // Defaults to the value of Gradle property neogradle.subsystems.parchment.minecraftVersion
    minecraftVersion = "1.20.2"
    
    // The version of Parchment mappings to apply.
    // See https://parchmentmc.org/docs/getting-started for a list.
    // Defaults to the value of Gradle property neogradle.subsystems.parchment.mappingsVersion
    mappingsVersion = "2023.12.10"
    
    // Overrides the full Maven coordinate of the Parchment artifact to use
    // This is computed from the minecraftVersion and mappingsVersion properties by default.
    // If you set this property explicitly, minecraftVersion and mappingsVersion will be ignored.
    // The built-in default value can also be overriden using the Gradle property neogradle.subsystems.parchment.parchmentArtifact
    // parchmentArtifact = "org.parchmentmc.data:parchment-$minecraftVersion:$mappingsVersion:checked@zip"
    
    // Set this to false if you don't want the https://maven.parchmentmc.org/ repository to be added automatically when
    // applying Parchment mappings is enabled
    // The built-in default value can also be overriden using the Gradle property neogradle.subsystems.parchment.addRepository
    // addRepository = true
    
    // Can be used to explicitly disable this subsystem. By default, it will be enabled automatically as soon
    // as parchmentArtifact or minecraftVersion and mappingsVersion are set.
    // The built-in default value can also be overriden using the Gradle property neogradle.subsystems.parchment.enabled
    // enabled = true
  }
}
```

## 高级设置 {#advanced-settings}

### <a id="common-decompiler-settings" /> 覆盖反编译器设置 {#a-idcommon-decompiler-settings--override-decompiler-settings}

反编译器在准备 Minecraft 依赖时所使用的设置，可以通过 [Gradle 属性](https://docs.gradle.org/current/userguide/project_properties.html) 来覆盖。
这在低配机器上运行 NeoGradle 时可能有用，但代价是构建时间会变慢。

| 属性                                          | 说明                                                                                                                                                                                                                            |
|----------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `neogradle.subsystems.decompiler.maxMemory`  | 分配给反编译器的堆内存大小。可以以千兆字节（`4g`）或兆字节（`4096m`）为单位指定。                                                                                                                                                    |
| `neogradle.subsystems.decompiler.maxThreads` | 默认情况下反编译器会使用所有可用的 CPU 核心。此设置可用于将其限制为给定数量的线程，线程数越少，消耗的内存越少。如果设为 0，则取消限制。                                                                                              |
| `neogradle.subsystems.decompiler.logLevel`   | 可用于覆盖 [反编译器日志级别](https://vineflower.org/usage/#cmdoption-log)。                                                                                                                                                     |

### 覆盖重编译器设置 {#override-recompiler-settings}

NeoGradle 在重新编译反编译后的 Minecraft 源码时所使用的设置，可以通过 [Gradle 属性](https://docs.gradle.org/current/userguide/project_properties.html) 来自定义。

| 属性                                          | 说明                                                                                                                                 |
|----------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `neogradle.subsystems.recompiler.maxMemory`  | 分配给反编译器的堆内存大小。可以以千兆字节（`4g`）或兆字节（`4096m`）为单位指定。默认为 `1g`。                                          |
| `neogradle.subsystems.recompiler.jvmArgs`    | 向运行编译器的、被 fork 出来的 Gradle 进程传递任意 JVM 参数。例如 `-XX:+HeapDumpOnOutOfMemoryError`                                    |
| `neogradle.subsystems.recompiler.args`       | 向 Java 编译器传递额外的命令行参数。                                                                                                  |
| `neogradle.subsystems.recompiler.shouldFork` | 指示是否应为重编译器使用进程 fork。（默认为 true）。                                                                                   |

## <a id="common-dep-run-specific-dependency-management" /> 运行配置专属的依赖管理 {#a-idcommon-dep-run-specific-dependency-management--run-specific-dependency-management}
:::warning
Minecraft 21.9 及更高版本不再需要运行配置专属的依赖管理。请移除你的相关 Gradle 代码。NeoGradle 已不再使用它来配置 NeoForge 或 FML。
:::

这实现了针对某个运行配置类路径的、运行配置专属的依赖管理。
过去这必须通过手动修改 "minecraft_classpath" 令牌来完成，然而令牌作为一种可在运行配置上配置的组件已不复存在。
因此过去无法将不感知 FML 的库添加到运行配置的类路径中。

### 用法： {#usage}
#### 直接方式 {#direct}
```groovy
dependencies {
    implementation 'some:library:1.2.3'
}

runs {
   testRun {
      dependencies {
         runtime 'some:library:1.2.3'
      }
   }
}
```
#### 配置方式 {#configuration}
```groovy
configurations {
   libraries {}
   implementation.extendsFrom libraries
}

dependencies {
    libraries 'some:library:1.2.3'
}

runs {
   testRun {
      dependencies {
         runtime project.configurations.libraries
      }
   }
}
```
#### 运行配置依赖处理器 {#run-dependency-handler}
运行配置上的依赖处理器与项目自身的依赖处理器工作方式非常相似，不过它只有一个可供添加依赖的“配置”："runtime"。此外，当你想把整个配置转变为运行时依赖时，它还提供了一个可用的方法。

## 处理非 NeoGradle 的同级项目 {#handling-of-none-neogradle-sibling-projects}
总的来说，对于这种情况，我们建议——不，是强烈鼓励——**不要**使用 fat jar。
把来自同级项目的所有代码打成一个 fat jar 的过程，很难以一种既正确又对开发项目高效的方式来建模，尤其是当同级项目并不使用 NeoGradle 时。

### 同级项目使用某个 NeoGradle 模块 {#sibling-project-uses-a-neogradle-module}
如果可以使用某个 NeoGradle 模块（例如用 Vanilla 模块代替 VanillaGradle），那么你可以使用源集的 mod 标识符：
```groovy
sourceSets {
    main {
        run {
            modIdentifier '<some string that all projects in your fat jar have in common>'
        }
    }
}
```
这里 modIdentifier 的取值本身并不重要，所有具有相同源集 mod 标识符的项目在运行你的运行配置时都会被包含到同一个伪 fat jar 中。

### 同级项目不使用 NeoGradle {#sibling-project-does-not-use-neogradle}
如果同级项目不使用 NeoGradle，那么你必须确保它的 Manifest 得到了正确配置：
```text
FMLModType: GAMELIBRARY #Or any other mod type that is not a mod, like LIBRARY
Automatic-Module-Name: '<some string that is unique to this project>'
```
:::warning
如果你这样做，那么你的这些同级项目就不允许在同一个包中包含类！这是因为不允许两个模块包含相同的包。
如果你有两个同级项目在同一个包中含有类，那么你就需要把其中一个移动到别处！
:::

### 将同级项目包含到你的运行配置中 {#including-the-sibling-project-in-your-run}
要将同级项目包含到你的运行配置中，你需要把它作为 modSource 添加到运行配置里：
```groovy
runs {
    someRun {
        modSources {
            add project.sourceSets.main // Adds the owning projects main sourceset to a group based on that sourcesets mod identifier (could be anything here, depending on the sourcesets extension values, or the project name)
            add project(':api').sourceSets.main // Assuming the API project is not using NeoGradle, this would add the api project to a group using the `api` key, because the default mod identifier for non-neogradle projects is the projects name, here api
            local project(':api').sourceSets.main // Assuming the API project is not using NeoGradle, this would add the api project to a group using the owning projects name, instead of the api projects name as a fallback (could be anything here, depending on the sourcesets extension values, or the project name)
            add('something', project(':api').sourceSets.main) // This hardcodes the group identifier to 'something', performing no lookup of the mod identifier on the sourceset, or using the owning project, or the sourcesets project.
        }
    }
}
```
无需其他任何操作。

## 使用约定 {#using-conventions}
### 禁用约定 {#disabling-conventions}
默认情况下，约定是启用的。
如果你想禁用约定，可以在你的 gradle.properties 中设置以下属性来实现：
```properties
neogradle.subsystems.conventions.enabled=false
```
从今往后我们将默认约定处于启用状态，因此如果你想禁用它们，就必须显式地这样做。
### 配置（Configurations） {#configurations-1}
NeoGradle 会向你的项目添加若干个 `Configurations`。
可以通过在你的 gradle.properties 中设置以下属性来禁用该约定：
```properties
neogradle.subsystems.conventions.configurations.enabled=false
```

每个 SourceSet 都会添加以下配置，其中 XXX 为 SourceSet 名称：
- XXXLocalRuntime
- XXXLocalRunRuntime
:::note
要使其生效，你的 SourceSet 需要在你的 dependency 块之前定义。
:::

每个 Run 都会添加以下配置：
- XXXRun
:::note
要使其生效，你的 Run 需要在你的 dependency 块之前定义。
:::

在全局范围会添加以下配置：
- runs

#### LocalRuntime（每个 SourceSet） {#localruntime-per-sourceset}
该配置用于仅向你本地项目的运行时添加依赖，而不将它们暴露给其他项目的运行时。
需要启用源集约定。

#### LocalRunRuntime（每个 SourceSet） {#localrunruntime-per-sourceset}
该配置用于向你把这些 SourceSet 添加进去的那些运行配置的本地运行时添加依赖，而不将它们暴露给其他运行配置的运行时。
需要启用源集约定。

#### Run（每个 Run） {#run-per-run}
该配置用于仅向某个特定运行配置的运行时添加依赖，而不将它们暴露给其他运行配置的运行时。

#### run（全局） {#run-global}
该配置用于向所有运行配置的运行时添加依赖。

### 源集管理 {#sourceset-management}
要禁用源集管理，你可以在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.conventions.sourcesets.enabled=false
```

#### 自动将当前项目包含到其运行配置中 {#automatic-inclusion-of-the-current-project-in-its-runs}
默认情况下，当前项目的 main 源集会被自动包含到其运行配置中。
如果你想禁用这一点，可以在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.conventions.sourcesets.automatic-inclusion=false
```

如果你想禁用这一点，可以在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.conventions.sourcesets.automatic-inclusion=false
```

这等价于在你的 build.gradle 中设置如下内容：
```groovy
runs {
    configureEach { run ->
        run.modSource sourceSets.main
    }
}
```
##### 自动将某个源集的本地运行运行时配置包含到某个运行配置的配置中 {#automatic-inclusion-of-a-sourcesets-local-run-runtime-configuration-in-a-runs-configuration}
默认情况下，某个源集的本地运行运行时配置会被自动包含到该运行配置的运行配置里。
如果你想禁用这一点，可以在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.conventions.sourcesets.automatic-inclusion-local-run-runtime=false
```
这等价于在你的 build.gradle 中设置如下内容：
```groovy
runs {
    configureEach { run ->
        run.dependencies {
            runtime sourceSets.main.configurations.localRunRuntime
        }
    }
}
```
如果禁用了该功能，那么相关配置的本地运行运行时配置将不会被创建。

### IDE 集成 {#ide-integrations}
要禁用 IDE 集成，你可以在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.conventions.ide.enabled=false
```
#### IDEA {#idea}
要禁用 IDEA 集成，你可以在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.conventions.ide.idea.enabled=false
```
##### 使用 IDEA 运行 {#run-with-idea}
如果你已将 IDEA IDE 配置为使用其自身的编译器运行，可以在你的 gradle.properties 中设置以下属性来禁用对 IDEA 编译器的自动检测：
```properties
neogradle.subsystems.conventions.ide.idea.compiler-detection=false
```
该自动检测会设置 DSL 属性，在使用 IDEA 运行和编译时禁用该属性意味着你需要自行设置这个属性。
```groovy
idea {
    project {
        runs {
            runWithIdea = true / false
        }
    }
}
```

:::note
该 API 仅在根项目上可用，因为 IDEA 的项目模型正位于此处。
:::

如果出于任何原因 IDEA 没有在你的根项目中正确注册其模型，你也可以使用：
```groovy
minecraft {
    idea {
        runWithIdea = true / false
    }
}
```

:::warning
该模型是项目专属的，与上文所示的、仅在根项目上可用的 API 相反。
因此应当在所有项目上一次性设置它。我们建议使用约定插件或类似的、与 Config Cache 兼容的机制。
:::

##### 使用参数文件 {#using-arg-files}
有时，当 IDEA 使用参数文件（args file）来缩短其命令行参数，并且启用了使用 Gradle 运行（这是默认行为）时，它会生成一个与 Config Cache 不兼容的 init 脚本。
为了避免 Gradle 因这个不兼容的脚本而对 IDEA 发火，你可以让 NG 生成一个不缩短命令行的启动配置。

:::note
这可能并非在所有操作系统上都有效。某些路径配置可能会因为启动命令过长而使你无法启动游戏。
:::

你可以使用以下约定：
```properties
neogradle.subsystems.conventions.ide.idea.use-args-file=false
```

或者使用以下模型 API：

```groovy
idea {
    project {
        runs {
            useArgsFile = true / false
        }
    }
}
```
这将把系统配置为使用你偏好的约定。

:::note
该 API 仅在根项目上可用，因为 IDEA 的项目模型正位于此处。
:::

如果出于任何原因 IDEA 没有在你的根项目中正确注册其模型，你也可以使用：
```groovy
minecraft {
    idea {
        useArgsFile = true / false
    }
}
```

:::warning
该模型是项目专属的，与上文所示的、仅在根项目上可用的 API 相反。
因此应当在所有项目上一次性设置它。我们建议使用约定插件或类似的、与 Config Cache 兼容的机制。
:::

##### 使用同步后任务 {#post-sync-task-usage}
默认情况下，IDEA 中的导入是在 sync 任务期间运行的。
如果你想禁用这一点，转而使用同步后任务（post sync task），可以在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.conventions.ide.idea.use-post-sync-task=true
```

##### 重新配置 IDEA 单元测试模板 {#reconfiguration-of-idea-unit-test-templates}
默认情况下，IDEA 单元测试模板不会被重新配置为支持从行号槽运行单元测试。
你可以在你的 gradle.properties 中设置以下属性来启用该行为：
```properties
neogradle.subsystems.conventions.ide.idea.reconfigure-unit-test-templates=true
```

### 运行配置 {#runs}
要禁用运行配置约定，你可以在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.conventions.runs.enabled=false
```

#### 每种类型自动创建默认运行配置 {#automatic-default-run-per-type}
默认情况下，会为每种类型的运行配置各创建一个运行配置。
如果你想禁用这一点，可以在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.conventions.runs.create-default-run-per-type=false
```

#### DevLogin 约定 {#devlogin-conventions}
如果你想为所有客户端运行配置启用 dev login 工具，可以在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.conventions.runs.devlogin.conventionForRun=true
```
这会为所有客户端运行配置启用 dev login 工具，除非被显式禁用。

#### RenderDoc 约定 {#renderdoc-conventions}
如果你想为所有客户端运行配置启用 render doc 工具，可以在你的 gradle.properties 中设置以下属性：
```properties
neogradle.subsystems.conventions.runs.renderdoc.conventionForRun=true
```
这会为所有客户端运行配置启用 render doc 工具，除非被显式禁用。


## 工具覆盖 {#tool-overrides}
要配置 NG 各个子系统所使用的工具，可以使用 subsystems DSL 和属性来配置以下工具：
### JST {#jst}
该工具由 parchment 子系统用于应用其名称与 javadoc，同时也被源码访问转换器系统用于应用其转换。
以下属性可用于配置 JST 工具：
```properties
neogradle.subsystems.tools.jst=<artifact coordinate for jst cli tool>
```
### DevLogin {#devlogin}
该工具由运行配置中的 dev login 子系统用于在客户端运行配置中启用 Minecraft 身份验证。
以下属性可用于配置 DevLogin 工具：
```properties
neogradle.subsystems.tools.devLogin=<artifact coordinate for devlogin cli tool>
```
关于该工具、其发布版本及文档的更多信息，可在此处找到：[DevLogin by Covers1624](https://github.com/covers1624/DevLogin)
### RenderDoc {#renderdoc}
该工具由运行配置中的 RenderDoc 子系统用于在客户端运行配置中捕获游戏帧。
以下属性可用于配置 RenderDoc 工具：
```properties
neogradle.subsystems.tools.renderDoc.path=<path to the RenderDoc download and installation directory>
neogradle.subsystems.tools.renderDoc.version=<version of RenderDoc to use>
neogradle.subsystems.tools.renderDoc.renderNurse=<artifact coordinate for rendernurse agent tool>
```
关于该工具、其发布版本及文档的更多信息，可在此处找到：[RenderDoc](https://renderdoc.org/) 与 [RenderNurse](https://github.com/neoforged/RenderNurse)

## 集中式缓存 {#centralized-cache}
NeoGradle 拥有一个集中式缓存，可用于存储反编译后的 Minecraft 源码、重新编译后的 Minecraft 源码，以及其他复杂任务的任务输出。
该缓存默认启用，可以通过在你的 gradle.properties 中设置以下属性来禁用：
```properties
net.neoforged.gradle.caching.enabled=false
```

你可以通过运行以下命令来清理缓存中存储的制品：
```shell
./gradlew cleanCache
```

该命令在你运行 clean 任务时也会被自动执行。
该命令会检查已存储的制品数量是否高于配置的阈值，如果是，则移除最旧的制品，直到数量低于该阈值。
数量由你 gradle.properties 中的以下属性配置：
```properties
net.neoforged.gradle.caching.maxCacheSize=<number>
```

### 调试 {#debugging}
有两个属性可供你调整，以获取关于缓存的更多信息：
```properties
net.neoforged.gradle.caching.logCacheHits=<true/false>
```
以及
```properties
net.neoforged.gradle.caching.debug=<true/false>
```
第一个属性会在发生缓存命中时记录日志，第二个属性则会记录关于缓存的更多总体信息，包括哈希是如何计算的。
如果你在缓存方面遇到问题，可以启用这些属性以获取关于正在发生什么的更多信息。

## 测试 {#testing}
本项目有许多测试。
请不要在本地运行它们（除非是有范围限定地运行），而应在 PR 场景中运行全部测试。

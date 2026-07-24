# 依赖 {#dependencies}

依赖不仅用于开发 Mod 之间的互操作性或向游戏中添加额外的库，还决定了你要为哪个版本的 Minecraft 进行开发。本文将快速介绍如何修改 `repositories` 与 `dependencies` 代码块，从而为你的开发环境添加依赖。

:::note

本文不会深入讲解 Gradle 的相关概念。强烈建议你在继续之前先阅读 [Gradle 依赖管理指南][guide]。

:::

## Mod 依赖 {#mod-dependencies}

所有 Mod 依赖的添加方式与其他任何构件（artifact）相同。

```gradle
dependencies {
    // Assume we have some artifact 'examplemod' that can be obtained from a specified repository
    implementation 'com.example:examplemod:1.0'
}
```

### 本地 Mod 依赖 {#local-mod-dependencies}

如果你想依赖的 Mod 无法从某个 maven 仓库获取（例如 [Maven Central][central]、[CurseMaven]、[Modrinth]），你可以改用[扁平目录（flat directory）][flat]来添加 Mod 依赖：

```gradle
repositories {
    // Adds the 'libs' folder in the project directory as a flat directory
    flatDir {
        dir 'libs'
    }
}

dependencies {
    // ...

    // Given some <group>:<name>:<version>:<classifier (default None)>
    //   with an extension <ext (default jar)>
    // Artifacts in flat directories will be resolved in the following order:
    // - <name>-<version>.<ext>
    // - <name>-<version>-<classifier>.<ext>
    // - <name>.<ext>
    // - <name>-<classifier>.<ext>

    // If a classifier is explicitly specified
    //  artifacts with the classifier will take priority:
    // - examplemod-1.0-api.jar
    // - examplemod-api.jar
    // - examplemod-1.0.jar
    // - examplemod.jar
    implementation 'com.example:examplemod:1.0:api'
}
```

:::note
对于扁平目录中的条目，group 名称可以任意取值，但禁止为空，因为在解析构件文件时并不会对其进行校验。
:::

[guide]: https://docs.gradle.org/8.14.3/userguide/dependency_management.html

[central]: https://central.sonatype.com/
[CurseMaven]: https://cursemaven.com/
[Modrinth]: https://docs.modrinth.com/docs/tutorials/maven/

[flat]: https://docs.gradle.org/8.14.3/userguide/supported_repository_types.html#sec:flat-dir-resolver

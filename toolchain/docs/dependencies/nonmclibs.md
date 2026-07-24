---
sidebar_position: 1
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 非 Minecraft 依赖 {#non-minecraft-dependencies}

非 Minecraft 依赖是指既不是 Mod、也不是 Minecraft 或 NeoForge 本身所依赖的那些构件。默认情况下，NeoForge 在加载 Mod 时不会加载非 Minecraft 依赖。在开发环境中，它们必须作为运行时依赖添加；而在生产环境中，则应当利用 [jar-in-jar 系统][jij]。

## 1.21.9 及以上 {#1219-and-above}

在 1.21.9 及以上版本运行 NeoForge 时，开发环境中会加载类路径上的任何内容，包括非 Minecraft 依赖。这意味着添加该库与添加任何其他 gradle 依赖一样简单：

```gradle
// This adds the library at compile and runtime
// In practice, this should be wrapped with 'jarJar'
// to include the library in your jar
implementation 'com.example:example:1.0'
```

## 1.21.8 及以下 {#1218-and-below}

在 1.21.8 及以下版本运行 NeoForge 时，还需要额外将该库添加到运行时类路径中：

<Tabs defaultValue="mdg">
<TabItem value="mdg" label="ModDevGradle">

```gradle
dependencies {
    // This is required to add the library at compile time
    implementation 'com.example:example:1.0'
    // This adds the library to all the runs
    additionalRuntimeClasspath 'com.example:example:1.0'
}
```

</TabItem>
<TabItem value="ng" label="NeoGradle">

```gradle
dependencies {
    implementation 'com.example:example:1.0'
}

runs {
    configureEach {
        dependencies {
            // highlight-next-line
            runtime 'com.example:example:1.0'
        }
    }
}
```

或者，你也可以使用一个 configuration：

```gradle
configurations {
    libraries
    // This will make sure that all dependencies that you add to the libraries configuration will also be added to the implementation configuration
    // This way, you only need one dependency declaration for both runtime and compile dependencies
    implementation.extendsFrom libraries
}

dependencies {
    libraries 'com.example:example:1.0'
}

runs {
    configureEach {
        dependencies {
            // highlight-next-line
            runtime project.configurations.libraries
        }
    }
}
```

</TabItem>
</Tabs>

[jij]: jarinjar.md

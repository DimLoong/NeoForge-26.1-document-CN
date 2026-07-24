# Jar-in-Jar {#jar-in-jar}

jar-in-jar 是一种从 Mod 的 jar 内部为其加载依赖的方式。为此，jar-in-jar 会在构建时于 `META-INF/jarjar/metadata.json` 中生成一份元数据 json，其中记录了需要从该 jar 内部加载的构件。

jar-in-jar 是一套完全可选的系统。它会把 `jarJar` 配置中的所有依赖纳入 `jarJar` 任务。

## 添加依赖 {#adding-dependencies}

你可以使用 `jarJar` 配置来添加需要打包进你 jar 中的依赖。jar-in-jar 是一套协商系统，默认情况下会从 `prefer` 版本出发，创建并纳入其中的最高版本。

```gradle
// In build.gradle
dependencies {
    // Compiles against and includes the supported version of examplelib
    //   from 2.0 (inclusive)
    jarJar(implementation(group: 'com.example', name: 'examplelib')) {
        version {
            // Version used in your workspace and bundled in mod jar
            prefer '2.0'
        }
    }
}
```

如果你的库只应在某个确切的版本范围内工作，而不是从首选版本一直取到现有的最高版本，你可以将 `strictly` 配置为你的 Mod 所兼容的范围：

```gradle
// In build.gradle
dependencies {
    // Compiles against the highest supported version of examplelib
    //   between 2.0 (inclusive) and 3.0 (exclusive)
    jarJar(implementation(group: 'com.example', name: 'examplelib') {
        version {
            // Sets the supported version of examplelib
            //   between 2.0 (inclusive) and 3.0 (exclusive)
            strictly '[2.0,3.0)'
            // Version used in your workspace and bundled in mod jar
            prefer '2.8.0'
        }
    }
}
```

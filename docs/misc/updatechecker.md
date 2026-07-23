# NeoForge 更新检查器 {#neoforge-update-checker}

NeoForge 提供了一套非常轻量、需主动开启的更新检查框架。如果任何 Mod 有可用更新，它会在主菜单和 Mod 列表的 'Mods' 按钮上显示一个闪烁的图标，并附上相应的更新日志。它*不会*自动下载更新。

## 开始使用 {#getting-started}

你首先要做的是在 `mods.toml` 文件中指定 `updateJSONURL` 参数。该参数的值应当是一个有效的 URL，指向一个更新 JSON 文件。此文件可以托管在你自己的 Web 服务器、GitHub，或任何你想要的地方，只要它能被你 Mod 的所有用户可靠地访问到即可。

## 更新 JSON 格式 {#update-json-format}

该 JSON 本身的格式相对简单，如下所示：

```json5
{
    "homepage": "<homepage/download page for your mod>",
    "<mcversion>": {
        "<modversion>": "<changelog for this version>", 
        // List all versions of your mod for the given Minecraft version, along with their changelogs
        // ...
    },
    "promos": {
        "<mcversion>-latest": "<modversion>",
        // Declare the latest "bleeding-edge" version of your mod for the given Minecraft version
        "<mcversion>-recommended": "<modversion>",
        // Declare the latest "stable" version of your mod for the given Minecraft version
        // ...
    }
}
```

这些内容基本上是不言自明的，但有几点说明：

- `homepage` 下的链接是当 Mod 过时时向用户展示的链接。
- NeoForge 使用一套内部算法来判断你 Mod 的某个版本字符串是否比另一个“更新”。大多数版本命名方案都应当兼容，但如果你担心自己的方案是否受支持，请参阅 `ComparableVersion` 类。强烈推荐遵循 [Maven 版本规范][mvnver]。
- 更新日志字符串可以使用 `\n` 分隔成多行。有些人倾向于只放一份简略的更新日志，然后链接到一个提供完整变更列表的外部站点。
- 手动录入数据可能很繁琐。由于 Groovy 原生支持 JSON 解析，你可以配置你的 `build.gradle`，在构建发布版本时自动更新此文件。具体如何实现留给读者作为练习。

- 这里可以找到一些示例：[nocubes]、[Corail Tombstone][corail] 和 [Chisels & Bits 2][chisel]。

## 获取更新检查结果 {#retrieving-update-check-results}

你可以使用 `VersionChecker#getResult(IModInfo)` 获取 NeoForge 更新检查器的结果。你可以通过 `ModContainer#getModInfo` 获取你的 `IModInfo`，其中 `ModContainer` 可以作为参数添加到你的 Mod 构造器中。你可以使用 `ModList.get().getModContainerById(<modId>)` 获取任何其他 Mod 的 `ModContainer`。返回的对象有一个 `#status` 方法，用于指示版本检查的状态。

|          状态 | 描述 |
|----------------:|:------------|
|        `FAILED` | 版本检查器无法连接到所提供的 URL。 |
|    `UP_TO_DATE` | 当前版本与推荐版本相同。 |
|         `AHEAD` | 在没有 latest 版本的情况下，当前版本比推荐版本更新。 |
|      `OUTDATED` | 有新的推荐版本或 latest 版本。 |
| `BETA_OUTDATED` | 有新的 latest 版本。 |
|          `BETA` | 当前版本等于或新于 latest 版本。 |
|       `PENDING` | 请求的结果尚未完成，因此你应当稍后再试。 |

返回的对象还会包含目标版本，以及 `update.json` 中所指定的任何更新日志行。

[mvnver]: ../gettingstarted/versioning.md
[nocubes]: https://cadiboo.github.io/projects/nocubes/update.json
[corail]: https://github.com/Corail31/tombstone_lite/blob/master/update.json
[chisel]: https://curseupdate.com/231095/chiselsandbits?ml=neoforge

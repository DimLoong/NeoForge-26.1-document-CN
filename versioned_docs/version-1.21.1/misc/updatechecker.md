# NeoForge 更新检查器 {#neoforge-update-checker}

NeoForge 提供了一个非常轻量级、可选择加入的更新检查框架。如果任何 Mod 有可用的更新，它将在主菜单和 Mod 列表的“Mod”按钮上显示一个闪烁的图标以及相应的更改日志。它*不会*自​​动下载更新。

## 入门 {#getting-started}

你要做的第一件事是在 `mods.toml` 文件中指定 `updateJSONURL` 参数。此参数的值应该是指向更新 JSON 文件的有效 URL。该文件可以托管在你自己的网络服务器、 GitHub 或任何你想要的地方，只要你的 mod 的所有用户都可以可靠地访问它。

## 更新 JSON 格式 {#update-json-format}

JSON 本身有一个相对简单的格式，如下所示：

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

这是相当不言自明的，但有一些注意事项：
 
- `homepage` 下的链接是当 mod 过时时将向用户显示的链接。
- NeoForge 使用一种内部算法来确定你的 mod 的一个版本字符串是否比另一个版本字符串“新”。大多数版本控制方案应该兼容，但如果你担心你的方案是否受支持，请参阅 `ComparableVersion` 类。强烈建议遵守 [Maven 版本控制][mvnver]。
- 可以使用 `
` 将更改日志字符串分成几行。有些人喜欢包含简短的更改日志，然后链接到提供完整更改列表的外部站点。
- 手动输入数据可能很繁琐。你可以将 `build.gradle` 配置为在构建版本时自动更新此文件，因为 Groovy 具有本机 JSON 解析支持。这样做留给读者作为练习。

- 可以在此处找到 [nocubes]、[Corail Tombstone][corail] 和 [Chisels & Bits 2][chisel] 的一些示例。

## 检索更新检查结果 {#retrieving-update-check-results}

你可以使用 `VersionChecker#getResult(IModInfo)` 检索 NeoForge 更新检查器的结果。你可以通过 `ModContainer#getModInfo` 获取你的 `IModInfo`，其中 `ModContainer` 可以作为参数添加到你的 mod 构造函数中。你可以使用 `ModList.get().getModContainerById(<modId>)` 获得任何其他 mod 的 `ModContainer`。返回的对象有一个方法 `#status`，它指示版本检查的状态。

|          状态 |描述 |
|----------------:|:------------|
|`FAILED`|版本检查器无法连接到提供的 URL。 |
|`UP_TO_DATE`|当前版本等于推荐版本。 |
|`AHEAD`|如果没有最新版本，则当前版本比推荐版本新。 |
|`OUTDATED`|有新推荐或最新版本。 |
|`BETA_OUTDATED`|有一个新的最新版本。 |
|`BETA`|当前版本等于或更新于最新版本。 |
|`PENDING`|请求的结果尚未完成，因此你应该稍后重试。 |

返回的对象还将具有 `update.json` 中指定的目标版本和任何更改日志行。

[mvnver]: ../gettingstarted/versioning.md
[nocubes]: https://cadiboo.github.io/projects/nocubes/update.json
[corail]: https://github.com/Corail31/tombstone_lite/blob/master/update.json
[chisel]: https://github.com/Aeltumn/Chisels-and-Bits-2/blob/master/update.json

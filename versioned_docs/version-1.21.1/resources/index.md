# 资源 {#resources}

资源是游戏使用的外部文件，但并非代码。最常见的资源种类是纹理，然而 Minecraft 生态中还存在许多其他类型的资源。当然，所有这些资源都需要代码端的消费方，因此消费这些资源的系统也归入本章节一并介绍。

Minecraft 大体上有两类资源：面向[逻辑客户端][logicalsides]的资源，称为 assets（资产）；以及面向[逻辑服务端][logicalsides]的资源，称为 data（数据）。资产大多是仅用于显示的信息，例如纹理、显示模型、翻译或声音，而数据则包含各种影响游戏玩法的东西，例如战利品表、配方或世界生成信息。它们分别从资源包和数据包中加载。 NeoForge 会为每个 Mod 生成一个内置的资源包和数据包。

资源包和数据包通常都需要一个 [`pack.mcmeta` 文件][packmcmeta]；不过，现代 NeoForge 会在运行时为你生成这些文件，所以你无需为此操心。

如果你对某个东西的格式感到困惑，可以看看原版资源。你的 NeoForge 开发环境不仅包含原版代码，也包含原版资源。它们可以在 External Resources 部分（IntelliJ）/ Project Libraries 部分（Eclipse）中找到，名称为 `ng_dummy_ng.net.minecraft:client:client-extra:<minecraft_version>`（对应 Minecraft 资源）或 `ng_dummy_ng.net.neoforged:neoforge:<neoforge_version>`（对应 NeoForge 资源）。

## 资产 {#assets}

_另见：[Minecraft Wiki][mcwiki] 上的[资源包][mcwikiresourcepacks]_

资产，即客户端资源，是所有仅在[客户端][sides]相关的资源。它们从资源包中加载，有时也按旧称叫作材质包（texture pack，源自旧版本中它们只能影响纹理的时期）。资源包本质上就是一个 `assets` 文件夹。 `assets` 文件夹为资源包所包含的各个命名空间分别设有子文件夹；每个命名空间对应一个子文件夹。例如，id 为 `coolmod` 的 Mod 的资源包很可能包含一个 `coolmod` 命名空间，但也可能额外包含其他命名空间，例如 `minecraft`。

NeoForge 会自动将所有 Mod 资源包收集到 `Mod resources` 包中，该包位于资源包菜单中已选包（Selected Packs）一侧的最底部。目前无法禁用 `Mod resources` 包。不过，排在 `Mod resources` 包上方的资源包会覆盖下方资源包中定义的资源。这一机制使得资源包作者可以覆盖你 Mod 的资源，也使得 Mod 开发者可以在需要时覆盖 Minecraft 资源。

资源包可以包含[模型][models]、[方块状态文件][bsfile]、[纹理][textures]、[声音][sounds]、[粒子定义][particles]和[翻译文件][translations]。

## 数据 {#data}

_另见：[Minecraft Wiki][mcwiki] 上的[数据包][mcwikidatapacks]_

与资产相对，data（数据）是所有[服务端][sides]资源的统称。与资源包类似，数据通过数据包（datapack）加载。和资源包一样，数据包由一个 [`pack.mcmeta` 文件][packmcmeta]和一个名为 `data` 的根文件夹组成。然后，同样和资源包一样，该 `data` 文件夹为数据包所包含的各个命名空间分别设有子文件夹；每个命名空间对应一个子文件夹。例如，id 为 `coolmod` 的 Mod 的数据包很可能包含一个 `coolmod` 命名空间，但也可能额外包含其他命名空间，例如 `minecraft`。

NeoForge 会在新世界创建时自动将所有 Mod 数据包应用到该世界。目前无法禁用 Mod 数据包。不过，大多数数据文件可以被优先级更高的数据包覆盖（因而也可以通过用空文件替换它们来移除）。可以通过把额外的数据包放入某个世界的 `datapacks` 子文件夹，然后用 [`/datapack`][datapackcmd] 命令来启用或禁用它们。

:::info
目前没有内置的方式能把一组自定义数据包应用到每一个世界。不过，有一些 Mod 可以实现这一点。
:::

数据包可以包含影响以下内容的文件夹与文件：

| 文件夹名                                                                          | 内容                         |
|-----------------------------------------------------------------------------------|------------------------------|
| `advancement`                                                                     | [进度][advancements]         |
| `damage_type`                                                                     | [伤害类型][damagetypes]      |
| `loot_table`                                                                      | [战利品表][loottables]       |
| `recipe`                                                                          | [配方][recipes]              |
| `tags`                                                                            | [标签][tags]                 |
| `neoforge/data_maps`                                                              | [数据映射][datamap]          |
| `neoforge/loot_modifiers`                                                         | [全局战利品修改器][glm]      |
| `dimension`, `dimension_type`, `structure`, `worldgen`, `neoforge/biome_modifier` | 世界生成文件                 |

此外，它们还可以为一些与命令集成的系统设有子文件夹。这些系统很少与 Mod 一起使用，但仍值得一提：

| 文件夹名        | 内容                           |
|-----------------|--------------------------------|
| `chat_type`     | [聊天类型][chattype]           |
| `function`      | [函数][function]               |
| `item_modifier` | [物品修改器][itemmodifier]     |
| `predicate`     | [谓词][predicate]              |

## `pack.mcmeta` {#packmcmeta}

_另见：[Minecraft Wiki][mcwiki] 上的 [`pack.mcmeta`（资源包）][packmcmetaresourcepack] 和 [`pack.mcmeta`（数据包）][packmcmetadatapack]_

`pack.mcmeta` 文件保存着资源包或数据包的元数据。对于 Mod 而言，NeoForge 使这个文件变得多余，因为 `pack.mcmeta` 会被人工合成生成。如果你仍然需要一个 `pack.mcmeta` 文件，完整规范可在上面链接的 Minecraft Wiki 文章中找到。

## 数据生成 {#data-generation}

数据生成，俗称 datagen，是一种以编程方式生成 JSON 资源文件的手段，用以避免手写这些文件时既繁琐又容易出错的过程。这个名字有点误导，因为它对资产和数据都适用。

Datagen 通过 Data 运行配置来运行，该配置会与 Client 和 Server 运行配置一起为你生成。 data 运行配置遵循[Mod 生命周期][lifecycle]，直到注册事件触发之后。随后它会触发 [`GatherDataEvent`][event]，你可以在其中以数据提供器的形式注册待生成的对象，把这些对象写入磁盘，然后结束整个过程。

所有数据提供器都实现了 `DataProvider` 接口，通常需要覆盖一个方法。以下是 Minecraft 和 NeoForge 提供的一些值得关注的数据生成器列表（链接的文章会补充更多信息，例如各种辅助方法）：

| 类                                                   | 方法                             | 生成内容                                                                | 端     | 备注                                                                                                          |
|------------------------------------------------------|----------------------------------|-------------------------------------------------------------------------|--------|-----------------------------------------------------------------------------------------------------------------|
| [`BlockStateProvider`][blockstateprovider]           | `registerStatesAndModels()`      | 方块状态文件、方块模型                                                   | 客户端 |                                                                                                                 |
| [`ItemModelProvider`][itemmodelprovider]             | `registerModels()`               | 物品模型                                                                | 客户端 |                                                                                                                 |
| [`LanguageProvider`][langprovider]                   | `addTranslations()`              | 翻译                                                                    | 客户端 | 还需要在构造函数中传入语言。                                                                                    |
| [`ParticleDescriptionProvider`][particleprovider]    | `addDescriptions()`              | 粒子定义                                                                | 客户端 |                                                                                                                 |
| [`SoundDefinitionsProvider`][soundprovider]          | `registerSounds()`               | 声音定义                                                                | 客户端 |                                                                                                                 |
| `SpriteSourceProvider`                               | `gather()`                       | 精灵来源 / 图集                                                         | 客户端 |                                                                                                                 |
| [`AdvancementProvider`][advancementprovider]         | `generate()`                     | 进度                                                                    | 服务端 | 务必使用 NeoForge 版本，而非 Minecraft 版本。                                                                    |
| [`LootTableProvider`][loottableprovider]             | `generate()`                     | 战利品表                                                                | 服务端 | 需要额外的方法和类才能正常工作，详见链接文章。                                                                  |
| [`RecipeProvider`][recipeprovider]                   | `buildRecipes(RecipeOutput)`     | 配方                                                                    | 服务端 |                                                                                                                 |
| [`TagsProvider` 的各类子类][tagsprovider]            | `addTags(HolderLookup.Provider)` | 标签                                                                    | 服务端 | 存在若干专门的子类，详见链接文章。                                                                              |
| [`DataMapProvider`][datamapprovider]                 | `gather()`                       | 数据映射条目                                                            | 服务端 |                                                                                                                 |
| [`GlobalLootModifierProvider`][glmprovider]          | `start()`                        | 全局战利品修改器                                                        | 服务端 |                                                                                                                 |
| [`DatapackBuiltinEntriesProvider`][datapackprovider] | 无                               | 数据包内置条目，例如世界生成和[伤害类型][damagetypes]                    | 服务端 | 不覆盖方法，而是在构造函数中的一个 lambda 里添加条目。详见链接文章。                                            |
| `JsonCodecProvider`（抽象类）                        | `gather()`                       | 带有 codec 的对象                                                       | 两端   | 可以扩展它，用于任何带有 [codec] 的对象，以将数据编码写出。                                                     |

所有这些提供器都遵循同一模式。首先，你创建一个子类并添加你自己要生成的资源。然后，你在[事件处理器][eventhandler]中把该提供器添加到事件上。以下是一个使用 `RecipeProvider` 的示例：

```java
public class MyRecipeProvider extends RecipeProvider {
    public MyRecipeProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider) {
        super(output, lookupProvider);
    }

    @Override
    protected void buildRecipes(RecipeOutput output) {
        // Register your recipes here.
    }
}

// In some event handler class
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    // Data generators may require some of these as constructor parameters.
    // See below for more details on each of these.
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();
    CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();

    // Register the provider.
    generator.addProvider(
            // A boolean that determines whether the data should actually be generated.
            // The event provides methods that determine this:
            // event.includeClient(), event.includeServer(),
            // event.includeDev() and event.includeReports().
            // Since recipes are server data, we only run them in a server datagen.
            event.includeServer(),
            // Our provider.
            new MyRecipeProvider(output, lookupProvider)
    );
    // Other data providers here.
}
```

该事件为你提供了一些可用的上下文：

- `event.getGenerator()` 返回你要向其注册提供器的 `DataGenerator`。
- `event.getPackOutput()` 返回一个 `PackOutput`，某些提供器用它来确定文件的输出位置。
- `event.getExistingFileHelper()` 返回一个 `ExistingFileHelper`，供那些可以引用其他文件的提供器使用（例如方块模型，它可以指定一个父文件）。
- `event.getLookupProvider()` 返回一个 `CompletableFuture<HolderLookup.Provider>`，主要供标签和 datagen 注册表用于引用其他可能尚不存在的元素。
- `event.includeClient()`、 `event.includeServer()`、 `event.includeDev()` 和 `event.includeReports()` 是返回 `boolean` 的方法，可让你检查特定的命令行参数（见下文）是否已启用。

### 命令行参数 {#command-line-arguments}

数据生成器可以接受若干命令行参数：

- `--mod examplemod`：告诉数据生成器为此 Mod 运行 datagen。 NeoGradle 会为所属的 mod id 自动添加此参数；如果你例如在一个项目中有多个 Mod，则需要自行添加。
- `--output path/to/folder`：告诉数据生成器输出到给定文件夹。推荐使用 Gradle 的 `file(...).getAbsolutePath()` 来为你生成一个绝对路径（其中的路径相对于项目根目录）。默认为 `file('src/generated/resources').getAbsolutePath()`。
- `--existing path/to/folder`：告诉数据生成器在检查现有文件时把给定文件夹纳入考虑。与 output 一样，推荐使用 Gradle 的 `file(...).getAbsolutePath()`。
- `--existing-mod examplemod`：告诉数据生成器在检查现有文件时把给定 Mod 的 JAR 文件中的资源纳入考虑。
- 生成器模式（以下均为布尔参数，无需附加任何额外参数）：
    - `--includeClient`：是否生成客户端资源（资产）。在运行时用 `GatherDataEvent#includeClient()` 检查。
    - `--includeServer`：是否生成服务端资源（数据）。在运行时用 `GatherDataEvent#includeServer()` 检查。
    - `--includeDev`：是否运行开发工具。通常 Mod 不应使用。在运行时用 `GatherDataEvent#includeDev()` 检查。
    - `--includeReports`：是否转储一份已注册对象的列表。在运行时用 `GatherDataEvent#includeReports()` 检查。
    - `--all`：启用所有生成器模式。

可以通过在你的 `build.gradle` 中添加以下内容，把所有参数加入运行配置：

```groovy
runs {
    // other run configurations here

    data {
        programArguments.addAll '--arg1', 'value1', '--arg2', 'value2', '--all' // boolean args have no value
    }
}
```

例如，要复现默认参数，你可以这样指定：

```groovy
runs {
    // other run configurations here

    data {
        programArguments.addAll '--mod', 'examplemod', // insert your own mod id
                '--output', file('src/generated/resources').getAbsolutePath(),
                '--includeClient',
                '--includeServer'
    }
}
```

[advancementprovider]: server/advancements.md#data-generation
[advancements]: server/advancements.md
[blockstateprovider]: client/models/datagen.md#block-model-datagen
[bsfile]: client/models/index.md#blockstate-files
[chattype]: https://minecraft.wiki/w/Chat_type
[codec]: ../datastorage/codecs.md
[damagetypes]: server/damagetypes.md
[datamap]: server/datamaps/index.md
[datamapprovider]: server/datamaps/index.md#data-generation
[datapackcmd]: https://minecraft.wiki/w/Commands/datapack
[datapackprovider]: ../concepts/registries.md#data-generation-for-datapack-registries
[event]: ../concepts/events.md
[eventhandler]: ../concepts/events.md#registering-an-event-handler
[function]: https://minecraft.wiki/w/Function_(Java_Edition)
[glm]: server/loottables/glm.md
[glmprovider]: server/loottables/glm.md#datagen
[itemmodelprovider]: client/models/datagen.md#item-model-datagen
[itemmodifier]: https://minecraft.wiki/w/Item_modifier
[langprovider]: client/i18n.md#datagen
[lifecycle]: ../concepts/events.md#the-mod-lifecycle
[logicalsides]: ../concepts/sides.md#the-logical-side
[loottableprovider]: server/loottables/index.md#datagen
[loottables]: server/loottables/index.md
[mcwiki]: https://minecraft.wiki
[mcwikidatapacks]: https://minecraft.wiki/w/Data_pack
[mcwikiresourcepacks]: https://minecraft.wiki/w/Resource_pack
[models]: client/models/index.md
[packmcmeta]: #packmcmeta
[packmcmetadatapack]: https://minecraft.wiki/w/Data_pack#pack.mcmeta
[packmcmetaresourcepack]: https://minecraft.wiki/w/Resource_pack#Contents
[particleprovider]: client/particles.md#datagen
[particles]: client/particles.md
[predicate]: https://minecraft.wiki/w/Predicate
[recipeprovider]: server/recipes/index.md#data-generation
[recipes]: server/recipes/index.md
[sides]: ../concepts/sides.md
[soundprovider]: client/sounds.md#datagen
[sounds]: client/sounds.md
[tags]: server/tags.md
[tagsprovider]: server/tags.md#datagen
[textures]: client/textures.md
[translations]: client/i18n.md#language-files

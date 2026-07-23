# 资源 {#resources}

资源是游戏使用的外部文件，但它们本身不是代码。最常见的资源类型是纹理，不过 Minecraft 生态中还存在许多其他类型的资源。当然，所有这些资源都需要代码侧的消费方，因此消费这些资源的系统也一并归入本章。

Minecraft 通常有两类资源：面向[逻辑客户端][logicalsides]的资源，称为 assets（资产）；以及面向[逻辑服务端][logicalsides]的资源，称为 data（数据）。资产大多是仅用于展示的信息，例如纹理、展示模型、翻译或声音；而数据则包含各种影响游戏玩法的内容，例如战利品表、配方或世界生成信息。它们分别从资源包与数据包中加载。NeoForge 会为每个 Mod 生成一个内置的资源包与数据包。

资源包与数据包通常都需要一个 [`pack.mcmeta` 文件][packmcmeta]；不过现代 NeoForge 会在运行时为你生成它，因此你无需为此操心。

如果你对某样东西的格式感到困惑，可以看看原版资源。你的 NeoForge 开发环境不仅包含原版代码，也包含原版资源。它们位于 External Resources 一节（IntelliJ）/ Project Libraries 一节（Eclipse），名称为 `ng_dummy_ng.net.minecraft:client:client-extra:<minecraft_version>`（Minecraft 资源）或 `ng_dummy_ng.net.neoforged:neoforge:<neoforge_version>`（NeoForge 资源）。

## 资产 {#assets}

_另见：[Minecraft Wiki][mcwiki] 上的 [Resource Packs（资源包）][mcwikiresourcepacks]_

资产，即客户端侧资源，是所有仅在[客户端][sides]相关的资源。它们从资源包中加载，有时也沿用旧称 texture pack（纹理包，源自旧版本时它们只能影响纹理）。资源包本质上就是一个 `assets` 文件夹。`assets` 文件夹为资源包所包含的各个命名空间设有子文件夹，每个命名空间对应一个子文件夹。例如，一个 mod id 为 `coolmod` 的 Mod 的资源包，很可能包含一个 `coolmod` 命名空间，但也可以额外包含其他命名空间，例如 `minecraft`。

NeoForge 会自动将所有 Mod 的资源包收集进 `Mod resources` 包，它位于资源包菜单中已选包一侧的最底部。目前无法禁用 `Mod resources` 包。不过，位于 `Mod resources` 包之上的资源包会覆盖其下方资源包中定义的资源。这一机制使资源包作者能够覆盖你的 Mod 的资源，也使 Mod 开发者能够在需要时覆盖 Minecraft 的资源。

资源包可以包含影响下列内容的文件夹：

| 文件夹名          | 内容                                     |
|------------------|-----------------------------------------|
| `atlases`        | 纹理图集来源                             |
| `blockstates`    | [方块状态文件][bsfile]                   |
| `equipment`      | [装备信息][equipment]                    |
| `font`           | 字体定义                                 |
| `items`          | [客户端物品][citems]                     |
| `lang`           | [翻译文件][translations]                 |
| `models`         | [模型][models]                           |
| `particles`      | [粒子定义][particles]                    |
| `post_effect`    | 后处理屏幕效果                           |
| `shaders`        | 元数据、片段着色器与顶点着色器           |
| `sounds`         | [声音文件][sounds]                       |
| `texts`          | 各类文本文件                             |
| `textures`       | [纹理][textures]                         |
| `waypoint_style` | 路径点图标元数据                         |

## 数据 {#data}

_另见：[Minecraft Wiki][mcwiki] 上的 [Data Packs（数据包）][mcwikidatapacks]_

与资产相对，数据是所有[服务端][sides]资源的统称。与资源包类似，数据通过数据包（datapack）加载。如同资源包，数据包由一个 [`pack.mcmeta` 文件][packmcmeta]和一个名为 `data` 的根文件夹组成。然后，同样与资源包一样，该 `data` 文件夹为其所包含的各个命名空间设有子文件夹，每个命名空间对应一个子文件夹。例如，一个 mod id 为 `coolmod` 的 Mod 的数据包，很可能包含一个 `coolmod` 命名空间，但也可以额外包含其他命名空间，例如 `minecraft`。

NeoForge 会在新世界创建时自动将所有 Mod 数据包应用到该世界。目前无法禁用 Mod 数据包。不过，大多数数据文件可以被优先级更高的数据包覆盖（因此也可以通过用空文件替换来移除）。额外的数据包可以放入某个世界的 `datapacks` 子文件夹中，再通过 [`/datapack`][datapackcmd] 命令来启用或禁用。

:::info
目前没有内置的方式将一组自定义数据包应用到每个世界。不过，已有若干 Mod 能够实现这一点。
:::

数据包可以包含影响下列内容的文件夹：

| 文件夹名                                                                                                                    | 内容                         |
|---------------------------------------------------------------------------------------------------------------------------|------------------------------|
| `advancement`                                                                                                             | [进度][advancements]         |
| `banner_pattern`                                                                                                          | 旗帜图案                     |
| `cat_variant`, `chicken_variant`, `cow_variant`, `frog_variant`, `pig_variant`, `wolf_variant`, `zombie_nautilus_variant` | 实体变种                     |
| `cat_sound_variant`, `chicken_sound_variant`, `cow_sound_variant`, `pig_sound_variant`, `wolf_sound_variant`              | 实体声音变种                 |
| `damage_type`                                                                                                             | [伤害类型][damagetypes]      |
| `datapacks`                                                                                                               | 内置数据包                   |
| `dialog`                                                                                                                  | 对话菜单                     |
| `enchantment`, `enchantment_provider`                                                                                     | [附魔][enchantment]          |
| `instrument`, `jukebox_song`                                                                                              | 声音引用元数据               |
| `painting_variant`                                                                                                        | 画作                         |
| `loot_table`                                                                                                              | [战利品表][loottables]       |
| `recipe`                                                                                                                  | [配方][recipes]              |
| `tags`                                                                                                                    | [标签][tags]                 |
| `test_environment`, `test_instance`                                                                                       | [游戏测试][gmt]              |
| `trade_set`, `villager_trade`                                                                                             | 村民交易                     |
| `trial_spawner`                                                                                                           | 战斗挑战                     |
| `trim_material`, `trim_pattern`                                                                                           | 盔甲纹饰                     |
| `neoforge/data_maps`                                                                                                      | [数据映射][datamap]          |
| `neoforge/loot_modifiers`                                                                                                 | [全局战利品修改器][glm]      |
| `dimension`, `dimension_type`, `structure`, `timeline`, `worldgen`, `neoforge/biome_modifier`                             | 世界生成文件                 |

此外，它们还可以为一些与命令集成的系统包含子文件夹。这些系统很少与 Mod 一起使用，但仍值得一提：

| 文件夹名        | 内容                           |
|-----------------|--------------------------------|
| `chat_type`     | [聊天类型][chattype]           |
| `function`      | [函数][function]               |
| `item_modifier` | [物品修改器][itemmodifier]     |
| `predicate`     | [谓词][predicate]              |

## `pack.mcmeta` {#packmcmeta}

_另见：[Minecraft Wiki][mcwiki] 上的 [`pack.mcmeta`（资源包）][packmcmetaresourcepack] 与 [`pack.mcmeta`（数据包）][packmcmetadatapack]_

[`pack.mcmeta` 文件][meta]保存着资源包或数据包的元数据。对于 Mod 而言，NeoForge 使这个文件变得多余，因为 `pack.mcmeta` 是合成生成的。如果你仍然需要一个 `pack.mcmeta` 文件，完整规范可在上面链接的 Minecraft Wiki 文章中找到。

## 数据生成 {#data-generation}

数据生成，俗称 datagen，是一种以编程方式生成 JSON 资源文件的手段，用以避免手写这些文件时的繁琐与易错。这个名称有点误导，因为它既适用于数据（data），也适用于资产（assets）。

Datagen 通过 Data 运行配置来运行，它会与 Client 和 Server 运行配置一并为你生成。该 data 运行配置遵循 [Mod 生命周期][lifecycle]，直到注册事件触发之后。随后它会触发某个 [`GatherDataEvent`][event]，你可以在其中以数据提供器的形式注册待生成的对象，接着将这些对象写入磁盘，最后结束整个过程。

有两个在[**物理端**][physicalside]运作的子类型：`GatherDataEvent.Client` 与 `GatherDataEvent.Server`。`GatherDataEvent.Client` 可以包含所有要生成的提供器。而 `GatherDataEvent.Server` 则只能包含用于生成数据包条目的提供器。

:::note
关于如何注册提供器，有两种推荐做法。前者是将所有提供器都注册到 `GatherDataEvent.Client`，并使用 `runClientData` 任务来生成数据。后者是将客户端提供器注册到 `GatherDataEvent.Client`、将服务端提供器注册到 `GatherDataEvent.Server`，分别通过运行 `runClientData` 与 `runServerData` 任务来生成它们。

由于 MDK 通过设置默认的 `clientData` 配置采用了前一种方案，所展示的全部示例都将采用前者，把所有提供器注册到 `GatherDataEvent.Client`。
:::

所有数据提供器都实现 `DataProvider` 接口，通常需要重写一个方法。下面列出了 Minecraft 与 NeoForge 提供的值得注意的数据生成器（链接的文章补充了更多信息，例如辅助方法）：

| 类                                                    | 方法                              | 生成内容                                                                 | 端     | 备注                                                                                                          |
|------------------------------------------------------|----------------------------------|-------------------------------------------------------------------------|--------|-----------------------------------------------------------------------------------------------------------------|
| [`ModelProvider`][modelprovider]                     | `registerModels()`               | 模型、方块状态文件、客户端物品                                                             | 客户端 |                                                                                                                 |
| [`LanguageProvider`][langprovider]                   | `addTranslations()`              | 翻译                                                            | 客户端 | 还需要在构造函数中传入语言。                                                          |
| [`EquipmentAssetProvider`][equipmentasset]           | `registerModels()`               | 盔甲模型的资产                                                 | 客户端 |                                                                                                                 |
| [`ParticleDescriptionProvider`][particleprovider]    | `addDescriptions()`              | 粒子定义                                                    | 客户端 |                                                                                                                 |
| [`SoundDefinitionsProvider`][soundprovider]          | `registerSounds()`               | 声音定义                                                       | 客户端 |                                                                                                                 |
| `SpriteSourceProvider`                               | `gather()`                       | 精灵来源 / 图集                                                | 客户端 |                                                                                                                 |
| [`AdvancementProvider`][advancementprovider]         | `generate()`                     | 进度                                                            | 服务端 | 需要额外的类才能正常工作，详见链接文章。                                                   |
| [`LootTableProvider`][loottableprovider]             | `generate()`                     | 战利品表                                                             | 服务端 | 需要额外的方法与类才能正常工作，详见链接文章。                            |
| [`RecipeProvider`][recipeprovider]                   | `buildRecipes(RecipeOutput)`     | 配方                                                                 | 服务端 | 需要额外的类才能正常工作，详见链接文章。                                                   |
| [`RecipePrioritiesProvider`][recipepriorities]       | `start()`                        | 配方的优先级顺序                                              | 服务端 |                                                                                                                 |
| [`TagsProvider` 的各种子类][tagsprovider] | `addTags(HolderLookup.Provider)` | 标签                                                                    | 服务端 | 存在若干专用子类，详见链接文章。                                           |
| [`DataMapProvider`][datamapprovider]                 | `gather()`                       | 数据映射条目                                                        | 服务端 |                                                                                                                 |
| [`GlobalLootModifierProvider`][glmprovider]          | `start()`                        | 全局战利品修改器                                                   | 服务端 |                                                                                                                 |
| [`DatapackBuiltinEntriesProvider`][datapackprovider] | 无                              | 数据包内置条目，例如世界生成与[伤害类型][damagetypes] | 服务端 | 无需重写方法，而是在构造函数的 lambda 中添加条目。详见链接文章。 |
| `JsonCodecProvider`（抽象类）                 | `gather()`                       | 带有 codec 的对象                                                    | 两端   | 可以扩展它，用于任何带有 [codec] 的对象，将数据编码进去。                              |
| [`PackMetadataGenerator`][metagen]                   | `add(MetadataSectionType<T>, T)` | `pack.mcmeta`                                                           | 两端 |                                                                                                                 |

所有这些提供器都遵循相同的模式。首先，你创建一个子类并添加要生成的资源。然后，在[事件处理器][eventhandler]中把该提供器添加到事件上。以下是一个使用 `RecipeProvider` 的示例：

```java
public class MyRecipeProvider extends RecipeProvider {
    public MyRecipeProvider(HolderLookup.Provider registries, RecipeOutput output) {
        super(registries, output);
    }

    @Override
    protected void buildRecipes() {
        // Register your recipes here.
    }

    // The data provider class
    public static class Runner extends RecipeProvider.Runner {

        public Runner(PackOutput output, CompletableFuture<HolderLookup.Provider> registries) {
            super(output, registries);
        }

        @Override
        protected RecipeProvider createRecipeProvider(HolderLookup.Provider registries, RecipeOutput output) {
            return new MyRecipeProvider(registries, output);
        }
    }
}

// In some event handler class
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    // Data providers should start by calling event.createDatapackRegistryObjects(...)
    // to register their datapack registry objects. This allows other providers
    // to use these objects during their own data generation.

    // From there, providers can generally be registered using event.createProvider(...),
    // which acts as a function that provides the PackOutput and optionally the
    // CompletableFuture<HolderLookup.Provider>.

    // Register the provider.
    event.createProvider(MyRecipeProvider.Runner::new);
    // Other data providers here.

    // If you want to create a datapack within the global pack, you can call
    // DataGenerator#getBuiltinDatapack. From there, you must use the
    // PackGenerator#addProvider method to add any providers to that pack.
    DataGenerator.PackGenerator examplePack = event.getGenerator().getBuiltinDatapack(
        true, // Should always be true.
        "examplemod", // The mod id.
        "example_pack" // The name of the pack.
    );
    
    examplePack.addProvider(output -> ...);
}
```

该事件提供了一些辅助方法和上下文供你使用：

- `event.createDatapackRegistryObjects(...)` 使用提供的 `RegistrySetBuilder` 创建并注册一个 `DatapackBuiltinEntriesProvider`。它还会强制后续对查找提供器（lookup provider）的任何使用都包含你数据生成的条目。
- `event.createProvider(...)` 通过在 lambda 中提供 `PackOutput` 以及可选的 `CompletableFuture<HolderLookup.Provider>` 来注册一个提供器。
- `event.createBlockAndItemTags(...)` 通过使用 `TagsProvider<Block>` 构造 `TagsProvider<Item>`，注册一个 `TagsProvider<Block>` 和一个 `TagsProvider<Item>`。
- `event.getGenerator()` 返回你向其注册提供器的 `DataGenerator`。
- `event.getPackOutput()` 返回一个 `PackOutput`，一些提供器用它来确定自己的文件输出位置。
- `event.getResourceManager(PackType)` 返回一个 `ResourceManager`，供提供器用来检查已经存在的文件。
- `event.getLookupProvider()` 返回一个 `CompletableFuture<HolderLookup.Provider>`，主要供标签和 datagen 注册表用来引用其他可能尚不存在的元素。
- `event.includeDev()` 与 `event.includeReports()` 是 `boolean` 方法，允许你检查特定的命令行参数（见下文）是否已启用。

### 命令行参数 {#command-line-arguments}

数据生成器可以接受若干命令行参数：

- `--mod examplemod`：告诉数据生成器为此 Mod 运行 datagen。NeoGradle 会为所属 mod id 自动添加此参数，如果你的一个项目中有多个 Mod，则需自行添加。
- `--output path/to/folder`：告诉数据生成器输出到给定文件夹。推荐使用 Gradle 的 `file(...).getAbsolutePath()` 为你生成绝对路径（路径相对于项目根目录）。默认为 `file('src/generated/resources').getAbsolutePath()`。
- `--existing path/to/folder`：告诉数据生成器在检查已有文件时考虑给定文件夹。与 output 一样，推荐使用 Gradle 的 `file(...).getAbsolutePath()`。
- `--existing-mod examplemod`：告诉数据生成器在检查已有文件时考虑给定 Mod 的 JAR 文件中的资源。
- 生成器模式（以下都是布尔参数，无需附加任何额外参数）：
    - `--includeDev`：是否运行开发工具。一般不应被 Mod 使用。在运行时用 `GatherDataEvent#includeDev()` 检查。
    - `--includeReports`：是否导出一份已注册对象的列表。在运行时用 `GatherDataEvent#includeReports()` 检查。
    - `--all`：启用所有生成器模式。

所有参数都可以通过向你的 `build.gradle` 添加以下内容，来加入运行配置：

```groovy
runs {
    // other run configurations here

    clientData {
        arguments.addAll '--arg1', 'value1', '--arg2', 'value2', '--all' // boolean args have no value
    }
}
```

例如，若要复现默认参数，你可以指定如下内容：

```groovy
runs {
    // other run configurations here

    clientData {
        arguments.addAll '--mod', 'examplemod', // insert your own mod id
                '--output', file('src/generated/resources').getAbsolutePath(),
                '--all'
    }
}
```

[advancementprovider]: server/advancements.md#data-generation
[advancements]: server/advancements.md
[bsfile]: client/models/index.md#blockstate-files
[chattype]: https://minecraft.wiki/w/Chat_type
[citems]: client/models/items.md
[codec]: ../datastorage/codecs.md
[damagetypes]: server/damagetypes.md
[datamap]: server/datamaps/index.md
[datamapprovider]: server/datamaps/index.md#data-generation
[datapackcmd]: https://minecraft.wiki/w/Commands/datapack
[datapackprovider]: ../concepts/registries.md#data-generation-for-datapack-registries
[enchantment]: server/enchantments/index.md
[equipment]: ../items/armor.md#equipment-models
[equipmentasset]: ../items/armor.md#equipment-assets
[event]: ../concepts/events.md
[eventhandler]: ../concepts/events.md#registering-an-event-handler
[function]: https://minecraft.wiki/w/Function_(Java_Edition)
[glm]: server/loottables/glm.md
[glmprovider]: server/loottables/glm.md#datagen
[gmt]: ../misc/gametest.md
[itemmodifier]: https://minecraft.wiki/w/Item_modifier
[langprovider]: client/i18n.md#datagen
[lifecycle]: ../concepts/events.md#the-mod-lifecycle
[logicalsides]: ../concepts/sides.md#the-logical-side
[loottableprovider]: server/loottables/index.md#datagen
[loottables]: server/loottables/index.md
[mcwiki]: https://minecraft.wiki
[mcwikidatapacks]: https://minecraft.wiki/w/Data_pack
[mcwikiresourcepacks]: https://minecraft.wiki/w/Resource_pack
[meta]: metadata.md
[metagen]: metadata.md#packmetadatagenerator
[modelprovider]: client/models/datagen.md
[models]: client/models/index.md
[packmcmeta]: #packmcmeta
[packmcmetadatapack]: https://minecraft.wiki/w/Data_pack#pack.mcmeta
[packmcmetaresourcepack]: https://minecraft.wiki/w/Resource_pack#Contents
[particleprovider]: client/particles.md#datagen
[particles]: client/particles.md
[physicalside]: ../concepts/sides.md#the-physical-side
[predicate]: https://minecraft.wiki/w/Predicate
[recipeprovider]: server/recipes/index.md#data-generation
[recipes]: server/recipes/index.md
[recipepriorities]: server/recipes/index.md#recipe-priorities
[sides]: ../concepts/sides.md
[soundprovider]: client/sounds.md#datagen
[sounds]: client/sounds.md
[tags]: server/tags.md
[tagsprovider]: server/tags.md#datagen
[textures]: client/textures.md
[translations]: client/i18n.md#language-files

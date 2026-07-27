---
title: 1.15.2 -> 1.16.5
sidebar_position: 21
---
# Minecraft 1.15.2 -> 1.16.5 Mod 迁移入门 {#minecraft-1152---1165-modding-migration-primer}

这是从主要面向 Forge 的角度对 1.15.2 到 1.16.5 迁移入门的高级且非详尽的概述。

本入门书已获得知识共享许可，因此请随意使用它作为参考。

请注意，此文件可以更新，因此请留下[此文件的链接](https://gist.github.com/50ap5ud5/f4e70f0e8faeddcfde6b4b1df70f83b8)，以便读者可以自行查看更新的信息。

如果有任何错误或遗漏的信息，请在下面留言。谢谢！

## DataFixerUpper 和 Codec {#datafixerupper-and-codecs}
在 1.16 中，Mojang 更新了他们的 DataFixerUpper 库（用于将旧世界数据从旧游戏版本迁移到新版本），以包含一组称为 Codecs 的新工具。

Codec 是一个桥接对象，允许在两个不同对象之间轻松进行序列化/反序列化。
例如 Java -> JSON 和 JSON -> Java。

### 使用 {#uses}
现在，核心注册表和实用程序对象中使用了大量 Codec，例如常见的 Java 原始类型、 BlockState、 ResourceLocation 和 World Generation。

这使得 Codec 非常有用，可以减少对象序列化/反序列化所需的代码量，因为这主要是为你处理的。

它们对于数据生成和数据驱动的修改注册表特别有用。

例如使用 Blockstate Codec 轻松读取和写入使用 JSON 的自定义对象的块状态信息。

### 限制和怪癖 {#limitations-and-quirks}
需要注意的一种行为是，在反序列化过程中，Codec 将**丢弃任何错误条目**，并返回一个仅包含成功解析的对象的 PartialResult。

发生这种情况时，大多数 Codec 都会打印日志文件条目，因此如果出现任何问题，请务必检查 latest.log 或 debug.log。


某些 Codec 类型还存在一些缺陷，可能会导致意外问题。

例如，UnboundedMapCodec 在遇到错误时非常敏感，并且会丢弃出错条目之前的所有条目，即使这些条目没有出错。

对于某些实现来说，这是一个大问题，如 [MC-197860](https://bugs.mojang.com/browse/MC-197860) 等情况所示，其原因是 UnboundedMapCodec 的错误处理行为。


## 动态注册表 {#dynamic-registries}
在 1.16+ 中，许多注册表对象变成了数据驱动。
DynamicRegistries 管理这些数据驱动注册表的同步。

现在是动态注册表的注册表示例：
- 尺寸
- 尺寸类型
- 生物群落
- 配置功能
- 配置结构特征

动态注册表的对象部分仅需要在代码中注册，如果它们要在预先存在的注册表对象中使用（例如，将其添加到 BiomeLoadingEvent 中的 Biome 的配置功能）。

否则，建议使用 JSON 文件。

### 访问动态注册表和潜在陷阱 {#accessing-dynamicregistries-and-potential-pitfalls}
在运行时，你可以从 MinecraftServer 或 ClientPlayNetHandler 的动态注册表中获取对象，具体取决于你所在的逻辑端。

E.g.
```java
RegistryKey<Biome> myBiomeRegistryKey = RegistryKey.get(new ResourceLocation(MODID, "test_biome"));

Biome biome = serverWorld.getServer().registryAccess().registryOrThrow(Registry.BIOME).get(myBiomeRegistryKey);
```

但是，请注意，**并非所有动态注册表都存在于动态注册表的客户端副本**中。

不要访问客户端上不可用的动态注册表，因为这会导致专用服务器崩溃。

## 注册表项 {#registry-keys}
RegistryKey 是 1.16 中引入的新对象，它是注册表 ID 和对象注册表名称的组合。

它是对象的通用唯一标识符。


1.16 中的大多数普通注册表对象现在都是通过此键值对来标识的。

例如，生物群落对象有一个注册表键，它由生物群落和生物群落注册表组成。

Biome 注册表本身也有一个 RegistryKey，它由注册表名称和 Biome 注册表组成。

E.g. `RegistryKey<Biome> testBiomeKey = RegistryKey.get(Registry.BIOME, new ResourceLocation(MODID, "test_biome"));`

### 用途 {#usage}

注册表键可以与等号“`==`”进行比较。

注册表密钥可以适用于任何经过修改的注册表或普通注册表。

如果你想创建一个非动态的自定义注册表，Forge 的自定义延迟注册系统是最简单且非常稳定的解决方案。

## 世界一代 {#world-generation}
大多数世界生成对象已成为通过 Minecraft Datapack 系统进行数据驱动的对象。

虽然某些对象仍然需要基于代码的对象，但大多数世界生成现在都是基于数据包的。

对于某些人来说，这可能看起来令人惊讶，因为在所有以前的版本中，它都是基于代码的。
这是因为在次要版本 1.16.2 中进行了重大的重大更改。

这些更改可能最初是 1.16 初始版本的一部分，但由于其他原因不得不推迟。

我们可以预期这种情况会在未来的小版本中发生，尽管它们不太可能经常引入这种规模的更改。

### 注册流程变更 {#registration-process-changes}
随着转向数据驱动的注册表，了解世界生成对象如何在新系统中注册非常重要。

现在世界生成对象有两种类型的注册表：

1. WorldGen 注册表。一个临时注册表，用于存储初始的基于代码的世界生成注册表对象。仅在游戏首次启动时使用。
2. 动态注册表。 WorldGenRegistries 中的所有条目都会在服务器启动期间复制到 DynamicRegistries。当服务器启动时，游戏将仅从 DynamicRegistries 中查找。

如果你正在制作基于代码的世界生成对象（例如功能或结构），则必须在注册后构造事件（例如 FMLCommonSetupEvent）期间以及 enqueueWork lambda 函数中将它们添加到 **WorldGenRegistries** 中，以使此调用成为线程安全的。

如果你不这样做，你可以阻止其他 mod 的世界生成对象生成。

**不要**在服务器启动之前调用 DynamicRegistries。

### 数据包加载 {#datapack-loading}

数据驱动注册表带来的另一个行为变化是数据包加载阶段。

在新环境中，一旦创建了世界（即单击“创建世界”按钮），原版 就会重新加载所有数据包 2-3 次，并每次重新创建所有数据驱动的注册表。

这使得添加 API 挂钩对于 modloader 来说有点棘手，因为需要进行试验并找到一个注入挂钩的好地方。

在用户方面，重复的数据包重新加载也会产生副作用，使游戏在世界创建过程中显得“缓慢”。

进行此更改可能是为了确保所有数据驱动对象都被拾取并注册。 Mod 开发者不应试图扰乱这些内部流程。


### 生物群系 {#biomes}

#### 生物群系创建 {#biome-creation}

应使用 JSON 文件创建生物群落。这是因为 Biome 注册表是一个数据驱动的注册表，因此像 ForgeRegistries 这样的非动态注册表不再适合它。

基于代码的生物群落仍然是可能的，但不推荐。

一般来说，不建议进行基于代码的生物群落，因为使用这些解决方法可能会面临大量潜在的稳定性问题。

基于代码的生物群落对象的一个例外是制作虚拟对象来占用注册表 ID，数据包 json 稍后可以使用这些 ID 来替换基于代码的生物群落对象。

#### 生物群落注册 {#biome-registration}
你不再使用新生物群落的 Forge 注册表。建议使用数据包 json 来执行此操作。

创建一个 json 文件，以 `data/your_modid/worldgen/biome` 中生物群系的注册表名称命名

E.g. `data/modid/worldgen/biome/my_test_biome.json`

原版 将在数据包加载期间自动拾取并注册 json。

#### 生物群落改造（锻造） {#biome-modification-forge}

如果你想将配置结构、配置功能等自定义对象添加到现有的原版/其他 mod 生物群落中，你现在必须使用 Forge 提供的 BiomeLoadingEvent。
这是在数据包解析过程中触发的事件，此时正在读取 Biome JSON，但在 MinecraftServer 启动之前。

例如我们想要向现有生物群系添加一个 ConfiguredStructureFeature。
1. 制作世界生成对象的基于代码的版本，例如基于代码的 ConfiguredStructureFeature。
2. 在 FMLCommonSetupEvent 期间，在 enqueueWork lambda 函数中将基于代码的对象注册到 WorldGenRegistries，以使此调用成为线程安全的。
3. 将基于代码的对象添加到 Forge 提供的 BiomeLoadingEvent 中。

在事件中，要检查特定的生物群落，请使用事件的生物群落注册表名称创建 `RegistryKey<Biome>` 实例，然后将此注册表项与另一个注册表项进行比较。

e.g.
```java
@SubscribeEvent(priority = EventPriority.HIGH)
public static void onBiomeLoad(BiomeLoadingEvent event)
{
    RegistryKey<Biome> eventBiomeKey = RegistryKey.get(Registry.BIOME_REGISTRY, event.getName());
    RegistryKey<Biome> targetBiomeKey = RegistryKey.get(Registry.BIOME_REGISTRY, new ResourceLocation("minecraft", "plains"));
    if (eventBiomeKey == targetBiomeKey)
    {
	    //Do work here
    }
}
```

#### 限制 {#limitations}
目前，用户无法使用数据包来修改你添加到 BiomeLoadingEvent 的基于代码的世界生成对象。

由于事件在数据包解析期间触发，这意味着 BiomeLoadingEvent 中的对象始终会覆盖外部数据包中的对象，因为外部数据包可以在事件完成后读取。

相反，解决方法是向 Forge 的通用配置规范添加选项。

这是因为 BiomeLoadingEvent 在配置类型（例如 SERVER 配置）尚未初始化之前触发。
因此，通用配置是服务器启动之前唯一可用的配置类型。

一旦 Forge 添加了一个事件，该事件被注入到一个更好的位置，以允许数据包修改事件中的对象，这种情况就会发生变化。

#### 将生物群落添加到世界 {#adding-biomes-to-worlds}
要将生物群落添加到主世界，你需要为你的生物群落创建一个 RegistryKey 实例。
然后，在 enqueueWork lambda 函数中的 FMLCommonSetupEvent 中调用 BiomeManager#addAdditionalOverworldBiomes 以使此调用成为线程安全的。
你可以使用之前在此方法中创建的 RegistryKey。

E.g.
```java

public static final RegistryKey<Biome> testBiomeKey = RegistryKey.get(Registry.BIOME_REGISTRY, new ResourceLocation(MODID, "test_biome"));

public void commonSetup(FMLCommonSetupEvent event)
{
    event.enqueueWork(() -> {
        BiomeManager.addAdditionalOverworldBiomes(testBiomeKey);
    });
}
```

数据驱动系统在某些领域仍然有点过时，因此其中一些解决方法是必要的。

要将生物群落添加到自定义维度，你可以将生物群落的注册表名称添加到维度 json。即 `"modid:my_biome"`

#### 生物群落属性 {#biome-properties}

在此更新中，生物群落的属性也发生了显着变化。

其中一些更改由社区成员 SuperCoder797 记录如下：
- 生物群落的水彩和水雾颜色参数现已移至名为 BiomeAmbience 的新类，你现在还可以在其中指定其他内容，例如粒子、雾颜色和声音。
- 效果中指定的雾颜色仅在下界有效。它在主世界中不起作用。
- 现在，你可以在生物群系中生成粒子，这适用于下界和主世界。你可以用它制作一些很酷的东西，比如沙漠生物群落中的飞沙。
- 还可以为每个生物群落指定声音，并且你可以指定 3 种不同的声音类型。
- 当玩家处于生物群落中时，循环声音会持续播放（对于海滩上的海浪很有用）。
- 当玩家处于天空光照度为 0 且光照度低于 7 的区域时，会播放情绪声音。主世界生物群落使用洞穴声音作为情绪声音，而下界生物群落则有自己独特的变体。
- 每次滴答声都有 1.1% 的机会播放附加声音。下界生物群落使用这些来增加他们的气氛，但你也可以将它们用于主世界中的其他东西，比如鸟的声音或其他东西。
- 现在 BiomeContainer 有了一个新字段，它们是 4d 平面上的理论点，用于下界的生物群落计算。


#### 引用生物群系（锻造） {#referencing-a-biome-forge}

在这个新环境中，由 IForgeRegistry 添加的 Biome 的 `getRegistryName` 方法现在可以为 NULL。

获取生物群落实例时，始终使用 RegistryKey 从 DynamicRegistries 中的生物群落注册表获取值。

不要使用 ForgeRegistry 的 Biome 注册表，因为该注册表不考虑通过数据包添加的任何生物群系。

#### 生物群系 ID 转换 {#biome-id-shifting}

Mojang 将生物群落的内部 ID 从字符串更改回整数（谁知道为什么）。

这导致了以下问题：在现有保存中更改数据包中的世界生成对象可能会更改现有生物群落的 ID。

此问题的一些症状可能包括与旧生物群落在同一位置生成的其他生物群落的方块、结构和特征、生物群落天气模式的变化等。

自 1.16.5 起，此问题尚未在原版中修复，但已在 Forge 中修复。

#### 缺少锻造生物群系挂钩 {#missing-forge-biome-hooks}

新的生物群系逻辑和结构变化需要删除先前在 1.15.2 Forge 中提供的几个 Forge Biome 挂钩：
- 边缘生物群落钩
- 海洋钩
- 山丘生物群系钩子

此外，新的生物群落系统中仍然缺少一些 Mod 功能，你应该注意：

- 定制下界生物群系钩子
- 末端生物群系钩子
- 河流生物群系钩子

### 块生成器 {#chunkgenerator}

在自定义维度中使用自定义 ChunkGenerator 时，建议你在 Dimension JSON 文件中引用自定义 ChunkGenerator，而不是尝试构造基于代码的 Dimension。

看来目前仍然需要基于代码的 ChunkGenerator 来定义实际的生成逻辑，但 原版 也试图在未来将它们转变为数据驱动。

要注册 ChunkGenerator，请将其注册到 WorldGenRegistries 并在 enqueueWork lambda 内的 FMLCommonSetupEvent 中调用它。

你还会注意到，Codec 是 ChunkGenerator 的一部分。有关示例，请参阅 原版 和现有 mod。

#### 特殊情况 {#special-cases}
一些边缘情况需要特殊处理。

一个值得注意的例子是 SingleBiomeProvider。

例如，如果你的 ChunkGenerator 使用 SingleBiomeProvider，你可能会注意到 SingleBiomeProvider 无法正确从 `Biome.CODEC` 获取生物群落。
SingleBiomeProvider 还包含一个错误，该错误不允许将生物群落颜色正确发送给客户端。

一种解决方法是使用 MultiBiomeProvider 并向其提供单个生物群落，因为 MultiBiomeProvider 不存在这些问题。


### 实体生成 {#entity-spawns}

在 Forge 环境中，这些现在通过 BiomeLoadingEvent 处理。

### 结构 {#structures}

现在，结构的注册和添加到现有生物群落变得更加复杂。
它还需要注册到 WorldGenRegistries 以防止它覆盖其他修改后的结构。

#### 注册 {#registration}

注册结构需要你将其添加到许多不同的对象中。

此外，一些新的后端更改在方法上变得更加硬编码，这需要修改者使用变通办法。

- 在注册表事件触发后，ConfiguredStructureFeature 必须注册到 WorldGenRegistries。如果不这样做，你的结构将阻止其他 mod 结构生成。
- 必须将结构添加到 `Structure.STRUCTURES_REGISTRY` 中，以便游戏在其他上下文中使用该结构时能够识别该结构。这也确保 /locate 命令将列出你的结构。
- 我们还需要添加到 `FlatGenerationSettings.STRUCTURES` 以防止其他 mod 的自定义 ChunkGenerators 发生任何类型的崩溃或问题。
- StructureSeparationSettings 还需要添加到世界的 ChunkGenerator 中，以允许块生成器知道在生成结构之前应该迭代多少块。如果没有这个，结构就不会生成。
- 但是，如果 Mod 想要动态更改 StructureSeparationSettings，他们必须在加载世界时构造分离设置，因为块生成器不知道它绑定到哪个世界。

社区成员 TelepathicGrunt 善意地分享了一个工作解决方案，该解决方案展示了[如何在 Forge 环境中注册结构](https://github.com/TelepathicGrunt/StructureTutorialMod)。

他们的解决方案总结如下

1. 在 Mod 构造函数中，将 `Structure<?>` 实例注册到 `STRUCTURE_FEATURES`Forge 注册表，以便安全地占用注册表 ID。
2. 在 FMLCommonSetupEvent 中，将结构添加到 enqueueWork lambda 中的 `Structure.STRUCTURES_REGISTRY` 中。这对于让 MC 了解该结构并允许 /locate 命令对该结构起作用是必要的。
3. 在 FMLCommonSetupEvent 中，将 ConfiguredStructureFeature 添加到 enqueueWork lambda 中的 WorldGenRegistries，以防止其覆盖其他修改后的结构。
4. 在 FMLCommonSetupEvent 中，将 StructureSeparationSettings 添加到 `DimensionStructuresSettings.DEFAULTS` 以允许注册结构的分离设置。 （该字段是一个不可变的映射，因此需要一些非 api 修改方法（例如 Mixins/AccessTransformers/Reflection）来访问它）。
5. 在 FMLCommonSetupEvent 中，将 ConfiguredStructureFeature 实例添加到 `FlatGenerationSettings.STRUCTURES`，以防止其他 mod 的自定义 ChunkGenerators 发生任何类型的崩溃或问题。
6. （可选）如果我们希望结构与村庄等地形无缝融合，请将结构添加到 FMLCommonSetupEvent 中的 `Structure.NOISE_AFFECTING_FEATURES` 中。
7. 在 WorldEvent.Load 事件中，将结构添加到要添加结构的世界的 ChunkGenerator。这允许 Mod 开发者将在特定世界中生成的结构列入黑名单，并允许用户通过配置文件配置 StructureSeparationSettings。
8. 在 BiomeLoadingEvent 中，如果我们想要在现有生物群落中生成结构，请将 ConfiguredStructureFeature 实例添加到我们选择的生物群落中。

请注意，此方法不使用正确的 Forge API 挂钩，因为用于正确结构注册的挂钩尚不存在。

### 特点 {#features}

如果我们想将功能添加到现有的生物群落中，则功能需要基于代码。
它还需要注册到 WorldGenRegistries 以防止它覆盖其他修改后的功能。

1. 在 Mod 构造函数中，将 `Feature<?>` 实例注册到 `FEATURES`Forge 注册表，以便安全地占用注册表 ID。
2. 在 FMLCommonSetupEvent 中，将 ConfiguredFeature 添加到 enqueueWork lambda 中的 WorldGenRegistries，以防止其覆盖其他修改后的结构。
3. 在 BiomeLoadingEvent 中，如果我们想要在现有生物群落中生成功能，请将 ConfiguredFeature 实例添加到生物群落中。

### 树代 {#tree-generation}

这已经被再次重构。

现在已将其展平并拆分为 `FoliagePlacer`、 `TrunkPlacer` 和 `FeatureSize`。

生成过程总结如下（参考 SuperCoder7979）：
1. 首先，树的 FeatureSize 检查它是否可以在给定位置生成。
2. 然后 TrunkPlacers 生成树干，然后通过 `FoliageAttachment`s 生成叶子生成的位置。
3. 对于每个 FoliageAttachment，树的 FoliagePlacer 都会生成其叶子。
4. 如果你有 1.15 版本的 FoliagePlacers，建议完全重写它们。

## 维度/世界 {#dimensionsworlds}

### 尺寸 {#dimension}
Dimensions 现在是数据驱动的，其设计发生了显着变化。

- 维度现在更多的是世界的一组扩展设置。它将 ChunkGenerator 和 DimensionType 配对在一起。 （Mojang 映射中世界 = Level 和 Dimension = LevelStem）
- 维度现在与 DimensionType 具有一对多关系，这意味着你现在可以拥有使用相同 DimensionType 的多个维度。
- 维度现在与世界具有一对一的关系，这意味着世界本身就是维度的实例。

Forge 的 DimensionManager 类也已被删除，因为它在这个新环境中已过时。

#### 注册 {#registration-1}

自定义维度/世界不应再在代码中创建，除非在运行时动态创建维度等特殊情况。

在 `data/modid/dimension/` 中创建一个 JSON 文件来注册和定义你的维度。

原版 将在数据包加载期间自动拾取并注册该维度/世界，同时还在世界创建期间为数据驱动维度创建世界。

#### 引用尺寸 {#referencing-a-dimension}

现在通过 `RegistryKey<World>` 实例而不是 DimensionType 引用维度/世界。

要获取 `RegistryKey<World>` 的实例，请使用 `RegistryKey.get(Registry.DIMENSION_REGISTRY, new ResourceLocation(MODID, "registry_name_here"))`

要从世界访问 `RegistryKey<World>`，请使用 `World#dimension`。

要在服务器上获取世界，请使用 MinecraftServer#getWorld，它采用 `RegistryKey<World>` 作为参数。

虽然 `RegistryKey<Dimension>` 看起来也可能是正确的，但它仅供内部使用。

对于大多数实现，请使用 `RegistryKey<World>`。

#### 获取维度注册表（仅限原版内部使用） {#getting-the-dimension-registry-vanilla-internal-use-only}
虽然维度注册表像其他世界生成对象一样是数据驱动的，但它不像其他对象那样位于 DynamicRegistries 中。

相反，它驻留在 MinecraftServer 的 level.dat 文件中。在代码中，这是 WorldGenSettings 中的一个字段（MCP 类名称）

要从服务器获取维度注册表，你可以调用 MinecraftServer#worldData#worldGenSettings#dimensions

除非你在代码中为特殊情况（例如动态维度）注册维度，否则不要获取维度注册表。

如果你想通过注册表项获取维度，请改用 ServerWorld#getLevel。

### 尺寸类型 {#dimensiontype}
这些不再是维度的唯一实例。现在它只是一组可以配置维度的其他属性的设置。

你可以使多个尺寸使用相同的尺寸类型。

#### 注册 {#registration-2}

要创建自定义 DimensionType，请使用 JSON 文件将其添加到 `data/modid/dimension_type`。

### DimensionRenderInfo {#dimensionrenderinfo}

这是绑定到 DimensionType 的渲染对象。你可以在此处修改 DimensionType 的天空盒、天气渲染和云渲染，在此处修改天空颜色、雾类型和光照级别。

#### 注册 {#registration-3}

原版 已将此功能硬编码为仅适用于 原版 维度。

你需要使用一些非 api 方法（例如 Mixins/AccessTransformer/Reflection）来访问 DimensionRenderInfo 的私有不可变映射。

然后，在 FMLClientSetupEvent 的 enqueueWork lambda 中，将一个新条目放入 DimensionRenderInfo 映射中以注册你的自定义 DimensionRenderInfo。

要使用 DimensionRenderInfo 创建自定义维度类型，请将 DimensionRenderInfo 的注册表名称添加到 DimensionType 的“效果”字段中。

### 生活质量特征 {#quality-of-life-features}
#### 光照贴图修改 {#lightmap-modification}
你无法再在 1.16 中修改维度/世界的光照贴图，之前由 Forge 在 1.15 及更低版本中提供。这是因为尺寸的变化意味着 Forge 的补丁不适合。

光照贴图修改的示例包括更改世界的色调或使某个维度中的光线变暗。

一旦向 Forge 提供合适的解决方案，此功能可能会恢复。
## 渲染 {#rendering}

现在大多数渲染方法的参数中都包含 MatrixStack。

### 图形用户界面 {#gui}
GUI 是一个例外，其中某些方法仍然使用旧的 `RenderSystem` 和 `GlStateManager` 调用。

这是由于缓冲区何时/如何绘制到屏幕上造成的，因此像 RenderSystem 这样的系统已成为临时选项，直到 原版 将其渲染引擎完全迁移到批处理样式。

## 物品属性 {#item-properties}

这些现在是你在 FMLClientSetupEvent 期间调用的静态构建器函数。
使用 ItemProperties#register。该方法中的供应商采用 LivingEntity、 ClientWorld 和 ItemStack。

## 命令注册 {#command-registration}

在 Forge 的 RegisterCommandsEvent 中注册你的命令。

## 重新加载监听器注册 {#reload-listener-registration}

在 Forge 的 AddReloadListenerEvent 事件中注册你的 ReloadListener。重新加载数据包时会触发此事件。

在游戏加载过程中，数据包将至少重新加载两次。

它将在服务器启动之前至少触发一次，因此如果你在重新加载监听器中运行同步数据包，请务必在运行同步数据包代码之前通过 `ServerLifecycleHooks#getCurrentServer` 检查 MinecraftServer 是否不为空。

## 实体属性创建和修改 {#entity-attribute-creation-and-modification}

实体属性不再是从实体类继承的方法。

在内部，它现在是通过使用构建器函数将属性添加到 GlobalEntityTypeAttributes 映射来创建的。

对于 Forge 1.16.5 mods，你应该使用专用事件：
 - EntityAttributeCreationEvent - 用于向自定义实体添加属性。
 - EntityAttributeModificationEvent - 将属性添加到现有的普通/其他 mod 实体类型。

## 联网 {#networking}

### 注册表数据 {#registries-data}
数据驱动注册表的引入导致玩家接收的数据发生变化

现在，玩家在登录时会通过数据包发送自己的一组注册表数据：
- 客户端现在存储自己的维度（世界）列表。
- 客户端拥有自己的一组动态注册表。如前所述，并非服务器上的所有注册表都可以在客户端上使用 - 例如 ConfigurationedFeature 不在客户端上。


## 杂项 {#miscellaneous}

### 多部分实体碰撞箱 {#multipart-entity-hitboxes}
现在有一个 [Forge API 挂钩](https://github.com/MinecraftForge/MinecraftForge/pull/7554)，允许你为实体注册多个碰撞箱，类似于末影龙。

### Forge ChunkManager {#forge-chunkmanager}
旧版本中的 Forge ChunkManager 已被读取到 Forge 中。

这允许 Mod 开发者控制他们自己的 ChunkTickets 来实现强制块加载。

此外，还可以创建打勾票和非打勾票。

创建滴答票时将触发块滴答声（天气、生物生成、随机块滴答声）。

### 已弃用的 Forge 特定配置和命令 {#deprecated-forge-specific-config-and-commands}

一些 Forge 实用程序已在 1.16 中弃用，其中许多与成为数据驱动的世界生成相关对象有关。

这些包括：

- 弃用 /forge setdimension 命令，转而使用普通的 /execute in 命令。
- forgeCloudsEnabled - 旧维度系统的剩余工件


## 锻造 API {#forge-api}

### EventBusSubscriber 注释和 Mod ID {#eventbussubscriber-annotation-and-mod-ids}
`@EventBusSubscriber` 注释中存在一个新发现的错误，其中触发事件的 Mod ID 不再已知，除非使用此注释的类也具有 `@Mod` 注释。

此错误将影响所有为其事件使用专门类的 Mod。

要解决此问题，请将你的 Mod ID 添加到注释中的 `modid=` 字段，以确保你的 Mod 触发事件。

即使合并了该错误的修复，仍然建议采用这种做法，以减少将来类似的问题。

E.g.
```java
@Mod.EventBusSubscriber(modid = MyMod.MODID) //Add your Mod ID to the modid field
public class ForgeEventHandler{

}
```

### Mods.TOML 许可证 {#modstoml-license}
在 1.16.5+ 中，所有 mod 现在都需要在其 `mods.toml` 文件中定义“许可证”字段。

该许可证允许 Mod 开发者定义其他人如何使用他们的 Mod 及其资产，例如 https://choosealicense.com/.中的 Mod 及其资产

该值可以是许可证的名称，也可以是 Mod 开发者定义的自定义许可证的 URL 链接。

E.g. https://github.com/ExampleModderName/MyExampleModRepo/blob/1.16/LICENSE

### Mojang 映射 {#mojang-mappings}

#### 关于 {#about}

Mojang 映射（Mod 开发者昵称为 Mojmaps）是 Minecraft 的开发者 Mojang 提供的官方混淆映射。

它是一个桥接工具，可将 Mojang 的混淆的 Minecraft 代码转换为人类可读的名称。

例如 func_1234_a_ -> setupHelloWorld

#### 目的和范围 {#purpose-and-scope}

这些映射涵盖所有方法、字段、类名称，但不包括参数名称或 Javadoc。

这些映射对于 mod 来说是革命性的，因为这意味着 mod 制作者可以像 Mojang 开发人员一样看到 Minecraft 代码。

这使得在引用它作为示例时更容易理解。

#### Forge 的采用 {#forges-adoption}

**在 Forge API 中**

在 1.16.5 中，Forge 决定默认在其 Mod 开发人员工具包 (MDK) 中采用 Mojang 的官方映射。

所有方法和字段都将使用 Mojang 映射。

出于向后兼容性的原因，类名称仍然使用 MCP 名称。 （如果在 1.16.5 Forge 中使用 Mojang 类名，所有现有 mod 都会损坏）

在 1.17 中，Forge 也打算将他们的类名完全转换为 Mojang Mappings。


#### 法律问题 {#legal-concerns}

此前，这些映射的法律条款让 Forge 觉得使用起来不太舒服。

虽然仍然不能保证这些映射的使用在法律上是安全的，但 Forge 现在决定善意地采用它们，因为 Mojang 希望他们使用它们。

详细了解 [Forge 的立场](https://github.com/MinecraftForge/MCPConfig/blob/master/Mojang.md)

#### 优点和缺点 {#pros-and-cons}

[+] 所有方法和字段都有人类可读的名称，显示 Mojang 的原始逻辑。

[-] 缺少参数名称和 Javadocs。参数名称和 Javadoc 仅在 MCP 或 Yarn 等众包工具中可用。 Forge 正在与多个项目合作来重新添加参数名称。

#### 用途 {#usage-1}

##### 新 Mod {#new-mods}
在最新的 1.16.5 Forge Mod 开发工具包 (MDK) 中，会自动使用 Mojang 映射。

##### 现有 Mod {#existing-mods}
如果你愿意，你仍然可以使用 MCP 名称，社区更新了 MCP 映射，但这些导出并不经常进行。

如果你选择升级到 Mojang 映射，有一个方便的 `upgradeMappings`Gradle 命令可以将现有映射名称转换为 Mojang 名称，反之亦然。

将现有 mod 更新到 Mojang Mappings 的摘要如下（引用自 Forge Discord，!updateMappings Bot 命令）：
1. 做好备份！如果你尚未使用某种形式的版本控制系统 (VCS) 或有未提交的更改，则进行备份非常重要。下面概述的步骤不会备份你的文件，并且会不可逆转地更改它们。请注意。请注意，你可以随时切换回映射，但仍不会进行备份。
2. 在 mod 项目目录的终端中运行 `gradlew -PUPDATE_MAPPINGS_CHANNEL="official" -PUPDATE_MAPPINGS="1.16.5" updateMappings`。如果你使用的是基于 Unix 的系统，请在前面添加 ./。
3. 等待该过程完成。
4. 更新 build.gradle 和/或 gradle.properties 文件中的映射并更改映射行以匹配类似于此效果的内容：`mappings channel: "official", version: "1.16.5"`
5. 刷新或重新导入你的 Gradle 项目。
6. 完成！请注意，仍然存在一些与更改映射相关的错误。确保尝试构建你的 mod 项目或运行它以查看是否存在任何编译错误并修复它们。

注意：你可以运行 `!updatemappings <mappings channel>` 来获取切换到另一个频道的帮助。

请在此处阅读[有关 updateMappings 命令的更多信息。](https://gist.github.com/JDLogic/bf16deed3bcf99bd9e1a22eb21148389)

### Forge 中的 Mixins！ {#mixins-in-forge}
#### 关于 {#about-1}
Mixins 是一个强大且轻量级的第三方 Mod 工具，由 SpongeForge 组织（不隶属于 Forge）开发。

它允许 Mod 开发者编辑部分核心 Minecraft 代码，其侵入性比传统的 Javascript 核心 Mod 稍小。

在 1.16+ 中，Forge 现在原生支持 Mixins 的使用。

#### 用途 {#usage-2}

Mixin 应该被视为 modder 的最后手段，因为它们仍然被认为是 coremod 的一种形式，它是侵入性的，仍然可能导致不兼容和冲突。

建议你尽可能继续使用 Forge 的 API 和挂钩。

如果当前没有支持你的用例的 API，请考虑向 Forge 贡献一个 API，以便其他 Mod 开发者可以从中受益，并减少 Mod 不兼容的情况。

对于大型的侵入性补丁，Mixins 是一个很好的临时解决方案，但在 Forge 环境中，它仍然建议将补丁提供给 Forge。 :)

对于较小的补丁或具有更多利基用例的补丁，如果有足够的证据支持该补丁，Forge 倾向于接受它们。

### Forge Gradle 和 Maven {#forge-gradle-and-maven}
由于不可预见的问题，Forge 文件的 Maven 位置已更改。

在现有项目中，请更新 build.gradle 文件中 maven url 的所有实例。

新的 MDK 将准备好新的 Maven 位置。

### Java 15 支持和 Gradle 6.8 支持 {#java-15-support-and-gradle-68-support}

Forge 现在支持 Java 15 和 Gradle 6.8。

你只能使用 Java 8 代码，因为 Minecraft 是基于 Java 8 构建的。

仍然建议针对 Java 8 进行编译。

### FMLConstructModEvent - 仅供内部锻造使用 {#fmlconstructmodevent---internal-forge-use-only}

当 mod 的构造函数被调用时，但在 mod 注册表事件（例如块注册表、物品注册表等）被触发之前，会触发此事件。

这仅供 Forge 内部使用。

不要将此事件用于你的 Mod。

## 参考文献 {#references}

- [SuperCoder7979 的 1.16 RC 入门（SuperCoder7979，2021 年访问）](https://gist.github.com/SuperCoder7979/511e038714fb5f4fb59c06a8aa6c0281)
- [TelepathicGrunt 的结构教程 Mod（TelepathicGrunt，2021 年访问）](https://github.com/TelepathicGrunt/StructureTutorialMod)
- [官方 Minecraft Forge Discord（MinecraftForge，2021 年访问）](https://discord.gg/UvedJ9m)

*源自 https://gist.github.com/50ap5ud5/f4e70f0e8faeddcfde6b4b1df70f83b8*

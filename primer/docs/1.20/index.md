---
title: 1.19.4 -> 1.20
sidebar_position: 17
---
# Minecraft 1.19.4 -> 1.20 Mod 迁移导读 {#minecraft-1194---120-mod-migration-primer}

本文概览性、非详尽地介绍如何将你的 Mod 从 1.19.4 迁移到 1.20。文中不涉及任何具体的 Mod 加载器，只关注原版类的改动。所有给出的名称均使用官方的 mojang 映射。

本导读采用 [Creative Commons Attribution 4.0 International](http://creativecommons.org/licenses/by/4.0/) 许可证授权，欢迎将其用作参考，并保留链接，以便其他读者也能阅读本导读。

如有任何错误或遗漏的信息，请在本仓库提交 issue，或在 Neoforged Discord 服务器中 ping @ChampionAsh5357。

## 包相关改动 {#pack-changes}

原版中有不少面向用户的改动未在下文讨论，但它们可能与 Mod 开发者相关。你可以在 [Misode 的版本更新日志](https://misode.github.io/versions/?id=1.20&tab=changelog) 中查看这些改动的清单。

## 实验性特性的转正 {#moving-experimental-features}

所有此前通过 `update_1_20` 标志禁用的实验性特性，现已迁移到其正式的位置与实现。被移除的特性标志可在 `net.minecraft.world.level.storage.WorldData#getRemovedFeatureFlags` 中查看。

## LootData {#lootdata}

战利品表、谓词（Predicate）与物品修改器（Item Modifier）在内部已迁移到由同一套系统处理：`LootData`。 `LootData` 通过 `LootDataResolver` 解析，并由其 `LootDataType` 标识。此外，将某个 `ResourceLocation` 包裹进 `LootDataId` 中即可将其与某个 `LootDataType` 关联。

所有对 `#getLootTables`、 `#getPredicateManager`、 `#getItemModifierManager` 的调用，现已被 `#getLootData` 取代。随后，你可以通过 `#getElement` 或 `#getElementOptional` 获取所需的元素。

```java
// Given some MinecraftServer 'server'
server.getLootData().getElement(LootDataType.TABLE, new ResourceLocation(MODID, "example_table"));
```

## 顶点逻辑改动 {#vertex-logic-changes}

投影矩阵中的顶点现在可以通过 `com.mojang.blaze3d.vertex.VertexSorting` 进行排序。默认情况下，排序可以按到原点的距离（`#DISTANCE_TO_ORIGIN`）、按到屏幕投影的距离（`#ORTHOGRAPHIC_Z`），或按用户指定的任意距离函数（`#byDistance`）进行。作为一个接口，它可以扩展以涵盖任意实现。排序方式可通过 `RenderSystem#setProjectionMatrix` 设置。

一些方法已被修改以接受 `VertexSorting`：

* `com.mojang.blaze3d.vertex.BufferBuilder#setQuardSortOrigin` -> `#setQuadSorting`

`VertexBufffer` 现在接受一个 `VertexBuffer$Usage` 枚举，用于决定使用 `GL_STATIC_DRAW` 还是 `GL_DYNAMIC_DRAW`。

## GuiGraphics {#guigraphics}

`GuiComponent` 已从游戏中彻底移除，现以 `GuiGraphics` 的形式出现。顾名思义，`GuiGraphics` 持有 GUI 的所有绘制相关信息与辅助工具。 GUI 相关类中的大多数 `PoseStack` 参数现已被 `GuiGraphics` 取代。 `PoseStack` 仍可通过 `GuiGraphics#pose` 获取。此外，`GuiComponent` 之外的 GUI 绘制方法现已迁移到 `GuiGraphics`，例如 `ItemRenderer#renderGuiItem`。 GUI 现在拥有一个 Z 值（表示与相机的远近），其取值范围限定在 `[-10000, 10000]`。

`GuiGraphics` 的内部实现使得几乎所有 `RenderSystem` 调用都变得不再必要。 `RenderSystem#depthMask` 以及 `#enable/disableDepthTest` 调用现在由内部的 `GuiGraphics#flush` 处理，或通过为屏幕渲染指定一个 `RenderType` 来处理。此外，绘制调用可以使用 `GuiGraphics#drawManaged` 隔离，该方法会在数据绘制前后刷新缓冲区。

这还引入了一些可用的新 shard：
* `RenderStateShard$ColorLogicStateShard`，带有 `no_color_logic` 与 `or_reverse`

同时也有一些移除：
* `#blitOutlineBlack` —— 它在 `LogoRenderer` 中的唯一用途已改为使用一张包含描边的纹理。

## 光照引擎重写 {#light-engine-rewrite}

光照引擎已被重写，以提高效率并加以整合。虽然光照引擎的基本用法保持相似，但更复杂的任务将需要一定程度的重写。

大多数散落在光照处理类（如光照引擎）之外的光照相关逻辑流程已被移除。此外，存储和写入在光照引擎之外的光照信息也已被移除。

### LightEngine {#lightengine}

先从 `LightEngine` 说起。它本质上是 `LayerLightEngine` 的重命名，在添加或移除光源时具有更高性能的传播逻辑。该类中的大多数方法都是一一对应的，只有少数几个方法的参数有所改动。 `LightEngine` 分别由 `SkyLightEngine` 和 `BlockLightEngine` 实现，用于天空光和方块光。因此，`net.minecraft.world.level.LightLayer` 已被精简为枚举常量，不再持有周围的光照层值。这些类中任何在光照增减时触发的方法都已被移除，转而使用位置相关方法中的回调来处理传播。

光源的初始化现在通过 `#initializeLightSources` 方法完成（如在 `ChunkAccess` 中），在区块加载以及处理来自服务端的网络包时进行。

#### ChunkSkyLightSources {#chunkskylightsources}

`SkyLightEngine` 现在通过 `ChunkSkyLightSources` 处理区块内的光源。这本质上是一个位存储，用于处理天空光如何在区块中向下传播。

### LightChunk {#lightchunk}

`LightChunk` 是一个扩展自 `BlockGetter` 的接口，所有区块都会实现它。 `LightChunk` 包含两个方法：`#findBlockLightSources`，用于找出所有发光的方块并传入一个回调，该回调会异步地增加该位置的光源；以及 `#getSkyLightSources`，用于存储当前区块的 `ChunkSkyLightSources`。这些方法取代了 `ChunkAccess` 中的相应方法（如 `#getLights`）。

因此，所有对区块的光照相关调用（如 `LightChunkGetter#getChunkForLighting`）现在返回 `LightChunk`，而不再是 `BlockGetter`。

## RuleBlockEntityModifier {#ruleblockentitymodifier}

在 `rule` 结构处理器中，现在可以使用 `RuleBlockEntityModifier` 以规范化的方式修改方块实体。它们只是定义了如何修改某个方块实体上的标签。原版提供了若干实现：清除标签（`clear`）、将标签与另一标签合并（`append_static`）、添加战利品标签（`append_loot`），或什么都不做（`passthrough`）。新的修改器可以通过静态注册表借助 `RuleBlockEntityModifierType` 添加。

## 告示牌：现在拥有更多特性 {#signs-now-with-more-features}

告示牌现在拥有大量特性。首先，告示牌文本本身存储在一个 `net.minecraft.world.level.block.entity.SignText` 对象中。文本可以位于告示牌的正面和背面。在 `SignBlock` 中，现在可以通过抽象方法 `SignBlock#getYRotationDegrees` 指定完整的旋转。此外，可通过 `#openTextEdit` 打开告示牌编辑器。告示牌的碰撞箱中心由 `SignBlock#getSignHitboxCenterPosition` 决定。告示牌的模型和文本可分别通过 `SignRenderer#getSignModelRenderScale` 与 `#getSignTextRenderScale` 缩放。

告示牌也可以通过物品来修改，方法是附加 `net.minecraft.world.item.SignApplicator` 接口。首先，它会检查该物品能否应用于告示牌（`#canApplyToSign`），然后尝试将数据应用到告示牌并返回是否成功（`#tryApplyToSign`）。

告示牌上的点击命令现在可以通过 `SignBlockEntity#canExecuteClickCommands` 开关。目前它仅在尝试将悬挂式告示牌串联在一起时应用。

## 再见，遗留锻造 {#goodbye-legacy-smithing}

在 1.19.4 中，当时的锻造实现被弃用并迁移为一套遗留实现，以便由转化（transformer）与纹饰（trim）取代。1.20 完全移除了该遗留实现，其中包括 `LegacyUpgradeRecipe` 与 `LegacySmithingScreen` 等类。

## 通过 SignalGetter 处理红石信号 {#redstone-signals-via-the-signalgetter}

所有原本与 level 绑定的信号信息已迁移到其专属的 getter，称为 `net.minecraft.world.level.SignalGetter`。如果你直接从 `Level` 本身调用这些方法，你在 `#getDirectSignalTo`、 `#hasSignal`、 `#getSignal`、 `#hasNeighborSignal` 和 `#getBestNeighborSignal` 上很可能不会察觉到任何区别。

当然，`net.minecraft.world.level.block.DiodeBlock` 本身也有一些改动：

* `#getAlternateSignal(LevelReader, BlockPos, BlockState)` -> `#getAlternateSignal(SignalGetter, BlockPos, BlockState)`
* `#getAlternateSignalAt` -> `SignalGetter#getControlInputSignal`
* `#isAlternateInput` -> `#sideInputDiodesOnly`

## 共振振动 {#resonate-vibrations}

由于 1.20 加入了校准幽匿感测体，振动监听器已被修改以处理不同的频率，并允许与其他方块产生某种形式的共振。这通常通过 `net.minecraft.world.level.block.SculkSensorBlock#tryResonateVibration` 检查，该方法通过 `net.minecraft.world.level.gameevent.vibrations.VibrationSystem#getResonanceEventByFrequency` 决定要发出的共振 `GameEvent`。可以通过 `minecraft:vibration_resonators` 方块标签为特定方块添加共振能力。监听器可以使用 `VibrationSystem$Listener` 附加到任何实体上。

> 共振目前被硬编码为紫水晶方块的声音。

## StructureProcessor 重新定义 {#structureprocessor-redefinitions}

`StructureProcessor` 中的两个主要方法略有改动，以重新定义其实现。首先，`#processBlock` 现在不再是抽象方法，而是默认返回（no-op）传入的 `StructureBlockInfo`。其次，`#finalizeProcessing` 现在返回修改后的 `StructureBlockInfo` 列表，默认返回（no-op）传入的列表。 `#finalizeProcessing` 现在还接受 `ServerLevelAccessor`，而非仅仅是 `LevelAccessor`，这与大多数其他模板逻辑调用一致。

## 剥离 Material {#stripping-materials}

`Material` 已从方块属性（Block Properties）中完全移除。为此有若干相应改动。

创建方块属性现在通过静态构造方法 `#of` 完成，它不接受任何参数：

```java
// Other properties can be chained to the end of this
BlockBehavior.Properties.of();
```

首先，`BlockBehaviour#getPistonPushReaction(BlockState)`、 `Material#getPushReaction`、 `Material$Builder#destroyOnPush` 和 `Material$Builder#notPushable` 均已不复存在，现在改为通过属性 `BlockBehaviour$Properties#pushReaction` 设置。此外，只有在调用了 `#ignitedByLava` 属性时，方块才会被岩浆点燃，取代了 `Material#isFlammable` 与 `Material$Builder#flammable`。同样，只有当方块具有 `#liquid` 属性时才会被设为液体，取代了 `Material#isLiquid`。无论形状如何，都可以使用 `BlockBehaviour$Properties#forceSolidOn` 与 `#forceSolidOff` 分别强制方块为实心或非实心。你还可以通过 `#replaceable` 设置方块是否可被替换。

你可以在 [Gizmo 的 gist](https://gist.github.com/GizmoTheMoonPig/77a90a48e0aeecd15b4c524e1c7f0a4a) 上找到每种 material 的替代属性清单。

方块被放置在音符盒下方时发出的声音，通过 `BlockBehaviour$Properties#instrument` 设置。

`net.minecraft.world.level.material.MaterialColor` 现已被 `MapColor` 取代。可以在方块属性上使用 `#mapColor`（取代 `#color`）指定 `MapColor`，方式是提供一个 `DyeColor`、 `MapColor`，或一个将 `BlockState` 转换为 `MapColor` 的函数。这包括以下重命名：

* `net.minecraft.world.level.block.state.BlockBehavior#defaultMaterialColor` -> `#defaultMapColor`

新增了以下 `BlockState` 方法：

* `BlockState#blocksMotion`
* `BlockState#isSolid`
* `BlockState#instrument`

## 触发条件（Criteria）改动 {#criteria-changes}

所有 `AbstractCriterionTriggerInstance` 现在接受一个 `ContextAwarePredicate`，而非表示玩家的 `EntityPredicate$Composite`。 `ContextAwarePredicate` 本质上是一组以 AND 连接的 `LootItemCondition`。虽然在大多数情况下它仍代表玩家，但 `ItemUsedOnLocationTrigger`（取代了 `ItemInteractWithBlockTrigger` 与 `PlacedBlockTrigger`）会使用 `ContextAwarePredicate` 根据目标方块的状态执行改动。 `ContextAwarePredicate` 可以使用 `#create` 创建，或使用 `EntityPredicate#wrap` 以便与玩家轻松兼容。

## 创造模式物品栏（Creative Tab）注册表 {#creative-tab-registry}

`CreativeModeTab` 现在是一个新的静态注册表。

## 小型新增、改动与移除 {#minor-additions-changes-and-removals}

以下列出一些有用或有趣的新增、改动与移除，它们不足以在导读中单独成节。

### 疑似沙子改为可刷除方块 {#suspicuous-sand-to-brushable}

所有疑似沙子（suspicious sand）的实现现已重命名为“brushable”（可刷除），例如 `SuspiciousSandBlock` -> `BrushableBlock`。

### ProjectileUtil#getHitResult {#projectileutilgethitresult}

`net.minecraft.world.entity.projectile.ProjectileUtil#getHitResult` 已扩展为两个方法：`#getHitResultOnMoveVector`，使用从实体脚部位置出发的向量；以及 `#getHitResultOnViewVector`，使用从实体眼部位置出发的向量。 `#getHitResultOnMoveVector` 直接取代了旧版本中的 `#getHitResult`。

### 公共输入 {#commoninputs}

新增了 `net.minecraft.client.gui.navigation.CommonInputs`，用于提供与 GUI 输入相关的便捷实现。目前唯一的方法是 `#selected`，用于检查是否按下了空格键或回车键。

### 字体 {#fonts}

字体的内部实现改动颇多，但大多数面向用户的调用保持不变。 `GlyphRenderTypes` 现在持有用于常规渲染、透视渲染或多边形偏移渲染的字体 `RenderType`。 `CodepointMap`（本质上是整数到对象的映射）现在被用于位图（bitmap）和 unihex 提供者中。 `FontManager` 本身现在可重载，并通过 codec 管理，而不再拥有一个处理相关逻辑的字段。

所有名称中带有 `Builder` 的类，要么去掉了 `Builder`，要么改为 `Definition`（例如 `ProviderReferenceBuilder` -> `ProviderReferenceDefinition`）。

`GlyphProviderType#LEGACY_UNICODE`（由 `GlyphProviderBuilderType` 重命名而来）现已被移除，转而使用 `#UNIHEX` 实现。此外，新增了一个 `#REFERENCE` 构建器类型，允许用户通过一个引用 `assets/<namespace>/font` 目录的 `id` 来引用另一套字体定义。

此外，`net.minecraft.client.gui.Font#draw`、 `#drawShadow`、 `#drawWordWrap` 已被移除。这些调用预期直接经由 `GuiGraphics` 完成，因为 `GuiGraphics` 能够指定这些方法原本硬编码的参数。

#### GlyphProviderDefinition {#glyphproviderdefinition}

`GlyphProviderBuilder` 已被重新组织：

* `net.minecraft.client.gui.font.providers.GlyphProviderBuilder#create` -> `GlyphProviderDefinition$Loader#load`
    * 此改动还会抛出 `IOException`，而不再返回一个 null 条目。
* `GlyphProviderDefinition#unpack` 现在用于构造字体的加载器，或一个持有待加载字形提供者引用的记录（record）。

### OR、 AND 与复合 LootItemCondition {#or-and-and-composite-lootitemconditions}

`AlternativeLootItemCondition`（即 `alternative`）已被移除，并拆分为两个条件：`any_of` 与 `all_of`，分别表示 OR 与 AND。此外，复合条件现在拥有一个独立的抽象父类，称为 `CompositeLootItemCondition`。

### 战利品参数 {#lootparams}

`LootContext` 的实现已在其自身与 `LootParams` 之间拆分。 `LootParams` 负责 `LootContext` 此前所做的工作：level、参数、动态掉落物和幸运值。在大多数情况下，构造参数逻辑时你可以用 `LootParams` 替换 `LootContext`。 `LootTable` 中还有一些额外的包装方法，现在接受 `LootParams` 而非 `LootContext` 本身，并使用其存储的随机序列。

`LootContext` 现在接受一个 `LootParams`，以及一个负责处理随机选择的随机序列。这仍会传入战利品表以生成所需的数据。它还可以指定一个可选的种子，以防 `LootParams` 本身没有种子。 `LootContext` 中的一些方法现在会额外接受一个表示该可选种子的 long（例如 `#fill`）。

因此，以下字段和方法有所改动：

* `net.minecraft.world.level.block.state.BlockBehaviour#getDrops(BlockState, LootContext$Builder)` -> `#getDrops(BlockState, LootParams$Builder)`
* `net.minecraft.world.level.block.state.BlockBehaviour$BlockStateBase#getDrops(LootContext$Builder)` -> `#getDrops(LootParams$Builder)`

#### 随机序列 {#randomsequence}

每个 `LootContext` 现在都会获得一个基于唯一 `ResourceLocation` 的 `XoroshiroRandomSource`，用于处理随机选择。它存储在一个 `SavedData` 中，并通过 `ServerLevel#getRandomSequences` 访问，单个 `RandomSource` 则通过 `#getRandomSequence` 访问。目前唯一使用的随机源是 `LootTable#DEFAULT_RANDOM_SEQUENCE`（`minecraft:default`）。

### CropBlock 方法访问级别 {#cropblock-method-accessors}

`CropBlock` 中三个方法的访问级别有所改动：

* `#getAgeProperty` 现在是 `protected`，而非 `public`
* `#getAge` 现在是 `public`，而非 `protected`
* `#isMaxAge` 现在是 `final`

### CombatTracker 重构 {#combattracker-rework}

`CombatTracker` 中的大量逻辑和方法被重构或移动：

* 改动
    * `#recordDamage(DamageSource, float, float)` -> `#recordDamage(DamageSource, float)`
    * `#getFallLocation` -> `FallLocation#getCurrentFallLocation`
* 移除
    * `#prepareForDamage`
    * `#getKiller`
    * `#isTakingDamage`
    * `#isInCombat`
    * `#resetPreparedStatus`
    * `#getMob`
    * `#getLastEntry`
    * `#getKillerId`

### 新标签 {#new-tags}

* 生物群系标签 `minecraft:has_structure/trail_ruins`
* 方块标签 `minecraft:combination_step_sound_blocks` —— 用于应同时播放当前方块与其下方方块脚步声的方块
* 方块标签 `minecraft:vibration_resonators` —— 决定在该方块上产生振动的声音是否应发生共振。
* 方块标签 `minecraft:sniffer_egg_hatch_boost` —— 决定嗅探兽蛋下方的方块是否加快孵化时间。
* 方块标签 `minecraft:trail_ruins_replaceable`
* 方块标签 `minecraft:sword_efficient` —— 用剑破坏该方块是否高效
* 方块标签 `minecraft:replaceable_by_trees` —— 决定该方块能否被树替换
* 方块标签 `minecraft:replaceable` —— 决定该方块是否可被替换
    * 这很可能是 `minecraft:replaceable_plants` 的替代品
* 方块标签 `minecraft:enchantment_power_provider` —— 决定什么可以为附魔台提供能量
* 方块标签 `minecraft:enchantment_power_transmitter` —— 决定什么不会阻碍能量向附魔台的传输
* 方块与物品标签 `minecraft:stone_buttons`
* 物品标签 `minecraft:villager_plantable_seeds`
* 物品标签 `minecraft:decorated_pot_shards` -> `minecraft:decorated_pot_sherds`
* 方块标签 `minecraft:maintains_farmland` —— 决定某方块是否维持其下方的耕地
* 物品标签 `minecraft:decorated_pot_ingredients`

### 新增 {#additions}

* `net.minecraft.core.BlockPos#breadthFirstTraversal` —— 从指定点的距离出发遍历方块位置，并确定有多少个位置满足关联的谓词。
* `net.minecraft.util.ExtraCodecs#FLAT_COMPONENT` —— 在 `Component` 与字符串之间相互转换。
* `net.minecraft.world.entity.Entity#handleStepSounds`、 `#getPrimaryStepSoundBlockPos` 和 `#playCombinationStepSounds` 用于处理在方块上行走时应同时播放的方块声音。
* `net.minecraft.world.entity.animal.Animal#finalizeSpawnChildFromBreeding` —— 处理由繁殖该实体带来的任何额外生成设置，而不生成幼崽本身。
* `net.minecraft.world.level.block.LeavesBlock#getOptionalDistanceAt` —— `#getDistanceAt` 的公开实现
* `net.minecraft.client.gui.screens.Screen#getBackgroundMusic` —— 界面可以设置打开时播放的背景音乐
    * 需要在关闭时停止的音乐应通过 `Screen#removed` 查询音乐管理器（借助 `MusicManager#stopPlaying`）
* `net.minecraft.world.level.lighting.LeveledPriorityQueue` —— 一个分层的优先级队列
* `net.minecraft.client.gui.components.AbstractWidget#getTooltip` —— 返回与某个组件关联的工具提示
* `net.minecraft.world.entity.Entity#getNameTagOffsetY` —— 名牌 y 位置的偏移量
* `net.minecraft.world.item.ItemStack#copyAndClear` —— 返回该物品堆叠的副本，同时清空原本
* `net.minecraft.world.level.block.DoorBlock#type` —— 返回门的 `BlockSetType`
* `net.minecraft.world.level.block.FarmableBlock` —— 用于检查是否应为上方的方块保留耕地
* `net.minecraft.world.level.block.IceBlock#meltsInto` —— 返回冰块应融化成的物质
* `net.minecraft.world.level.block.SculkSensorBlock#getActiveTick` —— 返回幽匿感测体应保持激活状态的刻数
* `net.minecraft.world.inventory.CraftingContainer#getItems`
* `net.minecraft.world.inventory.Slot#isHighlightable`
* `com.mojang.blaze3d.platform.NativeImage#applyToAllPixels` —— 对图像像素的颜色应用一个变换
* `net.minecraft.core.SectionPos#getZeroNode(II)` —— 从指定的 XZ 坐标获取零节点区段位置。
* `net.minecraft.util.DependencySorter` —— 排序依赖关系的基本逻辑流程
* `net.minecraft.util.ExtraCodecs#CODEPOINT`
* `net.minecraft.world.entity.Mob#onPathfindingStart` 和 `#onPathfindingDone` —— 寻路的回调
* `net.minecraft.world.level.chunk.ChunkAccess#getHighestGeneratedStatus`
* 遥测系统得到了进一步充实，接入了进度与 Realms。
* `net.minecraft.gametest.framework.GameTestHelper#withLowHealth`
* `net.minecraft.network.syncher.SynchedEntityData#hasItem`
* `net.minecraft.util.ExtraCodecs#validate` —— 用于应用于 `Codec#flatXmap` 的通用校验器
* 实体现在会记录与其碰撞、或“支撑”着它、阻止它继续下落的方块。可以通过 `Entity#isSupportedBy` 检查“支撑”方块
* `net.minecraft.advancements.Advancement$Builder#recipeAdvancement` —— 为配方构造一个进度，且不发送遥测事件。
* `net.minecraft.Util#fixedSize(LongStream, I)`
* `net.minecraft.gametest.framework.GameTestHelper#makeMockServerPlayerInLevel`
* `net.minecraft.server.level.ChunkLevel` —— 用于管理区块状态与加载状态的辅助类。
* `net.minecraft.world.entity.Entity#setPortalCooldown(I)` 和 `#getPortalCooldown`
* `net.minecraft.world.entity.LivingEntity#getLootTableSeed`
* `net.minecraft.world.entity.boss.enderdragon.EnderDragon#setDragonFight`、 `#setFightOrigin`、 `#getFightOrigin`
* `net.minecraft.world.level.levelgen.Xoroshiro*` 类现在拥有 codec
* `net.minecraft.Util#isWhitespace` 和 `#isBlank`
    * `org.apache.commons.lang3.StringUtils` 的 Minecraft 替代品
* `net.minecraft.client.model.HierarchicalModel#applyStatic` —— 用于借助动画系统应用静态变换
* `net.minecraft.world.entity.Entity#isOnRails` —— 目前仅当矿车位于铁轨上时为 `true`
* `net.minecraft.world.item.crafting.Ingredient#fromJson(JsonElement, boolean)` —— 当布尔值为 true 时，空气将返回一个 `null` 配方材料，而不是抛出异常。
    * 这是 `#fromJson(JsonElement)` 重载中的默认行为
* `net.minecraft.world.level.BaseCommandBlock#isValid` —— 检查命令方块菜单能否被访问
* `net.minecraft.client.gui.screens.FaviconTexture`
* `net.minecraft.gametest.framework.GameTestHelper#killAllEntitiesOfClass`
* `net.minecraft.gametest.framework.GameTestHelper#assertRedstoneSignal`
* `net.minecraft.world.entity.Entity#setOnGroundWithKnownMovement` —— 将用户设为处于地面上，并连同实体打算站立的方块一起设置。
* `net.miencraft.world.level.block.EquipableCarvedPumpkinBlock`
* `net.miencraft.world.level.levelgen.RandomSupport#upgradeSeedTo128bitUnmixed` —— 不对种子应用 stafford 13 混合
* `net.minecraft.client.KeyMapping#resetToggleKeys`
* `net.minecraft.client.gui.components.AbstractScrollWidget#renderBorder`
* `net.minecraft.client.gui.components.FittingMultiLineTextWidget`
* `net.minecraft.util.GsonHelper#getNonNull`
* `net.minecraft.world.level.storage.LevelStorageSource#validateAndCreateAccess`
* `net.minecraft.world.level.validation.ContentValidationException`
* `net.minecraft.world.level.validation.DirectoryValidator`
* `net.minecraft.world.level.validation.PathAllowList`

### 改动与重命名 {#changes-and-renames}

* `net.minecraft.client.particle.DripParticle#createCherryLeaves*Particle` -> `CherryParticle`
* 实体的阴影半径现在按最小 32 渲染。
* `net.minecraft.server.level.ServerEntity#changedPassengers` -> `#removedPassengers`
* `net.minecraft.world.level.levelgen.structure.templatesystem.ProcessorRule#getOutputTag()` -> `#getOutputTag(RandomSource, CompoundTag)`
* `net.minecraft.core.Direction#fromNormal` -> `#fromDelta`
    * 所有其他 `#fromNormal` 方法和字段均已被移除
* `net.minecraft.world.entity.LivingEntity#*Ridden*` 方法现在接受一个 `Player`，而非 `LivingEntity`
* `net.minecraft.world.entity.animal.camel.Camel#standUpPanic` -> `#standUpInstantly`
* `net.minecraft.world.entity.Entity#wasKilled` -> `#killedEntity`
* `net.minecraft.world.level.block.Block#isPossibleToRespawnInThis()`-> `#isPossibleToRespawnInThis(BlockState)
* `BlockSetType` 现在接受一个布尔值，表示该方块能否用手打开
* `net.minecraft.client.gui.screens.inventory.tooltip.ClientTooltipPositioner#positionTooltip(Screen, IIIII)` -> `#positionTooltip(IIIIII)`
* `net.minecraft.commands.CommandSourceStack` 现在接受一个 `IntConsumer`，用于接收命令的返回值
* `net.minecraft.world.inventory.RecipeHolder#awardUsedRecipes(Player)` -> `#awardUsedRecipes(Player, List<ItemStack>)`
* `net.minecraft.world.level.block.FarmableBlock` 被方块标签 `minecraft:maintains_farmland` 取代
* `net.minecraft.client.Minecraft` 或 `net.minecraft.server.MinecraftServer` —— `#getServiceSignatureValidator` -> `#getProfileKeySignatureValidator`
* `net.minecraft.data.recipes.RecipeProvider#trimSmithing` 现在接受一个表示配方 JSON 名称的 `ResourceLocation`
* `net.minecraft.server.level.ServerPlayer#getLevel` -> `#serverLevel`
* `net.minecraft.server.level.ServerPlayer#setLevel` -> `#setServerLevel`
* `net.minecraft.util.SpawnUtil$Strategy#LEGACY_IRON_GOLEM` 已被弃用
* `net.minecraft.world.entity.Entity#level` 字段 -> `#level` 方法
   * `level` 字段现在为 private
   * 设置该字段现在通过 `#setLevel` 完成
* `net.minecraft.world.entity.Entity#isOnGround` -> `onGround` 方法
   * `onGround` 字段现在为 private
   * 设置该字段现在通过 `#setOnGround` 完成
* `net.minecraft.world.entity.OwnableEntity#getLevel` -> `#level`
* `net.minecraft.world.entity.ai.behavior.FollowTemptation` 现在可以接受一个表示“足够接近”半径的 double
* `net.minecraft.world.level.chunk.ChunkAccess#getHighestSectionPosition` 已被弃用并计划移除
* `net.minecraft.client.renderer.LevelRenderer#renderVoxelShape` 接受一个额外的布尔值，用于在调试渲染中改变所渲染体素的颜色。
* `net.minecraft.client.renderer.entity.ItemRenderer` 现在会使用 `#hasAnimatedTexture` 检查带有闪光效果的动画纹理
    * 该方法目前为 private，并硬编码到 `compasses` 物品标签或时钟。
* `net.minecraft.world.entity.LivingEntity#getJumpBoostPower` 现在返回一个 `float`
* `net.minecraft.client.player.LocalPlayer#portalTime` 和 `#oPortalTime` -> `spinningEffectIntensity` 和 `#oSpinningEffectIntensity`
* `net.minecraft.data.recipes.RecipeProvider#coloredWoolFromWhiteWoolAndDye` 和 `#coloredCarpetFromWhiteCarpetAndDye` 已被 `#colorBlockWithDye` 取代，后者接受一个染料列表和一个染色对象列表
* `net.minecraft.server.level.ChunkHolder$FullChunkStatus` -> `level.FullChunkStatus`
    * 枚举值也有所改动：`BORDER` -> `FULL`，`TICKING` -> `BLOCK_TICKING`
* `net.minecraft.world.damagesource.DamageSources#outOfWorld` -> `#fellOutOfWorld`
* `net.minecraft.world.entity.Entity#outOfWorld`、 `#checkOutOfWorld` -> `#onBelowWorld`、 `#checkBelowWorld`
* `net.minecraft.server.level.ServerLevel#dragonFight` -> `#getDragonFight`
* `net.minecraft.world.entity.Entity#getOnPos(F)` 现在为 protected，而非 private
* `net.minecraft.world.inventory.CraftingContainer` -> `TransientCraftingContainer`
    * `CraftingContainer` 现在是一个接口，由 `TransientCraftingContainer` 实现，用于指定宽度、高度以及其中的物品列表
* `net.minecraft.world.item.ItemStack#sameItem` -> `#isSameItem`
* `net.minecraft.commands.CommandSourceStack#sendSuccess(Component, boolean)` -> `#sendSuccess(Supplier<Component>, boolean)`
* `net.minecraft.world.entity.ai.behavior.FollowTemptation(Function<LivingEntity, Float>, double)` -> `FollowTemptation(Function<LivingEntity, Float>, Function<LivingEntity, Double>)`
* `net.minecraft.client.gui.components.AbstractSelectionList#clearEntries` 现在为非 final
* `net.minecraft.world.damagesource.CombatEntry` 现在是一个记录（record）
* `net.minecraft.world.entity.Entity#positionRider(Entity)` 现在为 final，而 `#positionRider(Entity, MoveFunction)` 现在为 protected，而非 private
* `net.minecraft.world.level.block.Block#dropResources` —— 该实体现在可为 null
* `net.minecraft.server.level.ServerPlayer#doCheckFallDamage(double, boolean)` -> `#doCheckFallDamage(double, double, double, boolean)` —— 现在接受 XZ 位置
* `net.minecraft.world.entity.LivingEntity#sendEffectToRider` -> `#sendEffectToPassengers`
* `net.minecraft.client.gui.components.AbstractScrollWidget#renderBackground` 现在为 `protected`，而非 `private`
* `net.minecraft.world.item.crafting.ShapedRecipe#itemFromJson` 现在为 `public`，而非 `private`
* `net.miencraft.world.level.storage.WorldLevelData#endDragonFightData` 和 `#setEndDragonFightData` 现在作用于 `EndDragonFight$Data`

### 移除 {#removals}

* `net.minecraft.world.entity.Entity#teleportPassengers`
* `net.minecraft.gametest.framework.GameTestHelper#continuouslyUse`
* `net.minecraft.data.recipes.SmithingTrimRecipeBuilder#save(Consumer, String)`
* `block` 与 `new_entity` shader，因为它们已被 Minecraft 弃用不再使用
* `net.minecraft.world.item.ItemStack#tagMatches` 和 `#isSame`
* `net.minecraft.world.level.block.Block#dropResources(BlockState, LootContext$Builder)`
* `net.minecraft.world.level.block.Fallable#getHurtsEntitySelector`
* `net.minecraft.world.level.chunk.ChunkStatus` 不再接受字符串名称

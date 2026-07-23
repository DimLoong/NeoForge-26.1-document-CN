# 方块 {#blocks}

方块是 Minecraft 世界的基石。所有地形、结构和机器都由它们构成。如果你有意制作一个 Mod，那么很可能就会想添加一些方块。本页将引导你完成方块的创建，以及可以用方块做的一些事情。

## 万块归一 {#one-block-to-rule-them-all}

在开始之前，有一点很重要：游戏中每种方块永远只存在一个实例。一个世界由成千上万个指向那一个方块的引用组成，只是分布在不同位置。换句话说，同一个方块被显示了很多次而已。

正因如此，一个方块只应被实例化一次，也就是在[注册][registration]期间。方块注册之后，你就可以按需使用这个已注册的引用了。

与大多数其他注册表不同，方块可以使用 `DeferredRegister` 的专用版本，称为 `DeferredRegister.Blocks`。`DeferredRegister.Blocks` 基本上等同于 `DeferredRegister<Block>`，但有一些细微差别：

- 它们通过 `DeferredRegister.createBlocks("yourmodid")` 创建，而不是常规的 `DeferredRegister.create(...)` 方法。
- `#register` 返回一个 `DeferredBlock<T extends Block>`，它扩展自 `DeferredHolder<Block, T>`。`T` 是我们所注册方块的类的类型。
- 有一些用于注册方块的辅助方法，详见[下文][below]。

那么现在，让我们来注册我们的方块：

```java
//BLOCKS is a DeferredRegister.Blocks
public static final DeferredBlock<Block> MY_BLOCK = BLOCKS.register("my_block", registryName -> new Block(...));
```

注册方块之后，所有对新 `my_block` 的引用都应使用这个常量。例如，如果你想检查某个位置上的方块是否为 `my_block`，代码大致如下：

```java
level.getBlockState(position) // returns the blockstate placed in the given level (world) at the given position
    //highlight-next-line
    .is(MyBlockRegistrationClass.MY_BLOCK);
```

这种做法还有一个便利之处：`block1 == block2` 是有效的，可以用来代替 Java 的 `equals` 方法（当然，用 `equals` 也没问题，但没有意义，因为它反正也是按引用比较的）。

:::danger
不要在注册之外调用 `new Block()`！一旦这样做，事情就可能出错，而且必然会出错：

- 方块必须在注册表处于解冻状态时创建。NeoForge 会为你解冻注册表，并在稍后重新冻结它们，因此注册阶段就是你创建方块的时间窗口。
- 如果你试图在注册表重新冻结后创建和/或注册方块，游戏将崩溃并报告一个 `null` 方块，这可能会让人非常困惑。
- 如果你最终仍持有一个游离的方块实例，游戏在同步和保存时将无法识别它，并会用空气将其替换。
:::

## 创建方块 {#creating-blocks}

如前所述，我们首先创建自己的 `DeferredRegister.Blocks`：

```java
public static final DeferredRegister.Blocks BLOCKS = DeferredRegister.createBlocks("yourmodid");
```

### 基础方块 {#basic-blocks}

对于无需特殊功能的简单方块（想想圆石、木板等），可以直接使用 `Block` 类。为此，在注册期间用一个 `BlockBehaviour.Properties` 参数实例化 `Block`。这个 `BlockBehaviour.Properties` 参数可以通过 `BlockBehaviour.Properties#of` 创建，并可通过调用其方法来自定义。其中最重要的方法有：

- `setId` —— 设置方块的资源键。
    - 这**必须**在每个方块上设置，否则将抛出异常。
- `destroyTime` —— 决定破坏该方块所需的时间。
    - 石头的破坏时间为 1.5，泥土为 0.5，黑曜石为 50，基岩为 -1（无法破坏）。
- `explosionResistance` —— 决定方块的爆炸抗性。
    - 石头的爆炸抗性为 6.0，泥土为 0.5，黑曜石为 1,200，基岩为 3,600,000。
- `sound` —— 设置方块被击打、破坏或放置时发出的声音。
    - 默认值为 `SoundType.STONE`。详见[声音页面][sounds]。
- `lightLevel` —— 设置方块的光照发射量。接受一个带 `BlockState` 参数、返回 0 到 15 之间数值的函数。
    - 例如，荧石使用 `state -> 15`，火把使用 `state -> 14`。
- `friction` —— 设置方块的摩擦力（滑度）。
    - 默认值为 0.6。冰使用 0.98。

举例来说，一个简单的实现大致如下：

```java
//BLOCKS is a DeferredRegister.Blocks
public static final DeferredBlock<Block> MY_BETTER_BLOCK = BLOCKS.register(
    "my_better_block", 
    registryName -> new Block(BlockBehaviour.Properties.of()
        //highlight-start
        .setId(ResourceKey.create(Registries.BLOCK, registryName))
        .destroyTime(2.0f)
        .explosionResistance(10.0f)
        .sound(SoundType.GRAVEL)
        .lightLevel(state -> 7)
        //highlight-end
    ));
```

如需进一步的文档，请参阅 `BlockBehaviour.Properties` 的源代码。若想查看更多示例，或了解 Minecraft 所使用的数值，可以看看 `Blocks` 类。

:::note
有一点很重要需要理解：世界中的方块与物品栏中的方块不是同一样东西。物品栏中看起来像方块的其实是一个 `BlockItem`，它是一种特殊的[物品][item]，在使用时会放置一个方块。这也意味着诸如创造模式标签页或最大堆叠数之类的东西，都是由对应的 `BlockItem` 处理的。

`BlockItem` 必须与方块分开注册。这是因为方块并不一定需要一个物品，例如当它不打算被收集时（火就是这种情况）。
:::

### 更多功能 {#more-functionality}

直接使用 `Block` 只能实现非常基础的方块。如果你想添加功能，比如玩家交互或不同的碰撞箱，就需要一个继承 `Block` 的自定义类。`Block` 类有许多可以重写以实现不同行为的方法；更多信息请参阅 `Block`、`BlockBehaviour` 和 `IBlockExtension` 这几个类。另请参阅下文的[使用方块][usingblocks]一节，了解方块的一些最常见用例。

如果你想制作一个具有不同变种的方块（想想有底部、顶部和双层变种的台阶），你应当使用[方块状态][blockstates]。最后，如果你想要一个存储额外数据的方块（想想存储物品栏内容的箱子），则应使用[方块实体][blockentities]。这里的经验法则是：如果你的状态数量有限且相当少（最多几百个状态），就用方块状态；如果状态数量无限或近乎无限，就用方块实体。

#### 方块类型 {#block-types}

方块类型是用于序列化和反序列化方块对象的 [`MapCodec`][codec]。这个 `MapCodec` 通过 `BlockBehaviour#codec` 设置，并[注册][registration]到方块类型注册表。目前，它唯一的用途是在生成方块列表报告时。每个 `Block` 的子类都应创建一个方块类型。例如，`FlowerBlock#CODEC` 代表大多数花朵的方块类型，而它的子类 `WitherRoseBlock` 则有一个单独的方块类型。

如果方块子类只接受 `BlockBehaviour.Properties`，那么可以使用 `BlockBehaviour#simpleCodec` 来创建 `MapCodec`。

```java
// For some block subclass
public class SimpleBlock extends Block {
    public SimpleBlock(BlockBehavior.Properties properties) {
        // ...
    }

    @Override
    public MapCodec<SimpleBlock> codec() {
        return SIMPLE_CODEC.get();
    }
}

// In some registration class
public static final DeferredRegister<MapCodec<? extends Block>> REGISTRAR = DeferredRegister.create(BuiltInRegistries.BLOCK_TYPE, "yourmodid");

public static final Supplier<MapCodec<SimpleBlock>> SIMPLE_CODEC = REGISTRAR.register(
    "simple",
    () -> BlockBehaviour.simpleCodec(SimpleBlock::new)
);
```

如果方块子类包含更多参数，那么应使用 [`RecordCodecBuilder#mapCodec`][codec] 来创建 `MapCodec`，并为 `BlockBehaviour.Properties` 参数传入 `BlockBehaviour#propertiesCodec`。

```java
// For some block subclass
public class ComplexBlock extends Block {
    public ComplexBlock(int value, BlockBehavior.Properties properties) {
        // ...
    }

    @Override
    public MapCodec<ComplexBlock> codec() {
        return COMPLEX_CODEC.get();
    }

    public int getValue() {
        return this.value;
    }
}

// In some registration class
public static final DeferredRegister<MapCodec<? extends Block>> REGISTRAR = DeferredRegister.create(BuiltInRegistries.BLOCK_TYPE, "yourmodid");

public static final Supplier<MapCodec<ComplexBlock>> COMPLEX_CODEC = REGISTRAR.register(
    "simple",
    () -> RecordCodecBuilder.mapCodec(instance ->
        instance.group(
            Codec.INT.fieldOf("value").forGetter(ComplexBlock::getValue),
            BlockBehaviour.propertiesCodec() // represents the BlockBehavior.Properties parameter
        ).apply(instance, ComplexBlock::new)
    )
);
```

:::note
尽管方块类型目前基本上没有被使用，但预计随着 Mojang 继续向以 codec 为中心的结构迁移，它在未来会变得更加重要。
:::

### `DeferredRegister.Blocks` 辅助方法 {#deferredregisterblocks-helpers}

我们已经在[上文][above]讨论了如何创建 `DeferredRegister.Blocks`，以及它返回 `DeferredBlock`。现在，让我们看看这个专用的 `DeferredRegister` 还提供了哪些其他实用工具。先从 `#registerBlock` 开始：

```java
public static final DeferredRegister.Blocks BLOCKS = DeferredRegister.createBlocks("yourmodid");

public static final DeferredBlock<Block> EXAMPLE_BLOCK = BLOCKS.register(
    "example_block", registryName -> new Block(
        BlockBehaviour.Properties.of()
            // The ID must be set on the block
            .setId(ResourceKey.create(Registries.BLOCK, registryName))
    )
);

// Same as above, except that the block properties are supplied separately.
// setId is also called internally on the properties object.
public static final DeferredBlock<Block> EXAMPLE_BLOCK = BLOCKS.registerBlock(
    "example_block",
    Block::new, // The factory that the properties will be passed into.
    () -> BlockBehaviour.Properties.of() // The supplied properties to use.
);

// Same as above, except that the `Properties#of` is supplied and operated upon.
// setId is also called internally on the properties object.
public static final DeferredBlock<Block> EXAMPLE_BLOCK = BLOCKS.registerBlock(
    "example_block",
    Block::new, // The factory that the properties will be passed into.
    props -> props // A unary operator of the properties to use.
);
```

如果你想使用 `Block::new`，可以完全省略工厂参数：

```java
public static final DeferredBlock<Block> EXAMPLE_BLOCK = BLOCKS.registerSimpleBlock(
    "example_block",
    () -> BlockBehaviour.Properties.of() // The supplied properties to use.
);

public static final DeferredBlock<Block> EXAMPLE_BLOCK = BLOCKS.registerSimpleBlock(
    "example_block",
    props -> props // A unary operator of the properties to use.
);
```

这与前面的示例效果完全相同，只是稍微短一些。当然，如果你想使用 `Block` 的子类而非 `Block` 本身，就得改用前面的方法。

### 资源 {#resources}

如果你注册了方块并将其放置到世界中，会发现它缺少纹理之类的东西。这是因为[纹理][textures]等内容是由 Minecraft 的资源系统处理的。在 Minecraft 中添加新方块时，你应当编写或[生成][datagen]以下文件：

- 一个[方块状态文件][bsfile]
- 一个[方块模型][model]
- 一个[翻译][i18n]
- 一个[战利品表][loottable]
- 一些方块[标签][tags]，例如用于挖掘

对于上述所有内容，也可参考类似原版方块的文件和数据生成器。

## 使用方块 {#using-blocks}

方块很少被直接用来做事。事实上，整个 Minecraft 中可能最常见的两个操作——获取某位置的方块，以及在某位置设置方块——用的是方块状态，而非方块。总体的设计思路是：让方块定义行为，但实际的行为运行则通过方块状态进行。正因如此，`BlockState` 经常作为参数传递给 `Block` 的方法。关于方块状态如何使用，以及如何从一个方块获取方块状态，详见[使用方块状态][usingblockstates]。

在若干情形下，`Block` 的多个方法会在不同时机被调用。以下小节列出了与方块相关的最常见流水线。除非另有说明，所有方法都会在两个逻辑端调用，并且应在两端返回相同的结果。

### 放置方块 {#placing-a-block}

方块放置逻辑从 `BlockItem#useOn` 调用（或其某个子类的对应实现，例如用于睡莲的 `PlaceOnWaterBlockItem`）。关于游戏如何走到这一步，详见[右键点击物品][rightclick]。实际上，这意味着一旦某个 `BlockItem`（例如圆石物品）被右键点击，该行为就会被调用。

- 首先检查若干前提条件，例如你不处于旁观模式、方块所需的全部特性标志均已启用，或目标位置不在世界边界之外。如果其中至少一项检查失败，流水线结束。
- 对当前位于尝试放置方块处的方块调用 `BlockBehaviour#canBeReplaced`。如果返回 `false`，流水线结束。这里返回 `true` 的典型情形有高草或雪层。
- 调用 `Block#getStateForPlacement`。在这里，可以根据上下文（其中包含位置、旋转、方块被放置在哪一面等信息）返回不同的方块状态。这对于可以朝不同方向放置的方块很有用。
- 用上一步获得的方块状态调用 `BlockBehaviour#canSurvive`。如果返回 `false`，流水线结束。
- 通过一次 `Level#setBlock` 调用将方块状态设置到世界中。
    - 在那次 `Level#setBlock` 调用中，会调用 `BlockBehaviour#onPlace`。
- 调用 `Block#setPlacedBy`。

### 破坏方块 {#breaking-a-block}

破坏方块要复杂一些，因为它需要时间。这一过程大致可分为三个阶段：“启动”、“挖掘”和“真正破坏”。

- 当左键被点击时，进入“启动”阶段。
- 现在，需要按住左键，进入“挖掘”阶段。**这一阶段的方法每刻都会被调用。**
- 如果“持续”阶段没有被打断（通过松开左键），并且方块被破坏了，则进入“真正破坏”阶段。

或者对于更喜欢伪代码的人来说：

```java
leftClick();
initiatingStage();
while (leftClickIsBeingHeld()) {
    miningStage();
    if (blockIsBroken()) {
        actuallyBreakingStage();
        break;
    }
}
```

以下小节将这些阶段进一步拆解为实际的方法调用。关于游戏如何从左键点击走到这条流水线，详见[左键点击物品][leftclick]。

#### “启动”阶段 {#the-initiating-stage}

- 首先检查若干前提条件，例如你不处于旁观模式、你主手中 `ItemStack` 所需的全部特性标志均已启用，或相关方块不在世界边界之外。如果其中至少一项检查失败，流水线结束。
- 触发 `PlayerInteractEvent.LeftClickBlock`。如果事件被取消，流水线结束。
    - 请注意，当该事件在客户端被取消时，不会有任何网络包发送到服务端，因此服务端不会运行任何逻辑。
    - 然而，在服务端取消该事件仍会导致客户端代码运行，这可能引发不同步！
- 调用 `BlockBehaviour#attack`。

#### “挖掘”阶段 {#the-mining-stage}

- 触发 `PlayerInteractEvent.LeftClickBlock`。如果事件被取消，流水线转入“收尾”阶段。
    - 请注意，当该事件在客户端被取消时，不会有任何网络包发送到服务端，因此服务端不会运行任何逻辑。
    - 然而，在服务端取消该事件仍会导致客户端代码运行，这可能引发不同步！
- 调用 `BlockBehaviour#getDestroyProgress`，并将其结果累加到内部的破坏进度计数器上。
    - `BlockBehaviour#getDestroyProgress` 返回一个 0 到 1 之间的浮点值，表示每刻应增加多少破坏进度。
- 进度覆盖层（裂纹纹理）随之更新。
- 如果破坏进度大于 1.0（即已完成，即方块应被破坏），则退出“挖掘”阶段并进入“真正破坏”阶段。

#### “真正破坏”阶段 {#the-actually-breaking-stage}

- 调用 `Item#canDestroyBlock`。如果返回 `false`（判定方块不应被破坏），流水线转入“收尾”阶段。
- 如果方块是 `GameMasterBlock` 的实例，则调用 `Player#canUseGameMasterBlocks`。这决定了玩家是否有能力破坏仅限创造模式的方块。如果为 `false`，流水线转入“收尾”阶段。
- 仅服务端：调用 `Player#blockActionRestricted`。这决定了当前玩家是否无法破坏该方块。如果为 `true`，流水线转入“收尾”阶段。
- 仅服务端：触发 `BlockEvent.BreakEvent`。如果被取消，流水线转入“收尾”阶段。其初始的取消状态由上述三个方法决定。
- 调用 `Block#playerWillDestroy`。
- 仅服务端：调用 `IBlockExtension#canHarvestBlock`。这决定了方块是否可被采集，即破坏时是否掉落物品。如果 `Player#preventsBlockDrops` 返回 true，则这一项会被忽略。
    - 仅服务端：如果 `IBlockExtension#canHarvestBlock` 未在不调用 super 的情况下被重写，则触发 `PlayerEvent.HarvestCheck`。如果 `HarvestCheck#canHarvest` 返回 `false`，则不会调用 `Block#playerDestroy`，从而阻止任何资源或经验掉落。
- 仅服务端：调用 `Item#mineBlock`。
- 调用 `IBlockExtension#onDestroyedByPlayer`。如果返回 `false`，流水线转入“收尾”阶段。
    - 通过一次 `Level#setBlock` 调用将方块状态从世界中移除，其方块状态参数为 `Blocks.AIR.defaultBlockState()` 或当前记录的流体。
        - 在那次 `Level#setBlock` 调用中，会调用 `Block#onRemove`。
    - 如果 `IBlockExtension#onDestroyedByPlayer` 返回 `true`，则调用 `Block#destroy`。
- 仅服务端：如果前面对 `IBlockExtension#canHarvestBlock` 和 `IBlockExtension#onDestroyedByPlayer` 的调用都返回 `true`，则调用 `Block#playerDestroy`。
    - 仅服务端：调用 `Block#dropResources`。这决定了方块被挖掘时掉落什么，包括经验。
        - 仅服务端：触发 `BlockDropsEvent`。如果事件被取消，则方块破坏时什么也不掉落。否则，`BlockDropsEvent#getDrops` 中的每个 `ItemEntity` 都会被添加到当前世界。此外，如果 `getDroppedExperience` 大于 0，则调用 `Block#popExperience`。
            - 仅服务端：调用 `IBlockExtension#getExpDrop`，并由 `EnchantmentHelper#processBlockExperience` 进行增补。这是 `BlockDropsEvent#getDroppedExperience` 在可能被修改之前的初始设定值。
- 仅服务端：如果用于挖掘方块的物品在上述过程中的任何时刻损坏，则触发 `PlayerDestroyItemEvent`。

#### 挖掘速度 {#mining-speed}

挖掘速度根据方块的硬度、所用[工具][tool]的速度以及若干实体[属性][attributes]，按以下规则计算：

```java
// This will return the tool's mining speed, or 1 if the held item is either empty, not a tool,
// or not applicable for the block being broken.
float destroySpeed = item.getDestroySpeed(blockState);
// If we have an applicable tool, add the minecraft:mining_efficiency attribute as an additive modifier.
if (destroySpeed > 1) {
    destroySpeed += player.getAttributeValue(Attributes.MINING_EFFICIENCY);
}
// Apply effects from haste or conduit power.
if (player.hasEffect(MobEffects.HASTE) || player.hasEffect(MobEffects.CONDUIT_POWER)) {
    int haste = player.hasEffect(MobEffects.HASTE)
        ? player.getEffect(MobEffects.HASTE).getAmplifier()
        : 0;
    int conduitPower = player.hasEffect(MobEffects.CONDUIT_POWER)
        ? player.getEffect(MobEffects.CONDUIT_POWER).getAmplifier()
        : 0;
    int amplifier = Math.max(haste, conduitPower);
    destroySpeed *= 1 + (amplifier + 1) * 0.2f;
}
// Apply slowness effect.
if (player.hasEffect(MobEffects.MINING_FATIGUE)) {
    destroySpeed *= switch (player.getEffect(MobEffects.MINING_FATIGUE).getAmplifier()) {
        case 0 -> 0.3F;
        case 1 -> 0.09F;
        case 2 -> 0.0027F;
        default -> 8.1E-4F;
    };
}
// Add the minecraft:block_break_speed attribute as a multiplicative modifier.
destroySpeed *= player.getAttributeValue(Attributes.BLOCK_BREAK_SPEED);
// If the player is underwater, apply the underwater mining speed penalty multiplicatively.
if (player.isEyeInFluid(FluidTags.WATER)) {
    destroySpeed *= player.getAttributeValue(Attributes.SUBMERGED_MINING_SPEED);
}
// If the player is trying to break a block in mid-air, make the player mine 5 times slower.
if (!player.onGround()) {
    destroySpeed /= 5;
}
destroySpeed = /* The PlayerEvent.BreakSpeed event is fired here, allowing modders to further modify this value. */;
return destroySpeed;
```

其确切代码可在 `Player#getDestroySpeed` 中查阅以供参考。

### 刻更新 {#ticking}

刻更新（ticking）是一种机制，每 1 / 20 秒（即 50 毫秒，也就是“一刻”）更新（tick）游戏的某些部分一次。方块提供了不同的刻更新方法，它们以不同的方式被调用。

#### 服务端刻更新与刻调度 {#server-ticking-and-tick-scheduling}

`BlockBehaviour#tick` 通过调度刻（scheduled ticks）调用。调度刻可通过 `Level#scheduleTick(BlockPos, Block, int)` 创建，其中 `int` 表示延迟。原版在多处使用它，例如大型垂滴叶的倾斜机制就严重依赖这一系统。其他典型的使用者还有各种红石元件。

#### 客户端刻更新 {#client-ticking}

`Block#animateTick` 仅在客户端调用，每帧一次。这是发生仅限客户端行为的地方，例如火把的粒子生成。

#### 天气刻更新 {#weather-ticking}

天气刻更新由 `Block#handlePrecipitation` 处理，独立于常规刻更新运行。它只在服务端调用，只在下某种形式的雨时调用，且有 1/16 的概率。例如在下雨或下雪时会蓄水的炼药锅就使用了它。

#### 随机刻更新 {#random-ticking}

随机刻系统独立于常规刻更新运行。随机刻必须通过调用方块 `BlockBehaviour.Properties` 上的 `BlockBehaviour.Properties#randomTicks()` 方法来启用。这会使方块加入随机刻更新机制。

随机刻每刻会对一个区块中固定数量的方块发生。该固定数量由 `randomTickSpeed` 游戏规则定义。以其默认值 3 为例，每刻都会从区块中选出 3 个随机方块。如果这些方块启用了随机刻更新，则调用它们各自的 `BlockBehaviour#randomTick` 方法。

随机刻更新被 Minecraft 中大量机制使用，例如植物生长、冰雪融化或铜的氧化。

[above]: #one-block-to-rule-them-all
[attributes]: ../entities/attributes.md
[below]: #deferredregisterblocks-helpers
[blockentities]: ../blockentities/index.md
[blockstates]: states.md
[bsfile]: ../resources/client/models/index.md#blockstate-files
[codec]: ../datastorage/codecs.md#records
[datagen]: ../resources/index.md#data-generation
[i18n]: ../resources/client/i18n.md
[item]: ../items/index.md
[leftclick]: ../items/interactions.md#left-clicking-an-item
[loottable]: ../resources/server/loottables/index.md
[model]: ../resources/client/models/index.md
[registration]: ../concepts/registries.md#methods-for-registering
[resources]: ../resources/index.md#assets
[rightclick]: ../items/interactions.md#right-clicking-an-item
[sounds]: ../resources/client/sounds.md
[tags]: ../resources/server/tags.md
[textures]: ../resources/client/textures.md
[tool]: ../items/tools.md
[usingblocks]: #using-blocks
[usingblockstates]: states.md#using-blockstates

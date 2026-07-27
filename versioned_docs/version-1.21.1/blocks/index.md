# 方块 {#blocks}

方块是 Minecraft 世界的核心。它们构成了所有地形、结构和机器。如果你有意制作 Mod，那么很可能想要添加一些方块。本页将带你了解方块的创建，以及你能对它们做的一些事情。

## 唯我独尊的方块 {#one-block-to-rule-them-all}

在开始之前，重要的是要明白：游戏中每种方块永远只有一个实例。一个世界由指向这唯一一个方块、位于不同位置的成千上万个引用组成。换句话说，同一个方块只是被显示了很多次。

因此，一个方块永远只应被实例化一次，而这发生在[注册][registration]期间。方块注册之后，你就可以按需使用这个已注册的引用。

与大多数其他注册表不同，方块可以使用 `DeferredRegister` 的一个特化版本，称为 `DeferredRegister.Blocks`。 `DeferredRegister.Blocks` 基本上与 `DeferredRegister<Block>` 一样，但有一些细微差别：

- 它们通过 `DeferredRegister.createBlocks("yourmodid")` 创建，而不是常规的 `DeferredRegister.create(...)` 方法。
- `#register` 返回一个 `DeferredBlock<T extends Block>`，它继承自 `DeferredHolder<Block, T>`。 `T` 是我们要注册的方块的类的类型。
- 还有一些用于注册方块的辅助方法。详见[下文][below]。

那么现在，让我们来注册方块：

```java
//BLOCKS is a DeferredRegister.Blocks
public static final DeferredBlock<Block> MY_BLOCK = BLOCKS.register("my_block", () -> new Block(...));
```

注册方块之后，所有对新 `my_block` 的引用都应使用这个常量。例如，如果你想检查某个位置的方块是否为 `my_block`，代码大致会是这样：

```java
level.getBlockState(position) // returns the blockstate placed in the given level (world) at the given position
        //highlight-next-line
        .is(MyBlockRegistrationClass.MY_BLOCK);
```

这种做法还有一个便利的效果：`block1 == block2` 是可行的，可以代替 Java 的 `equals` 方法（当然用 `equals` 也可以，但没有意义，因为它本来就是按引用比较的）。

:::danger
不要在注册之外调用 `new Block()`！一旦这么做，各种问题就可能、而且必然会出现：

- 方块必须在注册表未冻结时创建。 NeoForge 会为你解冻注册表，稍后再冻结它们，因此注册期间就是你创建方块的时间窗口。
- 如果你在注册表再次冻结之后试图创建和/或注册方块，游戏会崩溃并报告一个 `null` 方块，这可能会非常令人困惑。
- 即便你设法保留了一个游离的方块实例，游戏在同步和保存时也不会识别它，并会用空气将其替换。
:::

## 创建方块 {#creating-blocks}

如前所述，我们从创建 `DeferredRegister.Blocks` 开始：

```java
public static final DeferredRegister.Blocks BLOCKS = DeferredRegister.createBlocks("yourmodid");
```

### 基本方块 {#basic-blocks}

对于无需特殊功能的简单方块（想想圆石、木板等），可以直接使用 `Block` 类。为此，在注册期间用一个 `BlockBehaviour.Properties` 参数实例化 `Block`。这个 `BlockBehaviour.Properties` 参数可以通过 `BlockBehaviour.Properties#of` 创建，并可通过调用其方法进行定制。其中最重要的方法有：

- `destroyTime` —— 决定破坏该方块所需的时间。
    - 石头的破坏时间为 1.5，泥土为 0.5，黑曜石为 50，基岩为 -1（无法破坏）。
- `explosionResistance` —— 决定该方块的爆炸抗性。
    - 石头的爆炸抗性为 6.0，泥土为 0.5，黑曜石为 1,200，基岩为 3,600,000。
- `sound` —— 设置方块被击打、破坏或放置时发出的声音。
    - 默认值为 `SoundType.STONE`。更多细节参见[声音页面][sounds]。
- `lightLevel` —— 设置方块的发光等级。接受一个带 `BlockState` 参数、返回 0 到 15 之间值的函数。
    - 例如，荧石使用 `state -> 15`，火把使用 `state -> 14`。
- `friction` —— 设置方块的摩擦力（滑度）。
    - 默认值为 0.6。冰使用 0.98。

举例来说，一个简单的实现大致如下：

```java
//BLOCKS is a DeferredRegister.Blocks
public static final DeferredBlock<Block> MY_BETTER_BLOCK = BLOCKS.register(
        "my_better_block", 
        () -> new Block(BlockBehaviour.Properties.of()
                //highlight-start
                .destroyTime(2.0f)
                .explosionResistance(10.0f)
                .sound(SoundType.GRAVEL)
                .lightLevel(state -> 7)
                //highlight-end
        ));
```

如需进一步的文档，请参阅 `BlockBehaviour.Properties` 的源代码。如需更多示例，或查看 Minecraft 使用的取值，请参阅 `Blocks` 类。

:::note
重要的是要明白，世界中的方块和物品栏中的方块并不是一回事。物品栏中看起来像方块的东西实际上是 `BlockItem`，一种在使用时放置方块的特殊[物品][item]。这也意味着创造模式物品栏分类、最大堆叠数量之类的属性是由对应的 `BlockItem` 处理的。

`BlockItem` 必须与方块分开注册。这是因为方块不一定需要物品，例如当它并非用于被收集时（火就是这种情况）。
:::

### 更多功能 {#more-functionality}

直接使用 `Block` 只能实现非常基本的方块。如果你想添加功能，比如玩家交互或不同的碰撞箱，就需要一个继承 `Block` 的自定义类。 `Block` 类有许多可以重写以实现不同功能的方法；更多信息参见 `Block`、 `BlockBehaviour` 和 `IBlockExtension` 这几个类。也可参见下文的[使用方块][usingblocks]章节，了解方块最常见的一些用例。

如果你想制作一个具有不同变体的方块（想想台阶，它有底部、顶部和双层变体），你应当使用[方块状态][blockstates]。最后，如果你想要一个存储额外数据的方块（想想存储物品栏的箱子），则应使用[方块实体][blockentities]。这里的经验法则是：如果你有有限且相当小的状态数量（最多几百个状态），使用方块状态；如果你有无限或近乎无限的状态数量，使用方块实体。

#### 方块类型 {#block-types}

方块类型是用于序列化和反序列化方块对象的 [`MapCodec`][codec]。这个 `MapCodec` 通过 `BlockBehaviour#codec` 设置，并[注册][registration]到方块类型注册表。目前，它唯一的用途是在生成方块列表报告时。每个 `Block` 的子类都应创建一个方块类型。例如，`FlowerBlock#CODEC` 代表大多数花的方块类型，而它的子类 `WitherRoseBlock` 则有单独的方块类型。

如果方块子类只接收 `BlockBehaviour.Properties`，那么可以用 `BlockBehaviour#simpleCodec` 来创建 `MapCodec`。

```java
// For some block subclass
public class SimpleBlock extends Block {

    public SimpleBlock(BlockBehavior.Properties properties) {
        // ...
    }

    @Override
    public MapCodec<SimpleBlock> codec() {
        return SIMPLE_CODEC.value();
    }
}

// In some registration class
public static final DeferredRegister<MapCodec<? extends Block>> REGISTRAR = DeferredRegister.create(BuiltInRegistries.BLOCK_TYPE, "yourmodid");

public static final DeferredHolder<MapCodec<? extends Block>, MapCodec<SimpleBlock>> SIMPLE_CODEC = REGISTRAR.register(
    "simple",
    () -> simpleCodec(SimpleBlock::new)
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
        return COMPLEX_CODEC.value();
    }

    public int getValue() {
        return this.value;
    }
}

// In some registration class
public static final DeferredRegister<MapCodec<? extends Block>> REGISTRAR = DeferredRegister.create(BuiltInRegistries.BLOCK_TYPE, "yourmodid");

public static final DeferredHolder<MapCodec<? extends Block>, MapCodec<ComplexBlock>> COMPLEX_CODEC = REGISTRAR.register(
    "simple",
    () -> RecordCodecBuilder.mapCodec(instance ->
        instance.group(
            Codec.INT.fieldOf("value").forGetter(ComplexBlock::getValue),
            BlockBehaviour.propertiesCodec() // represents the BlockBehavior.Properties parameter
        ).apply(instance, ComplexBlock::new)
    );
);
```

:::note
尽管方块类型目前基本未被使用，但随着 Mojang 继续朝以 codec 为中心的结构迈进，预计它未来会变得更加重要。
:::

### `DeferredRegister.Blocks` 辅助方法 {#deferredregisterblocks-helpers}

我们已经在[上文][above]讨论了如何创建 `DeferredRegister.Blocks`，以及它会返回 `DeferredBlock`。现在，让我们看看这个特化的 `DeferredRegister` 还提供了哪些实用工具。先从 `#registerBlock` 开始：

```java
public static final DeferredRegister.Blocks BLOCKS = DeferredRegister.createBlocks("yourmodid");

public static final DeferredBlock<Block> EXAMPLE_BLOCK = BLOCKS.registerBlock(
        "example_block",
        Block::new, // The factory that the properties will be passed into.
        BlockBehaviour.Properties.of() // The properties to use.
);
```

在内部，它会把 properties 参数应用到所提供的方块工厂（通常就是构造器）上，从而直接调用 `BLOCKS.register("example_block", () -> new Block(BlockBehaviour.Properties.of()))`。

如果你想使用 `Block::new`，可以完全省略工厂：

```java
public static final DeferredBlock<Block> EXAMPLE_BLOCK = BLOCKS.registerSimpleBlock(
        "example_block",
        BlockBehaviour.Properties.of() // The properties to use.
);
```

这与前一个示例的效果完全相同，只是稍短一些。当然，如果你想使用 `Block` 的子类而非 `Block` 本身，就得改用前面那种方法。

### 资源 {#resources}

如果你注册了方块并把它放置到世界中，你会发现它缺少纹理之类的东西。这是因为[纹理][textures]等内容由 Minecraft 的资源系统处理。在 Minecraft 中添加新方块时，你应当编写或[生成][datagen]以下文件：

- 一个[方块状态文件][bsfile]
- 一个[方块模型][model]
- 一条[翻译][i18n]
- 一个[战利品表][loottable]
- 一些方块[标签][tags]，例如用于挖掘

对于上述所有内容，也可参考相似原版方块的文件和数据生成器。

## 使用方块 {#using-blocks}

方块本身极少被直接用来做事情。事实上，整个 Minecraft 中可能最常见的两个操作——获取某位置的方块，以及在某位置设置方块——使用的都是方块状态，而非方块。总体设计思路是：由方块定义行为，但实际行为通过方块状态来运行。因此，`BlockState` 常作为参数传递给 `Block` 的方法。关于方块状态如何被使用、以及如何从方块获取方块状态的更多信息，参见[使用方块状态][usingblockstates]。

在若干场景中，`Block` 的多个方法会在不同时机被调用。以下各小节列出了最常见的方块相关流程。除非另有说明，所有方法都在两个逻辑端上调用，并且应在两端返回相同结果。

### 放置方块 {#placing-a-block}

方块放置逻辑由 `BlockItem#useOn`（或某些子类的实现，例如用于睡莲的 `PlaceOnWaterBlockItem`）调用。关于游戏如何走到这一步的更多信息，参见[交互流程][interactionpipeline]。实际上，这意味着只要右键点击了一个 `BlockItem`（例如一个圆石物品），就会调用此行为。

- 会检查若干先决条件，例如你不处于旁观模式、该方块所需的全部特性标志均已启用、目标位置不在世界边界之外。若其中至少一项检查失败，流程结束。
- 对当前位于尝试放置方块处的方块调用 `BlockBehaviour#canBeReplaced`。若返回 `false`，流程结束。此处返回 `true` 的典型情况是高草或雪层。
- 调用 `Block#getStateForPlacement`。在此处，可以根据上下文（其中包括位置、旋转以及方块被放置在哪一面等信息）返回不同的方块状态。例如，这对可以朝不同方向放置的方块很有用。
- 用上一步获得的方块状态调用 `BlockBehaviour#canSurvive`。若返回 `false`，流程结束。
- 通过一次 `Level#setBlock` 调用把方块状态设置进 level 中。
    - 在那次 `Level#setBlock` 调用中，会调用 `BlockBehaviour#onPlace`。
- 调用 `Block#setPlacedBy`。

### 破坏方块 {#breaking-a-block}

破坏方块要复杂一些，因为它需要时间。这个过程大致可分为三个阶段：“发起”、“挖掘”和“真正破坏”。

- 当点击鼠标左键时，进入“发起”阶段。
- 现在需要按住鼠标左键，进入“挖掘”阶段。**该阶段的方法每一刻都会被调用。**
- 如果“持续”阶段没有被中断（即松开鼠标左键），并且方块被破坏了，就进入“真正破坏”阶段。

或者，对于更喜欢伪代码的人：

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

以下各小节进一步把这些阶段拆解为具体的方法调用。

#### “发起”阶段 {#the-initiating-stage}

- 仅客户端：以鼠标左键和主手触发 `InputEvent.InteractionKeyMappingTriggered`。若事件被取消，流程结束。
- 会检查若干先决条件，例如你不处于旁观模式、主手中 `ItemStack` 所需的全部特性标志均已启用、目标方块不在世界边界之外。若其中至少一项检查失败，流程结束。
- 触发 `PlayerInteractEvent.LeftClickBlock`。若事件被取消，流程结束。
    - 请注意，当事件在客户端被取消时，不会向服务端发送任何网络包，因此服务端不会运行任何逻辑。
    - 然而，在服务端取消此事件仍会导致客户端代码运行，这可能引发不同步！
- 调用 `Block#attack`。

#### “挖掘”阶段 {#the-mining-stage}

- 触发 `PlayerInteractEvent.LeftClickBlock`。若事件被取消，流程进入“结束”阶段。
    - 请注意，当事件在客户端被取消时，不会向服务端发送任何网络包，因此服务端不会运行任何逻辑。
    - 然而，在服务端取消此事件仍会导致客户端代码运行，这可能引发不同步！
- 调用 `Block#getDestroyProgress`，并将其结果加到内部的破坏进度计数器上。
    - `Block#getDestroyProgress` 返回一个 0 到 1 之间的浮点值，表示每一刻破坏进度计数器应增加多少。
- 进度覆盖层（裂纹纹理）随之更新。
- 如果破坏进度大于 1.0（即已完成，即方块应被破坏），则退出“挖掘”阶段并进入“真正破坏”阶段。

#### “真正破坏”阶段 {#the-actually-breaking-stage}

- 调用 `Item#canAttackBlock`。若返回 `false`（判定该方块不应被破坏），流程进入“结束”阶段。
- 如果方块是 `GameMasterBlock` 的实例，则调用 `Player#canUseGameMasterBlocks`。这决定玩家是否有权破坏仅创造模式方块。若为 `false`，流程进入“结束”阶段。
- 仅服务端：调用 `Player#blockActionRestricted`。这决定当前玩家是否无法破坏该方块。若为 `true`，流程进入“结束”阶段。
- 仅服务端：触发 `BlockEvent.BreakEvent`。若被取消或 `getExpToDrop` 返回 -1，流程进入“结束”阶段。其初始的取消状态由上述三个方法决定。
    - 仅服务端：触发 `PlayerEvent.HarvestCheck`。若 `HarvestCheck#canHarvest` 返回 `false`，或传入破坏事件的 `BlockState` 为 null，则该事件的初始经验值为 0。
    - 仅服务端：若 `PlayerEvent.HarvestCheck#canHarvest` 返回 `true`，则调用 `IBlockExtension#getExpDrop`。该值被传给 `BlockEvent.BreakEvent#getExpToDrop`，供流程后续使用。
- 仅服务端：调用 `IBlockExtension#canHarvestBlock`。这决定该方块是否能被采集，即破坏后是否掉落物品。
- 调用 `IBlockExtension#onDestroyedByPlayer`。若返回 `false`，流程进入“结束”阶段。在那次 `IBlockExtension#onDestroyedByPlayer` 调用中：
    - 调用 `Block#playerWillDestroy`。
    - 通过一次以 `Blocks.AIR.defaultBlockState()` 作为方块状态参数的 `Level#setBlock` 调用，把方块状态从 level 中移除。
        - 在那次 `Level#setBlock` 调用中，会调用 `Block#onRemove`。
- 调用 `Block#destroy`。
- 仅服务端：如果前面对 `IBlockExtension#canHarvestBlock` 的调用返回了 `true`，则调用 `Block#playerDestroy`。
    - 仅服务端：调用 `Block#dropResources`。这决定该方块被挖掘时会掉落什么。
        - 仅服务端：触发 `BlockDropsEvent`。若事件被取消，则方块破坏时不掉落任何东西。否则，`BlockDropsEvent#getDrops` 中的每一个 `ItemEntity` 都会被添加到当前 level。
- 仅服务端：如果前面对 `IBlockExtension#getExpDrop` 的调用返回了大于 0 的值，则以该结果调用 `Block#popExperience`。

### 计时 {#ticking}

计时（ticking）是一种每 1/20 秒（即 50 毫秒，“一刻”）就更新（计时）游戏各个部分的机制。方块提供了不同的计时方法，它们以不同方式被调用。

#### 服务端计时与计时调度 {#server-ticking-and-tick-scheduling}

`BlockBehaviour#tick` 通过调度的计时被调用。调度的计时可以通过 `Level#scheduleTick(BlockPos, Block, int)` 创建，其中 `int` 表示延迟。原版在多处使用它，例如，大型垂滴叶的倾斜机制就严重依赖此系统。其他典型使用者是各种红石组件。

#### 客户端计时 {#client-ticking}

`Block#animateTick` 仅在客户端调用，每帧一次。这里是客户端专属行为发生的地方，例如火把粒子的生成。

#### 天气计时 {#weather-ticking}

天气计时由 `Block#handlePrecipitation` 处理，独立于常规计时运行。它仅在服务端调用，且仅在某种形式的降雨时，以 1/16 的概率触发。例如，在雨或雪中会被填满的炼药锅就使用了它。

#### 随机计时 {#random-ticking}

随机计时系统独立于常规计时运行。必须通过方块的 `BlockBehaviour.Properties` 调用 `BlockBehaviour.Properties#randomTicks()` 方法来启用随机计时。这会使该方块成为随机计时机制的一部分。

随机计时每一刻在一个区块中对一定数量的方块发生。该数量由 `randomTickSpeed` 游戏规则定义。以其默认值 3 为例，每一刻从区块中选出 3 个随机方块。如果这些方块启用了随机计时，则会调用它们各自的 `BlockBehaviour#randomTick` 方法。

随机计时被 Minecraft 中广泛的机制所使用，例如植物生长、冰雪融化，或铜的氧化。

[above]: #one-block-to-rule-them-all
[below]: #deferredregisterblocks-helpers
[blockentities]: ../blockentities/index.md
[blockstates]: states.md
[bsfile]: ../resources/client/models/index.md#blockstate-files
[codec]: ../datastorage/codecs.md#records
[datagen]: ../resources/index.md#data-generation
[events]: ../concepts/events.md
[i18n]: ../resources/client/i18n.md
[interactionpipeline]: ../items/interactionpipeline.md
[item]: ../items/index.md
[loottable]: ../resources/server/loottables/index.md
[model]: ../resources/client/models/index.md
[registration]: ../concepts/registries.md#methods-for-registering
[resources]: ../resources/index.md#assets
[sounds]: ../resources/client/sounds.md
[tags]: ../resources/server/tags.md
[textures]: ../resources/client/textures.md
[usingblocks]: #using-blocks
[usingblockstates]: states.md#using-blockstates

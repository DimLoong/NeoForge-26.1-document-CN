# 方块状态 {#blockstates}

你常常会遇到这样的情形：想让一个方块拥有不同的状态。例如，小麦作物有八个生长阶段，为每个阶段单独做一个方块感觉不太对。又或者你有一个台阶或类台阶方块——一个底部状态、一个顶部状态，以及一个两者兼有的状态。

这就是方块状态发挥作用的地方。方块状态是一种便捷的方式，用来表示一个方块可以拥有的不同状态，比如生长阶段或台阶的放置类型。

## 方块状态属性 {#blockstate-properties}

方块状态使用一套属性系统。一个方块可以拥有多个不同类型的属性。例如，末地传送门框架有两个属性：是否镶嵌了眼（`eye`，2 个选项）以及它朝向哪个方向放置（`facing`，4 个选项）。因此，末地传送门框架总共有 8（2 * 4）种不同的方块状态：

```
minecraft:end_portal_frame[facing=north,eye=false]
minecraft:end_portal_frame[facing=east,eye=false]
minecraft:end_portal_frame[facing=south,eye=false]
minecraft:end_portal_frame[facing=west,eye=false]
minecraft:end_portal_frame[facing=north,eye=true]
minecraft:end_portal_frame[facing=east,eye=true]
minecraft:end_portal_frame[facing=south,eye=true]
minecraft:end_portal_frame[facing=west,eye=true]
```

`blockid[property1=value1,property2=value,...]` 这种记法是以文本形式表示方块状态的标准方式，原版在某些地方会用到它，例如在命令中。

如果你的方块没有定义任何方块状态属性，它仍然恰好拥有一个方块状态——即没有任何属性的那个，因为没有属性可指定。这可以记作 `minecraft:oak_planks[]`，或简单记作 `minecraft:oak_planks`。

与方块一样，每个 `BlockState` 在内存中都恰好只存在一个。这意味着可以且应当使用 `==` 来比较 `BlockState`。`BlockState` 还是一个 final 类，意味着它不能被继承。**任何功能都要写在对应的 [Block][block] 类中！**

## 何时使用方块状态 {#when-to-use-blockstates}

### 方块状态 vs. 独立方块 {#blockstates-vs-separate-blocks}

一条好的经验法则是：**如果它有不同的名字，就应该做成独立的方块**。举个例子，制作椅子方块：椅子的朝向应当是一个属性，而不同的木材类型则应拆分为不同的方块。所以你会为每种木材类型准备一个椅子方块，而每个椅子方块有四个方块状态（每个朝向一个）。

### 方块状态 vs. [方块实体][blockentity] {#blockstates-vs-block-entities}

这里的经验法则是：**如果状态数量有限，就用方块状态；如果状态数量无限或近乎无限，就用方块实体。** 方块实体可以存储任意数量的数据，但比方块状态慢。

方块状态和方块实体可以配合使用。例如，箱子用方块状态属性来表示朝向、是否含水、是否变为大型箱子等，而存储物品栏、当前是否处于打开状态、或与漏斗的交互，则由一个方块实体处理。

对于“多少个状态对方块状态来说算太多？”这个问题，没有确定的答案，但我们建议：如果你需要超过 8-9 位的数据（即超过几百个状态），就应改用方块实体。

## 实现方块状态 {#implementing-blockstates}

要实现一个方块状态属性，在你的方块类中创建或引用一个 `public static final Property<?>` 常量。虽然你可以自由地编写自己的 `Property<?>` 实现，但原版代码提供了几个便利的实现，应能覆盖大多数用例：

- `IntegerProperty`
    - 实现 `Property<Integer>`。定义一个持有整数值的属性。注意不支持负值。
    - 通过调用 `IntegerProperty#create(String name, int min, int max)` 创建。
- `BooleanProperty`
    - 实现 `Property<Boolean>`。定义一个持有 `true` 或 `false` 值的属性。
    - 通过调用 `BooleanProperty#create(String name)` 创建。
- `EnumProperty<E extends Enum<E>>`
    - 实现 `Property<E>`。定义一个可以取某个枚举类各值的属性。
    - 通过调用 `EnumProperty#create(String name, Class<E> enumClass)` 创建。
    - 也可以只使用枚举值的一个子集（例如 16 种 `DyeColor` 中的 4 种），参见 `EnumProperty#create` 的重载。

`BlockStateProperties` 类包含了共享的原版属性，应尽可能使用或引用它们，而不是创建自己的属性。

有了属性常量之后，在你的方块类中重写 `Block#createBlockStateDefinition(StateDefinition.Builder)`。在该方法中，调用 `StateDefinition.Builder#add(YOUR_PROPERTY);`。`StateDefinition.Builder#add` 带有一个可变参数，因此如果你有多个属性，可以一次性把它们全部添加进去。

每个方块还会有一个默认状态。如果没有另行指定，默认状态会使用每个属性的默认值。你可以在构造函数中调用 `Block#registerDefaultState(BlockState)` 方法来更改默认状态。

如果你希望更改放置方块时使用的 `BlockState`，可重写 `Block#getStateForPlacement(BlockPlaceContext)`。这可以用来，例如，根据玩家放置方块时所站或所看的方向来设置方块的朝向。

为进一步说明，下面是 `EndPortalFrameBlock` 类中相关部分的样子：

```java
public class EndPortalFrameBlock extends Block {
    // Note: It is possible to directly use the values in BlockStateProperties instead of referencing them here again.
    // However, for the sake of simplicity and readability, it is recommended to add constants like this.
    public static final EnumProperty<Direction> FACING = BlockStateProperties.FACING;
    public static final BooleanProperty EYE = BlockStateProperties.EYE;

    public EndPortalFrameBlock(BlockBehaviour.Properties properties) {
        super(properties);
        // stateDefinition.any() returns a random BlockState from an internal set,
        // we don't care because we're setting all values ourselves anyway
        this.registerDefaultState(stateDefinition.any()
                .setValue(FACING, Direction.NORTH)
                .setValue(EYE, false)
        );
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
        // this is where the properties are actually added to the state
        builder.add(FACING, EYE);
    }

    @Override
    @Nullable
    public BlockState getStateForPlacement(BlockPlaceContext ctx) {
        // code that determines which state will be used when
        // placing down this block, depending on the BlockPlaceContext
    }
}
```

## 使用方块状态 {#using-blockstates}

要从 `Block` 得到 `BlockState`，调用 `Block#defaultBlockState()`。如上所述，默认方块状态可通过 `Block#registerDefaultState` 更改。

你可以通过调用 `BlockState#getValue(Property<?>)` 获取某个属性的值，向它传入你想获取值的那个属性。沿用我们的末地传送门框架示例，代码大致如下：

```java
// EndPortalFrameBlock.FACING is an EnumPropery<Direction> and thus can be used to obtain a Direction from the BlockState
Direction direction = endPortalFrameBlockState.getValue(EndPortalFrameBlock.FACING);
```

如果你想获取一个具有不同取值组合的 `BlockState`，只需在一个现有的方块状态上调用 `BlockState#setValue(Property<T>, T)`，传入属性及其值。就我们的拉杆而言，代码大致如下：

```java
endPortalFrameBlockState = endPortalFrameBlockState.setValue(EndPortalFrameBlock.FACING, Direction.SOUTH);
```

:::note
`BlockState` 是不可变的。这意味着当你调用 `#setValue(Property<T>, T)` 时，你实际上并没有修改这个方块状态。相反，内部会进行一次查找，然后把你请求的那个方块状态对象交给你，也就是那个拥有这些确切属性值、唯一存在的对象。这也意味着仅调用 `state#setValue` 而不将其保存到变量中（例如保存回 `state`）不会有任何效果。
:::

要从世界中获取 `BlockState`，使用 `Level#getBlockState(BlockPos)`。

### `Level#setBlock` {#levelsetblock}

要在世界中设置 `BlockState`，使用 `Level#setBlock(BlockPos, BlockState, int)`。

`int` 参数值得额外说明一下，因为它的含义不是一目了然的。它表示所谓的更新标志（update flags）。

为帮助正确设置更新标志，`Block` 中有若干以 `UPDATE_` 为前缀的 `int` 常量。如果你想组合它们，这些常量可以按位或运算（例如 `Block.UPDATE_NEIGHBORS | Block.UPDATE_CLIENTS`）。

- `Block.UPDATE_NEIGHBORS` 向相邻方块发送更新。更具体地说，它会调用 `Block#neighborChanged`，后者又会调用若干方法，其中大多都以某种方式与红石相关。
- `Block.UPDATE_CLIENTS` 将方块更新同步到客户端。
- `Block.UPDATE_INVISIBLE` 明确地不在客户端更新。它还会覆盖 `Block.UPDATE_CLIENTS`，导致更新不被同步。方块在服务端始终会更新。
- `Block.UPDATE_IMMEDIATE` 强制在客户端主线程上重新渲染。
- `Block.UPDATE_KNOWN_SHAPE` 停止相邻更新的递归。
- `Block.UPDATE_SUPPRESS_DROPS` 禁用该位置旧方块的掉落物。
- `Block.UPDATE_MOVE_BY_PISTON` 仅由活塞代码使用，用于表明方块是被活塞移动的。它主要负责延迟光照引擎的更新。
- `Block.UPDATE_SKIP_SHAPE_UPDATE_ON_WIRE` 由 `ExperimentalRedstoneWireEvaluator` 使用，用于表明是否应跳过形状更新。仅当充能强度的改变并非源自放置，或信号的原始来源并非当前红石线时，才会设置此标志。
- `Block.UPDATE_SKIP_BLOCK_ENTITY_SIDEEFFECTS` 阻止 `BlockEntity#preRemoveSideEffects` 被调用。这通常会阻止方块实体清空其内容。
- `Block.UPDATE_SKIP_ON_PLACE` 阻止 `Block#onPlace` 被调用。这通常会阻止任何方块处理其初始行为（例如更新铁轨以连接到其他方块、生成铁傀儡）。
- `Block.UPDATE_NONE` 是 `Block.UPDATE_INVISIBLE | Block.UPDATE_SKIP_BLOCK_ENTITY_SIDEEFFECTS` 的别名。
- `Block.UPDATE_ALL` 是 `Block.UPDATE_NEIGHBORS | Block.UPDATE_CLIENTS` 的别名。
- `Block.UPDATE_ALL_IMMEDIATE` 是 `Block.UPDATE_NEIGHBORS | Block.UPDATE_CLIENTS | Block.UPDATE_IMMEDIATE` 的别名。
- `Block.UPDATE_SKIP_ALL_SIDEEFFECTS` 是 `Block.UPDATE_SKIP_ON_PLACE | Block.UPDATE_SKIP_BLOCK_ENTITY_SIDEEFFECTS | Block.UPDATE_SUPPRESS_DROPS | Block.UPDATE_KNOWN_SHAPE` 的别名。

此外还有一个便利方法 `Level#setBlockAndUpdate(BlockPos pos, BlockState state)`，它在内部调用 `setBlock(pos, state, Block.UPDATE_ALL)`。

[block]: index.md
[blockentity]: ../blockentities/index.md

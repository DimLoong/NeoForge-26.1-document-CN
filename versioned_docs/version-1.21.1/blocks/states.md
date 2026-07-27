# 方块状态 {#blockstates}

通常，你会发现自己需要一个方块的不同状态。例如，小麦作物有八个生长阶段，为每个阶段制作单独的方块感觉是错误的。或者你有一个台阶或类似台阶的方块 - 一种底部状态，一种顶部状态，以及一种同时具有这两种状态的状态。

这就是方块状态发挥作用的地方。方块状态是表示方块可以具有的不同状态的简单方法，例如生长阶段或板放置类型。

## 方块状态属性 {#blockstate-properties}

方块状态使用属性系统。一个方块可以具有多种类型的多个属性。例如，末地传送门框架有两个属性：是否有眼睛（`eye`，2 个选项）以及放置的方向（`facing`，4 个选项）。因此，最终传送门框架总共有 8 (2 * 4) 个不同的方块状态：

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

符号 `blockid[property1=value1,property2=value,...]` 是以文本形式表示方块状态的标准化方式，并在原版中的某些位置使用，例如在命令中。

如果你的方块没有定义任何方块状态属性，它仍然只有一个方块状态 - 即没有任何属性的方块状态，因为没有要指定的属性。这可以表示为 `minecraft:oak_planks[]` 或简称为 `minecraft:oak_planks`。

与方块一样，每个 `BlockState` 在内存中只存在一次。这意味着 `==` 可以而且应该用于比较 `BlockState`。 `BlockState` 也是最终类，这意味着它无法扩展。 **任何功能都应实现在相应的[Block][block]类中！**

## 何时使用方块状态 {#when-to-use-blockstates}

### 方块状态与单独方块 {#blockstates-vs-separate-blocks}

一个好的经验法则是：**如果它有不同的名称，它应该是一个单独的方块**。一个例子是制作椅子方块：椅子的方向应该是一个属性，而不同类型的木材应该分成不同的方块。因此，每种木材类型都有一个椅子方块，每个椅子方块有四个方块状态（每个方向一个）。

### 方块状态与[方块实体][blockentity] {#blockstates-vs-block-entities}

在这里，经验法则是：**如果你有有限数量的状态，请使用方块状态，如果你有无限或接近无限数量的状态，请使用方块实体。**方块实体可以存储任意数量的数据，但比方块状态慢。

方块状态和方块实体可以相互结合使用。例如，箱子使用方块状态属性来表示方向，无论是否浸水，或者成为双箱子，同时存储库存，无论当前是否打开，或者与料斗的交互都由方块实体处理。

对于“多少个状态对于方块状态来说太多？”这个问题没有明确的答案，但我们建议如果你需要超过 8-9 位的数据（即超过几百个状态），你应该使用方块实体。

## 实现方块状态 {#implementing-blockstates}

要实现方块状态属性，请在方块类中创建或引用 `public static final Property<?>` 常量。虽然你可以自由地制作自己的 `Property<?>` 实现，但原版代码提供了几种方便的实现，应该涵盖大多数用例：

- `IntegerProperty`
    - 实现 `Property<Integer>`。定义保存整数值的属性。请注意，不支持负值。
    - 通过调用 `IntegerProperty#create(String propertyName, int minimum, int maximum)` 创建。
- `BooleanProperty`
    - 实现 `Property<Boolean>`。定义保存 `true` 或 `false` 值的属性。
    - 通过调用 `BooleanProperty#create(String propertyName)` 创建。
- `EnumProperty<E extends Enum<E>>`
    - 实现 `Property<E>`。定义一个可以采用 Enum 类值的属性。
    - 通过调用 `EnumProperty#create(String propertyName, Class<E> enumClass)` 创建。
    - 也可以仅使用枚举值的子集（例如 16 个 `DyeColor` 中的 4 个），请参阅 `EnumProperty#create` 的重载。
- `DirectionProperty`
    - 扩展 `EnumProperty<Direction>`。定义可采用 `Direction` 的属性。
    - 通过调用 `DirectionProperty#create(String propertyName)` 创建。
    - 提供了几个方便的谓词。例如，要获取表示基本方向的属性，请调用 `DirectionProperty.create("<name>", Direction.Plane.HORIZONTAL)`；获取 X 方向，`DirectionProperty.create("<name>", Direction.Axis.X)`。

类 `BlockStateProperties` 包含共享的原版属性，应尽可能使用或引用这些属性，而不是创建自己的属性。

获得属性常量后，覆盖方块类中的 `Block#createBlockStateDefinition(StateDefinition$Builder)`。在该方法中，调用 `StateDefinition.Builder#add(YOUR_PROPERTY);`。 `StateDefinition.Builder#add` 有一个 vararg 参数，因此如果你有多个属性，你可以一次性添加它们。

每个方块还将有一个默认状态。如果未指定任何其他内容，则默认状态将使用每个属性的默认值。你可以通过从构造函数调用 `Block#registerDefaultState(BlockState)` 方法来更改默认状态。

如果你希望在放置方块时更改使用哪个 `BlockState`，请覆盖 `Block#getStateForPlacement(BlockPlaceContext)`。例如，这可用于根据玩家放置方块时站立或观察的位置来设置方块的方向。

为了进一步说明这一点，`EndPortalFrameBlock` 类的相关位如下所示：

```java
public class EndPortalFrameBlock extends Block {
    // Note: It is possible to directly use the values in BlockStateProperties instead of referencing them here again.
    // However, for the sake of simplicity and readability, it is recommended to add constants like this.
    public static final DirectionProperty FACING = BlockStateProperties.FACING;
    public static final BooleanProperty EYE = BlockStateProperties.EYE;

    public EndPortalFrameBlock(BlockBehaviour.Properties pProperties) {
        super(pProperties);
        // stateDefinition.any() returns a random BlockState from an internal set,
        // we don't care because we're setting all values ourselves anyway
        registerDefaultState(stateDefinition.any()
                .setValue(FACING, Direction.NORTH)
                .setValue(EYE, false)
        );
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> pBuilder) {
        // this is where the properties are actually added to the state
        pBuilder.add(FACING, EYE);
    }

    @Override
    @Nullable
    public BlockState getStateForPlacement(BlockPlaceContext pContext) {
        // code that determines which state will be used when
        // placing down this block, depending on the BlockPlaceContext
    }
}
```

## 使用方块状态 {#using-blockstates}

要从 `Block` 转到 `BlockState`，请调用 `Block#defaultBlockState()`。如上所述，可以通过 `Block#registerDefaultState` 更改默认方块状态。

你可以通过调用 `BlockState#getValue(Property<?>)` 并将你想要获取值的属性传递给它来获取属性的值。重用我们的最终传送门框架示例，它看起来像这样：

```java
// EndPortalFrameBlock.FACING is a DirectionProperty and thus can be used to obtain a Direction from the BlockState
Direction direction = endPortalFrameBlockState.getValue(EndPortalFrameBlock.FACING);
```

如果你想获得具有不同值集的 `BlockState`，只需在现有方块状态上使用该属性及其值调用 `BlockState#setValue(Property<T>, T)` 即可。使用我们的杠杆，事情是这样的：

```java
endPortalFrameBlockState = endPortalFrameBlockState.setValue(EndPortalFrameBlock.FACING, Direction.SOUTH);
```

:::note
`BlockState` 是不可变的。这意味着当你调用 `#setValue(Property<T>, T)` 时，你实际上并没有修改方块状态。相反，查找是在内部执行的，并且你会获得你请求的方块状态对象，这是唯一一个具有这些确切属性值的对象。这也意味着仅调用 `state#setValue` 而不将其保存到变量中（例如返回到 `state` 中）不会执行任何操作。
:::

要从关卡中获取 `BlockState`，请使用 `Level#getBlockState(BlockPos)`。

### `Level#setBlock` {#levelsetblock}

要在关卡中设置 `BlockState`，请使用 `Level#setBlock(BlockPos, BlockState, int)`。

`int` 参数值得一些额外的解释，因为它的含义并不是立即显而易见的。它表示所谓的更新标志。

为了帮助正确设置更新标志，`Block` 中有许多 `int` 常量，前缀为 `UPDATE_`。如果你希望将这些常量组合起来，可以将它们按位或运算在一起（例如 `Block.UPDATE_NEIGHBORS | Block.UPDATE_CLIENTS`）。

- `Block.UPDATE_NEIGHBORS` 向相邻方块发送更新。更具体地说，它调用 `Block#neighborChanged`，它调用了许多方法，其中大多数在某种程度上与红石相关。
- `Block.UPDATE_CLIENTS` 将区块更新同步到客户端。
- `Block.UPDATE_INVISIBLE` 明确不在客户端上更新。这也推翻了 `Block.UPDATE_CLIENTS`，导致更新不同步。该方块始终在服务器上更新。
- `Block.UPDATE_IMMEDIATE` 强制在客户端主线程上重新渲染。
- `Block.UPDATE_KNOWN_SHAPE` 停止邻居更新递归。
- `Block.UPDATE_SUPPRESS_DROPS` 禁用该位置旧方块的方块掉落。
- `Block.UPDATE_MOVE_BY_PISTON` 仅由活塞代码使用来表示方块已被活塞移动。这主要是造成光引擎更新延迟的原因。
- `Block.UPDATE_ALL` 是 `Block.UPDATE_NEIGHBORS | Block.UPDATE_CLIENTS` 的别名。
- `Block.UPDATE_ALL_IMMEDIATE` 是 `Block.UPDATE_NEIGHBORS | Block.UPDATE_CLIENTS | Block.UPDATE_IMMEDIATE` 的别名。
- `Block.NONE` 是 `Block.UPDATE_INVISIBLE` 的别名。

还有一个方便的方法 `Level#setBlockAndUpdate(BlockPos pos, BlockState state)` 在内部调用 `setBlock(pos, state, Block.UPDATE_ALL)`。

[block]: index.md
[blockentity]: ../blockentities/index.md

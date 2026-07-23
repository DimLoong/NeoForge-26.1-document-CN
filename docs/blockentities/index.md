# 方块实体 {#block-entities}

在[方块状态][blockstate]不适用的情况下，方块实体允许在[方块][block]上存储数据。对于选项数量非有限的数据（例如物品栏）尤其如此。方块实体是静止的，且绑定于某个方块，但除此之外与[实体][entities]有许多相似之处，其名称由此而来。

:::note
如果你的方块可能的状态数量有限且相当少（最多几百个），或许应该考虑改用[方块状态][blockstate]。
:::

## 创建并注册方块实体 {#creating-and-registering-block-entities}

与实体类似、而与方块不同的是，`BlockEntity` 类代表的是方块实体实例，而非[注册的][registration]单例对象。单例改由 `BlockEntityType<?>` 类来表达。我们需要两者才能创建一个新的方块实体。

先从创建方块实体类开始：

```java
public class MyBlockEntity extends BlockEntity {
    public MyBlockEntity(BlockPos pos, BlockState state) {
        super(type, pos, state);
    }
}
```

你可能已经注意到，我们向 super 构造函数传入了一个未定义的变量 `type`。先把那个未定义的变量搁在那里，转而去处理注册。

[注册][registration]的方式与实体类似。我们创建关联的单例类 `BlockEntityType<?>` 的一个实例，并将其注册到方块实体类型注册表，如下所示：

```java
public static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITY_TYPES =
        DeferredRegister.create(Registries.BLOCK_ENTITY_TYPE, ExampleMod.MOD_ID);

public static final Supplier<BlockEntityType<MyBlockEntity>> MY_BLOCK_ENTITY = BLOCK_ENTITY_TYPES.register(
        "my_block_entity",
        // The block entity type.
        () -> new BlockEntityType<>(
                // The supplier to use for constructing the block entity instances.
                MyBlockEntity::new,
                // An optional value that, when true, only allows players with OP permissions
                // to load NBT data (e.g. placing a block item)
                false,
                // A vararg of blocks that can have this block entity.
                // This assumes the existence of the referenced blocks as DeferredBlock<Block>s.
                MyBlocks.MY_BLOCK_1.get(), MyBlocks.MY_BLOCK_2.get()
        )
);
```

:::note
请记住，`DeferredRegister` 必须注册到 [mod 事件总线][modbus]！
:::

现在有了方块实体类型，我们就可以用它来替代先前留下的 `type` 变量了：

```java
public class MyBlockEntity extends BlockEntity {
    public MyBlockEntity(BlockPos pos, BlockState state) {
        super(MY_BLOCK_ENTITY.get(), pos, state);
    }
}
```

:::info
之所以采用这套颇为费解的设置流程，是因为 `BlockEntityType` 需要一个 `BlockEntityType.BlockEntitySupplier<T extends BlockEntity>`，它基本上就是一个 `BiFunction<BlockPos, BlockState, T extends BlockEntity>`。因此，有一个可以用 `::new` 直接引用的构造函数会非常有益。然而，我们又需要把构造好的方块实体类型提供给 `BlockEntity` 的默认且唯一的构造函数，所以得来回传递一些引用。
:::

最后，我们需要修改与方块实体关联的方块类。这意味着我们无法把方块实体附加到简单的 `Block` 实例上，而是需要一个子类：

```java
// The important part is implementing the EntityBlock interface and overriding the #newBlockEntity method.
public class MyEntityBlock extends Block implements EntityBlock {
    // Constructor deferring to super.
    public MyEntityBlock(BlockBehaviour.Properties properties) {
        super(properties);
    }

    // Return a new instance of our block entity here.
    @Override
    public BlockEntity newBlockEntity(BlockPos pos, BlockState state) {
        return new MyBlockEntity(pos, state);
    }
}
```

然后，你当然需要在[方块注册][blockreg]中把这个类用作类型：

```java
public static final DeferredBlock<MyEntityBlock> MY_BLOCK_1 =
        BLOCKS.register("my_block_1", () -> new MyEntityBlock( /* ... */ ));
public static final DeferredBlock<MyEntityBlock> MY_BLOCK_2 =
        BLOCKS.register("my_block_2", () -> new MyEntityBlock( /* ... */ ));
```

## 存储数据 {#storing-data}

`BlockEntity` 的主要用途之一是存储数据。方块实体上的数据存储可以通过两种方式进行：读写[值 I/O][valueio]，或使用[数据附加][dataattachments]。本节将介绍值 I/O 的读写；关于数据附加，请参阅所链接的文章。

:::info
数据附加的主要用途，正如其名所示，是把数据附加到已有的方块实体上，例如原版或其他 Mod 提供的那些方块实体。对于你自己 Mod 的方块实体，更推荐直接读写值 I/O 来保存和加载。
:::

数据可以分别通过 `#loadAdditional` 和 `#saveAdditional` 方法从[值 I/O][valueio]读取和写入。这些方法会在方块实体同步到磁盘或通过网络同步时被调用。

```java
public class MyBlockEntity extends BlockEntity {
    // This can be any value of any type you want, so long as you can somehow serialize it to the value I/O.
    // We will use an int for the sake of example.
    private int value;

    public MyBlockEntity(BlockPos pos, BlockState state) {
        super(MY_BLOCK_ENTITY.get(), pos, state);
    }

    // Read values from the passed ValueInput here.
    @Override
    public void loadAdditional(ValueInput input) {
        super.loadAdditional(input);
        // Will default to 0 if absent. See the ValueIO article for more information.
        this.value = input.getIntOr("value", 0);
    }

    // Save values into the passed ValueOutput here.
    @Override
    public void saveAdditional(ValueOutput output) {
        super.saveAdditional(output);
        output.putInt("value", this.value);
    }
}
```

在这两个方法中，务必调用 super，因为它会添加诸如位置之类的基本信息。标签名 `id`、`x`、`y`、`z`、`NeoForgeData` 和 `neoforge:attachments` 由 super 方法保留，因此你不应自行使用它们。

当然，你会想要设置其他值，而不仅仅是使用默认值。你可以像操作任何其他字段一样自由地这样做。然而，如果你希望游戏保存这些更改，就必须在之后调用 `#setChanged()`，它会把方块实体所在的区块标记为脏（= 需要被保存）。如果你不调用该方法，方块实体在保存时可能会被跳过，因为 Minecraft 的保存系统只保存已被标记为脏的区块。

### 移除方块实体 {#removing-block-entities}

有时，你可能希望方块实体在被移除时导出其存储的数据（例如，被玩家破坏时掉落其物品栏内容）。在这些情况下，逻辑应在 `BlockEntity#preRemoveSideEffects` 中处理。默认情况下，如果你的方块实体实现了 [`Container`][container]，那么它会掉落其存储的内容。

```java
public class MyBlockEntity extends BlockEntity {

    @Override
    public void preRemoveSideEffects(BlockPos pos, BlockState state) {
        super.preRemoveSideEffects(pos, state);
        // Perform any remaining export logic on removal here.
    }
}
```

:::warning
以设置了 `Block.UPDATE_SKIP_BLOCK_ENTITY_SIDEEFFECTS` 标志的方式移除的方块，不会调用此方法。使用 clone 命令时，或以严格模式放置结构时，通常就是这种情况。
:::

如果相邻方块需要得知方块实体被破坏的消息（例如，物品栏通过比较器输出红石信号），那么你的方块应重写 `BlockBehaviour#affectNeighborsAfterRemoval`。输出红石信号的方块实体通常会在这里调用 `Containers#updateNeighboursAfterDestroy`。

```java
public class MyEntityBlock extends Block implements EntityBlock {

    @Override
    protected void affectNeighborsAfterRemoval(BlockState state, ServerLevel level, BlockPos pos, boolean movedByPiston) {
        // Handle whatever logic you want to execute on the surrounding neighbors
        Containers.updateNeighboursAfterDestroy(state, level, pos);
    }
}
```

## 刻更新器 {#tickers}

方块实体另一个非常常见的用途，通常与某些存储的数据结合使用，就是刻更新。刻更新意味着每个游戏刻执行一些代码。这是通过重写 `EntityBlock#getTicker` 并返回一个 `BlockEntityTicker` 来完成的，后者基本上是一个带四个参数（世界、位置、方块状态和方块实体）的消费者，如下所示：

```java
// Note: The ticker is defined in the block, not the block entity. However, it is good practice to
// keep the ticking logic in the block entity in some way, for example by defining a static #tick method.
public class MyEntityBlock extends Block implements EntityBlock {
    // other stuff here

    // We use a second method here due to generic conversions
    // If extending `BaseEntityBlock`, this method is also available there as a protected static method
    private static <E extends BlockEntity, A extends BlockEntity> @Nullable BlockEntityTicker<A> createTickerHelper(
        BlockEntityType<A> type, BlockEntityType<E> checkedType, BlockEntityTicker<? super E> ticker
    ) {
        return checkedType == type ? (BlockEntityTicker<A>) ticker : null;
    }

    @Override
    public <T extends BlockEntity> BlockEntityTicker<T> getTicker(Level level, BlockState state, BlockEntityType<T> type) {
        // You can return different tickers here, depending on whatever factors you want. A common use case would be
        // to return different tickers on the client or server, only tick one side to begin with,
        // or only return a ticker for some blockstates (e.g. when using a "my machine is working" blockstate property).
        return createTickerHelper(type, MY_BLOCK_ENTITY.get(), MyBlockEntity::tick);
    }
}

public class MyBlockEntity extends BlockEntity {
    // other stuff here

    // The signature of this method matches the signature of the BlockEntityTicker functional interface.
    public static void tick(Level level, BlockPos pos, BlockState state, MyBlockEntity blockEntity) {
        // Whatever you want to do during ticking.
        // For example, you could change a crafting progress value or consume power here.
    }
}
```

请注意，`#tick` 方法确实是每刻都会被调用的。因此，你应尽量避免在其中进行大量复杂的计算，例如可以每 X 刻才计算一次，或缓存计算结果。

## 同步 {#syncing}

方块实体的逻辑通常在服务端运行。因此，我们需要告知客户端我们正在做什么。要做到这一点有三种方式：在区块加载时、在方块更新时，或使用自定义网络包。一般而言，你应仅在必要时才同步信息，以免不必要地堵塞网络。

### 在区块加载时同步 {#syncing-on-chunk-load}

每当从网络或磁盘读取一个区块时，该区块就会被加载（进而利用到此方法）。要在此处发送你的数据，需要重写以下方法：

```java
public class MyBlockEntity extends BlockEntity {
    // ...

    // Create an update tag here. For block entities with only a few fields, this can just call #saveWithoutMetadata.
    @Override
    public CompoundTag getUpdateTag(HolderLookup.Provider registries) {
        return this.saveWithoutMetadata(registries);
    }

    // Handle a received update tag here. The default implementation calls #loadWithComponents here,
    // so you do not need to override this method if you don't plan to do anything beyond that.
    @Override
    public void handleUpdateTag(ValueInput input) {
        super.handleUpdateTag(input);
    }
}
```

### 在方块更新时同步 {#syncing-on-block-update}

此方法在发生方块更新时使用。方块更新必须手动触发，但通常比区块同步处理得更快。

```java
public class MyBlockEntity extends BlockEntity {
    // ...

    // Create an update tag here, like above.
    @Override
    public CompoundTag getUpdateTag(HolderLookup.Provider registries) {
        return this.saveWithoutMetadata(registries);
    }

    // Return our packet here. This method returning a non-null result tells the game to use this packet for syncing.
    @Override
    public Packet<ClientGamePacketListener> getUpdatePacket() {
        // The packet uses the CompoundTag returned by #getUpdateTag. An alternative overload of #create exists
        // that allows you to specify a custom update tag, including the ability to omit data the client might not need.
        return ClientboundBlockEntityDataPacket.create(this);
    }

    // Optionally: Run some custom logic when the packet is received.
    // The super/default implementation forwards to #loadWithComponents.
    @Override
    public void onDataPacket(Connection connection, ValueInput input) {
        super.onDataPacket(connection, input);
        // Do whatever you need to do here.
    }
}
```

要真正发送这个网络包，必须在服务端通过调用 `Level#sendBlockUpdated(BlockPos pos, BlockState oldState, BlockState newState, int flags)` 触发一次更新通知。位置应为方块实体的位置，可通过 `BlockEntity#getBlockPos` 获得。两个方块状态参数都可以是方块实体所在位置的方块状态，可通过 `BlockEntity#getBlockState` 获得。最后，`flags` 参数是一个更新掩码，如 [`Level#setBlock`][setblock] 中所用。

### 使用自定义网络包 {#using-a-custom-packet}

通过使用专用的更新网络包，你可以在任何需要时自行发送网络包。这是最灵活但也最复杂的方式，因为它需要搭建一个网络处理器。你可以使用 `PacketDistrubtor#sendToPlayersTrackingChunk` 向所有正在追踪该方块实体的玩家发送网络包。更多信息请参阅[网络通信][networking]一节。

:::caution
务必做好安全检查，因为当消息到达玩家时，`BlockEntity` 可能已经被销毁/替换。你还应通过 `Level#hasChunkAt` 检查区块是否已加载。
:::

[block]: ../blocks/index.md
[blockreg]: ../blocks/index.md#basic-blocks
[blockstate]: ../blocks/states.md
[container]: ../inventories/container.md
[dataattachments]: ../datastorage/attachments.md
[entities]: ../entities/index.md
[modbus]: ../concepts/events.md#event-buses
[networking]: ../networking/index.md
[registration]: ../concepts/registries.md#methods-for-registering
[setblock]: ../blocks/states.md#levelsetblock
[valueio]: ../datastorage/valueio.md

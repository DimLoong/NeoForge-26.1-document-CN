# 方块实体 {#block-entities}

当[方块状态][blockstate]不适用时，方块实体（BlockEntity）可以在[方块][block]上存储数据。对于取值不是有限的数据（例如物品栏内容）尤其如此。方块实体是静止的，并绑定到某个方块上，但在其他方面与实体有许多相似之处，因此得名。

:::note
如果你的方块可能状态的数量是有限且相当小的（最多几百个），你或许应该考虑改用[方块状态][blockstate]。
:::

## 创建并注册方块实体 {#creating-and-registering-block-entities}

与实体类似、而与方块不同的是，`BlockEntity` 类表示的是方块实体实例，而非[已注册的][registration]单例对象。单例改由 `BlockEntityType<?>` 类来表示。要创建一个新的方块实体，两者我们都需要。

先从创建方块实体类开始：

```java
public class MyBlockEntity extends BlockEntity {
    public MyBlockEntity(BlockPos pos, BlockState state) {
        super(type, pos, state);
    }
}
```

你可能注意到，我们向父类构造器传入了一个尚未定义的变量 `type`。暂且把这个未定义的变量放在那里，先转到注册环节。

注册的方式与实体类似。我们创建关联的单例类 `BlockEntityType<?>` 的实例，并将其注册到方块实体类型注册表，如下所示：

```java
public static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITY_TYPES =
        DeferredRegister.create(Registries.BLOCK_ENTITY_TYPE, ExampleMod.MOD_ID);

public static final Supplier<BlockEntityType<MyBlockEntity>> MY_BLOCK_ENTITY = BLOCK_ENTITY_TYPES.register(
        "my_block_entity",
        // The block entity type, created using a builder.
        () -> BlockEntityType.Builder.of(
                // The supplier to use for constructing the block entity instances.
                MyBlockEntity::new,
                // A vararg of blocks that can have this block entity.
                // This assumes the existence of the referenced blocks as DeferredBlock<Block>s.
                MyBlocks.MY_BLOCK_1.get(), MyBlocks.MY_BLOCK_2.get()
        )
        // Build using null; 原版 does some datafixer shenanigans with the parameter that we don't need.
        .build(null)
);
```

现在有了方块实体类型，我们就可以用它替换前面留下的 `type` 变量：

```java
public class MyBlockEntity extends BlockEntity {
    public MyBlockEntity(BlockPos pos, BlockState state) {
        super(MY_BLOCK_ENTITY.get(), pos, state);
    }
}
```

:::info
这个略显绕的设置流程之所以如此，是因为 `BlockEntityType.Builder#of` 期望一个 `BlockEntityType.BlockEntitySupplier<T extends BlockEntity>`，它本质上就是一个 `BiFunction<BlockPos, BlockState, T extends BlockEntity>`。因此，拥有一个可以直接用 `::new` 引用的构造器非常有利。然而，我们同时又需要把构造好的方块实体类型提供给 `BlockEntity` 的默认（也是唯一）构造器，所以需要在几处之间来回传递引用。
:::

最后，我们需要修改与方块实体关联的方块类。这意味着我们无法把方块实体附加到普通的 `Block` 实例上，而是需要一个子类：

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

当然，随后你需要在方块注册中把这个类用作类型：

```java
public static final DeferredBlock<MyEntityBlock> MY_BLOCK_1 =
        BLOCKS.register("my_block_1", () -> new MyEntityBlock( /* ... */ ));
public static final DeferredBlock<MyEntityBlock> MY_BLOCK_2 =
        BLOCKS.register("my_block_2", () -> new MyEntityBlock( /* ... */ ));
```

## 存储数据 {#storing-data}

`BlockEntity` 的主要用途之一是存储数据。方块实体上的数据存储可以通过两种方式进行：直接读写 [NBT][nbt]，或使用[数据附加（Data Attachment）][dataattachments]。本节介绍直接读写 NBT；关于数据附加，请参阅相应链接的文章。

:::info
数据附加的主要用途，正如其名，是把数据附加到已有的方块实体上，例如原版或其他 Mod 提供的方块实体。对于你自己 Mod 的方块实体，直接向 NBT 保存和加载才是更好的做法。
:::

可以分别使用 `#loadAdditional` 和 `#saveAdditional` 方法，从 `CompoundTag` 读取数据、以及把数据写入其中。当方块实体被同步到磁盘或通过网络同步时，这些方法会被调用。

```java
public class MyBlockEntity extends BlockEntity {
    // This can be any value of any type you want, so long as you can somehow serialize it to NBT.
    // We will use an int for the sake of example.
    private int value;

    public MyBlockEntity(BlockPos pos, BlockState state) {
        super(MY_BLOCK_ENTITY.get(), pos, state);
    }

    // Read values from the passed CompoundTag here.
    @Override
    public void loadAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.loadAdditional(tag, registries);
        // Will default to 0 if absent. See the NBT article for more information.
        this.value = tag.getInt("value");
    }

    // Save values into the passed CompoundTag here.
    @Override
    public void saveAdditional(CompoundTag tag, HolderLookup.Provider registries) {
        super.saveAdditional(tag, registries);
        tag.putInt("value", this.value);
    }
}
```

在这两个方法中，务必调用 super，因为它会添加诸如位置之类的基本信息。标签名 `id`、 `x`、 `y`、 `z`、 `NeoForgeData` 和 `neoforge:attachments` 由父类方法保留，因此你不应自行使用它们。

当然，你会希望设置其他值，而不仅仅是使用默认值。你可以像操作任何其他字段那样自由地这么做。不过，如果你希望游戏保存这些改动，之后必须调用 `#setChanged()`，它会把方块实体所在的区块标记为脏（= 需要被保存）。如果不调用该方法，方块实体可能在保存时被跳过，因为 Minecraft 的保存系统只保存被标记为脏的区块。

## 计时器 {#tickers}

方块实体另一个非常常见的用途——往往与某些已存储的数据结合使用——是计时（ticking）。计时是指每游戏刻执行某些代码。做法是重写 `EntityBlock#getTicker` 并返回一个 `BlockEntityTicker`，它本质上是一个带四个参数的消费者（level、位置、方块状态和方块实体），如下所示：

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

请注意，`#tick` 方法实际上每一刻都会被调用。因此，如果可能，你应避免在其中进行大量复杂计算，例如只每隔 X 刻计算一次，或缓存计算结果。

## 同步 {#syncing}

方块实体的逻辑通常在服务端运行。因此，我们需要告诉客户端我们在做什么。要做到这一点有三种方式：在区块加载时、在方块更新时，或使用自定义网络包。一般来说，只应在必要时才同步信息，以免无谓地阻塞网络。

### 在区块加载时同步 {#syncing-on-chunk-load}

每当区块从网络或磁盘被读取时，它就会被加载（这个方法也随之被使用）。要在此处发送数据，需要重写以下方法：

```java
public class MyBlockEntity extends BlockEntity {
    // ...

    // Create an update tag here. For block entities with only a few fields, this can just call #saveAdditional.
    @Override
    public CompoundTag getUpdateTag(HolderLookup.Provider registries) {
        CompoundTag tag = new CompoundTag();
        saveAdditional(tag, registries);
        return tag;
    }

    // Handle a received update tag here. The default implementation calls #loadAdditional here,
    // so you do not need to override this method if you don't plan to do anything beyond that.
    @Override
    public void handleUpdateTag(CompoundTag tag, HolderLookup.Provider registries) {
        super.handleUpdateTag(tag, registries);
    }
}
```

### 在方块更新时同步 {#syncing-on-block-update}

每当发生方块更新时，就会使用这种方式。方块更新必须手动触发，但通常比区块同步处理得更快。

```java
public class MyBlockEntity extends BlockEntity {
    // ...

    // Create an update tag here, like above.
    @Override
    public CompoundTag getUpdateTag(HolderLookup.Provider registries) {
        CompoundTag tag = new CompoundTag();
        saveAdditional(tag, registries);
        return tag;
    }

    // Return our packet here. This method returning a non-null result tells the game to use this packet for syncing.
    @Override
    public Packet<ClientGamePacketListener> getUpdatePacket() {
        // The packet uses the CompoundTag returned by #getUpdateTag. An alternative overload of #create exists
        // that allows you to specify a custom update tag, including the ability to omit data the client might not need.
        return ClientboundBlockEntityDataPacket.create(this);
    }

    // Optionally: Run some custom logic when the packet is received.
    // The super/default implementation forwards to #loadAdditional.
    @Override
    public void onDataPacket(Connection connection, ClientboundBlockEntityDataPacket packet, HolderLookup.Provider registries) {
        super.onDataPacket(connection, packet, registries);
        // Do whatever you need to do here.
    }
}
```

要真正发送该网络包，必须在服务端调用 `Level#sendBlockUpdated(BlockPos pos, BlockState oldState, BlockState newState, int flags)` 来触发一次更新通知。位置应为方块实体的位置，可通过 `BlockEntity#getBlockPos` 获取。两个方块状态参数都可以是方块实体所在位置的方块状态，可通过 `BlockEntity#getBlockState` 获取。最后，`flags` 参数是一个更新掩码，与 [`Level#setBlock`][setblock] 中使用的相同。

### 使用自定义网络包 {#using-a-custom-packet}

通过使用专用的更新网络包，你可以在任何需要的时候自行发送网络包。这是最灵活、但也是最复杂的方式，因为它需要搭建一个网络处理器。你可以使用 `PacketDistrubtor#sendToPlayersTrackingChunk` 把网络包发送给所有追踪该方块实体的玩家。更多信息请参阅[网络通信][networking]章节。

:::caution
务必进行安全检查，因为当消息到达玩家时，`BlockEntity` 可能已经被销毁/替换。你还应通过 `Level#hasChunkAt` 检查区块是否已加载。
:::

[block]: ../blocks/index.md
[blockstate]: ../blocks/states.md
[dataattachments]: ../datastorage/attachments.md
[nbt]: ../datastorage/nbt.md
[networking]: ../networking/index.md
[registration]: ../concepts/registries.md#methods-for-registering
[setblock]: ../blocks/states.md#levelsetblock

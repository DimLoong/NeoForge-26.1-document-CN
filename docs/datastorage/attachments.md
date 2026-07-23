---
sidebar_position: 4
---
# 数据附加 {#data-attachments}

数据附加（Data Attachment）系统允许 Mod 在方块实体、区块、实体和世界上附加并存储额外数据。

_若要存储额外的世界数据，可以使用 [SavedData][saveddata]。_

:::note
针对物品堆叠的数据附加已被原版的[数据组件][datacomponents]取代。
:::

## 创建附加类型 {#creating-an-attachment-type}

要使用该系统，你需要注册一个 `AttachmentType`。附加类型包含以下配置：

- 一个默认值 Supplier，用于在数据首次被访问时创建实例。
- 一个可选的序列化器，供附加数据需要持久化时使用。
- （如果配置了序列化器）`copyOnDeath` 标志，用于在实体死亡时自动复制实体数据（见下文）。

:::tip
如果你不希望附加数据持久化，就不要提供序列化器。
:::

提供附加数据序列化器有几种方式：直接实现 `IAttachmentSerializer`，实现 [`ValueIOSerializable`][valueio] 并使用静态方法 `AttachmentType#serializable` 来创建 builder，或者向 builder 提供一个 map codec。

无论采用哪种方式，附加类型都**必须注册**到 `NeoForgeRegistries.ATTACHMENT_TYPES` 注册表。以下是一个示例：

```java
// Create the DeferredRegister for attachment types
private static final DeferredRegister<AttachmentType<?>> ATTACHMENT_TYPES = DeferredRegister.create(NeoForgeRegistries.ATTACHMENT_TYPES, MOD_ID);

// Serialization via ValueIOSerializable
private static final Supplier<AttachmentType<ItemStacksResourceHandler>> HANDLER = ATTACHMENT_TYPES.register(
    "handler", () -> AttachmentType.serializable(() -> new ItemStacksResourceHandler(1)).build()
);
// Serialization via map codec
private static final Supplier<AttachmentType<Integer>> MANA = ATTACHMENT_TYPES.register(
    "mana", () -> AttachmentType.builder(() -> 0).serialize(Codec.INT.fieldOf("mana")).build()
);
// No serialization
private static final Supplier<AttachmentType<SomeCache>> SOME_CACHE = ATTACHMENT_TYPES.register(
    "some_cache", () -> AttachmentType.builder(() -> new SomeCache()).build()
);

// In your mod constructor, don't forget to register the DeferredRegister to your mod bus:
ATTACHMENT_TYPES.register(modBus);
```

## 使用附加类型 {#using-the-attachment-type}

附加类型注册完成后，就可以在任意 holder 对象上使用它。如果没有数据存在，调用 `getData` 会附加一个新的默认实例。

```java
// Get the ItemStacksResourceHandler if it already exists, else attach a new one:
ItemStacksResourceHandler handler = chunk.getData(HANDLER);
// Get the current player mana if it is available, else attach 0:
int playerMana = player.getData(MANA);
// And so on...
```

如果不希望附加默认实例，可以先加上 `hasData` 检查：

```java
// Check if the chunk has the HANDLER attachment before doing anything.
if (chunk.hasData(HANDLER)) {
    ItemStacksResourceHandler handler = chunk.getData(HANDLER);
    // Do something with chunk.getData(HANDLER).
}
```

数据还可以用 `setData` 更新：

```java
// Increment mana by 10.
player.setData(MANA, player.getData(MANA) + 10);
```

:::important
通常，方块实体和区块在被修改时需要被标记为脏（dirty），即调用 `setChanged` 和 `setUnsaved(true)`。对于 `setData` 的调用，这会自动完成：

```java
chunk.setData(MANA, chunk.getData(MANA) + 10); // will call setUnsaved automatically
```

但如果你修改的是从 `getData` 获得的某些数据（包括新创建的默认实例），那么你必须显式地把方块实体和区块标记为脏：

```java
var mana = chunk.getData(MUTABLE_MANA);
mana.set(10);
chunk.setUnsaved(true); // must be done manually because we did not use setData
```
:::

## 与客户端共享数据 {#sharing-data-with-the-client}

要将方块实体、区块、世界或实体的附加数据同步到客户端，你可以在 builder 中实现 `sync`。这样，当附加数据通过 `AttachmentHolder#getData` 被默认创建、通过 `AttachmentHolder#setData` 被更新，或通过 `AttachmentHolder#removeData` 被移除时，附加数据就会被发送到客户端。如果需要在其他时刻发送数据，则可以用要同步的 `AttachmentType` 调用 `AttachmentHolder#syncData`。

`AttachmentType.Builder#sync` 有三个重载；不过它们各自都会创建一个 `AttachmentSyncHandler<T>`，其中 `T` 是数据附加的类型。该处理器有三个方法：两个用于向网络进行 `read` 和 `write`，一个用于判断给定玩家是否能看到该 holder 广播的数据（`sendToPlayer`）。如果附加数据被移除，同步处理器将被忽略。

```java
public class ExampleSyncHandler implements AttachmentSyncHandler<ExampleData> {

    @Override
    public void write(RegistryFriendlyByteBuf buf, ExampleData attachment, boolean initialSync) {
        // Write the attachment data to the buffer
        // If `initialSync` is true, you should write the entire attachment as the client does not have any prior data
        // If `initialSync` is false, you can choose to only write the data you would like to update
        
        // Example:
        if (initialSync) {
            // Write entire attachment
            ExampleData.STREAM_CODEC.encode(buf, attachment);
        } else {
            // Write update data
        }
    }

    @Override
    @Nullable
    public ExampleData read(IAttachmentHolder holder, RegistryFriendlyByteBuf buf, @Nullable ExampleData previousValue) {
        // Read the data from the buffer and return the new data attachment
        // `previousValue` is `null` if there was no prior data on the client
        // The result should return `null` if the data attachment should be removed

        // Example:
        if (previousValue == null) {
            // Read entire attachment
            return ExampleData.STREAM_CODEC.decode(buf);
        } else {
            // Read update data and merge to previous value
            return previousValue;
        }
    }

    @Override
    public boolean sendToPlayer(IAttachmentHolder holder, ServerPlayer to) {
        // Return whether the holder data is synced to the given player client
        // The players checked are different depending on the attachment holder:
        // - Block entities: All players tracking the chunk the block entity is within
        // - Chunk: All players tracking the chunk
        // - Entity: All players tracking the current entity, includes the current player if they are the attachment holder
        // - Level: All players in the current dimension / level

        // Example:
        // Only send the attachment if they are the attachment holder
        return holder == to;
    }
}
```

另外两个委托给 `AttachmentSyncHandler` 的重载，为 `read` 和 `write` 接收一个 [`StreamCodec`][streamcodec]，并为 `sendToPlayer` 接收一个可选的断言（predicate）。

```java
// Assume ExampleData has some stream codec STREAM_CODEC

// Sync handler
public static final Supplier<AttachmentType<ExampleData>> WITH_SYNC_HANDLER = ATTACHMENT_TYPES.register(
    "with_sync_handler", () -> AttachmentType.builder(() -> new ExampleData())
        .sync(new ExampleSyncHandler())
        .build()
);


// Stream codec
public static final Supplier<AttachmentType<ExampleData>> WITH_STREAM_CODEC = ATTACHMENT_TYPES.register(
    "with_stream_codec", () -> AttachmentType.builder(() -> new ExampleData())
        .sync(ExampleData.STREAM_CODEC)
        .build()
);

// Stream codec with predicate
public static final Supplier<AttachmentType<ExampleData>> WITH_PREDICATE = ATTACHMENT_TYPES.register(
    "with_predicate", () -> AttachmentType.builder(() -> new ExampleData())
        .sync((holder, to) -> holder == to, ExampleData.STREAM_CODEC)
        .build()
);
```

:::note
使用 `StreamCodec` 重载意味着每次都会同步整个数据附加，忽略客户端上先前已有的任何数据。
:::

## 玩家死亡时复制数据 {#copying-data-on-player-death}

默认情况下，[实体][entity]数据附加不会在玩家死亡时被复制。要在玩家死亡时自动复制某个附加数据，请在附加数据 builder 中设置 `copyOnDeath`。

更复杂的处理可以通过 `PlayerEvent.Clone` 实现，即从原实体读取数据并将其赋给新实体。在该事件中，可以用 `#isWasDeath` 方法来区分死亡后重生和从末地返回。这一点很重要，因为从末地返回时数据已经存在，所以必须小心，避免在这种情况下重复复制值。

例如：

```java
@SubscribeEvent // on the game event bus
public static void onClone(PlayerEvent.Clone event) {
    if (event.isWasDeath() && event.getOriginal().hasData(MY_DATA)) {
        event.getEntity().getData(MY_DATA).fieldToCopy = event.getOriginal().getData(MY_DATA).fieldToCopy;
    }
}
```

[datacomponents]: ../items/datacomponents.md
[entity]: ../entities/index.md
[saveddata]: saveddata.md
[streamcodec]: ../networking/streamcodecs.md
[valueio]: valueio.md#valueioserializable

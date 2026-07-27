---
sidebar_position: 3
---
# 数据附加（Data Attachments） {#data-attachments}

数据附加系统允许 Mod 在方块实体、区块和实体上附加并存储额外数据。

_如果要存储额外的世界数据，可以使用 [SavedData][saveddata]。_

:::note
针对物品堆叠的数据附加已被原版的[数据组件][datacomponents]取代。
:::

## 创建附加类型 {#creating-an-attachment-type}

要使用该系统，你需要注册一个 `AttachmentType`。附加类型包含以下配置：

- 一个默认值 Supplier，用于在首次访问数据时创建实例。
- 一个可选的序列化器，用于在需要持久化附加数据时使用。
- （如果配置了序列化器）`copyOnDeath` 标志，用于在实体死亡时自动复制其数据（见下文）。

:::tip
如果不希望附加数据被持久化，就不要提供序列化器。
:::

提供附加序列化器有几种方式：直接实现 `IAttachmentSerializer`；实现 `INBTSerializable` 并使用静态方法 `AttachmentType#serializable` 来创建构建器；或者向构建器提供一个 codec。

无论采用哪种方式，附加数据都**必须注册**到 `NeoForgeRegistries.ATTACHMENT_TYPES` 注册表。示例如下：

```java
// Create the DeferredRegister for attachment types
private static final DeferredRegister<AttachmentType<?>> ATTACHMENT_TYPES = DeferredRegister.create(NeoForgeRegistries.ATTACHMENT_TYPES, MOD_ID);

// Serialization via INBTSerializable
private static final Supplier<AttachmentType<ItemStackHandler>> HANDLER = ATTACHMENT_TYPES.register(
    "handler", () -> AttachmentType.serializable(() -> new ItemStackHandler(1)).build()
);
// Serialization via codec
private static final Supplier<AttachmentType<Integer>> MANA = ATTACHMENT_TYPES.register(
    "mana", () -> AttachmentType.builder(() -> 0).serialize(Codec.INT).build()
);
// No serialization
private static final Supplier<AttachmentType<SomeCache>> SOME_CACHE = ATTACHMENT_TYPES.register(
    "some_cache", () -> AttachmentType.builder(() -> new SomeCache()).build()
);

// In your mod constructor, don't forget to register the DeferredRegister to your mod bus:
ATTACHMENT_TYPES.register(modBus);
```

## 使用附加类型 {#using-the-attachment-type}

附加类型注册完成后，即可在任意 holder 对象上使用。如果调用 `getData` 时不存在数据，则会附加一个新的默认实例。

```java
// Get the ItemStackHandler if it already exists, else attach a new one:
ItemStackHandler stackHandler = chunk.getData(HANDLER);
// Get the current player mana if it is available, else attach 0:
int playerMana = player.getData(MANA);
// And so on...
```

如果不希望附加默认实例，可以先用 `hasData` 检查：

```java
// Check if the chunk has the HANDLER attachment before doing anything.
if (chunk.hasData(HANDLER)) {
    ItemStackHandler stackHandler = chunk.getData(HANDLER);
    // Do something with chunk.getData(HANDLER).
}
```

数据也可以通过 `setData` 更新：

```java
// Increment mana by 10.
player.setData(MANA, player.getData(MANA) + 10);
```

:::important
通常，方块实体和区块在被修改时需要被标记为脏（dirty），分别通过 `setChanged` 和 `setUnsaved(true)`。对于 `setData` 调用，这一步会自动完成：

```java
chunk.setData(MANA, chunk.getData(MANA) + 10); // will call setUnsaved automatically
```

但如果你修改的是从 `getData` 获取到的数据（包括新创建的默认实例），那么你必须显式地把方块实体和区块标记为脏：

```java
var mana = chunk.getData(MUTABLE_MANA);
mana.set(10);
chunk.setUnsaved(true); // must be done manually because we did not use setData
```
:::

## 与客户端共享数据 {#sharing-data-with-the-client}

要把方块实体、区块或实体的附加数据同步到客户端，你需要自行[向客户端发送网络包][network]。对于区块，可以使用 `ChunkWatchEvent.Sent` 来得知何时应向玩家发送区块数据。

## 在玩家死亡时复制数据 {#copying-data-on-player-death}

默认情况下，实体的数据附加不会在玩家死亡时被复制。要在玩家死亡时自动复制某个附加数据，请在附加类型构建器中设置 `copyOnDeath`。

更复杂的处理可以通过 `PlayerEvent.Clone` 实现：从原实体读取数据并赋给新实体。在该事件中，可以使用 `#isWasDeath` 方法来区分是死亡后重生还是从末地返回。这一点很重要，因为从末地返回时数据已经存在，因此在这种情况下必须注意不要重复复制数值。

例如：

```java
NeoForge.EVENT_BUS.register(PlayerEvent.Clone.class, event -> {
    if (event.isWasDeath() && event.getOriginal().hasData(MY_DATA)) {
        event.getEntity().getData(MY_DATA).fieldToCopy = event.getOriginal().getData(MY_DATA).fieldToCopy;
    }
});
```

[saveddata]: ./saveddata.md
[datacomponents]: ../items/datacomponents.md
[network]: ../networking/index.md

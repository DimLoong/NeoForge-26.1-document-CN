---
sidebar_position: 2
---
# 数据与网络通信 {#data-and-networking}

没有数据的实体几乎毫无用处，因此在实体上存储数据至关重要。所有实体都会存储一些默认数据，例如它们的类型和位置。本文将讲解如何添加你自己的数据，以及如何同步这些数据。

添加数据最简单的方式，是在你的 `Entity` 类中添加一个字段。随后你可以任意方式与这些数据交互。然而，一旦需要同步这些数据，这种方式很快就会变得非常麻烦。这是因为大部分实体逻辑只在服务端运行，只有偶尔（取决于 [`EntityType`][entitytype] 的 `clientUpdateInterval` 值）才会向客户端发送一次更新；当服务端的 tick 速度太慢时，这也正是那些容易察觉的实体“卡顿”的原因。

为此，原版引入了几套系统来提供帮助，每一套都服务于特定目的。在必要时，你也始终可以选择[发送自定义数据][custom]。

## `SynchedEntityData` {#synchedentitydata}

`SynchedEntityData` 是一套用于在运行时存储值并通过网络同步的系统。它分为三个类：

- `EntityDataSerializer` 基本上是对 [`StreamCodec`][streamcodec] 的封装。
    - Minecraft 使用一个硬编码的序列化器 map。NeoForge 将这个 map 转换成了注册表，也就是说，如果你想添加新的 `EntityDataSerializer`，就必须通过[注册][registration]来添加。
    - Minecraft 在 `EntityDataSerializers` 类中定义了各种默认的 `EntityDataSerializer`。
- `EntityDataAccessor` 由实体持有，用于获取和设置数据值。
- `SynchedEntityData` 本身持有实体的所有 `EntityDataAccessor`，并在需要时自动调用 `EntityDataSerializer` 来同步值。

要开始使用，先在你的实体类中创建一个 `EntityDataAccessor`：

```java
public class MyEntity extends Entity {
    // The generic type must match the one of the second parameter below.
    public static final EntityDataAccessor<Integer> MY_DATA =
        SynchedEntityData.defineId(
            // The class of the entity.
            MyEntity.class,
            // The entity data accessor type.
            EntityDataSerializers.INT
        );
}
```

:::danger
虽然编译器允许你在 `SynchedEntityData#defineId()` 的第一个参数处使用持有类以外的其他类，但这样做可能——并且必然——会导致难以调试的问题，因此禁止这么做，务必不惜一切代价避免。（这也包括通过 mixin 或类似方式添加字段。）
:::

随后，我们必须在 `defineSynchedData` 方法中定义默认值，如下所示：

```java
public class MyEntity extends Entity {
    public static final EntityDataAccessor<Integer> MY_DATA = SynchedEntityData.defineId(MyEntity.class, EntityDataSerializers.INT);

    @Override
    protected void defineSynchedData(SynchedEntityData.Builder builder) {
        // Our default value is zero.
        builder.define(MY_DATA, 0);
    }
}
```

最后，我们可以像下面这样获取和设置实体数据（假设我们在 `MyEntity` 内的某个方法中）：

```java
int data = this.getEntityData().get(MY_DATA);
this.getEntityData().set(MY_DATA, 1);
```

## `readAdditionalSaveData` 与 `addAdditionalSaveData` {#readadditionalsavedata-and-addadditionalsavedata}

这两个方法用于从磁盘读取数据以及向磁盘写入数据。它们的工作方式是从[值 I/O][valueio]加载你的值，或将你的值保存到值 I/O，如下所示：

```java
// Assume that an `int data` exists in the class.
@Override
protected void readAdditionalSaveData(ValueInput input) {
    this.data = input.getIntOr("my_data", 0);
}

@Override
protected void addAdditionalSaveData(ValueOutput output) {
    output.putInt("my_data", this.data);
}
```

## 自定义生成数据 {#custom-spawn-data}

在某些情况下，实体在客户端生成时需要一些自定义数据，但这些数据不会随时间变化。这种情况下，你可以在实体上实现 `IEntityWithComplexSpawn` 接口，并使用它的两个方法 `#writeSpawnData` 和 `#readSpawnData` 向网络缓冲区写入/读取数据：

```java
@Override
public void writeSpawnData(RegistryFriendlyByteBuf buf) {
    buf.writeInt(1234);
}

@Override
public void readSpawnData(RegistryFriendlyByteBuf buf) {
    int i = buf.readInt();
}
```

此外，你还可以在生成时发送自己的数据包。为此，重写 `IEntityExtension#sendPairingData`，并像发送其他任何数据包一样在其中发送你的数据包：

```java
@Override
public void sendPairingData(ServerPlayer player, Consumer<CustomPacketPayload> packetConsumer) {
    // Call super for some base functionality.
    super.sendPairingData(player, packetConsumer);
    // Add your own packets.
    packetConsumer.accept(new MyPacket(...));
}
```

关于自定义网络包的更多信息，请参阅[网络通信系列文章][networking]。

## 数据附加数据 {#data-attachments}

实体已被修补为继承 `AttachmentHolder`，因此支持通过[附加数据][attachment]进行数据存储。它的主要用途是在不属于你的实体（即 Minecraft 或其他 Mod 添加的实体）上定义自定义数据。更多信息请参阅所链接的文章。

## 自定义网络消息 {#custom-network-messages}

对于同步，你也始终可以选择使用自定义数据包，在需要时发送额外信息。更多信息请参阅[网络通信系列文章][networking]。

[attachment]: ../datastorage/attachments.md
[custom]: #custom-network-messages
[entitytype]: index.md#entitytype
[networking]: ../networking/index.md
[registration]: ../concepts/registries.md#methods-for-registering
[streamcodec]: ../networking/streamcodecs.md
[valueio]: ../datastorage/valueio.md

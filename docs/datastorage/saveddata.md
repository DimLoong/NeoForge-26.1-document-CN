---
sidebar_position: 5
---
# 存档数据 {#saved-data}

存档数据（SavedData，简称 SD）系统可用于在世界（Level）上保存额外数据。

_如果数据是特定于某些方块实体、区块或实体的，请考虑改用[数据附加](attachments)。_

## `SavedData` {#saveddata}

每个 SD 实现都必须继承 `SavedData` 类。它可以像其他任何对象一样实现，拥有你自己的字段和方法，但如果你想把数据存储或更改到磁盘上，就必须调用 `setDirty`。`setDirty` 会通知游戏有需要写入的更改。如果不调用它，数据只会在当前世界（对于 `MinecraftServer` 而言则是当前存档）加载期间保持存在。

```java
// For some saved data implementation
public class ExampleSavedData extends SavedData {

    public void foo() {
        // Change data in saved data
        // Call set dirty if data changes
        this.setDirty();
    }
}
```

## `SavedDataType` {#saveddatatype}

由于 `SavedData` 只是一个普通对象，它需要某种关联的标识符。此外，我们还需要把数据读写到磁盘。这就是 `SavedDataType` 的用武之地。它接收存档数据的标识符、一个在没有数据时使用的默认构造器，以及一个用于编码和解码数据的 [codec]。该标识符被当作对应世界文件夹以及各维度世界中的路径位置，具体如下：

- 服务端数据：`./<world_folder>/data/<identifier_namespace>/<identifier_path>.dat`
- 各维度世界的独立数据：`./<world_folder>/dimensions/<level_namespace>/<level_path>/data/<identifier_namespace>/<identifier_path>.dat`

任何缺失的目录都会被创建，包括作为标识符组成部分的目录。

:::note
`DataFixTypes` 还有一个额外的第四个参数，但由于 NeoForge 不支持 data fixer，所有原版用例都已被修补为允许传入 null 值。
:::

`SavedDataType` 构造器有两种变体。第一种接收一个用于构造的简单 `Supplier`，以及一个用于磁盘处理的常规 `Codec`。不过，如果你想存储当前的 `ServerLevel` 或世界种子，还有一个 NeoForge 新增的重载，它为两者都接收一个 `SavedDataType.Factory`，并向其提供一个 `ServerLevel`。

```java
// For some saved data implementation
public class NoContextExampleSavedData extends SavedData {

    public static final SavedDataType<NoContextExampleSavedData> ID = new SavedDataType<>(
        // The identifier of the saved data
        // Used as the path within the `data` folder
        Identifier.fromNamespaceAndPath("examplemod", "example"),
        // The initial constructor
        NoContextExampleSavedData::new,
        // The codec used to serialize the data
        RecordCodecBuilder.create(instance -> instance.group(
            Codec.INT.fieldOf("val1").forGetter(sd -> sd.val1),
            BuiltInRegistries.BLOCK.byNameCodec().fieldOf("val2").forGetter(sd -> sd.val2)
        ).apply(instance, NoContextExampleSavedData::new))
    );

    // Initial constructor
    public NoContextExampleSavedData() {
        // ...
    }

    // Data constructor
    public NoContextExampleSavedData(int val1, Block val2) {
        // ...
    }

    public void foo() {
        // Change data in saved data
        // Call set dirty if data changes
        this.setDirty();
    }
}

// For some saved data implementation
public class ContextExampleSavedData extends SavedData {

    public static final SavedDataType<ContextExampleSavedData> ID = new SavedDataType<>(
        // The identifier of the saved data
        // Used as the path within the `data` folder
        Identifier.fromNamespaceAndPath("examplemod", "example"),
        // The initial constructor
        ContextExampleSavedData::new,
        // The codec used to serialize the data
        level -> RecordCodecBuilder.create(instance -> instance.group(
            RecordCodecBuilder.point(level),
            Codec.INT.fieldOf("val1").forGetter(sd -> sd.val1),
            BuiltInRegistries.BLOCK.byNameCodec().fieldOf("val2").forGetter(sd -> sd.val2)
        ).apply(instance, ContextExampleSavedData::new))
    );

    // Initial constructor
    public ContextExampleSavedData(ServerLevel level) {
        // ...
    }

    // Data constructor
    public ContextExampleSavedData(ServerLevel level, int val1, Block val2) {
        // ...
    }

    public void foo() {
        // Change data in saved data
        // Call set dirty if data changes
        this.setDirty();
    }
}
```

## 附加到世界 {#attaching-to-a-level}

任何 `SavedData` 都是动态地加载到并且/或者附加到世界或服务端上的。因此，如果某个 SD 从未在某个世界或服务端上被创建，它就不会存在。

`SavedData` 由 `SavedDataStorage` 创建和加载，后者可以通过调用 `ServerChunkCache#getDataStorage` 或 `ServerLevel#getDataStorage` 获取。之后，你可以调用 `SavedDataStorage#computeIfAbsent` 并传入 `SavedDataType`，以获取或创建你的 SD 实例。此调用会尝试获取当前的 SD 实例（如果存在），否则创建一个新实例并加载所有可用的数据。

```java
// In some method with access to the SavedDataStorage
netherDataStorage.computeIfAbsent(ContextExampleSavedData.ID);
```

如果某个 SD 不是特定于某个世界的，则该 SD 应通过 `MinecraftServer#getDataStorage` 附加到 `MinecraftServer` 上。

[codec]: codecs.md

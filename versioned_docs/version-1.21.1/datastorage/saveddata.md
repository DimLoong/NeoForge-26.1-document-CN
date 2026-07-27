---
sidebar_position: 4
---
# 存档数据（Saved Data） {#saved-data}

存档数据（Saved Data，简称 SD）系统可用于在世界（Level）上保存额外数据。

_如果数据只与某些方块实体、区块或实体相关，请考虑改用[数据附加](attachments)。_

## 声明 {#declaration}

每个 SD 实现都必须继承 `SavedData` 类。有两个重要方法需要留意：

- `save`：允许实现将 NBT 数据写入世界。
- `setDirty`：在修改数据后必须调用该方法，以通知游戏存在需要写入的更改。如果不调用，`#save` 将不会被调用，原有数据也将保持不变。

## 附加到世界 {#attaching-to-a-level}

任何 `SavedData` 都是动态加载和/或附加到世界的。因此，如果某个世界从未创建过它，它就不会存在。

`SavedData` 由 `DimensionDataStorage` 创建和加载，后者可通过调用 `ServerChunkCache#getDataStorage` 或 `ServerLevel#getDataStorage` 获取。随后，你可以调用 `DimensionDataStorage#computeIfAbsent` 来获取或创建你的 SD 实例。该方法会尝试获取当前存在的 SD 实例，若不存在则创建一个新实例并加载所有可用数据。

`DimensionDataStorage#computeIfAbsent` 接收两个参数。第一个是 `SavedData.Factory` 的实例，它由一个用于构造 SD 新实例的 Supplier 和一个用于将 NBT 数据加载进 SD 并返回该 SD 的函数组成。第二个参数是存储在对应世界 `data` 文件夹中的 `.dat` 文件名。该名称必须是合法的文件名，且不能包含 `/` 或 `\`。

例如，若在下界（Nether）中有一个名为 "example" 的 SD，则会在 `./<level_folder>/DIM-1/data/example.dat` 处创建文件，其实现方式如下：

```java
// In some saved data implementation
public class ExampleSavedData extends SavedData {

    // Create new instance of saved data
    public static ExampleSavedData create() {
        return new ExampleSavedData();
    }

    // Load existing instance of saved data
    public static ExampleSavedData load(CompoundTag tag, HolderLookup.Provider lookupProvider) {
        ExampleSavedData data = ExampleSavedData.create();
        // Load saved data
        return data;
    }

    @Override
    public CompoundTag save(CompoundTag tag, HolderLookup.Provider registries) {
        // Write data to tag
        return tag;
    }

    public void foo() {
        // Change data in saved data
        // Call set dirty if data changes
        this.setDirty();
    }
}

// In some method within the class
netherDataStorage.computeIfAbsent(new Factory<>(ExampleSavedData::create, ExampleSavedData::load), "example");
```

如果某个 SD 并非特定于某个世界，则应将其附加到主世界（Overworld），主世界可通过 `MinecraftServer#overworld` 获取。主世界是唯一永远不会被完全卸载的维度，因此非常适合用来存储跨世界数据。

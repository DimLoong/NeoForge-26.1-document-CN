---
sidebar_position: 3
---
# 值 I/O {#value-io}

值 I/O（Value I/O）系统是一种标准化的序列化方法，用于操作某个后备对象中的数据，例如[用于 NBT 的 `CompoundTag`][nbt]。

## 输入与输出 {#inputs-and-outputs}

值 I/O 系统由两部分组成：`ValueOutput` 在序列化时向对象写入数据，`ValueInput` 在反序列化时从对象读取数据。实现方法通常只接收 `ValueOutput` 或 `ValueInput` 作为唯一参数，并且不返回任何值。值 I/O 期望后备对象是一个由字符串键映射到对象值的字典。借助所提供的方法，值 I/O 便可从后备对象读取信息或向其写入信息。

```java
// For some BlockEntity subclass
@Override
protected void saveAdditional(ValueOutput output) {
    super.saveAdditional(output);
    // Write data to the output
}

@Override
protected void loadAdditional(ValueInput input) {
    super.loadAdditional(input);
    // Read data from the input
}

// For some Entity subclass
@Override
protected void addAdditionalSaveData(ValueOutput output) {
    super.addAdditionalSaveData(output);
    // Write data to the output
}

@Override
protected void readAdditionalSaveData(ValueInput input) {
    super.readAdditionalSaveData(input);
    // Read data from the input
}
```

### 基本类型 {#primitives}

值 I/O 提供了读写某些基本类型的方法。`ValueOutput` 方法以 `put*` 为前缀，接收键与基本类型的值。`ValueInput` 方法命名为 `get*Or`，接收键与一个在不存在时使用的默认值。

| Java Type | `ValueOutput` | `ValueInput`                 |
|:---------:|:-------------:|:----------------------------:|
| `boolean` | `putBoolean`  | `getBooleanOr`               |
| `byte`    | `putByte`     | `getByteOr`                  |
| `short`   | `putShort`    | `getShortOr`                 |
| `int`     | `putInt`      | `getInt`\*, `getIntOr`       |
| `long`    | `putLong`     | `getLong`\*, `getLongOr`     |
| `float`   | `putFloat`    | `getFloatOr`                 |
| `double`  | `putDouble`   | `getDoubleOr`                |
| `String`  | `putString`   | `getString`\*, `getStringOr` |
| `int[]`   | `putIntArray` | `getIntArray`\*              |

\* 这些 `ValueInput` 方法返回用 `Optional` 包装的基本类型，而不是接收并回传某个回退值。

```java
// For some BlockEntity subclass
@Override
protected void saveAdditional(ValueOutput output) {
    super.saveAdditional(output);
    
    // Write data to the output
    output.putBoolean(
        // The string key
        "boolValue",
        // The value associated with this key
        true
    );
    output.putString("stringValue", "Hello world!");
}

@Override
protected void loadAdditional(ValueInput input) {
    super.loadAdditional(input);

    // Read data from the input

    // Defaults to false if not present
    boolean boolValue = input.getBooleanOr(
        // The string key to retrieve
        "boolValue",
        // The default value to return if the key is not present
        false
    );

    // Defaults to 'Dummy!' if not present
    String stringValue = input.getStringOr("stringValue", "Dummy!");
    // Returns an optional-wrapped value
    Optional<String> stringValueOpt = input.getString("stringValue");
}
```

### Codec {#codecs}

[`Codec`][codec] 也可用于向值 I/O 存储值以及从中读取值。在原版中，所有 `Codec` 都通过 `RegistryOps` 处理，从而支持存储数据包注册项。`ValueOutput#store` 和 `storeNullable` 接收键、用于写入对象的 codec 以及对象本身。当对象为 `null` 时，`storeNullable` 不会写入任何内容。`ValueInput#read` 通过接收键与 codec 来读取对象，返回一个用 `Optional` 包装的对象。

```java
// For some BlockEntity subclass
@Override
protected void saveAdditional(ValueOutput output) {
    super.saveAdditional(output);
    
    // Write data to the output
    output.storeNullable("codecValue", Rarity.CODEC, Rarity.EPIC);
}

@Override
protected void loadAdditional(ValueInput input) {
    super.loadAdditional(input);

    // Read data from the input
    Optional<Rarity> codecValue = input.read("codecValue", Rarity.CODEC);
}
```

`ValueOutput` 和 `ValueInput` 还为 `MapCodec` 提供了 `store` / `read` 方法。与 `Codec` 相比，`MapCodec` 变体会把值合并到当前根节点上。

```java
// For some BlockEntity subclass
@Override
protected void saveAdditional(ValueOutput output) {
    super.saveAdditional(output);
    
    // Write data to the output
    output.store(
        SingleFile.MAP_CODEC,
        new SingleFile(Identifier.fromNamespaceAndPath("examplemod", "example"))
    );
}

@Override
protected void loadAdditional(ValueInput input) {
    super.loadAdditional(input);

    // Read data from the input

    // No key is needed as they are stored on the root value access
    Optional<SingleFile> file = input.read(SingleFile.MAP_CODEC);
    // This is present as `SingleFile` writes the `resource` parameter
    String resource = input.getStringOr("resource", "Not present!");
}
```

:::warning
`MapCodec` 会向值访问写入任意键，可能覆盖已有数据。请确保 `MapCodec` 内的所有键与其他键互不相同。
:::

### 列表 {#lists}

列表可以通过两种方法之一创建与读取：子值 I/O，或 [`Codec`]。

列表通过 `ValueOutput#childrenList` 创建，接收某个键。它返回一个 `ValueOutput.ValueOutputList`，其行为如同一个只写的值对象列表。可以通过 `ValueOutputList#addChild` 向列表添加一个新的值对象。该方法返回一个 `ValueOutput`，用于写入该值对象的数据。随后可以通过 `ValueInput#childrenList` 读取列表，或使用 `childrenListOrEmpty` 在不存在时默认返回空列表。这些方法返回一个 `ValueInput.ValueInputList`，其行为如同一个只读的可迭代对象或流（通过 `stream`）。

```java
// For some BlockEntity subclass
@Override
protected void saveAdditional(ValueOutput output) {
    super.saveAdditional(output);
    
    // Write data to the output

    // Create List
    ValueOutput.ValueOutputList listValue = output.childrenList("listValue");
    // Add elements
    ValueOutput childIdx0 = listValue.addChild();
    childIdx0.putBoolean("boolChild", false);
    ValueOutput childIdx1 = listValue.addChild();
    childIdx1.putInt("boolChild", true);
}

@Override
protected void loadAdditional(ValueInput input) {
    super.loadAdditional(input);

    // Read data from the input

    // Read values of list
    for (ValueInput childInput : input.childrenListOrEmpty("listValue")) {
        boolean boolChild = childInput.getBooleanOr("boolChild", false);
    }
}
```

`Codec` 通过 `ValueOutput#list` 为数据对象提供了一个列表变体。它接收一个键和某个 `Codec`，返回一个 `ValueOutput.TypedOutputList`。`TypedOutputList` 与 `ValueOutputList` 相同，区别在于它直接操作数据对象，而不是使用另一个值 I/O。可以通过 `TypedOutputList#add` 向列表添加元素。随后同样地，可以通过 `ValueInput#list` 或 `listOrEmpty` 读取列表，返回一个 `TypedValueInput`。

:::note
`TypedValueOutput` / `TypedValueInput` 与 `Codec#listOf` 的主要区别在于错误处理方式。对于 `Codec#listOf`，某个条目失败会导致整个对象被标记为错误的 `DataResult`。而带类型的值 I/O 通常通过 `ProblemReporter` 处理错误。在原版中，`Codec#listOf` 提供了更大的灵活性，因为 `ProblemReporter` 是在创建值 I/O 时指定的。不过，自定义的值 I/O 用法可以根据使用场景选择实现其中任一种。
:::

```java
// For some BlockEntity subclass
@Override
protected void saveAdditional(ValueOutput output) {
    super.saveAdditional(output);
    
    // Write data to the output

    // Create List
    ValueOutput.TypedInputList<Rarity> listValue = output.list("listValue", Rarity.CODEC);
    // Add elements
    listValue.add(Rarity.COMMON);
    listValue.add(Rarity.EPIC);
}

@Override
protected void loadAdditional(ValueInput input) {
    super.loadAdditional(input);

    // Read data from the input

    // Read values of list
    for (Rarity rarity : input.listOrEmpty("listValue", Rarity.CODEC)) {
        // ...
    }
}
```

:::warning
即使列表为空，它仍会被写入 `ValueOutput`。如果你不想写入该列表，应让 `TypedOutputList` 或 `ValueOutputList` 检查其是否 `isEmpty`，然后用列表的键调用 `discard`。

```java
// For some BlockEntity subclass
@Override
protected void saveAdditional(ValueOutput output) {
    super.saveAdditional(output);
    
    // Write data to the output

    // Create List
    ValueOutput.TypedInputList<Rarity> listValue = output.list("listValue", Rarity.CODEC);
    
    // Check if list is empty
    if (listValue.isEmpty()) {
        // Discard from output
        output.discard("listValue");
    }
}
```
:::

### 对象 {#objects}

对象可以通过子节点创建与读取。`ValueOutput#child` 根据给定的键创建一个新的 `ValueObject`。随后可以通过 `ValueInput#child` 读取该对象，或使用 `childOrEmpty` 在应当默认返回一个带空后备值的 `ValueInput` 时使用。

```java
// For some BlockEntity subclass
@Override
protected void saveAdditional(ValueOutput output) {
    super.saveAdditional(output);
    
    // Write data to the output

    // Create object
    ValueOutput objectValue = output.child("objectValue");
    // Add data to object
    objectValue.putBoolean("boolChild", true);
    objectValue.putInt("intChild", 20);
}

@Override
protected void loadAdditional(ValueInput input) {
    super.loadAdditional(input);

    // Read data from the input

    // Read object
    ValueInput objectValue = input.childOrEmpty("objectValue");
    // Get data from object
    boolean boolChild = objectValue.getBooleanOr("boolChild", false);
    int intChild = objectValue.getIntOr("intChild", 0);
}
```

## ValueIOSerializable {#valueioserializable}

`ValueIOSerializable` 是 NeoForge 新增的接口，用于那些可以借助值 I/O 序列化和反序列化的对象。NeoForge 使用该 API 来处理[数据附加][attachments]。该接口提供两个方法：`serialize` 将对象写入 `ValueOutput`，`deserialize` 从 `ValueInput` 读取对象。

```java
public class ExampleObject implements ValueIOSerializable {
    
    @Override
    public void serialize(ValueOutput output) {
        // Write the object data here
    }

    @Override
    public void deserialize(ValueInput input) {
        // Read the object data here
    }
}
```

`ValueIOSerializable` 也可以通过 NeoForge 新增的方法 `ValueOutputExtension#putChild` 和 `ValueInputExtension#readChild` 进行写入和读取。

## 实现 {#implementations}

### NBT {#nbt}

针对 [NBT][nbt] 的值 I/O 由 `TagValueOutput` 和 `TagValueInput` 处理。

`TagValueOutput` 可以通过 `createWithContext` 或 `createWithoutContext` 创建，`createWithContext` 意味着该输出可以访问 `HolderLookup.Provider`，从而提供所有注册项（静态的和数据包的），而 `createWithoutContext` 不提供任何数据包访问权限。原版只使用 `createWithContext`。`ValueOutput` 使用完毕后，可以通过 `TagValueOutput#buildResult` 取得 `CompoundTag`。而 `TagValueInput` 可以通过 `create` 创建，接收 `HolderLookup.Provider` 以及该输入所访问的 `CompoundTag`。

两种值 I/O 都还接收一个 `ProblemReporter`。`ProblemReporter` 用于收集读写过程中的所有内部错误。目前它只跟踪 `Codec` 错误。如何处理这些错误由 Mod 开发者决定。原版实现会在 `ProblemReporter` 非空时抛出异常。

```java
// Assume we have access to a HolderLookup.Provider lookupProvider

TagValueOutput output = TagValueOutput.createWithContext(
    ProblemReporter.DISCARDING, // Choose to discard all errors
    lookupProvider
);

// Write to the output...

CompoundTag tag = output.buildResult();

// Collect the errors
ProblemReporter.Collector reporter = new ProblemReporter.Collector(
    // Optionally takes in the root path element
    // Some objects (e.g., block entities, entities) have a #problemPath() method that can be supplied
    new RootFieldPathElement("example_object")
);

TagValueInput input = TagValueInput.create(
    reporter,
    lookupProvider,
    tag
);

// Read from the input...
```

[attachments]: attachments.md
[codec]: codecs.md
[nbt]: nbt.md

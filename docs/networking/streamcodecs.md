---
sidebar_position: 2
---
# 流式编解码器 {#stream-codecs}

流式编解码器（StreamCodec）是一种序列化工具，用于描述一个对象应如何存储到流（例如缓冲区）中以及如何从流中读取。流式编解码器主要被原版的[网络通信系统][networking]用来同步数据。

:::info
由于流式编解码器与 [Codec][codecs] 大致对应，本页的组织方式与之相同，以便展现它们之间的相似之处。
:::

## 使用流式编解码器 {#using-stream-codecs}

流式编解码器分别通过 `StreamCodec#encode` 和 `StreamCodec#decode` 将对象编码进流、从流中解码出来。`encode` 接收流以及要编码进流的对象。`decode` 接收流并返回解码得到的对象。通常，这个流是 `ByteBuf`、`FriendlyByteBuf` 或 `RegistryFriendlyByteBuf` 之一。

```java
// Let exampleStreamCodec represent a StreamCodec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let buffer be a RegistryFriendlyByteBuf

// Encode Java object into the buffer stream
exampleStreamCodec.encode(buffer, exampleObject);

// Read Java object from buffer stream
ExampleJavaObject obj = exampleStreamCodec.decode(buffer);
```

:::note
除非你在手动处理缓冲区对象，否则一般永远不会调用 `encode` 和 `decode`。
:::

## 现有的流式编解码器 {#existing-stream-codecs}

### `ByteBufCodecs` {#bytebufcodecs}

`ByteBufCodecs` 包含了针对某些基本类型和对象的编解码器静态实例。

| Stream Codec   | Java Type     |
|----------------|---------------|
| `BOOL`         | `Boolean`     |
| `BYTE`         | `Byte`        |
| `SHORT`        | `Short`       |
| `INT`          | `Integer`     |
| `LONG`         | `Long`        |
| `FLOAT`        | `Float`       |
| `DOUBLE`       | `Double`      |
| `BYTE_ARRAY`   | `byte[]`\*    |
| `LONG_ARRAY`   | `long[]`      |
| `STRING_UTF8`  | `String`\*\*  |
| `TAG`          | `Tag`         |
| `COMPOUND_TAG` | `CompoundTag` |
| `VECTOR3F`     | `Vector3fc`   |
| `QUATERNIONF`  | `Quaternionfc`|
| `GAME_PROFILE` | `GameProfile` |

\* `byte[]` 可通过 `ByteBufCodecs#byteArray` 限制为一定数量的值。

\*\* `String` 可通过 `ByteBufCodecs#stringUtf8` 限制为一定数量的字符。

此外，还有一些用不同方式来编解码基本类型和对象的静态实例。

#### 无符号短整型 {#unsigned-shorts}

`UNSIGNED_SHORT` 是 `SHORT` 的一个替代方案，意在被当作无符号数处理。由于 Java 中的数字是有符号的，无符号短整型在收发时会被表示为高两个字节被掩码清零的 `Integer`。

#### 可变长度数字 {#variable-sized-number}

`VAR_INT` 和 `VAR_LONG` 是将值编码得尽可能小的流式编解码器。其做法是每次编码七位，用最高位作为标记，指示该数字是否还有更多数据。对于整型，介于 0 到 2^28-1 之间的数字，或对于长整型介于 0 到 2^56-1 之间的数字，发送时所占字节数将分别小于或等于一个整型或长整型的字节数。如果你的数字通常落在这个范围内且总体偏向低端，那么就应当使用这些可变流式编解码器。

:::note
`VAR_INT` 和 `VAR_LONG` 分别是 `INT` 和 `LONG` 的替代方案。
:::

#### 受信标签 {#trusted-tags}

`TRUSTED_TAG` 和 `TRUSTED_COMPOUND_TAG` 分别是 `TAG` 和 `COMPOUND_TAG` 的变体，相比 `TAG` 和 `COMPOUND_TAG` 的 2MiB 限制，它们在解码标签时拥有不受限制的堆空间。受信标签流式编解码器理想情况下应当只用于客户端接收的网络包，例如原版对[方块实体数据包][blockentity]和[实体数据序列化器][entity]的用法。

如果需要使用不同的限制，可以通过 `ByteBufCodecs#tagCodec` 或 `#compoundTagCodec` 提供一个具有给定大小的 `NbtAccounter`。还可以通过 `#optionalTagCodec` 获得一个被 optional 包装的 `Tag`。

#### 宽松 JSON {#lenient-json}

`ByteBufCodecs#lenientJson` 处理任意的 `JsonElement`，允许诸如 `nan`、`infinite` 这类多种浮点描述符，或多个顶层对象。它接收 JSON 允许的最大大小。

### 原版与 NeoForge {#vanilla-and-neoforge}

Minecraft 和 NeoForge 为频繁编解码的对象定义了许多流式编解码器。例如用于 `Identifier` 的 `Identifier#STREAM_CODEC`，或用于 `ChunkPos` 的 `NeoForgeStreamCodecs#CHUNK_POS`。

大多数流式编解码器可以在对象类自身内部，或在 `StreamCodec`、`ByteBufCodecs`、`NeoForgeStreamCodecs` 中找到。

## 创建流式编解码器 {#creating-stream-codecs}

可以创建流式编解码器来把任意对象读写到流。本文档将聚焦于把流作为缓冲区来讲，因为这是它的主要用途。

流式编解码器有两个泛型：`B` 表示缓冲区，`V` 表示对象值。`B` 通常是三种类型之一：`ByteBuf`、`FriendlyByteBuf`、`RegistryFriendlyByteBuf`，它们依次相互继承。`FriendlyByteBuf` 增加了 Minecraft 特有的读写方法，而 `RegistryFriendlyByteBuf` 则提供了对注册表列表及其对象的访问。

构造流式编解码器时，`B` 应当取最不具体的缓冲区类型。例如，`Identifier` 是作为字符串发送的。由于普通的 `ByteBuf` 就支持字符串，它的类型应当是 `StreamCodec<ByteBuf, Identifier>`。`FriendlyByteBuf` 包含写入 `ChunkPos` 的方法，所以它的类型应当是 `StreamCodec<FriendlyByteBuf, ChunkPos>`。`Item` 需要访问注册表，所以它的类型应当是 `StreamCodec<RegistryFriendlyByteBuf, Item>`。

大多数接收流式编解码器的方法对缓冲区类型使用 `? super B`，这意味着当缓冲区类型是 `RegistryFriendlyByteBuf` 时，上述三个例子都可以使用。

### 成员编码器 {#member-encoders}

`StreamMemberEncoder` 是 `StreamEncoder` 的一个替代方案，其中被编码的对象在前、缓冲区在后。这通常用于被编码对象自身包含一个把该对象写入缓冲区的实例方法的场景。可以通过调用 `StreamCodec#ofMember`，用 `StreamMemberEncoder` 来创建 `StreamCodec`。

```java
// Some object to create a stream codec for
public class ExampleObject {
    
    // The normal constructor
    public ExampleObject(String arg1, int arg2, boolean arg3) { /* ... */ }

    // The stream decoder reference
    public ExampleObject(ByteBuf buffer) { /* ... */ }

    // The stream encoder reference
    public void encode(ByteBuf buffer) { /* ... */ }
}

// What the stream codec would look like
public static StreamCodec<ByteBuf, ExampleObject> STREAM_CODEC =
    StreamCodec.ofMember(ExampleObject::encode, ExampleObject::new);
```

### 组合 {#composites}

流式编解码器可以通过 `StreamCodec#composite` 读写对象。每个组合流式编解码器都定义一组流式编解码器与 getter，它们按提供的顺序被读写。`composite` 的重载最多支持十二个参数。

`composite` 中每两个参数代表用于读写某字段的流式编解码器，以及从对象中取出待编码字段的 getter。最后一个参数是一个函数，用于在解码时创建对象的新实例。

```java
// Objects to create a stream codec for
public record SimpleExample(String arg1, int arg2, boolean arg3) {}
public record RegistryExample(double arg1, Holder<Item> arg2) {}

// The stream codecs
public static final StreamCodec<ByteBuf, SimpleExample> SIMPLE_STREAM_CODEC =
    StreamCodec.composite(
        // Stream codec and getter pair
        ByteBufCodecs.STRING_UTF8, SimpleExample::arg1,
        ByteBufCodecs.VAR_INT, SimpleExample::arg2,
        ByteBufCodecs.BOOL, SimpleExample::arg3,
        SimpleExample::new
    );

// Since this has a holder, a RegistryFriendlyByteBuf is used
public static final StreamCodec<RegistryFriendlyByteBuf, RegistryExample> REGISTRY_STREAM_CODEC =
    StreamCodec.composite(
        // Note that ByteBuf stream codecs can be used here
        ByteBufCodecs.DOUBLE, RegistryExample::arg1,
        ByteBufCodecs.holderRegistry(Registries.ITEM), RegistryExample::arg2,
        RegistryExample::new
    );
```

### 转换器 {#transformers}

流式编解码器可以通过映射方法转换为等价或部分等价的表示形式。其中两个映射方法作用于值，一个映射方法作用于缓冲区。

`map` 方法使用两个函数转换值：一个把当前类型转换为新类型，另一个把新类型转换回当前类型。这与 [Codec 转换器][transformers] 相对应。

```java
public static final StreamCodec<ByteBuf, Identifier> STREAM_CODEC = 
    ByteBufCodecs.STRING_UTF8.map(
        // String -> Identifier
        Identifier::new,
        // Identifier -> String
        Identifier::toString
    );
```

`apply` 方法使用 `StreamCodec.CodecOperation` 转换值。`StreamCodec.CodecOperation` 接收一个当前类型的流式编解码器并返回一个新类型的流式编解码器。它们通常包装 `map` 或接收一些辅助方法。

```java
public static final StreamCodec<ByteBuf, List<Identifier>> STREAM_CODEC =
    Identifier.STREAM_CODEC.apply(ByteBufCodecs.list());
```

`mapStream` 方法使用一个函数转换缓冲区，该函数接收新的缓冲区类型并返回当前的缓冲区类型。这个方法应当很少使用，因为大多数使用流式编解码器的方法都不需要改变缓冲区的类型。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Integer> STREAM_CODEC =
    ByteBufCodecs.VAR_INT.mapStream(buffer -> (ByteBuf) buffer);
```

### 单元 {#unit}

一个提供代码内固定值、且不编码任何内容的流式编解码器可以用 `StreamCodec#unit` 表示。当不应通过网络同步任何信息时，这很有用。

:::warning
单元流式编解码器要求任何被编码的对象都必须与指定的单元值匹配；否则会抛出错误。因此，所有对象都必须有某种对该单元对象返回 true 的 `equals` 实现，或者在编码时始终提供传给流式编解码器的那个实例。
:::

```java
public static final StreamCodec<ByteBuf, Item> UNIT_STREAM_CODEC =
    StreamCodec.unit(Items.AIR);
```
### 延迟初始化 {#lazy-initialized}

有时，流式编解码器可能依赖于在其构造时尚不存在的数据。这种情况下，可以使用 `NeoForgeStreamCodecs#lazy`，让流式编解码器在首次读写时才构造自身。该方法接收一个提供流式编解码器的 supplier。

```java
public static final StreamCodec<ByteBuf, Item> LAZY_STREAM_CODEC = 
    NeoForgeStreamCodecs.lazy(
        () -> StreamCodec.unit(Items.AIR)
    );
```

### 集合 {#collections}

集合的流式编解码器可以通过 `collection` 从对象的流式编解码器生成。`collection` 接收一个用于构造空集合的 `IntFunction`、一个对象的流式编解码器，以及一个可选的最大大小。

```java
public static final StreamCodec<ByteBuf, Set<BlockPos>> COLLECTION_STREAM_CODEC =
    ByteBufCodecs.collection(
        HashSet::new, // Constructs a set with the specified capacity
        BlockPos.STREAM_CODEC,
        256 // The set can only have up to 256 elements
    );
```

`collection` 的另一个重载可以通过 `StreamCodec#apply` 指定。

```java
public static final StreamCodec<ByteBuf, Set<BlockPos>> COLLECTION_STREAM_CODEC =
    BlockPos.STREAM_CODEC.apply(
        ByteBufCodecs.collection(HashSet::new)
    );
```

基于列表的集合也可以通过 `StreamCodec#apply` 指定，即调用带可选最大大小的 `ByteBufCodecs#list`。

```java
public static final StreamCodec<ByteBuf, List<BlockPos>> LIST_STREAM_CODEC =
    BlockPos.STREAM_CODEC.apply(
        // The list can only have up to 256 elements
        ByteBufCodecs.list(256)
    );
```

### 映射 {#map}

键值对象的映射的流式编解码器可以通过 `ByteBufCodecs#map` 用两个流式编解码器生成。该函数同样接收一个用于构造空映射的 `IntFunction` 以及一个可选的最大大小。

```java
public static final StreamCodec<ByteBuf, Map<String, BlockPos>> MAP_STREAM_CODEC =
    ByteBufCodecs.map(
        HashMap::new, // Constructs a map with the specified capacity
        ByteBufCodecs.STRING_UTF8,
        BlockPos.STREAM_CODEC,
        256 // The map can only have up to 256 elements
    );
```

### Either {#either}

针对读写某对象数据的两种不同方式，可以通过 `ByteBufCodecs#either` 从两个流式编解码器生成一个流式编解码器。该方法首先读写一个布尔值，分别指示应读写第一个还是第二个流式编解码器。

```java
public static final StreamCodec<ByteBuf, Either<Integer, String>> EITHER_STREAM_CODEC = 
    ByteBufCodecs.either(
        ByteBufCodecs.VAR_INT,
        ByteBufCodecs.STRING_UTF8
    );
```

### Id 映射器 {#id-mapper}

大多数情况下，当跨网络发送一个两端都存在的对象的信息时，发送的是一个代表 id 的整数。用 id 代表对象可以减少需要跨网络同步的信息量。枚举和注册表都利用了这一点。

`ByteBufCodecs#idMapper` 提供了一种便捷方式来为对象发送 id。它要么接收两个函数，分别把对象转换为 int 以及反过来，要么接收一个 `IdMap`。

```java
// For some enum
public enum ExampleIdObject {
    ;

    // Gets Id -> Enum
    public static final IntFunction<ExampleIdObject> BY_ID = 
        ByIdMap.continuous(
            ExampleIdObject::getId,
            ExampleIdObject.values(),
            ByIdMap.OutOfBoundsStrategy.ZERO
    );
    
    ExampleIdObject(int id) { /* ... */ }
}

// The stream codec would look like
public static final StreamCodec<ByteBuf, ExampleIdObject> ID_STREAM_CODEC =
    ByteBufCodecs.idMapper(ExampleIdObject.BY_ID, ExampleIdObject::getId);
```

### Optional {#optional}

发送一个被 `Optional` 包装的值的流式编解码器，可以通过向 `ByteBufCodecs#optional` 提供一个流式编解码器来生成。该方法首先读写一个布尔值，指示是否要读写该对象。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Optional<DataComponentType<?>>> OPTIONAL_STREAM_CODEC =
    DataComponentType.STREAM_CODEC.apply(ByteBufCodecs::optional);
```

### 注册项 {#registry-objects}

注册项可以通过三种方法之一跨网络发送：`registry`、`holderRegistry` 或 `holder`。每种方法都接收一个代表注册项所在注册表的 `ResourceKey`。

:::warning
自定义注册表必须通过调用 `RegistryBuilder#sync` 并将值设为 `true` 来使其可同步。否则，编码器将抛出异常。
:::

`registry` 和 `holderRegistry` 分别返回注册项，或被 Holder 包装的注册项。这些方法发送的是一个代表注册项的 id。

```java
// Registry object
public static final StreamCodec<RegistryFriendlyByteBuf, Item> VALUE_STREAM_CODEC =
    ByteBufCodecs.registry(Registries.ITEM);

// Holder of registry object
public static final StreamCodec<RegistryFriendlyByteBuf, Holder<Item>> HOLDER_STREAM_CODEC =
    ByteBufCodecs.holderRegistry(Registries.ITEM);
```

`holder` 返回一个被 Holder 包装的注册项。该方法发送一个代表注册项的 id；如果提供的 `Holder` 是直接引用（direct reference），则发送注册项本身。为此，`holder` 还接收该注册项的流式编解码器。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Holder<SoundEvent>> STREAM_CODEC =
    ByteBufCodecs.holder(
        Registries.SOUND_EVENT, SoundEvent.DIRECT_STREAM_CODEC
    );
```

:::note
`holder` 只有在 Holder 不是直接引用时，才会为未同步的自定义注册表抛出异常。
:::

### Holder 集合 {#holder-sets}

标签或被 Holder 包装的注册项的集合可以使用 `holderSet` 发送。它接收一个代表这些注册项所在注册表的 `ResourceKey`。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, HolderSet<Item>> HOLDER_SET_STREAM_CODEC =
    ByteBufCodecs.holderSet(Registries.ITEM);
```

### 递归 {#recursive}

有时，一个对象可能会把同类型的对象作为字段来引用。例如，`MobEffectInstance` 会接收一个可选的 `MobEffectInstance`，用于存在隐藏效果的情形。这种情况下，可以使用 `StreamCodec#recursive`，把流式编解码器作为创建该流式编解码器的函数的一部分提供进来。

```java
// Define our recursive object
public record RecursiveObject(Optional<RecursiveObject> inner) { /* ... */ }

public static final StreamCodec<ByteBuf, RecursiveObject> RECURSIVE_CODEC = StreamCodec.recursive(
    recursedStreamCodec -> StreamCodec.composite(
        recursedStreamCodec.apply(ByteBufCodecs::optional),
        RecursiveObject::inner,
        RecursiveObject::new
    )
);
```

### 分派 {#dispatch}

流式编解码器可以拥有子流式编解码器，通过 `StreamCodec#dispatch` 根据某个指定的类型来解码特定对象。这通常与代表某种类型的注册项一起使用，例如用于 `ParticleOptions` 的 `ParticleType`，或用于 `Stat` 的 `StatType`。

分派流式编解码器首先尝试读写类型对象。随后，使用方法中提供的其中一个函数来读写当前对象。第一个 `Function` 接收当前对象并取得类型以写入值。第二个 `Function` 接收类型对象并取得当前对象的 `StreamCodec` 以读取值。

```java
// Define our object(s)
public abstract class ExampleObject {

    // Define the method used to specify the object type for encoding
    public abstract StreamCodec<? super RegistryFriendlyByteBuf, ? extends ExampleObject> streamCodec();
}

// Assume there is a ResourceKey<StreamCodec<? super RegistryFriendlyByteBuf, ? extends ExampleObject>> DISPATCH
public static final StreamCodec<RegistryFriendlyByteBuf, ExampleObject> DISPATCH_STREAM_CODEC =
    ByteBufCodecs.registry(DISPATCH).dispatch(
        // Get the stream codec from the specific object
        ExampleObject::streamCodec,
        // Get the stream codec from the registry object
        Function.identity()
    );
```

[networking]: payload.md
[codecs]: ../datastorage/codecs.md
[blockentity]: ../blockentities/index.md#syncing-on-block-update
[entity]: ../entities/data.md
[transformers]: ../datastorage/codecs.md#transformers

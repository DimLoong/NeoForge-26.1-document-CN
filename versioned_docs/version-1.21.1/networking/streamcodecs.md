---
sidebar_position: 2
---
# 流式编解码器 {#stream-codecs}

流式编解码器（Stream Codec）是一种序列化工具，用于描述对象应如何存入流（例如缓冲区）以及如何从流中读出。流式编解码器主要被原版的[网络通信系统][networking]用于同步数据。

:::info
由于流式编解码器与 [Codec][codecs] 大致对应，本页采用了与其相同的编排方式，以便展示二者的相似之处。
:::

## 使用流式编解码器 {#using-stream-codecs}

流式编解码器分别通过 `StreamCodec#encode` 和 `StreamCodec#decode` 把对象编码进某个流、或从流中解码。 `encode` 接收流以及要编码进流的对象。 `decode` 接收流并返回解码得到的对象。通常，流要么是 `ByteBuf`、要么是 `FriendlyByteBuf`、要么是 `RegistryFriendlyByteBuf`。

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
除非你在手动处理缓冲区对象，否则一般永远不会直接调用 `encode` 和 `decode`。
:::

## 现有的流式编解码器 {#existing-stream-codecs}

### `ByteBufCodecs` {#bytebufcodecs}

`ByteBufCodecs` 中包含了针对某些基本类型和对象的 Codec 静态实例。

| 流式编解码器   | Java 类型     |
|----------------|---------------|
| `BOOL`         | `Boolean`     |
| `BYTE`         | `Byte`        |
| `SHORT`        | `Short`       |
| `INT`          | `Integer`     |
| `FLOAT`        | `Float`       |
| `DOUBLE`       | `Double`      |
| `BYTE_ARRAY`   | `byte[]`\*    |
| `STRING_UTF8`  | `String`\*\*  |
| `TAG`          | `Tag`         |
| `COMPOUND_TAG` | `CompoundTag` |
| `VECTOR3F`     | `Vector3f`    |
| `QUATERNIONF`  | `Quaternionf` |
| `GAME_PROFILE` | `GameProfile` |

\* `byte[]` 可以通过 `ByteBufCodecs#byteArray` 限制为某个数量以内的值。

\* `String` 可以通过 `ByteBufCodecs#stringUtf8` 限制为某个字符数以内。

此外，还有一些静态实例采用不同的方式来编解码基本类型和对象。

#### 无符号短整型 {#unsigned-shorts}

`UNSIGNED_SHORT` 是 `SHORT` 的一个变体，用于按无符号数处理。由于 Java 中的数值都是有符号的，无符号短整型在收发时会被当作高两个字节被掩掉的 `Integer`。

#### 变长数字 {#variable-sized-number}

`VAR_INT` 和 `VAR_LONG` 是把值编码得尽可能小的流式编解码器。做法是每次编码七个比特，并用最高位作为标记，表示该数字是否还有后续数据。对于整型，介于 0 与 2^28-1 之间的数；对于长整型，介于 0 与 2^56-1 之间的数，其发送长度会分别小于或等于一个整型或长整型所占的字节数。如果你的数值通常落在这个范围内、且一般处于其较小的一端，就应当使用这些变长流式编解码器。

:::note
`VAR_INT` 是 `INT` 的一个替代选项。
:::

#### 受信任标签 {#trusted-tags}

`TRUSTED_TAG` 和 `TRUSTED_COMPOUND_TAG` 分别是 `TAG` 和 `COMPOUND_TAG` 的变体，相比 `TAG` 和 `COMPOUND_TAG` 的 2MiB 上限，它们在把标签解码到堆时没有大小限制。受信任标签流式编解码器理想情况下只应用于客户端方向（clientbound）的数据包，比如原版对[方块实体数据包][blockentity]和[实体数据序列化器][entityserializer]的处理方式。

如果需要使用不同的限制，可以通过 `ByteBufCodecs#tagCodec` 或 `#compoundTagCodec` 提供一个指定大小的 `NbtAccounter`。

### 原版与 NeoForge {#vanilla-and-neoforge}

Minecraft 和 NeoForge 为许多需要频繁编解码的对象定义了大量流式编解码器。例如针对 `ResourceLocation` 的 `ResourceLocation#STREAM_CODEC`，或针对 `ChunkPos` 的 `NeoForgeStreamCodecs#CHUNK_POS`。

大多数流式编解码器都能在对象类自身中，或在 `StreamCodec`、 `ByteBufCodecs`、 `NeoForgeStreamCodecs` 中找到。

## 创建流式编解码器 {#creating-stream-codecs}

可以创建流式编解码器来把任意对象读写到流。本文将聚焦于以缓冲区作为流的情况，因为这是它的主要用途。

流式编解码器有两个泛型：`B` 代表缓冲区，`V` 代表对象值。 `B` 通常是三种类型之一：`ByteBuf`、 `FriendlyByteBuf`、 `RegistryFriendlyByteBuf`，它们逐级继承。 `FriendlyByteBuf` 增加了 Minecraft 专用的读写方法，而 `RegistryFriendlyByteBuf` 则提供对注册表列表及其对象的访问。

构造流式编解码器时，`B` 应当取最不具体的缓冲区类型。例如，`ResourceLocation` 以字符串形式发送。由于普通的 `ByteBuf` 就支持字符串，其类型应为 `StreamCodec<ByteBuf, ResourceLocation>`。 `FriendlyByteBuf` 包含写入 `ChunkPos` 的方法，所以它的类型应为 `StreamCodec<FriendlyByteBuf, ChunkPos>`。 `Item` 需要访问注册表，所以它的类型应为 `StreamCodec<RegistryFriendlyByteBuf, Item>`。

大多数接收流式编解码器的方法对缓冲区类型的要求是 `? super B`，这意味着当缓冲区类型为 `RegistryFriendlyByteBuf` 时，上述三个示例都可以使用。

### 成员编码器 {#member-encoders}

`StreamMemberEncoder` 是 `StreamEncoder` 的一个替代选项，区别在于被编码的对象在前、缓冲区在后。当被编码对象自身包含一个把对象写入缓冲区的实例方法时，通常会用到它。可以通过调用 `StreamCodec#ofMember`，用 `StreamMemberEncoder` 创建 `StreamCodec`。

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

流式编解码器可以通过 `StreamCodec#composite` 读写对象。每个组合式流式编解码器定义了一组流式编解码器和取值器（getter），并按提供的顺序读/写。 `composite` 有最多支持六个参数的重载。

`composite` 中每两个参数为一组，分别代表用于读/写该字段的流式编解码器，以及从对象中取出待编码字段的取值器。最后一个参数是一个函数，用于在解码时创建对象的新实例。

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

流式编解码器可以借助映射方法，被转换为等价或部分等价的表示形式。其中两个映射方法作用于值，一个映射方法作用于缓冲区。

`map` 方法通过两个函数来转换值：一个把当前类型转换为新类型，另一个把新类型转换回当前类型。这与 [Codec 转换器][transformers]相对应。

```java
public static final StreamCodec<ByteBuf, ResourceLocation> STREAM_CODEC = 
    ByteBufCodecs.STRING_UTF8.map(
        // String -> ResourceLocation
        ResourceLocation::new,
        // ResourceLocation -> String
        ResourceLocation::toString
    );
```

`apply` 方法使用 `StreamCodec.CodecOperation` 来转换值。 `StreamCodec.CodecOperation` 接收当前类型的流式编解码器，并返回新类型的流式编解码器。它们通常是对 `map` 的包装，或接收一些辅助方法。

```java
public static final StreamCodec<ByteBuf, List<ResourceLocation>> STREAM_CODEC =
    ResourceLocation.STREAM_CODEC.apply(ByteBufCodecs.list());
```

`mapStream` 方法使用一个函数来转换缓冲区，该函数接收新的缓冲区类型并返回当前的缓冲区类型。该方法应当很少使用，因为大多数用到流式编解码器的方法都无需改变缓冲区的类型。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Integer> STREAM_CODEC =
    ByteBufCodecs.VAR_INT.mapStream(buffer -> (ByteBuf) buffer);
```

### 单元 {#unit}

可以用 `StreamCodec#unit` 表示这样一种流式编解码器：它提供一个代码中的固定值，且不编码任何内容。当无需在网络上同步任何信息时，这很有用。

:::warning
单元流式编解码器要求任何被编码的对象都必须与所指定的单元值一致；否则会抛出错误。因此，所有对象都必须有某种 `equals` 实现，能对该单元对象返回 true；或者确保编码时始终传入的就是提供给该流式编解码器的那个实例。
:::

```java
public static final StreamCodec<ByteBuf, Item> UNIT_STREAM_CODEC =
    StreamCodec.unit(Items.AIR);
```
### 延迟初始化 {#lazy-initialized}

有时，流式编解码器可能依赖于构造它时尚不存在的数据。在这种情况下，可以用 `NeoForgeStreamCodecs#lazy` 让流式编解码器在首次读/写时才构造自身。该方法接收一个提供流式编解码器的 Supplier。

```java
public static final StreamCodec<ByteBuf, Item> LAZY_STREAM_CODEC = 
    NeoForgeStreamCodecs.lazy(
        () -> StreamCodec.unit(Items.AIR)
    );
```

### 集合 {#collections}

可以通过 `collection` 从对象的流式编解码器生成集合（collection）的流式编解码器。 `collection` 接收一个构造空集合的 `IntFunction`、对象的流式编解码器，以及一个可选的最大大小。

```java
public static final StreamCodec<ByteBuf, Set<BlockPos>> COLLECTION_STREAM_CODEC =
    ByteBufCodecs.collection(
        HashSet::new, // Constructs a set with the specified capacity
        BlockPos.STREAM_CODEC,
        256 // The set can only have up to 256 elements
    );
```

`collection` 的另一个重载可以搭配 `StreamCodec#apply` 使用。

```java
public static final StreamCodec<ByteBuf, Set<BlockPos>> COLLECTION_STREAM_CODEC =
    BlockPos.STREAM_CODEC.apply(
        ByteBufCodecs.collection(HashSet::new)
    );
```

基于 List 的集合也可以通过 `StreamCodec#apply` 指定，调用 `ByteBufCodecs#list` 并可选地传入一个最大大小。

```java
public static final StreamCodec<ByteBuf, List<BlockPos>> LIST_STREAM_CODEC =
    BlockPos.STREAM_CODEC.apply(
        // The list can only have up to 256 elements
        ByteBufCodecs.list(256)
    );
```

### 映射表 {#map}

可以通过 `ByteBufCodecs#map`，用两个流式编解码器生成一个键值对象映射表（Map）的流式编解码器。该函数还接收一个构造空映射表的 `IntFunction`，以及一个可选的最大大小。

```java
public static final StreamCodec<ByteBuf, Map<String, BlockPos>> MAP_STREAM_CODEC =
    ByteBufCodecs.map(
        HashMap::new, // Constructs a map with the specified capacity
        ByteBufCodecs.STRING_UTF8,
        BlockPos.STREAM_CODEC,
        256 // The map can only have up to 256 elements
    );
```

### 二选一 {#either}

可以通过 `ByteBufCodecs#either`，用两个流式编解码器生成一个流式编解码器，以两种不同方式读/写某对象数据。该方法会先读/写一个布尔值，表示接下来应分别读/写第一个还是第二个流式编解码器。

```java
public static final StreamCodec<ByteBuf, Either<Integer, String>> EITHER_STREAM_CODEC = 
    ByteBufCodecs.either(
        ByteBufCodecs.VAR_INT,
        ByteBufCodecs.STRING_UTF8
    );
```

### ID 映射器 {#id-mapper}

大多数情况下，当在网络上发送信息、且某对象在两端都存在时，会发送一个代表 ID 的整数。用 ID 代表对象可以减少需要在网络上同步的信息量。枚举和注册表都利用了这一点。

`ByteBufCodecs#idMapper` 提供了一种便捷方式来发送对象的 ID。它要么接收两个把对象转成 int、以及把 int 转回对象的函数，要么接收一个 `IdMap`。

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

:::note
NeoForge 通过 `IExtensibleEnum#createStreamCodecForExtensibleEnum` 为 ID 映射器提供了一个替代方案，它在构造时不缓存枚举值。不过，除可扩展枚举外，这个方案很少需要用到。
:::

### 可选 {#optional}

可以通过给 `ByteBufCodecs#optional` 提供一个流式编解码器，生成用于发送 `Optional` 包装值的流式编解码器。该方法会先读/写一个布尔值，表示是否要读/写该对象。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Optional<DataComponentType<?>>> OPTIONAL_STREAM_CODEC =
    DataComponentType.STREAM_CODEC.apply(ByteBufCodecs::optional);
```

### 注册项 {#registry-objects}

注册项（registry object）可以通过三种方法之一在网络上发送：`registry`、 `holderRegistry` 或 `holder`。每种方法都接收一个 `ResourceKey`，代表该注册项所在的注册表。

:::warning
自定义注册表必须通过调用 `RegistryBuilder#sync` 并将值设为 `true` 来使其可同步。否则，编码器会抛出异常。
:::

`registry` 和 `holderRegistry` 分别返回注册项、或经 Holder 包装的注册项。这些方法在网络上发送一个代表注册项的 ID。

```java
// Registry object
public static final StreamCodec<RegistryFriendlyByteBuf, Item> VALUE_STREAM_CODEC =
    BytebufCodecs.registry(Registries.ITEM);

// Holder of registry object
public static final StreamCodec<RegistryFriendlyByteBuf, Holder<Item>> HOLDER_STREAM_CODEC =
    BytebufCodecs.holderRegistry(Registries.ITEM);
```

`holder` 返回经 Holder 包装的注册项。该方法在网络上发送一个代表注册项的 ID；若提供的 `Holder` 是直接引用（direct reference），则发送注册项本身。为此，`holder` 还接收该注册项的流式编解码器。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Holder<SoundEvent>> STREAM_CODEC =
    ByteBufCodecs.holder(
        Registries.SOUND_EVENT, SoundEvent.DIRECT_STREAM_CODEC
    );
```

:::note
对于未同步的自定义注册表，只有当 Holder 不是直接引用时，`holder` 才会抛出异常。
:::

### Holder 集合 {#holder-sets}

标签，或经 Holder 包装的注册项集合，可以通过 `holderSet` 发送。它接收一个 `ResourceKey`，代表这些注册项所在的注册表。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, HolderSet<Item>> HOLDER_SET_STREAM_CODEC =
    BytebufCodecs.holderSet(Registries.ITEM);
```

### 递归 {#recursive}

有时，一个对象可能会把与自身相同类型的对象作为字段来引用。例如，`MobEffectInstance` 在存在隐藏效果时会接收一个可选的 `MobEffectInstance`。在这种情况下，可以用 `StreamCodec#recursive`，把流式编解码器作为创建该流式编解码器的函数的一部分提供进去。

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

流式编解码器可以拥有子流式编解码器，通过 `StreamCodec#dispatch` 根据某个指定的类型来解码特定对象。这通常与代表某种类型的注册项搭配使用，比如用于 `ParticleOptions` 的 `ParticleType`，或用于 `Stat` 的 `StatType`。

分派式流式编解码器会先尝试读/写类型对象。随后，使用方法中提供的某个函数读/写当前对象。第一个 `Function` 接收当前对象，取出其类型以写入值。第二个 `Function` 接收类型对象，取出当前对象的 `StreamCodec` 以读取值。

```java
// Define our object(s)
public abstract class ExampleObject {

    // Define the method used to specify the object type for encoding
    public abstract StreamCodec<? super RegistryFriendlyByteBuf, ? extends ExampleObject> streamCodec();
}

// Assume there is a ResourceKey<StreamCodec< super RegistryFriendlyByteBuf, ? extends ExampleObject>> DISPATCH
public static final StreamCodec<RegistryFriendlyByteBuf, ExampleObject> DISPATCH_STREAM_CODEC =
    ByteBufCodecs.registry(DISPATCH).dispatch(
        // Get the stream codec from the specific object
        ExampleObject::streamCodec,
        // Get the stream codec from the registry object
        Function.identity()
    )
```

[networking]: ./payload.md
[codecs]: ../datastorage/codecs.md
[blockentity]: ../blockentities/index.md#synchronizing-on-block-update
[entityserializer]: ../networking/entities.md#dynamic-data-parameters
[transformers]: ../datastorage/codecs.md#transformers

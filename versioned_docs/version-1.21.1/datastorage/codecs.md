---
sidebar_position: 2
---
# Codec {#codecs}

Codec 是来自 Mojang [DataFixerUpper] 的一种序列化工具，用于描述对象如何在不同格式之间相互转换，例如面向 JSON 的 `JsonElement` 和面向 NBT 的 `Tag`。

## 使用 Codec {#using-codecs}

Codec 主要用于将 Java 对象编码（序列化）为某种数据格式类型，以及将格式化后的数据对象解码（反序列化）回其对应的 Java 类型。这通常分别通过 `Codec#encodeStart` 和 `Codec#parse` 来完成。

### 动态操作 {#dynamicops}

为了确定要编码和解码到哪种中间文件格式，`#encodeStart` 和 `#parse` 都需要一个 `DynamicOps` 实例来定义该格式中的数据。

[DataFixerUpper] 库包含 `JsonOps`，用于对存储在 [`Gson`][gson] 的 `JsonElement` 实例中的 JSON 数据进行编解码。 `JsonOps` 支持两种版本的 `JsonElement` 序列化：`JsonOps#INSTANCE` 定义标准 JSON 文件，`JsonOps#COMPRESSED` 则允许将数据压缩为单个字符串。

```java
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let exampleJson be a JsonElement

// Encode Java object to regular JsonElement
exampleCodec.encodeStart(JsonOps.INSTANCE, exampleObject);

// Encode Java object to compressed JsonElement
exampleCodec.encodeStart(JsonOps.COMPRESSED, exampleObject);

// Decode JsonElement into Java object
// Assume JsonElement was parsed normally
exampleCodec.parse(JsonOps.INSTANCE, exampleJson);
```

Minecraft 还提供了 `NbtOps`，用于对存储在 `Tag` 实例中的 NBT 数据进行编解码。它可以通过 `NbtOps#INSTANCE` 引用。

```java
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let exampleNbt be a Tag

// Encode Java object to Tag
exampleCodec.encodeStart(NbtOps.INSTANCE, exampleObject);

// Decode Tag into Java object
exampleCodec.parse(NbtOps.INSTANCE, exampleNbt);
```

为处理注册项，Minecraft 提供了 `RegistryOps`，它包含一个用于获取可用注册元素的查找提供器（lookup provider）。它可以通过 `RegistryOps#create` 创建，该方法接收一个用于指定数据存储类型的 `DynamicOps`，以及一个能访问可用注册表的查找提供器。 NeoForge 扩展了 `RegistryOps`，创建了 `ConditionalOps`：一种能处理[加载注册项条件][conditions]的注册表 codec 查找器。

```java
// Let lookupProvider be a HolderLookup.Provider
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let exampleJson be a JsonElement

// Get the registry ops for JsonElement
RegistryOps<JsonElement> ops = RegistryOps.create(JsonOps.INSTANCE, lookupProvider);

// Encode Java object to JsonElement
exampleCodec.encodeStart(ops, exampleObject);

// Decode JsonElement into Java object
exampleCodec.parse(ops, exampleJson);
```

#### 格式转换 {#format-conversion}

`DynamicOps` 也可以单独用于在两种不同的编码格式之间转换。这可以通过 `#convertTo` 实现，并提供目标 `DynamicOps` 格式以及要转换的已编码对象。

```java
// Convert Tag to JsonElement
// Let exampleTag be a Tag
JsonElement convertedJson = NbtOps.INSTANCE.convertTo(JsonOps.INSTANCE, exampleTag);
```

### 数据结果 {#dataresult}

使用 codec 编码或解码得到的数据会返回一个 `DataResult`，它根据转换是否成功而持有转换后的实例或某些错误数据。当转换成功时，`#result` 提供的 `Optional` 将包含成功转换后的对象。若转换失败，`#error` 提供的 `Optional` 将包含 `PartialResult`，其中持有错误消息以及一个部分转换的对象（具体取决于 codec）。

此外，`DataResult` 上还有许多方法可用于将结果或错误转换为所需格式。例如，`#resultOrPartial` 在成功时返回包含结果的 `Optional`，失败时返回部分转换的对象。该方法接收一个字符串消费者，用于决定在错误消息存在时如何上报它。

```java
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleJson be a JsonElement

// Decode JsonElement into Java object
DataResult<ExampleJavaObject> result = exampleCodec.parse(JsonOps.INSTANCE, exampleJson);

result
    // Get result or partial on error, report error message
    .resultOrPartial(errorMessage -> /* Do something with error message */)
    // If result or partial is present, do something
    .ifPresent(decodedObject -> /* Do something with decoded object */);
```

## 现有的 Codec {#existing-codecs}

### 基本类型 {#primitives}

`Codec` 类包含针对若干既定基本类型的静态 codec 实例。

Codec         | Java 类型
:---:         | :---
`BOOL`        | `Boolean`
`BYTE`        | `Byte`
`SHORT`       | `Short`
`INT`         | `Integer`
`LONG`        | `Long`
`FLOAT`       | `Float`
`DOUBLE`      | `Double`
`STRING`      | `String`\*
`BYTE_BUFFER` | `ByteBuffer`
`INT_STREAM`  | `IntStream`
`LONG_STREAM` | `LongStream`
`PASSTHROUGH` | `Dynamic<?>`\*\*
`EMPTY`       | `Unit`\*\*\*

\* `String` 可以通过 `Codec#string` 或 `Codec#sizeLimitedString` 限制为特定字符数。

\*\* `Dynamic` 是一个持有以受支持的 `DynamicOps` 格式编码的值的对象。它们通常用于将一种已编码的对象格式转换为另一种已编码的对象格式。

\*\*\* `Unit` 是一个用于表示 `null` 对象的对象。

### 原版与 NeoForge {#vanilla-and-neoforge}

Minecraft 和 NeoForge 为频繁编解码的对象定义了许多 codec。例如：面向 `ResourceLocation` 的 `ResourceLocation#CODEC`、面向 `DateTimeFormatter#ISO_INSTANT` 格式 `Instant` 的 `ExtraCodecs#INSTANT_ISO8601`，以及面向 `CompoundTag` 的 `CompoundTag#CODEC`。

:::caution
`CompoundTag` 无法使用 `JsonOps` 从 JSON 解码数字列表。 `JsonOps` 在转换时会把数字设为其最窄的类型。而 `ListTag` 会强制其数据使用一种特定类型，因此当数字类型不一致时（例如 `64` 会是 `byte`、 `384` 会是 `short`）会在转换时抛出错误。
:::

原版和 NeoForge 的注册表也具有针对其所含对象类型的 codec（例如 `BuiltInRegistries#BLOCK` 拥有一个 `Codec<Block>`）。 `Registry#byNameCodec` 会将注册对象编码为它们的注册名。原版注册表还有一个 `Registry#holderByNameCodec`，它编码为注册名，并解码为包裹在 `Holder` 中的注册对象。

## 创建 Codec {#creating-codecs}

Codec 可以为编码和解码任意对象而创建。为便于理解，下文会同时展示对应的编码后 JSON。

### 记录（Records） {#records}

Codec 可以借助记录（record）来定义对象。每个记录 codec 都以显式命名的字段来定义任意对象。创建记录 codec 有多种方式，但最简单的是通过 `RecordCodecBuilder#create`。

`RecordCodecBuilder#create` 接收一个函数，该函数定义一个 `Instance` 并返回该对象的应用（application，`App`）。这可以类比为创建一个类的*实例*（instance），以及用于将类*应用*（apply）到所构造对象上的构造函数。

```java
// Some object to create a codec for
public class SomeObject {

    public SomeObject(String s, int i, boolean b) { /* ... */ }

    public String s() { /* ... */ }

    public int i() { /* ... */ }

    public boolean b() { /* ... */ }
}
```

#### 字段（Fields） {#fields}

一个 `Instance` 可以通过 `#group` 定义最多 16 个字段。每个字段都必须是一个应用（application），用以定义正在为其构造对象的实例以及该对象的类型。满足这一要求最简单的方式是：取一个 `Codec`，设置要从中解码的字段名，并设置用于编码该字段的 getter。

可以从 `Codec` 使用 `#fieldOf`（若字段为必需）或 `#optionalFieldOf`（若字段包裹在 `Optional` 中或带有默认值）来创建字段。这两个方法都需要一个字符串，即该字段在编码后对象中的名称。随后可以用 `#forGetter` 设置用于编码该字段的 getter，它接收一个函数——给定对象即返回该字段的数据。

:::warning
`#optionalFieldOf` 在解析时若遇到某个元素抛出错误，会抛出错误。如果希望吞掉该错误，请改用 `#lenientOptionalFieldOf`。
:::

据此，得到的成品（product）可以通过 `#apply` 加以应用，以定义实例应如何为此次应用构造对象。为方便起见，分组后的字段应按照它们在构造函数中出现的相同顺序列出，这样该函数就可以直接是一个构造函数方法引用。

```java
public static final Codec<SomeObject> RECORD_CODEC = RecordCodecBuilder.create(instance -> // Given an instance
    instance.group( // Define the fields within the instance
        Codec.STRING.fieldOf("s").forGetter(SomeObject::s), // String
        Codec.INT.optionalFieldOf("i", 0).forGetter(SomeObject::i), // Integer, defaults to 0 if field not present
        Codec.BOOL.fieldOf("b").forGetter(SomeObject::b) // Boolean
    ).apply(instance, SomeObject::new) // Define how to create the object
);
```

```json5
// Encoded SomeObject
{
    "s": "value",
    "i": 5,
    "b": false
}

// Another encoded SomeObject
{
    "s": "value2",
    // i is omitted, defaults to 0
    "b": true
}

// Another encoded SomeObject
{
    "s": "value2",
    // Will throw an error as lenientOptionalFieldOf is not used
    "i": "bad_value",
    "b": true
}
```

### 转换器（Transformers） {#transformers}

Codec 可以通过映射方法转换为等价或部分等价的表示形式。每个映射方法都接收两个函数：一个将当前类型转换为新类型，另一个将新类型转换回当前类型。这通过 `#xmap` 函数完成。

```java
// A class
public class ClassA {

    public ClassB toB() { /* ... */ }
}

// Another equivalent class
public class ClassB {

    public ClassA toA() { /* ... */ }
}

// Assume there is some codec A_CODEC
public static final Codec<ClassB> B_CODEC = A_CODEC.xmap(ClassA::toB, ClassB::toA);
```

如果类型是部分等价的，即转换过程中存在一些限制，则有一些映射函数会返回 `DataResult`，可用于在遇到异常或无效状态时返回错误状态。

A 是否完全等价于 B | B 是否完全等价于 A | 转换方法
:---:              | :---:              | :---
是                 | 是                 | `#xmap`
是                 | 否                 | `#flatComapMap`
否                 | 是                 | `#comapFlatMap`
否                 | 否                 | `#flatXMap`

```java
// Given an string codec to convert to a integer
// Not all strings can become integers (A is not fully equivalent to B)
// All integers can become strings (B is fully equivalent to A)
public static final Codec<Integer> INT_CODEC = Codec.STRING.comapFlatMap(
    s -> { // Return data result containing error on failure
        try {
            return DataResult.success(Integer.valueOf(s));
        } catch (NumberFormatException e) {
            return DataResult.error(s + " is not an integer.");
        }
    },
    Integer::toString // Regular function
);
```

```json5
// Will return 5
"5"

// Will error, not an integer
"value"
```

#### 范围 Codec（Range Codecs） {#range-codecs}

范围 codec 是 `#flatXMap` 的一种实现：如果值不在设定的最小值和最大值（含端点）之间，则返回一个错误 `DataResult`。即使值超出边界，它仍会作为部分结果提供。分别通过 `#intRange`、 `#floatRange` 和 `#doubleRange` 提供了针对整数、浮点数和双精度浮点数的实现。

```java
public static final Codec<Integer> RANGE_CODEC = Codec.intRange(0, 4); 
```

```json5
// Will be valid, inside [0, 4]
4

// Will error, outside [0, 4]
5
```

#### 字符串解析器（String Resolver） {#string-resolver}

`Codec#stringResolver` 是 `flatXmap` 的一种实现，它将字符串映射到某种对象。

```java
public record StringResolverObject(String name) { /* ... */ }

// Assume there is some Map<String, StringResolverObject> OBJECT_MAP
public static final Codec<StringResolverObject> STRING_RESOLVER_CODEC = Codec.stringResolver(StringResolverObject::name, OBJECT_MAP::get);
```

```json5
// Will map this string to its associated object
"example_name"
```

### 默认值（Defaults） {#defaults}

如果编码或解码的结果失败，可以通过 `Codec#orElse` 或 `Codec#orElseGet` 改为提供一个默认值。

```java
public static final Codec<Integer> DEFAULT_CODEC = Codec.INT.orElse(
    errorMessage -> /* Do something with the error message */,
    0 // Can also be a supplied value via #orElseGet
); 
```

```json5
// Not an integer, defaults to 0
"value"
```

### 单位 {#unit}

一个提供代码内值且编码为空的 codec 可以用 `Codec#unit` 表示。当某个 codec 在数据对象中使用了不可编码的条目时，这很有用。

```java
public static final Codec<IEventBus> UNIT_CODEC = Codec.unit(
    () -> NeoForge.EVENT_BUS // Can also be a raw value
);
```

```json5
// Nothing here, will return the NeoForge event bus
```

### 延迟初始化（Lazy Initialized） {#lazy-initialized}

有时，某个 codec 可能依赖于在其构造时尚不存在的数据。在这种情况下，可以使用 `Codec#lazyInitialized`，让 codec 在首次编码/解码时才构造自身。该方法接收一个提供 codec 的 Supplier。

```java
public static final Codec<IEventBus> LAZY_CODEC = Codec.lazyInitialized(
    () -> Codec.Unit(NeoForge.EVENT_BUS)
);
```

```json5
// Nothing here, will return the NeoForge event bus
// Encodes/decodes the same way as the normal codec
```

### 列表（List） {#list}

一个对象列表的 codec 可以通过 `Codec#listOf` 从对象 codec 生成。 `listOf` 也可以接收两个整数，分别表示列表的最小和最大长度。 `sizeLimitedListOf` 作用相同，但只指定最大上限。

```java
// BlockPos#CODEC is a Codec<BlockPos>
public static final Codec<List<BlockPos>> LIST_CODEC = BlockPos.CODEC.listOf();
```

```json5
// Encoded List<BlockPos>
[
    [1, 2, 3], // BlockPos(1, 2, 3)
    [4, 5, 6], // BlockPos(4, 5, 6)
    [7, 8, 9]  // BlockPos(7, 8, 9)
]
```

使用列表 codec 解码得到的列表对象存储在一个**不可变**列表中。如果需要可变列表，应对列表 codec 应用一个[转换器][transformer]。

### 映射（Map） {#map}

一个由键和值对象组成的映射的 codec 可以通过 `Codec#unboundedMap` 从两个 codec 生成。无界映射（unbounded map）可以指定任何基于字符串或经字符串转换的值作为键。

```java
// BlockPos#CODEC is a Codec<BlockPos>
public static final Codec<Map<String, BlockPos>> MAP_CODEC = Codec.unboundedMap(Codec.STRING, BlockPos.CODEC);
```

```json5
// Encoded Map<String, BlockPos>
{
    "key1": [1, 2, 3], // key1 -> BlockPos(1, 2, 3)
    "key2": [4, 5, 6], // key2 -> BlockPos(4, 5, 6)
    "key3": [7, 8, 9]  // key3 -> BlockPos(7, 8, 9)
}
```

使用无界映射 codec 解码得到的映射对象存储在一个**不可变**映射中。如果需要可变映射，应对映射 codec 应用一个[转换器][transformer]。

:::caution
无界映射仅支持能与字符串相互编解码的键。可以使用键值[对][pair]列表 codec 来绕过这一限制。
:::

### 对（Pair） {#pair}

一个对象对（pair）的 codec 可以通过 `Codec#pair` 从两个 codec 生成。

对 codec 解码对象的方式是：先解码对中的左侧对象，然后取编码后对象的剩余部分并从中解码右侧对象。因此，这些 codec 要么在解码后能表达出关于编码后对象的某些信息（例如[记录][records]），要么必须被增补为 `MapCodec` 并通过 `#codec` 转换回普通 codec。这通常可以通过把该 codec 作为某个对象的[字段][field]来实现。

```java
public static final Codec<Pair<Integer, String>> PAIR_CODEC = Codec.pair(
    Codec.INT.fieldOf("left").codec(),
    Codec.STRING.fieldOf("right").codec()
);
```

```json5
// Encoded Pair<Integer, String>
{
    "left": 5,       // fieldOf looks up 'left' key for left object
    "right": "value" // fieldOf looks up 'right' key for right object
}
```

:::tip
带有非字符串键的映射 codec 可以通过应用了[转换器][transformer]的键值对列表来进行编解码。
:::

### 二选一 {#either}

一个可用两种不同方式对某对象数据进行编解码的 codec，可以通过 `Codec#either` 从两个 codec 生成。

either codec 会先尝试用第一个 codec 解码对象。如果失败，则尝试用第二个 codec 解码。如果这也失败，那么 `DataResult` 将仅包含第二个 codec 失败时的错误。

```java
public static final Codec<Either<Integer, String>> EITHER_CODEC = Codec.either(
    Codec.INT,
    Codec.STRING
);
```

```json5
// Encoded Either.Left<Integer, String>
5

// Encoded Either.Right<Integer, String>
"value"
```

:::tip
这可以与[转换器][transformer]配合使用，从两种不同的编码方式中得到一个特定对象。
:::

#### 异或 {#xor}

`Codec#xor` 是 [either][either] codec 的一个特例：仅当两种方式中恰有一种被成功处理时，结果才算成功。如果两个 codec 都能被处理，则改为抛出错误。

```java
public static final Codec<Either<Integer, String>> XOR_CODEC = Codec.xor(
    Codec.INT.fieldOf("number").codec(),
    Codec.STRING.fieldOf("text").codec()
);
```

```json5
// Encoded Either.Left<Integer, String>
{
    "number": 4
}

// Encoded Either.Right<Integer, String>
{
    "text": "value"
}

// Throws an error as both can be decoded
{
    "number": 4,
    "text": "value"
}
```

#### 备选（Alternative） {#alternative}

`Codec#withAlternative` 是 [either][either] codec 的一个特例：两个 codec 都试图解码同一个对象，只是存储格式不同。第一个（即主）codec 会尝试解码该对象。失败时，改用第二个 codec。编码则始终使用主 codec。

```java
public static final Codec<BlockPos> ALTERNATIVE_CODEC = Codec.withAlternative(
    BlockPos.CODEC,
    RecordCodecBuilder.create(instance -> instance.group(
        Codec.INT.fieldOf("x").forGetter(BlockPos::getX),
        Codec.INT.fieldOf("y").forGetter(BlockPos::getY),
        Codec.INT.fieldOf("z").forGetter(BlockPos::getZ)
    ), BlockPos::new)
);
```

```json5
// Normal method to decode BlockPos
[ 1, 2, 3 ]

// Alternative method to decode BlockPos
{
    "x": 1,
    "y": 2,
    "z": 3
}
```

### 递归（Recursive） {#recursive}

有时，一个对象可能会将同类型的对象作为字段来引用。例如，`EntityPredicate` 会为载具、乘客和目标实体接收一个 `EntityPredicate`。在这种情况下，可以使用 `Codec#recursive`，将 codec 作为一个用于创建该 codec 的函数的一部分来提供。

```java
// Define our recursive object
public record RecursiveObject(Optional<RecursiveObject> inner) { /* ... */ }

public static final Codec<RecursiveObject> RECURSIVE_CODEC = Codec.recursive(
    RecursiveObject.class.getSimpleName(), // This is for the toString method
    recursedCodec -> RecordCodecBuilder.create(instance -> instance.group(
        recursedCodec.optionalFieldOf("inner").forGetter(RecursiveObject::inner)
    ).apply(instance, RecursiveObject::new))
);
```

```json5
// An encoded recursive object
{
    "inner": {
        "inner": {}
    }
}
```

### 分派（Dispatch） {#dispatch}

Codec 可以拥有子 codec，通过 `Codec#dispatch` 根据某个指定的类型来解码特定对象。这通常用于包含 codec 的注册表中，例如规则测试（rule tests）或方块放置器（block placers）。

分派 codec 首先尝试从某个字符串键（通常是 `type`）获取编码后的类型。随后解码该类型，并调用一个 getter 来获取用于解码实际对象的具体 codec。如果用于解码对象的 `DynamicOps` 会压缩其映射，或者对象 codec 本身未被增补为 `MapCodec`（例如记录或带字段的基本类型），那么该对象需要存储在 `value` 键中。否则，该对象会与其余数据在同一层级被解码。

```java
// Define our object
public abstract class ExampleObject {

    // Define the method used to specify the object type for encoding
    public abstract MapCodec<? extends ExampleObject> type();
}

// Create simple object which stores a string
public class StringObject extends ExampleObject {

    public StringObject(String s) { /* ... */ }

    public String s() { /* ... */ }

    public MapCodec<? extends ExampleObject> type() {
        // A registered registry object
        // "string":
        //   Codec.STRING.xmap(StringObject::new, StringObject::s).fieldOf("string")
        return STRING_OBJECT_CODEC.get();
    }
}

// Create complex object which stores a string and integer
public class ComplexObject extends ExampleObject {

    public ComplexObject(String s, int i) { /* ... */ }

    public String s() { /* ... */ }

    public int i() { /* ... */ }

    public MapCodec<? extends ExampleObject> type() {
        // A registered registry object
        // "complex":
        //   RecordCodecBuilder.mapCodec(instance ->
        //     instance.group(
        //       Codec.STRING.fieldOf("s").forGetter(ComplexObject::s),
        //       Codec.INT.fieldOf("i").forGetter(ComplexObject::i)
        //     ).apply(instance, ComplexObject::new)
        //   )
        return COMPLEX_OBJECT_CODEC.get();
    }
}

// Assume there is an Registry<MapCodec<? extends ExampleObject>> DISPATCH
public static final Codec<ExampleObject> = DISPATCH.byNameCodec() // Gets Codec<MapCodec<? extends ExampleObject>>
    .dispatch(
        ExampleObject::type, // Get the codec from the specific object
        Function.identity() // Get the codec from the registry
    );
```

```json5
// Simple object
{
    "type": "string", // For StringObject
    "value": "value" // Codec type is not augmented from MapCodec, needs field
}

// Complex object
{
    "type": "complex", // For ComplexObject

    // Codec type is augmented from MapCodec, can be inlined
    "s": "value",
    "i": 0
}
```

[DataFixerUpper]: https://github.com/Mojang/DataFixerUpper
[gson]: https://github.com/google/gson
[conditions]: ../resources/server/conditions.md
[transformer]: #transformer-codecs
[pair]: #pair
[records]: #records
[field]: #fields
[either]: #either

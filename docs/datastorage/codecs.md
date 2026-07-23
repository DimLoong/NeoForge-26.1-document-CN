---
sidebar_position: 2
---
# Codec {#codecs}

Codec 是来自 Mojang 的 [DataFixerUpper] 的序列化工具，用于描述如何在不同格式之间转换对象，例如用于 JSON 的 `JsonElement` 和用于 NBT 的 `Tag`。

## 使用 Codec {#using-codecs}

Codec 主要用于将 Java 对象编码（即序列化）为某种数据格式类型，以及将格式化的数据对象解码（即反序列化）回其关联的 Java 类型。这通常分别通过 `Codec#encodeStart` 和 `Codec#parse` 来完成。

### DynamicOps {#dynamicops}

为了确定编码和解码所用的中间文件格式，`#encodeStart` 和 `#parse` 都需要一个 `DynamicOps` 实例来定义该格式内的数据。

[DataFixerUpper] 库提供了 `JsonOps`，用于对存储在 [`Gson`][gson] 的 `JsonElement` 实例中的 JSON 数据进行 codec 处理。`JsonOps` 支持两种版本的 `JsonElement` 序列化：`JsonOps#INSTANCE` 定义标准的 JSON 文件，而 `JsonOps#COMPRESSED` 则允许把数据压缩为单个字符串。

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

Minecraft 还提供了 `NbtOps`，用于对存储在 `Tag` 实例中的 NBT 数据进行 codec 处理。可以通过 `NbtOps#INSTANCE` 引用它。

```java
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let exampleNbt be a Tag

// Encode Java object to Tag
exampleCodec.encodeStart(NbtOps.INSTANCE, exampleObject);

// Decode Tag into Java object
exampleCodec.parse(NbtOps.INSTANCE, exampleNbt);
```

为了处理注册项，Minecraft 提供了 `RegistryOps`，其中包含一个 lookup provider，用于获取可用的注册表元素。它们可以通过 `RegistryOps#create` 创建，该方法接收一个用于确定数据存储类型的 `DynamicOps`，以及一个提供可用注册表访问权限的 lookup provider。NeoForge 扩展了 `RegistryOps`，创建出 `ConditionalOps`：一种可以处理[加载注册项的条件][conditions]的注册表 codec 查找。

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

`DynamicOps` 也可以单独用于在两种不同的编码格式之间转换。这可以通过 `#convertTo` 并提供目标 `DynamicOps` 格式和待转换的已编码对象来完成。

```java
// Convert Tag to JsonElement
// Let exampleTag be a Tag
JsonElement convertedJson = NbtOps.INSTANCE.convertTo(JsonOps.INSTANCE, exampleTag);
```

### DataResult {#dataresult}

使用 codec 编码或解码的数据会返回一个 `DataResult`，它根据转换是否成功，持有转换后的实例或某些错误数据。当转换成功时，`#result` 提供的 `Optional` 将包含成功转换后的对象。如果转换失败，`#error` 提供的 `Optional` 将包含 `PartialResult`，其中持有错误消息，以及一个视 codec 而定的部分转换对象。

此外，`DataResult` 上还有许多方法可以把结果或错误转换成所需的格式。例如，`#resultOrPartial` 在成功时返回一个包含结果的 `Optional`，失败时则返回部分转换的对象。该方法接收一个字符串 consumer，用于决定在存在错误消息时如何报告它。

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

`Codec` 类为某些已定义的基本类型包含了 codec 的静态实例。

Codec         | Java Type
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

\* `String` 可以通过 `Codec#string` 或 `Codec#sizeLimitedString` 限制为一定数量的字符。

\*\* `Dynamic` 是持有以某种受支持的 `DynamicOps` 格式编码的值的对象。它们通常用于把已编码的对象格式转换为其他已编码的对象格式。

\*\*\* `Unit` 是用于表示 `null` 对象的对象。

### Vanilla 与 NeoForge {#vanilla-and-neoforge}

Minecraft 和 NeoForge 为许多经常被编码和解码的对象定义了 codec。例如：用于 `Identifier` 的 `Identifier#CODEC`、用于 `DateTimeFormatter#ISO_INSTANT` 格式的 `Instant` 的 `ExtraCodecs#INSTANT_ISO8601`，以及用于 `CompoundTag` 的 `CompoundTag#CODEC`。

:::caution
`CompoundTag` 无法使用 `JsonOps` 从 JSON 解码数字列表。`JsonOps` 在转换时会把数字设为其最窄的类型。`ListTag` 会为其数据强制统一一种类型，因此不同类型的数字（例如 `64` 会是 `byte`，`384` 会是 `short`）在转换时会抛出错误。
:::

Vanilla 与 NeoForge 的注册表也为其所含对象类型提供了 codec（例如 `BuiltInRegistries#BLOCK` 拥有一个 `Codec<Block>`）。`Registry#byNameCodec` 会把注册表对象编码为它们的注册名。Vanilla 注册表还拥有 `Registry#holderByNameCodec`，它编码为注册名，并解码为包装在 `Holder` 中的注册表对象。

## 创建 Codec {#creating-codecs}

可以为编码和解码任何对象创建 codec。为便于理解，下文会同时展示等价的已编码 JSON。

### 记录 {#records}

Codec 可以通过记录（record）来定义对象。每个记录 codec 都用显式命名的字段来定义任意对象。创建记录 codec 的方式有很多，但最简单的是通过 `RecordCodecBuilder#create`。

`RecordCodecBuilder#create` 接收一个函数，该函数定义一个 `Instance` 并返回该对象的一个应用（`App`）。可以将其类比为创建类的*实例（instance）*，以及用于把类*应用（apply）*到所构造对象上的构造器。

```java
// Some object to create a codec for
public class SomeObject {

    public SomeObject(String s, int i, boolean b) { /* ... */ }

    public String s() { /* ... */ }

    public int i() { /* ... */ }

    public boolean b() { /* ... */ }
}
```

#### 字段 {#fields}

一个 `Instance` 可以使用 `#group` 定义至多 16 个字段。每个字段都必须是一个应用，用以定义该对象所针对的实例以及对象的类型。满足这一要求最简单的方式是：取一个 `Codec`，设定要从中解码的字段名，并设定用于编码该字段的 getter。

如果字段是必需的，可以用 `#fieldOf` 从 `Codec` 创建字段；如果字段被包装在 `Optional` 中或带有默认值，则用 `#optionalFieldOf`。这两个方法都需要一个字符串，包含该字段在已编码对象中的名称。随后可以用 `#forGetter` 设定用于编码该字段的 getter，它接收一个函数，给定对象后返回该字段数据。

:::warning
如果存在某个元素在解析时抛出错误，`#optionalFieldOf` 会抛出错误。如果该错误应当被吞掉，请改用 `#lenientOptionalFieldOf`。
:::

在此之后，可以通过 `#apply` 应用最终得到的产物，以定义该实例应如何为此应用构造对象。为方便起见，分组的字段应当按照它们在构造器中出现的顺序列出，这样该函数就可以直接是一个构造器方法引用。

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

### 转换器 {#transformers}

Codec 可以通过映射方法转换为等价或部分等价的表示。每个映射方法都接收两个函数：一个把当前类型转换为新类型，另一个把新类型转换回当前类型。这通过 `#xmap` 函数完成。

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

如果一个类型是部分等价的，即转换过程中存在某些限制，则有一些映射函数会返回 `DataResult`，可用于在遇到异常或无效状态时返回错误状态。

Is A Fully Equivalent to B | Is B Fully Equivalent to A | Transform Method
:---:                      | :---:                      | :---
Yes                        | Yes                        | `#xmap`
Yes                        | No                         | `#flatComapMap`
No                         | Yes                        | `#comapFlatMap`
No                         | No                         | `#flatXMap`

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

#### 范围 Codec {#range-codecs}

范围 codec 是 `#flatXMap` 的一种实现，当值不在设定的最小值与最大值（含端点）之间时，会返回一个错误的 `DataResult`。即便超出边界，该值仍会作为部分结果提供。分别通过 `#intRange`、`#floatRange` 和 `#doubleRange` 为整数、浮点数和双精度浮点数提供了实现。

```java
public static final Codec<Integer> RANGE_CODEC = Codec.intRange(0, 4); 
```

```json5
// Will be valid, inside [0, 4]
4

// Will error, outside [0, 4]
5
```

#### 字符串解析器 {#string-resolver}

`Codec#stringResolver` 是 `flatXmap` 的一种实现，它把字符串映射到某种对象。

```java
public record StringResolverObject(String name) { /* ... */ }

// Assume there is some Map<String, StringResolverObject> OBJECT_MAP
public static final Codec<StringResolverObject> STRING_RESOLVER_CODEC = Codec.stringResolver(StringResolverObject::name, OBJECT_MAP::get);
```

```json5
// Will map this string to its associated object
"example_name"
```

### 默认值 {#defaults}

如果编码或解码的结果失败，可以通过 `Codec#orElse` 或 `Codec#orElseGet` 提供一个默认值。

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

### Unit {#unit}

一种提供代码内值且不编码任何内容的 codec，可以用 `MapCodec#unitCodec` 表示。这在 codec 需要使用数据对象中某个不可编码的条目时很有用。

```java
public static final Codec<IEventBus> UNIT_CODEC = MapCodec.unitCodec(
    () -> NeoForge.EVENT_BUS // Can also be a raw value
);
```

```json5
// Nothing here, will return the NeoForge event bus
```

### 延迟初始化 {#lazy-initialized}

有时，codec 可能依赖某些在其构造时尚不存在的数据。在这些情况下，可以用 `Codec#lazyInitialized` 让 codec 在首次编码/解码时构造自身。该方法接收一个提供 codec 的 supplier。

```java
public static final Codec<IEventBus> LAZY_CODEC = Codec.lazyInitialized(
    () -> MapCodec.unitCodec(NeoForge.EVENT_BUS)
);
```

```json5
// Nothing here, will return the NeoForge event bus
// Encodes/decodes the same way as the normal codec
```

### 列表 {#list}

对象列表的 codec 可以通过 `Codec#listOf` 从一个对象 codec 生成。`listOf` 也可以接收表示列表最小和最大尺寸的整数。`sizeLimitedListOf` 的作用相同，但只指定一个上界。

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

使用列表 codec 解码的列表对象存储在一个**不可变**列表中。如果需要可变列表，应对列表 codec 应用一个[转换器][transformer]。

### 映射 {#map}

键与值对象的映射（map）的 codec 可以通过 `Codec#unboundedMap` 从两个 codec 生成。无界映射可以指定任何基于字符串或由字符串转换而来的值作为键。

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

使用无界映射 codec 解码的映射对象存储在一个**不可变**映射中。如果需要可变映射，应对映射 codec 应用一个[转换器][transformer]。

:::caution
无界映射只支持能编码/解码为字符串或从字符串编码/解码的键。可以使用键值[对][pair]列表 codec 来绕过这一限制。
:::

### 对 {#pair}

对象对（pair）的 codec 可以通过 `Codec#pair` 从两个 codec 生成。

对 codec 解码对象的方式是：先解码对中的左侧对象，然后取已编码对象的剩余部分，从中解码右侧对象。因此，这些 codec 要么必须在解码后就已编码对象表达出某些信息（例如[记录][records]），要么必须被强化为 `MapCodec` 并通过 `#codec` 转换为常规 codec。通常可以通过把该 codec 变成某个对象的[字段][field]来实现。

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
带有非字符串键的映射 codec 可以借助应用了[转换器][transformer]的键值对列表来编码/解码。
:::

### Either {#either}

针对某种对象数据的两种不同编码/解码方式的 codec，可以通过 `Codec#either` 从两个 codec 生成。

either codec 会尝试用第一个 codec 解码对象。如果失败，则尝试用第二个 codec 解码。如果第二个也失败，那么 `DataResult` 将只包含第二个 codec 失败所产生的错误。

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
这可以与[转换器][transformer]结合使用，从两种不同的编码方式中得到一个特定对象。
:::

#### Xor {#xor}

`Codec#xor` 是 [either][either] codec 的一个特例，仅当两种方式中恰好有一种被成功处理时结果才成功。如果两个 codec 都能被处理，则会抛出错误。

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

#### Alternative {#alternative}

`Codec#withAlternative` 是 [either][either] codec 的一个特例，其中两个 codec 都尝试解码同一个对象，但对象以不同的格式存储。第一个（即主）codec 会尝试解码对象。失败时，则改用第二个 codec。编码时始终使用主 codec。

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

### 递归 {#recursive}

有时，一个对象可能会把与自身相同类型的对象作为字段来引用。例如，`EntityPredicate` 会为载具、乘客和目标实体接收一个 `EntityPredicate`。在这种情况下，可以用 `Codec#recursive`，把 codec 作为一个用于创建该 codec 的函数的一部分来提供。

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

### 分派 {#dispatch}

Codec 可以拥有子 codec，从而通过 `Codec#dispatch` 根据某个指定的类型来解码特定对象。这通常用于包含 codec 的注册表，例如规则测试（rule test）或方块放置器（block placer）。

分派 codec 首先尝试从某个字符串键（通常是 `type`）获取已编码的类型。之后，对该类型进行解码，并调用一个 getter 来获取用于解码实际对象的具体 codec。如果用于解码对象的 `DynamicOps` 会压缩其映射，或者对象 codec 本身没有被强化为 `MapCodec`（例如记录或带字段的基本类型），那么对象就需要存储在一个 `value` 键之内。否则，对象会与其余数据在同一层级被解码。

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

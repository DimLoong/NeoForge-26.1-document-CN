# 数据映射 {#data-maps}

数据映射包含数据驱动、可重载的对象，可以附加到已注册的对象上。该系统让游戏行为更易于数据驱动，因为它提供了诸如同步或冲突解决等功能，从而带来更好、更可配置的用户体验。你可以把[标签][tags]看作 注册对象 ➜ 布尔值 的映射，而数据映射则是更灵活的 注册对象 ➜ 对象 的映射。与[标签][tags]类似，数据映射会向其对应的数据映射中追加内容，而非覆盖。

数据映射既可以附加到静态的内置注册表，也可以附加到动态的、数据驱动的数据包注册表。数据映射支持通过 `/reload` 命令或任何其他重载服务端资源的方式进行重载。

NeoForge 为常见用例提供了多种[内置数据映射][builtin]，用于替代硬编码的原版字段。更多信息请参阅所链接的文章。

## 文件位置 {#file-location}

数据映射从位于 `<mapNamespace>/data_maps/<registryNamespace>/<registryPath>/<mapPath>.json` 的 JSON 文件中加载，其中：

- `<mapNamespace>` 是数据映射 ID 的命名空间，
- `<mapPath>` 是数据映射 ID 的路径，
- `<registryNamespace>` 是注册表 ID 的命名空间（若为 `minecraft` 则省略），
- `<registryPath>` 是注册表 ID 的路径。

示例：

- 对于名为 `mymod:drop_healing`、用于 `minecraft:item` 注册表的数据映射（如下例所示），路径将是 `mymod/data_maps/item/drop_healing.json`。
- 对于名为 `somemod:somemap`、用于 `minecraft:block` 注册表的数据映射，路径将是 `somemod/data_maps/block/somemap.json`。
- 对于名为 `example:stuff`、用于 `somemod:custom` 注册表的数据映射，路径将是 `example/data_maps/somemod/custom/stuff.json`。

## JSON 结构 {#json-structure}

数据映射文件本身可以包含以下字段：

- `replace`：一个布尔值，会在添加本文件的值之前清空数据映射。 Mod 绝不应发布此项，它只应由希望为自身目的覆盖此映射的资源包开发者使用。
- `neoforge:conditions`：一个[加载条件][conditions]列表。
- `values`：一个从 注册表 ID 或标签 ID 到值的映射，这些值将由你的 Mod 添加到数据映射中。值本身的结构由数据映射的 codec 定义（见下文）。
- `remove`：一个要从数据映射中移除的 注册表 ID 或标签 ID 的列表。

### 添加值 {#adding-values}

举例来说，假设我们有一个数据映射对象，它为 `minecraft:item` 注册表定义了两个浮点数键 `amount` 和 `chance`。对应的数据映射文件可能如下所示：

```json5
{
    "values": {
        // Attach a value to the carrot item
        "minecraft:carrot": {
            "amount": 12,
            "chance": 1
        },
        // Attach a value to all items in the logs tag
        "#minecraft:logs": {
            "amount": 1,
            "chance": 0.1
        }
    }
}
```

数据映射可以支持[合并器][mergers]，它会在发生冲突时触发自定义的合并行为，例如两个 Mod 为同一个物品添加了数据映射值。为避免触发合并器，我们可以在元素层级指定 `replace` 字段，如下所示：

```json5
{
    "values": {
        // Overwrite the value of the carrot item
        "minecraft:carrot": {
            // highlight-next-line
            "replace": true,
            // The new value will be under a value sub-object
            "value": {
                "amount": 12,
                "chance": 1
            }
        }
    }
}
```

### 移除已有的值 {#removing-existing-values}

移除元素的方法是指定一个要移除的物品 ID 或标签 ID 列表：

```json5
{
    // We do not want the potato to have a value, even if another mod's data map added it
    "remove": [
        "minecraft:potato"
    ]
}
```

移除在添加之后运行，因此我们可以先包含一个标签，然后再从中排除某些元素：

```json5
{
    "values": {
        "#minecraft:logs": { /* ... */ }
    },
    // Exclude crimson stem again
    "remove": [
        "minecraft:crimson_stem"
    ]
}
```

数据映射可以支持带有附加参数的自定义[移除器][removers]。要提供这些参数，可以将 `remove` 列表转换为一个 JSON 对象，其中以待移除的元素作为映射的键，以附加数据作为对应的值。例如，假设我们的移除器对象被序列化为一个字符串，那么我们的移除器映射可能如下所示：

```json5
{
    "remove": {
        // The remover will be deserialized from the value (`somekey1` in this case)
        // and applied to the value attached to the carrot item
        "minecraft:carrot": "somekey1"
    }
}
```

## 自定义数据映射 {#custom-data-maps}

首先，我们定义数据映射条目的格式。**数据映射条目必须是不可变的**，因此 record 是理想的选择。沿用上文中带有两个浮点值 `amount` 和 `chance` 的例子，我们的数据映射条目将如下所示：

```java
public record ExampleData(float amount, float chance) {}
```

与许多其他内容一样，数据映射通过 [codec][codecs] 进行序列化和反序列化。这意味着我们需要为数据映射条目提供一个 codec，稍后会用到它：

```java
public record ExampleData(float amount, float chance) {
    public static final Codec<ExampleData> CODEC = RecordCodecBuilder.create(instance -> instance.group(
            Codec.FLOAT.fieldOf("amount").forGetter(ExampleData::amount),
            Codec.floatRange(0, 1).fieldOf("chance").forGetter(ExampleData::chance)
    ).apply(instance, ExampleData::new));
}
```

接下来，我们创建数据映射本身：

```java
// In this example, we register the data map for the minecraft:item registry, hence we use Item as the generic.
// Adjust the types accordingly if you want to create a data map for a different registry.
public static final DataMapType<Item, ExampleData> EXAMPLE_DATA = DataMapType.builder(
        // The ID of the data map. Data map files for this data map will be located at
        // <yourmodid>:examplemod/data_maps/item/example_data.json.
        ResourceLocation.fromNamespaceAndPath("examplemod", "example_data"),
        // The registry to register the data map for.
        Registries.ITEM,
        // The codec of the data map entries.
        ExampleData.CODEC
).build();
```

最后，在[Mod 事件总线][modbus]上的 [`RegisterDataMapTypesEvent`][events] 期间注册该数据映射：

```java
@SubscribeEvent // on the mod event bus
public static void registerDataMapTypes(RegisterDataMapTypesEvent event) {
    event.register(EXAMPLE_DATA);
}
```

### 同步 {#syncing}

已同步的数据映射会将其值同步到客户端。可以通过在构建器上调用 `#synced` 将数据映射标记为已同步，如下所示：

```java
public static final DataMapType<Item, ExampleData> EXAMPLE_DATA = DataMapType.builder(...)
        .synced(
                // The codec used for syncing. May be identical to the normal codec, but may also be
                // a codec with less fields, omitting parts of the object that are not required on the client.
                ExampleData.CODEC,
                // Whether the data map is mandatory or not. Marking a data map as mandatory will disconnect clients
                // that are missing the data map on their side; this includes 原版 clients.
                false
        ).build();
```

### 使用 {#usage}

由于数据映射可以用于任何注册表，因此必须通过 `Holder` 来查询它们，而不能通过实际的注册表对象。此外，它只对引用型 holder 有效，对 `Direct` holder 无效。不过，大多数场合都会返回引用型 holder，例如 `Registry#wrapAsHolder`、 `Registry#getHolder` 或各种 `builtInRegistryHolder` 方法，因此在大多数情况下这不成问题。

之后你可以通过 `Holder#getData(DataMapType)` 查询数据映射值。如果某个对象没有附加数据映射值，该方法将返回 `null`。沿用前面的 `ExampleData`，让我们用它在玩家捡起物品时为其治疗：

```java
@SubscribeEvent // on the game event bus
public static void itemPickup(ItemPickupEvent event) {
    ItemStack stack = event.getItemStack();
    // Get a Holder<Item> via ItemStack#getItemHolder.
    Holder<Item> holder = stack.getItemHolder();
    // Get the data from the holder.
    //highlight-next-line
    ExampleData data = holder.getData(EXAMPLE_DATA);
    if (data != null) {
        // The values are present, so let's do something with them!
        Player player = event.getPlayer();
        if (player.getLevel().getRandom().nextFloat() > data.chance()) {
            player.heal(data.amount());
        }
    }
}
```

这一流程当然同样适用于 NeoForge 提供的所有数据映射。

## 高级数据映射 {#advanced-data-maps}

高级数据映射是使用 `AdvancedDataMapType` 而非标准 `DataMapType`（`AdvancedDataMapType` 是其子类）的数据映射。它们拥有一些额外功能，即能够指定自定义的合并器和自定义的移除器。对于值为集合或类集合类型（如 `List` 或 `Map`）的数据映射，强烈推荐实现这一点。

`DataMapType` 有两个泛型 `R`（注册表类型）和 `T`（数据映射值类型），而 `AdvancedDataMapType` 还多出一个：`VR extends DataMapValueRemover<R, T>`。这个泛型使得能够以恰当的类型安全性对移除器进行数据生成。

`AdvancedDataMapType` 使用 `AdvancedDataMapType#builder()` 而非 `DataMapType#builder()` 来创建，返回一个 `AdvancedDataMapType.Builder`。该构建器额外提供了两个方法 `#remover` 和 `#merger`，分别用于指定移除器和合并器（见下文）。包括同步在内的所有其他功能均保持不变。

### 合并器 {#mergers}

合并器可用于处理多个数据包尝试为同一对象添加值时产生的冲突。默认合并器（`DataMapValueMerger#defaultMerger`）会用新值覆盖已有的值（例如来自优先级较低的数据包的值），因此如果这不是期望的行为，就需要自定义合并器。

合并器会接收两个相互冲突的值，以及这些值所附加的对象（以 `Either<TagKey<R>, ResourceKey<R>>` 的形式，因为值既可以附加到某个标签中的所有对象，也可以附加到单个对象上）和对象所属的注册表，并应返回实际应当附加的值。一般来说，只要有可能，合并器就应当直接合并而不进行覆盖（即只有在常规方式无法合并时才覆盖）。如果某个数据包想要绕过合并器，它应当在对象上指定 `replace` 字段（参见[添加值][add]）。

设想这样一个场景：我们有一个为物品添加整数的数据映射。这样我们就可以简单地通过把两个值相加来解决冲突，如下所示：

```java
public class IntMerger implements DataMapValueMerger<Item, Integer> {
    @Override
    public Integer merge(Registry<Item> registry,
            Either<TagKey<Item>, ResourceKey<Item>> first, Integer firstValue,
            Either<TagKey<Item>, ResourceKey<Item>> second, Integer secondValue) {
        return firstValue + secondValue;
    }
}
```

这样一来，如果一个包为 `minecraft:carrot` 指定值 12，另一个包为 `minecraft:carrot` 指定值 15，那么 `minecraft:carrot` 的最终值将是 27。如果其中任一对象指定了 `"replace": true`，则会使用该对象的值。如果两者都指定了 `"replace": true`，则使用优先级较高的数据包的值。

最后，别忘了在构建器中真正指定该合并器，如下所示：

```java
// We assume AdvancedData contains an integer property of some sort.
AdvancedDataMapType<Item, AdvancedData> ADVANCED_MAP = AdvancedDataMapType.builder(...)
        .merger(new IntMerger())
        .build();
```

:::tip
NeoForge 在 `DataMapValueMerger` 中为列表、集合（set）和映射（map）提供了默认合并器。
:::

### 移除器 {#removers}

与用于处理更复杂数据的合并器类似，移除器可用于正确处理某个元素的 `remove` 子句。默认移除器（`DataMapValueRemover.Default.INSTANCE`）会直接移除与指定对象相关的所有信息，因此如果我们只想移除对象数据的一部分，就需要使用自定义移除器。

传递给构建器的 codec（继续往下看）将用于解码移除器实例。随后，移除器会接收当前附加到对象上的值及其来源，并应返回一个 `Optional`，其中包含用于替换旧值的新值。此外，返回一个空的 `Optional` 会导致该值被真正移除。

考虑以下示例，这个移除器会从一个基于 `Map<String, String>` 的数据映射中移除具有特定键的值：

```java
public record MapRemover(String key) implements DataMapValueRemover<Item, Map<String, String>> {
    public static final Codec<MapRemover> CODEC = Codec.STRING.xmap(MapRemover::new, MapRemover::key);
    
    @Override
    public Optional<Map<String, String>> remove(Map<String, String> value, Registry<Item> registry, Either<TagKey<Item>, ResourceKey<Item>> source, Item object) {
        final Map<String, String> newMap = new HashMap<>(value);
        newMap.remove(key);
        return Optional.of(newMap);
    }
}
```

有了这个移除器，再来看以下数据文件：

```json5
{
    "values": {
        "minecraft:carrot": {
            "somekey1": "value1",
            "somekey2": "value2"
        }
    }
}
```

现在，考虑这第二个数据文件，它的优先级高于第一个：

```json5
{
    "remove": {
        // As the remover is decoded as a string, we can use a string as the value here.
        // If it were decoded as an object, we would have needed to use an object.
        "minecraft:carrot": "somekey1"
    }
}
```

这样，在两个文件都应用之后，最终结果将是（以下内容的内存表示）：

```json5
{
    "values": {
        "minecraft:carrot": {
            "somekey2": "value2"
        }
    }
}
```

与合并器一样，别忘了将它们添加到构建器中。注意这里我们只需使用 codec：

```java
// We assume AdvancedData contains a Map<String, String> property of some sort.
AdvancedDataMapType<Item, AdvancedData> ADVANCED_MAP = AdvancedDataMapType.builder(...)
        .remover(MapRemover.CODEC)
        .build();
```

## 数据生成 {#data-generation}

可以通过继承 `DataMapProvider` 并重写 `#gather` 来创建条目，从而对数据映射进行[数据生成][datagen]。沿用前面的 `ExampleData`（带有浮点值 `amount` 和 `chance`），我们的数据生成文件可能如下所示：

```java
public class MyDataMapProvider extends DataMapProvider {
    public MyDataMapProvider(PackOutput packOutput, CompletableFuture<HolderLookup.Provider> lookupProvider) {
        super(packOutput, lookupProvider);
    }
    
    @Override
    protected void gather() {
        // We create a builder for the EXAMPLE_DATA data map and add our entries using #add.
        builder(EXAMPLE_DATA)
                // We turn on replacing. Don't ever ship a mod like this! This is purely for educational purposes.
                .replace(true)
                // We add the value "amount": 10, "chance": 1 for all slabs. The boolean parameter controls
                // the "replace" field, which should always be false in a mod.
                .add(ItemTags.SLABS, new ExampleData(10, 1), false)
                // We add the value "amount": 5, "chance": 0.2 for apples.
                .add(Items.APPLE.builtInRegistryHolder(), new ExampleData(5, 0.2f), false) // Can also use Registry#wrapAsHolder to get the holder of a registry object
                // We remove wooden slabs again.
                .remove(ItemTags.WOODEN_SLABS)
                // We add a mod loaded condition for Botania, because why not.
                .conditions(new ModLoadedCondition("botania"));
    }
}
```

这样便会生成以下 JSON 文件：

```json5
{
    "replace": true,
    "values": {
        "#minecraft:slabs": {
            "amount": 10,
            "chance": 1.0
        },
        "minecraft:apple": {
            "amount": 5,
            "chance": 0.2
        }
    },
    "remove": [
        "#minecraft:wooden_slabs"
    ],
    "neoforge:conditions": [
        {
            "type": "neoforge:mod_loaded",
            "modid": "botania"
        }
    ]
}
```

与所有数据提供器一样，别忘了将该提供器添加到事件中：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();

    // other providers here
    generator.addProvider(
            event.includeServer(),
            new MyDataMapProvider(output, lookupProvider)
    );
}
```

[builtin]: builtin.md
[codecs]: ../../../datastorage/codecs.md
[conditions]: ../conditions.md
[datagen]: ../../index.md#data-generation
[events]: ../../../concepts/events.md
[add]: #adding-values
[mergers]: #mergers
[modbus]: ../../../concepts/events.md#event-buses
[removers]: #removers
[tags]: ../tags.md

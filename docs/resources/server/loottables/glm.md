# 全局战利品修改器 {#global-loot-modifiers}

全局战利品修改器（Global Loot Modifiers，简称 GLM）是一种数据驱动的掉落物修改方式，无需覆盖数十乃至数百张原版战利品表，也可用于在不知道加载了哪些 Mod 的情况下处理需要与其他 Mod 战利品表交互的效果。

GLM 的工作方式是：先掷取关联的[战利品表][loottable]，然后把 GLM 应用到掷取表所得的结果上。GLM 还是叠加式的，而非“后加载者覆盖”，以允许多个 Mod 修改同一张战利品表，这一点与[标签][tags]类似。

要注册一个 GLM，你需要三样东西：

- 一个表示你的战利品修改器的 JSON 文件。该文件包含你修改的所有数据，允许数据包对你的效果进行调整。它位于 `data/<namespace>/loot_modifiers/<path>.json`。
- 一个实现 `IGlobalLootModifier` 或继承 `LootModifier`（后者进而实现 `IGlobalLootModifier`）的类。该类包含使修改器工作的代码。
- 一个用于编码和解码你的战利品修改器类的映射 [Codec][codec]。通常，它作为战利品修改器类中的一个 `public static final` 字段实现。

## 战利品修改器 JSON {#the-loot-modifier-json}

该文件包含与你的修改器相关的所有值，例如应用的概率、要添加的物品等。JSON 位于 `data/<namespace>/loot_modifiers/<path>.json`，其中 `<namespace>` 和 `<path>` 是唯一 [`Identifier`][identifier] 的组成部分。建议尽可能避免硬编码值，以便数据包制作者在需要时调整平衡性。一个战利品修改器必须至少包含两个字段，并且可以根据情况包含更多：

- `type` 字段包含战利品修改器的注册名。
- `conditions` 字段是激活该修改器所需的一列战利品表条件。
- 其他属性可能是必需的或可选的，取决于所使用的 Codec。

:::tip
GLM 的一个常见用途是向某个特定的战利品表添加额外战利品。为此，可以使用 [`neoforge:loot_table_id` 条件][loottableid]。
:::

一个示例用法可能看起来像这样：

```json5
{
    // This is the registry name of the loot modifier
    "type": "examplemod:my_loot_modifier",
    "conditions": [
        // Loot table conditions here
    ],
    // An optional property typically provided by loot modifiers
    // to denote the order that the modifiers should be applied,
    // from highest to lowest.
    // Typically defaults to 1000.
    "priority": 900,
    // Extra properties specified by the codec
    "field1": "somestring",
    "field2": 10,
    "field3": "minecraft:dirt"
}
```

## `IGlobalLootModifier` 与 `LootModifier` {#igloballootmodifier-and-lootmodifier}

要真正把战利品修改器应用到战利品表上，必须指定一个 `IGlobalLootModifier` 实现。在大多数情况下，你会想使用 `LootModifier` 子类，它会为你处理条件和优先级等事项。要开始，我们在战利品修改器类中继承 `LootModifier`：

```java
// We cannot use a record because records cannot extend other classes.
public class MyLootModifier extends LootModifier {
    // See below for how the codec works.
    public static final MapCodec<MyLootModifier> CODEC = ...;
    // Our extra properties.
    private final String field1;
    private final int field2;
    private final Item field3;
    
    // First constructor parameter is the list of conditions. The rest is our extra properties.
    public MyLootModifier(LootItemCondition[] conditions, int priority, String field1, int field2, Item field3) {
        super(conditions, priority);
        this.field1 = field1;
        this.field2 = field2;
        this.field3 = field3;
    }
    
    // Return our codec here.
    @Override
    public MapCodec<? extends IGlobalLootModifier> codec() {
        return CODEC;
    }
    
    // This is where the magic happens. Use your extra properties here if needed.
    // Parameters are the existing loot, and the loot context.
    @Override
    protected ObjectArrayList<ItemStack> doApply(ObjectArrayList<ItemStack> generatedLoot, LootContext context) {
        // Add your items to generatedLoot here.
        return generatedLoot;
    }
}
```

:::info
一个修改器返回的掉落物列表会按 `priority` 从高到低的顺序传入其他修改器。因此，被修改过的战利品可以且应当被预期还会被另一个战利品修改器进一步修改。
:::

## 战利品修改器 Codec {#the-loot-modifier-codec}

为了让游戏知道我们的战利品修改器的存在，我们必须为它定义并[注册][register]一个 [Codec][codec]。沿用前面带有三个字段的示例，代码大致如下：

```java
public static final MapCodec<MyLootModifier> CODEC = RecordCodecBuilder.mapCodec(inst -> 
        // LootModifier#codecStart adds the conditions field.
        LootModifier.codecStart(inst).and(inst.group(
                Codec.STRING.fieldOf("field1").forGetter(e -> e.field1),
                Codec.INT.fieldOf("field2").forGetter(e -> e.field2),
                BuiltInRegistries.ITEM.byNameCodec().fieldOf("field3").forGetter(e -> e.field3)
        )).apply(inst, MyLootModifier::new)
);
```

然后，我们把该 Codec [注册][register]到注册表：

```java
public static final DeferredRegister<MapCodec<? extends IGlobalLootModifier>> GLOBAL_LOOT_MODIFIER_SERIALIZERS =
        DeferredRegister.create(NeoForgeRegistries.Keys.GLOBAL_LOOT_MODIFIER_SERIALIZERS, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<MyLootModifier>> MY_LOOT_MODIFIER =
        GLOBAL_LOOT_MODIFIER_SERIALIZERS.register("my_loot_modifier", () -> MyLootModifier.CODEC);
```

## 内置战利品修改器 {#builtin-loot-modifiers}

NeoForge 开箱即用地提供了一个战利品修改器供你使用：

### `neoforge:add_table` {#neoforgeadd_table}

该战利品修改器会掷取第二张战利品表，并把结果添加到该修改器所应用的战利品表上。

```json5
{
    "type": "neoforge:add_table",
    "conditions": [], // the required loot conditions
    "priority": 1000, // the optional priority of execution
    "table": "minecraft:chests/abandoned_mineshaft" // the second table to roll
}
```

## 数据生成 {#datagen}

GLM 可以[数据生成][datagen]。这通过继承 `GlobalLootModifierProvider` 完成：

```java
public class MyGlobalLootModifierProvider extends GlobalLootModifierProvider {
    // Get the parameters from the `GatherDataEvent`s.
    public MyGlobalLootModifierProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> registries) {
        super(output, registries, ExampleMod.MOD_ID);
    }
    
    @Override
    protected void start() {
        // Call #add to add a new GLM. This also adds a corresponding entry in global_loot_modifiers.json.
        this.add(
                // The name of the modifier. This will be the file name.
                "my_loot_modifier_instance",
                // The loot modifier to add. For the sake of example, we add a weather loot condition.
                new MyLootModifier(new LootItemCondition[] {
                        WeatherCheck.weather().setRaining(true).build()
                }, 900, "somestring", 10, Items.DIRT),
                // A list of data load conditions. Note that these are unrelated to the loot conditions
                // specified on the modifier itself. For the sake of example, we add a mod loaded condition.
                // An overload of #add is available that accepts a vararg of conditions instead of a list.
                List.of(new ModLoadedCondition("create"))
        );
    }
}
```

和所有数据提供器一样，你必须把该提供器注册到 `GatherDataEvent`：

```java
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent.Client event) {
    // Call event.createDatapackRegistryObjects(...) first if adding datapack objects

    event.createProvider(MyGlobalLootModifierProvider::new);
}
```

[codec]: ../../../datastorage/codecs.md
[datagen]: ../../index.md#data-generation
[loottable]: index.md
[loottableid]: lootconditions#neoforgeloot_table_id
[register]: ../../../concepts/registries.md#methods-for-registering
[identifier]: ../../../misc/identifier.md
[tags]: ../tags.md

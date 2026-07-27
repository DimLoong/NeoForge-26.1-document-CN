# 全局战利品修改器 {#global-loot-modifiers}

全局战利品修改器（Global Loot Modifier，简称 GLM）是一种数据驱动的方式，用于修改掉落物，而无需覆写成百上千个原版战利品表；也可用于在不知道加载了哪些 Mod 的情况下，处理那些需要与另一个 Mod 的战利品表交互的效果。

GLM 的工作方式是：先摇取（roll）关联的[战利品表][loottable]，然后把 GLM 应用到摇取表的结果上。 GLM 还是叠加式的，而非“后加载者胜”，以便允许多个 Mod 修改同一个战利品表，这与[标签][tags]类似。

要注册一个 GLM，你需要四样东西：

- 一个 `global_loot_modifiers.json` 文件，位于 `data/neoforge/loot_modifiers/global_loot_modifiers.json`（**不在你的 Mod 命名空间中**）。该文件告诉 NeoForge 要应用哪些修改器，以及按什么顺序应用。
- 一个表示你的战利品修改器的 JSON 文件。该文件包含你这次修改的所有数据，使数据包能够调整你的效果。它位于 `data/<namespace>/loot_modifiers/<path>.json`。
- 一个实现 `IGlobalLootModifier` 或继承 `LootModifier`（后者又实现了 `IGlobalLootModifier`）的类。该类包含使修改器生效的代码。
- 一个用于编码和解码你战利品修改器类的 map [codec]。通常，它以 `public static final` 字段的形式实现在战利品修改器类中。

## `global_loot_modifiers.json` {#global_loot_modifiersjson}

`global_loot_modifiers.json` 文件告诉 NeoForge 要把哪些修改器应用到战利品表。该文件可以包含两个键：

- `entries` 是一个应被加载的修改器列表。其中指定的 [`ResourceLocation`][resloc] 指向它们在 `data/<namespace>/loot_modifiers/<path>.json` 中对应的条目。这个列表是有序的，意味着修改器将按指定的顺序应用，这在出现 Mod 兼容性问题时有时会很关键。
- `replace` 表示这些修改器是应当替换旧修改器（`true`），还是仅仅追加到现有列表中（`false`）。这与[标签][tags]中的 `replace` 键类似，但与标签不同的是，这里该键是必需的。一般来说，Mod 开发者应始终在此使用 `false`；使用 `true` 的能力是面向整合包或数据包开发者的。

用法示例：

```json5
{
    "replace": false, // must be present
    "entries": [
        // represents a loot modifier in data/examplemod/loot_modifiers/example_glm_1.json
        "examplemod:example_glm_1",
        "examplemod:example_glm_2"
        // ...
    ]
}
```

## 战利品修改器 JSON {#the-loot-modifier-json}

该文件包含与你的修改器相关的所有值，例如应用几率、要添加哪些物品等。建议尽量避免硬编码的值，以便数据包制作者在需要时能够调整平衡性。一个战利品修改器必须至少包含两个字段，并可根据情况包含更多：

- `type` 字段包含战利品修改器的注册名。
- `conditions` 字段是让此修改器激活的战利品表条件列表。
- 视所用 codec 而定，可能还需要或可选地提供其他属性。

:::tip
GLM 的一个常见用例是向某个特定的战利品表添加额外战利品。要实现这一点，可以使用 [`neoforge:loot_table_id` 条件][loottableid]。
:::

一个用法示例可能类似这样：

```json5
{
    // This is the registry name of the loot modifier
    "type": "examplemod:my_loot_modifier",
    "conditions": [
        // Loot table conditions here
    ],
    // Extra properties specified by the codec
    "field1": "somestring",
    "field2": 10,
    "field3": "minecraft:dirt"
}
```

## `IGlobalLootModifier` 与 `LootModifier` {#igloballootmodifier-and-lootmodifier}

要真正把战利品修改器应用到战利品表，必须指定一个 `IGlobalLootModifier` 实现。大多数情况下，你会想使用 `LootModifier` 子类，它会替你处理诸如条件之类的事务。开始时，我们在战利品修改器类中继承 `LootModifier`：

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
    public MyLootModifier(LootItemCondition[] conditions, String field1, int field2, Item field3) {
        super(conditions);
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
一个修改器返回的掉落物列表会按修改器注册的顺序传入其他修改器。因此，被修改过的战利品可以、也应当预期会被另一个战利品修改器再次修改。
:::

## 战利品修改器 Codec {#the-loot-modifier-codec}

为了让游戏知道我们的战利品修改器的存在，我们必须为它定义并[注册][register]一个 [codec]。沿用前面带有三个字段的示例，代码大致如下：

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

然后，我们把该 codec 注册到注册表：

```java
public static final DeferredRegister<MapCodec<? extends IGlobalLootModifier>> GLOBAL_LOOT_MODIFIER_SERIALIZERS =
        DeferredRegister.create(NeoForgeRegistries.Keys.GLOBAL_LOOT_MODIFIER_SERIALIZERS, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<MyLootModifier>> MY_LOOT_MODIFIER =
        GLOBAL_LOOT_MODIFIER_SERIALIZERS.register("my_loot_modifier", () -> MyLootModifier.CODEC);
```

## 内置战利品修改器 {#builtin-loot-modifiers}

NeoForge 开箱即用地提供了一个战利品修改器供你使用：

### `neoforge:add_table` {#neoforgeadd_table}

该战利品修改器会摇取第二个战利品表，并把其结果添加到该修改器所应用的战利品表中。

```json5
{
    "type": "neoforge:add_table",
    "conditions": [], // the required loot conditions
    "table": "minecraft:chests/abandoned_mineshaft" // the second table to roll
}
```

## 数据生成 {#datagen}

GLM 可以通过[数据生成][datagen]来生成。这是通过继承 `GlobalLootModifierProvider` 实现的：

```java
public class MyGlobalLootModifierProvider extends GlobalLootModifierProvider {
    // Get the PackOutput from GatherDataEvent.
    public MyGlobalLootModifierProvider(PackOutput output) {
        super(output, ExampleMod.MOD_ID);
    }
    
    @Override
    protected void start() {
        // Call #add to add a new GLM. This also adds a corresponding entry in global_loot_modifiers.json.
        add(
                // The name of the modifier. This will be the file name.
                "my_loot_modifier_instance",
                // The loot modifier to add. For the sake of example, we add a weather loot condition.
                new MyLootModifier(new LootItemCondition[] {
                        WeatherCheck.weather().setRaining(true).build()
                }, "somestring", 10, Items.DIRT);
                // A list of data load conditions. Note that these are unrelated to the loot conditions
                // specified on the modifier itself. For the sake of example, we add a mod loaded condition.
                // An overload of #add is available that accepts a vararg of conditions instead of a list.
                List.of(new ModLoadedCondition("create"))
        );
    }
}
```

与所有数据提供器一样，你必须把该提供器注册到 `GatherDataEvent`：

```java
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(event.includeServer(), MyGlobalLootModifierProvider::new);
}
```

[codec]: ../../../datastorage/codecs.md
[datagen]: ../../index.md#data-generation
[loottable]: index.md
[loottableid]: lootconditions#neoforgeloot_table_id
[register]: ../../../concepts/registries.md#methods-for-registering
[resloc]: ../../../misc/resourcelocation.md
[tags]: ../tags.md

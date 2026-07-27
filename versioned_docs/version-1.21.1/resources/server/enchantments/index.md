import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 附魔 {#enchantments}

附魔是可以施加到工具及其他物品上的特殊效果。自 1.21 起，附魔以 [Data Components] 的形式存储在物品上，通过 JSON 定义，并由所谓的附魔效果组件（enchantment effect component）构成。在游戏运行时，某个物品上的附魔存放在 `DataComponentTypes.ENCHANTMENT` 组件中，以 `ItemEnchantment` 实例的形式存在。

要添加一个新附魔，只需在你命名空间的 `enchantment` 数据包子文件夹中创建一个 JSON 文件。例如，要创建一个名为 `examplemod:example_enchant` 的附魔，就需要创建文件 `data/examplemod/enchantment/example_enchantment.json`。

## 附魔 JSON 格式 {#enchantment-json-format}

```json5
{
    // The text component that will be used as the in-game name of the enchantment.
    // Can be a translation key or a literal string. 
    // Remember to translate this in your lang file if you use a translation key!
    "description": {
        "translate": "enchantment.examplemod.enchant_name"
    },
    
    // Which items this enchantment can be applied to.
    // Can be either an item id, such as "minecraft:trident",
    // or a list of item ids, such as ["examplemod:red_sword", "examplemod:blue_sword"]
    // or an item tag, such as "#examplemod:enchantable/enchant_name".
    // Note that this doesn't cause the enchantment to appear for these items in the enchanting table.
    "supported_items": "#examplemod:enchantable/enchant_name",

    // (Optional) Which items this enchantment appears for in the enchanting table.
    // Can be an item, list of items, or item tag.
    // If left unspecified, this is the same as `supported_items`.
    "primary_items": [
        "examplemod:item_a",
        "examplemod:item_b"
    ],

    // (Optional) Which enchantments are incompatible with this one.
    // Can be an enchantment id, such as "minecraft:sharpness",
    // or a list of enchantment ids, such as ["minecraft:sharpness", "minecraft:fire_aspect"],
    // or enchantment tag, such as "#examplemod:exclusive_to_enchant_name".
    // Incompatible enchantments will not be added to the same item by 原版 mechanics.
    "exclusive_set": "#examplemod:exclusive_to_enchant_name",
    
    // The likelihood that this enchantment will appear in the Enchanting Table. 
    // Bounded by [1, 1024].
    "weight": 6,
    
    // The maximum level this enchantment is allowed to reach.
    // Bounded by [1, 255].
    "max_level": 3,
    
    // The maximum cost of this enchantment, measured in "enchanting power". 
    // This corresponds to, but is not equivalent to, the threshold in levels the player needs to meet to bestow this enchantment.
    // See below for details.
    // The actual cost will be between this and the min_cost.
    "max_cost": {
        "base": 45,
        "per_level_above_first": 9
    },
    
    // Specifies the minimum cost of this enchantment; otherwise as above.
    "min_cost": {
        "base": 2,
        "per_level_above_first": 8
    },

    // The cost that this enchantment adds to repairing an item in an anvil in levels. The cost is multiplied by enchantment level.
    // If an item has a DataComponentTypes.STORED_ENCHANTMENTS component, the cost is halved. In 原版, this only applies to enchanted books.
    // Bounded by [1, inf).
    "anvil_cost": 2,
    
    // (Optional) A list of slot groups this enchantment provides effects in. 
    // A slot group is defined as one of the possible values of the EquipmentSlotGroup enum.
    // In 原版, these are: `any`, `hand`, `mainhand`, `offhand`, `armor`, `feet`, `legs`, `chest`, `head`, and  `body`.
    "slots": [
        "mainhand"
    ],

    // The effects that this enchantment provides as a map of enchantment effect components (read on).
    "effects": {
        "examplemod:custom_effect": [
            {
                "effect": {
                    "type": "minecraft:add",
                    "value": {
                        "type": "minecraft:linear",
                        "base": 1,
                        "per_level_above_first": 1
                    }
                }
            }
        ]
    }
}
```

### 附魔的花费与等级 {#enchantment-costs-and-levels}

`max_cost` 与 `min_cost` 字段指定了生成此附魔所需附魔力（enchanting power）的上下界。不过，真正利用这两个值的过程稍显曲折。

首先，附魔台会把周围方块 `IBlockExtension#getEnchantPowerBonus()` 的返回值纳入考量。据此，它调用 `EnchantmentHelper#getEnchantmentCost` 为每个槽位推导出一个“基础等级（base level）”。这个等级会在游戏中以菜单里附魔旁边的绿色数字显示出来。对每个附魔，基础等级会被一个由物品可附魔性（其 `IItemExtension#getEnchantmentValue()` 的返回值）推导出的随机值修改两次，如下所示：

`(Modified Level) = (Base Level) + random.nextInt(e / 4 + 1) + random.nextInt(e / 4 + 1)`，其中 `e` 是可附魔性分值。

这个修改后的等级会再随机上下浮动 15%，最后用于选择一个附魔。该等级必须落在你附魔的花费上下界之内，附魔才可能被选中。

从实际效果来看，这意味着你附魔定义中的花费值可能超过 30，有时会远超 30。例如，对于可附魔性为 10 的物品，附魔台产出的附魔花费最高可达 1.15 * (30 + 2 * (10 / 4) + 1) = 40。

## 附魔效果组件 {#enchantment-effect-components}

附魔效果组件是经过特殊注册的 [Data Components]，它们决定了一个附魔的具体功能。组件的类型定义了其效果，而它所包含的数据则用于告知或修改该效果。例如，`minecraft:damage` 组件会按其数据所决定的数量修改武器造成的伤害。

原版定义了各种[内置附魔效果组件][built-in enchantment effect components]，用于实现所有原版附魔。

### 自定义附魔效果组件 {#custom-enchantment-effect-components}

自定义附魔效果组件的应用逻辑必须完全由其创建者自行实现。首先，你应当定义一个类或记录，用于保存实现某个效果所需的信息。举例来说，我们来创建一个示例记录类 `Increment`：

```java
// Define an example data-bearing record.
public record Increment(int value) {
    public static final Codec<Increment> CODEC = RecordCodecBuilder.create(instance ->
            instance.group(
                    Codec.INT.fieldOf("value").forGetter(Increment::value)
            ).apply(instance, Increment::new)
    );

    public int add(int x) {
        return value() + x;
    }
}
```

附魔效果组件类型必须[注册][registered]到 `BuiltInRegistries.ENCHANTMENT_EFFECT_COMPONENT_TYPE`，该注册表接受一个 `DataComponentType<?>`。例如，你可以像下面这样注册一个能存储 `Increment` 对象的附魔效果组件：

```java
// In some registration class
public static final DeferredRegister<DataComponentType<?>> ENCHANTMENT_COMPONENT_TYPES = DeferredRegister.create(BuiltInRegistries.ENCHANTMENT_EFFECT_COMPONENT_TYPE, "examplemod");

public static final DeferredHolder<DataComponentType<?>, DataComponentType<Increment>>> INCREMENT =
    ENCHANTMENT_COMPONENT_TYPES.register("increment",
        () -> DataComponentType.<Increment>builder()
            .persistent(Increment.CODEC)
            .build());
```

现在，我们可以实现一些利用该组件来改变整数值的游戏逻辑：

```java
// Somewhere in game logic where an `itemStack` is available.
// `INCREMENT` is the enchantment component type holder defined above.
// `value` is an integer.
AtomicInteger atomicValue = new AtomicInteger(value);

EnchantmentHelper.runIterationOnItem(stack, (enchantmentHolder, enchantLevel) -> {
    // Acquire the Increment instance from the enchantment holder (or null if this is a different enchantment)
    Increment increment = enchantmentHolder.value().effects().get(INCREMENT.get());

    // If this enchant has an Increment component, use it.
    if(increment != null){
        atomicValue.set(increment.add(atomicValue.get()));
    }
});

int modifiedValue = atomicValue.get();
// Use the now-modified value elsewhere in your game logic.
```

首先，我们调用 `EnchantmentHelper#runIterationOnItem` 的某个重载。该函数接受一个 `EnchantmentHelper.EnchantmentVisitor`，这是一个函数式接口，接受一个附魔及其等级，并会对给定物品堆叠所拥有的所有附魔逐一调用（本质上是一个 `BiConsumer<Enchantment, Integer>`）。

要真正执行调整，请使用提供的 `Increment#add` 方法。由于这处于 Lambda 表达式内部，我们需要使用一个能够原子更新的类型（例如 `AtomicInteger`）来修改这个值。这样也允许在同一物品上运行多个 `INCREMENT` 组件并叠加它们的效果，正如原版中所发生的那样。

### `ConditionalEffect` {#conditionaleffect}
把类型包装进 `ConditionalEffect<?>`，可以让附魔效果组件基于给定的 [LootContext] 有条件地生效。

`ConditionalEffect` 提供了 `ConditionalEffect#matches(LootContext context)`，它根据其内部的 `Optional<LootItemConditon>` 返回该效果是否应被允许运行，并处理其 `LootItemCondition` 的序列化与反序列化。

原版额外添加了一个辅助方法，进一步简化了检查这些条件的流程：`Enchantment#applyEffects()`。该方法接受一个 `List<ConditionalEffect<T>>`，逐一评估条件，并对每个条件已满足的 `ConditionalEffect` 中所包含的 `T` 运行一个 `Consumer<T>`。由于许多原版附魔效果组件都被定义为 `List<ConditionalEffect<?>>`，它们可以像下面这样直接传入该辅助方法：

```java
// `enchant` is an Enchantment instance.
// `lootContext` is a LootContext instance.
Enchantment.applyEffects(
    enchant.getEffects(EnchantmentEffectComponents.KNOCKBACK), // Or whichever other List<ConditionalEffect<T>> you want
    lootContext,
    (effectData) -> // Use the effectData (in this example, an EnchantmentValueEffect) however you want.
);
```

注册一个由 `ConditionalEffect` 包装的自定义附魔效果组件类型，可以像下面这样完成：

```java
public static final DeferredHolder<DataComponentType<?>, DataComponentType<ConditionalEffect<Increment>>> CONDITIONAL_INCREMENT =
    ENCHANTMENT_COMPONENT_TYPES.register("conditional_increment",
        () -> DataComponentType.ConditionalEffect<Increment>builder()
            // The LootContextParamSet needed depends on what the enchantment is supposed to do.
            // This might be one of ENCHANTED_DAMAGE, ENCHANTED_ITEM, ENCHANTED_LOCATION, ENCHANTED_ENTITY, or HIT_BLOCK
            // since all of these bring the enchantment level into context (along with whatever other information is indicated).
            .persistent(ConditionalEffect.codec(Increment.CODEC, LootContextParamSets.ENCHANTED_DAMAGE))
            .build());
```
`ConditionalEffect.codec` 的参数是泛型 `ConditionalEffect<T>` 的 Codec，后跟某个 `LootContextParamSets` 条目。

## 附魔的数据生成 {#enchantment-data-generation}

附魔 JSON 文件可以通过[数据生成][data generation]系统自动创建，方法是把一个 `RegistrySetBuilder` 传入 `DatapackBuiltInEntriesProvider`。生成的 JSON 会被放置到 `<project root>/src/generated/data/<modid>/enchantment/<path>.json`。

关于 `RegistrySetBuilder` 与 `DatapackBuiltinEntriesProvider` 如何工作的更多信息，请参阅[数据包注册表的数据生成][Data Generation for Datapack Registries]一文。

<Tabs>
<TabItem value="datagen" label="Datagen">

```java

// This RegistrySetBuilder should be passed into a DatapackBuiltinEntriesProvider in your GatherDataEvent handler.
RegistrySetBuilder BUILDER = new RegistrySetBuilder();
BUILDER.add(
    Registries.ENCHANTMENT,
    bootstrap -> bootstrap.register(
        // Define the ResourceKey for our enchantment.
        ResourceKey.create(
            Registries.ENCHANTMENT,
            ResourceLocation.fromNamespaceAndPath("examplemod", "example_enchantment")
        ),
        new Enchantment(
            // The text Component that specifies the enchantment's name.
            Component.literal("Example Enchantment"),  
            
            // Specify the enchantment definition of for our enchantment.
            new Enchantment.EnchantmentDefinition(
                // A HolderSet of Items that the enchantment will be compatible with.
                HolderSet.direct(...), 

                // An Optional<HolderSet> of items that the enchantment considers "primary".
                Optional.empty(), 

                // The weight of the enchantment.
                30, 

                // The maximum level this enchantment can be.
                3, 

                // The minimum cost of the enchantment. The first parameter is base cost, the second is cost per level.
                new Enchantment.Cost(3, 1), 

                // The maximum cost of the enchantment. As above.
                new Enchantment.Cost(4, 2), 

                // The anvil cost of the enchantment.
                2, 

                // A list of EquipmentSlotGroups that this enchantment has effects in.
                List.of(EquipmentSlotGroup.ANY) 
            ),
            // A HolderSet of incompatible other enchantments.
            HolderSet.empty(), 

            // A DataComponentMap of the enchantment effect components associated with this enchantment and their values.
            DataComponentMap.builder() 
                .set(MY_ENCHANTMENT_EFFECT_COMPONENT_TYPE, new ExampleData())
                .build()
        )
    )
);

```

</TabItem>

<TabItem value="json" label="JSON" default>

```json5
// For more detail on each entry, please check the section above on the enchantment JSON format.
{
    // The anvil cost of the enchantment.
    "anvil_cost": 2,

    // The text Component that specifies the enchantment's name.
    "description": "Example Enchantment",

    // A map of the effect components associated with this enchantment and their values.
    "effects": {
        // <effect components>
    },

    // The maximum cost of the enchantment.
    "max_cost": {
        "base": 4,
        "per_level_above_first": 2
    },

    // The maximum level this enchantment can be.
    "max_level": 3,

    // The minimum cost of the enchantment.
    "min_cost": {
        "base": 3,
        "per_level_above_first": 1
    },

    // A list of EquipmentSlotGroup aliases that this enchantment has effects in.
    "slots": [
        "any"
    ],

    // The set of items that this enchantment can be applied to using an anvil.
    "supported_items": /* <supported item list> */,

    // The weight of this enchantment.
    "weight": 30
}
```

</TabItem>
</Tabs>

[Data Components]: /docs/items/datacomponents
[Codec]: /docs/datastorage/codecs
[Enchantment definition Minecraft wiki page]: https://minecraft.wiki/w/Enchantment_definition
[registered]: /docs/concepts/registries
[Predicate]: https://minecraft.wiki/w/Predicate
[data generation]: /docs/resources/#data-generation
[Data Generation for Datapack Registries]: https://docs.neoforged.net/docs/concepts/registries/#data-generation-for-datapack-registries
[relevant minecraft wiki page]: https://minecraft.wiki/w/Enchantment_definition#Entity_effects
[built-in enchantment effect components]: builtin.md
[LootContext]: /docs/resources/server/loottables/#loot-context
---
title: 1.21.11 -> 26.1
sidebar_position: 3
---
# Minecraft 1.21.11 -> 26.1 Mod 迁移导读 {#minecraft-12111---261-mod-migration-primer}

这是一份高层次、非详尽的概览，介绍如何将你的 Mod 从 1.21.11 迁移到 26.1。本文不针对任何特定的 Mod 加载器，只关注原版类的变化。

本导读采用 [知识共享署名 4.0 国际许可协议](http://creativecommons.org/licenses/by/4.0/) 授权，你可以放心地将其作为参考，并保留一个链接，方便其他读者查阅本导读。

如果发现任何错误或缺失的信息，请在本仓库提交 issue，或在 Neoforged Discord 服务器中 ping @ChampionAsh5357。

鸣谢：

- @Shnupbups 修正了一些语法问题
- @cassiancc 提供了关于 Java 25 IDE 支持的信息
- @boq 提供了关于 IME 支持的信息
- @lolothepro 指出了一处拼写错误

## 资源包变化 {#pack-changes}

原版中还有一些面向用户的变化未在下文讨论，但可能与 Mod 开发者相关。你可以在 [Misode 的版本更新日志](https://misode.github.io/versions/?id=26.1&tab=changelog) 中找到它们的列表。

## Java 25 与反混淆 {#java-25-and-deobfuscation}

26.1 在整体流程中引入了两项新变化。

首先，Java Development Kit 已从 21 升级到 25。原版使用了这些新特性，例如 [JEP 447](https://openjdk.org/jeps/447)，它允许在构造器中于 `super` 之前编写语句。对于 Mod 开发者，请务必相应地更新，或善用你的 IDE 或构建工具的相关功能。 Microsoft 的 OpenJDK 可在 [此处](https://learn.microsoft.com/en-us/java/openjdk/download#openjdk-25) 找到。

你可能需要更新 IDE 以支持 Java 25。如果使用 Eclipse，至少需要 2025-12 版本，或 2025-09 版本加上市场中的 Java 25 Support 插件。如果使用 IntelliJ IDEA，至少需要 2025.2 版本。

原版也重新回到了反混淆状态，这意味着所有值类型现在都拥有 Mojang 提供的官方名称。由于 Java 编译过程的原因，仍有一些内容未被捕获，例如内联的基本类型和字符串常量，但大部分现已提供。这只会对使用了与官方映射不同的值类型映射集的用户或 Mod 加载器产生影响。

## 战利品类型展开 {#loot-type-unrolling}

战利品池条目、物品函数、物品条件、 nbt 提供器、数字提供器、计分板提供器、 int 提供器和 float 提供器不再使用一个包装对象类型来充当注册实例。现在，注册表直接接收用于序列化与反序列化过程的 `MapCodec`。因此，持有 codec 的 `*Type` 类或记录已被移除。此外，`getType` 现已重命名为 `codec`，接收注册的 `MapCodec`。

```java
// The following is an example with LootItemFunctions, but can roughly apply to the other instances as well

public record NoopItemFunction() implements LootItemFunction {
    public static final NoopItemFunction INSTANCE = new NoopItemFunction();
    // The map codec used as the registry object
    public static final MapCodec<NoopItemFunction> MAP_CODEC = MapCodec.unit(INSTANCE);

    // Replaces getType
    @Override
    public MapCodec<NoopItemFunction> codec() {
        // Return the registry object
        return MAP_CODEC;
    }
}

// Register the map codec to the appropriate registry
Registry.register(BuiltInRegistries.LOOT_FUNCTION_TYPE, Identifier.fromNamespaceAndPath("examplemod", "noop"), NoopItemFunction.MAP_CODEC);
```

- `net.minecraft.core.registries.BuiltInRegistries`、 `Registries`
    - `LOOT_POOL_ENTRY_TYPE` 现在持有 `LootPoolEntryContainer` 的 map codec，而非 `LootPoolEntryType`
    - `LOOT_FUNCTION_TYPE` 现在持有 `LootItemFunction` 的 map codec，而非 `LootItemFunctionType`
    - `LOOT_CONDITION_TYPE` 现在持有 `LootItemCondition` 的 map codec，而非 `LootItemConditionType`
    - `LOOT_NUMBER_PROVIDER_TYPE` 现在持有 `NumberProvider` 的 map codec，而非 `LootNumberProviderType`
    - `LOOT_NBT_PROVIDER_TYPE` 现在持有 `NbtProvider` 的 map codec，而非 `LootNbtProviderType`
    - `LOOT_SCORE_PROVIDER_TYPE` 现在持有 `ScoreboardNameProvider` 的 map codec，而非 `LootScoreProviderType`
    - `FLOAT_PROVIDER_TYPE` 现在持有 `FloatProvider` 的 map codec，而非 `FloatProviderType`
    - `INT_PROVIDER_TYPE` 现在持有 `IntProvider` 的 map codec，而非 `IntProviderType`
- `net.minecraft.util.valueproviders` 现在将 `CODEC` 字段重命名为 `MAP_CODEC`
    - `FloatProvider` 的子类型现在全部为记录
    - 除 `WeightedListInt` 外，`IntProvider` 的子类型现在全部为记录
    - `FloatProvider` 现在由 `class` 变为 `interface`
        - `CODEC` -> `FloatProviders#CODEC`
        - `codec` -> `FloatProviders#codec`
        - `getType` ->  `codec`，非一一对应
        - `getMinValue` -> `min`
        - `getMaxValue` -> `max`
    - `FloatProviders` —— 所有可注册的原版 float 提供器。
    - `FloatProviderType` 接口已被移除
        - 单例字段已全部移除，请改用各类中的 map codec
        - `codec` -> `FloatProvider#codec`
    - `IntProvider` 现在由 `class` 变为 `interface`
        - `CODEC` -> `IntProviders#CODEC`
        - `NON_NEGATIVE_CODEC` -> `IntProviders#NON_NEGATIVE_CODEC`
        - `POSITIVE_CODEC` -> `IntProviders#POSITIVE_CODEC`
        - `codec` -> `IntProviders#codec`
        - `validateCodec` -> `IntProviders#validateCodec`
        - `getMinValue` -> `minInclusive`
        - `getMaxValue` -> `maxInclusive`
        - `getType` ->  `codec`，非一一对应
    - `IntProviders` —— 所有可注册的原版 int 提供器。
    - `IntProviderType` 接口已被移除
        - 单例字段已全部移除，请改用各类中的 map codec
        - `codec` -> `IntProvider#codec`
- `net.minecraft.world.level.storage.loot.entries` 现在将 `CODEC` 字段重命名为 `MAP_CODEC`
    - `LootPoolEntries` 的单例字段已全部移除
        - 应改用各类中的 map codec
        - `bootstrap` —— 注册战利品池条目。
    - `LootPoolEntryContainer#getType` -> `codec`，非一一对应
    - `LootPoolEntryType` 记录已被移除
- `net.minecraft.world.level.storage.loot.functions` 现在将 `CODEC` 字段重命名为 `MAP_CODEC`
    - `LootItemFunction#getType` -> `codec`，非一一对应
    - `LootItemFunctions` 的单例字段已全部移除
        - 应改用各类中的 map codec
        - `bootstrap` —— 注册战利品物品函数。
    - `LootItemFunctionType` 记录已被移除
- `net.minecraft.world.level.storage.loot.predicates` 现在将 `CODEC` 字段重命名为 `MAP_CODEC`
    - `LootItemCondition#getType` -> `codec`，非一一对应
    - `LootItemConditions` 的单例字段已全部移除
        - 应改用各类中的 map codec
        - `bootstrap` —— 注册战利品物品条件。
    - `LootItemConditionType` 记录已被移除
- `net.minecraft.world.level.storage.loot.providers.nbt` 现在将 `CODEC` 字段重命名为 `MAP_CODEC`
    - `LootNbtProviderType` 记录已被移除
    - `NbtProvider` 现在实现 `LootContextUser`
        - `getType` -> `codec`，非一一对应
    - `NbtProviders` 的单例字段已全部移除
        - 应改用各类中的 map codec
        - `bootstrap` —— 注册 nbt 提供器。
    - `LootItemConditionType` 记录已被移除
- `net.minecraft.world.level.storage.loot.providers.number` 现在将 `CODEC` 字段重命名为 `MAP_CODEC`
    - `LootNumberProviderType` 记录已被移除
    - `NumberProvider#getType` -> `codec`，非一一对应
    - `NumberProviders` 的单例字段已全部移除
        - 应改用各类中的 map codec
        - `bootstrap` —— 注册数字提供器。
- `net.minecraft.world.level.storage.loot.providers.score` 现在将 `CODEC` 字段重命名为 `MAP_CODEC`
    - `LootScoreProviderType` 记录已被移除
    - `ScoreProvider` 现在实现 `LootContextUser`
        - `getType` -> `codec`，非一一对应
    - `ScoreProviders` 的单例字段已全部移除
        - 应改用各类中的 map codec
        - `bootstrap` —— 注册计分板提供器。

## 校验机制全面翻新 {#validation-overhaul}

用于收集并报告数据生成内容问题的校验处理器已被全面翻新。它不是、也从来不是字段校验的替代品。校验处理器专门用于更方便地处理多份信息之间的校验，而这些信息可能不会暴露在单个字段上，例如某个战利品提供器是否可用于给定的上下文参数。

所有需要校验的对象都实现了 `Validatable`，或专用于进度条件的 `CriterionTriggerInstance`。这两者都提供一个方法：`validate`，用于检查对象的有效性。 `validate` 接收一个 `ValidationContext`，其本质上持有用于收集问题的 `ProblemReporter`、当前上下文参数以及一个引用解析器。 `CriterionTriggerInstance` 提供的是 `ValidationContextSource`，但可以通过某个 `context` 方法将其转换为 `ValidationContext`，并提供用于检查的上下文参数。如果特定对象无法通过校验，则会调用 `ValidationContext#reportProblem`，详述具体问题。

```java
// For some object that implements Validatable

@Override
public void validate(ValidationContext ctx) {
    // Check if a specific condition is validated.
    if (this.foo() != this.bar()) {
        // If not, report that there is an issue.
        ctx.reportProblem(() -> "'Foo' does not equal 'bar'.");
    }
}
```

如果对象本身没有问题，而是其中的特定字段有问题，那么报告器可以在检查各个元素时沿调用栈向下追踪，使用某个 `ValidationContext#for*` 方法执行类似的操作。

```java
// For some object that implements Validatable
// Let's assume it has a list of children objects.

@Override
public void validate(ValidationContext ctx) {
    for (int i = 0; i < this.children.size(); i++) {
        // Get specific context for child in list
        var childCtx = ctx.forIndexedField("children", i);
        // Check if a specific condition is validated.
        if (this.foo() != this.bar()) {
            // If not, report that there is an issue.
            childCtx.reportProblem(() -> "'Foo' does not equal 'bar'.");
        }
    }
}
```

`Validatable` 还提供了一些静态工具方法，用于检查其他 `Validatable` 字段。

```java
// For some object that implements Validatable
// Assume some child object also implements Validatable

@Override
public void validate(ValidationContext ctx) {
    Validatable.validate(ctx, "child", this.child);
}
```

在所有需要的对象上实现 `Validatable` 之后，就可以根据使用位置来调用校验（通常在反序列化之后或序列化之前）。这些调用的调用栈通常如下：

```java
// For some Validatable validatable
// Let's assume we have access to the HolderGetter.Provider provider.
// The parameter itself is optional if not available.

// Create the problem collector and validation context.
// The context params should only include the ones that are being provided.
ProblemReporter reporter = new ProblemCollector.Collector();
ValidationContext ctx = new ValidationContext(reporter, LootContextParamSets.ALL_PARAMS, provider);

// Call the validator
validatable.validate(ctx);
```

也可以通过 `Codec#validate` 将其附加到 codec 的末尾：

```java
public record ExampleObject() implements Validatable {
    public static final Codec<ExampleObject> CODEC = MapCodec.unitCodec(
        ExampleObject::new
    ).validate(
        // Supply the validator along with the context params to check against.
        // This method does not have access to the registry provider.
        Validatable.validatorForContext(LootContextParamSets.ALL_PARAMS)
    );

    @Override
    public void validate(ValidationContext ctx) {
        // ...
    }
}
```

- `net.minecraft.advancements.CriterionTriggerInstance#validate` 现在接收 `ValidationContextSource`，而非 `CriterionValidator`
- `net.minecraft.advancements.criterion`
    - `ContextAwarePredicate` 现在实现 `Validatable`
    - `CriterionValidator` -> `ValidationContextSource` 和 `Validatable`
        - `Validatable` 包含 `validate*` 方法
        - `ValidationContextSource` 持有上下文与报告器
- `net.minecraft.world.item.enchantment`
    - `ConditionalEffect` 现在实现 `Validatable`
        - `conditionCodec` 被替换为在加载后调用 `validate`
    - `TargetedConditionalEffect` 现在实现 `Validatable`
- `net.minecraft.world.level.storage.loot`
    - `IntRange` 现在实现 `LootContextUser`
        - `getReferencedContextParams` 被 `validate` 替换
    - `LootContext$VisitedEntry` 的泛型现在必须继承 `Validatable`
    - `LootContextUser` 现在实现 `Validatable`
    - `LootDataType` 的泛型现在必须继承 `Validatable`
        - 构造器现在接收 `$ContextGetter`，而非 `$Validator`
        - `runValidation` 现在接收 `ValidationContextSource`，而非 `ValidationContext`
            - 还有一个接收 `HolderLookup`（而非键值对）的重载
        - `createSimpleValidator`、 `createLootTableValidator`、 `$Validator` 被 `Validatable` 替换
        - `$ContextGetter` —— 获取某个值的 `ContextKeySet`。
    - `LootPool` 现在实现 `Validatable`
    - `LootTable` 现在实现 `Validatable`
    - `Validatable` —— 一个接口，负责在给定上下文中处理其实例的校验。
    - `ValidationContext`
        - `forField` —— 为给定字段创建上下文。
        - `forIndexedField` —— 为列表中的给定条目创建上下文。
        - `forMapField` —— 为映射中的给定键创建上下文。
        - `setContextKeySet` 已被移除
    - `ValidationContextSource` —— 校验所在的既定上下文的来源。
- `net.minecraft.world.level.storage.loot.entries.LootPoolEntryContainer` 现在实现 `Validatable`
- `net.minecraft.world.level.storage.loot.functions`
    - `SetAttributesFunction$Modifier` 现在实现 `LootContextUser`
    - `SetStewEffectFunction$EffectEntry` 现在实现 `LootContextUser`

## 数据包村民交易 {#datapack-villager-trades}

村民交易已从原先基于映射的设置改为数据生成的注册表。乍看之下，这个系统似乎更受限，但实际上它同样可扩展，只是方式相当曲折——因为交易在功能上本身就是一张战利品表，用于决定交易者能提供哪些 `MerchantOffer`。为便于理解，本节将介绍交易重写的基础知识，以及如何将之前的每种物品清单转换为 `VillagerTrade`。

### 理解交易格式 {#understanding-the-trade-format}

所有交易都以 `VillagerTrade` 表示，其核心决定了交易者 `wants`（想要）什么，以及作为回报 `gives`（给出）什么。每笔交易还可以为物品本身或其代价提供修改器，或在给定条件下决定这笔特定交易是否根本能够进行。每笔交易还指定了可进行的交易次数、给予多少经验，或与用户声望相乘的价格倍数。随后 `VillagerTrade` 通过 `getOffer` 转换为 `MerchantOffer`，该方法接收 `LootContext`，通常带有上下文参数 `LootContextParamSets#VILLAGER_TRADE`，并提供交易者本身（`THIS_ENTITY`）及其位置（`ORIGIN`）。

交易本身位于 `data/<namespace>/villager_trade/<path>`。路径通常包含该交易所对应的职业和等级，例如 `examplemod:example_profession/1/example_trade`

```json5
// For some villager trade 'examplemod:example_profession/1/example_trade'
// JSON at 'data/examplemod/villager_trade/example_profession/1/example_trade.json'
{
    // The stack the trader wants.
    "wants": {
        // The item of the stack.
        "id": "minecraft:apple",
        // A number provider used to determine how much
        // of the item that it wants. Once the count is
        // determined, any additional cost on the `gives`
        // stack (via `ADDITIONAL_TRADE_COST` component)
        // is added to the count before being clamped to
        // the max stack size.
        // If not specified, defaults to 1.
        "count": {
            "type": "minecraft:uniform",
            "min": 1,
            "max": 5
        },
        // Any components that stack should have. The stack
        // must have the exact components specified.
        // If not specified, then no components will be
        // checked, meaning that this is ignored.
        "components": {
            // Map of registry key to component value.
            "minecraft:custom_name": "Apple...?"
        }
    },
    // An additional stack the trader wants.
    // If not specified, the trader only checks `wants`.
    "additional_wants": {
        "id": "minecraft:emerald"
    },
    // The stack template the trader gives in return.
    "gives": {
        // The item of the stack.
        "id": "minecraft:golden_apple",
        // A number [1, 99].
        // If not specified, defaults to 1.
        "count": 1,
        // The components to apply to the stack.
        // If not specified, just applies the default
        // item components.
        "components": {
            "minecraft:custom_name": "Not an Apple"
        }
    },
    // A number provider to determine how many times
    // the trade can be performed by the player before
    // the trader restocks. The value will always be at
    // least 1.
    // If not specified, defaults to 4.
    "max_uses": {
        "type": "minecraft:uniform",
        "min": 1,
        "max": 20
    },
    // A number provider to determine the price multiplier
    // to apply to the cost of the item based on the player's
    // reputation with the trader and the item demand,
    // calculated from how many times the player has performed
    // the trade. This should generally be a small number as
    // the maximum reputation a user can have per trader is 150,
    // though it's more likely to have a reputation of 25 at most.
    // However, the trade must always have a minimum of one item,
    // even if the reputation discount multiplied with the reputation
    // indicates 100% or more off.
    // If not specified, defaults to 0.
    "reputation_discount": {
        "type": "minecraft:uniform",
        "min": 0,
        "max": 0.05
    },
    // A number provider to determine the amount of experience
    // the player obtains from performing the trade with the trader.
    // This is typically around 5-30 xp for 原版 trades.
    // If not specified, defaults to 1.
    "xp": {
        "type": "minecraft:uniform",
        "min": 10,
        "max": 20
    },
    // A loot item condition that determines whether the
    // trader can provide the trade to the player.
    // If not specified, defaults to always true.
    "merchant_predicate": {
        // This trade can only be performed by villagers
        // from a desert or snow village.
        "condition": "minecraft:entity_properties",
        "entity": "this",
        "predicate": {
            "predicates": {
                "minecraft:villager/variant": [
                    "minecraft:desert",
                    "minecraft:snow"
                ]
            }
        }
    },
    // A list of loot item functions that modify the item
    // offered from `gives` to the player.
    // If not specified, `gives` is not modified.
    "given_item_modifiers": [
        {
            // Chooses a random enchantment from the provided tag
            "function": "minecraft:enchant_randomly",
            // If this is true, the trade cost increases the
            // number of `wants` items required.
            "include_additional_cost_component": true,
            "only_compatible": false,
            "options": "#minecraft:trades/desert_common"
        }
    ],
    // Can either be an enchantment id, such as "minecraft:protection",
    // or a list of enchantment ids, such as ["minecraft:protection", "minecraft:smite", ...],
    // or an enchantment tag, such as "#minecraft:trades/desert_common".
    // When provided, if the `gives` item after modifiers contains an
    // enchantment in this list, then the number of `wants` items required
    // is multiplied by 2.
    // If not specified, does nothing.
    "double_trade_price_enchantments": "#minecraft:trades/desert_common"
}
```

### 交易者的交易 {#the-trades-of-a-trader}

每个交易者都可以进行多次交易，通常从称为 `TradeSet` 的指定池中进行选择。交易集本身是一个单独的数据包注册表，消耗 `VillagerTrade`。每组交易决定可以提供多少交易以及是否可以多次选择同一交易。提供的交易在 `AbstractVillager#addOffersFromTradeSet` 内计算，首先调用 `TradeSet#calculateNumberOfTrades` 获取报价数量，然后使用 `AbstractVillager#addOffersFromItemListings` 或 `AbstractVillager#addOffersFromItemListingsWithoutDuplicates` 选择要使用的报价。

请注意，如果允许重复交易，则存在潜在的竞争条件，即如果所有交易的 `merchant_predicate` 都失败，则报价将永远循环。这是因为该方法始终假设可以进行一笔交易。

交易集在 `data/<namespace>/trade_set/<path>` 范围内。通常，路径包含交易所针对的职业和级别，例如 `examplemod:example_profession/level_1.json`

```json5
// For some trade set 'examplemod:example_profession/level_1'
// JSON at 'data/examplemod/villager_trade/trade_set/level_1.json'
{
    // Can either be a villager trade id, such as "examplemod:example_profession/1/example_trade",
    // or a list of trade ids, such as ["examplemod:example_profession/1/example_trade", "minecraft:farmer/1/wheat_emerald", ...],
    // or an trade tag, such as "#examplemod:example_profession/level_1".
    // This is the set of trades that can be offered by the trader.
    // This should always be a villager trade tag so allow other users
    // to easily add their own trades to a trader.
    "trades": "#examplemod:example_profession/level_1",
    // A number provider that determines the number of offers that can be
    // made by the trader.
    "amount": {
        "type": "minecraft:uniform",
        "min": 1,
        "max": 5
    },
    // Whether the same trade can be used to make multiple offers.
    // If not specified, defaults to false.
    "allow_duplicates": true,
    // An identifier that determines the unique random instance to
    // user when determining the offers.
    // If not specified, uses the level random.
    "random_sequence": "examplemod:example_profession/level_1"
}
```

村民贸易标签可能是：

```json5
// For some tag 'examplemod:example_profession/level_1'
// JSON at 'data/examplemod/tags/villager_trade/example_profession/level_1.json'
{
    "values": [
        "examplemod:example_profession/1/example_trade"
    ]
}
```

这也意味着可以通过添加相关标签来轻松地将交易添加到现有交易集中：

```json5
// For some tag 'minecraft:farmer/level_1'
// JSON at 'data/minecraft/tags/villager_trade/farmer/level_1.json'
{
    "values": [
        "examplemod:example_profession/1/example_trade"
    ]
}
```

同时，添加到新的 `VillagerProfession` 是通过将 level int 映射到 `tradeSetsByLevel` 中的交易集键来完成的：

```java
public static final VillagerProfession EXAMPLE = Registry.register(
    BuiltInRegistries.VILLAGER_PROFESSION,
    Identifier.fromNamespaceAndPath("examplemod", "example_profession"),
    new VillagerProfession(
        Component.literal(""),
        p -> true,
        p -> true,
        ImmutableSet.of(),
        ImmutableSet.of(),
        null,
        // A map of profession level to trade set keys
        Int2ObjectMap.ofEntries(
            Int2ObjectMap.entry(
                // The profession level
                1,
                // The trade set id
                ResourceKey.create(Registries.TRADE_SET, Identifier.fromNamespaceAndPath("examplemod", "example_profession/level_1"))
            )
        )
    )
);
```

### 商品列表转换 {#item-listing-conversions}

考虑到这一切，我们现在可以将物品列表转换为新的数据生成的村民交易。

#### 祖母绿至物品 {#emeralds-to-items}

对于以下交易：

```java
public static final VillagerTrades.ItemListing ITEM_TO_EMERALD = new VillagerTrades.EmeraldForItems(
    // The item the trader wants.
    Items.WHEAT,
    // The number of items the trader wants.
    20,
    // The maximum number of times the trade can be made
    // before restock.
    16,
    // The amount of experience given for the trade.
    2,
    // The number of emeralds given in return.
    1
);

public static final VillagerTrades.ItemListing EMERALD_TO_ITEM = new VillagerTrades.ItemsForEmeralds(
    // The item the trader will give in return.
    Items.BREAD,
    // The number of emeralds the trader wants.
    1,
    // The number of items the trader will give.
    6,
    // The maximum number of times the trade can be made
    // before restock.
    16,
    // The amount of experience given for the trade.
    1,
    // The price multiplier to apply to the offer, given
    // reputation and demand.
    0.05f
);
```

他们的等价物是：

```json5
// For some villager trade 'examplemod:item_to_emerald'
// JSON at 'data/examplemod/villager_trade/item_to_emerald.json'
{
    "gives": {
        // The number of emeralds given in return.
        "count": 1,
        "id": "minecraft:emerald"
    },
    // The maximum number of times the trade can be made
    // before restock.
    "max_uses": 16,
    // The price multiplier to apply to the offer, given
    // reputation and demand.
    // `EmeraldForItems` hardcoded this to 0.05
    "reputation_discount": 0.05,
    "wants": {
        // The number of items the trader wants.
        "count": 20,
        // The item the trader wants.
        "id": "minecraft:wheat"
    },
    // The amount of experience given for the trade.
    "xp": 2
}


// For some villager trade 'examplemod:emerald_to_item'
// JSON at 'data/examplemod/villager_trade/emerald_to_item.json'
{
    "gives": {
        // The number of items the trader will give.
        "count": 6,
        // The item the trader will give in return.
        "id": "minecraft:bread"
    },
    // The maximum number of times the trade can be made
    // before restock.
    "max_uses": 16,
    // The price multiplier to apply to the offer, given
    // reputation and demand.
    "reputation_discount": 0.05,
    "wants": {
        "id": "minecraft:emerald",
        // The number of emeralds the trader wants.
        "count": 1
    },
    // The amount of experience given for the trade.
    "xp": 1
}
```

#### 物品和祖母绿至物品 {#items-and-emeralds-to-items}

对于以下贸易：

```java
public static final VillagerTrades.ItemListing ITEM_EMERALD_TO_ITEM = new VillagerTrades.ItemsAndEmeraldsToItems(
    // The item the trader wants.
    Items.COD,
    // The number of items the trader wants.
    6,
    // The number of emeralds the trader additionally wants.
    1,
    // The item the trader will give in return.
    Items.COOKED_COD,
    // The number of items the trader will give.
    6,
    // The maximum number of times the trade can be made
    // before restock.
    16,
    // The amount of experience given for the trade.
    1,
    // The price multiplier to apply to the offer, given
    // reputation and demand.
    0.05f
);
```

等价的是：

```json5
// For some villager trade 'examplemod:item_emerald_to_item'
// JSON at 'data/examplemod/villager_trade/item_emerald_to_item.json'
{
    // The emeralds the trader additionally wants.
    "additional_wants": {
        "id": "minecraft:emerald",
    },
    "gives": {
        // The number of items the trader will give.
        "count": 6,
        // The item the trader will give in return.
        "id": "minecraft:cooked_cod"
    },
    // The maximum number of times the trade can be made
    // before restock.
    "max_uses": 16,
    // The price multiplier to apply to the offer, given
    // reputation and demand.
    "reputation_discount": 0.05,
    "wants": {
        // The number of items the trader wants.
        "count": 6,
        // The item the trader wants.
        "id": "minecraft:cod"
    },
    // The amount of experience given for the trade.
    "xp": 1
}
```

#### 祖母绿到染色盔甲 {#emeralds-to-dyed-armor}

对于以下贸易：

```java
public static final VillagerTrades.ItemListing EMERALD_TO_DYED_ARMOR = new VillagerTrades.DyedArmorForEmeralds(
    // The item the trader will give in return and dye.
    Items.LEATHER_HELMET,
    // The number of emeralds the trader wants.
    5,
    // The maximum number of times the trade can be made
    // before restock.
    12,
    // The amount of experience given for the trade.
    5
);
```

等价的是：

```json5
// For some villager trade 'examplemod:emerald_to_dyed_armor'
// JSON at 'data/examplemod/villager_trade/emerald_to_dyed_armor.json'
{
    "given_item_modifiers": [
        {
            // Sets the random dye(s) on the armor.
            "function": "minecraft:set_random_dyes",
            "number_of_dyes": {
                "type": "minecraft:sum",
                "summands": [
                    1.0,
                    {
                        "type": "minecraft:binomial",
                        "n": 2.0,
                        "p": 0.75
                    }
                ]
            }
        },
        {
            // Checks that the dye was successfully applied
            // to the item.
            "function": "minecraft:filtered",
            "item_filter": {
                "items": "minecraft:leather_helmet",
                "predicates": {
                    "minecraft:dyed_color": {}
                }
            },
            // If it fails, discards the offer.
            "on_fail": {
                "function": "minecraft:discard"
            }
        }
    ],
    "gives": {
        "count": 1,
        // The item the trader will give in return and dye.
        "id": "minecraft:leather_helmet"
    },
    // The maximum number of times the trade can be made
    // before restock.
    "max_uses": 12,
    // The price multiplier to apply to the offer, given
    // reputation and demand.
    "reputation_discount": 0.05,
    "wants": {
        // The number of emeralds the trader wants.
        "count": 5,
        "id": "minecraft:emerald"
    },
    // The amount of experience given for the trade.
    "xp": 5
}
```

#### 祖母绿到附魔物品 {#emeralds-to-enchanted-item}

对于以下贸易：

```java
public static final VillagerTrades.ItemListing EMERALD_TO_ENCHANTED_BOOK = new VillagerTrades.EnchantBookForEmeralds(
    // The amount of experience given for the trade.
    30,
    // The minimum level used when selecting the stored enchantments on the book.
    3,
    // The maximum level used when selecting the stored enchantments on the book.
    3,
    // A tag containing the list of available enchantments to select from for the book.
    EnchantmentTags.TRADES_DESERT_SPECIAL
);

public static final VillagerTrades.ItemListing EMERALD_TO_ENCHANTED_ITEM = new VillagerTrades.EnchantedItemForEmeralds(
    // The item the trader will give in return and try to enchant.
    Items.FISHING_ROD,
    // The base number of emeralds the trader wants.
    3,
    // The maximum number of times the trade can be made
    // before restock.
    3,
    // The amount of experience given for the trade.
    10,
    // The price multiplier to apply to the offer, given
    // reputation and demand.
    0.2f
);
```

等价的是：

```json5
// For some villager trade 'examplemod:emerald_to_enchanted_book'
// JSON at 'data/examplemod/villager_trade/emerald_to_enchanted_book.json'
{
    // The trader expects a book to write the enchantment to.
    "additional_wants": {
        "id": "minecraft:book"
    },
    // Trade cost for emeralds increased when in the double trade price
    // tag.
    "double_trade_price_enchantments": "#minecraft:double_trade_price",
    "given_item_modifiers": [
        {
            "function": "minecraft:enchant_with_levels",
            "include_additional_cost_component": true,
            "levels": {
                "type": "minecraft:uniform",
                // The minimum level used when selecting the stored enchantments on the book.
                "min": 3,
                // The maximum level used when selecting the stored enchantments on the book.
                "max": 3
            },
            // The list of available enchantments to select from for the book.
            "options": [
                "minecraft:efficiency"
            ]
        },
        {
            // Make sure the enchantment was added successfully with the given level.
            "function": "minecraft:filtered",
            "item_filter": {
                "items": "minecraft:enchanted_book",
                "predicates": {
                    "minecraft:stored_enchantments": [
                        {
                            "levels": {
                                // The minimum level used when selecting the stored enchantments on the book.
                                "min": 3,
                                // The maximum level used when selecting the stored enchantments on the book.
                                "max": 3
                            }
                        }
                    ]
                }
            },
            // Discard on failure
            "on_fail": {
                "function": "minecraft:discard"
            }
        }
    ],
    // The trader gives the enchanted book.
    "gives": {
        "count": 1,
        "id": "minecraft:enchanted_book"
    },
    // The maximum number of times the trade can be made
    // before restock was hardcoded to 12.
    "max_uses": 12,
    // The price multiplier to apply to the offer, given
    // reputation and demand, hardcoded to 0.2.
    "reputation_discount": 0.2,
    "wants": {
        "count": {
            "type": "minecraft:sum",
            "summands": [
                // A hardcoded computation based on the min and max
                // level of the enchantment.
                11.0,
                {
                    "type": "minecraft:uniform",
                    "max": 35.0,
                    "min": 0.0
                }
            ]
        },
        "id": "minecraft:emerald"
    },
    // The amount of experience given for the trade.
    "xp": 30
}

// For some villager trade 'examplemod:emerald_to_enchanted_item'
// JSON at 'data/examplemod/villager_trade/emerald_to_enchanted_item.json'
{
    "given_item_modifiers": [
        {
            // Applies the enchantment to the given equipment.
            "function": "minecraft:enchant_with_levels",
            "include_additional_cost_component": true,
            "levels": {
                "type": "minecraft:uniform",
                "max": 20,
                "min": 5
            },
            "options": "#minecraft:on_traded_equipment"
        },
        {
            // Checks to make sure the enchantment was applied.
            "function": "minecraft:filtered",
            "item_filter": {
                "items": "minecraft:fishing_rod",
                "predicates": {
                    "minecraft:enchantments": [
                        {}
                    ]
                }
            },
            // On fail, give nothing.
            "on_fail": {
                "function": "minecraft:discard"
            }
        }
    ],
    "gives": {
        "count": 1,
        // The item the trader will give in return and try to enchant.
        "id": "minecraft:fishing_rod"
    },
    // The maximum number of times the trade can be made
    // before restock.
    "max_uses": 3,
    // The price multiplier to apply to the offer, given
    // reputation and demand.
    "reputation_discount": 0.2,
    "wants": {
        "count": {
            "type": "minecraft:sum",
            "summands": [
                // The base number of emeralds the trader wants.
                3,
                {
                    // The variation based on the enchantment level.
                    // Originally, this would be the value used in the
                    // item function, but since they are now isolated,
                    // these values could differ.
                    "type": "minecraft:uniform",
                    "max": 20,
                    "min": 5
                }
            ]
        },
        "id": "minecraft:emerald"
    },
    // The amount of experience given for the trade.
    "xp": 10
}
```

#### 物品和绿宝石药水效果物品 {#items-and-emeralds-to-potion-effect-item}

对于以下贸易：

```java
public static final VillagerTrades.ItemListing EMERALD_TO_SUSPICIOUS_STEW = new VillagerTrades.SuspiciousStewForEmerald(
    // The effect applied by the suspicious stew.
    MobEffects.NIGHT_VISION,
    // The number of ticks the effect should be active for.
    100,
    // The amount of experience given for the trade.
    15
);

public static final VillagerTrades.ItemListing ITEM_EMERALD_TO_TIPPED_ARROW = new VillagerTrades.TippedArrowForItemsAndEmeralds(
    // The item the trader additionally wants.
    Items.ARROW,
    // The number of items the trader additionally wants.
    5,
    // The item the trader will give in return.
    Items.TIPPED_ARROW,
    // The number of items the trader will give.
    5,
    // The number of emeralds the trader wants.
    2,
    // The maximum number of times the trade can be made
    // before restock.
    12,
    // The amount of experience given for the trade.
    30
);
```

等价的是：

```json5
// For some villager trade 'examplemod:emerald_to_suspicious_stew'
// JSON at 'data/examplemod/villager_trade/emerald_to_suspicious_stew.json'
{
    "given_item_modifiers": [
        {
            "effects": [
                {
                    // The effect applied by the suspicious stew.
                    "type": "minecraft:night_vision",
                    // The number of ticks the effect should be active for.
                    "duration": 100
                }
                // 原版 merges all suspicious stew offers
                // into one since this function picks one
                // stew effect at random.
            ],
            "function": "minecraft:set_stew_effect"
        }
    ],
    "gives": {
        "count": 1,
        "id": "minecraft:suspicious_stew"
    },
    // The maximum number of times the trade can be made
    // before restock, hardcoded to 12.
    "max_uses": 12,
    // The price multiplier to apply to the offer, given
    // reputation and demand, hardcoded to 0.05.
    "reputation_discount": 0.05,
    "wants": {
        "id": "minecraft:emerald"
    },
    // The amount of experience given for the trade.
    "xp": 15
}

// For some villager trade 'examplemod:item_emerald_to_tipped_arrow'
// JSON at 'data/examplemod/villager_trade/item_emerald_to_tipped_arrow.json'
{
    "additional_wants": {
        // The number of items the trader additionally wants.
        "count": 5,
        // The item the trader additionally wants.
        "id": "minecraft:arrow"
    },
    "given_item_modifiers": [
        {
            // Applies a random potion effect from the tradable potions.
            // Original implementation just picked any potion at random.
            "function": "minecraft:set_random_potion",
            "options": "#minecraft:tradeable"
        }
    ],
    "gives": {
        // The number of items the trader will give.
        "count": 5,
        // The item the trader will give in return.
        "id": "minecraft:tipped_arrow"
    },
    // The maximum number of times the trade can be made
    // before restock.
    "max_uses": 12,
    // The price multiplier to apply to the offer, given
    // reputation and demand, hardcoded to 0.05.
    "reputation_discount": 0.05,
    "wants": {
        // The number of emeralds the trader wants.
        "count": 2,
        "id": "minecraft:emerald"
    },
    // The amount of experience given for the trade.
    "xp": 30
}
```

#### 祖母绿到藏宝图 {#emeralds-to-treasure-map}

对于以下贸易：

```java
public static final VillagerTrades.ItemListing EMERALD_TO_TREASURE_MAP = new VillagerTrades.TreasureMapForEmeralds(
    // The number of emeralds the trader wants.
    8,
    // A tag containing a list of treasure structures to find the nearest of.
    StructureTags.ON_TAIGA_VILLAGE_MAPS,
    // The translation key of the map name.
    "filled_map.village_taiga",
    // The icon used to decorate the treasure location found on the map.
    MapDecorationTypes.TAIGA_VILLAGE,
    // The maximum number of times the trade can be made
    // before restock.
    12,
    // The amount of experience given for the trade.
    5
);
```

等价的是：

```json5
// For some villager trade 'examplemod:emerald_to_treasure_map'
// JSON at 'data/examplemod/villager_trade/emerald_to_treasure_map.json'
{
    "additional_wants": {
        // An item the trader additionally wants, hardcoded to compass.
        "id": "minecraft:compass"
    },
    "given_item_modifiers": [
        {
            // Finds a treasure structure to display on the map.

            // The icon used to decorate the treasure location found on the map.
            "decoration": "minecraft:village_taiga",
            // A tag containing a list of treasure structures to find the nearest of.
            "destination": "minecraft:on_taiga_village_maps",
            "function": "minecraft:exploration_map",
            "search_radius": 100
        },
        {
            // Sets the name of the map.

            "function": "minecraft:set_name",
            "name": {
                // The translation key of the map name.
                "translate": "filled_map.village_taiga"
            },
            "target": "item_name"
        },
        {
            // Check to make sure a structure was found.

            "function": "minecraft:filtered",
            "item_filter": {
                "items": "minecraft:filled_map",
                "predicates": {
                    "minecraft:map_id": {}
                }
            },
            "on_fail": {
                "function": "minecraft:discard"
            }
        }
    ],
    "gives": {
        "count": 1,
        // Returns a map filled with the treasure location.
        "id": "minecraft:map"
    },
    // The maximum number of times the trade can be made
    // before restock.
    "max_uses": 12,
    // The price multiplier to apply to the offer, given
    // reputation and demand, hardcoded to 0.05.
    "reputation_discount": 0.05,
    "wants": {
        // The number of emeralds the trader wants.
        "count": 8,
        "id": "minecraft:emerald"
    },
    // The amount of experience given for the trade.
    "xp": 5
}
```

#### 村民变种 {#villager-variants}

一些商人会根据村民类型提供不同的选项，这是一张巨大的物品列表地图。现在，每种类型都有自己的村民交易，使用 `merchant_predicate` 来检查是否可以向特定村民类型提供报价：

```json5
// For some villager trade 'examplemod:villager_type_item'
// JSON at 'data/examplemod/villager_trade/villager_type_item.json'
{
    // ...
    "merchant_predicate": {
        // Check the entity.
        "condition": "minecraft:entity_properties",
        "entity": "this",
        "predicate": {
            "predicates": {
                // Villager type must be desert for this trade to be chosen.
                "minecraft:villager/variant": "minecraft:desert"
            }
        }
    },
    // ...
}
```

- `net.minecraft.core.registries.Registries`
    - `TRADE_SET`- 保存交易列表的注册表的密钥。
    - `VILLAGER_TRADE`- 保存单个交易的注册表密钥。
- `net.minecraft.tags.VillagerTradeTags`- 村民交易的标签。
- `net.minecraft.world.entity.npc.villager`
    - `AbstractVillager#addOffersFromItemListings`->`addOffersFromTradeSet`，获取交易集的密钥而不是 `$ItemListing` 和报价数量；不是一对一的
    - `VillagerProfession` 现在接受 `TradeSet` 的交易者级别地图
        - `getTrades`- 返回给定级别的交易设置键。
    - `VillagerTrades` 已分为许多不同的类和实现
        - `TRADES`、 `EXPERIMENTAL_TRADES`、 `WANDERING_TRADER_TRADES` 现在由 `VillagerProfession#tradeSetsByLevel` 表示
            - 由于它们现在是数据包条目，因此它们存储在各自的数据包中
            - `TRADES`、 `EXPERIMENTAL_TRADES` 表示为 `data/minecraft/trade_set/<profession>/*`
            - `WANDERING_TRADER_TRADES` 表示为 `data/minecraft/trade_set/wandering_trader/*`
        - `$DyedArmorForEmeralds`->`VillagerTrades#dyedItem`,`addRandomDye`;不是一对一的
        - `$EmeraldForItems`->`VillagerTrade`，不是一对一
        - `$EmeraldsForVillagerTypeItem`->`VillagerTrades#registerBoatTrades`，看用法，不是一对一
        - `$EnchantBookForEmeralds`->`VillagerTrades#enchantedBook`，不是一对一
        - `$EnchantedItemForEmeralds`->`VillagerTrades#enchantedItem`，不是一对一
        - `$ItemListing` -> `VillagerTrade`
        - `$ItemsAndEmeraldsToItems`->`VillagerTrade` 与 `additionalWants`
        - `$ItemsForEmeralds`->`VillagerTrade`，不是一对一
        - `$SuspiciousStewForEmerald`->`VillagerTrade` 与 `SetStewEffectFunction`
        - `$TippedArrowForItemsAndEmeralds`->`VillagerTrade` 与 `SetRandomPotionFunction`
        - `$TreasureMapForEmeralds`->`VillagerTrades$VillagerExplorerMapEntry`，看用法，不是一对一
        - `$TypeSpecificTrade`->`VillagerTrades#villagerTypeRestriction`,`villagerTypeHolderSet`;不是一对一的
- `net.minecraft.world.item.enchantment.providers.TradeRebalanceEnchantmentProviders` 接口被移除
    - 替换为 `TradeRebalanceVillagerTrades`、 `TradeRebalanceRegistries`
- `net.minecraft.world.item.trading`
    - `TradeCost`- 正在与某个交易者进行交易的 `ItemStack`。
    - `TradeRebalanceVillagerTrades`- 交易再平衡数据包的所有交易部分。
    - `TradeSet`- 交易者可以在某个级别执行的一组交易。
    - `TradeSets`- 所有原始交易都在某个级别为某些交易者设置。
    - `VillagerTrade`- 交易者和玩家之间的交易。
    - `VillagerTrades`- 所有原版交易。
- `net.minecraft.world.level.storage.loot.parameters.LootContextParamSets#VILLAGER_TRADE`- 村民交易发生时的战利品上下文，包含交易来源和交易实体。

## `Level#random` 字段现已受保护 {#levelrandom-field-now-protected}

`Level#random` 字段现在为 `protected` 而不是 `public`。因此，使用应转换为使用公共 `getRandom` 方法。

```java
// For some Level level
RandomSource random = level.getRandom();
```

- `net.minecraft.world.level.Level#random` 字段现在为 `protected` 而不是 `public`
    - 使用 `getRandom` 方法代替

## 数据组件初始化器 {#data-component-initializers}

数据组件已经开始从原始对象移至 `Holder` 本身的转变。这是为了正确处理构建期间不可用的对象，例如物品的数据包注册表对象。目前，这仅针对 `Item` 实现，但系统允许任何注册表对象（给定其包装持有者）存储一些已定义的数据组件。

数据组件通过 `DataComponentInitializers` 连接到其支架上。在对象构造期间，调用 `DataComponentInitializers#add`，提供注册表对象的 `ResourceKey` 标识符以及 `DataComponentInitializers$Initializer`。初始化程序接受三个参数：组件映射的构建器、完整注册表 `HolderLookup$Provider` 以及传递给 `DataComponentInitializers#add` 的密钥。初始化程序的功能类似于消费者，还允许通过 `$Initializer#andThen` 链接其他初始化程序或通过 `$Initializer#add` 轻松添加组件。

```java
// For some custom registry object
public ExampleObject(ResourceKey<ExampleObject> id) {
    // Register the data component initializer
    BuiltInRegistries.DATA_COMPONENT_INITIALIZERS.add(
        // The identifier for the registry object
        id,
        // The initializer function, taking in a component builder,
        // the registries context, and the id
        (components, context, key) -> components
            .set(DataComponents.MAX_DAMAGE, 1)
            .set(DataComponents.DAMAGE_TYPE, context.getOrThrow(DamageTypes.SPEAR))
    );
}
```

从那里，每当调用 `ReloadableServerResources#loadResources` 时（在数据包重新加载时），数据组件都会被初始化或重新初始化。首先加载数据包对象，然后在 `Holder$Reference` 上设置组件。从那里，可以通过 `Holder#components` 收集组件。

```java
// For some Holder<ExampleObject> EXAMPLE_HOLDER
DataComponentMap components = EXAMPLE_HOLDER.components();
```

### 物品 {#items}

由于现在组件是在资源重新加载期间初始化的，因此 `Item$Properties` 提供了两种方法来正确延迟组件初始化，直到加载此类数据组件：`delayedComponent` 和 `delayedHolderComponent`。 `delayedComponent` 接受组件类型和一个接受 `HolderLookup$Provider` 并返回组件值的函数。 `delayedHolderCOmponent` 委托给 `delayedComponent`，接收 `ResourceKey` 并将注册表对象设置为组件值。

```java
public static final Item EXAMPLE_ITEM = new Item(
    new Item.Properties()
        .delayedComponent(
            // The component type whose construction
            // should be lazily initialized.
            DataComponents.JUKEBOX_PLAYABLE,
            // A function that takes in the registries
            // and returns the component value.
            context -> new JukeboxPlayable(context.getOrThrow(
                JukeboxSongs.THIRTEEN
            ))
        )
        .delayedHolderComponent(
            // The component type which has a
            // holder value type.
            DataComponents.DAMAGE_TYPE
            // The resource key for a registry
            // object of the associated holder
            // generic type.
            DamageTypes.SPEAR
        )
        // ...
);
```

### 配方 {#recipes}

由于数据组件现在保留资源重新加载后延迟初始化的真实值，因此 `Recipe#assemble` 不再接受 `HolderLookup$Provider`。相反，它假设配方已将所有必需的数据存储在堆栈中或直接传递到配方中。

- `net.minecraft.core`
    - `Holder`
        - `areComponentsBound`- 组件是否已绑定至支架。
        - `components`- 存储在支架上的物体的组件。
        - `direct`、 `$Direct` 现在可以接收 `DataComponentMap`
        - `$Reference#bindComponents`- 将组件存储在支架参考上。
    - `Registry#componentLookup`- 查找支架上的元件。
    - `WritableRegistry#bindTag`->`bindTags`，现在采用钥匙到持有者列表的映射，而不是一个映射
- `net.minecraft.core.component`
    - `DataComponentInitializers`- 处理初始化组件附加对象的数据组件的类。
    - `DataComponentLookup`- 将组件类型映射到使用它的支架的查找。
    - `DataComponentMap$Builder#addValidator`- 为对象上的组件添加验证器。
    - `DataComponentPatch`
        - `get` 现在接受 `DataComponentGetter` 并返回原始组件值
        - `$Builder#set` 现在具有可迭代的 `TypedDataComponent` 的重载
    - `DataComponents`
        - `DAMAGE_TYPE` 现在是支架包装的 `DamageType`，而不是 `EitherHolder` 包装的
        - `PROVIDES_TRIM_MATERIAL` 现在是支架包装的 `TrimMaterial`，而不是 `ProvidesTrimMaterial`
        - `CHICKEN_VARIANT` 现在是支架包装的 `ChickenVariant`，而不是 `EitherHolder` 包装的
        - `ZOMBIE_NAUTILUS_VARIANT` 现在是支架包装的 `ZombieNautilusVariant`，而不是 `EitherHolder` 包装的
        - `PROVIDES_BANNER_PATTERNS` 现在是 `HolderSet` 而不是 `TagKey`
- `net.minecraft.core.registries`
    - `BuiltInRegistries#DATA_COMPONENT_INITIALIZERS`- 附加到注册表项的数据组件列表。
    - `Registries#componentsDirPath`- 注册表中组件的路径目录。
- `net.minecraft.data.PackOutput#createRegistryComponentPathProvider`- 组件注册表报告的路径提供程序。
- `net.minecraft.data.info.ItemListReport`->`RegistryComponentsReport`，不是一对一
- `net.minecraft.resources`
    - `NetworkRegistryLoadTask`- 处理从网络或资源注册注册表对象和标记的加载任务。
    - `RegistryDataLoader`
        - `$PendingRegistration` -> `RegistryLoadTask$PendingRegistration`
        - `$RegistryData` 现在采用 `RegistryValidator` 而不是 `boolean`
        - `$RegistryLoadTask`->`RegistryLoadTask`，不是一对一
    - `RegistryValidator`- 验证注册表中条目的接口，将所有错误存储在映射中。
    - `ResourceManagerRegistryLoadTask`- 处理从本地资源管理器注册注册表对象和标记的加载任务。
- `net.minecraft.server.ReloadableServerResources#updateStaticRegistryTags`->`updateComponentsAndStaticRegistryTags`，不是一对一
- `net.minecraft.world.item`
    - `EitherHolder` 类已删除
    - `Item`
        - `CODEC_WITH_BOUND_COMPONENTS`- 验证组件是否已绑定的物品 Codec。
        - `$Properties`
            - `delayedComponent`- 延迟设置组件，提供 `HolderLookup$Provider` 来获取任何动态元素。
            - `delayedHolderComponent`- 为某些持有者包装的注册表对象延迟设置组件。
    - `ItemStack#validateComponents` 现在从 `public` 变为 `private`
    - `JukeboxPlayable` 现在持有支架包装的 `JukeboxSong`，而不是 `EitherHolder` 包装的变体
    - `JukeboxSong#fromStack` 不再包含 `HolderLookup$Provider`
    - `SpawnEggItem`
        - `spawnEntity` 现在是 `static`
        - `byId` 现在返回可选的支架包装 `Item`，而不是 `SpawnEggItem`
        - `eggs` 已删除
        - `getType` 现在是 `static`
        - `spawnOffspringFromSpawnEgg` 现在是 `static`
- `net.minecraft.world.item.component`
    - `BlocksAttacks` 现在拥有一个可选的支架，套件包裹 `DamageType`，而不是 `TagKey`
    - `DamageResistant` 现在持有支架组 `DamageType`，而不是 `TagKey`
    - `InstrumentComponent` 现在持有支架包装的 `Instrument`，而不是 `EitherHolder` 包装的变体
        - `unwrap` 已删除
    - `ProvidesTrimMaterial` 现在持有支架包装的 `TrimMaterial`，而不是 `EitherHolder` 包装的变体
- `net.minecraft.world.item.crafting`
    - `Recipe#assemble` 不再包含 `HolderLookup$Provider`
    - `SmithingTrimRecipe#applyTrim` 不再包含 `HolderLookup$Provider`
- `net.minecraft.world.item.equipment.trim.TrimMaterials#getFromIngredient` 已删除
- `net.minecraft.world.level.storage.loot.functions.SetInstrumentFunction`、 `#setInstrumentOptions` 现在采用固定器包裹的 `Instrument`，而不是 `TagKey`
- `net.minecraft.world.timeline.Timeline#validateRegistry`- 验证每个时间标记仅定义一次。

## 物品实例和堆栈模板 {#item-instances-and-stack-templates}

`ItemStack` 现在有一个称为 `ItemStackTemplate` 的不可变实例。与 `ItemStack` 类似，它包含支架包装的 `Item`、它代表的物品数量以及要应用于堆栈的组件的 `DataComponentPatch`。如果添加其他数据组件，可以通过 `create` 或 `apply` 将模板转换为堆栈。 `ItemStack` 同样可以通过 `ItemStackTemplate#fromNonEmptyStack` 转换为模板。如果需要不变性（例如，进步、配方等），现在使用模板代替 `ItemStack`。他们提供了用于网络通信的常规 `CODEC`、 `MAP_CODEC` 和 `STREAM_CODEC`。

```java
ItemStackTemplate apple = new ItemStackTemplate(
    // The item of the stack
    Items.APPLE.builtInRegistryHolder(),
    // The number of items held
    5,
    // The components applied to the stack
    DataComponentPatch.builder()
        .set(DataComponents.ITEM_NAME, Component.literal("Apple?"))
        .build()
);

// Turn the template into a stack
ItemStack stack = apple.create();

// Creating a template from a non-empty stack
ItemStackTemplate fromStack = ItemStackTemplate.fromNonEmptyStack(stack);
```

为了帮助标准化访问两者之间的通用组件，模板和堆栈都实现了 `ItemInstance`，它提供了对标准持有者方法检查、计数和 `DataComponentGetter` 的访问。通用接口还意味着，如果堆栈是否可变并不重要，则可以使用 `ItemInstance` 作为类型。

```java
// Both are item instances
ItemInstance stack = new ItemStack(Items.APPLE);
ItemInstance template = new ItemStackTemplate(Items.APPLE);

// Get the holder or check something
Holder<Item> item = stack.typeHolder();
template.is(Items.APPLE);

// Get the number of items in the stack or template
int stackCount = stack.count();
int templateCount = template.count();

// Get the component values
Identifier stackModel = stack.get(DataComponents.ITEM_MODEL);
Identifier templateModel = template.get(DataComponents.ITEM_MODEL);
```

### 配方生成器 {#recipe-builders}

由于添加了 `ItemStackTemplate`，`RecipeBuilder` 的实现略有变化。首先，构建器不再存储结果的 `Item`，而是将 `defaultId` 定义为资源密钥配方。因此，这允许使用更清晰的方法来定义不导出 `Item` 的自定义配方。

当然，对这种新格式的更改只是让 `defaultId` 返回 `RecipeBuilder#getDefaultRecipeId` 和 `ItemInstance`（堆栈或模板），如下所示：

```java
public class ExampleRecipeBuilder implements RecipeBuilder {

    // The result of the recipe
    private final ItemStackTemplate result;

    public ExampleRecipeBuilder(ItemStackTemplate result) {
        this.result = result;
    }

    @Override
    public ResourceKey<Recipe<?>> defaultId() {
        // Get the default recipe id from the result
        return RecipeBuilder.getDefaultRecipeId(this.result);
    }

    // Implement everything else below
    // ...
}
```

- `net.minecraft.advancements`
    - `Advancement$Builder#display` 现在采用 `ItemStackTemplate` 而不是 `ItemStack`
    - `DisplayInfo` 现在采用 `ItemStackTemplate` 而不是 `ItemStack`
        - `getIcon` 现在返回 `ItemStackTemplate` 而不是 `ItemStack`
- `net.minecraft.advancements.criterion`
    - `AnyBlockInteractionTrigger#trigger` 现在采用 `ItemInstance` 而不是 `ItemStack`
    - `ItemPredicate` 现在实现谓词 `ItemInstance` 而不是 `ItemStack`
    - `ItemUsedOnLocationTrigger#trigger` 现在采用 `ItemInstance` 而不是 `ItemStack`
- `net.minecraft.client.particle.BreakingItemParticle$ItemParticleProvider#getSprite` 现在采用 `ItemStackTemplate` 而不是 `ItemStack`
- `net.minecraft.commands.arguments.item`
    - `ItemInput` 现已创纪录
        - `serialize` 已删除
        - `createItemStack` 不再接受 `boolean` 检查尺寸
    - `ItemParser#parse` 现在返回 `ItemResult` 而不是 `ItemParser$ItemResult`
        - `$ItemResult` 合并为 `ItemInput`
- `net.minecraft.core.component.predicates`
    - `BundlePredicate` 现在处理 `ItemInstance` 的可迭代，而不是 `ItemStack`
    - `ContainerPredicate` 现在处理 `ItemInstance` 的可迭代，而不是 `ItemStack`
- `net.minecraft.core.particles.ItemParticleOption` 现在采用 `ItemStackTemplate` 而不是 `ItemStack`
    - 常规 `Item` 也存在过载
    - `getItem` 现在返回 `ItemStackTemplate` 而不是 `ItemStack`
- `net.minecraft.data.recipes`
    - `RecipeBuilder`
        - `getResult` 已删除
        - `defaultId`- 使用此构建器制作的配方的默认标识符。
        - `getDefaultRecipeId` 现在采用 `ItemInstance` 而不是 `ItemLike`
    - `RecipeProvider`
        - `oreSmelting`、 `oreBlasting` 现在采用 `CookingBookCategory`
        - `oreCooking` 不再接受 `RecipeSerializer`，现在接受 `CookingBookCategory`
        - `cookRecipes`、 `simpleCookingRecipe` 不再纳入 `RecipeSerializer`
        - `shapeless` 现在采用 `ItemStackTemplate` 而不是 `ItemStack`
    - `ShapedRecipeBuilder` 现在采用 `ItemStackTemplate` 作为结果，而 `ItemLike` 已移至过载
        - 两个构造函数都是 `private`
    - `ShapelessRecipeBuilder` 现在采用 `ItemStackTemplate` 作为结果，而不是 `ItemStack`
    - `SimpleCookingRecipeBuilder` 现在采用 `ItemStackTemplate` 作为结果，而 `ItemLike` 已移至过载
        - `generic` 不再接受 `RecipeSerializer`，现在接受 `CookingBookCategory`
        - `blasting`、 `smelting` 现在采用 `CookingBookCategory`
    - `SingleItemRecipeBuilder` 现在采用 `ItemStackTemplate` 作为结果，而 `ItemLike` 已移至过载
        - `ItemStackTemplate` 构造函数为 `private`
    - `SmithingTransformRecipeBuilder` 现在采用 `ItemStackTemplate` 作为结果，而不是 `Item`
    - `TransmuteRecipeBuilder` 现在采用 `ItemStackTemplate` 作为结果，而不是 `Holder<Item>`
        - 构造函数为 `private`
        - `transmute` 现在有一个重载，它接收 `ItemStackTemplate` 的结果
        - `addMaterialCountToOutput`、 `setMaterialCount`- 根据使用的材料数量处理结果堆栈的大小。
- `net.minecraft.network.chat.HoverEvent$ShowItem` 现在采用 `ItemStackTemplate` 而不是 `ItemStack`
- `net.minecraft.server.dialog.body.ItemBody` 现在采用 `ItemStackTemplate` 而不是 `ItemStack`
- `net.minecraft.world.entity.LivingEntity`
    - `dropFromEntityInteractLootTable` 现在为该工具采用 `ItemInstance` 而不是 `ItemStack`
    - `dropFromShearingLootTable` 现在为该工具采用 `ItemInstance` 而不是 `ItemStack`
- `net.minecraft.world.item`
    - `BundleItem#getSelectedItemStack`->`getSelectedItem`，现在返回 `ItemStackTemplate` 而不是 `ItemStack`
    - `Item`
        - `getCraftingRemainder` 现在返回 `ItemStackTemplate` 而不是 `ItemStack`
        - `$Properties#craftRemainder` 现在具有接收 `ItemStackTemplate` 的过载
    - `ItemInstance`- 一个类型化的物品实例，可以查询物品、尺寸及其组件。
    - `ItemStack` 现在实现 `ItemInstance`
        - `SINGLE_ITEM_CODEC`、 `STRICT_CODEC`、 `STRING_SINGLE_ITEM_CODEC`、 `SIMPLE_ITEM_CODEC` 已删除
        - `getMaxStackSize` -> `ItemInstance#getMaxStackSize`
    - `ItemStackTemplate`- 包含堆栈的不可变组件的记录：物品、计数和组件。
- `net.minecraft.world.item.component`
    - `BundleContents` 现在接受 `ItemStackTemplate` 的列表，而不是 `ItemStack`
        - `items` 现在返回 `ItemStackTemplate` 的列表，而不是 `ItemStack` 的可迭代对象
        - `itemsCopy` 已删除
        - `getSelectedItem`- 返回所选物品的堆栈模板，如果未选择任何物品，则返回 `null`。
    - `ChargedProjectile` 现已创纪录
        - 构造函数接受 `ItemStackTemplate` 列表而不是 `ItemStack`
        - `of` -> `ofNonEmpty`
        - `getItems` -> `itemCopies`
    - `ItemContainerContents`
        - `stream` -> `allItemsCopyStream`
        - `nonEmptyStream` -> `nonEmptyItemCopyStream`
        - `nonEmptyItems`、 `nonEmptyItemsCopy`->`nonEmptyItems`，现在返回 `ItemStackTemplate` 的迭代，而不是 `ItemStack`
    - `UseRemainder` 现在采用 `ItemStackTemplate` 而不是 `ItemStack`
- `net.minecraft.world.item.crafting`
    - `AbstractCookingRecipe` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
        - `$Factory#create` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
    - `BlastingRecipe` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
    - `CampfireCookingRecipe` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
    - `ShapedRecipe` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
    - `ShapelessRecipe` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
    - `SingleItemRecipe` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
        - `result` 现在返回 `ItemStackTemplate` 而不是 `ItemStack`
        - `$Factory#create` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
    - `SmeltingRecipe` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
    - `SmithingTransformRecipe` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
    - `SmokingRecipe` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
    - `StonecutterRecipe` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
    - `TransmuteRecipe` 现在采用 `ItemStackTemplate` 而不是 `ItemStack` 作为结果
    - `TransmuteResult`->`ItemStackTemplate`，不是一对一
        - `isResultUnchanged` 已删除
        - `apply`->`TransmuteRecipe#createWithOriginalComponents`，不是一对一
- `net.minecraft.world.item.crafting.display.SlotDisplay$ItemStackSlotDisplay` 现在采用 `ItemStackTemplate` 而不是 `ItemStack`
- `net.minecraft.world.item.enchantment.EnchantmentHelper#getItemEnchantmentLevel` 现在采用 `ItemInstance` 而不是 `ItemStack`
- `net.minecraft.world.level.block.Block`
    - `dropFromBlockInteractLootTable` 现在采用 `ItemInstance` 而不是 `ItemStack`
    - `getDrops` 现在采用 `ItemInstance` 而不是 `ItemStack`
- `net.minecraft.world.level.block.entity.DecoratedPotBlockEntity#createdDecoratedPotItem` -> `createdDecoratedPotInstance`
    - `createDecoratedPotTemplate` 创建 `ItemStackTemplate` 而不是 `ItemStack`
- `net.minecraft.world.level.storage.loot`
    - `LootContext$ItemStackTarget` 现在为参数 getter 实现 `ItemInstance` 泛型，而不是 `ItemStack`
    - `LootContextArg$ArgCodecBuilder#anyItemStack` 现在需要一个接受 `ItemInstance` 上下文键而不是 `ItemStack` 上下文键的函数
- `net.minecraft.world.level.storage.loot.parameters.LootContextParams#TOOL` 现在是 `ItemInstance` 上下文键，而不是 `ItemStack` 上下文键

## 序列化器记录和配方信息 {#serializer-records-and-recipe-info}

配方在实施过程中稍作修改。首先，`RecipeSerializer` 现在是用于序列化和反序列化配方的 `MapCodec` 和 `StreamCodec` 中的记录。因此，`Serializer` 类已全部删除，取而代之的是在注册期间向记录提供 Codec：

```java
// Assume some ExampleRecipe implements Recipe
// We'll say there's also only one INSTANCE
public static final RecipeSerializer<ExampleRecipe> EXAMPLE_RECIPE = new RecipeSerializer<>(
    // The map codec for reading the recipe to/from disk.
    MapCodec.unit(INSTANCE),
    // The stream codec for reading the recipe to/from the network.
    StreamCodec.unit(INSTANCE)
);
```

其次，一些有关配方设置和书籍信息的通用数据已被分成单独的对象。这些对象作为构造函数的一部分传递到配方中，并用于更干净地处理所有配方中的类似实现。

原版 提供了四种常见的对象类，分为两个单独的类别。 `Recipe$CommonInfo` 用于一般配方设置。同时，`Recipe$BookInfo` 用于配方书信息，`CraftingRecipe$CraftingBookInfo` 用于制作配方，`AbstractCookingRecipe$CookingBookInfo` 用于烹饪配方（例如熔炼、爆破等）。公共对象类提供了根据需要构建 Codec 的方法，然后可以将其传递到相关的配方 Codec 中。

这些类通常通过 `Recipe` 子类传递，用作实现抽象方法的样板。这些对象中的任何数据都不能在实现本身之外直接获得，只能通过 `Recipe` 接口中定义的方法获得。因此，`NormalCraftingRecipe`、 `CustomRecipe`、 `SimpleSmithingRecipe`、 `SingleItemRecipe` 和 `AbstractCookingRecipe` 等类可用于通过实现一些方法来创建新的配方实现。

请注意，这些通用信息类是一种设计理念，你可以根据需要选择实现。仅当构建现有配方子类型时，你才需要使用它们。

- `net.minecraft.data.recipes`
    - `CustomCraftingRecipeBuilder`- 一个配方生成器，可以根据一些常见的手工书籍信息创建任意的手工配方。
    - `RecipeBuilder`
        - `determineBookCategory` -> `determineCraftingBookCategory`
        - `createCraftingCommonInfo`- 创建通用配方信息。
        - `createCraftingBookInfo`- 创建工艺书信息。
    - `RecipeUnlockAdvancementBuilder`- 用于解锁配方的进步生成器。
    - `SpecialRecipeBuilder`、 `special` 现在采用提供的 `Recipe`，而不是 `CraftingBookCategory` 到 `Recipe` 的函数
        - `unlockedBy`- 解锁配方升级所需的标准。
- `net.minecraft.world.item.crafting`
    - `AbstractCookingRecipe` 现在采用 `Recipe$CommonInfo` 和 `$CookingBookInfo`，而不是组和 `CookingBookCategory`
        - `$Factory#create` 现在采用 `Recipe$CommonInfo` 和 `$CookingBookInfo`，而不是组和 `CookingBookCategory`
        - `$Serializer` 替换为 `cookingMapCodec`、 `cookingStreamCodec`
        - `$CookingBookInfo`- 包含配方的常见烹饪信息的记录。
    - `BannerDuplicateRecipe` 现在接受横幅 `Ingredient` 和 `ItemStackTemplate` 结果，而不是 `CraftingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `BlastingRecipe` 现在采用 `Recipe$CommonInfo` 和 `$AbstractCookingRecipeCookingBookInfo`，而不是组和 `CookingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `BookCloningRecipe` 现在采用 `Ingredient` 源和材料、定义可复制代的 `MinMaxBounds$Int` 以及 `ItemStackTemplate` 结果而不是 `CraftingBookCategory`
        - `ALLOWED_BOOK_GENERATION_RANGES`、 `DEFAULT_BOOK_GENERATION_RANGES`- 书籍生成克隆的范围。
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `CampfireCookingRecipe` 现在采用 `Recipe$CommonInfo` 和 `AbstractCookingRecipe$CookingBookInfo`，而不是组和 `CookingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `CraftingRecipe$CraftingBookInfo`- 包含配方书常见制作信息的记录。
    - `CustomRecipe` 的构造函数不再接受任何内容
        - `$Serializer` 被删除，替换为其实现的 Codec
    - `DecoratedPotRecipe` 现在采用每边的 `Ingredient` 模式以及 `ItemStackTemplate` 结果，而不是 `CraftingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `DyeRecipe` 现在采用 `Recipe$CommonInfo` 和 `CraftingRecipe$CraftingBookInfo` 以及 `Ingredient` 目标和染料以及 `ItemStackTemplate` 结果而不是 `CraftingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `FireworkRocketRecipe` 现在采用 `Ingredient` 壳、燃料和恒星以及 `ItemStackTemplate` 结果，而不是 `CraftingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `FireworkStarFadeRecipe` 现在采用 `Ingredient` 目标和染料以及 `ItemStackTemplate` 结果，而不是 `CraftingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `FireworkStarRecipe` 现在接受 `$Shape` 到 `Ingredient` 映射；`Ingredient`Trail、闪烁、燃料和染料；以及 `ItemStackTemplate` 结果而不是 `CraftingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `MapCloningRecipe` 替换为 `TransmuteRecipe`
    - `MapExtendingRecipe` 现在扩展 `CustomRecipe` 而不是 `ShapedRecipe`
        - 构造函数现在采用 `Ingredient` 贴图和材质以及 `ItemStackTemplate` 结果，而不是 `CraftingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `NormalCraftingRecipe`- 定义制作配方的标准实现的类。
    - `Recipe`
        - `showNotification`、 `group` 不再是默认值
        - `$BookInfo`- 配方书的信息。
        - `$CommonInfo`- 所有配方的通用信息。
    - `RecipeSerializer` 现在是包含 `MapCodec` 和 `StreamCodec` 的记录
        - 注册条目已移至 `RecipeSerializers`
        - `register` 已删除
    - `RecipeSerializers`- 用于配方的所有原版序列化器。
    - `RepairItemRecipe` 不再吸收任何东西
        - `INSTANCE`- 配方序列化器单例。
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `ShapedRecipe` 现在扩展 `NormalCraftingRecipe` 而不是实现 `CraftingRecipe`
        - 构造函数现在采用 `Recipe$CommonInfo` 和 `CraftingRecipe$CraftingBookInfo` 而不是组和 `CraftingBookCategory`
        - `$Serializer`->`MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`；不是一对一的
    - `ShapelessRecipe` 现在扩展 `NormalCraftingRecipe` 而不是实现 `CraftingRecipe`
        - 构造函数现在采用 `Recipe$CommonInfo` 和 `CraftingRecipe$CraftingBookInfo` 而不是组和 `CraftingBookCategory`
        - `$Serializer`->`MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`；不是一对一的
    - `ShieldDecorationRecipe` 现在接受 `Ingredient` 横幅和目标以及 `ItemStackTemplate` 结果，而不是 `CraftingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `SimpleSmithingRecipe`- 定义锻造配方的标准实现的类。
    - `SingleItemRecipe` 现在采用 `Recipe$CommonInfo` 而不是该组
        - `commonInfo`- 配方的通用信息。
        - `$Factory#create` 现在采用 `Recipe$CommonInfo` 而不是该组
        - `$Serializer`->`simpleMapCodec`,`simpleStreamCodec`;不是一对一的
    - `SmeltingRecipe` 现在采用 `Recipe$CommonInfo` 和 `AbstractCookingRecipe$CookingBookInfo`，而不是组和 `CookingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `SmithingTransformRecipe` 现在扩展 `SimpleSmithingRecipe` 而不是实现 `SmithingRecipe`
        - 构造函数现在接受 `Recipe$CommonInfo`
        - `$Serializer`->`MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`；不是一对一的
    - `SmithingTrimRecipe` 现在扩展 `SimpleSmithingRecipe` 而不是实现 `SmithingRecipe`
        - 构造函数现在接受 `Recipe$CommonInfo`
        - `$Serializer`->`MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`；不是一对一的
    - `SmokingRecipe` 现在采用 `Recipe$CommonInfo` 和 `AbstractCookingRecipe$CookingBookInfo`，而不是组和 `CookingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `StonecutterRecipe` 现在采用 `Recipe$CommonInfo` 而不是该组
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `TippedArrowRecipe`->`ImbueRecipe`，不是一对一
        - 构造函数现在采用 `Recipe$CommonInfo` 和 `CraftingRecipe$CraftingBookInfo` 以及 `Ingredient` 源和材料以及 `ItemStackTemplate` 结果而不是 `CraftingBookCategory`
        - `MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`- 配方的序列化器。
    - `TransmuteRecipe` 现在扩展 `NormalCraftingRecipe` 而不是实现 `CraftingRecipe`
        - 构造函数现在接受 `Recipe$CommonInfo` 和 `CraftingRecipe$CraftingBookInfo` 以及 `MinMaxBounds$Ints` 和 `boolean` 处理材料计数并将其添加到结果中，而不是组和 `CraftingBookCategory`
        - `$Serializer`->`MAP_CODEC`、 `STREAM_CODEC`、 `SERIALIZER`；不是一对一的
- `net.minecraft.world.item.crafting.display.SlotDisplay`
    - `$OnlyWithComponent`- 仅显示具有所需组件的内容。
    - `$WithAnyPotion`- 内容具有任何药水内容成分的显示器。
- `net.minecraft.world.level.storage.loot.functions.SmeltItemFunction#smelted` 现在可以判断是否使用输入物料计数

## 染料成分 {#dye-component}

现在可以通过 `DYE` 数据组件来指定某个物品是否可以用作染料材料。该组件指定了一个 `DyeColor`，可以通过 `Item$Properties#component` 进行设置：

```java
public static final Item EXAMPLE_DYE = new Item(new Item.Properties().component(
    DataComponents.DYE, DyeColor.WHITE
));
```

然而，染料材料的行为并不能完全由该成分完全涵盖。在大多数情况下，该组件与其他一些标记或子类结合使用以获得所需的行为。

### 实体和标志 {#entities-and-signs}

垂死的羊和标志纯粹通过 `DyeItem` 子类处理，检查该物品是否具有 `DYE` 组件。

另一方面，染色狼和猫的项圈可以是任何物品，假设它具有 `DYE` 组件。此外，该物品必须分别位于 `ItemTags#WOLF_COLLAR_DYES` 或 `ItemTags#CAT_COLLAR_DYES` 标签中。

### 染料配方 {#dye-recipes}

`DyeRecipe`（以前称为 `ArmorDyeRecipe`）可以采用任何目标成分并应用染料成分的颜色，以通过相关的 `DYED_COLOR` 成分获得所需的结果。任何物品都可以被视为染料；但是，那些没有 `DYE` 组件的将默认为 `DyeColor#WHITE`。 Armor 利用 `RecipeProvider#dyedItem` 来允许 `ItemTags#DYES` 标签中的任何物品对盔甲进行染色。然而，捆绑包和潜影盒的颜色成分是不同的物品，这意味着默认配方直接与原版 `DyeItem` 相关，这意味着需要生成一个单独的配方来将染料应用于这些物品。

另一方面，织布机、烟花星和烟花星面配方期望任何染料材料都具有 `DYE` 成分。织机还有一个附加要求，即该商品必须位于 `ItemTags#LOOM_DYES` 标签中。

- `net.minecraft.core.component.DataComponents#DYE`- 表示某个物品可以充当特定颜色的染料。
- `net.minecraft.data.recipes.RecipeProvider`
    - `dyedItem`- 创建染色物品配方。
    - `dyedShulkerBoxRecipe`- 创建染色潜影盒配方。
    - `dyedBundleRecipe`- 创建染色束配方。
- `net.minecraft.world.item`
    - `BundleItem`
        - `getAllBundleItemColors`、 `getByColor` 已删除
    - `DyeColor#VALUES`- 所有染料颜色的列表。
    - `DyeItem` 不再包含 `DyeColor`
        - `getDyeColor`、 `byColor` 已删除
- `net.minecraft.world.item.component.DyedItemColor#applyDyes` 现在接受 `DyeColor` 的列表，而不是 `DyeItem`
    - 过载还可以采用 `DyedItemColor` 组件而不是 `ItemStack`
- `net.minecraft.world.item.crafting.ArmorDyeRecipe`->`DyeRecipe`，不是一对一
- `net.minecraft.world.item.crafting.display.SlotDisplay$DyedSlotDemo`- 用于演示物品染色的显示。
- `net.minecraft.world.level.block`
    - `BannerBlock#byColor` 已删除
    - `ShulkerBoxBlock#getBlockByColor`、 `getColoredItemStack` 已删除

## 世界时钟和时间标记 {#world-clocks-and-time-markers}

世界时钟是代表一些时间的对象，从世界首次加载时开始，每个滴答声都会增加。这些时钟用作计时器来正确处理基于时间的事件（例如，当天、睡觉）。 原版 提供两种世界时钟：一种用于 `minecraft:overworld`，另一种用于 `minecraft:the_end`。

创建时钟相当简单：只是 `world_clock` 中的一个空数据包注册表对象。

```json5
// For some world clock 'examplemod:EXAMPLE_CLOCK'
// JSON at 'data/examplemod/world_clock/EXAMPLE_CLOCK.json'
{}
```

从那里，你可以通过 `Level#clockManager` 或 `MinecraftServer#clockManager` 通过 `ClockManager` 查询时钟状态：

```java
// For some Level level
// Assume we have some ResourceKey<WorldClock> EXAMPLE_CLOCK

// Get the clock reference
Holder.Reference<WorldClock> clock = level.registryAccess().getOrThrow(EXAMPLE_CLOCK);

// Query the clock time
long ticksPassed = level.clockManager().getTotalTicks(clock);
```

如果从服务器访问时钟，还可以修改时钟的状态：

```java
// For some ServerLevel level
// Assume we have some ResourceKey<WorldClock> EXAMPLE_CLOCK

// Get the clock reference
Holder.Reference<WorldClock> clock = level.registryAccess().getOrThrow(EXAMPLE_CLOCK);

// Get the server clock manager
ServerClockManager clockManager = level.clockManager();

// Set the total number of ticks that have passed
clockManager.setTotalTicks(clock, 0L);

// Add the a certain value to the number of ticks
clockManager.addTicks(clock, 10L);

// Pause the clock
clockManager.setPaused(
    clock,
    // `true` to pause.
    // `false` to unpause.
    true
);
```

### 标记时间线 {#marking-timelines}

就其本身而言，世界时钟的范围相当有限，因为你必须跟踪已经过去的滴答数。但是，当与时间线一起使用时，可以标记特定的重复时间来处理基于时间的事件。

回顾一下，`Timeline` 是一种基于某些 `WorldClock` 修改属性的方法。目前，所有普通时间线都使用 `minecraft:overworld` 世界时钟通过 `clock` 字段来跟踪其时间。所有时间线都必须定义它使用的时钟；但是，请注意，默认情况下时钟不支持任何同步，这意味着更新一个时钟上的时间不会影响另一个时钟。

```json5
// For some timeline 'examplemod:example_timeline'
// In `data/examplemod/timeline/example_timeline.json
{
    // Uses the custom clock.
    // Any changes to the clock time will only affect
    // timelines using this clock.
    // e.g., `minecraft:overworld` will not be changed.
    "clock": "examplemod:example_clock",
    // Perform actions on a 24,000 tick interval.
    "period_ticks": "24000",
    // ...
}


// For some timeline 'examplemod:example_timeline_2'
// In `data/examplemod/timeline/example_timeline_2.json
{
    // Uses the same clock as the one above.
    // Changes to the clock time will affect both
    // timelines.
    "clock": "examplemod:example_clock",
    // Perform actions on a 1,000 tick interval.
    "period_ticks": "1000",
    // ...
}

// For some timeline 'examplemod:example_overworld'
// In `data/examplemod/timeline/example_overworld.json
{
    // Uses the 原版 overworld clock.
    // Changes to the clock time will not affect
    // the above timelines as they use a different
    // clock.
    "clock": "minecraft:overworld",
    // Perform actions on a 6,000 tick interval.
    "period_ticks": "6000",
    // ...
}
```

时间线还可以定义时间标记，这只是世界时钟时间线周期内时间的一些标识符。这些通常在命令中使用（例如 `/time set`），以检查是否已经过了某个时间（例如村庄围攻），或跳到给定时间（例如从睡眠中醒来）。时间标记在 `time_markers` 中定义，指定周期内的 `ticks` 以及是否可以是 `show_in_commands`。由于时间标记是通过世界时钟来识别的，因此使用相同世界时钟的时间线无法定义相同的时间标记。

```json5
// For some timeline 'examplemod:example_timeline'
// In `data/examplemod/timeline/example_timeline.json
{
    // The identifier of the clock.
    "clock": "examplemod:example_clock",
    // Perform actions on a 24,000 tick interval.
    "period_ticks": "24000",
    // The markers within the period specified by the timeline
    "time_markers": {
        // A marker
        "examplemod:example_marker": {
            // The number of ticks within the period
            // that this marker represents.
            // e.g., 5000, 29000, 53000, etc.
            "ticks": 5000,
            // When true, allows the time marker to be
            // suggested in the command. If false,
            // the time marker can still be used in the
            // command, it just won't be suggested.
            "show_in_commands": true
        }
    }
    // ...
}
```

一旦定义了时间标记，它们就会在 `ServerClockManager` 中注册为世界时钟，从而允许在给定 `ResourceKey` 的情况下使用它们。

```java
// For some ServerLevel level
// Assume we have some ResourceKey<WorldClock> EXAMPLE_CLOCK
// Assume we have some ResourceKey<ClockTimerMarker> EXAMPLE_MARKER

// Get the clock reference
Holder.Reference<WorldClock> clock = level.registryAccess().getOrThrow(EXAMPLE_CLOCK);

// Get the server clock manager
ServerClockManager clockManager = level.clockManager();

// Check if the time is at the specified marker
// This should be used when checking for a specific time event every tick
boolean atMarker = clockManager.isAtTimeMarker(clock, EXAMPLE_MARKER);

// Skip to the time specified by the marker
// If the world clock is at 3000, sets the clock time to 5000
// If the world clock is at 6000, sets the clock time to 29000
// Returns whether the time was set, which is always true if the marker
// exists for the clock.
boolean timeSet = clockManager.skipToTimeMarker(clock, EXAMPLE_MARKER);
```

- `net.minecraft.client.ClientClockManager`- 管理客户端世界时钟的滴答声。
- `net.minecraft.client.gui.components.debug.DebugEntryDayCount`- 显示 Minecraft 世界的当前日期。
- `net.minecraft.client.multiplayer`
    - `ClientLevel`
        - `setTimeFromServer` 不再接收 `long` 白天时间，也不再接收 `boolean` 是否勾选白天时间
        - `$ClientLevelData#setDayTime` 已删除
    - `ClientPacketListener#clockManager`- 获取客户端时钟管理器。
- `net.minecraft.client.renderer.EndFlashState#tick` 现在采用结束时钟时间而不是比赛时间
- `net.minecraft.commands.arguments.ResourceArgument`
    - `getClock`- 获取对给定字符串资源标识符的世界时钟的引用。
    - `getTimeline`- 获取对给定字符串资源标识符的时间线的引用。
- `net.minecraft.core.registries.Registries#WORLD_CLOCK`- 世界时钟的注册表标识符。
- `net.minecraft.gametest.framework.TestEnvironmentDefinition`
    - `$TimeOfDay`->`$ClockTime`，不是一对一
    - `$Timelines`- 使用时间线列表的测试环境。
- `net.minecraft.network.protocol.game.ClientboundSetTimePacket` 现在采用时钟映射到其网络状态，而不是白天时间 `long` 和 `boolean`
- `net.minecraft.server`
    - `MinecraftServer`
        - `forceTimeSynchronization`->`forceGameTimeSynchronization`，不是一对一
        - `clockManager`- 服务器时钟管理器。
- `net.minecraft.server.level.ServerLevel`
    - `setDayTime`、 `getDayCount` 已删除
    - `setEnvironmentAttributes`- 设置要使用的环境属性系统。
- `net.minecraft.world.attribute.EnvironmentAttributeSystem$Builder#addTimelineLayer` 现在采用 `ClockManager` 而不是 `LongSupplier`
- `net.minecraft.world.clock`
    - `ClockManager`- 获取世界时钟已过去的滴答总数的管理器。
    - `ClockNetworkState`- 通过网络同步的时钟的当前状态。
    - `ClockState`- 时钟的当前状态，包括滴答总数以及时钟是否暂停。
    - `ClockTimeMarker`- 跟踪世界时钟特定时间段的标记。
    - `ClockTimeMarkers`- 所有原版时间标记。
    - `PackedClockStates`- 时钟到其状态的映射，经过压缩以供存储或其他使用。
    - `ServerClockManager`- 管理服务器端世界时钟的滴答声。
    - `WorldClock`- 一条空记录，表示对某个位置进行计时的密钥。
    - `WorldClocks`- 所有原版世界时钟。
- `net.minecraft.world.level`
    - `Level`
        - `getDayTime`->`getOverworldClockTime`，不是一对一
        - `clockManager`- 时钟管理器。
        - `getDefaultClockTime`- 获取当前维度的时钟时间。
    - `LevelReader#getEffectiveSkyBrightness`- 获取当前变暗系数的天空亮度。
- `net.minecraft.world.level.dimension.DimensionType` 现在采用默认的、支架包装的 `WorldClock`
- `net.minecraft.world.level.storage`
    - `LevelData#getDayTime` 已删除
    - `ServerLevelData`
        - `setDayTime` 已删除
        - `setClockStates`、 `clockStates`- 处理世界时钟的当前状态。
- `net.minecraft.world.level.storage.loot.predicates.TimeCheck` 现在采用支架包装的 `WorldClock`
    - `time` 现在采用支架包装的 `WorldClock`
    - `$Builder` 现在采用支架包装的 `WorldClock`
- `net.minecraft.world.timeline`
    - `AttributeTrack#bakeSampler` 现在采用支架包装的 `WorldClock`
    - `AttributeTrackSampler` 现在采用支架包裹的 `WorldClock` 和 `ClockManager` 代替 `LongSupplier` 作为日间吸气剂
    - `Timeline` 现在采用支架包装的 `WorldClock` 以及时间标记的地图来获取其信息
        - `#builder` 现在采用支架包装的 `WorldClock`
        - `getPeriodCount`- 获取给定时间范围内某个时间段发生的次数。
        - `getCurrentTicks` 现在采用 `ClockManager` 而不是 `Level`
        - `getTotalTicks` 现在采用 `ClockManager` 而不是 `Level`
        - `clock`- 返回支架包裹的 `WorldClock`。
        - `registerTimeMarkers`- 注册此时间线中定义的所有 `ClockTimeMarker`。
        - `createTrackSampler` 现在采用 `ClockManager` 而不是 `LongSupplier` 作为日间吸气剂
        - `$Builder#addTimeMarker`- 在给定的刻度处添加时间标记，以及是否可以在命令中建议该标记。
    - `Timelines#DAY` -> `OVERWORLD_DAY`

## 将初级数据拆分为保存数据 {#splitting-the-primary-level-data-into-saved-data}

一些 `WorldData` 设置已移至 `SavedData`，允许级别/尺寸具有更多可定制性。此添加还对 `SavedData` 的引用和查询方式进行了一些更改。

### 保存的数据更改 {#saved-data-changes}

`SavedDataType` 现在使用 `Identifier` 识别一些 `SavedData`，这是根据数据文件夹解析的。此更改允许数据文件夹内的子目录，因为数据存储在尝试写入文件之前将首先创建所有丢失的父目录。

```java
public class ExampleData extends SavedData {

    public static final SavedDataType<ExampleData> TYPE = new SavedDataType<>(
        // The identifier for the saved data to resolve against
        // Data can be found in:
        // `<world_folder>/dimensions/<dimension_namespace>/<dimension_path>/data/examplemod/example/data.dat`
        Identifier.fromNamespaceAndPath("examplemod", "example/data"),
        // The constructor to create a new saved data
        ExampleData::new,
        // The codec to serialize the new saved data
        MapCodec.unitCodec(ExampleData::new),
        // The data fixer type
        // Either some patched enum value or null depending on mod loader implementation.
        null
    );
}
```

然后可以通过 `SavedDataStorage`（从 `DimensionDataStorage` 重命名）来查询 `SavedData`。之所以重命名，是因为除了级别之外，`MinecraftServer` 实例现在还拥有自己的全局实例数据存储。这意味着任何全局保存的数据都应该存储在服务器实例上而不是主世界上。

```java
// Given a MinecraftServer server
ExampleData data = server.getDataStorage().computeIfAbsent(ExampleData.TYPE);


// Given a ServerLevel level
ExampleData data = level.getDataStorage().computeIfAbsent(ExampleData.TYPE);
```

### 附加保存数据 {#additional-saved-data}

以下信息现在存储为已保存数据：

- 自定义老板事件
- 安德龙之战
- 游戏规则
- 流浪商人生成
- 天气
- 世界生成设置

其中，只有末影龙的战斗是按级别/维度进行的。其余的仍然通过服务器数据存储进行存储和访问。另一方面，自定义头目事件仍然是独一无二的，因为由实施者来确定哪些玩家是事件的一部分。

- `net.minecraft.client.Minecraft#doWorldLoad` 现在包含可选的 `GameRules`
- `net.minecraft.client.gui.screens.worldselection`
    - `CreateWorldCallback` 现在采用 `LevelDataAndDimensions$WorldDataAndGenSettings` 和可选的 `GameRules`，而不是 `PrimaryLevelData`
    - `EditGameRulesScreen` -> `AbstractGameRulesScreen`
        - `.screens.options.InWorldGameRulesScreen` 和 `WorldCreationGameRulesScreen` 中的实现
    - `WorldOpenFlows`
        - `createLevelFromExistingSettings` 现在采用 `LevelDataAndDimensions$WorldDataAndGenSettings` 和可选的 `GameRules`，而不是 `WorldData`
        - `loadWorldStem` 现在包含 `LevelStorageSource$LevelStorageAccess`
- `net.minecraft.client.server.IntegratedServer` 现在包含可选的 `GameRules`
- `net.minecraft.server`
    - `MinecraftServer` 现在包含可选的 `GameRules`
        - `getGlobalGameRules`- 获取主世界维度的游戏规则。
        - `getWorldGenSettings`- 获取世界的生成设置。
        - `getWeatherData`- 获取服务器的天气数据。
        - `getDataStorage`- 获取服务器保存的数据存储。
        - `getGameRules`- 获取服务器的游戏规则。
    - `WorldStem` 现在采用 `LevelDataAndDimensions$WorldDataAndGenSettings` 而不是 `WorldData`
- `net.minecraft.server.bossevents`
    - `CustomBossEvent` 现在采用 `UUID` 作为标识符以及 `Runnable` 作为回调
        - `getTextId` -> `customId`
        - `addOfflinePlayer` 已删除
        - `getValue` -> `value`
        - `getMax` -> `max`
        - `load` 现在接受 `UUID` 标识符以及用于回调的 `Runnable`
    - `CustomBossEvents` 现在扩展 `SavedData`
        - `create` 现在采用 `RandomSource`
        - `save`、 `load`->`TYPE`，不是一对一
- `net.minecraft.server.dedicated.DedicatedServer` 现在包含可选的 `GameRules`
- `net.minecraft.server.level`
    - `ChunkMap#getChunkDataFixContextTag` 现在采用可选的 `Identifier` 而不是 `ResourceKey`
    - `ServerBossEvent` 现在采用 `UUID` 作为 id
        - `setDirty`- 将 Boss 事件标记为脏以保存。
    - `ServerLevel` 不再包含 `RandomSequences`
        - `setWeatherParameters` -> `MinecraftServer#setWeatherParameters`
        - `getWeatherData`- 获取服务器的天气数据。
        - `getRandomSequence` -> `MinecraftServer#getRandomSequence`
        - `getRandomSequences` -> `MinecraftServer#getRandomSequences`
- `net.minecraft.world.entity.npc.wanderingtrader.WanderingTraderSpawner` 现在采用 `SavedDataStorage` 而不是 `ServerLevelData`
    - `MIN_SPAWN_CHANCE` 现在从 `private` 变为 `public`
- `net.minecraft.world.entity.raid.Raids#TYPE_END`、 `getType` 已删除
- `net.minecraft.world.level`
    - `Level#prepareWeather` 已删除
    - `LevelSettings` 现已创纪录
        - 构造函数现在接受 `$DifficultySettings` 而不仅仅是 `Difficulty`
        - `withDifficultyLock`- 难度是否锁定的设置。
        - `copy`- 复制设置。
        - `$DifficultySettings`- 难度设置。
- `net.minecraft.world.level.dimension.DimensionType` 现在接受 `boolean` 来判断该维度是否可以进行末影龙战斗
- `net.minecraft.world.level.dimension.end`
    - `DragonRespawnAnimation`->`DragonRespawnStage`，不是一对一
    - `EndDragonFight`->`EnderDragonFight`，不是一对一
- `net.minecraft.world.level.gamerules.GameRuleMap` 现在扩展 `SavedData`
    - `TYPE`- 保存的数据类型。
    - `reset`- 将规则重置为其默认值。
- `net.minecraft.world.level.levelgen.WorldGenSettings` 现在是最终级别而不是记录，扩展了 `SavedData`
    - `encode`、 `decode` 替换为 `TYPE`
    - `of`- 构建生成设置。
- `net.minecraft.world.level.saveddata`
    - `SavedDataType` 现在采用 `Identifier` 而不是 id 字符串
    - `WanderingTraderData`- 为流浪交易者保存的数据。
    - `WeatherData`- 保存的天气数据。
- `net.minecraft.world.level.storage`
    - `DimensionDataStorage`->`SavedDataStorage`，不是一对一
    - `LevelData#isThundering`、 `isRaining`、 `setRaining` 现在为 `WeatherData`
    - `LevelDataAndDimensions` 现在采用 `$WorldDataAndGenSettings` 而不是 `WorldData`
        - `$WorldDataAndGenSettings`- 保存世界数据和生成设置。
    - `LevelResource` 现已创纪录
    - `PrimaryLevelData` 字段已移至各自保存的数据类
        - `PLAYER` -> `OLD_PLAYER`
        - `SINGLEPLAYER_UUID`- 表示单人游戏世界中玩家的 UUID 的字符串。
        - `WORLD_GEN_SETTINGS` -> `OLD_WORLD_GEN_SETTINGS`
        - `writeLastPlayed`- 写入最后播放的玩家。
        - `writeVersionTag`- 写入数据版本标签。
    - `ServerLevelData`
        - `setThundering`、 `getRainTime`、 `setRainTime`、 `setThunderTime`、 `getThunderTime`、 `getClearWeatherTime`、 `setClearWeatherTime` 移至 `WeatherData`
        - `getWanderingTraderSpawnDelay`、 `setWanderingTraderSpawnDelay`、 `getWanderingTraderSpawnChance`、 `setWanderingTraderSpawnChance`、 `getWanderingTraderId`、 `setWanderingTraderId` 移至 `WanderingTraderData`
        - `getLegacyWorldBorderSettings`、 `setLegacyWorldBorderSettings` 替换为 `WorldBorder`
        - `getScheduledEvents` -> `MinecraftServer#getScheduledEvents`
        - `getGameRules` 替换为 `GameRuleMap`
    - `WorldData`
        - `getCustomBossEvents`、 `setCustomBossEvents` 替换为 `CustomBossEvents`
        - `createTag` 不再包含 `RegistryAccess`
        - `getGameRules` 替换为 `GameRuleMap`
        - `getLoadedPlayerTag`->`getSinglePlayerUUID`，不是一对一
        - `endDragonFightData`、 `setEndDragonFightData` 替换为 `EnderDragonFight`
        - `worldGenOptions` 替换为 `WorldGenSettings` 保存的数据
- `net.minecraft.world.level.timers.TimerQueue` 现在扩展 `SavedData`
    - 构造函数现在接受 `$Packed` 事件，而不是事件数据的 `TimerCallbacks` 和 `Stream`
    - `store` 替换为 `CODEC`、 `TYPE`、 `codec`
    - `loadEvent`、 `storeEvent` 替换为 `$Event$Packed#codec`
    - `$Event` 现已创纪录
        - `$Packed`- 打包的事件数据。
    - `$Packed`- 打包时间队列。

## 更多渲染变化 {#even-more-rendering-changes}

### 材料和动态层选择 {#materials-and-dynamic-layer-selection}

方块和物品模型现在不再指定它们所属的 `RenderType` 或 `ChunkSectionLayer`。相反，这是在加载模型时计算的，确定每个四边形的关联层。这意味着 `ItemBlockRenderTypes` 被删除，同时为完全删除的物品设置 `RenderType`。

为了确定四边形或面设置到哪个层，需要计算纹理的 `Transparency`。具体来说，它检查映射到四边形的 UV 区域是否存在透明（alpha 为 0）或半透明（alpha 不为 0 或 255）的像素。对于 `ChunkSectionLayer`，如果有半透明像素则使用 `ChunkSectionLayer#TRANSLUCENT`，否则如果有透明像素则使用 `CUTOUT`，否则使用 `SOLID`。对于物品，如果存在半透明像素，则使用块物品的 `RenderType`、 `Sheets#translucentItemSheet` 和 `translucentBlockItemSheet`，或者块物品的 `cutoutItemSheet` 和 `cutoutBlockItemSheet`。 `Transparency` 也会影响使用 `MipmapStrategy#AUTO`，如果存在透明像素，则默认使用 `CUTOUT` 而不是 `MEAN`。

人们可以通过模型 JSON 定义的 `Material` 纹理来影响四边形的 `Transparency`。 `Material` 指定纹理的 `sprite`，它表示纹理的相对路径，还可以指定 `force_translucent`，它强制使用此纹理的任何四边形使用 `Transparency#TRANSLUCENT`（透明为 false，半透明为 true）：

```json5
// For some model `examplemod:example_model`
// In: `assets/examplemod/models/example_model.json`
{
    "parent": "minecraft:block/template_glass_pane_post",
    "textures": {
        // A Material can be a simple texture reference
        // Points to `assets/minecraft/textures/block/glass_pane_top.png`
        "edge": "minecraft:block/glass_pane_top",
        // Or it can be an object
        "pane": {
            // The relative texture reference for faces using this key
            // Points to `assets/minecraft/textures/block/glass.png`
            "sprite": "minecraft:block/glass",
            // When true, sets all faces using this texture key to
            // always have a transparent pixel.
            "force_translucent": true
        }
    }
    // ...
}
```

此更改还定义了渲染顺序，其中首先渲染所有实心四边形，然后是剪切四边形，最后是半透明四边形，按距相机的距离排序。

### 材质和精灵 {#materials-and-sprites}

你可能已经注意到，`Material` 最初用于定义图集中的某些纹理。纹理 JSON 中材质的添加更改了这些类的命名。 `Material` 现在明确引用模型 JSON 中的纹理引用。这意味着对原始纹理位置的所有引用都已替换为 `Material`（如果未烘焙）和 `Material$Baked`（如果烘焙）。此外，`SpriteGetter` 现在为 `MaterialBaker`。

至于原来的 `Material`，现在被称为精灵，其中 `Material` 被重命名为 `SpriteId`，`MaterialSet` 被重命名为 `SpriteGetter`。

### 四粒子层 {#quad-particle-layers}

`SingleQuadParticle$Layer` 已分为 `OPAQUE_*` 和 `TRANSLUCENT_*` 层，具体取决于图集使用的粒子纹理是否包含半透明像素。请注意，本例中的“不透明”意味着剪切，其中 alpha 小于 0.1 的像素将被丢弃。如果不创建新层，则可以使用 `$Layer#bySprite` 来确定粒子纹理应使用哪个层。

```java
public class ExampleParticle extends SingleQuadParticle {

    private final SingleQuadParticle.Layer layer;

    public SingleQuadParticle(ClientLevel level, double x, double y, double z, TextureAtlasSprite sprite) {
        super(level, x, y, z, sprite);
        this.layer = SingleQuadParticle.Layer.bySprite(sprite);
    }

    @Override
    protected SingleQuadParticle.Layer getLayer() {
        return this.layer;
    }
}
```

### 块模型 {#block-models}

用于在一般世界上下文之外渲染单个块模型的管道已被重写，类似于 `ItemModel`，其中“块模型”更新一些渲染状态，然后提交其元素进行渲染。因此，大多数块模型类都已在一定程度上被重写或重组。

由于块模型名称通常与模型 JSON 是同义的，因此许多类被移动并重命名，以将模型 JSON 与方块状态 JSON 和现在的块模型分开。因此，名称中最初包含“块”的模型的几何形状更改为“立方体”：（例如，`BlockModel`->`CuboidModel`、 `BlockModelWrapper`->`CuboidItemModelWrapper`）。此外，涉及方块状态 JSON 内定义的部分渲染过程从“块”更改为“方块状态”（例如，`BlockModelPart`->`BlockStateModelPart`、 `BlockModelDefinition`->`BlockStateModelDispatcher`）。你可以认为大多数“块模型”类都是新的，这些类被重命名以替换 `SpecialBlockModelRenderer` 系统。

在加载并解析所有模型和定义后，块模型系统从 `ModelManager` 开始，准备进行烘焙。块模型通过 `BuiltInBlockModels#crateBlockModels` 加载，它将一些 `BlockState` 链接到 `BlockModel$Unbaked`。与物品模型类似，未烘焙的实例定义了如何构建块模型的属性。这些存储在 `LoadedBlockModels` 中，然后将所有 JSON 通过 `bake` 烘焙到 `BlockModel` 中。然后，这个 `BlockState` 到 `BlockModel` 的映射存储在 `BlockModelSet` 中，准备通过 `get` 进行查询，或者更常见的是通过 `BlockModelResolver#update` 进行查询，后者在模型集中调用。任何未定义的模型都会延迟解析为 `BlockStateModel` 周围的包装器。

原版 提供了六种 `BlockModel` 实现供常用。有 `EmptyBlockModel`，它不提交任何元素，因此不渲染任何内容；`BlockStateModelWrapper`，它环绕并显示关联的 `BlockStateModel`。然后，基于某些属性开关（`SelectBlockModel`）、条件 `boolean`（`ConditionalBlockModel`）更改模型以及将多个模型组合在一起（`CompositeBlockModel`）是等效的。最后是 `SpecialBlockModelWrapper`，它通过存储的 `SpecialModelRenderer`（物品模型和块模型之间的统一提交者）提交其元素。

```java
// As the block model system is hardcoded through its in-code bootstrap,
// this example will assume there exists some method to get access to the
// `BuiltInBlockModels$Builder` builder.

// We will also assume we have some Block EXAMPLE_BLOCK_* to attach the models to.

// Regular block model
builder.put(
    // A factory that takes in the `BlockColors` and `BlockState` to return
    // a `BlockModel$Unbaked`.
    (colors, state) -> new BlockStateModelWrapper.Unbaked(
        // The state to get the `BlockStateModel` of.
        state,
        // The tint layers for the model.
        colors.getTintSources(state),
        // An optional transformation to apply to the `PoseStack` before
        // submitting the model.
        Optional.empty(new Transformation(new Matrix4f().translation(0.5f, 0.5f, 0.5f)))
    ),
    // The block to use this model for. Will loop through a construct one
    // per state.
    EXAMPLE_BLOCK_1
);

// Block model switched on some property
builder.put(
    (colors, state) -> new SelectBlockModel.Unbaked(
        // An optional transformation to apply to the `PoseStack` before
        // submitting the model.
        Optional.empty(),
        // A record containing the property to switch on, along with the
        // values when a specific block model should be selected.
        new SelectBlockModel.UnbakedSwitch<>(
            // The `SelectBlockModelProperty` to switch on. The property
            // value is determined from the `BlockState` and its `BlockDisplayContext`.
            (state, displayContext) -> state.getRenderShape(),
            // The list of cases to determine what `BlockModel` to use.
            List.of(
                new SelectBlockModel.SwitchCase<>(
                    // The list of values this model applies to.
                    List.of(RenderShape.INVISIBLE),
                    // The model to use when this property is met.
                    new EmptyBlockModel.Unbaked()
                )
            ),
            // An optional fallback if no switch case matches the state's
            // property.
            Optional.of(new EmptyBlockModel.Unbaked())
        )
    ),
    EXAMPLE_BLOCK_2
);

// Block model based on some conditional
builder.put(
    (colors, state) -> new ConditionalBlockModel.Unbaked(
        // An optional transformation to apply to the `PoseStack` before
        // submitting the model.
        Optional.empty(),
        // The `ConditionalBlockModelProperty` that determines the
        // `boolean` from the `BlockState`.
        BlockState::isSignalSource,
        // The model to display when the property returns `true`.
        new EmptyBlockModel.Unbaked(),
        // The model to display when the property returns `false`.
        new EmptyBlockModel.Unbaked()
    ),
    EXAMPLE_BLOCK_3
);

// A composite block model
builder.put(
    (colors, state) -> new CompositeBlockModel.Unbaked(
        // The first model to display.
        new EmptyBlockModel.Unbaked(),
        // The second model to display.
        new EmptyBlockModel.Unbaked(),
        // An optional transformation to apply to the `PoseStack` before
        // submitting the model.
        Optional.empty()
    ),
    EXAMPLE_BLOCK_4
);

// Special block model
builder.put(
    (colors, state) -> new SpecialBlockModelWrapper.Unbaked(
        // The unbaked `SpecialModelRenderer` used to submit elements for the
        // model.
        new BellSpecialRenderer.Unbaked(),
        // An optional transformation to apply to the `PoseStack` before
        // submitting the model.
        Optional.empty()
    ),
    EXAMPLE_BLOCK_5
);
```

提交渲染元素时，方块模型由 `BlockModelResolver` 和 `BlockModelRenderState` 处理，其流程与其他渲染状态类似。首先，`BlockModelResolver#update` 初始化 `BlockModelRenderState`。普通模型会依次经过 `BlockModelRenderState#setupModel` 和 `setupTints`：前者把模型部件加入返回的列表，后者设置色调；特殊渲染器则由 `setupSpecialModel` 处理。随后，渲染状态通过 `BlockModelRenderState#submit` 提交待绘制元素。此外，它还提供 `submitOnlyOutline` 和 `submitWithZOffset`，前者使用轮廓渲染类型，后者使用带前向 Z 偏移的实体实心渲染类型。

```java
// BlockEntity example
public class ExampleRenderState extends BlockEntityRenderState {
    // Hold the render state.
    public final BlockModelRenderState exampleBlock = new BlockModelRenderState();
}

public class ExampleRenderer implements BlockEntityRenderer<ExampleBlockEntity, ExampleRenderState> {

    // The display context for use in the block entity renderer.
    public static final BlockDisplayContext BLOCK_DISPLAY_CONTEXT = BlockDisplayContext.create();
    private final BlockModelResolver blockResolver;

    public ExampleRenderer(BlockEntityRendererProvider.Context ctx) {
        super(ctx);
        // Get the model resolver.
        this.blockResolver = ctx.blockModelResolver();
    }

    @Override
    public void extractRenderState(ExampleBlockEntity blockEntity, ExampleRenderState state, float partialTick, Vec3 cameraPosition, ModelFeatureRenderer.CrumblingOverlay breakProgress) {
        super.extractRenderState(blockEntity, state, partialTick, cameraPosition, breakProgress);

        // Update the model state.
        this.blockResolver.update(state.exampleBlock, Blocks.DIRT.defaultBlockState(), BLOCK_DISPLAY_CONTEXT);
    }

    @Override
    public void submit(ExampleRenderState state, PoseStack pose, SubmitNodeCollector collector, CameraRenderState camera) {
        super.submit(state, pose, collector, camera);

        // Submit the model state for rendering.
        state.exampleBlock.submit(
            // The current pose stack,
            pose,
            // The node collector.
            collector,
            // The light coordinates.
            state.lightCoords,
            // The overlay coordinates.
            OverlayTexture.NO_OVERLAY,
            // The outline color.
            0
        );


    }
}

// Entity example
public class ExampleRenderState extends EntityRenderState {
    // Hold the render state.
    public final BlockModelRenderState exampleBlock = new BlockModelRenderState();
}

public class ExampleRenderer extends EntityRenderer<ExampleEntity, ExampleRenderState> {

    // The display context for use in the entity renderer.
    public static final BlockDisplayContext BLOCK_DISPLAY_CONTEXT = BlockDisplayContext.create();
    private final BlockModelResolver blockResolver;

    public ExampleRenderer(EntityRendererProvider.Context ctx) {
        super(ctx);
        // Get the model resolver.
        this.blockResolver = ctx.getBlockModelResolver();
    }

    @Override
    public void extractRenderState(ExampleEntity entity, ExampleRenderState state, float partialTick) {
        super.extractRenderState(entity, state, partialTick);

        // Update the model state.
        this.blockResolver.update(state.exampleBlock, Blocks.DIRT.defaultBlockState(), BLOCK_DISPLAY_CONTEXT);
    }

    @Override
    public void submit(ExampleRenderState state, PoseStack pose, SubmitNodeCollector collector, CameraRenderState camera) {
        super.submit(state, pose, collector, camera);

        // Submit the model state for rendering.
        state.exampleBlock.submit(
            // The current pose stack.
            pose,
            // The node collector.
            collector,
            // The light coordinates.
            state.lightCoords,
            // The overlay coordinates.
            OverlayTexture.NO_OVERLAY,
            // The outline color.
            state.outlineColor
        );
    }
}
```

### 块色调源 {#block-tint-sources}

`BlockColor` 已完全被 `BlockTintSource` 取代，后者根据所需的上下文设置特定索引的 ARGB 色调。色调源可以提供三种上下文：

- `color` 用于一般上下文，由 `BlockModel` 使用
- `colorInWorld` 为世界上下文，由 `ModelBlockRenderer#tesselateBlock` 使用
- `colorAsTerrainParticle` 为粒子上下文，由落尘和地形粒子使用

此外，如果 `BlockState` 的 `Property` 用于确定要着色的颜色，则 `BlockTintSource` 提供 `relevantProperties`。 `LevelRenderer` 使用它来确定状态更改是否需要重新渲染模型。

`BlockTintSource` 仍然通过 `register` 注册到 `BlockColors`，接收源列表，后跟块的可变参数。模型 JSON 中指定的 `tintindex` 用于索引色调源列表。

```java
// Assume access to BlockColors colors
colors.register(
    // The list of tints to apply to some block model.
    List.of(
        // "tintindex": 0
        (state) -> 0xFFFF0000,
        // "tintindex": 1
        new BlockTintSource() {

            @Override
            public int color(BlockState state) {
                return 0xFF00FF00;
            }

            @Override
            public int colorInWorld(BlockState state, BlockAndTintGetter level, BlockPos pos) {
                return 0xFF0000FF;
            }
        }
    ),
    // The blocks these tint sources will apply to.
    EXAMPLE_BLOCK_1
);
```

### 删除旧的块和物品渲染器 {#removing-the-old-block-and-item-renderers}

由于 `ItemModel` 和 `BlockModel` 现在完全由各自的渲染元素提交管线处理，`BlockRenderDispatcher` 和 `ItemRenderer` 已被移除，并由相应的新系统取代。

### 对象定义转换 {#object-definition-transformations}

`ItemModel`s 和 `BlockModel`s 现在可以采用可选的 `Transformation`，这会改变模型的显示方式。因此，`$Unbaked#bake` 方法现在采用父 `Matrix4fc` 转换，并通过 `Transformation#compose` 将该转换相乘。对于物品模型，这称为与模型 JSON 物品转换分开的本地转换。局部变换始终在物品变换之后应用。

请注意，添加对转换的支持应始终通过 `Transformation#compose` 完成，因为传递的矩阵本质上是可变的。假设任何不通过普通接口执行的自定义方法都应该在执行任何修改之前进行复制。

### 四实例 {#quad-instance}

亮度/色调颜色、光照贴图和叠加坐标已合并到单个对象中：`QuadInstance`。可变类通过其关联的 `set*` 方法设置其值，并可以通过 `get*` 方法提取每个四边形顶点的信息。亮度和色调作为颜色存储在一起，而不是两个单独的值。

`QuadInstance` 不会替换所有用例，例如添加单个顶点时。它仅更新 `VertexConsumer` 的方法，将 `putBulkData` 拆分为 `putBlockBakedQuad`（用于块模型中的四边形），并将 `putBakedQuad` 拆分为所有其他用途。

此外，用于将 `BakedQuad` 上传到缓冲区的许多方法现在都采用 `BlockQuadOutput`。它具有与 `VertexConsumer#putBlockBakedQuad` 相同的参数，并且是由于部分渲染器上传到新分配的 `BufferBuilder` 以与 uber 缓冲区一起使用而添加的。

### 桂提取器 {#gui-extractor}

GUI 类方法经历了大规模的重命名方案，表明提交的元素被“提取”到要提交的通用树中，然后呈现。因此，以 `draw*` 或 `render*` 开头的方法现在以 `extract*` 为前缀，并可能以 `*RenderState` 为后缀（例如，`Renderable#render`->`extractRenderState`、 `AbstractContainerScreen#renderLabels`->`extractLabels`、 `AbstractWidget#renderWidget`->`extractWidgetRenderState`）。一些速记方式也得到了扩展，通过重命名或用另一种方法替换该方法（例如，`AbstractContainerScreen#renderBg` 替换为 `Screen#extractBackground`）。

`GuiGraphics` 也以同样的方式重命名为 `GuiGraphicsExtractor`。这些方法遵循与其余 GUI 更改类似的模式（例如 `hline`->`horizontalLine`），除了 `draw*`、 `render*` 和 `submit*` 前缀以及 `*RenderState` 后缀被删除（例如 `renderOutline`->`outline`、 `submitEntityRenderState`->`entity`）。唯一的重命名是 `*String*` 方法名称替换为 `*Text*`。

### 流体模型 {#fluid-models}

定义流体的纹理和色调现已从 `FluidRenderer`（以前的 `LiquidBlockRenderer`）移出并移至其自己单独的 `FluidModel` 记录中。最初，由于流体数量较少，未烘焙的变体 (`FluidModel$Unbaked`) 被存储为常量。然后，在烘焙 `BlockModel` 后，通过 `FluidStateModelSet#bake` 烘焙流体模型，将 `Fluid` 与其 `FluidModel` 连接起来。然后，该地图存储在 `FluidStateModelSet` 中，准备通过 `get` 进行查询。

`FluidModel$Unbaked` 有四个参数：三个 `Material` 用于静止、流动和可选的覆盖纹理；一个为 `BlockTintSource`。色调是通过 `BlockTintSource#colorInWorld` 获得的。在烘烤过程中，它会根据提供的材料的透明度确定 `ChunkSectionLayer`。

```java
// As the fluid model system is hardcoded within its baking, this example
// will assume there exists some method to get modifiable access to the
// `Map<Fluid, FluidModel>` fluidModels returned by `FluidStateModelSet#bake`.

// We will also assume we have some Fluid EXAMPLE_FLUID* to attach the models to.

FluidModel.Unbaked exampleFluidModel = new FluidModel.Unbaked(
    // The texture for the still fluid.
    new Material(
        // The relative identifier for the texture.
        // Points to `assets/examplemod/textures/block/example_fluid_still.png`
        Identifier.fromNamespaceAndPath("examplemod", "block/example_fluid_still"),
        // When true, sets all faces using this texture key to
        // always have a transparent pixel.
        true
    ),
    // The texture for the flowing fluid.
    new Material(Identifier.fromNamespaceAndPath("examplemod", "block/example_fluid_flowing")),
    // If not null, the texture for the overlay when the side of the fluid is
    // occluded by a `HalfTransparentBlock` or `LeavesBlock`.
    null,
    // If not null, the tint source to apply to the fluid's texture when in
    // the world.
    null
);

// Assume we have access to the `MaterialBaker` materials.

FluidModel exampleBakedFluidModel = exampleFluidModel.bake(
    // The baker to grab the atlas sprites for the materials.
    materials,
    // A supplied debug name to properly report which models have
    // missing textures.
    () -> "examplemod:example_fluid_model"
);

fluidModels.put(
    // The fluid the model should be used by.
    EXAMPLE_FLUID,
    // The baked fluid model.
    exampleBakedFluidModel
);
fluidModels.put(EXAMPLE_FLUID_FLOWING, exampleBakedFluidModel);
```

### 姓名标签偏移量 {#name-tag-offsets}

`EntityRenderer#submitNameTag` 已重命名为 `submitNameDisplay`，现在可以选择采用名称标签附件的 y 偏移量。

### 消色剂 {#tint-getter}

`BlockAndTintGetter` 现在是连接到 `ClientLevel` 的仅客户端接口。它以前的用途被 `BlockAndLightGetter` 取代——`BlockAndTintGetter` 现在扩展了——并且剥离了色调和照明方向。

### 管道深度和颜色 {#pipeline-depth-and-color}

`RenderPipeline` 中定义的深度和颜色方法已合并为两个状态对象。

`DepthTestFunction`，写入 `boolean`，偏置 `float` 现在存储在 `DepthStencilState` 中。 `DepthTestFunction` 已替换为更通用的 `CompareOp`，它定义了如何比较两个数字。每个函数都有一个简单的等效函数，用 `CompareOp#ALWAYS_PASS` 替换 `NO_DEPTH_TEST`。深度信息可以通过 `RenderPipeline$Builder#withDepthStencilState` 添加到管道中。

可选的 `BlendFunction` 和颜色/alpha`boolean` 现在存储在 `ColorTargetState` 中。使用低四位作为标志，将 `boolean` 合并为 `int`：`1` 为红色，`2` 为绿色，`4` 为蓝色，`8` 为 alpha。颜色 `boolean` 使用 `7` 表示红、绿、蓝； alpha`boolean` 使用 `8`；而两者结合使用 `15`。 `LopicOp` 被完全删除。颜色信息可以通过 `RenderPipeline$Builder#withColorTargetState` 添加到管道中。

```java
public static final RenderPipeline EXAMPLE_PIPELINE = RenderPipeline.builder()
    .withLocation(ResourceLocation.fromNamespaceAndPath("examplemod", "pipeline/example"))
    .withVertexShader(ResourceLocation.fromNamespaceAndPath("examplemod", "example"))
    .withFragmentShader(ResourceLocation.fromNamespaceAndPath("examplemod", "example"))
    .withVertexFormat(DefaultVertexFormat.POSITION_TEX_COLOR, VertexFormat.Mode.QUADS)
    .withShaderDefine("ALPHA_CUTOUT", 0.5)
    .withSampler("Sampler0")
    .withUniform("ModelOffset", UniformType.VEC3)
    .withUniform("CustomUniform", UniformType.INT)
    .withPolygonMode(PolygonMode.FILL)
    .withCull(false)
    // Sets the color target when writing the buffer data.
    .withColorTargetState(new ColorTargetState(
        // Specifies the functions to use when blending two colors with alphas together.
        // Made up of the `SourceFactor` and `DestFactor`.
        // First two are for RGB, the last two are for alphas.
        // If the optional is empty, then blending is disabled.
        Optional.of(BlendFunction.TRANSLUCENT),
        // The mask determining what colors to write to the buffer.
        // Represented as a four bit value
        // 0001 - Write the red channel..
        // 0010 - Write the green channel.
        // 0100 - Write the blue channel.
        // 1000 - Write the alpha channel.
        ColorTargetState.WRITE_RED | ColorTargetState.WRITE_GREEN | ColorTargetState.WRITE_BLUE | ColorTargetState.WRITE_ALPHA
    ))
    // Sets the depth stencil when writing the buffer data.
    .withDepthStencilState(new DepthStencilState(
        // Sets the depth test function to use when rendering objects at varying
        // distances from the camera.
        // Values:
        // - ALWAYS_PASS           (GL_ALWAYS)
        // - LESS_THAN             (GL_LESS)
        // - LESS_THAN_OR_EQUAL    (GL_LEQUAL)
        // - EQUAL                 (GL_EQUAL)
        // - NOT_EQUAL             (GL_NOTEQUAL)
        // - GREATER_THAN_OR_EQUAL (GL_GEQUAL)
        // - GREATER_THAN          (GL_GREATER)
        // - NEVER_PASS            (GL_NEVER)
        CompareOp.LESS_THAN_OR_EQUAL,
        // Whether to mask writing values to the depth buffer
        false,
        // The scale factor used to calculate the depth values for the polygon.
        0f,
        // The unit offset used to calculate the depth values for the polygon.
        0f
    ))
    .build()
;
```

### Blaze3d 后端 {#blaze3d-backends}

`CommandEncoder`、 `GpuDevice` 和 `RenderPassBackend` 已分为 `*Backend` 接口（其功能与之前的接口类似）和包装器类（它保存后端并提供委托调用，执行任何必要的验证）。 `*Backend` 接口现在显式执行该操作，而不检查该操作是否有效。

### 固体和半透明特征 {#solid-and-translucent-features}

特征渲染进一步分为两个通道：一个用于实体渲染类型，另一个用于半透明渲染类型。因此，大多数 `render` 方法现在分别具有 `renderSolid` 和 `renderTranslucent` 方法。那些只渲染固体或半透明数据的只有其中一种方法。

### 相机状态 {#camera-state}

`Camera` 的更新与其他渲染状态实现类似，其中相机在 `GameRenderer#renderLevel` 期间被提取到 `CameraRenderState`，并且与提交和渲染元素所需的数据一起传递。

由于此更改，`FogRenderer#setupFog` 现在返回 `FogData`，其中包含渲染雾所需的所有信息，而不仅仅是其颜色，并将其存储在 `CameraRenderState#fogData` 中。

- `assets/minecraft/shaders/core` 中的一些着色器现在使用 `texture` 而不是 `texelFetch`
    - `entity.vsh`
    - `item.vsh`
    - `rendertype_leash.vsh`
    - `rendertype_text.vsh`
    - `rendertype_text_background.vsh`
    - `rendertype_text_intensity.vsh`
- `assets/minecraft/shaders/core`
    - `block.vsh#minecraft_sample_lightmap` -> `sample_lightmap.glsl#sample_lightmap`
    - `rendertype_crumbling` 不再接受 `texCoord2`（光照贴图）
    - 使用 `DissolveMaskSampler` 将 `rendertype_entity_alpha`、 `rendertype_entity_decal` 合并到 `entity.fsh`
    - `rendertype_item_entity_translucent_cull`->`item`，不是一对一
    - `rendertype_translucent_moving_block` 已删除
        - 现在使用 `ChunkSectionLayer` 提供的着色器
- `com.mojang.blaze3d`
    - `GLFWErrorCapture`- 捕获总帐流程期间的错误。
    - `GLFWErrorScope`- 定义要捕获的 GL 错误范围的可关闭对象。
- `com.mojang.blaze3d.opengl`
    - `GlProgram#BUILT_IN_UNIFORMS`、 `INVALID_PROGRAM` 现已最终确定
    - `GlBackend`- OpenGL 的 GPU 后端。
    - `GlCommandEncoder` 现在实现 `CommandEncoderBackend` 而不是 `CommandEncoder`，该类现在是包私有的
        - `getDevice` 已删除
    - `GlConst#toGl` 现在采用 `CompareOp` 而不是 `DepthTestFunction`
    - `GlDevice` 现在实现 `GpuDeviceBackend` 而不是 `GpuDevice`，该类现在是包私有的
        - 构造函数现在接受一个 `GpuDebugOptions`，其中包含日志级别、是否使用同步日志以及是否使用调试标签而不是直接传入的参数
    - `GlRenderPass` 现在实现 `RenderPassBackend` 而不是 `RenderPass`，该类现在是包私有的
        - 构造函数现在接受 `GlDevice`
    - `GlStateManager#_colorMask` 现在采用 `int` 作为颜色掩模，而不是四个 `boolean`
- `com.mojang.blaze3d.platform`
    - `ClientShutdownWatchdog` 现在接受 `Minecraft` 实例
    - `DebugMemoryUntracker#untrack` 已删除
    - `GLX#make(T, Consumer)` 已删除
    - `NativeImage`
        - `computeTransparency`- 返回图像中是否至少有一个透明或半透明像素。
            - 如果图像的面积大于 512MiB，或者颜色数据大于 2GiB，则会崩溃。
        - `isClosed`- 映像是否关闭或释放。
    - `Transparency`- 某个图像是否具有半透明和/或透明像素的对象。
    - `Window` 现在采用 `GpuBackend` 而不是 `ScreenManager`
        - `createGlfwWindow`- 使用提供的设置直接创建 GLFW 窗口。
        - `updateDisplay`->`updateFullscreenIfChanged`，不是一对一
        - `isResized`、 `resetIsResized`- 处理窗口是否已调整大小。
        - `backend`- 返回 `GpuBackend`。
        - `$WindowInitFailed` 构造函数现在是来自 `private` 的 `public`
    - `WindowEventHandler`
        - `resizeDisplay` -> `resizeGui`
        - `setWindowActive` 替换为 `Window#isFocused`
- `com.mojang.blaze3d.pipeline`
    - `ColorTargetState`- 包含混合函数和颜色蒙版的记录。
    - `DepthStencilState`- 包含深度模板数据的记录。
    - `RenderPipeline` 现在采用 `ColorTargetState` 而不是可选的 `BlendFunction`、颜色和 Alpha`boolean` 和 `LogicOp`；和 `DepthStencilState` 代替 `DepthTestFunction`、深度 `boolean` 和偏置 `float`
        - `getDepthTestFunction`、 `isWriteDepth`、 `getDepthBiasScaleFactor`、 `getDepthBiasConstant`->`getDepthStencilState`，不是一对一
        - `getColorLogic`、 `getBlendFunction`、 `isWriteColor`、 `isWriteAlpha`->`getColorTargetState`，不是一对一
        - `$Builder`
            - `withDepthTestFunction`、 `withDepthWrite`、 `withDepthBias`->`withDepthStencilState`，不是一对一
            - `withBlend`、 `withColorWrite`、 `withColorLogic`->`withColorTargetState`，不是一对一
        - `$Snippet` 现在采用 `ColorTargetState` 而不是可选的 `BlendFunction`、颜色和 Alpha`boolean` 和 `LogicOp`；和 `DepthStencilState` 代替 `DepthTestFunction` 和深度 `boolean`
- `com.mojang.blaze3d.platform`
    - `BackendOptions`- 用于初始化后端的配置。
    - `DepthTestFunction`->`CompareOp`，不是一对一
        - `NO_DEPTH_TEST` -> `CompareOp#ALWAYS_PASS`
        - `EQUAL_DEPTH_TEST` -> `CompareOp#EQUAL`
        - `LEQUAL_DEPTH_TEST` -> `CompareOp#LESS_THAN_OR_EQUAL`
        - `LESS_DEPTH_TEST` -> `CompareOp#LESS_THAN`
        - `GREATER_DEPTH_TEST` -> `CompareOp#GREATER_THAN`
    - `GLX`
        - `_initGlfw` 现在包含 `BackendOptions`
        - `glfwBool`-`1`（如果 `true`）、 `0`（如果 `false`）。
    - `LogicOp` 枚举已删除
- `com.mojang.blaze3d.shaders.GpuDebugOptions`- GPU 管道的调试选项。
- `com.mojang.blaze3d.systems`
    - `BackendCreationException`- 无法创建 GPU 后端时抛出异常。
    - `CommandEncoder` -> `CommandEncoderBackend`
        - 原始接口现在是接口的类包装器，在执行验证检查后委托给后端
    - `GpuBackend`- 负责创建所使用的 GPU 设备和要显示的窗口的接口。
    - `GpuDevice` -> `GpuDeviceBackend`
        - 原始接口现在是接口的类包装器，在执行验证检查后委托给后端
        - `setVsync`- 设置是否启用垂直同步。
        - `presentFrame`- 交换窗口的前后缓冲区以显示当前帧。
        - `isZZeroToOne`- 是否使用 0 到 1 Z 范围而不是 -1 到 1。
    - `RenderPass` -> `RenderPassBackend`
        - 原始接口现在是接口的类包装器，在执行验证检查后委托给后端
    - `RenderSystem`
        - `pollEvents` 现已公开
        - `flipFrame` 不再包含 `Window`
        - `initRenderer` 现在仅接受 `GpuDevice`
        - `limitDisplayFPS` -> `FramerateLimiter#limitDisplayFPS`
        - `initBackendSystem` 现在包含 `BackendOptions`
- `com.mojang.blaze3d.vertex`
    - `DefaultVertexFormat#BLOCK` 不再接受法线向量
    - `PoseStack#mulPose`、 `$Pose#mulPose` 现在具有接收 `Transformation` 的过载
    - `QuadInstance`- 包含四边形的颜色、光坐标和叠加层的类。
    - `TlsfAllocator`- 用于动态内存分配的两级隔离适合分配器。
    - `UberGpuBuffer`- 用于将动态大小的数据上传到 GPU 的缓冲区，用于块部分层。
    - `VertexConsumer`
        - `putBulkData`->`putBlockBakedQuad`,`putBakedQuad`;不是一对一的
            - 亮度 `float` 数组、颜色 `float`、光照贴图 `int` 数组和叠加层 `int` 替换为 `QuadInstance`
            - `putBlockBakedQuad` 将 `PoseStack$Pose` 替换为 XYZ`float` 块位置
        - `addVertex(PoseStack$Pose, Vector3f)` -> `addVertex(PoseStack$Pose, Vector3fc)`
        - `setNormal(PoseStack$Pose, Vector3f)` -> `setNormal(PoseStack$Pose, Vector3fc)`
- `com.mojang.math`
    - `MatrixUtil`
        - `checkPropertyRaw` 现在从 `private` 变为 `public`
        - `isOrthonormal` 已删除
    - `Transformation`
        - `IDENTITY` 现在从 `private` 变为 `public`
            - 替换 `identity` 方法
        - `getTranslation` -> `translation`
        - `getLeftRotation` -> `leftRotation`
        - `getScale` -> `scale`
        - `getRightRotation` -> `rightRotation`
        - `compose`- 将变换应用于给定矩阵（如果存在）。
- `net.minecraft.SharedConstants`
    - `DEBUG_DUMP_INTERPOLATED_TEXTURE_FRAMES` 已删除
    - `DEBUG_PREFER_WAYLAND`- 当为 true 时，如果 Wayland 和 X11 都受支持，则防止将平台初始化提示设置为 X11。
- `net.minecraft.client`
    - `Camera`
        - `BASE_HUD_FOV`- 基础 HUD 视野。
        - `setup`->`update`，不是一对一
        - `extractRenderState`- 提取相机的状态。
        - `getFov`- 获取视野。
        - `getViewRotationMatrix`- 获取投影视图的矩阵。
        - `setEntity`- 设置相机所连接的实体。
        - `getNearPlane` 现在采用 `float` 视野
        - `panoramicForwards`- 全景模式下的前向矢量。
        - `getPartialTickTime` 已删除
        - `setLevel`- 设置相机所在的级别。
        - `getCameraEntityPartialTicks`- 根据实体的状态获取部分刻度。
    - 当 `boolean` 为 `true` 和 `advanceRealTime` 时，`DeltaTracker#advanceTime` 替换为 `advanceGameTime`
        - `advanceGameTime`、 `advanceRealTime` 以前为 `private`，现在为 `public`
    - `FramerateLimiter`- 用于限制客户端帧速率的实用程序。
    - `Minecraft`
        - `noRender` 已删除
        - `useAmbientOcclusion` 已删除
        - `getBlockRenderer` 已删除
        - `getItemRenderer` 已删除
    - `Options`
        - `getCloudsType` -> `getCloudStatus`
        - `exclusiveFullscreen`- 当 `true` 时，全屏模式完全控制显示器。
- `net.minecraft.client.color.block`
    - `BlockColor` 替换为 `BlockTintSource`，不是一对一
        - `getColor`->`colorInWorld`,`colorAsTerrainParticle`;不是一对一的
    - `BlockColors`
        - `getColor` 替换为 `getTintSources`、 `getTintSource`；不是一对一的
        - `register` 现在接受 `BlockTintSource` 的列表，而不是 `BlockColor`
    - `BlockTintSource`- 有关如何单独或结合上下文对 `BlockState` 进行着色的来源。
    - `BlockTintSources`- 用于常见块色调源的实用程序。
- `net.minecraft.client.data.models`
    - `BlockModelGenerators`
        - `createSuffixedVariant` 现在接受 `Material` 到 `TextureMapping` 的纹理函数，而不仅仅是 `Identifier`
        - `createAirLikeBlock` 现在采用 `Material` 而不是 `Identifier` 作为粒子纹理
        - `generateSimpleSpecialItemModel` 现在采用可选的 `Transformation`
        - `createChest` 现在具有接收 `MutiblockChestResources` 纹理的重载
    - `ItemModelGenerators#generateLayeredItem` 现在采用 `Material` 而不是 `Identifier` 作为纹理
- `net.minecraft.client.data.models.model`
    - `ItemModelUtils`
        - `specialModel` 现在具有吸收 `Transformation` 的重载
        - `conditional` 现在具有吸收 `Transformation` 的重载
        - `select` 现在具有接收 `Transformation` 的过载
        - `selectBlockItemProperty` 现在具有接收 `Transformation` 的过载
    - `TexturedModel#createAllSame` 现在采用 `Material` 而不是 `Identifier` 作为纹理
    - `TextureMapping`
        - `put`、 `putForced` 现在采用 `Material` 而不是 `Identifier` 作为纹理
        - `get` 现在返回纹理的 `Material` 而不是 `Identifier`
        - `copyAndUpdate` 现在采用 `Material` 而不是 `Identifier` 作为纹理
        - `updateSlots`- 使用提供的映射器功能替换所有插槽。
        - `forceAllTranslucent`- 为所有材质纹理设置力半透明标志。
        - `defaultTexture`、 `cube`、 `cross`、 `plant`、 `rail`、 `wool`、 `crop`、 `singleSlot`、 `particle`、 `torch`、 `cauldron`、 `layer0` 现在采用 `Material` 而不是 `Identifier` 作为纹理
        - `column`、 `door`、 `layered` 现在采用 `Material` 而不是 `Identifier` 作为纹理
        - `getBlockTeture`、 `getItemTexture` 现在返回纹理的 `Material` 而不是 `Identifier`
- `net.minecraft.client.entity.ClientAvatarEntity#belowNameDisplay` -> `Entity#belowNameDisplay`
- `net.minecraft.client.gui`
    - `Font`
        - `drawInBatch`、 `drawInBatch8xOutline` 现在采用 `Matrix4fc` 而不是 `Matrix4f` 进行姿势
        - `$GlyphVisitor#forMultiBufferSource` 现在采用 `Matrix4fc` 而不是 `Matrix4f` 来表示姿势
    - `Gui`
        - `render*` 方法已重命名为 `extract*`
        - `render` -> `extractRenderState`
        - `$RenderFunction` 接口被移除
    - `GuiGraphics` -> `GuiGraphicsExtractor`
        - `hLine` -> `horizontalLine`
        - `vLine` -> `verticalLine`
        - `renderOutline` -> `outline`
        - `drawCenteredString` -> `centeredText`
        - `drawString` -> `text`
        - `drawStringWithBackdrop` -> `textWithBackdrop`
        - `renderItem` -> `item`
        - `renderFakeItem` -> `fakeItem`
        - `renderItemDecorations` -> `itemDecorations`
        - `submitMapRenderState` -> `map`
        - `submitEntityRenderState` -> `entity`
        - `submitSkinRenderState` -> `skin`
        - `submitBookModelRenderState` -> `book`
        - `submitBannerPatternRenderState` -> `bannerPattern`
        - `submitSignRenderState` -> `sign`
        - `submitProfilerChartRenderState` -> `profilerChart`
        - `renderTooltip` -> `tooltip`
        - `renderComponentHoverEffect`->`componentHoverEffect`，现在是 `private` 而不是 `public`
- `net.minecraft.client.gui.components`
    - 大多数以 `render*` 或 `draw*` 开头的方法已根据使用情况重命名为 `extract*` 或 `extract*RenderState`。
    - `AbstractWidget#renderWidget` -> `extractWidgetRenderState`
    - `DebugScreenOverlay#render3dCrosshair` 现在采用 `CameraRenderState` 而不是 `Camera`，并且 gui 比例 `int`
    - `LogoRenderer#renderLogo` -> `extractRenderState`
    - `PlayerFaceRenderer` -> `PlayerFaceExtractor`
        - `draw` -> `extractRenderState`
    - `Renderable#render` -> `extractRenderState`
    - `StringWidget#clipText` -> `ComponentRenderUtils#clipText`
    - `TextCursorUtils#draw*` -> `extract*`
- `net.minecraft.client.gui.components.debugchart`
    - `AbstractDebugChart`
        - `drawChart` -> `extractRenderState`
        - `drawDimensions` -> `extractSampleBars`
        - `drawMainDimension` -> `extractMainSampleBar`
        - `drawAdditionalDimensions` -> `extractAdditionalSampleBars`
        - `renderAdditionalLinesAndLabels` -> `extractAdditionalLinesAndLabels`
        - `drawStringWithShade` -> `extractStringWithShade`
    - `ProfilerPieChart#render` -> `extractRenderState`
- `net.minecraft.client.gui.components.spectator.SpectatorGui#render*` -> `extract*`
- `net.minecraft.client.gui.components.toasts`
    - `NowPlayingToast#renderToast` -> `extractToast`
    - `Toast#render` -> `extractRenderState`
    - `ToastManager`, `$ToastInstance#render` -> `extractRenderState`
    - `TutorialToast$Icons#render` -> `extractRenderState`
- `net.minecraft.client.gui.contextualbar.ContextualBarRenderer`
    - `renderBackground` -> `extractBackground`
    - `render` -> `extractRenderState`
    - `renderExperienceLevel` -> `extractExperienceLevel`
- `net.minecraft.client.gui.font`
    - `PlainTextRenderable#renderSprite` 现在采用 `Matrix4fc` 而不是 `Matrix4f` 来表示姿势
    - `TextRenderable#render` 现在采用 `Matrix4fc` 而不是 `Matrix4f` 来表示姿势
- `net.minecraft.client.gui.render`
    - `DynamicAtlasAllocator`- 用于处理动态大小的纹理图集的分配器。
    - `GuiItemAtlas`- 用户界面中显示的所有物品的图集。
    - `GuiRenderer#incrementFrameNumber`->`endFrame`，不是一对一
- `net.minecraft.client.gui.render.state.*` -> `.client.rendererer.state.gui.*`
    - `GuiItemRenderState` 不再采用 `String` 名称
        - `name` 已删除
- `net.minecraft.client.gui.render.state.pip.*` -> `.client.rendererer.state.gui.pip.*`
- `net.minecraft.client.gui.screens`
    - `LevelLoadingScreen#renderChunks` -> `extractChunksForRendering`
    - `Screen`
        - `renderWithTooltipAndSubtitles` -> `extractRenderStateWithTooltipAndSubtitles`
        - `renderBackground` -> `extractBackground`
        - `renderBlurredBackground` -> `extractBlurredBackground`
        - `renderPanorama` -> `extractPanorama`
        - `renderMenuBackground` -> `extractMenuBackground`
        - `renderMenuBackgroundTexture` -> `extractMenuBackgroundTexture`
        - `renderTransparentBackground` -> `extractTransparentBackground`
- `net.minecraft.client.gui.screens.advancements`
    - `AdvancementTab#draw*` -> `extract*`
    - `AdvancementTabType`
        - `draw` -> `extractRenderState`
        - `drawIcon` -> `extractIcon`
    - `AdvancementWidget`
        - `draw` -> `extractRenderState`
        - `draw*` -> `extract*`
- `net.minecraft.client.gui.screens.inventory`
    - 大多数以 `render*` 或 `draw*` 开头的方法已根据使用情况重命名为 `extract*` 或 `extract*RenderState`。
    - `AbstractContainerScreen`
        - `renderContents` -> `extractContents`
        - `renderCarriedItem` -> `extractCarriedItem`
        - `renderSnapbackItem` -> `extractSnapbackItem`
        - `renderSlots` -> `extractSlots`
        - `renderTooltip` -> `extractTooltip`
        - `renderLabels` -> `extractLabels`
        - `renderBg` 替换为 `Screen#extractBackground`
        - `renderSlot` -> `extractSlot`
    - `AbstractMountInventoryScreen#drawSlot` -> `extractSlot`
    - `AbstractSignEditScreen#renderSignBackground` -> `extractSignBackground`
    - `CyclingSlotBackground#render` -> `extractRenderState`
    - `EffectsInInventory#render` -> `extractRenderState`
    - `InventoryScreen#renderEntityInInventoryFollowsMouse` -> `extractEntityInInventoryFollowsMouse`
    - `ItemCombinerScreen#renderErrorIcon` -> `extractErrorIcon`
- `net.minecraft.client.gui.screens.inventory.tooltip`
    - `ClientTooltipComponent`
        - `renderText` -> `extractText`
        - `renderImage` -> `extractImage`
    - `TooltipRenderUtil#renderTooltipBackground` -> `extractTooltipBackground`
- `net.minecraft.client.gui.screens.options`
    - `DifficultyButtons` 现在是包含 `LayoutElement`、 `CycleButton` 难度、 `LockIconButton` 和当前 `Level` 的记录
        - `create` 现在接受 `Level` 并返回 `DifficultyButtons` 而不是 `LayoutElement`
        - `refresh`- 设置保持按钮组件的数据。
    - `HasDifficultyReaction`- 当难度发生变化时做出响应的界面。
    - `OptionsScreen` 现在实现 `HasDifficultyReaction`
    - `WorldOptionsScreen` 现在实现 `HasDifficultyReaction`
        - 构造函数现在接受 `Level`
- `net.minecraft.client.gui.screens.recipebook`
    - `GhostSlots`
        - `render` -> `extractRenderState`
        - `renderTooltip` -> `extractTooltip`
    - `RecipeBookComponent#render*` -> `extract*`
    - `RecipeBookPage`
        - `render` -> `extractRenderState`
        - `renderTooltip` -> `extractTooltip`
- `net.minecraft.cilent.gui.screens.reporting.ChatSelectionScreen$ChatSelectionList#renderItem` -> `extractItem`
- `net.minecraft.client.gui.screens.worldselection.AbstractGameRulesScreen$GameRuleEntry#renderLabel` -> `extractLabel`
- `net.minecraft.client.gui.spectator.SpectatorMenuItem#renderIcon` -> `extractIcon`
- `net.minecraft.client.model.Model#renderType` 现在有一个重载，返回传入的函数
- `net.minecraft.client.model.object.book.BookModel$State` 不再接收动画 pos，并将打开的 `float` 移动到第一个参数
    - `forAnimation`- 根据进度获取书籍动画的当前状态。
- `net.minecraft.client.model.object.statue.CopperGolemStatueModel` 现在使用 `Unit` 作为通用名称，而不是 `Direction`
- `net.minecraft.client.multiplayer.ClientLevel` 现在实现 `BlockAndTintGetter`
    - `update`- 更新关卡的照明。
- `net.minecraft.client.multiplayer.chat.GuiMessageTag$Icon#draw` -> `extractRenderState`
- `net.minecraft.client.particle`
    - `Particle#getLightColor` -> `getLightCoords`
    - `SimpleVerticalParticle`- 垂直移动的粒子。
    - `SingleQuadParticle$Layer`
        - `TERRAIN` -> `OPAQUE_TERRAIN`, `TRANSLUCENT_TERRAIN`
        - `ITEMS` -> `OPAQUE_ITEMS`, `TRANSLUCENT_ITEMS`
        - `bySprite`- 从图集精灵获取图层。
- `net.minecraft.client.renderer`
    - `CachedOrthoProjectionMatrixBuffer`、 `CachedPerspectiveProjectionMatrixBuffer`、 `PerspectiveProjectionMatrixBuffer`->`ProjectionMatrixBuffer` 有时与 `Projection`，不是一对一
    - `CloudRenderer` 现在纳入云范围 `int`
    - `CubeMap` 不再接收 `Minecraft` 实例
    - `GameRenderer` 现在采用 `ModelManager` 而不是 `BlockRenderDispatcher`
        - `PROJECTION_Z_NEAR` -> `Camera#PROJECTION_Z_NEAR`
        - `setPanoramicScreenshotParameters`、 `getPanoramicScreenshotParameters`->`Camera#enablePanoramicMode`、 `disablePanoramicMode`；不是一对一的
        - `isPanoramicMode` -> `Camera#isPanoramicMode`
        - `getProjectionMatrix`->`Camera#getViewRotationProjectionMatrix`，不是一对一
        - `updateCamera`->`Camera#update`，不是一对一
        - `getRenderDistance` 已删除
        - `cubeMap`->`GuiRenderer#cubeMap`，现在从 `protected` 变为 `private`
        - `getDarkenWorldAmount` -> `getBossOverlayWorldDarkening`
        - `lightTexture`->`lightmap`,`levelLightmap`;不是一对一的
        - `getLevelRenderState` 替换为 `getGameRenderState`，返回 `GameRenderState` 而不是 `LevelRenderState`
        - `pick`->`Minecraft#pick`，现在从 `public` 变为 `private`
        - `render` 分为 `update`、 `extract` 和 `render`；`boolean` 现在考虑是否提前游戏时间而不是渲染关卡
    - `GlobalSettingsUniform` 现在采用 `Vec3` 相机位置，而不是主 `Camera` 本身
    - `ItemBlockRenderTypes` 已删除
        - `getChunkRenderType`、 `getMovingBlockRenderType` 现在存储在 `BakedQuad$SpriteInfo` 中
        - `getRenderLayer(FluidState)`->`FluidModel#layer`，不是一对一
        - `setCutoutLeaves` 已删除
            - 这应该直接从选项中获得
    - `MultiblockChestResources`- 包含一些基于 `ChestType` 的数据的记录。
    - `LevelRenderer` 现在采用 `GameRenderState` 代替 `LevelRenderState`
        - `update`- 更新级别。
        - `renderLevel` 现在从模型视图中采用 `CameraRenderState`（而不是 `Camera`）、 `Matrix4fc`（而不是 `Matrix4f`）以及 `ChunkSectionsToRender`；它不再需要 `Matrix3f` 作为投影矩阵
        - `extractLevel`- 提取水平状态。
        - `prepareChunkRenders` 现在是 `public` 而不是 `private`
        - `captureFrustum`、 `killFrustum`、 `getCapturedFrustum` 已删除
        - `getLightColor`->`getLightCoords`，现在采用 `BlockAndLightGetter` 而不是 `BlockAndTintGetter`
        - `$BrightnessGetter#packedBrightness` 现在采用 `BlockAndLightGetter` 而不是 `BlockAndTintGetter`
    - `LightTexture` -> `Lightmap`
        - `tick` -> `LightmapRenderStateExtractor#tick`
        - `updateLightTexture` -> `render`
        - `pack` -> `LightCoordsUtil#pack`
        - `block` -> `LightCoordsUtil#block`
        - `sky` -> `LightCoordsUtil#sky`
        - `lightCoordsWithEmission` -> `LightCoordsUtil#lightCoordsWithEmission`
    - `MaterialMapper` -> `SpriteMapper`
    - `OrderedSubmitNodeCollector`
        - `submitBlock` 已删除
        - `submitBlockModel` 现在采用 `BlockStateModelPart` 列表（而不是 `BlockStateModel`），以及 `int` 数组（色调颜色数组）而不是单个颜色的三个 `float`
        - `submitItem` 不再包含 `RenderType`
        - `submitModel` 现在具有采用 `Identifier` 纹理的重载，或采用 `SpriteId` 和 `SpriteGetter` 以及 `int` 色调颜色的重载
        - `submitBreakingBlockModel`- 提交块破坏覆盖。
    - `PanoramaRenderer` 替换为 `Panorama`
        - `registerTextures` -> `GuiRenderer#registerPanoramaTextures`
        - `render` -> `extractRenderState`
    - `PanoramicScreenshotParameters` 记录已删除
    - `PostChain` 现在采用 `Projection` 和 `ProjectionMatrixBuffer` 而不是 `CachedOrthoProjectionMatrixBuffer`
        - `load` 现在采用 `Projection` 和 `ProjectionMatrixBuffer` 而不是 `CachedOrthoProjectionMatrixBuffer`
    - `RenderPipelines`
        - `ENTITY_CUTOUT_NO_CULL` -> `ENTITY_CUTOUT`
            - 原来带有剔除的切口被替换为 `ENTITY_CUTOUT_CULL`
        - `ENTITY_CUTOUT_NO_CULL_Z_OFFSET` -> `ENTITY_CUTOUT_Z_OFFSET`
        - `ENTITY_SMOOTH_CUTOUT` -> `END_CRYSTAL_BEAM`
        - `ENTITY_NO_OUTLINE` 替换为 `ENTITY_TRANSLUCENT`，使用影响轮廓构建的渲染类型为 false
        - `ENTITY_DECAL`、 `DRAGON_EXPLOSION_ALPHA`->`ENTITY_CUTOUT_DISSOLVE`，不是一对一
        - `ITEM_ENTITY_TRANSLUCENT_CULL`->`ENTITY_TRANSLUCENT_CULL`、 `ITEM_CUTOUT`、 `ITEM_TRANSLUCENT`；不是一对一的
        - `TRANSLUCENT_MOVING_BLOCK` 替换为 `TRANSLUCENT_BLOCK`
        - `BANNER_PATTERN`- 用于渲染横幅上图案的管道。
    - `ScreenEffectRenderer#renderScreenEffect` 现在接受 `boolean` 来判断玩家是否处于第一人称以及是否隐藏 GUI
    - `Sheets`
        - `*CHEST_*LOCATION*` 已根据资源用途合并为 `CHEST_*` 字段之一
        - `translucentBlockSheet`- 使用块图集的可剔除实体项半透明渲染类型。
        - `cutoutBlockItemSheet`- 使用块图集的物品剪切渲染类型。
        - `bannerSheet`->`RenderTypes#entityTranslucent`，不是一对一
        - `cutoutItemSheet`- 使用物品图集的物品剪切渲染类型。
        - `get*Material` -> `get*Sprite`
        - `chooseMaterial` -> `chooseSprite`
    - `SpecialBlockModelRenderer` 替换为 `BuiltInBlockModels`，不是一对一
        - `renderByBlock`->`BlockModelRenderState#submit*`，不是一对一
    - `SubmitNodeCollection`
        - `getBlockSubmits` 已删除
        - `getBreakingBlockModelSubmits`- 获取提交的破坏块覆盖。
    - `SubmitNodeCollector$ParticleGroupRenderer`
        - `isEmpty`- 该组中是否没有要渲染的粒子。
        - `prepare` 现在判断是否正在为半透明层准备粒子
        - `render` 不再采用半透明 `boolean`
    - `SubmitNodeStorage`
        - `$BlockModelSubmit` 现在采用 `BlockStateModelPart` 列表（而不是 `BlockStateModel`），以及 `int` 数组（色调颜色数组）而不是单个颜色的三个 `float`
        - `$BlockSubmit` 已删除
        - `$BreakingBlockModelSubmit`- 包含渲染块破坏覆盖的信息的记录。
        - `$ItemSubmit` 不再包含 `RenderType`
        - `$MovingBlockSubmit`、 `$NameTagSubmit`、 `$ShadowSubmit`、 `$TextSubmit` 现在采用 `Matrix4fc` 而不是 `Matrix4f` 来表示姿势
    - `VirtualScreen` 替换为 `GpuBackend`
- `net.minecraft.client.renderer.block`
    - `BlockAndTintGetter`- 用于位置块着色（例如生物群系）的吸气剂。
    - `BlockModelRenderState`- 块模型的渲染状态。
    - `BlockModelResolver`- 用于设置 `BlockState` 渲染状态的助手。
    - `BlockModelSet`- 保存与每个 `BlockState` 关联的 `BlockModel`。
    - `BlockModelShaper`->`BlockStateModelSet`，不是一对一
        - `getParticleIcon`->`getParticleMaterial`，现在返回 `Material$Baked` 而不是 `TextureAtlasSprite`
        - `getBlockModel` -> `get`
        - `getModelManager`、 `replaceCache` 已删除
    - `BlockQuadOutput`- 用于将烘焙的四边形信息写入某些输出（例如缓冲区）的功能接口。
    - `BlockRenderDispatcher` 类已删除
        - `getBlockModelShaper`->`getModelSet`，不是一对一
        - `renderBreakingTexture` 替换为 `SubmitNodeCollector#submitBreakingBlockModel`
        - `renderBatched` 替换为直接调用 `ModelBlockRenderer#tesselateBlock`
        - `renderLiquid` 替换为直接调用 `FluidRenderer#tesselate`
        - `renderSingleBlock` 现在内联在 `BlockFeatureRenderer#renderBlockModelSubmits`（一种 `private` 方法）中
            - 使用 `ModelBlockRenderer#tesselateBlock` 作为替代方案
    - `FluidModel`- 保存渲染器数据的基础流体模型。
    - `FluidStateModelSet`- 保存与每个 `Fluid` 关联的 `FluidModel`。
    - `LoadedBlockModels`- 为每个 `BlockState` 烘焙 `BlockModel` 的任务。
    - `LiquidBlockRenderer`->`FluidRenderer`，不是一对一
        - 构造函数现在采用 `FluidStateModelSet` 而不是 `SpriteGetter`
        - `tesselate` 现在采用 `FluidRenderer$Output` 而不是 `VertexConsumer`
        - `$Output`- 获取 `VertexConsumer` 以用于 `ChunkSectionLayer`。
    - `ModelBlockRenderer` 现在采用 `boolean` 进行环境遮挡和剔除
        - `tesselateBlock` 现在接受 `BlockQuadOutput` 而不是 `VertexConsumer`，XYZ`float`s 而不是 `PoseStack`，`BlockStateModel` 而不是 `BlockModelPart`s 的列表，不再接受剔除 `boolean` 和 `int` 叠加，并接收种子 `long`
        - `tesselateWithAO`->`tesselateAmbientOcclusion`，现在是 `private` 而不是 `public`
        - `tesselateWithoutAO`->`tesselateFlat`，现在是 `private` 而不是 `public`
        - `renderModel` 现在内联在 `BlockFeatureRenderer#renderBlockModelSubmits`（一种 `private` 方法）中
        - `forceOpaque`- 块纹理是否应该是不透明而不是半透明。
        - `enableCaching` -> `BlockModelLighter$Cache#enable`
        - `clearCache` -> `BlockModelLighter$Cache#disable`
        - `$AdjacencyInfo`->`BlockModelLighter$AdjacencyInfo`，现在是 `private` 而不是 `protected`
        - `$AmbientOcclusionRenderStorage` 替换为 `BlockModelLighter`，不是一对一
        - `$AmbientVertexRemap` -> `BlockModelLighter$AmbientVertexRemap`
        - `$Cache` -> `BlockModelLighter$Cache`
        - `$CommonRenderStorage` 替换为 `BlockModelLighter`，不是一对一
        - `$SizeInfo` -> `BlockModelLighter$SizeInfo`
    - `MovingBlockRenderState#level`->`cardinalLighting`,`lightEngine`;不是一对一的
    - `SelectBlockModel`- 由其解析属性确定或选择的块模型。
- `net.minecraft.client.renderer.block.model`
    - `BakedQuad` -> `.client.resources.model.geometry.BakedQuad`
        - 构造函数现在采用 `$MaterialInfo` 而不是 `TextureAtlasSprite`、 `int` 色调指数、 `int` 光发射和 `boolean` 阴影
        - `FLAG_TRANSLUCENT`- 标记烘焙四边形具有半透明度的标志。
        - `FLAG_ANIMATED`- 标记烘焙四边形具有动画纹理的标志。
        - `isTinted` -> `$MaterialInfo#isTinted`
        - `$MaterialFlags`- 标记给定整数是否定义材质标志的注释。
        - `$MaterialInfo`- 保存有关如何渲染四边形的信息的记录。
    - `BlockDisplayContext`- 表示块的显示上下文的对象。
    - `BlockElement` -> `.client.resources.model.cuboid.CuboidModelElement`
    - `BlockElementFace` -> `.client.resources.model.cuboid.CuboidFace`
    - `BlockElementRotation` -> `.client.resources.model.cuboid.CuboidRotation`
    - `BlockModel`- 更新渲染状态以在世界上下文之外使用的基本块模型。
        - 原来的实现已移至 `.client.resources.model.cuboid.CuboidModel`
    - `BlockModelDefinition` -> `.block.dispatch.BlockStateModelDispatcher`
    - `BlockModelPart` -> `.block.dispatch.BlockStateModelPart`
        - `particleIcon`->`particleMaterial`，现在返回 `Material$Baked` 而不是 `TextureAtlasSprite`
        - `materialFlags`- 处理模型使用的材质的标志。
    - `BlockStateModel` -> `.block.dispatch.BlockStateModel`
        - `particleIcon`->`particleMaterial`，现在返回 `Material$Baked` 而不是 `TextureAtlasSprite`
        - `materialFlags`、 `hasMaterialFlag`- 处理模型使用的材质的标志。
    - `BlockStateModelWrapper`- 包含模型、色调和变换的基本块模型。
    - `CompositeBlockModel`- 将多个块模型叠加在一起。
    - `ConditionalBlockModel`- 一个块模型，显示基于从某些属性获得的布尔值的不同模型。
    - `EmptyBlockModel`- 一个不显示任何内容的块模型。
    - `FaceBakery` -> `.client.resources.model.cuboid.FaceBakery`
        - `bakeQuad` 过载现在采用 `ModelBaker` 而不是 `ModelBaker$PartCache`，并采用 `Material$Baked` 而不是 `TextureAtlasSprite`
            - 它还有一个重载，采用 `BlockElementFace` 的字段而不是对象本身
        - 另一个 `bakedQuad`ovrload 现在采用 `BakedQuad$MaterialInfo` 而不是 `int` 色调指数和光发射，以及阴影 `boolean`
    - `ItemModelGenerator` -> `.client.resources.model.cuboid.ItemModelGenerator`
    - `ItemTransform` -> `.client.resources.model.cuboid.ItemTransform`
    - `ItemTransforms` -> `.client.resources.model.cuboid.ItemTransforms`
    - `SimpleModelWrapper` -> `.client.resources.model.SimpleModelWrapper`
        - 构造函数现在接受粒子的 `Material$Baked` 而不是 `TextureAtlasSprite`
    - `SimpleUnbakedGeometry` -> `.client.resources.model.cuboid.UnbakedCuboidGeometry`
    - `SingleVariant` -> `.block.dispatch.SingleVariant`
    - `SpecialBlockModelWrapper`- 通过 `SpecialModelRenderer` 提交元素的模型的块模型。
    - `TextureSlots` -> `.client.resources.model.sprite.TextureSlots`
    - `Variant` -> `.block.dispatch.Variant`
    - `VariantMutator` -> `.block.dispatch.VariantMutator`
    - `VariantSelector` -> `.block.dispatch.VariantSelector`
- `net.minecraft.client.renderer.block.model.multipart.*` -> `.block.dispatch.multipart.*`
- `net.minecraft.client.renderer.block.model.properties.conditional`
    - `ConditionalBlockModelProperty`- 从 `BlockState` 计算一些 `boolean` 的属性。
    - `IsXmas`- 返回当前时间是否在 12 月 24 日至 26 日之间。
- `net.minecraft.client.renderer.block.model.properties.select`
    - `DisplayContext`- 基于当前 `BlockDisplayContext` 的案例。
    - `SelectBlockModelProperty`- 从 `BlockState` 计算某些开关状态的属性。
- `net.minecraft.client.renderer.blockentity`
    - `AbstractEndPortalRenderer`
        - `renderCube`->`submitCube`，现在来自 `private` 的 `protected` 和 `static`
        - `submitSpecial`- 提交最终传送门立方体，由特殊渲染器使用。
        - `getExtents`- 获取每个面的顶点。
        - `getOffsetUp`、 `getOffsetDown` 已删除
        - `renderType` 已删除
    - `AbstractSignRenderer` 现在采用 `SignRenderState` 的通用名称
        - `getSignModel` 现在采用 `SignRenderState` 通用名称，而不是 `BlockState` 和 `WoodType`
        - `getSignModelRenderScale`、 `getSignTextRenderScale`、 `getTextOffset`、 `translateSign` 替换为 `SignRenderState#transformations`、 `SignRenderState$SignTransformations`
        - `getSignMaterial` -> `getSignSprite`
    - `BannerRenderer`
        - `TRANSFORMATIONS`- 在墙壁或地面上应用的变换。
        - `submitPatterns` 不再考虑底座 `SpriteId`、图案是否有箔、轮廓颜色
        - `submitSpecial` 现在包含 `BannerBlock$AttachmentType`
    - `BedRenderer`
        - `submitSpecial` 已删除
            - 这可以通过调用 `submitPiece` 两次来代替，或者通过 `BedSpecialRenderer` 为每个床部件制作复合材料
        - `submitPiece` 现在从 `private` 变为 `public`，采用 `BedPart` 而不是 `Model$Simple`、 `Direction` 或 `boolean` 是否在 Z 方向平移
        - `getExtents` 现在包含 `BedPart`
        - `modelTransform`- 获取给定 `Direction` 的转换。
    - `BlockEntityRenderDispatcher` 现在采用 `BlockModelResolver` 而不是 `BlockRenderDispatcher`，并且不再采用 `ItemRenderer`
        - `prepare` 现在采用 `Vec3` 相机位置，而不是 `Camera` 本身
    - `BlockEntityRendererProvider$Context` 现在采用 `BlockModelResolver` 而不是 `BlockRenderDispatcher`，并且不再采用 `ItemRenderer`
        - `materials` -> `sprites`
    - `ChestRenderer`
        - `LAYERS`- 容纳胸部的模型层。
        - `modelTransformation`- 获取给定 `Direction` 的转换。
    - `ConduitRenderer#DEFAULT_TRANSFORMATION`- 要应用的默认转换。
    - `CopperGolemStatueBlockRenderer#modelTransformation`- 获取给定 `Direction` 的转换。
    - `DecoratedPotRenderer#modelTransformation`- 获取给定 `Direction` 的转换。
    - `HangingSignRenderer` 现在使用 `HangingSignRenderState`
        - `MODEL_RENDER_SCALE` 现在从 `public` 变为 `private`
        - `TRANSFORMATIONS`- 在墙壁或地面上应用的变换。
        - `translateBase`->`baseTransformation`，现在从 `public` 变为 `private`
        - `$AttachmentType` -> `HangingSignBlock$Attachment`
            - `byBlockState` -> `$Models#get`
        - `$ModelKey` 记录已删除
    - `ShulkerBoxRenderer`
        - `modelTransform`- 获取给定 `Direction` 的转换。
        - `getExtents` 不再包含 `Direction`
    - `SignRenderer` -> `StandingSignRenderer`
        - `TRANSFORMATIONS`- 在墙壁或地面上应用的变换。
        - `createSignModel` 现在采用 `PlainSignBlock$Attachment` 而不是 `boolean` 来判断块是否站立
    - `SkullBlockRenderer`
        - `TRANSFORMATIONS`- 在墙壁或地面上应用的变换。
        - `submitSkull` 不再参与 `Direction` 或 `float` 旋转
    - `WallAndGroundTransformations`- 一个类，包含要变换的 `Direction` 映射以应用于墙壁，以及用于计算地面变换的 `int` 函数，其中 `int` 段通常充当旋转状态的数量。
- `net.minecraft.client.renderer.blockentity.state`
    - `BannerRenderState`
        - `angle`->`transformation`，不是一对一
        - `standing`->`attachmentType`，不是一对一
    - `BedRenderState#isHead`->`part`，不是一对一
    - `BlockEntityRenderState#blockState` 现在从 `public` 变为 `private`
    - `ChestRenderState#angle`->`facing`，不是一对一
    - `CondiutRenderState` -> `ConduitRenderState`
    - `CopperGolemStatueRenderState#oxidationState`- 当前氧化态。
    - `HangingSignRenderState`- 悬挂标志的渲染状态。
    - `ShelfRenderState#facing`- 架子面向的方向。
    - `SignRenderState#woodType`- 标志制成的木材类型。
    - `SkullblockRenderState#direction`、 `rotationDegrees`->`transformation`，不是一对一
    - `StandingSignRenderState`- 站立标志的渲染状态。
- `net.minecraft.client.renderer.chunk`
    - `ChunkSectionLayer` 现在采用 `boolean` 来判断图层是否半透明，而不仅仅是在上传时排序
        - `byTransparency`- 通过透明度设置获取图层。
        - `sortOnUpload`->`translucent`，不是一对一
        - `vertexFormat`- 该层使用的管道的顶点格式。
    - `ChunkSectionsToRender#drawsPerLayer`->`drawGroupsPerLayer`，其值为 `int` 到抽奖地图列表
    - `CompiledSectionMesh`
        - `uploadMeshLayer` 替换为 `isVertexBufferUploaded`、 `setVertexBufferUploaded`
        - `uploadLayerIndexBuffer` 替换为 `isIndexBufferUploaded`、 `setIndexBufferUploaded`
    - `RenderRegionCache#createRegion` 现在采用 `ClientLevel` 而不是 `Level`
    - `SectionBuffers`->`SectionRenderDispatcher$RenderSectionBufferSlice`，不是一对一
    - `SectionCompiler` 现在采用 `boolean` 进行环境遮挡和剪切叶子、 `BlockStateModelSet`、 `FluidStateModelSet` 和 `BlockColors`，而不是 `BlockRenderDispatcher`
    - `SectionMesh`
        - `getBuffers`->`getSectionDraw`，不是一对一
        - `$SectionDraw`- 该部分的绘制信息。
    - `SectionRenderDispatcher` 现在采用 `SectionCompiler` 而不是 `BlockRenderDispatcher` 和 `BlockEntityRenderDispatcher`
        - `getRenderSectionSlice`- 获取要为块层渲染的剖面网格的缓冲区切片。
        - `uploadAllPendingUploads`->`uploadGlobalGeomBuffersToGPU`，不是一对一
        - `lock`、 `unlock`- 将数据从一个位置复制到另一个位置时处理锁定调度程序（通常用于 GPU 分配）。
        - `getToUpload` 已删除
        - `setLevel` 现在包含 `SectionCompiler`
        - `$RenderSection`
            - `upload`、 `uploadSectionIndexBuffer`->`addSectionBuffersToUberBuffer`，现已私有
            - `$CompileTask`
                - `doTask` 现在返回 `$SectionTaskResult` 而不是 `CompletableFuture`
        - `$SectionTaskResult` -> `$RenderSection$CompileTask$SectionTaskResult`
- `net.minecraft.client.renderer.culling.Frustum` 现在在模型视图中采用 `Matrix4fc` 而不是 `Matrix4f`
    - `set`- 从另一个视锥体复制信息。
- `net.minecraft.client.renderer.entity`
    - `AbstractBoatRenderer` 现在采用 `Identifier` 纹理
        - `renderType` 已删除
    - `AbstractMinecartRenderer`
        - `BLOCK_DISPLAY_CONTEXT`- 如何在矿车内显示块的上下文。
        - `submitMinecartContents` 现在采用 `BlockModelRenderState` 而不是 `BlockState`
    - `CopperGolemRenderer#BLOCK_DISPLAY_CONTEXT`- 如何显示天线块的上下文。
    - `DisplayRenderer`
        - `BLOCK_DISPLAY_CONTEXT`- 如何显示所显示块的上下文。
        - `blockModelResolver`- 块模型解析器。
    - `EndermanRenderer#BLOCK_DISPLAY_CONTEXT`- 如何显示持有块的上下文。
    - `EntityRenderDispatcher` 现在采用 `BlockModelResolver` 而不是 `BlockRenderDispatcher`
    - `EntityRenderer#submitNameTag`->`submitNameDisplay`，现在可以选择将 y 位置 `int` 作为距名称标签附件的偏移量
    - `EntityRendererProvider$Context` 现在采用 `BlockModelResolver` 而不是 `BlockRenderDispatcher`
        - `getMaterials` -> `getSprites`
        - `getBlockRenderDispatcher` 替换为 `getBlockModelResolver`
    - `IronGolemRenderer#BLOCK_DISPLAY_CONTEXT`- 如何显示持有块的上下文。
    - `ItemFrameRenderer#BLOCK_DISPLAY_CONTEXT`- 如何显示所显示块的上下文。
    - `ItemRenderer` 类已删除
        - 使用 `ItemStackRenderState` 将元素提交到功能调度程序
        - `ENCHANTED_GLINT_ARMOR` -> `ItemFeatureRenderer#ENCHANTED_GLINT_ARMOR`
        - `ENCHANTED_GLINT_ITEM` -> `ItemFeatureRenderer#ENCHANTED_GLINT_ITEM`
        - `NO_TINT` -> `ItemFeatureRenderer#NO_TINT`
        - `getFoilBuffer` -> `ItemFeatureRenderer#getFoilBuffer`
        - `getFoilRenderType`->`ItemFeatureRenderer#getFoilRenderType`，现在从 `private` 变为 `public`
    - `MushroomCowRenderer#BLOCK_DISPLAY_CONTEXT`- 如何显示附加块的上下文。
    - `SnowGolemRenderer#BLOCK_DISPLAY_CONTEXT`- 如何显示头部块的上下文。
    - `TntRenderer#BLOCK_DISPLAY_CONTEXT`- 如何显示 TNT 块的上下文。
    - `TntMinecartRenderer#submitWhiteSolidBlock` 现在采用 `BlockModelRenderState` 而不是 `BlockState`
- `net.minecraft.client.renderer.entity.layers`
    - `BlockDecorationLayer` 现在接受一个返回 `BlockModelRenderState` 而不是可选 `BlockState` 的函数
    - `MushroomCowMushroomLayer` 不再包含 `BlockRenderDispatcher`
    - `SnowGolemHeadLayer` 不再包含 `BlockRenderDispatcher`
- `net.minecraft.client.renderer.entity.state`
    - `AvatarRenderState#scoreText` -> `EntityRenderState#scoreText`
    - `BlockDisplayEntityRenderState#blockRenderState`->`blockModel`，现在是 `BlockModelRenderState` 而不是 `BlockRenderState`
    - `CopperGolemRenderState#blockOnAntenna` 现在是 `BlockModelRenderState`，而不是可选的 `BlockState`
    - `EndermanRenderState#carriedBlock` 现在是 `BlockModelRenderState` 而不是可为 null 的 `BlockState`
    - `IronGolemRenderState#flowerBlock`- 铁傀儡持有的花朵。
    - `ItemFrameRenderState#frameModel`- 物品展示框块的模型。
    - `MinecartRenderState#displayBlockState`->`displayBlockModel`，现在是 `BlockModelRenderState` 而不是 `BlockState`
    - `MushroomCowRenderState#mushroomModel`- 牛身上的蘑菇模型。
    - `SnowGolemRenderState#hasPumpkin`->`headBlock`，现在是 `BlockModelRenderState` 而不是 `boolean`
    - `TntRenderState#blockState` 现在是 `BlockModelRenderState` 而不是可为 null 的 `BlockState`
- `net.minecraft.client.renderer.features`
    - 功能 `render` 方法已分为用于实体渲染类型的 `renderSolid` 和用于透视渲染类型的 `renderTranslucent`
    - 一些 `render*` 方法现在采用 `OptionsRenderState`
    - `BlockFeatureRenderer`
        - `renderSolid` 现在采用 `BlockStateModelSet` 而不是 `BlockRenderDispatcher`
        - `renderTranslucent` 现在接收 `BlockStateModelSet` 和摇摇欲坠的 `MultiBufferSource$BufferSource`，而不是 `BlockRenderDispatcher`
    - `FeatureRenderDispatcher` 现在包含 `GameRenderState` 和 `ModelManager`
        - `renderAllFeatures` 已拆分为 `renderSolidFeatures` 和 `renderTranslucentFeatures`
            - 原来的方法现在调用这两个方法，先是固体，然后是半透明
        - `clearSubmitNodes`- 清除提交节点存储。
        - `renderTranslucentParticles`- 渲染收集的半透明粒子。
    - `FlameFeatureRenderer#render` -> `renderSolid`
    - `LeashFeatureRenderer#render` -> `renderSolid`
    - `NameTagFeatureRenderer#render` -> `renderTranslucent`
    - `ShadowFeatureRenderer#render` -> `renderTranslucent`
    - `TextFeatureRenderer#render` -> `renderTranslucent`
- `net.minecraft.client.renderer.fog`
    - `FogData#color`- 雾的颜色。
    - `FogRenderer`
        - `setupFog` 现在返回 `FogData` 而不是 `Vector4f` 雾颜色
        - `updateBuffer`- 使用雾数据更新缓冲区。
- `net.minecraft.client.renderer.gizmos.DrawableGizmoPrimitives#render` 现在在模型视图中采用 `Matrix4fc` 而不是 `Matrix4f`
- `net.minecraft.client.renderer.item`
    - `BlockModelWrapper` -> `CuboidItemModelWrapper`
        - 构造函数不再接受 `RenderType` 函数，现在接受 `Matrix4fc` 转换
        - `$Unbaked` 现在采用可选的 `Transformation`
    - `CompositeModel$Unbaked` 现在采用可选的 `Transformation`
    - `ConiditionalItemModel$Unbaked` 现在采用可选的 `Transformation`
    - `ItemModel`
        - `$BakingContext`
            - `materials` -> `sprites`
            - `missingItem`- 使用给定的 `Matrix4fc` 转换获取缺失的物品模型。
        - `$Unbaked#bake` 现在接受来自任何父客户端物品的 `Matrix4fc` 转换
    - `ItemStackRenderState`
        - `pickParticleIcon`->`pickParticleMaterial`，现在返回 `Material$Baked` 而不是 `TextureAtlasSprite`
        - `$LayerRenderState`
            - `EMPTY_TINTS`-`int` 数组表示没有要应用的色调。
            - `setRenderType` 已删除
            - `setParticleIcon`->`setParticleMaterial`，现在采用 `Material$Baked` 而不是 `TextureAtlasSprite`
            - `setTransform` -> `setItemTransform`
            - `setLocalTransform`- 设置物品显示转换后应用的客户端物品转换。
            - `prepareTintLayers`->`tintLayers`，不是一对一
    - `MissingItemModel#withTransform`- 使用给定的变换获取缺失的物品模型。
    - `ModelRenderProperties#particleIcon`->`particleMaterial`，现在采用 `Material$Baked` 而不是 `TextureAtlasSprite`
    - `RangeSelectItemModel$Unbaked` 现在采用可选的 `Transformation`
    - `SelectItemModel`
        - `$ModelSelector#get` 不再支持可为 null 的 `ItemModel`。
        - `$Unbaked` 现在采用可选的 `Transformation`
        - `$UnbakedSwitch#bake` 现在进行 `Matrix4fc` 改造
    - `SpecialModelWrapper` 现在进行 `Matrix4fc` 改造
        - `$Unbaked` 现在采用可选的 `Transformation`
- `net.minecraft.client.renderer.rendertype`
    - `RenderType#outputTarget`- 获取输出目标。
    - `RenderTypes`
        - `MOVING_BLOCK_SAMPLER` 替换为 `createMovingBlockSetup`，现在为 `private`
        - `entityCutoutNoCull` -> `entityCutout`
            - 原来带有剔除的切口被替换为 `entityCutoutCull`
        - `entityCutoutNoCullZOffset` -> `entityCutoutZOffset`
        - `entitySmoothCutout` -> `endCrystalBeam`
        - `entityNoOutline`->`entityTranslucent` 与 `affectsOutline` 为 `false`
        - `entityDecal`、 `dragonExplosionAlpha`->`entityCutoutDissolve`，不是一对一
        - `itemEntityTranslucentCull`->`entityTranslucentCullItemTarget`、 `itemCutout`、 `itemTranslucent`；不是一对一的
        - `bannerPattern`- 用于渲染横幅图案的渲染类型。
- `net.minecraft.client.renderer.special`
    - `BannerSpecialRenderer`、 `$Unbaked` 现在采用 `BannerBlock$AttachmentType`
        - `$Unbaked` 现在使用 `BannerPatternLayers` 作为通用
    - `BedSpecialRenderer`、 `$Unbaked` 现在采用 `BedPart`
        - `$Unbaked` 现在实现 `NoDataSpecialModelRenderer$Unbaked`
    - `BellSpecialRenderer`- 铃声的特殊渲染器。
    - `BookSpecialRenderer`- 附魔台上的书的特殊渲染器。
    - `ChestSpecialRenderer$Unbaked` 现在实现 `NoDataSpecialModelRenderer$Unbaked`
        - 构造函数现在接受 `ChestType`
        - `*_CHEST_TEXTURE` 已从字段名称中删除，现在为 `MultiBlockChestResources`
        - `ENDER_CHEST_TEXTURE` -> `ENDER_CHEST`
    - `ConduitSpecialRenderer$Unbaked` 现在实现 `NoDataSpecialModelRenderer$Unbaked`
    - `CopperGolemStatueSpecialRenderer$Unbaked` 现在实现 `NoDataSpecialModelRenderer$Unbaked`
    - `DecoratedPotSpecialRenderer$Unbaked` 现在使用 `PotDecorations` 作为通用
    - `EndCubeSpecialRenderer`- 末地传送门立方体的特殊渲染器。
    - `HangingSignSpecialRenderer$Unbaked` 现在实现 `NoDataSpecialModelRenderer$Unbaked`
        - 构造函数现在接受 `HangingSignBlock$Attachment`
    - `NoDataSpecialModelRenderer`
        - `submit` 不再包含 `ItemDisplayContext`
        - `$Unbaked`- 用于特殊模型渲染器的未烘焙渲染器，不需要提取数据。
    - `PlayerHeadSpecialRenderer$Unbaked` 现在使用 `PlayerSkinRenderCache$RenderInfo` 作为通用
    - `ShieldSpecialRenderer`
        - `DEFAULT_TRANSFORMATION`- 要应用的默认转换。
        - `$Unbaked` 现在使用 `DataComponentMap` 作为通用
    - `ShulkerBoxSpecialRenderer`、 `$Unbaked` 不再采用 `Direction` 方向
        - `$Unbaked` 现在实现 `NoDataSpecialModelRenderer$Unbaked`
    - `SkullSpecialRenderer$Unbaked` 现在实现 `NoDataSpecialModelRenderer$Unbaked`
    - `SpecialModelRenderer`
        - `submit` 不再包含 `ItemDisplayContext`
        - `$BakingContext`
            - `materials` -> `sprites`
            - `$Simple` 替换为 `BlockModel$BakingContext`、 `ItemModel$BakingContext`
                - `materials` -> `sprites`
        - `$Unbaked` 现在具有从表示对象中提取的参数的通用属性
    - `SpecialModelRenderers#createBlockRenderers`->`BuiltInBlockModels#createBlockModels`，不是一对一
    - `StandingSignSpecialRenderer$Unbaked` 现在实现 `NoDataSpecialModelRenderer$Unbaked`
        - 构造函数现在接受 `PlainSignBlock$Attachment`
    - `TridentSpecialRenderer`
        - `DEFAULT_TRANSFORMATION`- 要应用的默认转换。
        - `$Unbaked` 现在实现 `NoDataSpecialModelRenderer$Unbaked`
- `net.minecraft.client.renderer.state.*` -> `.state.level.*`
- `net.minecraft.client.renderer.state`
    - `GameRenderState`- 游戏的渲染状态。
    - `OptionsRenderState`- 客户端用户选项的渲染状态。
    - `WindowRenderState`- 游戏窗口的渲染状态。
- `net.minecraft.client.renderer.state.gui.GuiRenderState#submit*` 方法已重命名为 `add*`
- `net.minecraft.client.renderer.state.level`
    - `BlockBreakingRenderState` 现已成为记录，不再延长 `MovingBlockRenderState`
        - 构造函数接收 `BlockPos`、 `BlockState` 和当前 `int` 进度
    - `CameraEntityRenderState`- 相机实体的渲染状态。
    - `CameraRenderState`
        - `xRot`、 `yRot`- 相机的旋转。
        - `entityPos` 已删除
        - `isPanoramicMode`- 相机是否处于全景模式。
        - `cullFrustum`- 剔除平截头体。
        - `fogType`、 `fogData`- 雾元数据。
        - `hudFov`- HUD 视野。
        - `depthFar`- 深度 Z 远平面。
        - `projectionMatrix`、 `viewRotationMatrix`- 从世界空间移动到屏幕空间的矩阵。
        - `entityRenderState`- 相机所连接的实体。
    - `LevelRenderState`
        - `lastEntityRenderStateCount`- 渲染到屏幕上的实体数量。
        - `cloudColor`、 `cloudHeight`- 云元数据。
    - `LightmapRenderState`- 光照贴图的渲染状态。
- `net.minecraft.client.renderer.texture`
    - `MipmapGenerator#generateMipLevels` 现在接受图像的计算 `Transparency`
    - `SpriteContents`
        - `transparency`- 获取精灵的透明度。
        - `getUniqueFrames` 现在返回 `IntList` 而不是 `IntStream`
        - `computeTransparency`- 计算选定 UV 边界的透明度。
        - `$AnimatedTexture#getUniqueFrames` 现在返回 `IntList` 而不是 `IntStream`
    - `TextureAtlasSprite#transparency`- 获取精灵的透明度。
- `net.minecraft.client.resources.model`
    - `AtlasManager` -> `.model.sprite.AtlasManager`
    - `BlockModelRotation` -> `.client.renderer.block.dispatch.BlockModelRotation`
    - `Material`->`.model.sprite.SpriteId`，不是一对一
    - `MaterialSet` -> `.model.sprite.SpriteGetter`
    - `MissingBlockModel` -> `.model.cuboid.MissingCuboidModel`
    - `ModelBaker`
        - `sprites` -> `materials`
        - `parts` -> `interner`
        - `$PartCache` -> `$Interner`
            - `vector(float, float, float)` 已删除
            - `materialInfo`- 获取内部材质信息对象。
    - `ModelBakery`
        - `BANNER_BASE` -> `Sheets#BANNER_BASE`
        - `SHIELD_BASE` -> `Sheets#SHIELD_BASE`
        - `NO_PATTERN_SHIELD` -> `Sheets#SHIELD_BASE_NO_PATTERN`
        - `LAVA_*`->`FluidStateModelSet#LAVA_MODEL`，现在从 `public` 变为 `private`
        - `WATER_*`->`FluidStateModelSet#WATER_MODEL`，现在从 `public` 变为 `private`
        - `$BakingResult#getBlockStateModel`- 从 `BlockState` 获取 `BlockStateModel`。
        - `$MissingModels` 现在采用 `MissingItemModel` 而不是 `Item` 的 `ItemModel` 和 `FluidModel`
    - `ModelManager`
        - `BLOCK_OR_ITEM` 已删除
        - `getMissingBlockStateModel` -> `BlockStateModelSet#missingModel`
        - `getBlockModelShaper`->`getBlockStateModelSet`，不是一对一
        - `getBlockModelSet`- 获取 `BlockState` 到块模型的地图。
        - `specialBlockModelRenderer` 已删除
        - `getFluidStateModelSet`- 获取 `Fluid` 到流体模型的贴图。
    - `ModelState` -> `.client.renderer.block.dispatch.ModelState`
    - `QuadCollection` -> `.model.geometry.QuadCollection`
        - `addAll`- 添加另一个四元集合中的所有元素。
        - `materialFlags`、 `hasMaterialFlag`- 处理模型使用的材质的标志。
    - `ResolvedModel#resolveParticleSprite`->`resolveParticleMaterial`，现在返回 `Material$Baked` 而不是 `TextureAtlasSprite`
    - `SpriteGetter` -> `.model.sprite.MaterialBaker`
    - `UnbakedGeometry` -> `.model.geometry.UnbakedGeometry`
    - `WeightedVariants` -> `.client.renderer.block.dispatch.WeightedVariants`
- `net.minecraft.client.resources.model.sprite.Material`- 对纹理精灵的引用，以及是否强制纹理半透明。
- `net.minecraft.world.entity.animal.Animal#isBrightEnoughToSpawn` 现在采用 `BlockAndLightGetter` 而不是 `BlockAndTintGetter`
- `net.minecraft.world.level`
    - `BlockAndTintGetter` -> `BlockAndLightGetter`
        - `BlockAndTintGetter` 现在仅是客户端，实施 `BlockAndLightGetter`
        - `getShade`->`cardinalLighting`;不是一对一的
        - `getBlockTint` -> `BlockAndTintGetter#getBlockTint`
    - `CardinalLighting`- 保持每个方向应用的照明。
    - `EmptyBlockAndTintGetter` -> `BlockAndTintGetter#EMPTY`
    - `LevelReader` 现在实现 `BlockAndLightGetter` 而不是 `BlockAndTintGetter`
- `net.minecraft.world.level.block`
    - `BannerBlock$AttachmentType`- 横幅附加到另一个块的位置。
    - `CeilingHangingSignBlock` 现在实现 `HangingSignBlock`
        - `getAttachmentPoint`- 获取标志附加到另一个块的位置。
    - `HangingSignBlock`- 定义附加到另一个块的悬挂标志的接口。
    - `PlainSignBlock`- 定义附加到另一个块的普通符号的接口。
    - `StandingSignBlock` 现在实现 `PlainSignBlock`
    - `WallingHangingSignBlock` 现在实现 `HangingSignBlock`
    - `WallSignBlock` 现在实现 `PlainSignBlock`
- `net.minecraft.world.level.block.state.BlockBehaviour#getLightBlock`, `$BlockStateBase#getLightBlock` -> `getLightDampening`
- `net.minecraft.world.level.block.state.properties`
    - `BedPart#CODEC`- 床部分的 Codec。
    - `ChestType#CODEC`- 胸部类型的 Codec。
- `net.minecraft.world.level.dimension.DimensionType$CardinalLightType` -> `CardinalLighting$Type`

## 次要迁移 {#minor-migrations}

以下是有用或有趣的添加、更改和删除的列表，这些内容不值得在初级读物中占据单独的部分。

### 可种植标签 {#plantable-tags}

确定可种植物是否可以存活或放置的方块已移至方块和流体标签。每个标签都以 `support_*` 以及块（例如，`bamboo`、 `cactus`）或组（例如，`crops`、 `dry_vegetation`）开头。这是由覆盖 `Block#canSurvive` 或植被 `VegetationBlock#mayPlaceOn` 的相关块子类处理的。

- `net.minecraft.world.level.block`
    - `AttachedStemBlock` 现在采用 `TagKey` 作为它可以放置的块
    - `FarmBlock` -> `FarmlandBlock`
    - `FungusBlock`->`NetherFungusBlock`，不是一对一
    - `RootsBlock`->`NetherRootsBlock`，不是一对一
    - `WaterlilyBlock`->`LilyPadBlock`，不是一对一
    - `StemBlock` 现在采用 `TagKey` 作为它可以放置在其上的方块，并采用 `TagKey` 作为其水果可以放置在其上的方块

### 容器屏幕更改 {#container-screen-changes}

`AbstractContainerScreen`s 的用法略有变化，需要进行一些细微的更改。首先 `imageWidth` 和 `imageHeight` 现在是最终的，可在构造函数中设置为参数。如果这两个没有指定，则默认为原始的 176 x 166 背景图像。

```java
// Assume some AbstractContainerMenu subclass exists
public class ExampleContainerScreen extends AbstractContainerScreen<ExampleContainerMenu> {

    // Constructor
    public ExampleContainerScreen(ExampleContainerMenu menu, Inventory playerInventory, Component title) {
        // Specify image width and height as the last two parameters in the constructor
        super(menu, playerInventory, title, 256, 256);
    }
}
```

此外，`AbstractContainerScreen#render` 重写现在在调用堆栈末尾调用 `renderTooltip`。这意味着，在大多数情况下，你不应覆盖 `AbstractContainerScreen` 子类型中的 `render`。一切都可以通过该类提供的其他方法之一来完成。

- `net.minecraft.client.gui.screens.inventory.AbstractContainerScreen` 现在可以选择接受背景图像的宽度和高度
    - `imageWidth`、 `imageHeight` 现已最终确定
    - `DEFAULT_IMAGE_WIDTH`、 `DEFAULT_IMAGE_HEIGHT`- 容器背景图像的默认宽度和高度。
    - `slotClicked` 现在采用的是 `ContainerInput` 而不是 `ClickType`
    - `render` 覆盖现在默认调用 `renderTooltip`
- `net.minecraft.world.inventory`
    - `AbstractContainerMenu#clicked` 现在采用 `ContainerInput` 而不是 `ClickType`
    - `ClickType` -> `ContainerInput`

### 新标签提供商 {#new-tag-providers}

添加了新的 `TagsProvider`，它提供了用于使用 `Holder$Reference`（称为 `HolderTagProvider`）的实用程序。仅由 `PotionTagsProvider` 使用。

此外，`TagBuilder` 现在提供了一种在标签上设置 `replace` 字段的方法，该方法会在反序列化期间删除所有先前读取的条目。

- `net.minecraft.data.tags`
    - `FeatureTagsProvider`-`ConfiguredFeature` 的标签提供商。
    - `HolderTagProvider`- 标签提供者，具有用于通过参考持有者附加标签的实用程序。
    - `KeyTagProvider#tag` 现在具有是否替换标记中的条目的重载。
    - `PotionTagsProvider`- 药水标签提供商。
    - `TradeRebalanceTradeTagsProvider`- 用于贸易再平衡的村民贸易标签提供商。
    - `VillagerTradesTagsProvider`- 村民贸易标签提供商。
- `net.minecraft.tags`
    - `FeatureTags`-`ConfiguredFeature` 的标签。
    - `TagBuilder#shouldReplace`、 `setReplace`- 处理 `replace` 字段，该字段在反序列化期间删除所有先前读取的条目。

### 测试环境状态跟踪 {#test-environment-state-tracking}

`TestEnvironmentDefinition`s 现在可以在创建时跟踪世界的原始状态，以便在运行时可以正确恢复。这是通过称为“SavedDataType”的泛型来完成的。在 `setup` 上，每个环境都会返回表示修改内容的原始状态的通用数据。然后，在 `teardown` 上，原始状态将恢复到下一个测试用例的级别。

```java
// The generic should represent the original data stored on the level
public record RespawnEnvironment(LevelData.RespawnData respawn) implements TestEnvironmentDefinition<LevelData.RespawnData> {

    @Override
    public LevelData.RespawnData setup(ServerLevel level) {
        // Modify the level while logging the original state.
        var original = level.getRespawnData();
        level.setRespawnData(this.respawn);

        // Return the original state.
        return original;
    }

    @Override
    public void teardown(ServerLevel level, LevelData.RespawnData original) {
        // Reset the state of the level to the original values.
        level.setRespawnData(original);
    }

    @Override
    public MapCodec<RespawnEnvironment> codec() {
        // Return the registered MapCodec here.
        // ...
    }
}
```

- `net.minecraft.gametest.framework.TestEnvironmentDefinition` 现在有一个泛型，表示测试环境执行的给定修改的原始状态
    - `setup` 现在返回表示原始状态的通用值
    - `teardown` 不再默认，取原来状态恢复
    - `activate`、 `$Activation`- 处理活动测试环境。

### 类型化实例 {#typed-instance}

`TypedInstance` 是一个附加到某些对象的接口，这些对象表示某些其他“类型”对象的实例。例如，`Entity` 是 `EntityType` 的类型化实例，或者 `BlockState` 是 `Block` 的类型化实例。该接口是一种标准方法，用于提供对类型 `Holder` 的访问，并通过 `is` 检查支持类型以及实例是否相当于某些标识符、标签或原始对象。

```java
// For some Entity entity, check the EntityType
entity.is(EntityType.PLAYER);

// For some ItemStack itemStack, check the Item
itemStack.is(ItemTags.BUTTONS);

// For some BlockEntity blockEntity, check the BlockEntityType
blockEntity.is(BlockEntityType.CHEST);

// For some BlockState blockState, check the Block
blockState.is(Blocks.DIRT);

// For some FluidState fluidState, check the Fluid
fluidState.is(FluidTags.WATER);
```

- `net.minecraft.core.TypedInstance`- 一个接口，表示该对象是某些其他“类型”对象的实例。
- `net.minecraft.world.entity`
    - `Entity` 现在实现 `TypedInstance<EntityType<?>>`
    - `EntityType#is` -> `TypedInstance#is`
        - 现在在 `Entity` 实例上
- `net.minecraft.world.item.ItemStack` 现在实现 `TypedInstance<Item>`
    - `getItemHolder` -> `typeHolder`
    - `getTags` -> `tags`
- `net.minecraft.world.level.block.entity`
    - `BlockEntity` 现在实现 `TypedInstance<BlockEntityType>`
    - `BlockEntityType#getKey` 已删除
- `net.minecraft.world.level.block.state.BlockBehaviour$BlockStateBase` 现在实现 `TypedInstance<Block>`
    - `getBlockHolder` -> `typeHolder`
    - `getTags` -> `tags`
- `net.minecraft.world.level.material.FluidState` 现在实现 `TypedInstance<Fluid>`
    - `holder` -> `typeHolder`
    - `getTags` -> `tags`

### 实体纹理和成人/婴儿模型 {#entity-textures-and-adultbaby-models}

`assets/minecraft/textures/entity/*` 中的实体纹理现已分类到子目录中（例如，`entity/panda` 用于熊猫纹理，或 `entity/pig` 用于猪纹理）。大多数纹理都以实体类型开头，后跟下划线及其变体进行命名（例如，`arrow_tipped` 表示尖箭头，`pig_cold` 表示冷猪变体，或 `panda_brown` 表示棕色熊猫变体）。

此外，一些动物模型已分为婴儿和成人两种不同的类别。这些模型直接扩展抽象模型实现（例如，`AbstractFelineModel`）或原始模型类（例如，`PigModel`）。

- `net.minecraft.client.animation.definitions`
    - `BabyArmadilloAnimation`- 小犰狳的动画。
    - `BabyAxolotlAnimation`- 小蝾螈的动画。
    - `BabyRabbitAnimation`- 小兔子的动画。
    - `CamelBabyAnimation`- 小骆驼的动画。
    - `FoxBabyAnimation`- 小狐狸的动画。
    - `RabbitAnimation`- 兔子的动画。
- `net.minecraft.client.model`
    - `HumanoidModel`
        - `ADULT_ARMOR_PARTS_PER_SLOT`、 `BABY_ARMOR_PARTS_PER_SLOT`- 设备插槽到模型零件密钥的映射。
        - `createBabyArmorMeshSet`- 为婴儿人形生物创建盔甲模型组。
        - `createArmorMeshSet` 现在可以采用设备槽位图来对要保留的零件密钥进行建模
        - `setAllVisible` 已删除
    - `QuadrupedModel` 现在有一个构造函数，它接受 `RenderType` 的函数
- `net.minecraft.client.model.animal.armadillo`
    - `AdultArmadilloModel`- 成年犰狳的实体模型。
    - `ArmadilloModel` 现在是抽象的
        - 构造函数现在接受行走、滚出/向上和窥视动画的定义
        - `BABY_TRANSFORMER` 已直接合并到 `BabyArmadilloModel` 的图层定义中
        - `HEAD_CUBE`、 `RIGHT_EAR_CUBE`、 `LEFT_EAR_CUBE` 现在是 `protected`，而不是 `private`
        - `createBodyLayer` -> `AdultArmadilloModel#createBodyLayer`, `BabyArmadilloModel#createBodyLayer`
    - `BabyArmadilloModel`- 小犰狳的实体模型。
- `net.minecraft.client.model.animal.axolotl.AxolotlModel` -> `AdultAxolotlModel`, `BabyAxolotlModel`
- `net.minecraft.client.model.animal.bee`
    - `AdultBeeModel`- 成年蜜蜂的实体模型。
    - `BabyBeeModel`- 小蜜蜂的实体模型。
    - `BeeModel` 现在是抽象的
        - `BABY_TRANSFORMER` 已直接合并到 `BabyBeeModel` 的图层定义中
        - `BONE`、 `STINGER`、 `FRONT_LEGS`、 `MIDDLE_LEGS`、 `BACK_LEGS` 现在是 `protected`，而不是 `private`
        - `bone` 现在是 `protected` 而不是 `private`
        - `createBodyLayer` -> `AdultBeeModel#createBodyLayer`, `BabyBeeModel#createBodyLayer`
        - `bobUpAndDown`- 根据蜜蜂当前的年龄，以所需的速度上下摆动蜜蜂。
- `net.minecraft.client.model.animal.camel`
    - `AdultCamelModel`- 成年骆驼的实体模型。
    - `BabyCamelModel`- 小骆驼的实体模型。
    - `CamelModel` 现在是抽象的
        - 构造函数现在接受步行、带/不带姿势坐着、站立、闲置和冲刺动画的定义
        - `BABY_TRANSFORMER` 已直接合并到 `BabyCamelModel` 的图层定义中
        - `createBodyLayer` -> `AdultCamelModel#createBodyLayer`, `BabyCamelModel#createBodyLayer`
    - `CameSaddleModel` 现在扩展 `AdultCamelModel` 而不是 `CamelModel`
- `net.minecraft.client.model.animal.chicken`
    - `AdultChickenModel`- 成年鸡的实体模型。
    - `BabyChickenModel`- 小鸡的实体模型。
    - `ChickenModel` 现在是抽象的
        - `RED_THING` -> `AdultChickenModel#RED_THING`
        - `BABY_TRANSFORMER` 已直接合并到 `BabyChickenModel` 的图层定义中
        - `createBodyLayer` -> `AdultChickenModel#createBodyLayer`
        - `createBaseChickenModel` -> `AdultChickenModel#createBaseChickenModel`
    - `ColdChickenModel` 现在扩展 `AdultChickenModel`
- `net.minecraft.client.model.animal.cow.BabyCowModel`- 小牛的实体模型。
- `net.minecraft.client.model.animal.dolphin.BabyDolphinModel`- 小海豚的实体模型。
- `net.minecraft.client.model.animal.equine`
    - `AbstractEquineModel` 现在有一个重载，可以直接指定要使用的 `ModelPart`
        - `BABY_TRANSFORMER` 已直接合并到 `BabyDonkeyModel` 的图层定义中
        - `rightHindLeg`、 `leftHindLeg`、 `rightFrontLeg`、 `leftFrontLeg` 现在从 `private` 变为 `protected`
        - `createBabyMesh`->`BabyHorseModel#createBabyMesh`，不是一对一
        - `offsetLegPositionWhenStanding`- 当实体站立时偏移腿的位置。
        - `getLegStandAngle`、 `getLegStandingYOffset`、 `getLegStandingZOffset`、 `getLegStandingXRotOffset`、 `getTailXRotOffset`- 马模型部分的偏移和角度。
        - `animateHeadPartsPlacement`- 根据头部的进食和站立状态对其进行动画处理。
    - `BabyDonkeyModel`- 小驴的实体模型。
    - `BabyHorseModel`- 小马的实体模型。
    - `DonkeyModel` 现在有一个重载，可以直接指定要使用的 `ModelPart`
        - `createBabyLayer` -> `BabyDonkeyModel#createBabyLayer`
    - `EquineSaddleModel#createFullScaleSaddleLayer` 已删除
合并到 `createSaddleLayer`，删除了婴儿变体
- `net.minecraft.client.model.animal.feline`
    - `CatModel`->`AdultCatModel`,`BabyCatModel`;不是一对一的
    - `FelineModel`->`AbstractFelineModel`，不是一对一
        - `AdultFelineModel` 和 `BabyFelineModel` 中的实现
    - `OcelotModel`->`AdultOcelotModel`,`BabyOcelotModel`;不是一对一的
- `net.minecraft.client.model.animal.fox`
    - `AdultFoxModel`- 成年狐狸的实体模型。
    - `BabyFoxModel`- 小狐狸的实体模型。
    - `FoxModel` 现在是抽象的
        - `BABY_TRANSFORMER` 已直接合并到 `BabyFoxModel` 的图层定义中
        - `body`、 `rightHindLeg`、 `leftHindLeg`、 `rightFontLeg`、 `leftFrontLeg`、 `tail` 现在是 `protected` 而不是 `private`
        - `createBodyLayer` -> `AdultFoxModel#createBodyLayer`, `BabyFoxModel#createBodyLayer`
        - `set*Pose`- 设置狐狸当前姿势的方法。
- `net.minecraft.client.model.animal.goat`
    - `BabyGoatModel`- 小山羊的实体模型。
    - `GoatModel#BABY_TRANSFORMER` 已直接合并到 `BabyGoatModel` 的图层定义中
- `net.minecraft.client.model.animal.llama`
    - `BabyLlamaModel`- 小美洲驼的实体模型。
    - 如果实体是婴儿，`LlamaModel#createBodyLayer` 不再接受 `boolean`
- `net.minecraft.client.model.animal.panda`
    - `BabyPandaModel`- 熊猫宝宝的实体模型。
    - `PandaModel`
        - `BABY_TRANSFORMER` 已直接合并到 `BabyPandaModel` 的图层定义中
        - `animateSitting`- 动画熊猫坐着。
- `net.minecraft.client.model.animal.pig.BabyPigModel`- 小猪的实体模型。
- `net.minecraft.client.model.animal.polarbear`
    - `BabyPolarBearModel`- 小北极熊的实体模型。
    - `PolarBearModel#BABY_TRANSFORMER` 已直接合并到 `BabyPolarBearModel` 的图层定义中
- `net.minecraft.client.model.animal.rabbit`
    - `AdultRabbitModel`- 成年兔子的实体模型。
    - `BabyRabbitModel`- 小兔子的实体模型。
    - `RabbitModel` 现在是抽象的
        - 构造函数现在接受跳跃和闲置头部倾斜的两个动画定义
        - `FRONT_LEGS`、 `BACK_LEGS`- 实体腿的子名称。
        - `LEFT_HAUNCH`、 `RIGHT_HAUNCH` 现为 `protected`
        - `createBodyLayer`->`AdultRabbitModel#createBodyLayer`,`BabyRabbitModel#createBodyLayer`;不是一对一的
- `net.minecraft.client.model.animal.sheep`
    - `BabySheepModel`- 小羊的实体模型。
    - `SheepModel#BABY_TRANSFORMER` 已直接合并到 `BabySheepModel` 的图层定义中
- `net.minecraft.client.model.animal.sniffer`
    - `SnifferModel#BABY_TRANSFORMER` 已直接合并到 `SniffletModel` 的图层定义中
    - `SniffletModel`- 婴儿嗅探器的实体模型。
- `net.minecraft.client.model.animal.squid`
    - `BabySquidModel`- 小鱿鱼的实体模型。
    - `SquidModel#createTentacleName` 现在受到私人保护
- `net.minecraft.client.model.animal.turtle`
    - `AdultTurtleModel`- 成年海龟的实体模型。
    - `BabyTurtleModel`- 小海龟的实体模型。
    - `TurtleModel` 现在是抽象的
        - 构造函数如何接收渲染类型函数
        - `BABY_TRANSFORMER` 已直接合并到 `BabyTurtleModel` 的图层定义中
        - `createBodyLayer` -> `AdultTurtleModel#createBodyLayer`, `BabyTurtleModel#createBodyLayer`
- `net.minecraft.client.model.animal.wolf`
    - `AdultWolfModel`- 成年狼的实体模型。
    - `BabyWolfModel`- 小狼的实体模型。
    - `WolfModel` 现在是抽象的
        - `ModelPart` 字段现已全部受保护
        - `createMeshDefinition`->`AdultWolfModel#createBodyLayer`,`BabyWolfModel#createBodyLayer`;不是一对一的
        - `shakeOffWater`- 设置甩掉水时的身体旋转。
        - `setSittingPose`- 设置狼的坐姿。
- `net.minecraft.client.model.geom`
    - `ModelLayers`
        - `COLD_CHICKEN_BABY` 已删除
        - `COLD_PIG_BABY` 已删除
        - `PIG_BABY_SADDLE` 已删除
        - `SHEEP_BABY_WOOL_UNDERCOAT` 已删除
        - `WOLF_BABY_ARMOR` 已删除
        - `DONKEY_BABY_SADDLE` 已删除
        - `HORSE_BABY_ARMOR` 已删除
        - `HORSE_BABY_SADDLE` 已删除
        - `MULE_BABY_SADDLE` 已删除
        - `SKELETON_HORSE_BABY_SADDLE` 已删除
        - `UNDEAD_HORSE_BABY_ARMOR` 已删除
        - `ZOMBIE_HORSE_BABY_SADDLE` 已删除
        - `STRIDER_BABY_SADDLE` 已删除
    - `PartNames#WAIST`- 腰部部分。
- `net.minecraft.client.model.monster.hoglin`
    - `BabyHoglinModel`- 小疣猪的实体模型。
    - `HoglinModel`
        - `BABY_TRANSFORMER` 已直接合并到 `BabyHoglinModel` 的图层定义中
        - `head` 现在从 `private` 变为 `protected`
        - `createBabyLayer` -> `BabyHoglinModel#createBodyLayer`
- `net.minecraft.client.model.monster.piglin`
    - `AbstractPiglinModel` 现在是抽象的
        - `leftSleeve`、 `rightSleeve`、 `leftPants`、 `rightPants`、 `jacket` 已删除
        - `ADULT_EAR_ANGLE_IN_DEGREES`、 `BABY_EAR_ANGLE_IN_DEGREES`- 猪耳朵的角度。
        - `createMesh` 替换为 `AdultPiglinModel#createBodyLayer`、 `AdultZombifiedPiglinModel#createBodyLayer`、 `BabyPiglinModel#createBodyLayer`、 `BabyZombifiedPiglinModel#createBodyLayer`
        - `createBabyArmorMeshSet`- 为小猪模型创建盔甲网格。
        - `getDefaultEarAngleInDegrees`- 获取默认耳朵角度。
    - `AdultPiglinModel`- 成年猪灵的实体模型。
    - `AdultZombifiedPiglinModel`- 成年僵尸猪灵的实体模型。
    - `BabyPiglinModel`- 小猪灵的实体模型。
    - `BabyZombifiedPiglinModel`- 小猪僵尸的实体模型。
    - `PiglinModel` 现在是抽象的
    - `ZombifiedPiglinModel` 现在是抽象的
- `net.minecraft.client.model.monster.strider`
    - `AdultStriderModel`- 成人跨步者的实体模型。
    - `BabyStriderModel`- 小黾的实体模型。
    - `StriderModel` 现在是抽象的
        - `BABY_TRANSFORMER` 已直接合并到 `BabyStriderModel` 的图层定义中
        - `rightLeg`、 `leftLeg`、 `body` 现在从 `private` 变为 `protected`
        - `SPEED`- 运动动画的速度标量。
        - `customAnimations`- 附加动画设置。
        - `animateBristle`- 为水步鸟的鬃毛制作动画。
- `net.minecraft.client.model.monster.zombie`
    - `BabyDrownedModel`- 溺水婴儿的实体模型。
    - `BabyZombieModel`- 小僵尸的实体模型。
    - `BabyZombieVillagerModel`- 小僵尸村民的实体模型。
- `net.minecraft.client.model.npc`
    - `BabyVillagerModel`- 小村民的实体模型。
    - `VillagerModel#BABY_TRANSFORMER` 已直接合并到 `BabyVillagerModel` 的图层定义中
- `net.minecraft.client.renderer.entity`
    - `AxolotlRenderer` 现在采用 `EntityModel<AxolotlRenderState>` 作为其通用
    - `CamelHuskRenderer` 现在扩展 `MobRenderer` 而不是 `CamelRenderer`
    - `CamelRenderer#createCamelSaddleLayer` 现在是 `static`
    - `CatRenderer` 现在采用 `AbstractFelineModel` 作为其通用
    - `DonkeyRenderer` 现在采用 `EquipmentClientInfo$LayerType` 和 `ModelLayerLocation` 作为鞍层和模型，并将 `DonkeyRenderer$Type` 分为成人型和婴儿型
        - `$Type`
            - `DONKEY_BABY`- 驴的婴儿变体。
            - `MULE_BABY`- 骡子的婴儿变种。
    - `OcelotRenderer` 现在采用 `AbstractFelineModel` 作为其通用
    - `UndeadHorseRenderer` 现在采用 `EquipmentClientInfo$LayerType` 和 `ModelLayerLocation` 作为鞍层和模型，并将 `UndeadHorseRenderer$Type` 分为成人型和婴儿型
        - `$Type`
            - `SKELETON_BABY`- 骷髅马的幼年变种。
            - `ZOMBIE_BABY`- 僵尸马的幼年变种。
- `net.minecraft.client.renderer.entity.layers.CatCollarLayer` 现在采用 `AbstractFelineModel` 作为其通用
- `net.minecraft.client.renderer.entity.state`
    - `AxolotlRenderState`
        - `swimAnimation`- 游泳的状态。
        - `walkAnimationState`- 在地面上行走的状态，而不是在水下。
        - `walkUnderWaterAnimationState`- 水下行走的状态。
        - `idleUnderWaterAnimationState`——水下空转但地面不空转的状态。
        - `idleUnderWaterOnGroundAnimationState`- 接触海底时在水下闲置的状态。
        - `idleOnGroundAnimationState`- 在地面上空转的状态，不在水下。
        - `playDeadAnimationState`- 装死的状态。
    - `RabbitRenderState`
        - `hopAnimationState`- 实体正在执行的跳的状态。
        - `idleHeadTiltAnimationState`- 执行空闲动画时头部倾斜的状态。
- `net.minecraft.client.resources.model.EquipmentClientInfo$LayerType#HUMANOID_BABY`- 婴儿人形装备层。
- `net.minecraft.sounds.SoundEvents#PIG_EAT_BABY`- 当大婴儿吃东西时会发出这种声音。
- `net.minecraft.world.entity.AgeableMob`
    - `canUseGoldenDandelion`- 金色蒲公英是否可以用于对实体进行年龄锁定。
    - `setAgeLocked`- 将实体设置为年龄锁定。
    - `makeAgeLockedParticle`- 在年龄锁定实体时创建粒子。
    - `AGE_LOCK_DOWNWARDS_MOVING_PARTICLE_Y_OFFSET`- 粒子起始位置的 Y 偏移量。
    - `getBabyStartAge`- 婴儿的初始年龄。
- `net.minecraft.world.entity.animal.axolotl.Axolotl`
    - `swimAnimation`- 游泳的状态。
    - `walkAnimationState`- 在地面上行走的状态，而不是在水下。
    - `walkUnderWaterAnimationState`- 水下行走的状态。
    - `idleUnderWaterAnimationState`——水下空转但地面不空转的状态。
    - `idleUnderWaterOnGroundAnimationState`- 接触海底时在水下闲置的状态。
    - `idleOnGroundAnimationState`- 在地面上空转的状态，不在水下。
    - `playDeadAnimationState`- 装死的状态。
    - `$AnimationState` -> `$AxolotlAnimationState`
- `net.minecraft.world.entity.animal.chicken.ChickenVariant` 现在接收婴儿纹理的资源
- `net.minecraft.world.entity.animal.cow.CowVariant` 现在接收婴儿纹理的资源
- `net.minecraft.world.entity.animal.cat.CatVariant` 现在接收婴儿纹理的资源
    - `CatVariant#assetInfo`- 根据实体是否是婴儿获取实体纹理。
- `net.minecraft.world.entity.animal.equine.AbstractHorse#BABY_SCALE`- 婴儿尺寸与成人相比的比例。
- `net.minecraft.world.entity.animal.frog.Tadpole`
    - `ageLockParticleTimer`- 年龄锁定实体的粒子应生成多长时间的计时器。
    - `setAgeLocked`、 `isAgeLocked`- 处理蝌蚪的年龄锁定。
- `net.minecraft.world.entity.animal.goat.Goat`
    - `BABY_DEFAULT_X_HEAD_ROT`- 婴儿变体的默认头部 X 旋转。
    - `MAX_ADDED_RAMMING_X_HEAD_ROT`- 最大头部 X 旋转。
    - `addHorns`、 `removeHorns` 已删除
- `net.minecraft.world.entity.animal.pig.PigVariant` 现在接收婴儿纹理的资源
- `net.minecraft.world.entity.animal.rabbit.Rabbit`
    - `hopAnimationState`- 实体正在执行的跳的状态。
    - `idleHeadTiltAnimationState`- 执行空闲动画时头部倾斜的状态。
- `net.minecraft.world.entity.animal.wolf`
    - `WolfSoundVariant` -> `WolfSoundVariant$WolfSoundSet`
        - 现在，班级本身拥有成年狼和小狼的两个声音集。
    - `WolfSoundVariants$SoundSet#getSoundEventSuffix` -> `getSoundEventIdentifier`
- `net.minecraft.world.entity.animal.wolf.WolfVariant` 现在接收婴儿变体的资产信息
- `net.minecraft.world.item.equipment.EquipmentAssets#TRADER_LLAMA_BABY`- 婴儿商人美洲驼的设备资产。

### 删除 interactAt {#the-removal-of-interactat}

`Entity#interactAt` 已被删除，所有进一步的调用都与 `Entity#interact` 合并。最初，如果命中结果在实体的交互范围内，则调用 `Entity#interactAt`。如果 `interactAt` 没有消耗该操作（即 `InteractionResult#consumesAction` 返回 false），则调用 `Entity#interact`。现在，如果在实体的交互范围内，则调用 `Entity#interact`，并考虑交互的 `Vec3` 位置。

```java
// In some Entity subclass

@Override
public InteractionResult interact(Player player, InteractionHand hand, Vec3 location) {
    // Handle the interaction
    super.interact(player, hand, location);
}
```

`interactAt` 检查结果是否不消耗交互，如果没有则调用 `interact`
现在，通过实体命中调用 `interact`

- `net.minecraft.client.multiplayer.MultiPlayerGameMode`
    - `interact` 现在包含 `EntityHitResult`
    - `interactAt` 已删除
- `net.minecraft.world.entity.Entity`
    - `interact` 现在采用 `Vec3` 作为交互位置
    - `interactAt` 已删除
- `net.minecraft.world.entity.player.Player#interactOn` 现在采用 `Vec3` 作为交互位置

### ChunkPos，现已创纪录 {#chunkpos-now-a-record}

`ChunkPos` 现在是一个记录。 `BlockPos` 构造函数已替换为 `ChunkPos#containing`，而打包的 `long` 构造函数已替换为 `ChunkPose#unpack`。

- `net.minecraft.world.level.ChunkPos` 现已创纪录
    - `ChunkPos(BlockPos)` -> `containing`
    - `ChunkPos(long)` -> `unpack`
    - `toLong`, `asLong` -> `pack`

### 不再有 Tripwire 管道 {#no-more-tripwire-pipelines}

Tripwire 渲染管道已被完全删除。现在，绊线使用 `cutout`（`alpha_cutoff_bias` 为 0.1）作为纹理。

- `net.minecraft.client.renderer.RenderPipelines#TRIPWIRE_BLOCK`、 `TRIPWIRE_TERRAIN` 已删除
- `net.minecraft.client.renderer.chunk`
    - `ChunkSectionLayer#TRIPWIRE` 已删除
    - `ChunkSectionLayerGroup#TRIPWIRE` 已删除
- `net.minecraft.client.renderer.rendertype.RenderTypes#tripwireMovingBlock` 已删除

### 活动和大脑 {#activities-and-brains}

活动定义了生物体在特定阶段的行为方式，现在通过 `ActivityData` 进行存储和传递。其中包含活动类型、要执行的行为及其优先级、该活动激活时的条件以及活动停止时要擦除的内存。 `Brain#provider` 现在采用 `$ActivitySupplier` 来构造实体执行的 `ActivityData` 列表。

大脑也发生了轻微的变化。首先，`Brain` 本身不能直接序列化。相反，大脑将 `$Packed` 写入记录，保存着当前记忆的地图。为了获取所使用的内存类型，通常从 `Sensor#requires` 中提取它们。此外，`LivingEntity#brainProvider` 不再存在，而是选择将提供程序存储在实体本身的静态常量中。这意味着大脑现在完全通过 `makeBrain` 方法构建，并吸收之前的 `$Packed` 数据：

```java
// For some ExampleEntity extends LivingEntity
// Assume extends Mob subclass
private static final Brain.Provider<ExampleEntity> BRAIN_PROVIDER = Brain.provider(
    // The list of sensors the entity uses.
    ImmutableList.of(),
    // A function that takes in the entity and returns a list of activities.
    entity -> List.of(
        new ActivityData(
            // The activity type
            Activity.CORE,
            // A list of priority and behavior pairs
            ImmutableList.of(Pair.of(0, new MoveToTargetSink())),
            // A set of memory conditions for the activity to run
            // For example, this memory value must be present
            ImmutableSet.of(Pair.of(MemoryModuleType.ATTACK_TARGET, MemoryStatus.VALUE_PRESENT)),
            // The set of memories to erase when the activity has stopped
            ImmutableSet.of(MemoryModuleType.ATTACK_TARGET)
        )
    )
);

@Override
protected Brain.Provider<ExampleEntity> makeBrain(Brain.Packed packedBrain) {
    // Make the brain, populating any previous memories
    return BRAIN_PROVIDER.makeBrain(this, packedBrain);
}
```

- `net.minecraft.world.entity.LivingEntity`
    - `brainProvider` 已删除
    - `makeBrain` 现在采用 `Brain$Packed` 而不是 `Dynamic`
- `net.minecraft.world.entity.ai`
    - `ActivityData`- 包含正在执行的活动、该活动期间要执行的行为、任何内存条件以及停止后要擦除的内存的记录。
    - `Brain` 现在受到保护，接受 `ActivityData`、 `MemoryMap` 的列表，而不是不可变的存储器列表、 `RandomSource`，而不是提供的 `Codec`
        - 公共构造函数不再接受任何内容
        - `provider` 现在具有仅接受传感器类型的重载，将内存类型默认为空列表
            - 一些 `provider` 方法也采用 `Brain$ActivitySupplier` 来执行
        - `codec`、 `serializeStart` 替换为 `pack`、 `Brain$Packed`
        - `addActivityAndRemoveMemoryWhenStopped`、 `addActivityWithConditions` 合并为 `addActivity`
            - 或者使用 `ActivityData#create`
        - `copyWithoutBehaviors` 已删除
        - `getMemories` 替换为 `forEach`
        - `$ActivitySupplier`- 创建实体的活动列表。
        - `$MemoryValue` 已删除
        - `$Packed`- 包含将大脑序列化到磁盘的数据的记录。
        - `$Provider#makeBrain` 现在接受实体和 `Brain$Packed` 来反序列化内存
        - `$Visitor`- 访问大脑内的记忆，无论是已定义但空的、存在的还是带有计时器的存在。
- `net.minecraft.world.entity.ai.behavior.VillagerGoalPackages#get*Package` 不再包含 `VillagerProfession`
- `net.minecraft.world.entity.ai.memory`
    - `ExpirableValue`->`MemorySlot`，不是一对一
        - 原来的 `ExpirableValue` 现在是一条定义内存何时到期的记录，而不是自行更新
    - `MemoryMap`- 将内存类型链接到其存储值的映射。
    - `MemoryModuleType`- 内存是否可以序列化。
- `net.minecraf.tworld.entity.ai.sensing.Sensor#randomlyDelayStart`- 延迟传感器多长时间。
- `net.minecraft.world.entity.animal.allay.AllayAi`
    - `SENSOR_TYPES`、 `MEMORY_TYPES`->`BRAIN_PROVIDER`，现已私有；不是一对一的
    - `makeBrain`->`getActivities`，不是一对一
- `net.minecraft.world.entity.animal.armadillo.ArmadilloAi#makeBrain`、 `brainProvider`->`getActivities`，现在为 `protected`，不是一对一
- `net.minecraft.world.entity.animal.axolotl`
    - `AxolotlSENSOR_TYPES`->`BRAIN_PROVIDER`，现已私有；不是一对一的
    - `AxolotlAi`
        - `makeBrain`->`getActivities`，不是一对一
        - `initPlayDeadActivity`，现在 `protected`，不再吸收任何东西
        - `initFightActivity`，现在 `protected`，不再吸收任何东西
        - `initCoreActivity`，现在 `protected`，不再吸收任何东西
        - `initIdleActivity`，现在 `protected`，不再吸收任何东西
- `net.minecraft.world.entity.animal.camel.CamelAi#makeBrain`、 `brainProvider`->`getActivities`，现在为 `protected`，不是一对一
- `net.minecraft.world.entity.animal.frog`
    - `Frog#SENSOR_TYPES`->`BRAIN_PROVIDER`，现已私有；不是一对一的
    - `FrogAi#makeBrain`->`getActivities`，不是一对一
    - `Tadpole#SENSOR_TYPES`->`BRAIN_PROVIDER`，现已私有；不是一对一的
- `net.minecraft.world.entity.animal.frog.TadpoleAi#makeBrain`->`getActivities`，现在为 `public`，不是一对一
- `net.minecraft.world.entity.animal.goat`
    - `Goat#SENSOR_TYPES`->`BRAIN_PROVIDER`，现已私有；不是一对一的
    - `GoatAi#makeBrain`->`getActivities`，不是一对一
- `net.minecraft.world.entity.animal.golem.CopperGolemAi#makeBrain`、 `brainProvider`->`getActivities`，现在为 `protected`，不是一对一
- `net.minecraft.world.entity.animal.happyghast.HappyGhastAi#makeBrain`、 `brainProvider`->`getActivities`，现在为 `protected`，不是一对一
- `net.minecraft.world.entity.animal.nautilus`
    - `NautilusAi`
        - `SENSOR_TYPES`,`MEMORY_TYPES`->`Nautilus#BRAIN_PROVIDER`，现在是私有的，不是一对一的
        - `makeBrain`、 `brainProvider`->`getActivities`，现在为 `public`，不是一对一
    - `ZombieNautilusAi`
        - `SENSOR_TYPES`,`MEMORY_TYPES`->`ZombieNautilus#BRAIN_PROVIDER`，现在是私有的，不是一对一的
        - `makeBrain`、 `brainProvider`->`getActivities`，现在为 `public`，不是一对一
- `net.minecraft.world.entity.animal.sniffer.SnifferAi#makeBrain`->`getActivities`，现在为 `public`，不是一对一
- `net.minecraft.world.entity.monster.Zoglin`
    - `SENSOR_TYPES`->`BRAIN_PROVIDER`，现在是私有的，不是一对一的
    - `getActivities`- 疣猴执行的活动。
- `net.minecraft.world.entity.monster.breeze.BreezeAi#makeBrain`->`getActivities`，不是一对一
- `net.minecraft.world.entity.monster.creaking.CreakingAi#makeBrain`、 `brainProvider`->`getActivities`，现在为 `protected`，不是一对一
- `net.minecraft.world.entity.monster.hoglin`
    - `Hoglin#SENSOR_TYPES`->`BRAIN_PROVIDER`，现已私有；不是一对一的
    - `HoglinAi#makeBrain`->`getActivities`，不是一对一
- `net.minecraft.world.entity.monster.piglin`
    - `Piglin#SENSOR_TYPES`,`MEMORY_TYPES`->`BRAIN_PROVIDER`，现在是私有的，不是一对一的
    - `PiglinAi#makeBrain`->`getActivities`，现在为 `public`，不是一对一
    - `PiglinBrute#SENSOR_TYPES`,`MEMORY_TYPES`->`BRAIN_PROVIDER`，现在是私有的，不是一对一的
    - `PiglinBruteAi#makeBrain`->`getActivities`，现在为 `public`，不是一对一
- `net.minecraft.world.entity.monster.warden.WardenAi#makeBrain`->`getActivities`，不是一对一

### 文件固定器上部 {#file-fixer-upper}

文件修复器上层是一个新系统，可与数据修复器上层一起帮助在版本之间升级游戏文件。与通过数据修复程序在 Minecraft 版本之间修改或“升级”文件中的数据类似，文件修复程序可以修改世界目录中的任何内容，从移动文件和目录到彻底删除它们。因此，文件修复程序始终先于数据修复程序应用。

与升级数据修复程序不同，文件修复程序会更改世界文件夹的结构。因此，降级几乎是不可能的，因为文件名和位置可能会改变位置。

文件修复程序通过 `FileFix` 应用，它定义了使用 `makeFixer` 对文件执行的一些操作。这通常是通过 `addFileContentFix` 完成的，通过 `FileAccess` 提供对所需文件的访问，然后像任何其他 `Dynamic` 实例一样修改数据。操作通常定义为 `FileFixOperation`，它可以移动文件结构。

然后通过 `FileFixerUpper` 应用文件修复，`FileFixerUpper` 使用写时复制文件系统来操作文件。该修复程序使用 `$Builder` 构建，使用 `addSchema` 和 `addFixer` 将修复程序应用于所需版本。在升级过程中，文件会在临时文件夹中创建，然后移至 world 文件夹。原始世界文件夹在删除之前已移动到另一个文件夹。

- `net.minecraft.client.gui.screens.FileFixerAbortedScreen`- 文件修复中止时显示的屏幕。
- `net.minecraft.client.gui.screens.worldselection.FileFixerProgressScreen`- 尝试显示升级和修复世界文件的进度时显示的屏幕。
- `net.minecraft.server.packs.linkfs`
    - `DummyFileAttributes` -> `.minecraft.util.DummyFileAttributes`
    - `LinkFSPath`
        - `DIRECTORY_ATTRIBUTES` -> `DummyFileAttributes#DIRECTORY`
        - `FILE_ATTRIBUTES` -> `DummyFileAttributes#FILE`
- `net.minecraft.util`
    - `ExtraCodecs`
        - `pathCodec`- 路径的 Codec，从字符串转换并使用 Unix 分隔符存储。
        - `relaiveNormalizedSubPathCodec`- 路径的 Codec，经过标准化和验证以确保它是相对的。
        - `guardedPathCodec`- 路径的 Codec，从某个基本路径解析和相对化。
    - `FileUtil`
        - `isPathNormalized`、 `createPathToResource` 已删除
        - `isEmptyPath`- 返回路径是否为空。
    - `Util#safeMoveFile`- 使用给定选项将文件从某个源安全移动到目的地。
- `net.minecraft.util.filefix`
    - `AbortedFileFixException`- 文件修复已中止且无法恢复移动时引发异常。
    - `AtmoicMoveNotSupportedFileFixException`- 当用户文件系统不支持原子移动时抛出异常。
    - `CanceledFileFixException`- 取消文件修复升级过程时引发异常。
    - `FailedCleanupFileFixException`- 文件修复无法移动或删除文件夹进行清理时引发异常。
    - `FileFix`- 对文件执行某些操作的修复程序。
    - `FileFixerUpper`- 用于执行操作的文件修复程序。
    - `FileFixException`- 尝试通过文件修复程序升级世界时抛出异常。
    - `FileFixUtil`- 用于执行某些文件操作的实用程序。
    - `FileSystemCapabilities`- 目录中文件系统的功能。
- `net.minecraft.util.filefix.access`
    - `ChunkNbt`- 处理升级块 nbt。
    - `CompressedNbt`- 处理升级压缩的 nbt 文件。
    - `FileAccess`- 提供对某些文件资源的引用（给定其关系）。
    - `FileAccessProvider`- 文件访问的提供者，与来源有某种关系。
    - `FileRelation`- 文件如何与某些原始 bpath 相关的定义。
    - `FileResourceType`- 定义要访问的资源类型。
    - `FileResourceTypes`- 所有定义的文件资源类型。
    - `LevelDat`- 处理升级级别数据。
    - `PlayerData`- 处理升级玩家数据。
    - `SavedDataNbt`- 处理升级保存的数据。
- `net.minecraft.util.filefix.fixes.*`- 适用于文件的普通修复。
- `net.minecraft.util.filefix.operations`
    - `ApplyInFolders`- 在相关文件夹中应用给定的操作。
    - `DeleteFileOrEmptyDirectory`- 删除目标文件或空目录。
    - `FileFixOperation`- 在某个基本目录中执行的操作。
    - `FileFixOperations`- 所有普通文件修复操作。
    - `GroupMove`- 移动某些目录，对其内容应用任何移动操作。
    - `ModifyContent`- 修改文件的内容。
    - `Move`- 将文件从某个源移动到某个目标。
    - `RegexMove`- 将与给定源模式匹配的所有文件移动到目标，替换匹配的部分。
- `net.minecraft.util.filefix.virtualfilesystem`
    - `CopyOnWriteFileStore`- 使用写时复制原理的文件存储。
    - `CopyOnWriteFileSystem`- 使用写时复制原理的文件系统。
    - `CopyOnWriteFSPath`- 使用写时复制原理的路径。
    - `CopyOnWriteFSProvider`- 使用写时复制原理的文件系统提供商。
    - `DirectoryNode`- 某些写时复制文件系统路径的目录节点。
    - `FileMove`- 包含文件移出路径的记录。
    - `FileNode`- 某些写时复制文件系统路径的文件节点。
    - `Node`- 某些写时复制文件系统路径的节点。
- `net.minecraft.util.filefix.virtualfilesystem.exception`
    - `CowFSCreationException`- 无法创建文件系统时为 `CowFSFileSystemException`。
    - `CowFSDirectoryNotEmptyException`- 专门用于写时复制系统的 `DirectoryNotEmptyException`。
    - `CowFSFileAlreadyExistsException`- 专门用于写时复制系统的 `FileAlreadyExistsException`。
    - `CowFSFileSystemException`- 专门用于写时复制系统的 `FileSystemException`。
    - `CowFSIllegalArgumentException`- 尝试在写时复制系统上操作时出现 `IllegalArgumentException`。
    - `CowFSNoSuchFileException`- 专门用于写时复制系统的 `NoSuchFileException`。
    - `CowFSNotDirectoryException`- 专门用于写时复制系统的 `NotDirectoryException`。
    - `CowFSSymlinkException`- 尝试使用带有符号链接的写时复制系统时出现 `CowFSCreationException`。
- `net.minecraft.util.worldupdate`
    - `UpgradeProgress`
        - `getTotalFiles`->`getTotalFileFixState`，不是一对一
        - `addTotalFiles`->`addTotalFileFixOperations`，不是一对一
        - `getTypeFileFixStats`、 `getRunningFileFixerStats`- 获取特定文件组的修复程序统计信息。
        - `incrementFinishedOperations`、 `incrementFinishedOperationsBy`- 增加已完成的操作数。
        - `setType`、 `getType`- 获取升级进度类型。
        - `setApplicableFixerAmount`- 设置正在运行的文件修复程序完成的操作总数。
        - `incrementRunningFileFixer`- 增加已完成操作的数量。
        - `logProgress`- 每秒记录升级进度。
        - `$FileFixStats`- 已执行/已完成操作的计数器。
        - `$Type`- 对世界数据执行的升级类型。
    - `WorldUpgrader` 不再包含 `WorldData`
        - `STATUS_*` 消息已合并在 `UpgradeStatusTranslator` 中
            - 这还包含特定的数据修复类型
        - `running`、 `finished`、 `progress`、 `totalChunks`、 `totalFiles`、 `converted`、 `skipped`、 `progressMap`、 `status` 有全部移入 `UpgradeProgress`，存储在 `upgradeProgress`
        - `getProgress`->`getTotalProgress`，不是一对一
        - `$AbstractUpgrader`、 `$SimpleRegionStorageUpgrader`->`RegionStorageUpgrader`，不再采用提供的 `LegacyTagFixer`，不是一对一
            - `$ChunkUpgrader`、 `$EntityUpgrader`、 `$PoiUpgrader` 现在刚刚在 `WorldUpgrader#work` 内构建
            - `$Builder#setLegacyFixer` 已删除
        - `$ChunkUpgrader#tryProcessOnePosition` 已部分抽象为 `getDataFixContentTag`、 `verifyChunkPosAndEraseCache`、 `verifyChunkPos`
        - `$FileToUpgrade` -> `FileToUpgrade`
- `net.minecraft.world.level.ChunkPos#getRegionX`、 `getRegionZ`- 获取块所在的区域。
- `net.minecraft.world.level.chunk.ChunkGenerator#getTypeNameForDataFixer` 现在返回可选的 `Identifier` 而不是 `ResourceKey`
- `net.minecraft.world.level.chunk.storage`
    - `LegacyTagFixer` 接口被移除
    - `RecreatingSimpleRegionStorage` 不再接受提供的 `LegacyTagFixer`
    - `SimpleRegionStorage` 不再接受提供的 `LegacyTagFixer`
        - `markChunkDone` 已删除
- `net.minecraft.world.level.levelgen.structure`
    - `LegacyStructureDataHandler` 类已删除
    - `StructureFeatureIndexSavedData` 类已删除
- `net.minecraft.world.level.levelgen.structure.templatesystem.StructureTemplateManager`
    - `STRUCTURE_RESOURCE_DIRECTORY_NAME`->`STRUCTURE_DIRECTORY_NAME`，不是一对一
    - `WORLD_STRUCTURE_LISTER`、 `RESOURCE_TEXT_STRUCTURE_LISTER`- nbts 结构的 Id 转换器。
    - `save` 现在有一个重载，它接受路径 `StructureTemplate` 和 `boolean` 是否将数据写入文本
    - `createAndValidatePathToGeneratedStructure`->`TemplatePathFactory#createAndValidatePathToStructure`，不是一对一
    - `worldTemplates`、 `testTemplates`- 模板路径工厂。
- `net.minecraft.world.level.levelgen.structure.templatesystem.loader`
    - `DirectoryTemplateSource`- 某些目录的模板源。
    - `ResourceManagerTemplateSource`- 资源管理器的模板源。
    - `TemplatePathFactory`- 获取某些结构路径的工厂。
    - `TemplateSource`- 结构模板加载器。
- `net.minecraft.world.level.storage`
    - `LevelStorageSource`
        - `getLevelDataAndDimensions` 现在包含 `$LevelStorageAccess`
        - `readExistingSavedData`- 读取任何现有的保存数据。
        - `writeGameRules`- 将游戏规则写入保存的数据。
        - `$LevelStorageAccess#releaseTemporarilyAndRun`- 释放访问权限并在重新创建锁之前运行。
            - `collectIssues`- 收集尝试升级数据时的任何问题。
            - `getSummary`->`fixAndGetSummary`,`fixAndGetSummaryFromTag`;不是一对一的
            - `getDataTag`->`getUnfixedDataTag`，不是一对一
            - `getDataTagFallback`->`getUnfixedDataTagWithFallback`，不是一对一
            - `saveDataTag` 不再包含 `RegistryAccess`
            - `saveLevelData`- 保存级别数据。
    - `LevelSummary` 现在考虑是否需要文件修复
        - `UPGRADE_AND_PLAY_WORLD`- 告诉用户升级他们的世界并进行游戏的组件。
        - `requiresFileFixing`- 关卡是否需要文件修复。
        - `$BackupStatus#FILE_FIXING_REQUIRED`- 在此版本上玩此级别是否需要文件修复。

### 聊天权限 {#chat-permissions}

聊天系统现在具有一组关联的权限，指示玩家可以发送或接收哪些消息。 `Permissions#CHAT_SEND_MESSAGES` 和 `CHAT_SEND_COMMANDS` 分别确定玩家是否可以发送消息或命令。同样，如果玩家可以分别从其他玩家或系统接收消息，则为 `CHAT_RECEIVE_PLAYER_MESSAGES` 和 `CHAT_RECEIVE_SYSTEM_MESSAGES`。请注意，所有这些权限仅在客户端处理，而不在服务器端验证。

- `net.minecraft.SharedConstants#DEBUG_CHAT_DISABLED`- 禁用聊天框的标志。
- `net.minecraft.client`
    - `GuiMessage` -> `.multiplayer.chat.GuiMessage`
    - `GuiMessageTag` -> `.multiplayer.chat.GuiMessageTag`
    - `Minecraft`
        - `getChatStatus`->`computeChatAbilities`，不是一对一
        - `$ChatStatus`->`ChatRestriction`，不是一对一
- `net.minecraft.client.gui.Gui#setChatDisabledByPlayerShown`、 `isShowingChatDisabledByPlayer`- 处理显示的玩家是否禁用聊天。
- `net.minecraft.client.gui.components`
    - `ChatComponent`
        - `GO_TO_RESTRICTIONS_SCREEN`- 用于重定向到限制屏幕的标识符。
        - `setVisibleMessageFilter`- 设置消息过滤功能。
        - 如果玩家正在聊天，`render`、 `captureClickableText` 现在会采用 `$DisplayMode` 而不是 `boolean`
        - `addMessage` 现已私有
            - 拆分用于 `addClientSystemMessage`、 `addServerSystemMessage`、 `addPlayerMessage`
        - `$DisplayMode`- 聊天应如何显示。
    - `CommandSuggestions`
        - `USAGE_FORMAT`、 `USAGE_OFFSET_FROM_BOTTOM`、 `LINE_HEIGHT`- 用于显示命令建议的常量。
        - `setRestrictions`- 设置可以键入的消息的限制。
        - `hasAllowedInput`- 聊天框是否允许输入。
- `net.minecraft.client.gui.screens.ChatScreen#USAGE_BACKGROUND_COLOR`- 命令建议框的背景颜色。
- `net.minecraft.client.gui.screens.multiplayer.RestrictionsScreen`- 用于设置玩家聊天框限制的屏幕。
- 如果聊天被禁用或阻止，`net.minecraft.client.gui.screens.reporting.ReportPlayerScreen` 现在会接收 `boolean`
- `net.minecraft.client.multiplayer.chat`
    - `ChatAbilities`- 玩家与聊天框聊天的一组限制。
    - `ChatListener`
        - `handleSystemMessage``boolean` 现在用于系统是远程的而不是覆盖的情况
            - 现在通过 `handleOverlay` 处理叠加
    - `GuiMessageSource`- 消息的来源。
- `net.minecraft.client.player.LocalPlayer` 现在包含 `ChatAbilities`
    - `chatAbilities`、 `refreshChatAbilities`- 处理聊天功能。
- `net.minecraft.server.permissions.Permissions`
    - `CHAT_SEND_MESSAGES`- 如果玩家可以发送聊天消息。
    - `CHAT_SEND_COMMANDS`- 如果玩家可以发送命令。
    - `CHAT_RECEIVE_PLAYER_MESSAGES`- 如果玩家可以接收其他玩家消息。
    - `CHAT_RECEIVE_SYSTEM_MESSAGES`- 如果玩家可以接收系统消息。
    - `CHAT_PERMISSIONS`- 一组可用的聊天权限。
- 当覆盖消息为 `false` 时，`net.minecraft.world.entity.player.Player#displayClientMessage` 拆分为 `sendSystemMessage`；当覆盖消息为 `true` 时，`sendOverlayMessage` 拆分为 `sendOverlayMessage`

### 更多实体声音变体注册表 {#more-entity-sound-variant-registries}

猫、鸡、牛和猪现在都有声音变体：一个指定实体播放声音的数据备份注册表对象。这不需要直接绑定到实际的实体变体，因为它只定义实体播放的声音，通常在 `Mob#finalizeSpawn` 期间。

对于奶牛：

```json5
// A file located at:
// - `data/examplemod/cow_sound_variant/example_cow_sound.json`
{
    // The registry name of the sound event to play randomly on idle.
    "ambient_sound": "minecraft:entity.cow.ambient",
    // The registry name of the sound event to play when killed.
    "death_sound": "minecraft:entity.cow.death",
    // The registry name of the sound event to play when hurt.
    "hurt_sound": "minecraft:entity.cow.hurt",
    // The registry name of the sound event to play when stepping.
    "step_sound": "minecraft:entity.cow.step"
}
```

对于鸡和猪：

```json5
// A file located at:
// - `data/examplemod/chicken_sound_variant/example_chicken_sound.json`
{
    // The sounds played when an entity's age is greater than or equal to 0 (an adult).
    "adult_sounds": {
        // The registry name of the sound event to play randomly on idle.
        "ambient_sound": "minecraft:entity.chicken.ambient",
        // The registry name of the sound event to play when killed.
        "death_sound": "minecraft:entity.chicken.death",
        // The registry name of the sound event to play when hurt.
        "hurt_sound": "minecraft:entity.chicken.hurt",
        // The registry name of the sound event to play when stepping.
        "step_sound": "minecraft:entity.chicken.step"
    },
    // The sounds played when an entity's age is less than 0 (a baby).
    "baby_sounds": {
        "ambient_sound": "minecraft:entity.baby_chicken.ambient",
        "death_sound": "minecraft:entity.baby_chicken.death",
        "hurt_sound": "minecraft:entity.baby_chicken.hurt",
        "step_sound": "minecraft:entity.baby_chicken.step"
    }
}
```

对于猪：

```json5
// A file located at:
// - `data/examplemod/pig_sound_variant/example_pig_sound.json`
{
    // The sounds played when an entity's age is greater than or equal to 0 (an adult).
    "adult_sounds": {
        // The registry name of the sound event to play randomly on idle.
        "ambient_sound": "minecraft:entity.pig.ambient",
        // The registry name of the sound event to play when killed.
        "death_sound": "minecraft:entity.pig.death",
        // The registry name of the sound event to play when eating.
        "eat_sound": "minecraft:entity.pig.eat",
        // The registry name of the sound event to play when hurt.
        "hurt_sound": "minecraft:entity.pig.hurt",
        // The registry name of the sound event to play when stepping.
        "step_sound": "minecraft:entity.pig.step"
    },
    // The sounds played when an entity's age is less than 0 (a baby).
    "baby_sounds": {
        "ambient_sound": "minecraft:entity.baby_pig.ambient",
        "death_sound": "minecraft:entity.baby_pig.death",
        "eat_sound": "minecraft:entity.baby_pig.eat",
        "hurt_sound": "minecraft:entity.baby_pig.hurt",
        "step_sound": "minecraft:entity.baby_pig.step"
    }
}
```

对于猫：

```json5
// A file located at:
// - `data/examplemod/cat_sound_variant/example_cat_sound.json`
{
    // The sounds played when an entity's age is greater than or equal to 0 (an adult).
    "adult_sounds": {
        // The registry name of the sound event to play randomly on idle when tamed.
        "ambient_sound": "minecraft:entity.cat.ambient",
        // The registry name of the sound event to play when non-tamed and tempted by food.
        "beg_for_food_sound": "minecraft:entity.cat.beg_for_food",
        // The registry name of the sound event to play when killed.
        "death_sound": "minecraft:entity.cat.death",
        // The registry name of the sound event to play when fed.
        "eat_sound": "minecraft:entity.cat.eat",
        // The registry name of the sound event to play when hissing, typically at a pursuing phantom.
        "hiss_sound": "minecraft:entity.cat.hiss",
        // The registry name of the sound event to play when hurt.
        "hurt_sound": "minecraft:entity.cat.hurt",
        // The registry name of the sound event to play when purring, typically when in love or lying down.
        "purr_sound": "minecraft:entity.cat.purr",
        // The registry name of the sound event to play randomly on idle when tamed 25% of the time.
        "purreow_sound": "minecraft:entity.cat.purreow",
        // The registry name of the sound event to play randomly on idle when not tamed.
        "stray_ambient_sound": "minecraft:entity.cat.stray_ambient"
    },
    // The sounds played when an entity's age is less than 0 (a baby).
    "baby_sounds": {
        "ambient_sound": "minecraft:entity.baby_cat.ambient",
        "beg_for_food_sound": "minecraft:entity.baby_cat.beg_for_food",
        "death_sound": "minecraft:entity.baby_cat.death",
        "eat_sound": "minecraft:entity.baby_cat.eat",
        "hiss_sound": "minecraft:entity.baby_cat.hiss",
        "hurt_sound": "minecraft:entity.baby_cat.hurt",
        "purr_sound": "minecraft:entity.baby_cat.purr",
        "purreow_sound": "minecraft:entity.baby_cat.purreow",
        "stray_ambient_sound": "minecraft:entity.baby_cat.stray_ambient"
    }
}
```

- `net.minecraft.core.registries.Registries`
    - `CAT_SOUND_VARIANT`- 猫应该发出的声音的注册表项。
    - `CHICKEN_SOUND_VARIANT`- 鸡应该发出的声音的注册表项。
    - `COW_SOUND_VARIANT`- 牛应该发出的声音的注册表项。
    - `PIG_SOUND_VARIANT`- 猪应该发出的声音的注册表项。
- `net.minecraft.network.synched.EntityDataSerializers`
    - `CAT_SOUND_VARIANT`- 猫应该发出的声音的实体序列化器。
    - `CHICKEN_SOUND_VARIANT`- 鸡应该发出的声音的实体序列化器。
    - `COW_SOUND_VARIANT`- 牛应该发出的声音的实体序列化器。
    - `PIG_SOUND_VARIANT`- 猪应该发出的声音的实体序列化器。
- `net.minecraft.sounds.SoundEvents`
    - `CAT_*` 声音现在要么是 `Holder$Reference`，要么存储在 `CAT_SOUNDS` 的地图中
    - `CHICKEN_*` 声音现在要么是 `Holder$Reference`，要么存储在 `CHICKEN_SOUNDS` 的地图中
    - `COW_*` 声音存储在 `COW_SOUNDS` 的地图中
    - `PIG_*` 声音现在要么是 `Holder$Reference`，要么存储在 `PIG_SOUNDS` 的地图中
- `net.minecraft.world.entity.animal.chicken`
    - `ChickenSoundVariant`- 为鸡变体播放的声音。
    - `ChickenSoundVariants`- 所有原版鸡变种。
- `net.minecraft.world.entity.animal.cow`
    - `AbstractCow#getSoundSet`- 获取牛发出的声音。
    - `CowSoundVariant`- 为牛变体播放的声音。
    - `CowSoundVariants`- 所有原版牛变种。
- `net.minecraft.world.entity.animal.feline`
    - `CatSoundVariant`- 为猫变体播放的声音。
    - `CatSoundVariants`- 所有原版猫变体。
- `net.minecraft.world.entity.animal.chicken`
    - `ChickenSoundVariant`- 为鸡变体播放的声音。
    - `ChickenSoundVariants`- 所有原版鸡变种。
- `net.minecraft.world.entity.animal.pig`
    - `PigSoundVariant`- 为猪变体播放的声音。
    - `PigSoundVariants`- 所有原版猪变种。

### 音频更改 {#audio-changes}

音频设备现在通过 `DeviceTracker` 进行处理，根据支持的机器，允许机器在音频设备更改时发送系统事件，或使用标准轮询间隔重新查询可用设备列表。

- `com.mojang.blaze3d.audio`
    - `AbstractDeviceTracker`- 用于管理音频设备更改的抽象跟踪器。
    - `CallbackDeviceTracker`- 使用软件系统事件回调来确定更改的设备跟踪器。
    - `DeviceList`- 所有音频设备的列表，包括默认设备（如果有）。
    - `DeviceTracker`- 用于管理音频设备更改的接口。
    - `Library`
        - `NO_DEVICE` 现在从 `private` 变为 `public`
        - `init` 现在包含 `DeviceList`
        - `getDefaultDeviceName` 移至 `DeviceList#defaultDevice`
        - `getCurrentDeviceName` -> `currentDeviceName`
        - `hasDefaultDeviceChanged` 移至 `AbstractDeviceTracker`，不是一对一
        - `getAvailableSoundDevices` 移至 `DeviceList`，不是一对一
        - `createDeviceTracker`- 创建用于管理音频设备更改的跟踪器。
        - `getDebugString` -> `getChannelDebugString`
    - `PollingDeviceTracker`- 使用轮询间隔来确定更改的设备跟踪器。
    - `SoundBuffer`
        - `format`- 声音流的格式。
        - `size`- 声音流中的字节数。
        - `isValid`- 如果声音流处于有效状态。
- `net.minecraft.client.Options`
    - `DEFAULT_SOUND_DEVICE` 现在从 `public` 变为 `private`
    - `isSoundDeviceDefault`- 检查设备是否是默认音频设备。
- `net.minecraft.client.gui.components.debug`
    - `DebugEntrySoundCache`- 显示加载声音流的当前缓存的调试条目。
    - `DebugScreenEntries#SOUND_CACHE`- 声音流缓存调试信息的标识符。
- `net.minecraft.client.sounds`
    - `SoundBufferLibrary`
        - `enumerate`- 循环所有缓存的声音，输出其 id、大小和格式。
        - `$DebugOutput`- 接受一些声音元数据的接口。
            - `$Counter`- 一种输出实现，用于跟踪声音流的数量和总大小。
    - `SoundEngine`
        - `getDebugString`->`getChannelDebugString`,`getSoundCacheDebugStats`;不是一对一的
        - `$DeviceCheckState` 已删除
    - `SoundManager#getDebugString`->`getChannelDebugString`,`getSoundCacheDebugStats`;不是一对一的

### 输入消息编辑器支持 {#input-message-editor-support}

Minecraft 现在支持输入消息编辑器 (IME)，它允许输入中文或印地语等语言的复杂字符，而不是临时的预编辑文本。预编辑文本在游戏中显示为覆盖层，而主机操作系统提供的任何其他 IME 功能。通过此添加，可以通过 `GuiEventListener#preeditUpdated` 在屏幕内添加支持，或者使用实现该方法的现有普通小部件。

- `com.mojang.blaze3d.platform`
    - `InputConstants#setupKeyboardCallbacks` 现在采用 `GLFWCharCallbackI` 而不是 `GLFWCharModsCallbackI` 进行字符键入回调，采用 `GLFWPreeditCallbackI` 来处理通过输入法编辑器输入复杂字符，采用 `GLFWIMEStatusCallbackI` 来通知编辑器的状态
    - `MessageBox`- 用于创建操作系统本机消息框的实用程序。
    - `TextInputManager`- 在游戏窗口中输入文本时进行处理的管理器。
        - `setTextInputArea`- 设置预测文本光标应出现的区域。
        - `startTextInput`、 `stopTextInput`- 处理切换输入消息编辑器。
- `net.minecraft.client`
    - `KeyboardHandler`
        - `resubmitLastPreeditEvent`- 重复发送的最后一个预编辑事件。
        - `submitPreeditEvent`- 告诉听众预编辑文本已更新。
    - `Minecraft`
        - `textInputManager`- 返回输入管理器。
        - `onTextInputFocusChange`- 根据文本输入是否获得焦点更改编辑器输入状态。
- `net.minecraft.client.gui.GuiGraphics`
    - `setPreeditOverlay`- 设置叠加绘制预编辑文本。
    - `renderDeferredElements` 现在采用 `int` 来表示鼠标位置和游戏时间增量 `float`
- `net.minecraft.client.gui.components`
    - `IMEPreeditOverlay`- 用于显示输入消息编辑器的预编辑文本的覆盖层。
    - `TextCursorUtils`- 用于绘制文本光标的实用程序。
- `net.minecraft.client.gui.components.events.GuiEventListener#preeditUpdated`- 侦听预编辑文本何时更改。
- `net.minecraft.client.input`
    - `CharacterEvent` 不再接受修饰符 `int` 集
    - `PreeditEvent`- 包含预编辑文本以及光标位置的事件。

### Cauldron 交互调度员 {#cauldron-interaction-dispatchers}

Cauldron 交互已进行了一定程度的重组，所有注册均从 `CauldronInteraction` 移至 `CauldronInteractions`。此外，坩埚类型的背衬 `$InteractionMap` 已替换为 `$Dispatcher`，可以注册标签和物品的交互。标签在物品之前检查。

```java
CauldronInteractions.EMPTY.put(
    // The Item or TagKey to use
    ItemTags.WOOL,
    // The cauldron interaction to apply
    (state, level, pos, player, hand, itemInHand) -> InteractionResult.TRY_WITH_EMPTY_HAND
);
```

- `net.minecraft.core.cauldron`
    - `CauldronInteraction`
        - 与将交互注册到地图相关的所有字段均已移至 `CauldronInteractions`
            - `INTERACTIONS`->`CauldronInteractions#ID_MAPPER`，现在为 `private`
        - `DEFAULT`- 与大锅的默认交互
        - `$InteractionMap`->`$Dispatcher`，不是一对一
    - `CauldronInteractions`- 所有原版大锅交互。

### 基于规则的方块状态提供者 {#rule-based-block-state-providers}

`RuleBasedStateProvider` 现在扩展了 `BlockStateProvider`，允许在需要状态提供程序的任何地方使用它。它的实现没有改变，现在只需要将 `rule_based_state_provider` 指定为 `type`。因此，使用 `RuleBasedBlockStateProvider` 的所有配置都已扩展为允许任何 `BlockStateProvider`。

- `net.minecraft.world.level.levelgen.feature.configurations`
    - `DiskConfiguration` 现在采用 `BlockStateProvider` 而不是 `RuleBasedBlockStateProvider`
    - `TreeConfiguration` 现在采用 `BlockStateProvider` 而不是 `RuleBasedBlockStateProvider`
        - `belowTrunkProvider` 现在是 `BlockStateProvider` 而不是 `RuleBasedBlockStateProvider`
        - `$TreeConfigurationBuilder` 现在采用 `BlockStateProvider` 而不是 `RuleBasedBlockStateProvider`
- `net.minecraft.world.level.levelgen.feature.stateproviders`
    - `BlockStateProvider#getOptionalState`- 获取块的状态，否则为 `null`。
    - `BlockStateProviderType#RULE_BASED_STATE_PROVIDER`- 基于规则的状态提供程序的类型。
    - `RuleBasedBlockStateProvider`->`RuleBasedStateProvider`，现在是一个类，实现 `BlockStateProvider`
        - 构造函数现在可以采用可为 null 的后备 `BlockStateProvider`
        - `ifTrueThenProvide`- 如果谓词为真，则提供给定的块。
        - `simple` -> `always`
        - `$Builder`- 用于构建要放置的块的规则的构建器。

### 流体逻辑重组 {#fluid-logic-reorganization}

通用实体流体运动已移至单独的 `EntityFluidInteraction` 类中，其中所有跟踪的流体都会更新，然后可能在图层时间被当前推动。

- `net.minecraft.world.entity`
    - `Entity`
        - `updateInWaterStateAndDoFluidPushing`->`updateFluidInteraction`，不是一对一
        - `updateFluidHeightAndDoFluidPushing` -> `EntityFluidInteraction#update`
        - `getFluidInteractionBox`- 获取流体交互期间实体的边界框。
        - `modifyPassengerFluidInteractionBox`- 返回乘坐某些车辆时实体的修改后的边界框。
    - `EntityFluidInteraction`- 用于管理与实体的流体交互和基本运动的处理器。
- `net.minecraft.world.level.chunk.LevelChunkSection#hasFluid`- 块部分是否有流体块。

### 删除随机补丁功能 {#removal-of-random-patch-feature}

随机补丁功能已被完全删除，有利于像大多数其他功能一样使用展示位置。要进行转换，定义为配置一部分的 `ConfiguredFeature` 应该是它自己的文件。然后，布局应指定 `CountPlacement`，然后是使用 `TrapezoidInt` 的 `RandomOffsetPlacement`，最后是 `BlockPredicateFilter`：

```json5
// In `data/examplemod/worldgen/configured_feature/example_configured_feature.json`
{
    // Previously config.feature.feature
    "type": "minecraft:simple_block",
    "config": {
        "to_place": {
            "type": "minecraft:simple_state_provider",
            "state": {
                "Name": "minecraft:sweet_berry_bush",
                "Properties": {
                    "age": "3"
                }
            }
        }
    }
}

// In `data/examplemod/worldgen/placed_feature/example_placed_feature.json`
{
    "feature": "examplemod:example_configured_feature",
    "placement": [
        {
            // Previously config.tries
            "type": "minecraft:count",
            "count": 96
        },
        {
            "type": "minecraft:random_offset",
            "xz_spread": {
                // Previously config.xz_spread
                // The min and max are additive inverses
                "type": "minecraft:trapezoid",
                "max": 7,
                "min": -7,
                "plateau": 0
            },
            "y_spread": {
                // Previously config.y_spread
                "type": "minecraft:trapezoid",
                "max": 3,
                "min": -3,
                "plateau": 0
            }
        },
        {
            // Previously config.feature.placement
            // This contains the placements of the original placed feature
            "type": "minecraft:block_predicate_filter",
            "predicate": {
                "type": "minecraft:all_of",
                "predicates": [
                    {
                        "type": "minecraft:matching_block_tag",
                        "tag": "minecraft:air"
                    },
                    {
                        "type": "minecraft:matching_blocks",
                        "blocks": "minecraft:grass_block",
                        "offset": [ 0, -1, 0 ]
                    }
                ]
            }
        }
    ]
}
```

- `net.minecraft.data.worldgen.features`
    - `FeatureUtils#simpleRandomPatchConfiguration`、 `simplePatchConfiguration` 已删除
        - 通常由 `Feature#SIMPLE_BLOCK` 替换，并放置随机偏移和滤波器
    - `NetherFeatures#PATCH_*` 字段不再具有 `PATCH_*` 前缀
    - `VegetationFeatures`
        - `PATCH_*` 字段不再具有 `PATCH_*` 前缀
        - `WILDFLOWERS_BIRCH_FOREST`、 `WILDFLOWERS_MEADOW`->`WILDFLOWER`，不是一对一
        - `PALE_FOREST_FLOWERS` -> `PALE_FOREST_FLOWER`
- `net.minecraft.world.level.biome.BiomeGenerationSettings#getFlowerFeatures` -> `getBoneMealFeatures`
- `net.minecraft.world.level.levelgen.feature`
    - `ConfiguredFeature#getFeatures`->`getSubFeatures`，现在返回一串没有此功能的支架包装的 `ConfiguredFeature`
    - `Feature`
        - `FLOWER`、 `NO_BONEMEAL_FLOWER` 已删除
        - `RANDOM_PATCH` 已删除
    - `RandomPatchFeature` 类已删除
- `net.minecraft.world.level.levelgen.feature.configurations`
    - `FeatureConfiguration#getFeatures`->`getSubFeatures`，现在返回一系列支架包装的 `ConfiguredFeature`
    - `RandomPatchConfiguration` 记录已删除
- `net.minecraft.world.level.levelgen.placement.PlacedFeature#getFeatures` 现在返回持有者包装的 `ConfiguredFeature` 流，并连接此功能

### 具体逻辑变化 {#specific-logic-changes}

- 画中画提交调用现在采用 `0xF000F0` 而不是 `0x000000` 作为灯光坐标。
- `net.minecraft.client.multiplayer.RegistryDataCollector#collectGameRegistries``boolean` 参数现在仅处理同步注册表中的更新组件以及标签。
- `net.minecraft.client.renderer.RenderPipelines#VIGNETTE` 现在将 alpha 与源 0 和目标 1 混合。
- `net.minecraft.server.packs.PathPackResources#getResource`、 `listPath`、 `listResources` 首先使用标识符的命名空间解析路径。
- `net.minecraft.world.entity.EntitySelector#CAN_BE_PICKED` 现在可以在旁观者模式下查找实体（假设 `Entity#isPickable` 为真）。
- 默认情况下不再实现 `net.minecraft.world.entity.ai.sensing.NearestVisibleLivingEntitySensor#requires`。
- JSON 中的 `net.minecraft.world.level.levelgen.WorldOptions#generate_features` 字段已重命名为 `generate_structures` 以匹配其 java 字段名称。
- `net.minecraft.world.level.levelgen.blockpredicates.BlockPredicate#ONLY_IN_AIR_PREDICATE` 现在匹配空气标签，而不仅仅是空气块。
- `net.minecraft.world.level.levelgen.placement.CountPlacement` 现在最多可以有 4096 个该功能实例，而不是最多 256 个。
- `net.minecraft.world.level.timers`
    - `FunctionCallback`、 `FunctionTagCallback` 现在在序列化时使用 `id` 而不是 `Name`
    - `TimerCallbacks` 现在在序列化时使用 `type` 而不是 `Type`

### 数据组件添加 {#data-component-additions}

- `dye`- 将物品设置为染料材料，在特定情况下使用。
- `additional_trade_cost`- 抵消指定金额的贸易成本的修改器。
- `pig/sound_variant`- 猪应该发出的声音。
- `cow/sound_variant`- 牛应该发出的声音。
- `chicken/sound_variant`- 鸡应该发出的声音。
- `cat/sound_variant`- 猫应该发出的声音。

### 环境属性添加 {#environment-attribute-additions}

- `visual/block_light_tint`- 对方块发出的光的颜色进行着色。
- `visual/night_vision_color`- 夜视激活时的颜色。
- `visual/ambient_light_color`- 环境中环境光的颜色。

### 标签更改 {#tag-changes}

- `minecraft:block`
    - `bamboo_plantable_on` -> `supports_bamboo`
    - `mushroom_grow_block` -> `overrides_mushroom_light_requirement`
    - `small_dripleaf_placeable` -> `supports_small_dripleaf`
    - `big_dripleaf_placeable` -> `supports_big_dripleaf`
    - `dry_vegetation_may_place_on` -> `supports_dry_vegetation`
    - `snow_layer_cannot_survive_on` -> `cannot_support_snow_layer`
    - `snow_layer_can_survive_on` -> `support_override_snow_layer`
    - `enables_bubble_column_drag_down`
    - `enables_bubble_column_push_up`
    - `supports_vegetation`
    - `supports_crops`
    - `supports_stem_crops`
    - `supports_stem_fruit`
    - `supports_pumpkin_stem`
    - `supports_melon_stem`
    - `supports_pumpkin_stem_fruit`
    - `supports_melon_stem_fruit`
    - `supports_sugar_cane`
    - `supports_sugar_cane_adjacently`
    - `supports_cactus`
    - `supports_chorus_plant`
    - `supports_chorus_flower`
    - `supports_nether_sprouts`
    - `supports_azalea`
    - `supports_warped_fungus`
    - `supports_crimson_fungus`
    - `supports_mangrove_propagule`
    - `supports_hanging_mangrove_propagule`
    - `supports_nether_wart`
    - `supports_crimson_roots`
    - `supports_warped_roots`
    - `supports_wither_rose`
    - `supports_cocoa`
    - `supports_lily_pad`
    - `supports_frogspawn`
    - `support_override_cactus_flower`
    - `cannot_support_seagrass`
    - `cannot_support_kelp`
    - `grows_crops`
    - `mud`
    - `moss_blocks`
    - `grass_blocks`
    - `substrate_overworld`
    - `beneath_tree_podzol_replaceable`
    - `beneath_bamboo_podzol_replaceable`
    - `cannot_replace_below_tree_trunk`
    - `ice_spike_replaceable`
    - `forest_rock_can_place_on`
    - `huge_brown_mushroom_can_place_on`
    - `huge_red_mushroom_can_place_on`
    - `prevents_nearby_leaf_decay`
- `minecraft:enchantment`
    - `trades/desert_special` 已删除
    - `trades/jungle_special` 已删除
    - `trades/plains_special` 已删除
    - `trades/savanna_special` 已删除
    - `trades/snow_special` 已删除
    - `trades/swamp_special` 已删除
    - `trades/taiga_special` 已删除
- `minecraft:entity_type`
    - `cannot_be_age_locked`
- `minecraft:fluid`
    - `supports_sugar_cane_adjacently`
    - `supports_lily_pad`
    - `supports_frogspawn`
    - `bubble_column_can_occupy`
- `minecraft:item`
    - `metal_nuggets`
    - `dyeable` 已删除，分为：
        - `dyes`
        - `loom_dyes`
        - `loom_patterns`
        - `cauldron_can_remove_due`
        - `cat_collar_dyes`
        - `wolf_collar_dyes`
    - `mud`
    - `moss_blocks`
    - `grass_blocks`
- `minecraft:potion`
    - `tradable`
- `minecraft:worldgen/configured_feature`
    - `can_spawn_from_bone_meal`

### 添加列表 {#list-of-additions}

- `net.minecraft.advancements.criterion`
    - `FoodPredicate`- 可以检查食物水平和饱和度的标准谓词。
    - `MinMaxBounds`
        - `validateContainedInRange`- 返回一个函数，该函数验证目标范围并作为数据结果返回。
        - `$Bounds#asRange`- 将边界转换为 `Range`。
- `net.minecraft.client`
    - `Minecraft#sendLowDiskSpaceWarning`- 因磁盘空间不足而发送系统 toast。
    - `Options#keyDebugLightmapTexture`- 显示光照贴图纹理的键映射。
- `net.minecraft.client.gui.components`
    - `AbstractScrollArea`
        - `scrollbarWidth`- 滚动条的宽度。
        - `defaultSettings`- 构造给定滚动速率的默认滚动条设置。
        - `$ScrollbarSettings`- 包含滚动条元数据的记录。
    - `DebugScreenOverlay`
        - `showLightmapTexture`- 是否在叠加层上渲染光照贴图纹理。
        - `toggleLightmapTexture`- 切换是否应渲染光照贴图纹理。
    - `ScrollableLayout`
        - `setMinHeight`- 设置容器布局的最小高度。
        - `$ReserveStrategy`- 在布局中保留滚动条的宽度时使用什么。
    - `Tooltip`
        - `component`- 要显示的工具提示的组件。
        - `style`- 用于计算工具提示背景和框架的标识符。
- `net.minecraft.client.gui.components.debug`
    - `DebugEntryDetailedMemory`- 显示详细内存使用情况的调试条目。
    - `DebugEntryLookingAt#getHitResult`- 获取相机实体的命中结果。
    - `DebugEntryLookingAtEntityTags`- 用于显示实体标签的调试条目。
    - `DebugScreenEntries`
        - `DETAILED_MEMORY`- 详细内存使用情况调试条目的标识符。
        - `LOOKING_AT_ENTITY_TAGS`- 实体标记调试条目的标识符。
- `net.minecraft.client.gui.navigation.FocusNavigationEvent$ArrowNavigation#with`- 设置导航的上一个焦点。
- `net.minecraft.client.gui.screens.GenericWaitingScreene#createWaitingWithoutButton`- 创建等待屏幕而不显示取消按钮。
- `net.minecraft.client.gui.screens.options`
    - `DifficultyButtons`- 包含用于创建难度按钮的布局元素的类。
    - `HasGamemasterPermissionReaction`- 将选项屏幕标记为能够响应更改的游戏管理员权限的界面。
    - `OptionsScreen#getLastScreen`- 返回导航到此屏幕的上一个屏幕。
    - `WorldOptionsScreen`- 包含玩家当前所在世界选项的屏幕。
- `net.minecraft.client.gui.screens.worldselection.EditWorldScreen#conditionallyMakeBackupAndShowToast`- 如果传入的 `boolean` 为 true，则仅进行备份并显示 toast；否则，返回 `false` 未来。
- `net.minecraft.client.multiplayer.MultiPlayerGameMode#spectate`- 将数据包发送到玩家将观看给定实体的服务器。
- `net.minecraft.client.multiplayer.prediction.BlockStatePredictionHandler#onTeleport`- 当玩家在服务器上移动时运行，通常是通过某种传送（例如命令、骑乘实体）。
- `net.minecraft.client.renderer`
    - `LightmapRenderStateExtractor`- 提取光照贴图的渲染状态。
    - `UiLightmap`- 用户界面中的光照贴图。
    - `RenderPipelines`
        - `LINES_DEPTH_BIAS`- 将多边形深度偏移因子设置为 -1 并将单位设置为 -1 的渲染管道。
        - `ENTITY_CUTOUT_DISSOLVE`- 使用遮罩采样器将实体模型溶解到背景中的渲染管道。
- `net.minecraft.client.renderer.rendertype.RenderType#hasBlending`- 管道是否具有定义的混合函数。
- `net.minecraft.commands.ArgumentVisitor`- 用于访问命令参数的帮助程序。
- `net.minecraft.commands.arguments.selector.EntitySelector#COMPILABLE_CODEC`- 围绕 `EntitySelectorParser` 的 `CompilableString` Codec。
- `net.minecraft.core.component.predicates`
    - `DataComponentPredicates#VILLAGER_VARIANT`- 检查村民类型的谓词。
    - `VillagerTypePredicate`- 检查村民类型的谓词。
- `net.minecraft.core.dispenser.SpawnEggItemBehavior`- 刷怪蛋的分配器行为。
- `net.minecraft.core.registries.ConcurrentHolderGetter`- 从本地缓存读取引用的 getter，必要时与原始数据同步。
- `net.minecraft.data`
    - `BlockFamilies`
        - `END_STONE`- 端石变体系列。
        - `getFamily`- 获取基本块的系列（如果存在）。
    - `BlockFamily`
        - `$Builder#tiles`、 `$Variant#TILES`- 充当某些基本块的图块变体的块。
        - `$Builder#bricks`、 `$Variant#BRICKS`- 充当某些基础块的砖块变体的块。
        - `$Builder#cobbled`、 `$Variant#COBBLED`- 充当某些基础块的鹅卵石变体的块。
    - `DataGenerator$Uncached`- 数据生成器，不缓存有关生成的文件的任何信息。
- `net.minecraft.data.recipes.RecipeProvider`
    - `bricksBuilder`、 `tilesBuilder`- 砖块和瓷砖块变体的构建器。
    - `generateCraftingRecipe`、 `generateStonecutterRecipe`- 为给定的块系列生成适当的配方。
    - `getBaseBlock` -> `getBaseBlockForCrafting`
    - `bredAnimal`- 如果玩家将两种动物饲养在一起，则解锁配方。
- `net.minecraft.gametest.framework`
    - `GameTestEvent#createWithMinimumDelay`- 创建具有最小延迟的测试事件。
    - `GameTestHelper`
        - `getBoundsWithPadding`- 获取具有指定填充的测试区域的边界框。
        - `runBeforeTestEnd`- 在测试结束前一次运行可运行程序。
        - `despawnItem`- 使该位置距离内的所有物品实体消失。
        - `discard`- 丢弃实体。
        - `setTime`- 设置维度默认时钟的时间。
        - `placeBlock`- 将给定块放置在相对位置和方向。
    - `GameTestInstance#padding`- 每个游戏测试周围间隔的块数。
    - `GameTestSequence#thenWaitAtLeast`- 在运行可运行程序之前至少等待指定的滴答数。
- `net.minecraft.nbt.TextComponentTagVisitor`
    - `$PlainStyling`- 将 nbt 存储在组件文字映射中的样式。
    - `$RichStyling`- 一种存储带有语法突出显示和格式化的 nbt 的样式。
    - `$Styling`- 定义读取标签样式的接口。
    - `$Token`- 用于更丰富地表示标签数据的标记。
- `net.minecraft.network.chat.ResolutionContext`- 组件被解析为其中的字符串的上下文。
- `net.minecraft.network.chat.contents.NbtContents#NBT_PATH_CODEC`- 围绕 `NbtPathArgument$NbtPath` 的 `CompilableString` Codec。
- `net.minecraft.network.chat.contents.data.BlockDataSource#BLOCK_POS_CDEC`- 围绕 `Coordinates` 的 `CompilableString` Codec。
- `net.minecraft.network.protocol.game`
    - `ClientboundGameRuleValuesPacket`- 将游戏规则值以字符串形式发送到客户端的数据包。
    - `ClientboundGamePacketListener#handleGameRuleValues`- 处理从服务器发送的游戏规则值。
    - `ClientboundLowDiskSpaceWarningPacket`- 发送到客户端的数据包，警告计算机上的磁盘空间不足。
    - `ClientGamePacketListener#handleLowDiskSpaceWarning`- 处理有关磁盘空间不足的警告数据包。
    - `ServerboundAttackPacket`- 发送到服务器的关于玩家攻击的实体的数据包。
    - `ServerboundClientCommandPacket$Action#REQUEST_GAMERULE_VALUES`- 从服务器请求游戏规则值。
    - `ServerboundSetGameRulePacket`- 从客户端发送要设置的游戏规则条目的数据包。
    - `ServerboundSpectateEntityPacket`- 发送到服务器的关于玩家想要观看哪个实体的数据包。
    - `ServerGamePacketListener`
        - `handleAttack`- 处理玩家对实体的攻击。
        - `handleSpectateEntity`- 处理想要观看实体的玩家。
        - `handleSetGameRule`- 处理从客户端设置游戏规则。
- `net.minecraft.resources`
    - `FileToIdConverter#extensionMatches`- 检查标识符是否以指定扩展名结尾。
    - `Identifier`
        - `ALLOWED_NAMESPACE_CHARACTERS`- 标识符的命名空间中允许的字符。
        - `resolveAgainst`- 通过检查 `/<namespace>/<path>` 解析给定根的路径。
- `net.minecraft.server`
    - `Bootstrap#shutdownStdout`- 关闭标准输出流。
    - `MinecraftServer`
        - `DEFAULT_GAME_RULES`- 为服务器提供的默认游戏规则。
        - `warnOnLowDiskSpace`- 如果磁盘空间低于 64 MiB，则发送警告。
        - `sendLowDiskSpaceWarning`- 发送磁盘空间不足的警告。
- `net.minecraft.server.commands.SwingCommand`- 为所有目标调用 `LivingEntity#swing` 的命令。
- `net.minecraft.server.level.ServerPlayer`
    - `sendBuildLimitMessage`- 如果玩家无法在相应的 Y 方向上继续建造，则发送覆盖消息。
    - `sendSpawnProtectionMessage`- 如果玩家由于生成保护而无法修改地形，则发送覆盖消息。
- `net.minecraft.server.packs.AbstractPackResources#loadMetadata`- 加载根 `pack.mcmeta`。
- `net.minecraft.server.packs.resources.ResourceMetadata$MapBased`- 存储地图中各部分的资源元数据。
- `net.minecraft.tags.TagLoader$ElementLookup#fromGetters`- 根据给定的 `HolderGetter` 构造元素查找，具体取决于该元素是否需要。
- `net.minecraft.util`
    - `ARGB#gray`- 根据给定的亮度获取灰度颜色。
    - `CompilableString`- 一种实用程序，用于获取某些字符串模式并通过某些解析器将其编译为对象。
    - `LightCoordsUtil`- 用于根据光值确定光坐标的实用程序。
    - `ProblemReporter$MapEntryPathElement`- 地图中某些输入键的路径元素。
    - `Util#allOfEnumExcept`- 获取除提供的值之外的所有枚举的集合。
- `net.minecraft.util.thread.BlockableEventLoop#hasDelayedCrash`- 是否有排队的崩溃报告。
- `net.minecraft.util.valueproviders.TrapezoidInt`- 对梯形分布的随机值进行采样。
- `net.minecraft.world.InteractionHand#STREAM_CODEC`- 交互手的网络 Codec。
- `net.minecraft.world.attribute`
    - `AttributeType#toFloat`- 获取 `float` 形式的属性值，如果未定义，则抛出异常。
    - `AttributeTypes#INTEGER`- 整数属性类型。
    - `LerpFunction#ofInteger`- 用于整数值的 lerp 函数。
- `net.minecraft.world.attribute.modifier`
    - `AttributeModifier#INTEGER_LIBRARY`- 用于申请整数的运算符库。
    - `IntegerModifier`- 将某些参数应用于整数值的修饰符。
- `net.minecraft.world.entity`
    - `AgeableMob`
        - `AGE_LOCK_COOLDOWN_TICKS`- 实体可以被年龄锁定/解锁之前等待的滴答数。
        - `ageLockParticleTimer`- 年龄锁定/解锁时显示粒子的时间。
    - `Entity`
        - `applyEffectsFromBlocksForLastMovements`- 将任何块效果应用到该实体的最后一个移动中，由物品使用。
        - `$Flags`- 将特定值标记为实体标志位集的注释。
    - `LivingEntity#getLiquidCollisionShape`- 返回尝试与液体碰撞时实体的边界。
    - `Mob`
        - `asValidTarget`- 检查实体是否是该实体的有效目标（可以攻击）。
        - `getTargetUnchecked`- 获取原始目标而不检查其是否有效。
        - `canAgeUp`- 如果实体可以成长为更成熟的变体。
        - `setAgeLocked`、 `isAgeLocked`- 实体是否无法成长。
    - `NeutralMob#getTargetUnchecked`- 获取原始目标而不检查其是否有效。
    - `TamableAnimal#feed`- 玩家将堆栈作为食物提供，根据存储的组件或某些默认值治疗它们。
- `net.minecraft.world.entity.ai.behavior`
    - `BehaviorControl#getRequiredMemories`- 行为所需的内存列表。
    - `GoAndGiveItemsToTarget$ItemThrower`- 一个接口，用于处理由于该实体的行为而抛出某个物品时应该发生的情况。
- `net.minecraft.world.entity.ai.behavior.declarative.BehaviorBuilder$TriggerWithResult#memories`- 行为所需的内存列表。
- `net.minecraft.world.entity.ai.memory.NearestVisibleLivingEntities#nearbyEntities`- 此范围内的实体列表。
- `net.minecraft.world.entity.decoration.LeashFenceKnotEntity`
    - `getKnot`- 在给定位置查找结，否则返回空选项。
    - `createKnot`- 创建一个新结并将其添加到关卡中。
- `net.minecraft.world.entity.monster.piglin`
    - `PiglinAi`
        - `MAX_TIME_BETWEEN_HUNTS`- 猪灵再次开始狩猎之前的最大秒数。
        - `findNearbyAdultPiglins`- 返回该猪灵内存中所有成年猪灵的列表。
- `net.minecraft.world.entity.raid.Raid`
    - `getBannerComponentPatch`- 获取横幅图案的组件。
    - `getOminousBannerTemplate`- 获取全能横幅的堆栈模板。
- `net.minecraft.world.inventory.SlotRanges`
    - `MOB_INVENTORY_SLOT_OFFSET`- 生物库存的起始索引。
    - `MOB_INVENTORY_SIZE`- 生物库存的大小。
- `net.minecraft.world.item.component.BundleContents#BEEHIVE_WEIGHT`- 蜂箱的重量。
- `net.minecraft.world.item.enchantment.EnchantmentTarget#NON_DAMAGE_CODEC`- 一种仅允许攻击者和受害者结界目标的 Codec。
- `net.minecraft.world.level.block.BigDripleafBlock#canGrowInto`- 滴水叶是否可以生长到指定位置。
- `net.minecraft.world.level.block.grower.TreeGrower#getMinimumHeight`- 如果存在，则获取树干放置器的基础高度。
- `net.minecraft.world.level.block.state`
    - `BlockBehaviour$PostProcess`- 获取要标记的位置以进行后处理的接口。
    - `StateDefinition`
        - `propertiesCodec`- 状态属性的 MapCodec。
        - `isSingletonState`- 如果定义仅包含一种状态。
    - `StateHolder#isSingletonState`- 如果持有者仅包含一种状态。
- `net.minecraft.world.level.block.state.properties`
    - `NoteBlockInstrument`
        - `TRUMPET`- 铜块放置在音符块下方时发出的声音。
        - `TRUMPET_EXPOSED`- 暴露的铜块放置在音符块下方时发出的声音。
        - `TRUMPET_OXIDIZED`- 氧化铜块放置在音符块下方时发出的声音。
        - `TRUMPET_WEATHERED`- 风化铜块放置在音符块下方时发出的声音。
    - `Property$Value#valueName`- 获取值的名称。
- `net.minecraft.world.level.dimension.DimensionDefaults`
    - `BLOCK_LIGHT_TINT`- 块光的默认色调。
    - `NIGHT_VISION_COLOR`- 夜视时的默认颜色。
    - `TURTLE_EGG_HATCH_CHANCE`- 随机蜱虫孵化海龟蛋的几率。
- `net.minecraft.world.level.gamerules.GameRule#getIdentifierWithFallback`- 获取游戏规则的标识符，否则为未注册的标识符。
- `net.minecraft.world.level.levelgen`
    - `NoiseBasedChunkGenerator#getInterpolatedNoiseValue`- 获取给定位置处的插值密度，如果 Y 超出噪声设置范围，则获取非数字值。
    - `NoiseChunk#getInterpolatedDensity`- 计算完整的噪声密度。
- `net.minecraft.world.level.levelgen.feature.AbstractHugeMushroomFeature#MIN_MUSHROOM_HEIGHT`- 最小蘑菇高度。
- `net.minecraft.world.level.levelgen.feature.configurations.BlockBlobConfiguration`- 块 blob 功能的配置。
- `net.minecraft.world.level.levelgen.feature.trunkplacers.TrunkPlacer#getBaseHeight`- 返回树干的最小高度。
- `net.minecraft.world.level.levelgen.placement.RandomOffsetPlacement#ofTriangle`- 创建梯形分布以从 XZ 和 Y 范围中进行选择。
- `net.minecraft.world.level.material`
    - `FluidState#isFull`- 如果液体量为八。
    - `LavaFluid#LIGHT_EMISSION`- 熔岩流体发出的光量。
- `net.minecraft.world.level.pathfinder.PathType#BIG_MOBS_CLOSE_TO_DANGER`- 实体宽度大于方块的生物的路径恶意。
- `net.minecraft.world.level.storage.LevelStorageSource#writeWorldGenSettings`- 将世界生成设置写入其保存的数据位置。
- `net.minecraft.world.level.storage.loot.functions`
    - `EnchantRandomlyFunction$Builder#withOptions`- 指定可用于随机为该物品附魔的附魔。
    - `SetRandomDyesFunction`- 将随机染料（如果该物品位于 `dyeable` 标签中）应用于所提供列表中的 `DYED_COLOR` 组件的物品函数。
    - `SetRandomPotionFunction`- 将随机药水应用到所提供列表中的 `POTION_CONTENTS` 组件的物品函数。
- `net.minecraft.world.level.storage.loot.parameters.LootContextParams#ADDITIONAL_COST_COMPONENT_ALLOWED`- 如果所需堆栈或修改器需要，使交易能够产生额外成本。
- `net.minecraft.world.level.storage.loot.predicates.EnvironmentAttributeCheck`- 检查给定属性是否与提供的值匹配的战利品条件。
- `net.minecraft.world.level.storage.loot.providers.number`
    - `EnvironmentAttributeValue`- 获取浮点型属性值的提供程序。
    - `Sum`- 汇总所有提供的号码提供商的值的提供商。
- `net.minecraft.world.phys.AABB$Builder#isDefined`- 检查是否至少有一个点构成边界框。

### 变更列表 {#list-of-changes}

- `net.minecraft.advancements.criterion`
    - `EntityTypePredicate#matches` 现在采用支架包装的 `EntityType` 而不是原始类型本身
    - `KilledTrigger$TriggerInstance#entityPredicate` -> `entity`
    - `PlayerPredicate` 现在采用 `FoodPredicate`
        - 可以使用 `PlayerPredicate$Builder#setFood` 进行设置
- `net.minecraft.client.gui`
    - `GuiGraphics`
        - `blit` 现在具有接收 `GpuTextureView` 和 `GpuSampler` 的过载
        - `setTooltipForNextFrame` 现在有一个重载，它接受工具提示的 `FormattedCharSequence` 列表以及是否替换任何现有的工具提示
    - `ItemSlotMouseAction#onSlotClicked` 现在采用 `ContainerInput` 而不是 `ClickType`
- `net.minecraft.client.gui.components`
    - `AbstractContainerWidget` 现在接收 `AbstractScrollArea$ScrollbarSettings`
    - `AbstractScrollArea` 现在接收 `AbstractScrollArea$ScrollbarSettings`
        - `scrollbarVisible` -> `scrollable`
        - `scrollBarY` 现已公开
        - `scrollRate` 现在不再是抽象的
    - `AbstractTextAreaWidget` 现在接收 `AbstractScrollArea$ScrollbarSettings`
    - `PopupScreen$Builder#setMessage`->`addMessage`，不是一对一
    - `ScrollableLayout$Container` 现在接收 `AbstractScrollArea$ScrollbarSettings`
    - `Tooltip#create` 现在有一个重载，可采用可选的 `TooltipComponent` 和样式 `Identifier`
- `net.minecraft.client.gui.components.debug`
    - `DebugEntryLookingAtBlock`, `DebugEntryLookingAtFluid` -> `DebugEntryLookingAt`
        - 更具体地说，`$BlockStateInfo`、 `$BlockTagInfo`、 `$FluidStateInfo`、 `$FluidTagInfo`
    - `DebugEntryLookingAtEntity#GROUP` 现已公开
    - `DebugScreenEntries`
        - `LOOKING_AT_BLOCK` -> `LOOKING_AT_BLOCK_STATE`, `LOOKING_AT_BLOCK_TAGS`
        - `LOOKING_AT_FLUID` -> `LOOKING_AT_FLUID_STATE`, `LOOKING_AT_FLUID_TAGS`
    - `DebugScreenEntryList` 现在采用 `DataFixer`
- `net.minecraft.client.gui.components.tabs.TabNavigationBar#setWidth`->`updateWidth`，不是一对一
- `net.minecraft.client.gui.navigation.FocusNavigationEvent$ArrowNavigation` 现在采用可为空的 `ScreenRectangle` 作为前一个焦点
- `net.minecraft.client.gui.screens`
    - `ConfirmScreen#layout` 现已最终确定
    - `DemoIntroScreen` 替换为 `ClientPacketListener#openDemoIntroScreen`，现已私有
    - `GenericWaitingScreen` 现在采用三个 `boolean` 来显示加载点、取消按钮以及屏幕是否应在退出时关闭
- `net.minecraft.client.gui.screens.inventory.AbstractMountInventoryScreen#mount` 现已最终确定
- `net.minecraft.client.gui.screens.options`
    - `OptionsScreen` 现在实现 `HasGamemasterPermissionReaction`
        - 构造函数现在接受 `boolean` 来判断玩家当前是否在一个世界中
        - `createDifficultyButton` 现在在 `WorldOptionsScreen#createDifficultyButtons` 内处理，而不是一对一
    - `WorldOptionsScreen` 现在实现 `HasGamemasterPermissionReaction`
        - `createDifficultyButtons`->`DifficultyButtons#create`，现已公开
- `net.minecraft.client.multiplayer`
    - `ClientLevel#syncBlockState` 现在可以占据可为空的玩家位置
    - `MultiPlayerGameMode#handleInventoryMouseClick` 现在采用 `ContainerInput` 而不是 `ClickType`
    - `WeatherEffectRenderer#render` 不再包含 `MultiBufferSource`
- `net.minecraft.client.renderer.block.ModelBlockRenderer$Cache#getLightColor` -> `getLightCoords`
- `net.minecraft.client.renderer.blockentity.state`
    - `BrushableBlockRenderState#itemState` 现已最终确定
    - `EndPortalRenderState` 现在是最后一组 `Direction`，而不是 `EnumSet`
    - `ShelfRenderState#items` 现已最终确定
- `net.minecraft.client.renderer.entity.state`
    - `FallingBlockRenderState#movingBlockRenderState` 现已最终确定
    - `HumanoidRenderState#attackArm` -> `ArmedEntityRenderState#attackArm`
    - `WitherRenderState#xHeadRots`、 `yHeadRots` 现已最终确定
- `net.minecraft.client.resources.sounds.AbstractSoundInstance#random` 现已最终确定
- `net.minecraft.commands.SharedSuggestionProvider#getCustomTabSugggestions` -> `getCustomTabSuggestions`
- `net.minecraft.commands.arguments.ComponentArgument#getResolvedComponent` 现在接受不可为 null 的 `Entity`
- `net.minecraft.commands.arguments.selector.SelectorPattern` 替换为 `CompilableString`
- `net.minecraft.core.HolderGetter$Provider#get`、 `getOrThrow` 现在具有吸收 `TagKey` 的重载
- `net.minecraft.data`
    - `BlockFamily`
        - `shouldGenerateRecipe` -> `shouldGenerateCraftingRecipe`, `shouldGenerateStonecutterRecipe`
        - `$Builder#dontGenerateRecipe` -> `dontGenerateCraftingRecipe`, `generateStonecutterRecipe`
    - `DataGenerator` 现在是抽象的
        - 构造函数现在仅接受 `Path` 输出，而不是 `WorldVersion` 或是否始终生成
            - 原始实现可以在 `DataGenerator$Cached` 中找到
        - `run` 现在是抽象的
    - `Main#addServerProviders`->`addServerDefinitionProviders`，不再接受开发 `boolean`，不是一对一
    - 剩余的逻辑已放入 `addServerConverters`，接受开发 `boolean`，但不接受报告 `boolean`
- `net.minecraft.data.loot.BlockLootSubProvider`
    - `explosionResistant` 现已私有
    - `enabledFeatures` 现已私有
    - `map` 现已私有
- `net.minecraft.data.recipes`
    - `RecipeProvider$FamilyRecipeProvider` -> `$FamilyCraftingRecipeProvider`, `$FamilyStonecutterRecipeProvider`
    - `SingleItemRecipeBuilder#stonecutting` 移至 `BlockFamily` 上的参数
- `net.minecraft.data.structures.SnbtToNbt` 现在具有接受单个输入文件夹路径的重载
- `net.minecraft.gametest.framework`
    - `GameTestHelper`
        - `assertBlockPresent` 现在有一个重载，仅接受块来检查
        - `moveTo` 现在具有用于接收 `BlockPos` 和 `Vec3` 位置的重载
        - `assertEntityInstancePresent` 现在有一个重载，可以（通过 `double`）膨胀边界框以检查其中的实体
    - `GameTestServer#create` 现在采用 `int` 作为运行所有匹配测试的次数
    - `StructureUtils#testStructuresDir` 拆分为 `testStructuresTargetDir`、 `testStructuresSourceDir`
    - `TestData` 现在采用 `int` 作为测试周围填充的块数
- `net.minecraft.nbt`
    - `NbtUtils`
        - `addDataVersion` 现在使用 `Dynamic` 的通用名称，而不是显式的 nbt 标签
        - `getDataVersion` 现在有一个重载，如果未指定版本，则默认为 -1
    - `TextComponentTagVisitor` 现在可以接受 `$Styling` 和 `boolean` 是否对键进行排序
        - `handleEscapePretty` 现在是 `protected` 静态的 `private` 实例方法
- `net.minecraft.network.FriendlyByteBuf`
    - `readVec3`、 `writeVec3` 替换为 `Vec3#STREAM_CODEC`
    - `readLpVec3`、 `writeLpVec3` 替换为 `Vec3#LP_STREAM_CODEC`
- `net.minecraft.network.chat`
    - `Component`
        - `nbt` 现在采用 `CompilableString` 而不是 `String`
        - `object` 现在具有接收 `Component` 回退的过载
    - `ComponentContents#resolve` 现在采用 `ResolutionContext` 而不是 `CommandSourceStack` 和 `Entity`
    - `ComponentUtils#updateForEnttiy`->`resolve`，采用 `ResolutionContext` 而不是 `CommandSourceStack` 和 `Entity`
    - `LastSeenMessages#EMPTY` 现已最终确定
- `net.minecraft.network.chat.contents`
    - `NbtContents` 现在是一条记录，构造函数采用 `CompilableString` 而不是 `String`
    - `ObjectContents` 现在采用可选的 `Component` 作为后备（如果其内容无法验证）
- `net.minecraft.network.chat.contents.data`
    - `BlockDataSource` 现在为 `Coordinates` 采用 `CompilableString`，而不是模式和编译位置
    - `EntityDataSource` 现在为 `EntitySelector` 采用 `CompilableString`，而不是模式和编译选择器
- `net.minecraft.network.chat.contents.objects.ObjectInfo#description` -> `defaultFallback`
- `net.minecraft.network.protocol.game`
    - `ClientboundSetEntityMotionPacket` 现已创纪录
    - `ServerboundContainerClickPacket` 现在采用 `ContainerInput` 而不是 `ClickType`
    - `ServerboundInteractPacket` 现已成为一条记录，正在获取 `Vec3` 交互位置
- `net.minecraft.references`
    - `Blocks` -> `BlockIds`
    - `Items` -> `ItemIds`
- `net.minecraft.resources`
    - `FileToIdConverter` 现已创纪录
    - `RegistryDataLoader#load` 现在返回冻结注册表访问的 `CompletableFuture`
- `net.minecraft.server.MinecraftServer` 现在接受 `boolean` 是否传播崩溃，通常是引发延迟崩溃
    - `throwIfFatalException`->`BlockableEventLoop#throwDelayedException`，现在是私有的，不是一对一的
    - `setFatalException`->`BlockableEventLoop#delayCrash`,`relayDelayCrash`;不是一对一的
- `net.minecraft.server.commands.ChaseCommand#DIMENSION_NAMES` 现已最终确定
- `net.minecraft.server.dedicated.DedicatedServerProperties#acceptsTransfers` 现已最终确定
- `net.minecraft.server.packs`
    - `BuiltInMetadata` 已合并为 `ResourceMetadata`
        - `get` -> `ResourceMetadata#getSection`
        - `of` -> `ResourceMetadata#of`
    - `PathPackResources#getNamespaces` 现在有一个静态重载，它接受根目录 `Path`
    - `原版 PackResourcesBuilder#setMetadata` 现在采用 `ResourceMetadata` 而不是 `BuiltInMetadata`
- `net.minecraft.server.players.OldUsersConverter#serverReadyAfterUserconversion` 替换为 `areOldUserListsRemoves`，现在为 `public`
- `net.minecraft.tags.TagLoader`
    - `loadTagsFromNetwork` 现在采用 `Registry` 而不是 `WritableRegistry`，将标签键映射返回到持有者条目列表
    - `loadTagsForRegistry` 现在有一个重载，它接受注册表项和元素查找，将标签键的映射返回到持有者条目列表
- `net.minecraft.util`
    - `Brightness`
        - `pack` -> `LightCoordsUtil#pack`
        - `block` -> `LightCoordsUtil#block`
        - `sky` -> `LightCoordsUtil#sky`
    - `RandomSource#createNewThreadLocalInstance` -> `createThreadLocalInstance`
        - 现在有一个重载来指定种子
    - `Util#copyAndAdd` 现在有一个重载，它接受元素的可变参数
- `net.minecraft.util.thread`
    - `BlockableEventLoop` 现在接受 `boolean` 是否传播崩溃，通常是引发延迟崩溃
    - `ReentrantBlockableEventLoop` 现在接受 `boolean` 是否传播崩溃，通常是引发延迟崩溃
- `net.minecraft.world.InteractionResult$ItemContext#NONE`、 `DEFAULT` 现已最终确定
- `net.minecraft.world.attribute`
    - `AttributeType` 现在采用 `ToFloatFunction` 在号码提供商中使用
        - `ofInterpolated` 现在采用 `ToFloatFunction`
    - `EnvironmentAttributeReader#getValue` 现在具有接收 `LootContext` 的过载
- `net.minecraft.world.entity`
    - `Avatar` 现在是抽象的
    - `Entity`
        - `fluidHeight` 现已最终确定
        - `getTags` -> `entityTags`
        - `getRandomY` 现在具有指定点差 `double` 的重载
    - `Leashable$Wrench#ZERO` 现已最终确定
    - `LivingEntity`
        - `interpolation` 现已最终确定
        - `swingingArm` 现在可为空
        - `canAttackType`->`canAttack`，不是一对一，采用 `LivingEntity` 而不是 `EntityType`
        - `lungeForwardMaybe` -> `postPiercingAttack`
        - `entityAttackRange`->`getAttackRangeWith`，现在接收用于攻击的 `ItemStack`
- `net.minecraft.world.entity.ai.behavior`
    - `GoAndGiveItemsToTarget` 现在包含 `$ItemThrower`
        - `throwItem`->`BehaviorUtils#throwItem`，不是一对一
    - `SpearAttack` 不再考虑接近距离 `float`
    - `TryLaySpawnOnWaterNearLand`->`TryLaySpawnOnFluidNearLand`，不是一对一
- `net.minecraft.world.entity.ai.behavior.declarative.BehaviorBuilder#sequence` 现在在第二个条目中采用 `Oneshot`，而不是 `Trigger`
- `net.minecraft.world.entity.ai.goal`
    - `BoatGoals` -> `FollowPlayerRiddenEntityGoal$FollowEntityGoal`
        - `BOAT` 替换为 `ENTITY`
    - `FollowBoatGoal`->`FollowPlayerRiddenEntityGoal`，不是一对一
- `net.minecraft.world.entity.ai.goal.target.NearestAttackableTargetGoal#targetConditions` 现已最终确定
- `net.minecraft.world.entity.ai.sensing.NearestVisibleLivingEntitySensor#getMemory` -> `getMemoryToSet`
- `net.minecraft.world.entity.decoration.Mannequin#getProfile`->`Avatar#getProfile`，现在为 `public` 和 `abstract`
    - 仍然在 `Mannequin` 中实现
- `net.minecraft.world.entity.item.ItemEntity#DEFAULT_HEALTH` 现在从 `private` 变为 `public`
- `net.minecraft.world.entity.monster.breeze.Breeze#idle`、 `slide`、 `slideBack`、 `longJump`、 `shoot`、 `inhale` 现已最终确定
- `net.minecraft.world.entity.monster.piglin.PiglinAi#isZombified` 现在采用 `Entity` 而不是 `EntityType`
- `net.minecraft.world.entity.monster.warden.Warden#roarAnimationState`、 `sniffAnimationState`、 `emergeAnimationState`、 `diggingAnimationState`、 `attackAnimationState`、 `sonicBoomAnimationState` 现已最终确定
- `net.minecraft.world.entity.monster.zombie.Zombie#handleAttributes` 现在包含 `EntitySpawnReason`
- `net.minecraft.world.entity.player`
    - `Input#EMPTY` 现已最终确定
    - `Player`
        - `currentImpulseImpactPos` -> `LivingEntity#currentImpulseImpactPos`
        - `currentExplosionCause` -> `LivingEntity#currentExplosionCause`
        - `setIgnoreFallDamageFromCurrentImpulse` -> `LivingEntity#setIgnoreFallDamageFromCurrentImpulse`
        - `applyPostImpulseGraceTime` -> `LivingEntity#applyPostImpulseGraceTime`
        - `isIgnoringFallDamageFromCurrentImpulse` -> `LivingEntity#isIgnoringFallDamageFromCurrentImpulse`
        - `tryResetCurrentImpulseContext` -> `LivingEntity#tryResetCurrentImpulseContext`
        - `resetCurrentImpulseContext` -> `LivingEntity#resetCurrentImpulseContext`
        - `isInPostImpulseGraceTime` -> `LivingEntity#isInPostImpulseGraceTime`
        - `isWithinAttackRange` 现在接受 `ItemStack` 的攻击
- `net.minecraft.world.entity.vehicle.minecart.NewMinecartBehavior$MinecartStep#EMPTY` 现已最终确定
- `net.minecraft.world.inventory.AbstractContainerMenu#getQuickCraftPlaceCount` 现在接受快速工艺槽的数量，而不是槽组本身
- `net.minecraft.world.item`
    - `BundleItem#getSelectedItem` -> `getSelectedItemIndex`
    - `CreativeModeTab$Output` 现在从 `public` 变为 `protected`
    - `EnderpearlItem#PROJECTILE_SHOOT_POWER` 现已最终确定
    - `Item$Properties#requiredFeatures` 现在具有接收 `FeatureFlagSet` 的过载
    - `Items#register*` 方法现在从 `public` 变为 `private`
    - `ItemUtils#onContainerDestroyed` 现在接受 `ItemStack` 的 `Stream`，而不是 `Iterable`
    - `SignApplicator#tryApplyToSign`、 `canApplyToSign` 现在采用正在使用的 `ItemStack`
    - `SnowballItem#PROJECTILE_SHOOT_POWER` 现已最终确定
    - `ThrowablePotionItem#PROJECTILE_SHOOT_POWER` 现已最终确定
    - `WindChargeItem#PROJECTILE_SHOOT_POWER` 现已最终确定
- `net.minecraft.world.item.alchemy.Potions` 现在处理 `Holder$Reference` 而不是超级 `Holder`
- `net.minecraft.world.item.component`
    - `AttackRange`
        - `minRange` -> `minReach`
        - `maxRange` -> `maxReach`
        - `minCreativeRange` -> `minCreativeReach`
        - `maxCreativeRange` -> `maxCreativeReach`
    - `BundleContents`
        - `weight` 现在返回 `DataResult` 包装的 `Fraction` 而不是原始对象
        - `getSelectedItem` -> `getSelectedItemIndex`
    - `WrittenBookContent`
        - `tryCraftCopy` -> `craftCopy`
        - `resolveForItem`、 `resolve` 现在采用 `ResolutionContext` 和 `HolderLookup$Provider`，而不是 `CommandSourceStack` 和 `Player`
- `net.minecraft.world.item.enchantment`
    - `ConditionalEffect#codec` 不再包含 `ContextKeySet`
    - `Enchantment#doLunge` -> `doPostPiercingAttack`
    - `EnchantmentHelper#doLungeEffects` -> `doPostPiercingAttackEffects`
    - `TargetedConditionalEffect#codec`、 `equipmentDropsCodec` 不再纳入 `ContextKeySet`
- `net.minecraft.world.item.enchantment.effects.EnchantmentAttributeEffect#CODEC` -> `MAP_CODEC`
- `net.minecraft.world.item.equipment.Equippable#canBeEquippedBy` 现在采用支架包装的 `EntityType` 而不是原始类型本身
- `net.minecraft.world.item.trading.VillagerTrades#LIBRARIAN_5_EMERALD_NAME_TAG` 替换为 `LIBRARIAN_5_EMERALD_YELLOW_CANDLE`、 `LIBRARIAN_5_EMERALD_RED_CANDLE`，不是一对一
    - 原交易已转移至 `WANDERING_TRADER_EMERALD_NAME_TAG`
- `net.minecraft.world.level`
    - `LevelAccessor` 不再实现 `LevelReader`
    - `LevelHeightAccessor#isInsideBuildHeight` 现在具有接收 `BlockPos` 的过载
- `net.minecraft.world.level.block`
    - `BigDripleafBlock#canPlaceAt` 现在采用 `LevelReader` 而不是 `LevelHeightAccessor`，并且不再采用旧状态
    - `BubbleColumnBlock#updateColumn` 现在采用气泡塔 `Block`
    - `FireBlock#setFlammable` 现在从 `public` 变为 `private`
    - `MultifaceSpreader$DefaultSpreaderConfig#block` 现已最终确定
    - `SnowyDirtBlock` -> `SnowyBlock`
    - `SpreadingSnowyDirtBlock` -> `SpreadingSnowyBlock`
        - 构造函数现在采用 `ResourceKey` 作为“基础”块，或者当雪或任何其他装饰（例如草）被移除时的块
- `net.minecraft.world.level.block.entity.TestInstanceBlockEntity`
    - `getTestBoundingBox`- 测试的边界框通过其填充而膨胀。
    - `getTestBounds`- 测试的轴对齐边界框通过其填充进行膨胀。
- `net.minecraft.world.level.block.entity.vault`
    - `VaultConfig#DEFAULT`、 `CODEC` 现已最终确定
    - `VaultServerData#CODEC` 现已最终确定
    - `VaultSharedData#CODEC` 现已最终确定
- `net.minecraft.world.level.block.state`
    - `BlockBehaviour`
        - `$BlockStateBase` 现在接受一组 `Property` 和 `Comparable` 值，而不是一个值映射，并且不再接受 `MapCodec`
            - `hasPostProcess`->`getPostProcessPos`，不是一对一
`$Properties#hasPostProcess`->`getPostProcessPos`，不是一对一
    - `BlockState` 现在接受一组 `Property` 和 `Comparable` 值，而不是一个值映射，并且不再接受 `MapCodec`
    - `StateHolder` 现在接受一组 `Property` 和 `Comparable` 值，而不是一个值映射，并且不再接受 `MapCodec`
        - `populateNeighbours`->`initializeNeighbors`，现在包私有而不是 `public`；不是一对一的
        - `getValues` 现在返回 `Property$Value` 流
        - `codec` 现在接受从某个对象获取状态定义的函数
- `net.minecraft.world.level.chunk.ChunkAccess#blendingData` 现已最终确定
- `net.minecraft.world.level.chunk.storage.SimpleRegionStorage#upgradeChunkTag` 现在采用 `int` 作为目标版本
- `net.minecraft.world.level.gameevent.vibrations.VibrationSystem$Data#CODEC` 现已最终确定
- `net.minecraft.world.level.gamerules.GameRules` 现在具有接收 `GameRule` 列表的重载
- `net.minecraft.world.level.levelgen`
    - `NoiseRouterData#caves` 不再将 `HolderGetter` 纳入 `NormalNoise$NoiseParameters`
    - `WorldDimensions#keysInOrder` 现在接受一组 `LevelStem` 键而不是流
- `net.minecraft.world.level.levelgen.blockpredicates`
    - `TrueBlockPredicate#INSTANCE` 现已最终确定
    - `UnobstructedPredicate#INSTANCE` 现已最终确定
- `net.minecraft.world.level.levelgen.feature`
    - `AbstractHugeMushrromFeature`
        - `isValidPosition` 现在采用 `WorldGenLevel` 而不是 `LevelAccessor`
        - `placeTrunk` 现在采用 `WorldGenLevel` 而不是 `LevelAccessor`
        - `makeCap` 现在采用 `WorldGenLevel` 而不是 `LevelAccessor`
    - `BlockBlobFeature` 现在使用 `BlockBlobConfiguration` 通用
    - `Feature`
        - `FOREST_ROCK` 替换为 `BLOCK_BLOB`
        - `ICE_SPIKE` 替换为 `SPIKE`
    - `IceSpikeFeature`->`SpikeFeature`，不是一对一
        - `SpikeFeature` 现在是 `EndSpikeFeature`，不是一对一
            - `NUMBER_OF_SPIKES` -> `EndSpikeFeature#NUMBER_OF_SPIKES`
            - `getSpikesForLevel` -> `EndSpikeFeature#getSpikesForLevel`
- `net.minecraft.world.level.levelgen.feature.configurations`
    - `HugeMushroomFeatureConfiguration` 现在是一个记录，在 `BlockPredicate` 上取一个罐头
    - `SpikeConfiguration`->`EndSpikeConfiguration` 现在是一个记录
        - 原来的 `SpikeConfiguration` 现在用于冰钉，接收要使用的块，以及放置位置以及是否可以替换现有块的谓词
    - `TreeConfiguration`
        - `dirtProvider`、 `forceDirt` 已替换为 `belowTrunkProvider`
            - `dirtProvider` 常用 `CAN_PLACE_BELOW_OVERWORLD_TRUNKS`
            - `forceDirt` 常用 `PLACE_BELOW_OVERWORLD_TRUNKS`
        - `$TreeConfigurationBuilder`
            - `dirtProvider`、 `dirt`、 `forceDirt` 已替换为 `belowTrunkProvider`
- `net.minecraft.world.level.levelgen.feature.foliageplacers.FoliagePlacer`
    - `createFoliage` 现在采用 `WorldGenLevel` 而不是 `LevelSimulatedReader`
    - `placeLeavesRow`、 `placeLeavesRowWithHangingLeavesBelow` 现在采用 `WorldGenLevel` 而不是 `LevelSimulatedReader`
    - `tryPlaceExtension`、 `tryPlaceLeaf` 现在采用 `WorldGenLevel` 而不是 `LevelSimulatedReader`
- `net.minecraft.world.level.levelgen.feature.rootplacers.RootPlacer#placeRoots`、 `placeRoot` 现在采用 `WorldGenLevel` 而不是 `LevelSimulatedReader`
- `net.minecraft.world.level.levelgen.feature.stateproviders`
    - `BlockStateProvider#getState` 现在包含 `WorldGenLevel`
- `net.minecraft.world.level.levelgen.feature.treedecorators`
    - `TreeDecorator$Context` 现在采用 `WorldGenLevel` 而不是 `LevelSimulatedReader`
        - `level` 现在返回 `WorldGenLevel` 而不是 `LevelSimulatedReader`
- `net.minecraft.world.level.levelgen.feature.trunkplacers.TrunkPlacer`
    - `placeTrunk` 现在采用 `WorldGenLevel` 而不是 `LevelSimulatedReader`
    - `setDirtAt`->`placeBelowTrunkBlock`，现在采用 `WorldGenLevel` 而不是 `LevelSimulatedReader`
    - `placeLog` 现在采用 `WorldGenLevel` 而不是 `LevelSimulatedReader`
    - `placeLogIfFree` 现在采用 `WorldGenLevel` 而不是 `LevelSimulatedReader`
    - `validTreePos` 现在采用 `WorldGenLevel` 而不是 `LevelSimulatedReader`
    - `isFree` 现在采用 `WorldGenLevel` 而不是 `LevelSimulatedReader`
- `net.minecraft.world.level.levelgen.placement.BiomeFilter#CODEC` 现已最终确定
- `net.minecraft.world.level.levelgen.structure.TemplateStructurePiece#template`、 `placeSettings` 现已最终确定
- `net.minecraft.world.level.levelgen.structure.pools.alias`
    - `DirectPoolAlias#CODEC` 现已最终确定
    - `RandomGroupPoolAlias#CODEC` 现已最终确定
    - `RandomPoolAlias#CODEC` 现已最终确定
- `net.minecraft.world.level.levelgen.structure.templatesystem.LiquidSettings#CODEC` 现已最终确定
- `net.minecraft.world.level.levelgen.synth.PerlinNoise#getValue` 不再考虑 `boolean` 是否平坦 Y 值而不是应用频率因子
- `net.minecraft.world.level.material.FluidState` 现在接受一组 `Property` 和 `Comparable` 值，而不是一个值映射，并且不再接受 `MapCodec`
- `net.minecraft.world.level.pathfinder.PathType`
    - `DANGER_POWDER_SNOW` -> `ON_TOP_OF_POWDER_SNOW`
    - `DANGER_FIRE` -> `FIRE_IN_NEIGHBOR`
    - `DAMAGE_FIRE` -> `FIRE`
    - `DANGER_OTHER` -> `DAMAGING_IN_NEIGHBOR`
    - `DAMAGE_OTHER` -> `DAMAGING`,
    - `DANGER_TRAPDOOR` -> `ON_TOP_OF_TRAPDOOR`
- `net.minecraft.world.level.saveddata.maps.MapItemSavedData#tickCarriedBy` 现在接受可为 null 的 `ItemFrame`
- `net.minecraft.world.level.storage.loot.functions`
    - `EnchantRandomlyFunction` 现在接受 `boolean` 是否包括来自被附魔的堆栈的额外贸易成本部分
        - 通过 `$Builder#includeAdditionalCostComponent` 设置
    - `EnchantWithLevelsFunction` 现在接受 `boolean` 是否包括来自被附魔的堆栈的额外贸易成本部分
        - 通过 `$Builder#includeAdditionalCostComponent` 设置
        - `$Builder#fromOptions`->`withOptions`，现在具有过载功能以接收可选的 `HolderSet`

### 删除清单 {#list-of-removals}

- `net.minecraft.SharedConstants#USE_WORKFLOWS_HOOKS`
- `net.minecraft.client.data.models.BlockModelGenerators#createGenericCube`
- `net.minecraft.client.Minecraft#delayCrashRaw`
- `net.minecraft.client.gui.components.EditBox#setFilter`
- `net.minecraft.client.multiplayer.ClientPacketListener#getId`
- `net.minecraft.client.renderer.Sheets`
    - `shieldSheet`
    - `bedSheet`
    - `shulkerBoxSheet`
    - `signSheet`
    - `hangingSignSheet`
    - `chestSheet`
- `net.minecraft.client.renderer.rendertype.RenderTypes#weather`
- `net.minecraft.data.loot.BlockLootSubProvider(Set, FeatureFlagSet, Map, HolderLookup$Provider)`
- `net.minecraft.gametest.framework.StructureUtils#DEFAULT_TEST_STRUCTURES_DIR`
- `net.minecraft.nbt.NbtUtils`
    - `addCurrentDataVersion`
    - `prettyPrint(Tag)`
- `net.minecraft.server.packs.AbstractPackResources#getMetadataFromStream`
- `net.minecraft.server.players.PlayerList#getSingleplayerData`
- `net.minecraft.util`
    - `Mth#createInsecureUUID`
    - `LightCoordsUtil#UI_FULL_BRIGHT`
- `net.minecraft.world`
    - `ContainerListener`
    - `Difficulty#getKey`
    - `SimpleContainer#addListener`, `removeListener`
- `net.minecraft.world.entity.ai.memory.MemoryModuleType#INTERACTABLE_DOORS`
- `net.minecraft.world.entity.monster.Zoglin#MEMORY_TYPES`
- `net.minecraft.world.entity.monster.creaking.Creaking#MEMORY_TYPES`
- `net.minecraft.world.entity.monster.hogling.Hoglin#MEMORY_TYPES`
- `net.minecraft.world.item`
    - `BundleItem#hasSelectedItem`
    - `Item#getName()`
    - `ItemStack`
        - `isFramed`, `getFrame`
        - `setEntityRepresentation`, `getEntityRepresentation`
- `net.minecraft.world.item.component`
    - `BundleContents`
        - `getItemUnsafe`
        - `hasSelectedItem`
    - `WrittenBookContent#MAX_CRAFTABLE_GENERATION`
- `net.minecraft.world.level.block.LiquidBlock#SHAPE_STABLE`
- `net.minecraft.world.level.levelgen.feature`
    - `Feature#isStone`, `isDirt`, `isGrassOrDirt`
- `net.minecraft.world.level.levelgen.material.WorldGenMaterialRule`
- `net.minecraft.world.level.storage.loot.functions.SetOminousBottleAmplifierFunction#amplifier`

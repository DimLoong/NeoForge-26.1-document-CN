# 战利品条件 {#loot-conditions}

战利品条件用于检查某个[战利品项][entry]或[战利品池][pool]在当前语境下是否应被使用。两种情况都会定义一列条件；只有当所有条件都通过时，该项或池才会被使用。在数据生成期间，通过用目标条件的实例调用 `#when`，把它们添加到 `LootPoolEntryContainer.Builder<?>` 或 `LootPool.Builder`。本文将概述可用的战利品条件。要创建你自己的战利品条件，参见[自定义战利品条件][custom]。

## `minecraft:inverted` {#minecraftinverted}

该条件接受另一个条件并对其结果取反。需要另一个条件所需的任何战利品参数。

```json5
{
    "condition": "minecraft:inverted",
    "term": {
        // Some other loot condition.
    }
}
```

在数据生成期间，用要取反的条件调用 `InvertedLootItemCondition#invert` 来构建该条件的构建器。

## `minecraft:all_of` {#minecraftall_of}

该条件接受任意数量的其他条件，若所有子条件都返回 true 则返回 true。若列表为空，则返回 false。需要其他条件所需的任何战利品参数。

```json5
{
    "condition": "minecraft:all_of",
    "terms": [
        {
            // A loot condition.
        },
        {
            // Another loot condition.
        },
        {
            // Yet another loot condition.
        }
    ]
}
```

在数据生成期间，用所需的条件调用 `AllOfCondition#allOf` 来构建该条件的构建器。

## `minecraft:any_of` {#minecraftany_of}

该条件接受任意数量的其他条件，若至少一个子条件返回 true 则返回 true。若列表为空，则返回 false。需要其他条件所需的任何战利品参数。

```json5
{
    "condition": "minecraft:any_of",
    "terms": [
        {
            // A loot condition.
        },
        {
            // Another loot condition.
        },
        {
            // Yet another loot condition.
        }
    ]
}
```

在数据生成期间，用所需的条件调用 `AnyOfCondition#anyOf` 来构建该条件的构建器。

## `minecraft:random_chance` {#minecraftrandom_chance}

该条件接受一个表示 0 到 1 之间概率的[数值提供器][numberprovider]，并根据该概率随机返回 true 或 false。数值提供器一般不应返回 `[0, 1]` 区间之外的值。

```json5
{
    "condition": "minecraft:random_chance",
    // A constant 50% chance for the condition to apply. 
    "chance": 0.5
}
```

在数据生成期间，用数值提供器或一个（常量）浮点值调用 `LootItemRandomChanceCondition#randomChance` 来构建该条件的构建器。

## `minecraft:random_chance_with_enchanted_bonus` {#minecraftrandom_chance_with_enchanted_bonus}

该条件接受一个附魔 id、一个 [`LevelBasedValue`][numberprovider] 以及一个常量后备浮点值。若指定的附魔存在，则从 `LevelBasedValue` 查询一个值。若指定的附魔不存在，或无法从 `LevelBasedValue` 获取到值，则使用常量后备值。随后该条件随机返回 true 或 false，前面确定的值表示返回 true 的概率。需要 `minecraft:attacking_entity` 参数，若缺省则回退为等级 0。

```json5
{
    "condition": "minecraft:random_chance_with_enchanted_bonus",
    // Add a 20% chance per looting level to succeed.
    "enchantment": "minecraft:looting",
    "enchanted_chance": {
        "type": "linear",
        "base": 0.2,
        "per_level_above_first": 0.2
    },
    // Always fail if the looting enchantment is not present.
    "unenchanted_chance": 0.0
}
```

在数据生成期间，用注册表查询（`HolderLookup.Provider`）、基础值和每级递增量调用 `LootItemRandomChanceWithEnchantedBonusCondition#randomChanceAndLootingBoost` 来构建该条件的构建器。或者，调用 `new LootItemRandomChanceWithEnchantedBonusCondition` 以进一步指定各值。

## `minecraft:value_check` {#minecraftvalue_check}

该条件接受一个[数值提供器][numberprovider]和一个 `IntRange`，若所提供数值的结果落在该范围内则返回 true。

```json5
{
    "condition": "minecraft:value_check",
    // May be any number provider.
    "value": {
        "type": "minecraft:uniform",
        "min": 0.0,
        "max": 10.0
    },
    // A range with min/max values.
    "range": {
        "min": 2.0,
        "max": 5.0
    }
}
```

在数据生成期间，用数值提供器和范围调用 `ValueCheckCondition#hasValue` 来构建该条件的构建器。

## `minecraft:time_check` {#minecrafttime_check}

该条件检查给定的 `WorldClock` 是否落在某个 `IntRange` 内。可选地，可以提供一个 `period` 参数来对时间取模；例如，若 `period` 为 24000，可用它检查 `minecraft:overworld` 的一天中的时间（游戏内一个昼夜循环为 24000 刻）。

```json5
{
    "condition": "minecraft:time_check",
    // The clock instance to check the time of.
    // Points to a registered clock at `data/<namespace>/world_clock/<path>.json`.
    "clock": "minecraft:overworld",
    // Optional, can be omitted. If omitted, no modulo operation will take place.
    // We use 24000 here, which is the length of one in-game day/night cycle.
    "period": 24000,
    // A range with min/max values. This example checks if the time is between 0 and 12000.
    // Combined with the modulo operand of 24000 specified above, this example checks if it is currently daytime.
    "value": {
        "min": 0,
        "max": 12000
    }
}
```

在数据生成期间，用时钟和所需范围调用 `TimeCheck#time` 来构建该条件的构建器。随后可以用 `#setPeriod` 在构建器上设置 `period` 值。

## `minecraft:weather_check` {#minecraftweather_check}

该条件检查当前天气是否在下雨和打雷。

```json5
{
    "condition": "minecraft:weather_check",
    // Optional. If unspecified, the rain state will not be checked.
    "raining": true,
    // Optional. If unspecified, the thundering state will not be checked.
    // Specifying "raining": true and "thundering": true is functionally equivalent to just specifying
    // "thundering": true, since it is always raining when a thunderstorm occurs.
    "thundering": false
}
```

在数据生成期间，调用 `WeatherCheck#weather` 来构建该条件的构建器。随后可以分别用 `#setRaining` 和 `#setThundering` 在构建器上设置 `raining` 和 `thundering` 值。

## `minecraft:location_check` {#minecraftlocation_check}

该条件接受一个 `LocationPredicate` 以及每个坐标轴方向上的可选偏移值。`LocationPredicate` 允许检查诸如位置本身、该位置处的方块或流体状态、该位置处的维度、生物群系或结构、光照等级、天空是否可见等条件。所有可能的值都可以在 `LocationPredicate` 类定义中查看。需要 `minecraft:origin` 战利品参数，若该参数缺省则始终失败。

```json5
{
    "condition": "minecraft:location_check",
    "predicate": {
        // Succeed if our target is anywhere in the nether.
        "dimension": "the_nether"
    },
    // Optional position offset values. Only relevant if you are checking the position in some way.
    // Must either be provided all at once, or not at all.
    "offsetX": 10,
    "offsetY": 10,
    "offsetZ": 10
}
```

在数据生成期间，用 `LocationPredicate` 以及可选的 `BlockPos` 调用 `LocationCheck#checkLocation` 来构建该条件的构建器。

## `minecraft:block_state_property` {#minecraftblock_state_property}

该条件检查被破坏的方块状态中指定的方块状态属性是否具有指定的值。需要 `minecraft:block_state` 战利品参数，若该参数缺省则始终失败。

```json5
{
    "condition": "minecraft:block_state_property",
    // The expected block. If this does not match the block that is actually broken, the condition fails.
    "block": "minecraft:oak_slab",
    // The block state properties to match. Unspecified properties can have either value.
    // In this example, we want to only succeed if a top slab - waterlogged or not - is broken.
    // If this specifies properties not present on the block, a log warning will be printed.
    "properties": {
        "type": "top"
    }
}
```

在数据生成期间，用方块调用 `LootItemBlockStatePropertyCondition#hasBlockStateProperties` 来构建该条件的构建器。随后可以用 `#setProperties` 在构建器上设置所需的方块状态属性值。

## `minecraft:survives_explosion` {#minecraftsurvives_explosion}

该条件会随机销毁掉落物。掉落物存活的概率为 1 / `explosion_radius` 战利品参数。此函数用于所有方块掉落，极少数例外，例如信标或龙蛋。需要 `minecraft:explosion_radius` 战利品参数，若该参数缺省则始终成功。

```json5
{
    "condition": "minecraft:survives_explosion"
}
```

在数据生成期间，调用 `ExplosionCondition#survivesExplosion` 来构建该条件的构建器。

## `minecraft:match_tool` {#minecraftmatch_tool}

该条件接受一个针对 `tool` 战利品参数进行检查的 `ItemPredicate`。一个 `ItemPredicate` 可以指定一列有效物品 id（`items`）、物品数量的最小/最大范围（`count`）、一个 `DataComponentPredicate`（`components`）以及一个 `ItemSubPredicate` 的映射（`predicates`）；所有字段都是可选的。需要 `minecraft:tool` 战利品参数，若该参数缺省则始终失败。

```json5
{
    "condition": "minecraft:match_tool",
    // Match a netherite pickaxe or axe.
    "predicate": {
        "items": [
            "minecraft:netherite_pickaxe",
            "minecraft:netherite_axe"
        ]
    }
}
```

在数据生成期间，用一个 `ItemPredicate.Builder` 调用 `MatchTool#toolMatches` 来构建该条件的构建器。

## `minecraft:enchantment_active` {#minecraftenchantment_active}

该条件返回某个附魔是否处于激活状态。需要 `minecraft:enchantment_active` 战利品参数，若该参数缺省则始终失败。

```json5
{
    "condition": "minecraft:enchantment_active",
    // Whether the enchantment should be active (true) or not (false).
    "active": true
}
```

在数据生成期间，调用 `EnchantmentActiveCheck#enchantmentActiveCheck` 或 `#enchantmentInactiveCheck` 来构建该条件的构建器。

## `minecraft:table_bonus` {#minecrafttable_bonus}

该条件类似于 `minecraft:random_chance_with_enchanted_bonus`，但使用固定值而非随机值。需要 `minecraft:tool` 战利品参数，若该参数缺省则始终失败。

```json5
{
    "condition": "minecraft:table_bonus",
    // Apply the bonus if the fortune enchantment is present.
    "enchantment": "minecraft:fortune",
    // The chances to use per level. This example has a 20% chance of succeeding if unenchanted,
    // 30% if enchanted at level 1, and 60% if enchanted at level 2 or above.
    "chances": [0.2, 0.3, 0.6]
}
```

在数据生成期间，用附魔 id 和各概率调用 `BonusLevelTableCondition#bonusLevelFlatChance` 来构建该条件的构建器。

## `minecraft:entity_properties` {#minecraftentity_properties}

该条件针对某个[实体目标][entitytarget]检查给定的 `EntityPredicate`。`EntityPredicate` 可以检查实体类型、状态效果、nbt 值、装备、位置等。

```json5
{
    "condition": "minecraft:entity_properties",
    // The entity target to use. Valid values are "this", "attacker", "direct_attacker" or "attacking_player".
    // These correspond to the "this_entity", "attacking_entity", "direct_attacking_entity" and
    // "last_damage_player" loot parameters, respectively.
    "entity": "attacker",
    // Only succeed if the target is a pig. The predicate may also be empty, this can be used
    // to check whether the specified entity target is set at all.
    "predicate": {
        "type": "minecraft:pig"
    }
}
```

在数据生成期间，用实体目标调用 `LootItemEntityPropertyCondition#entityPresent`，或用实体目标和 `EntityPredicate` 调用 `LootItemEntityPropertyCondition#hasProperties`，来构建该条件的构建器。

## `minecraft:damage_source_properties` {#minecraftdamage_source_properties}

该条件针对伤害来源战利品参数检查给定的 `DamageSourcePredicate`。需要 `minecraft:origin` 和 `minecraft:damage_source` 战利品参数，若这些参数缺省则始终失败。

```json5
{
    "condition": "minecraft:damage_source_properties",
    "predicate": {
        // Check whether the source entity is a zombie.
        "source_entity": {
            "type": "zombie"
        }
    }
}
```

在数据生成期间，用一个 `DamageSourcePredicate.Builder` 调用 `DamageSourceCondition#hasDamageSource` 来构建该条件的构建器。

## `minecraft:killed_by_player` {#minecraftkilled_by_player}

该条件判定这次击杀是否为玩家击杀。用于某些实体掉落，例如烈焰人掉落的烈焰棒。需要 `minecraft:last_player_damage` 战利品参数，若该参数缺省则始终失败。

```json5
{
    "condition": "minecraft:killed_by_player"
}
```

在数据生成期间，调用 `LootItemKilledByPlayerCondition#killedByPlayer` 来构建该条件的构建器。

## `minecraft:entity_scores` {#minecraftentity_scores}

该条件检查[实体目标][entitytarget]的记分板。需要与指定实体目标对应的战利品参数，若该参数缺省则始终失败。

```json5
{
    "condition": "minecraft:entity_scores"
    // The entity target to use. Valid values are "this", "attacker", "direct_attacker" or "attacking_player".
    // These correspond to the "this_entity", "attacking_entity", "direct_attacking_entity" and
    // "last_damage_player" loot parameters, respectively.
    "entity": "attacker",
    // A list of scoreboard values that must be in the given ranges.
    "scores": {
        "score1": {
            "min": 0,
            "max": 100
        },
        "score2": {
            "min": 10,
            "max": 20
        }
    }
}
```

在数据生成期间，用实体目标调用 `EntityHasScoreCondition#hasScores` 来构建该条件的构建器。然后，用 `#withScore` 向构建器添加所需的计分项。

## `minecraft:reference` {#minecraftreference}

该条件引用一个谓词文件并返回其结果。更多信息参见[物品谓词][predicate]。

```json5
{
    "condition": "minecraft:reference",
    // Refers to the predicate file at data/examplemod/predicate/example_predicate.json.
    "name": "examplemod:example_predicate"
}
```

在数据生成期间，用所引用谓词文件的 id 调用 `ConditionReference#conditionReference` 来构建该条件的构建器。

## `minecraft:environment_attribute_check` {#minecraftenvironment_attribute_check}

该条件检查上下文维度中的某个环境属性是否匹配给定值。若该环境属性是位置相关的（会随玩家在世界中的位置而变化），则需要 `minecraft:origin` 战利品参数，若该参数缺省则始终失败。若该属性在该维度中不存在，则将该值与默认值进行比较。

```json5
{
    "condition": "minecraft:environment_attribute_check",
    // The environment attribute to check the value of.
    "attribute": "minecraft:gameplay/water_evaporates",
    // The value the environment attribute must be.
    "value": false
}
```

在数据生成期间，用已注册的 `EnvironmentAttribute` 及其值调用 `EnvironmentAttributeCheck#environmentAttribute` 来构建该条件的构建器。

## `neoforge:loot_table_id` {#neoforgeloot_table_id}

只有当周围的战利品表 id 匹配时，该条件才返回 true。这通常用于[全局战利品修改器][glm]内部。

```json5
{
    "condition": "neoforge:loot_table_id",
    // Will only apply when the loot table is for dirt
    "loot_table_id": "minecraft:blocks/dirt"
}
```

在数据生成期间，用所需的战利品表 id 调用 `LootTableIdCondition#builder` 来构建该条件的构建器。

## `neoforge:can_item_perform_ability` {#neoforgecan_item_perform_ability}

只有当 `tool` 战利品上下文参数（`LootContextParams.TOOL`）中的物品——通常是用于破坏方块或击杀实体的物品——能够执行指定的 [`ItemAbility`][itemability] 时，该条件才返回 true。需要 `minecraft:tool` 战利品参数，若该参数缺省则始终失败。

```json5
{
    "condition": "neoforge:can_item_perform_ability",
    // Will only apply if the tool can strip a log like an axe
    "ability": "axe_strip"
}
```

在数据生成期间，用所需物品能力的 id 调用 `CanItemPerformAbility#canItemPerformAbility` 来构建该条件的构建器。

## 参见 {#see-also}

- [Minecraft Wiki][mcwiki] 上的[物品谓词][predicatejson]

[custom]: custom.md#custom-loot-conditions
[entitytarget]: index.md#entity-targets
[entry]: index.md#loot-entry
[glm]: glm.md
[itemability]: ../../../items/tools.md#itemabilitys
[mcwiki]: https://minecraft.wiki
[numberprovider]: index.md#number-provider
[pool]: index.md#loot-pool
[predicate]: https://minecraft.wiki/w/Predicate
[predicatejson]: https://minecraft.wiki/w/Predicate#JSON_format
[registry]: ../../../concepts/registries.md

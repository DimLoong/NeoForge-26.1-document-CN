# 战利品条件 {#loot-conditions}

战利品条件可用于检查是否应在当前上下文中使用[战利品条目][entry]或[战利品池][pool]。在这两种情况下，都定义了一系列条件；仅当所有条件都满足时才使用条目或池。在数据生成期间，通过使用所需条件的实例调用 `#when`，将它们添加到 `LootPoolEntryContainer.Builder<?>` 或 `LootPool.Builder` 中。本文将概述可用的战利品条件。要创建你自己的战利品条件，请参阅[自定义战利品条件][custom]。

## `minecraft:inverted` {#minecraftinverted}

该条件接受另一个条件并反转其结果。需要其他条件所需的任何战利品参数。

```json5
{
    "condition": "minecraft:inverted",
    "term": {
        // Some other loot condition.
    }
}
```

在 datagen 期间，使用反转条件调用 `InvertedLootItemCondition#invert` 来构造此条件的构建器。

## `minecraft:all_of` {#minecraftall_of}

此条件接受任意数量的其他条件，并且如果所有子条件都返回 true，则返回 true。如果列表为空，则返回 false。需要其他条件所需的任何战利品参数。

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

在数据生成期间，使用所需的条件调用 `AllOfCondition#allOf` 来构造该条件的构建器。

## `minecraft:any_of` {#minecraftany_of}

此条件接受任意数量的其他条件，并且如果至少一个子条件返回 true，则返回 true。如果列表为空，则返回 false。需要其他条件所需的任何战利品参数。

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

在数据生成期间，使用所需的条件调用 `AnyOfCondition#anyOf` 来构造该条件的构建器。

## `minecraft:random_chance` {#minecraftrandom_chance}

此条件接受代表 0 到 1 之间机会的 [number provider][numberprovider]，并根据该机会随机返回 true 或 false。号码提供者通常不应返回 `[0, 1]` 间隔之外的值。

```json5
{
    "condition": "minecraft:random_chance",
    // A constant 50% chance for the condition to apply. 
    "chance": 0.5
}
```

在数据生成期间，使用数字提供程序或（常量）浮点值调用 `RandomChance#randomChance` 来构造此条件的构建器。

## `minecraft:random_chance_with_enchanted_bonus` {#minecraftrandom_chance_with_enchanted_bonus}

此条件接受结界 id、[`LevelBasedValue`][numberprovider] 和常量后备浮点值。如果指定的附魔存在，则查询 `LevelBasedValue` 的值。如果指定的附魔不存在，或者无法从 `LevelBasedValue` 检索到任何值，则使用常量后备值。然后，条件随机返回 true 或 false，之前确定的值表示返回 true 的机会。需要 `minecraft:attacking_entity` 参数，如果不存在则回落到级别 0。

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

在数据生成期间，使用注册表查找 (`HolderLookup.Provider`)、基值和每级增量调用 `LootItemRandomChanceWithEnchantedBonusCondition#randomChanceAndLootingBoost`，以为此条件构建构建器。或者，调用 `new LootItemRandomChanceWithEnchantedBonusCondition` 进一步指定值。

## `minecraft:value_check` {#minecraftvalue_check}

此条件接受 [号码提供者][numberprovider] 和 `IntRange`，如果提供的号码结果在范围内，则返回 true。

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

在数据生成期间，使用号码提供程序和范围调用 `ValueCheckCondition#hasValue`，以为此条件构建构建器。

## `minecraft:time_check` {#minecrafttime_check}

此条件检查世界时间是否在 `IntRange` 范围内。或者，可以提供 `period` 参数来对时间取模；这可以用于例如检查一天中的时间 `period` 是否为 24000（游戏中的一个日/夜周期有 24000 个刻度）。

```json5
{
    "condition": "minecraft:time_check",
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

在数据生成期间，使用所需的范围调用 `TimeCheck#time` 来构造针对此条件的构建器。然后可以使用 `#setPeriod` 在构建器上设置 `period` 值。

## `minecraft:weather_check` {#minecraftweather_check}

此条件检查当前天气是否下雨和打雷。

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

在 datagen 期间，调用 `WeatherCheck#weather` 来构造此条件的构建器。然后可以分别使用 `#setRaining` 和 `#setThundering` 在构建器上设置 `raining` 和 `thundering` 值。

## `minecraft:location_check` {#minecraftlocation_check}

此条件接受 `LocationPredicate` 和每个轴方向的可选偏移值。 `LocationPredicate` 允许检查位置本身、该位置的方块或流体状态、该位置的尺寸、生物群落或结构、光照水平、天空是否可见等条件。所有可能的值都可以在 `LocationPredicate` 类定义中查看。需要 `minecraft:origin` 战利品参数，如果该参数不存在，则始终失败。

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

在数据生成期间，使用 `LocationPredicate` 和可选的 `BlockPos` 调用 `LocationCheck#checkLocation` 来构造针对此条件的构建器。

## `minecraft:block_state_property` {#minecraftblock_state_property}

此条件检查指定的方块状态属性是否在损坏的方块状态下具有指定的值。需要 `minecraft:block_state` 战利品参数，如果该参数不存在，则始终失败。

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

在数据生成期间，使用块调用 `LootItemBlockStatePropertyCondition#hasBlockStateProperties` 来构造此条件的构建器。然后可以使用 `#setProperties` 在构建器上设置所需的块状态属性值。

## `minecraft:survives_explosion` {#minecraftsurvives_explosion}

这种情况会随机破坏掉落物。掉落物存活的机会是 1 /`explosion_radius` 战利品参数。除信标或龙蛋等极少数例外外，所有方块掉落物都使用此功能。需要 `minecraft:explosion_radius` 战利品参数，如果该参数不存在，则始终成功。

```json5
{
    "condition": "minecraft:survives_explosion"
}
```

在 datagen 期间，调用 `ExplosionCondition#survivesExplosion` 来构造此条件的构建器。

## `minecraft:match_tool` {#minecraftmatch_tool}

此条件接受根据 `tool` 战利品参数进行检查的 `ItemPredicate`。 `ItemPredicate` 可以指定有效物品 ID 列表 (`items`)、物品计数的最小/最大范围 (`count`)、 `DataComponentPredicate`(`components`) 和 `ItemSubPredicate`(`predicates`)；所有字段都是可选的。需要 `minecraft:tool` 战利品参数，如果该参数不存在，则始终失败。

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

在数据生成期间，使用 `ItemPredicate.Builder` 调用 `MatchTool#toolMatches` 来反转以构造针对此条件的构建器。

## `minecraft:enchantment_active` {#minecraftenchantment_active}

此条件返回结界是否处于活动状态。需要 `minecraft:enchantment_active` 战利品参数，如果该参数不存在，则始终失败。

```json5
{
    "condition": "minecraft:enchantment_active",
    // Whether the enchantment should be active (true) or not (false).
    "active": true
}
```

在 datagen 期间，调用 `EnchantmentActiveCheck#enchantmentActiveCheck` 或 `#enchantmentInactiveCheck` 来构造此条件的构建器。

## `minecraft:table_bonus` {#minecrafttable_bonus}

此条件类似于 `minecraft:random_chance_with_enchanted_bonus`，但使用固定值而不是随机值。需要 `minecraft:tool` 战利品参数，如果该参数不存在，则始终失败。

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

在数据生成期间，使用结界 id 和为此条件构建构建器的机会调用 `BonusLevelTableCondition#bonusLevelFlatChance`。

## `minecraft:entity_properties` {#minecraftentity_properties}

此条件根据[实体目标][entitytarget]检查给定的 `EntityPredicate`。 `EntityPredicate` 可以查看实体类型、生物效果、 nbt 值、装备、位置等。

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

在数据生成期间，使用实体目标调用 `LootItemEntityPropertyCondition#entityPresent`，或使用实体目标和 `EntityPredicate` 调用 `LootItemEntityPropertyCondition#hasProperties`，以为此条件构造构建器。

## `minecraft:damage_source_properties` {#minecraftdamage_source_properties}

此条件根据损坏源战利品参数检查给定的 `DamageSourcePredicate`。需要 `minecraft:origin` 和 `minecraft:damage_source` 战利品参数，如果这些参数不存在，则总是失败。

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

在 datagen 期间，使用 `DamageSourcePredicate.Builder` 调用 `DamageSourceCondition#hasDamageSource` 来构造针对此条件的构建器。

## `minecraft:killed_by_player` {#minecraftkilled_by_player}

这个条件决定了杀戮是否是玩家杀戮。被某些实体掉落物使用，例如火焰掉落的火焰棒。需要 `minecraft:last_player_damage` 战利品参数，如果该参数不存在，则始终失败。

```json5
{
    "condition": "minecraft:killed_by_player"
}
```

在 datagen 期间，调用 `LootItemKilledByPlayerCondition#killedByPlayer` 来构造此条件的构建器。

## `minecraft:entity_scores` {#minecraftentity_scores}

此条件检查[实体目标][entitytarget]的记分板。需要与指定实体目标相对应的战利品参数，如果该参数不存在，则始终失败。

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

在数据生成期间，使用实体目标调用 `EntityHasScoreCondition#hasScores` 来构造此条件的构建器。然后，使用 `#withScore` 将所需分数添加到构建器。

## `minecraft:reference` {#minecraftreference}

此条件引用谓词文件并返回其结果。有关详细信息，请参阅[物品谓词][predicate]。

```json5
{
    "condition": "minecraft:reference",
    // Refers to the predicate file at data/examplemod/predicate/example_predicate.json.
    "name": "examplemod:example_predicate"
}
```

在 datagen 期间，使用引用的谓词文件的 id 调用 `ConditionReference#conditionReference` 来构造此条件的构建器。

## `neoforge:loot_table_id` {#neoforgeloot_table_id}

仅当周围的战利品表 ID 匹配时，此条件才会返回 true。这通常用在[全局战利品修饰符][glm]中。

```json5
{
    "condition": "neoforge:loot_table_id",
    // Will only apply when the loot table is for dirt
    "loot_table_id": "minecraft:blocks/dirt"
}
```

在数据生成期间，使用所需的战利品表 ID 调用 `LootTableIdCondition#builder` 来构造针对此条件的构建器。

## `neoforge:can_item_perform_ability` {#neoforgecan_item_perform_ability}

仅当 `tool` 战利品上下文参数 (`LootContextParams.TOOL`) 中的物品（通常用于打破方块或杀死实体的物品）可以执行指定的 [`ItemAbility`][itemability] 时，此条件才返回 true。需要 `minecraft:tool` 战利品参数，如果该参数不存在，则始终失败。

```json5
{
    "condition": "neoforge:can_item_perform_ability",
    // Will only apply if the tool can strip a log like an axe
    "ability": "axe_strip"
}
```

在数据生成期间，使用所需物品能力的 id 调用 `CanItemPerformAbility#canItemPerformAbility`，以便为此条件构建构建器。

## 另请参见 {#see-also}

- [物品谓词][predicatejson] 在 [Minecraft Wiki][mcwiki] 上

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

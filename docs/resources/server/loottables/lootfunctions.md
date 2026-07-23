# 战利品函数 {#loot-functions}

战利品函数用于修改某个[战利品项][entry]的结果，或某个[战利品池][pool]或[战利品表][table]的多个结果。两种情况都会定义一列函数，它们按顺序运行。在数据生成期间，通过调用 `#apply`，可以把战利品函数应用到 `LootPoolSingletonContainer.Builder<?>`、`LootPool.Builder` 和 `LootTable.Builder` 上。本文将概述可用的战利品函数。要创建你自己的战利品函数，参见[自定义战利品函数][custom]。

:::note
战利品函数不能应用于复合战利品项（`CompositeEntryBase` 的子类及其关联的构建器类）。它们必须被手动添加到每个单例项上。
:::

除 `minecraft:sequence` 之外的所有原版战利品函数都可以在 `conditions` 块中指定[战利品条件][conditions]。若其中某个条件失败，则该函数不会被应用。在代码层面，这由 `LootItemConditionalFunction` 控制，除 `SequenceFunction` 外的所有战利品函数都继承它。

## `minecraft:set_item` {#minecraftset_item}

设置在结果物品堆叠中要使用的另一种物品。

```json5
{
    "function": "minecraft:set_item",
    // The item to use.
    "item": "minecraft:dirt"
}
```

目前无法在数据生成期间创建此函数。

## `minecraft:set_count` {#minecraftset_count}

设置在结果物品堆叠中要使用的物品数量。使用一个[数值提供器][numberprovider]。

```json5
{
    "function": "minecraft:set_count",
    // The count to use.
    "count": {
        "type": "minecraft:uniform",
        "min": 1,
        "max": 3
    },
    // Whether to add to the existing value instead of setting it. Optional, defaults to false.
    "add": true
}
```

在数据生成期间，用所需的数值提供器以及可选的 `add` 布尔值调用 `SetItemCountFunction#setCount` 来构建该函数的构建器。

## `minecraft:explosion_decay` {#minecraftexplosion_decay}

应用爆炸衰减。物品有 1 / `explosion_radius` 的概率“存活”。这会根据数量运行多次。需要 `minecraft:explosion_radius` 战利品参数，若该参数缺省则不执行任何修改。

```json5
{
    "function": "minecraft:explosion_decay"
}
```

在数据生成期间，调用 `ApplyExplosionDecay#explosionDecay` 来构建该函数的构建器。

## `minecraft:limit_count` {#minecraftlimit_count}

将物品堆叠的数量钳制在给定的 `IntRange` 之间。

```json5
{
    "function": "minecraft:limit_count",
    // The limit to use. Can have a min, a max, or both.
    "limit": {
        "max": 32
    }
}
```

在数据生成期间，用所需的 `IntRange` 调用 `LimitCount#limitCount` 来构建该函数的构建器。

## `minecraft:set_custom_data` {#minecraftset_custom_data}

在物品堆叠上设置自定义 NBT 数据。

```json5
{
    "function": "minecraft:set_custom_data",
    "tag": {
        "exampleproperty": 0
    }
}
```

在数据生成期间，用所需的 [`CompoundTag`][nbt] 调用 `SetCustomDataFunction#setCustomData` 来构建该函数的构建器。

:::warning
此函数一般应被视为已弃用。请改用 `minecraft:set_components`。
:::

## `minecraft:copy_custom_data` {#minecraftcopy_custom_data}

将自定义 NBT 数据从方块实体或实体来源复制到物品堆叠。对于方块实体不建议使用此函数，应改用 `minecraft:copy_components` 或 `minecraft:set_contents`。对于实体，这需要设置[实体目标][entitytarget]。需要与指定来源（实体目标或方块实体）对应的战利品参数，若该参数缺省则不执行任何修改。

```json5
{
    "function": "minecraft:copy_custom_data",
    // The source to use. Valid values are either an entity target, "block_entity" to use the loot context's
    // block entity parameter, or be "storage" for command storage. If this is "storage", it can instead be a
    // JSON object that additionally specify the command storage path to be used.
    "source": "this",
    // Example for using "storage".
    "source": {
        "type": "storage",
        "source": "examplepath"
    },
    // The copy operation(s).
    "ops": [
        {
            // The source and target paths. In this example, we copy from "src" in the source to "dest" in the target.
            "source": "src",
            "target": "dest",
            // A merging strategy. Valid values are "replace", "append", and "merge".
            "op": "merge"
        }
    ]
}
```

在数据生成期间，用关联的 `NbtProvider` 调用 `CopyCustomDataFunction#copyData` 来获取构建器。然后调用 `Builder#copy`，传入所需的源路径和目标路径，以及一个合并策略（可选，默认为 `replace`），来构建该函数的构建器。

## `minecraft:set_components` {#minecraftset_components}

在物品堆叠上设置[数据组件][datacomponent]值。大多数原版用例都有专门的函数，将在下文说明。

```json5
{
    "function": "minecraft:set_components",
    // Any component can be used. In this example, we set the dyed color of the item to red.
    "components": {
        "dyed_color": {
            "rgb": 16711680
        }
    }
}
```

在数据生成期间，用所需的数据组件和值调用 `SetComponentsFunction#setComponent` 来构建该函数的构建器。

## `minecraft:copy_components` {#minecraftcopy_components}

将[数据组件][datacomponent]值从方块实体复制到物品堆叠。需要 `LootContext.BlockEntityTarget`、`LootContext.EntityTarget` 或 `LootContext.ItemStackTarget` 中的某个战利品参数。

```json5
{
    "function": "minecraft:copy_components",
    // One of the loot params specified in the context
    // For entities: 'this', 'attacker', 'direct_attacker', 'attacking_player', 'target_entity', 'interacting_entity'
    // For block entities: 'block_entity'
    // For item stacks: 'tool'
    "source": "block_entity",
    // By default, all components are copied. The "exclude" list allows excluding certain components, and the
    // "include" list allows explicitly re-including components. Both fields are optional.
    "exclude": [],
    "include": []
}
```

在数据生成期间，对于方块实体来源调用 `CopyComponentsFunction#copyComponentsFromBlockEntity`，对于实体来源调用 `copyComponentsFromEntity`，来构建该函数的构建器。你也可以使用 `CopyComponentsFunction.ItemStackSource`，前提是[放宽该构建器构造函数的访问权限][at]。

## `minecraft:copy_state` {#minecraftcopy_state}

将方块状态属性复制到物品堆叠的 `block_state` [数据组件][datacomponent]中，在尝试放置方块时使用。要复制的方块状态属性必须显式指定。需要 `minecraft:block_state` 战利品参数，若该参数缺省则不执行任何修改。

```json5
{
    "function": "minecraft:copy_state",
    // The expected block. If this does not match the block that is actually broken, the function does not run.
    "block": "minecraft:oak_slab",
    // The block state properties to save.
    "properties": {
        "type": "top"
    }
}
```

在数据生成期间，用方块调用 `CopyBlockState#copyState` 来构建该条件的构建器。随后可以用 `#copy` 在构建器上设置所需的方块状态属性值。

## `minecraft:set_contents` {#minecraftset_contents}

设置物品堆叠的内容物。

```json5
{
    "function": "minecraft:set_contents",
    // The contents component to use. Valid values are "container", "bundle_contents" and "charged_projectiles".
    "component": "container",
    // A list of loot entries to add to the contents.
    "entries": [
        {
            "type": "minecraft:empty",
            "weight": 3
        },
        {
            "type": "minecraft:item",
            "item": "minecraft:arrow"
        }
    ]
}
```

在数据生成期间，用所需的内容物组件调用 `SetContainerContents#setContents` 来构建该函数的构建器。然后，在构建器上调用 `#withEntry` 来添加项。

## `minecraft:modify_contents` {#minecraftmodify_contents}

对物品堆叠的内容物应用一个函数。

```json5
{
    "function": "minecraft:modify_contents",
    // The contents component to use. Valid values are "container", "bundle_contents" and "charged_projectiles".
    "component": "container",
    // The function to use.
    "modifier": "apply_explosion_decay"
}
```

目前无法在数据生成期间创建此函数。

## `minecraft:set_loot_table` {#minecraftset_loot_table}

在结果物品堆叠上设置一个容器战利品表。用于箱子及其他在放置后仍保留此属性的战利品容器。

```json5
{
    "function": "minecraft:set_loot_table",
    // The id of the loot table to use.
    "name": "minecraft:entities/enderman",
    // The id of the block entity type of the target block entity.
    "type": "minecraft:chest",
    // The random seed for generating loot tables. Optional, defaults to 0.
    "seed": 42
}
```

在数据生成期间，用所需的方块实体类型、战利品表资源键以及可选的种子调用 `SetContainerLootTable#withLootTable` 来构建该函数的构建器。

## `minecraft:set_name` {#minecraftset_name}

为结果物品堆叠设置名称。名称可以是 [`Component`][component] 而非字面字符串。它也可以从[实体目标][entitytarget]解析而来。如适用则需要对应的实体战利品参数，若该参数缺省则不执行任何修改。

```json5
{
    "function": "minecraft:set_name",
    "name": "Funny Item",
    // The entity target to use.
    "entity": "this",
    // Whether to set the custom name ("custom_name") or the item name ("item_name") itself.
    // Custom name are displayed in italics and can be changed in an anvil, while item names cannot.
    "target": "custom_name"
}
```

在数据生成期间，用所需的名称组件、所需的名称目标以及可选的实体目标调用 `SetNameFunction#setName` 来构建该函数的构建器。

## `minecraft:copy_name` {#minecraftcopy_name}

将某个[实体目标][entitytarget]或方块实体的名称复制到结果物品堆叠。需要与指定来源（实体目标或方块实体）对应的战利品参数，若该参数缺省则不执行任何修改。

```json5
{
    "function": "minecraft:copy_name",
    // The entity target, or "block_entity" if a block entity's name should be copied.
    "source": "this"
}
```

在数据生成期间，用所需的 `LootContext.BlockEntityTarget` 或 `LootContext.EntityTarget` 上下文参数调用 `CopyNameFunction#copyName` 来构建该函数的构建器。

## `minecraft:set_lore` {#minecraftset_lore}

为结果物品堆叠设置 lore（提示框文本行）。这些行可以是 [`Component`][component] 而非字面字符串。它也可以从[实体目标][entitytarget]解析而来。如适用则需要对应的实体战利品参数，若该参数缺省则不执行任何修改。

```json5
{
    "function": "minecraft:set_lore",
    "lore": [
        "Funny Lore",
        "Funny Lore 2"
    ],
    // The merging mode used. Valid values are:
    // - "append": Appends the entries to any existing lore entries.
    // - "insert": Inserts the entries at a certain position. The position is denoted as an additional field
    //   named "offset". "offset" is optional and defaults to 0.
    // - "replace_all": Removes all previous entries and then appends the entries.
    // - "replace_section": Removes a section of entries and then adds the entries at that position.
    //   The section removed is denoted through the "offset" and optional "size" fields.
    //   If "size" is omitted, the amount of lines in "lore" is used.
    "mode": {
        "type": "insert",
        "offset": 0
    },
    // The entity target to use.
    "entity": "this"
}
```

在数据生成期间，调用 `SetLoreFunction#setLore` 来构建该函数的构建器。然后，根据需要在构建器上调用 `#addLine`、`#setMode` 和 `#setResolutionContext`。

## `minecraft:toggle_tooltips` {#minecrafttoggle_tooltips}

启用或禁用某些组件的提示框显示。

```json5
{
    "function": "minecraft:toggle_tooltips",
    "toggles": {
        // All values are optional. If omitted, these values will use pre-existing values on the stack.
        // The pre-existing values are generally true, unless they have already been modified by another function.
        "minecraft:attribute_modifiers": false,
        "minecraft:can_break": false,
        "minecraft:can_place_on": false,
        "minecraft:dyed_color": false,
        "minecraft:enchantments": false,
        "minecraft:jukebox_playable": false,
        "minecraft:stored_enchantments": false,
        "minecraft:trim": false,
        "minecraft:unbreakable": false
    }
}
```

目前无法在数据生成期间创建此函数。

## `minecraft:enchant_with_levels` {#minecraftenchant_with_levels}

用给定的等级数量随机为物品堆叠附魔。使用一个[数值提供器][numberprovider]。

```json5
    {
    "function": "minecraft:enchant_with_levels",
    // The amount of levels to use.
    "levels": {
        "type": "minecraft:uniform",
        "min": 10,
        "max": 30
    },
    // A list of possible enchantments. Optional, defaults to all applicable enchantments for the item.
    "options": [
        "minecraft:sharpness",
        "minecraft:fire_aspect"
    ],
    // Whether to allow this function to apply an additional trade cost if successful.
    "include_additional_cost_component": true
}
```

在数据生成期间，用所需的数值提供器调用 `EnchantWithLevelsFunction#enchantWithLevels` 来构建该函数的构建器。然后，如有需要，用 `#fromOptions` 在构建器上设置一列附魔。

## `minecraft:enchant_randomly` {#minecraftenchant_randomly}

用一个随机附魔为物品附魔。

```json5
{
    "function": "minecraft:enchant_randomly",
    // A list of possible enchantments. Optional, defaults to all enchantments.
    "options": [
        "minecraft:sharpness",
        "minecraft:fire_aspect"
    ],
    // Whether to only allow compatible enchantments, or any enchantments. Optional, defaults to true.
    "only_compatible": true,
    // Whether to allow this function to apply an additional trade cost if successful.
    "include_additional_cost_component": true
}
```

在数据生成期间，调用 `EnchantRandomlyFunction#randomEnchantment` 或 `EnchantRandomlyFunction#randomApplicableEnchantment` 来构建该函数的构建器。然后，如有需要，在构建器上调用 `#withEnchantment`、`#withOneOf` 或 `#withOptions`。

## `minecraft:set_enchantments` {#minecraftset_enchantments}

在结果物品堆叠上设置附魔。

```json5
{
    "function": "minecraft:set_enchantments",
    // A map of enchantments to number providers.
    "enchantments": {
        "minecraft:fire_aspect": 2,
        "minecraft:sharpness": {
        "type": "minecraft:uniform",
        "min": 3,
        "max": 5,
        }
    },
    // Whether to add enchantment levels to existing levels instead of overwriting them. Optional, defaults to false.
    "add": true
}
```

在数据生成期间，用（可选的）`add` 布尔值调用 `new SetEnchantmentsFunction.Builder` 来构建该函数的构建器。然后，调用 `#withEnchantment` 添加要设置的附魔。

## `minecraft:enchanted_count_increase` {#minecraftenchanted_count_increase}

根据附魔值增加物品堆叠数量。使用一个[数值提供器][numberprovider]。需要 `minecraft:attacking_entity` 战利品参数，若该参数缺省则不执行任何修改。

```json5
{
    "function": "minecraft:enchanted_count_increase",
    // The enchantment to use.
    "enchantment": "minecraft:fortune",
    // The increase count per level. The number provider is rolled once per function, not once per level.
    "count": {
        "type": "minecraft:uniform",
        "min": 1,
        "max": 3
    },
    // The stack size limit, which will not be exceeded no matter the enchantment level. Optional.
    "limit": 5
}
```

在数据生成期间，用所需的数值提供器调用 `EnchantedCountIncreaseFunction#lootingMultiplier` 来构建该函数的构建器。之后可选地在构建器上调用 `#setLimit`。

## `minecraft:apply_bonus` {#minecraftapply_bonus}

根据附魔值和各种公式对物品堆叠数量应用增量。需要 `minecraft:tool` 战利品参数，若该参数缺省则不执行任何修改。

```json5
{
    "function": "minecraft:apply_bonus",
    // The enchantment value to query.
    "enchantment": "minecraft:fortune",
    // The formula to use. Valid values are:
    // - "minecraft:binomial_with_bonus_count": Applies a bonus based on a binomial distribution with
    //   n = enchantment level + extra and p = probability.
    // - "minecraft:ore_drops": Applies a bonus based on a special formula for ore drops, including randomness.
    // - "minecraft:uniform_bonus_count": Adds a bonus based on the enchantment level scaled by a constant multiplier.
    "formula": "ore_drops",
    // The parameter values, depending on the formula.
    // If the formula is "minecraft:binomial_with_bonus_count", requires "extra" and "probability".
    // If the formula is "minecraft:ore_drops", requires no parameters.
    // If the formula is "minecraft:uniform_bonus_count", requires "bonusMultiplier".
    "parameters": {}
}
```

在数据生成期间，用附魔和其他必需参数（取决于公式）调用 `ApplyBonusCount#addBonusBinomialDistributionCount`、`ApplyBonusCount#addOreBonusCount` 或 `ApplyBonusCount#addUniformBonusCount` 来构建该函数的构建器。

## `minecraft:furnace_smelt` {#minecraftfurnace_smelt}

尝试像在熔炉中一样熔炼物品，若无法熔炼则返回未修改的物品堆叠。

```json5
{
    "function": "minecraft:furnace_smelt",
    // When true, will use the current input material to determine
    // the base count. Otherwise, will output one result.
    "use_input_count": true
}
```

在数据生成期间，调用 `SmeltItemFunction#smelted` 来构建该函数的构建器。

## `minecraft:set_damage` {#minecraftset_damage}

在结果物品堆叠上设置一个耐久损耗值。使用一个[数值提供器][numberprovider]。

```json5
{
    "function": "minecraft:set_damage",
    // The damage to set.
    "damage": {
        "type": "minecraft:uniform",
        "min": 10,
        "max": 300
    },
    // Whether to add to the existing damage instead of setting it. Optional, defaults to false.
    "add": true
}
```

在数据生成期间，用所需的数值提供器以及可选的 `add` 布尔值调用 `SetItemDamageFunction#setDamage` 来构建该函数的构建器。

## `minecraft:set_attributes` {#minecraftset_attributes}

向结果物品堆叠添加一列[属性修饰符][attributemodifier]。

```json5
{
    "function": "minecraft:set_attributes",
    // A list of attribute modifiers.
    "modifiers": [
        {
            // The resource location id of the modifier. Should be prefixed by your mod id.
            "id": "examplemod:example_modifier",
            // The id of the attribute the modifier is for.
            "attribute": "minecraft:attack_damage",
            // The attribute modifier operation.
            // Valid values are "add_value", "add_multiplied_base" and "add_multiplied_total". 
            "operation": "add_value",
            // The amount of the modifier. This can also be a number provider.
            "amount": 5,
            // The slot(s) the modifier applies for. Valid values are "any" (any inventory slot),
            // "mainhand", "offhand", "hand", (mainhand/offhand/both hands),
            // "feet", "legs", "chest", "head", "armor" (boots/leggings/chestplates/helmets/any armor slots)
            // and "body" (horse armor and similar slots).
            "slot": "armor"
        }
    ],
    // Whether to replace the existing values instead of adding to them. Optional, defaults to true.
    "replace": false
}
```

在数据生成期间，调用 `SetAttributesFunction#setAttributes` 来构建该函数的构建器。然后，用构建器上的 `#withModifier` 添加修饰符。用 `SetAttributesFunction#modifier` 获取一个修饰符。

## `minecraft:set_potion` {#minecraftset_potion}

在结果物品堆叠上设置一种药水。

```json5
{
    "function": "minecraft:set_potion",
    // The id of the potion.
    "id": "minecraft:strength"
}
```

在数据生成期间，用所需的药水调用 `SetPotionFunction#setPotion` 来构建该函数的构建器。

## `minecraft:set_random_dyes` {#minecraftset_random_dyes}

对结果物品堆叠应用随机数量的染料，将得到的颜色存储在 `DataComponents#DYED_COLOR` 中。

```json5
{
    "function": "minecraft:set_random_dyes",
    // A number provider of the number of dyes to apply to the result.
    "number_of_dyes": 3
}
```

在数据生成期间，用染料数量调用 `SetRandomDyesFunction#withCount` 来构建该函数的构建器。

## `minecraft:set_random_potion` {#minecraftset_random_potion}

从结果物品堆叠上可用的选项中设置一种随机药水。若没有可用选项，则选取任意已注册的药水。

```json5
{
    "function": "minecraft:set_random_potion",
    // The potions to choose from.
    // Can either be a potion id, such as "minecraft:strength",
    // or a list of potion ids, such as ["minecraft:strength", "minecraft:night_vision", ...],
    // or a potion tag, such as "#minecraft:tradeable".
    "options": "minecraft:strength"
}
```

在数据生成期间，用可选的药水 `HolderSet` 调用 `SetRandomPotionFunction#fromTagKey` 来构建该函数的构建器。

## `minecraft:set_stew_effect` {#minecraftset_stew_effect}

在结果物品堆叠上设置一列炖菜效果。

```json5
{
    "function": "minecraft:set_stew_effect",
    // The effects to set.
    "effects": [
        {
        // The effect id.
        "type": "minecraft:fire_resistance",
        // The effect duration, in ticks. This can also be a number provider.
        "duration": 100
        }
    ]
}
```

在数据生成期间，调用 `SetStewEffectFunction#stewEffect` 来构建该函数的构建器。然后，在构建器上调用 `#withModifier`。

## `minecraft:set_ominous_bottle_amplifier` {#minecraftset_ominous_bottle_amplifier}

在结果物品堆叠上设置不祥之瓶的增幅等级。使用一个[数值提供器][numberprovider]。

```json5
{
    "function": "minecraft:set_ominous_bottle_amplifier",
    // The amplifier to use.
    "amplifier": {
        "type": "minecraft:uniform",
        "min": 1,
        "max": 3
    }
}
```

在数据生成期间，用所需的数值提供器调用 `SetOminousBottleAmplifierFunction#setAmplifier` 来构建该函数的构建器。

## `minecraft:exploration_map` {#minecraftexploration_map}

当且仅当结果物品堆叠是地图时，将其转换为一张探险地图。需要 `minecraft:origin` 战利品参数，若该参数缺省则不执行任何修改。

```json5
{
    "function": "minecraft:exploration_map",
    // A structure tag, containing the structures an exploration map can lead to.
    // Optional, defaults to "minecraft:on_treasure_maps", which only contains buried treasures by default.
    "destination": "minecraft:eye_of_ender_located",
    // The map decoration type to use. See the MapDecorationTypes class for available values.
    // Optional, defaults to "minecraft:mansion".
    "decoration": "minecraft:target_x",
    // The zoom level to use. Optional, defaults to 2.
    "zoom": 4,
    // The search radius to use. Optional, defaults to 50.
    "search_radius": 25,
    // Whether existing chunks are skipped when searching for structures. Optional, defaults to true.
    "skip_existing_chunks": true
}
```

在数据生成期间，调用 `ExplorationMapFunction#makeExplorationMap` 来构建该函数的构建器。然后，如有需要，在构建器上调用各个 setter。

## `minecraft:fill_player_head` {#minecraftfill_player_head}

根据给定的[实体目标][entitytarget]设置结果物品堆叠上的玩家头颅所有者。需要对应的战利品参数，若该参数缺省则不执行任何修改。

```json5
{
    "function": "minecraft:fill_player_head",
    // The entity target to use. If this doesn't resolve to a player, the stack is not modified.
    "entity": "this_entity"
}
```

在数据生成期间，用所需的实体目标调用 `FillPlayerHead#fillPlayerHead` 来构建该函数的构建器。

## `minecraft:set_banner_pattern` {#minecraftset_banner_pattern}

在结果物品堆叠上设置旗帜图案。这是针对旗帜的，而非旗帜图案物品。

```json5
{
    "function": "minecraft:set_banner_patterns",
    // A list of banner pattern layers.
    "patterns": [
        {
            // The id of the banner pattern to use.
            "pattern": "minecraft:globe",
            // The dye color of the layer.
            "color": "light_blue"
        }
    ],
    // Whether to append to the existing layers instead of replacing them.
    "append": true
}
```

在数据生成期间，用 `append` 布尔值调用 `SetBannerPatternFunction#setBannerPattern` 来构建该函数的构建器。然后，调用 `#addPattern` 向该函数添加图案。

## `minecraft:set_instrument` {#minecraftset_instrument}

在结果物品堆叠上设置乐器标签。

```json5
{
    "function": "minecraft:set_instrument",
    // The instrument tag to use.
    // Can either be an instrument id, such as "minecraft:admire_goat_horn",
    // or a list of instrument ids, such as ["minecraft:admire_goat_horn", "minecraft:seek_goat_horn", ...],
    // or a instrument tag, such as "#minecraft:goat_horns".
    "options": "#minecraft:goat_horns"
}
```

在数据生成期间，用乐器的 `HolderSet` 调用 `SetInstrumentFunction#setInstrumentOptions` 来构建该函数的构建器。

## `minecraft:set_fireworks` {#minecraftset_fireworks}

```json5
{
    "function": "minecraft:set_fireworks",
    // The explosions to use. Optional, uses the existing data component value if absent.
    "explosions": [
        {
            // The firework explosion shape to use. Valid vanilla values are "small_ball", "large_ball",
            // "star", "creeper" and "burst". Optional, defaults to "small_ball".
            "shape": "star",
            // The colors to use. Optional, defaults to an empty list.
            "colors": [
                16711680,
                65280
            ],
            // The fade colors to use. Optional, defaults to an empty list.
            "fade_colors": [
                65280,
                255
            ],
            // Whether the explosion has a trail. Optional, defaults to false.
            "has_trail": true,
            // Whether the explosion has a twinkle. Optional, defaults to false.
            "has_twinkle": true
        }
    ],
    // The flight duration of the fireworks. Optional, uses the existing data component value if absent.
    "flight_duration": 5
}
```

目前无法在数据生成期间创建此函数。

## `minecraft:set_firework_explosion` {#minecraftset_firework_explosion}

在结果物品堆叠上设置一次烟花爆炸。

```json5
{
    "function": "minecraft:set_firework_explosion",
    // The firework explosion shape to use. Valid vanilla values are "small_ball", "large_ball",
    // "star", "creeper" and "burst". Optional, defaults to "small_ball".
    "shape": "star",
    // The colors to use. Optional, defaults to an empty list.
    "colors": [
        16711680,
        65280
    ],
    // The fade colors to use. Optional, defaults to an empty list.
    "fade_colors": [
        65280,
        255
    ],
    // Whether the explosion has a trail. Optional, defaults to false.
    "trail": true,
    // Whether the explosion has a twinkle. Optional, defaults to false.
    "twinkle": true
}
```

目前无法在数据生成期间创建此函数。

## `minecraft:set_book_cover` {#minecraftset_book_cover}

设置成书中与页面无关的内容。

```json5
{
    "function": "minecraft:set_book_cover",
    // The book title. Optional, if absent, the book title remains unchanged.
    "title": "Hello World!",
    // The book author. Optional, if absent, the book author remains unchanged.
    "author": "Steve",
    // The book generation, i.e. how often it has been copied. Clamped between 0 and 3.
    // Optional, if absent, the book generation remains unchanged.
    "generation": 2
}
```

在数据生成期间，用所需的参数调用 `new SetBookCoverFunction` 来构建该函数的构建器。

## `minecraft:set_written_book_pages` {#minecraftset_written_book_pages}

设置成书的页面。

```json5
{
    "function": "minecraft:set_written_book_pages",
    // The pages to set, as a list of strings.
    "pages": [
        "Hello World!",
        "Hello World on page 2!",
        "Never Gonna Give You Up!"
    ],
    // The merging mode used. Valid values are:
    // - "append": Appends the entries to any existing lore entries.
    // - "insert": Inserts the entries at a certain position. The position is denoted as an additional field
    //   named "offset". "offset" is optional and defaults to 0.
    // - "replace_all": Removes all previous entries and then appends the entries.
    // - "replace_section": Removes a section of entries and then adds the entries at that position.
    //   The section removed is denoted through the "offset" and optional "size" fields.
    //   If "size" is omitted, the amount of lines in "lore" is used.
    "mode": {
        "type": "insert",
        "offset": 0
    }
}
```

目前无法在数据生成期间创建此函数。

## `minecraft:set_writable_book_pages` {#minecraftset_writable_book_pages}

设置书与笔（可书写书）的页面。

```json5
{
    "function": "minecraft:set_writable_book_pages",
    // The pages to set, as a list of strings.
    "pages": [
        "Hello World!",
        "Hello World on page 2!",
        "Never Gonna Give You Up!"
    ],
    // The merging mode used. Valid values are:
    // - "append": Appends the entries to any existing lore entries.
    // - "insert": Inserts the entries at a certain position. The position is denoted as an additional field
    //   named "offset". "offset" is optional and defaults to 0.
    // - "replace_all": Removes all previous entries and then appends the entries.
    // - "replace_section": Removes a section of entries and then adds the entries at that position.
    //   The section removed is denoted through the "offset" and optional "size" fields.
    //   If "size" is omitted, the amount of lines in "lore" is used.
    "mode": {
        "type": "insert",
        "offset": 0
    }
}
```

目前无法在数据生成期间创建此函数。

## `minecraft:set_custom_model_data` {#minecraftset_custom_model_data}

设置结果物品堆叠在渲染期间使用的自定义模型数据。

```json5
{
    "function": "minecraft:set_custom_model_data",
    // The float used during item model selection for the specified index
    // for a client item with a `minecraft:custom_model_data` range property.
    "floats": [
        // Will select the model where the property is less than 0.5 when "index": 0
        0.5,
        // Will select the model where the property is less than 0.25 when "index": 1
        0.25
    ],
    // The boolean used during item model selection for the specified index
    // for a client item with a `minecraft:custom_model_data` condition property.
    "flags": [
        // Will select the model where the condition is true when "index": 0
        true,
        // Will select the model where the condition is false when "index": 1
        false
    ],
    // The string used during item model selection for the specified index
    // for a client item with a `minecraft:custom_model_data` select property.
    "strings": [
        // Will select the model with the "dummy" case when "index": 0
        "dummy",
        // Will select the model with the "example" case when "index": 1
        "example"
    ],
    // The tint color to use for the specified index for a client item
    // with a `minecraft:custom_model_data` tint source.
    // 0xFF000000 is ORed with this value for an opaque color.
    "colors": [
        // Blue when "index": 0
        255,
        // Green when "index": 1
        65280
    ]
}
```

在数据生成期间，用一列条件、可选的数值提供器、布尔值、字符串以及数值提供器调用 `new SetCustomModelDataFunction()` 来构建关联的对象。

## `minecraft:filtered` {#minecraftfiltered}

该函数接受一个针对生成的堆叠进行检查的 `ItemPredicate`。根据检查成功（`on_pass`）还是失败（`on_fail`），运行相应定义的函数。一个 `ItemPredicate` 可以指定一列有效物品 id（`items`）、物品数量的最小/最大范围（`count`）、一个 `DataComponentPredicate`（`components`）以及一个 `ItemSubPredicate` 的映射（`predicates`）；所有字段都是可选的。

```json5
{
    "function": "minecraft:filtered",
    // The custom model data value to use. This can also be a number provider.
    "item_filter": {
        "items": [
            "minecraft:diamond_shovel"
        ]
    },
    // The loot function to run if the predicate succeeds.
    // A loot modifier file or an in-line list of functions.
    "on_pass": "examplemod:example_pass",
    // The loot function to run if the predicate fails.
    // A loot modifier file or an in-line list of functions.
    "on_fail": "examplemod:example_fail"
}
```

目前无法在数据生成期间创建此函数。

:::warning
此函数一般应被视为已弃用。请改用带有 `minecraft:match_tool` 条件的所传入函数。
:::

## `minecraft:reference` {#minecraftreference}

该函数引用一个物品修改器并将其应用到结果物品堆叠。更多信息参见[物品修改器][itemmodifiers]。

```json5
{
    "function": "minecraft:reference",
    // Refers to the item modifier file at data/examplemod/item_modifier/example_modifier.json.
    "name": "examplemod:example_modifier"
}
```

在数据生成期间，用所引用谓词文件的 id 调用 `FunctionReference#functionReference` 来构建该函数的构建器。

## `minecraft:sequence` {#minecraftsequence}

该函数依次运行其他战利品函数。

```json5
{
    "function": "minecraft:sequence",
    // A list of functions to run.
    "functions": [
        {
            "function": "minecraft:set_count",
            // ...
        },
        {
            "function": "minecraft:explosion_decay"
        }
    ],
}
```

在数据生成期间，用其他函数调用 `SequenceFunction#of` 来构建该函数的构建器。

## `minecraft:discard` {#minecraftdiscard}

该函数丢弃原始堆叠，返回一个空物品。

```json5
{
    "function": "minecraft:discard"
}
```

在数据生成期间，用其他函数调用 `DiscardItem#discardItem` 来构建该函数的构建器。


## 参见 {#see-also}

- [Minecraft Wiki][mcwiki] 上的[物品修改器][itemmodifiers]

[at]: ../../../advanced/accesstransformers.md
[attributemodifier]: ../../../entities/attributes.md#attribute-modifiers
[component]: ../../client/i18n.md#components
[conditions]: lootconditions
[custom]: custom.md#custom-loot-functions
[datacomponent]: ../../../items/datacomponents.md
[entitytarget]: index.md#entity-targets
[entry]: index.md#loot-entry
[itemmodifiers]: https://minecraft.wiki/w/Item_modifier#JSON_format
[mcwiki]: https://minecraft.wiki
[nbt]: ../../../datastorage/nbt.md
[numberprovider]: index.md#number-provider
[pool]: index.md#loot-pool
[table]: index.md#loot-table

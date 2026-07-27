# 内置数据映射 {#built-in-data-maps}

NeoForge 为常见用例提供了多种内置[数据映射][datamap]，用于替代硬编码的原版字段。原版数值通过 NeoForge 中的数据映射文件提供，因此对玩家而言没有任何功能上的差异。

## `neoforge:compostables` {#neoforgecompostables}

用于配置堆肥桶数值，替代 `ComposterBlock.COMPOSTABLES`（现已被忽略）。该数据映射位于 `neoforge/data_maps/item/compostables.json`，其对象结构如下：

```json5
{
    // A 0 to 1 (inclusive) float representing the chance that the item will update the level of the composter
    "chance": 1,
    // Optional, defaults to false - whether farmer villagers can compost this item
    "can_villager_compost": false
}
```

示例：

```json5
{
    "values": {
        // Give acacia logs a 50% chance that they will fill a composter
        "minecraft:acacia_log": {
            "chance": 0.5
        }
    }
}
```

## `neoforge:furnace_fuels` {#neoforgefurnace_fuels}

用于配置物品的燃烧时间。该数据映射位于 `neoforge/data_maps/item/furnace_fuels.json`，其对象结构如下：

```json5
{
    // A positive integer representing the item's burn time in ticks
    "burn_time": 1000
}
```

示例：

```json5
{
    "values": {
        // Give anvils a 2 seconds burn time
        "minecraft:anvil": {
            "burn_time": 40
        }
    }
}
```

:::info
NeoForge 还额外提供了 `IItemExtension#getBurnTime` 方法，可在自定义物品中重写以覆盖此数据映射。 `#getBurnTime` 应当仅在该数据映射不足以满足需求的场景下使用，例如依赖[数据组件][datacomponent]的燃烧时间。
:::

:::warning
原版为 `#minecraft:logs` 和 `#minecraft:planks` 隐式添加了 300 tick（15 秒）的燃烧时间，然后又硬编码地将绯红木和诡异木相关物品从中移除。这意味着，如果你添加了另一种不可燃的木材，你应当将该木材类型的物品从此映射中移除，如下所示：

```json5
{
    "replace": false,
    "values": [
        // values here
    ],
    "remove": [
        "examplemod:example_nether_wood_planks",
        "#examplemod:example_nether_wood_stems",
        "examplemod:example_nether_wood_door",
        // etc.
        // other removals here
    ]
}
```
:::

## `neoforge:monster_room_mobs` {#neoforgemonster_room_mobs}

用于配置可能出现在怪物房刷怪笼中的生物，替代 `MonsterRoomFeature#MOBS`（现已被忽略）。该数据映射位于 `neoforge/data_maps/entity_type/monster_room_mobs.json`，其对象结构如下：

```json5
{
    // The weight of this mob, relative to other mobs in the datamap
    "weight": 100
}
```

示例：

```json5
{
    "values": {
        // Make squids appear in monster room spawners with a weight of 100
        "minecraft:squid": {
            "weight": 100
        }
    }
}
```

## `neoforge:oxidizables` {#neoforgeoxidizables}

用于配置氧化阶段，替代 `WeatheringCopper#NEXT_BY_BLOCK`（将在 1.21.2 中被忽略）。该数据映射还用于构建反向的去氧化映射（用于用斧刮除）。它位于 `neoforge/data_maps/block/oxidizables.json`，其对象结构如下：

```json5
{
    // The block this block will turn into once oxidized
    "next_oxidation_stage": "examplemod:oxidized_block"
}
```

:::note
自定义方块必须实现 `WeatheringCopperFullBlock` 或 `WeatheringCopper`，并在 `randomTick` 中调用 `changeOverTime` 才能自然氧化。
:::

示例：

```json5
{
    "values": {
        "mymod:custom_copper": {
            // Make a custom copper block oxidize into custom oxidized copper
            "next_oxidation_stage": "mymod:custom_oxidized_copper"
        }
    }
}
```

## `neoforge:parrot_imitations` {#neoforgeparrot_imitations}

用于配置鹦鹉模仿生物时发出的声音，替代 `Parrot#MOB_SOUND_MAP`（现已被忽略）。该数据映射位于 `neoforge/data_maps/entity_type/parrot_imitations.json`，其对象结构如下：

```json5
{
    // The ID of the sound that parrots will produce when imitating the mob
    "sound": "minecraft:entity.parrot.imitate.creeper"
}
```

示例：

```json5
{
    "values": {
        // Make parrots produce the ambient cave sound when imitating allays
        "minecraft:allay": {
            "sound": "minecraft:ambient.cave"
        }
    }
}
```

## `neoforge:raid_hero_gifts` {#neoforgeraid_hero_gifts}

用于配置具有特定 `VillagerProfession` 的村民在你阻止袭击后可能赠送给你的礼物，替代 `GiveGiftToHero#GIFTS`（现已被忽略）。该数据映射位于 `neoforge/data_maps/villager_profession/raid_hero_gifts.json`，其对象结构如下：

```json5
{
    // The ID of the loot table that a villager profession will hand out after a raid
    "loot_table": "minecraft:gameplay/hero_of_the_village/armorer_gift"
}
```

示例：

```json5
{
    "values": {
        "minecraft:armorer": {
            // Make armorers give the raid hero the armorer gift loot table
            "loot_table": "minecraft:gameplay/hero_of_the_village/armorer_gift"
        }
    }
}
```

## `neoforge:vibration_frequencies` {#neoforgevibration_frequencies}

用于配置游戏事件发出的幽匿振动频率，替代 `VibrationSystem#VIBRATION_FREQUENCY_FOR_EVENT`（现已被忽略）。该数据映射位于 `neoforge/data_maps/game_event/vibration_frequencies.json`，其对象结构如下：

```json5
{
    // An integer between 1 and 15 (inclusive) that indicates the vibration frequency of the event
    "frequency": 2
}
```

示例：

```json5
{
    "values": {
        // Make the splash in water game event vibrate on the second frequency
        "minecraft:splash": {
            "frequency": 2
        }
    }
}
```

## `neoforge:villager_types` {#neoforgevillager_types}

用于配置根据生物群系生成的村民类型，替代 `VillagerType#BY_BIOME`（将在 26.2 中被忽略）。它位于 `neoforge/data_maps/worldgen/biome/villager_types.json`，其对象结构如下：

```json5
{
    // The villager type that will spawn in this biome
    // If no villager type is specified for a biome, then `minecraft:plains` will be used
    "villager_type": "minecraft:desert"
    
}
```

示例：

```json5
{
    "values": {
        // Make villagers in the jungle biome be of the desert type
        "minecraft:jungle": {
            "villager_type": "minecraft:desert"
        }
    }
}
```

## `neoforge:waxables` {#neoforgewaxables}

用于配置方块在打蜡后（用蜜脾右键点击）会变成的方块，替代 `HoneycombItem#WAXABLES`（将在 1.21.2 中被忽略）。该数据映射还用于构建反向的去蜡映射（用于用斧刮除）。它位于 `neoforge/data_maps/block/waxables.json`，其对象结构如下：

```json5
{
    // The waxed variant of this block
    "waxed": "minecraft:iron_block"
}
```

示例：

```json5
{
    "values": {
        // Make gold blocks turn into iron blocks once waxed
        "minecraft:gold_block": {
            "waxed": "minecraft:iron_block"
        }
    }
}
```

[datacomponent]: ../../../items/datacomponents.md
[datamap]: index.md

# 内置数据映射 {#built-in-data-maps}

NeoForge 为常见用例提供了各种内置[数据映射][datamap]，用以替代硬编码的原版字段。原版的值由 NeoForge 中的数据映射文件提供，因此对玩家而言没有任何功能上的差异。

## `neoforge:acceptable_villager_distances` {#neoforgeacceptable_villager_distances}

允许配置村民察觉某实体的最大方块距离，用以替代 `VillagerHostilesSensor.ACCEPTABLE_DISTANCE_FROM_HOSTILES`（它将在 26.2 中被忽略）。该数据映射位于 `neoforge/data_maps/entity_type/acceptable_villager_distances.json`，其对象具有以下结构：

```json5
{
    // The maximum block distance that a villager will detect this entity as hostile
    "acceptable_villager_distance": 4.0
}
```

示例：

```json5
{
    "values": {
        // Villagers will detect a blaze as hostile if it is within 4 blocks of its position
        "minecraft:blaze": {
            "acceptable_villager_distance": 4.0
        }
    }
}
```

## `neoforge:compostables` {#neoforgecompostables}

允许配置堆肥桶的值，用以替代 `ComposterBlock.COMPOSTABLES`（现已被忽略）。该数据映射位于 `neoforge/data_maps/item/compostables.json`，其对象具有以下结构：

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

允许配置物品的燃烧时间。该数据映射位于 `neoforge/data_maps/item/furnace_fuels.json`，其对象具有以下结构：

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
NeoForge 额外添加了可在自定义物品中重写的 `IItemExtension#getBurnTime` 方法，它会覆盖此数据映射。`#getBurnTime` 只应在数据映射不足以满足需求的场景下使用，例如依赖[数据组件][datacomponent]的燃烧时间。
:::

:::warning
原版为 `#minecraft:logs` 和 `#minecraft:planks` 添加了 300 刻（15 秒）的隐式燃烧时间，然后硬编码地把绯红和诡异物品从中移除。这意味着，如果你添加了另一种不可燃的木材，你应该把该木材类型的物品从此映射中移除，如下所示：

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

允许配置可能出现在怪物房间刷怪笼中的生物，用以替代 `MonsterRoomFeature#MOBS`（现已被忽略）。该数据映射位于 `neoforge/data_maps/entity_type/monster_room_mobs.json`，其对象具有以下结构：

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

允许配置氧化阶段，用以替代 `WeatheringCopper#NEXT_BY_BLOCK`。该数据映射还被用于构建反向的去氧化映射（用斧刮除时用到）。它位于 `neoforge/data_maps/block/oxidizables.json`，其对象具有以下结构：

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

允许配置鹦鹉在想要模仿某生物时发出的声音，用以替代 `Parrot#MOB_SOUND_MAP`（现已被忽略）。该数据映射位于 `neoforge/data_maps/entity_type/parrot_imitations.json`，其对象具有以下结构：

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

允许配置在你阻止袭击后，具有特定 `VillagerProfession` 的村民可能赠予你的礼物，用以替代 `GiveGiftToHero#GIFTS`（现已被忽略）。该数据映射位于 `neoforge/data_maps/villager_profession/raid_hero_gifts.json`，其对象具有以下结构：

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

## `neoforge:strippables` {#neoforgestrippables}

允许配置方块在被剥皮（用斧右键点击，或用带有 `ItemAbilities#AXE_STRIP` 物品能力的物品）时会变成的方块，用以替代 `AxeItem#STRIPPABLES`（它将在 26.2 中被忽略）。该数据映射位于 `neoforge/data_maps/block/strippables.json`，其对象具有以下结构：

```json5
{
    // The block this block will turn into when stripped by tool with the item ability `ItemAbilities#AXE_STRIP`
    "stripped_block": "examplemod:stripped_wood"
}
```

示例：

```json5
{
    "values": {
        "examplemod:wood": {
            // Make a custom wood block strip into a custom stripped wood block
            "stripped_block": "examplemod:stripped_wood"
        }
    }
}
```

## `neoforge:vibration_frequencies` {#neoforgevibration_frequencies}

允许配置游戏事件发出的幽匿振动频率，用以替代 `VibrationSystem#VIBRATION_FREQUENCY_FOR_EVENT`（现已被忽略）。该数据映射位于 `neoforge/data_maps/game_event/vibration_frequencies.json`，其对象具有以下结构：

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

允许根据生物群系配置将生成的村民类型，用以替代 `VillagerType#BY_BIOME`（它将在 26.2 中被忽略）。它位于 `neoforge/data_maps/worldgen/biome/villager_types.json`，其对象具有以下结构：

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

允许配置方块在被打蜡（用蜜脾右键点击）时会变成的方块，用以替代 `HoneycombItem#WAXABLES`。该数据映射还被用于构建反向的去蜡映射（用斧刮除时用到）。它位于 `neoforge/data_maps/block/waxables.json`，其对象具有以下结构：

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

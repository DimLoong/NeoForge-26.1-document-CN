import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 生物群系修改器 {#biome-modifiers}

生物群系修改器（BiomeModifier）是一套数据驱动的系统，允许更改生物群系的诸多方面，包括注入或移除 PlacedFeature、添加或移除生物生成、更改气候，以及调整植被和水体颜色。NeoForge 提供了几种默认的生物群系修改器，覆盖了玩家和 Mod 开发者的大部分用例。

### 推荐阅读的章节： {#recommended-section-to-read}

- 玩家或整合包开发者：
    - [应用生物群系修改器](#applying-biome-modifiers)
    - [NeoForge 内置生物群系修改器](#built-in-biome-modifiers)


- 进行简单添加或移除类生物群系修改的 Mod 开发者：
    - [应用生物群系修改器](#applying-biome-modifiers)
    - [NeoForge 内置生物群系修改器](#built-in-biome-modifiers)
    - [数据生成生物群系修改器](#datagenning-biome-modifiers)
    - [针对可能不存在的生物群系](#targeting-biomes-that-may-not-exist)


- 想要进行自定义或复杂生物群系修改的 Mod 开发者：
    - [应用生物群系修改器](#applying-biome-modifiers)
    - [创建自定义生物群系修改器](#creating-custom-biome-modifiers)
    - [数据生成生物群系修改器](#datagenning-biome-modifiers)
    - [针对可能不存在的生物群系](#targeting-biomes-that-may-not-exist)


## 应用生物群系修改器 {#applying-biome-modifiers}

要让 NeoForge 将某个生物群系修改器 JSON 文件加载进游戏，该文件需要放在 Mod 资源中的 `data/<modid>/neoforge/biome_modifier/<path>.json` 文件夹下，或放在[数据包（Datapack）][datapacks]中。随后，一旦 NeoForge 加载了该生物群系修改器，它会读取其中的指令，并在世界加载时对所有目标生物群系应用所描述的修改。来自 Mod 的现有生物群系修改器可以被数据包覆盖，只需数据包在完全相同的位置和名称下提供一个新的 JSON 文件即可。

JSON 文件可以按照“[NeoForge 内置生物群系修改器](#built-in-biome-modifiers)”一节中的示例手动创建，也可以按照“[数据生成生物群系修改器](#datagenning-biome-modifiers)”一节所示进行数据生成。

## 内置生物群系修改器 {#built-in-biome-modifiers}

这些生物群系修改器由 NeoForge 注册，供任何人使用。

### None {#none}

此生物群系修改器不执行任何操作，也不会做任何修改。整合包制作者和玩家可以在数据包中用它来禁用 Mod 的生物群系修改器，方法是用下面的 JSON 覆盖它们的生物群系修改器 JSON。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:none"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> NO_OP_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    Identifier.fromNamespaceAndPath(MOD_ID, "no_op_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for the `GatherDataEvent`s.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Register the biome modifiers.
    bootstrap.register(NO_OP_EXAMPLE, NoneBiomeModifier.INSTANCE);
});
```

</TabItem>
</Tabs>

### Add Features {#add-features}

此类生物群系修改器向生物群系添加 `PlacedFeature`（如树木或矿石），以便它们能在世界生成期间生成。该修改器接收要添加地物的生物群系的 id 或标签、要添加到所选生物群系的 `PlacedFeature` id 或标签，以及地物将在其中生成的 [`GenerationStep.Decoration`](#Available-Values-for-Decoration-Steps)。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:add_features",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:your_biome_tag",
    // Can either be a placed feature id, such as "examplemod:add_features_example",
    // or a list of placed feature ids, such as ["examplemod:add_features_example", minecraft:ice_spike", ...],
    // or a placed feature tag, such as "#examplemod:placed_feature_tag".
    "features": "namespace:your_feature",
    // See the GenerationStep.Decoration enum in code for a list of valid enum names.
    // The decoration step section further down also has the list of values for reference.
    "step": "underground_ores"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Assume we have some PlacedFeature named EXAMPLE_PLACED_FEATURE.
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> ADD_FEATURES_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    Identifier.fromNamespaceAndPath(MOD_ID, "add_features_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for the `GatherDataEvent`s.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<PlacedFeature> placedFeatures = bootstrap.lookup(Registries.PLACED_FEATURE);

    // Register the biome modifiers.
    bootstrap.register(ADD_FEATURES_EXAMPLE,
        new AddFeaturesBiomeModifier(
            // The biome(s) to generate within
            HolderSet.direct(biomes.getOrThrow(Biomes.PLAINS)),
            // The feature(s) to generate within the biomes
            HolderSet.direct(placedFeatures.getOrThrow(EXAMPLE_PLACED_FEATURE)),
            // The generation step
            GenerationStep.Decoration.LOCAL_MODIFICATIONS
        )
    );
})
```

</TabItem>
</Tabs>


:::warning
向生物群系添加原版 `PlacedFeature` 时应格外小心，因为这样做可能引发所谓的地物循环冲突（feature cycle violation，即两个生物群系在同一个 `GenerationStep` 中拥有相同的两个地物，但它们在各自地物列表中的顺序不同），从而导致崩溃。出于类似原因，你不应在多个生物群系修改器中使用同一个 `PlacedFeature`。

原版 `PlacedFeature` 可以在生物群系 JSON 中引用，也可以通过生物群系修改器添加，但不应同时用于两者。如果你仍需以这种方式添加它们，在你自己的命名空间下复制一份原版 `PlacedFeature` 是避免这些问题的最简便办法。
:::

### Remove Features {#remove-features}

此类生物群系修改器从生物群系中移除地物（如树木或矿石），使它们在世界生成期间不再生成。该修改器接收要移除地物的生物群系的 id 或标签、要从所选生物群系移除的 `PlacedFeature` id 或标签，以及地物将从中移除的 [`GenerationStep.Decoration`](#Available-Values-for-Decoration-Steps)。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:remove_features",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:your_biome_tag",
    // Can either be a placed feature id, such as "examplemod:add_features_example",
    // or a list of placed feature ids, such as ["examplemod:add_features_example", "minecraft:ice_spike", ...],
    // or a placed feature tag, such as "#examplemod:placed_feature_tag".
    "features": "namespace:problematic_feature",
    // Optional field specifying a GenerationStep, or a list of GenerationSteps, to remove features from.
    // If omitted, defaults to all GenerationSteps.
    // See the GenerationStep.Decoration enum in code for a list of valid enum names.
    // The decoration step section further down also has the list of values for reference.
    "steps": ["underground_ores", "underground_decoration"]
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> REMOVE_FEATURES_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    Identifier.fromNamespaceAndPath(MOD_ID, "remove_features_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for the `GatherDataEvent`s.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<PlacedFeature> placedFeatures = bootstrap.lookup(Registries.PLACED_FEATURE);

    // Register the biome modifiers.
    bootstrap.register(REMOVE_FEATURES_EXAMPLE,
        new RemoveFeaturesBiomeModifier(
            // The biome(s) to remove from
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            // The feature(s) to remove from the biomes
            HolderSet.direct(placedFeatures.getOrThrow(OrePlacements.ORE_DIAMOND)),
            // The generation steps to remove from
            Set.of(
                GenerationStep.Decoration.LOCAL_MODIFICATIONS,
                GenerationStep.Decoration.UNDERGROUND_ORES
            )
        )
    );
});
```

</TabItem>
</Tabs>


### Add Spawns {#add-spawns}

_另见[生物实体/自然生成][spawning]。_

此类生物群系修改器向生物群系添加实体生成。该修改器接收要添加实体生成的生物群系的 id 或标签，以及要添加实体的 `SpawnerData`。每个 `SpawnerData` 包含实体 id、生成权重，以及一次生成时实体的最小/最大数量。

:::note
如果你是 Mod 开发者且正在添加一个新实体，请确保该实体有一个注册到 `RegisterSpawnPlacementsEvent` 的生成限制。生成限制用于让实体安全地在地表或水中生成。如果你不注册生成限制，你的实体可能会在半空中生成，然后坠落并死亡。
:::

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:add_spawns",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:biome_tag",
    // Can be either a single object or a list of objects.
    "spawners": [
        {
            "type": "namespace:entity_type", // The id of the entity type to spawn
            "weight": 100, // non-negative int, spawn weight
            "minCount": 1, // positive int, minimum group size
            "maxCount": 4 // positive int, maximum group size
        },
        {
            "type": "minecraft:ghast",
            "weight": 1,
            "minCount": 5,
            "maxCount": 10
        }
    ]
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Assume we have some EntityType<?> named EXAMPLE_ENTITY.
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> ADD_SPAWNS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    Identifier.fromNamespaceAndPath(MOD_ID, "add_spawns_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for the `GatherDataEvent`s.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);

    // Register the biome modifiers.
    bootstrap.register(ADD_SPAWNS_EXAMPLE,
        new AddSpawnsBiomeModifier(
            // The biome(s) to spawn the mobs within
            HolderSet.direct(biomes.getOrThrow(Biomes.PLAINS)),
            // The spawners of the entities to add
            List.of(
                new SpawnerData(EXAMPLE_ENTITY, 100, 1, 4),
                new SpawnerData(EntityType.GHAST, 1, 5, 10)
            )
        )
    );
});
```

</TabItem>
</Tabs>


### Remove Spawns {#remove-spawns}

此类生物群系修改器从生物群系中移除实体生成。该修改器接收要移除实体生成的生物群系的 id 或标签，以及要移除实体的 `EntityType` id 或标签。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:remove_spawns",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:biome_tag",
    // Can either be an entity type id, such as "minecraft:ghast",
    // or a list of entity type ids, such as ["minecraft:ghast", "minecraft:skeleton", ...],
    // or an entity type tag, such as "#minecraft:skeletons".
    "entity_types": "#namespace:entitytype_tag"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> REMOVE_SPAWNS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    Identifier.fromNamespaceAndPath(MOD_ID, "remove_spawns_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for the `GatherDataEvent`s.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<EntityType<?>> entities = bootstrap.lookup(Registries.ENTITY_TYPE);

    // Register the biome modifiers.
    bootstrap.register(REMOVE_SPAWNS_EXAMPLE,
        new RemoveSpawnsBiomeModifier(
            // The biome(s) to remove the spawns from
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            // The entities to remove spawns for
            entities.getOrThrow(EntityTypeTags.SKELETONS)
        )
    );
});
```

</TabItem>
</Tabs>


### Add Spawn Costs {#add-spawn-costs}

允许向生物群系添加新的生成成本。生成成本是一种较新的方式，用于让生物在生物群系中分散生成以减少聚集。它的工作原理是：让实体散发出围绕自身的 `charge`，并与其他实体的 `charge` 累加。生成新实体时，生成算法会寻找一个位置，使该位置的总 `charge` 场值乘以待生成实体的 `charge` 值小于待生成实体的 `energy_budget`。这是一种高级的生物生成方式，因此参考灵魂沙峡谷生物群系（该系统最主要的使用者）中现有的值来借鉴是个好主意。

该修改器接收要添加生成成本的生物群系的 id 或标签、要为其添加生成成本的实体类型的 `EntityType` id 或标签，以及实体的 `MobSpawnSettings.MobSpawnCost`。`MobSpawnCost` 包含 energy budget（能量预算），它根据每个生成实体所提供的 charge，指示某个位置最多能生成的实体数量。

:::note
如果你是 Mod 开发者且正在添加一个新实体，请确保该实体有一个注册到 `RegisterSpawnPlacementsEvent` 的生成限制。
:::

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:add_spawn_costs",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:biome_tag",
    // Can either be an entity type id, such as "minecraft:ghast",
    // or a list of entity type ids, such as ["minecraft:ghast", "minecraft:skeleton", ...],
    // or an entity type tag, such as "#minecraft:skeletons".
    "entity_types": "#minecraft:skeletons",
    "spawn_cost": {
        // The energy budget
        "energy_budget": 1.0,
        // The amount of charge each entity takes up from the budget
        "charge": 0.1
    }
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> ADD_SPAWN_COSTS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    Identifier.fromNamespaceAndPath(MOD_ID, "add_spawn_costs_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for the `GatherDataEvent`s.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<EntityType<?>> entities = bootstrap.lookup(Registries.ENTITY_TYPE);

    // Register the biome modifiers.
    bootstrap.register(ADD_SPAWN_COSTS_EXAMPLE,
        new AddSpawnCostsBiomeModifier(
            // The biome(s) to add the spawn costs to
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            // The entities to add the spawn costs for
            entities.getOrThrow(EntityTypeTags.SKELETONS),
            new MobSpawnSettings.MobSpawnCost(
                1.0, // The energy budget
                0.1  // The amount of charge each entity takes up from the budget
            )
        )
    );
});
```

</TabItem>
</Tabs>


### Remove Spawn Costs {#remove-spawn-costs}

允许从生物群系中移除某个生成成本。生成成本是一种较新的方式，用于让生物在生物群系中分散生成以减少聚集。该修改器接收要移除生成成本的生物群系的 id 或标签，以及要为其移除生成成本的实体的 `EntityType` id 或标签。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:remove_spawn_costs",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "#namespace:biome_tag",
    // Can either be an entity type id, such as "minecraft:ghast",
    // or a list of entity type ids, such as ["minecraft:ghast", "minecraft:skeleton", ...],
    // or an entity type tag, such as "#minecraft:skeletons".
    "entity_types": "#minecraft:skeletons"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> REMOVE_SPAWN_COSTS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    Identifier.fromNamespaceAndPath(MOD_ID, "remove_spawn_costs_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for the `GatherDataEvent`s.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<EntityType<?>> entities = bootstrap.lookup(Registries.ENTITY_TYPE);

    // Register the biome modifiers.
    bootstrap.register(REMOVE_SPAWN_COSTS_EXAMPLE,
        new RemoveSpawnCostsBiomeModifier(
            // The biome(s) to remove the spawn costs from
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            // The entities to remove spawn costs for
            entities.getOrThrow(EntityTypeTags.SKELETONS)
        )
    );
});
```

</TabItem>
</Tabs>


### Add Legacy Carvers {#add-legacy-carvers}

此类生物群系修改器允许向生物群系添加雕刻器（carver）洞穴和峡谷。这些是“洞穴与山崖”更新之前用于洞穴生成的机制。它**不能**向生物群系添加噪声洞穴，因为噪声洞穴是某些基于噪声的区块生成器系统的一部分，并不真正与生物群系绑定。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
    {
    "type": "neoforge:add_carvers",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "minecraft:plains",
    // Can either be a carver id, such as "examplemod:add_carvers_example",
    // or a list of carver ids, such as ["examplemod:add_carvers_example", "minecraft:canyon", ...],
    // or a carver tag, such as "#examplemod:configured_carver_tag".
    "carvers": "examplemod:add_carvers_example"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Assume we have some ConfiguredWorldCarver named EXAMPLE_CARVER.
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> ADD_CARVERS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    Identifier.fromNamespaceAndPath(MOD_ID, "add_carvers_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for the `GatherDataEvent`s.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<ConfiguredWorldCarver<?>> carvers = bootstrap.lookup(Registries.CONFIGURED_CARVER);

    // Register the biome modifiers.
    bootstrap.register(ADD_CARVERS_EXAMPLE,
        new AddCarversBiomeModifier(
            // The biome(s) to generate within
            HolderSet.direct(biomes.getOrThrow(Biomes.PLAINS)),
            // The carver(s) to generate within the biomes
            HolderSet.direct(carvers.getOrThrow(EXAMPLE_CARVER))
        )
    );
});
```

</TabItem>
</Tabs>

### Removing Legacy Carvers {#removing-legacy-carvers}

此类生物群系修改器允许从生物群系中移除雕刻器（carver）洞穴和峡谷。这些是“洞穴与山崖”更新之前用于洞穴生成的机制。它**不能**从生物群系中移除噪声洞穴，因为噪声洞穴被烘焙进维度的噪声设置系统，并不真正与生物群系绑定。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    "type": "neoforge:remove_carvers",
    // Can either be a biome id, such as "minecraft:plains",
    // or a list of biome ids, such as ["minecraft:plains", "minecraft:badlands", ...],
    // or a biome tag, such as "#c:is_overworld".
    "biomes": "minecraft:plains",
    // Can either be a carver id, such as "examplemod:add_carvers_example",
    // or a list of carver ids, such as ["examplemod:add_carvers_example", "minecraft:canyon", ...],
    // or a carver tag, such as "#examplemod:configured_carver_tag".
    "carvers": "examplemod:add_carvers_example"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> REMOVE_CARVERS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    Identifier.fromNamespaceAndPath(MOD_ID, "remove_carvers_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for the `GatherDataEvent`s.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);
    HolderGetter<ConfiguredWorldCarver<?>> carvers = bootstrap.lookup(Registries.CONFIGURED_CARVER);

    // Register the biome modifiers.
    bootstrap.register(REMOVE_CARVERS_EXAMPLE,
        new AddFeaturesBiomeModifier(
            // The biome(s) to remove from
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            // The carver(s) to remove from the biomes
            HolderSet.direct(carvers.getOrThrow(Carvers.CAVE))
        )
    );
});
```

</TabItem>
</Tabs>

### 装饰步骤的可用取值 {#available-values-for-decoration-steps}

前述许多 JSON 中的 `step` 或 `steps` 字段，指的是 `GenerationStep.Decoration` 枚举。此枚举按以下顺序列出各步骤，这与游戏在世界生成期间使用的顺序相同。请尽量把地物放在对它们最合理的步骤中。

|           步骤           | 描述                                                                                    |
|:------------------------:|:----------------------------------------------------------------------------------------|
|     `raw_generation`     | 最先运行。用于类似特殊地形的地物，如小型末地岛。                                          |
|         `lakes`          | 专用于生成类似池塘的地物，如熔岩湖。                                                      |
|  `local_modifications`   | 用于对地形的修改，如晶洞、冰山、巨石或滴水石。                                            |
| `underground_structures` | 用于小型的类地下结构地物，如地牢或化石。                                                  |
|   `surface_structures`   | 用于仅位于地表的小型类结构地物，如沙漠水井。                                              |
|      `strongholds`       | 专用于要塞结构。在未修改的 Minecraft 中此处不添加任何地物。                               |
|    `underground_ores`    | 所有矿石和矿脉都添加到此步骤。包括金矿、泥土、花岗岩等。                                  |
| `underground_decoration` | 通常用于装饰洞穴。滴水石簇和幽匿脉络位于此处。                                            |
|     `fluid_springs`      | 小型的熔岩瀑布和水瀑布来自此阶段的地物。                                                  |
|   `vegetal_decoration`   | 几乎所有植物（花、树、藤蔓等）都添加到此阶段。                                            |
| `top_layer_modification` | 最后运行。用于在寒冷生物群系的地表放置雪和冰。                                            |


## 创建自定义生物群系修改器 {#creating-custom-biome-modifiers}

### `BiomeModifier` 实现 {#the-biomemodifier-implementation}

在底层，生物群系修改器由三部分组成：

- [数据包注册的][datareg] `BiomeModifier`，用于修改生物群系构建器。
- [静态注册的][staticreg] `MapCodec`，用于编码和解码这些修改器。
- 用于构造 `BiomeModifier` 的 JSON，它使用已注册的 `MapCodec` 的 id 作为可索引类型。

`BiomeModifier` 包含两个方法：`#modify` 和 `#codec`。`modify` 接收当前 `Biome` 的 `Holder`、当前的 `BiomeModifier.Phase`，以及要修改的生物群系的构建器。每个 `BiomeModifier` 会在每个 `Phase` 被调用一次，以便组织对生物群系的某些修改应在何时发生：

| 阶段                | 描述                                                              |
|:-------------------:|:-------------------------------------------------------------------------|
| `BEFORE_EVERYTHING` | 一个兜底阶段，用于所有需要在标准阶段之前运行的操作。               |
| `ADD`               | 添加地物、生物生成等。                                            |
| `REMOVE`            | 移除地物、生物生成等。                                            |
| `MODIFY`            | 修改单个值（例如气候、颜色）。                                    |
| `AFTER_EVERYTHING`  | 一个兜底阶段，用于所有需要在标准阶段之后运行的操作。               |

所有 `BiomeModifier` 都包含一个 `type` 键，它引用该 `BiomeModifier` 所用 `MapCodec` 的 id。`codec` 接收用于编码和解码这些修改器的 `MapCodec`。此 `MapCodec` 是[静态注册的][staticreg]，其 id 用作 `BiomeModifier` 的 `type`。

```java
public record ExampleBiomeModifier(HolderSet<Biome> biomes, int value) implements BiomeModifier {
    
    @Override
    public void modify(Holder<Biome> biome, Phase phase, ModifiableBiomeInfo.BiomeInfo.Builder builder) {
        if (phase == /* Pick the phase that best matches what your want to modify */) {
            // Modify the 'builder', checking any information about the biome itself
        }
    }

    @Override
    public MapCodec<? extends BiomeModifier> codec() {
        return EXAMPLE_BIOME_MODIFIER.get();
    }
}

// In some registration class
private static final DeferredRegister<MapCodec<? extends BiomeModifier>> BIOME_MODIFIERS =
    DeferredRegister.create(NeoForgeRegistries.Keys.BIOME_MODIFIER_SERIALIZERS, MOD_ID);

public static final Supplier<MapCodec<ExampleBiomeModifier>> EXAMPLE_BIOME_MODIFIER =
    BIOME_MODIFIERS.register("example_biome_modifier", () -> RecordCodecBuilder.mapCodec(instance ->
        instance.group(
            Biome.LIST_CODEC.fieldOf("biomes").forGetter(ExampleBiomeModifier::biomes),
            Codec.INT.fieldOf("value").forGetter(ExampleBiomeModifier::value)
        ).apply(instance, ExampleBiomeModifier::new)
    ));
```


## 数据生成生物群系修改器 {#datagenning-biome-modifiers}

可以通过[数据生成][datagen]创建 `BiomeModifier` JSON，方法是将一个 `RegistrySetBuilder` 传给 `DatapackBuiltinEntriesProvider`。生成的 JSON 将放在 `data/<modid>/neoforge/biome_modifier/<path>.json`。

有关 `RegistrySetBuilder` 和 `DatapackBuiltinEntriesProvider` 如何工作的更多信息，请参阅[数据包注册表的数据生成][datapackdatagen]一文。

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> EXAMPLE_MODIFIER = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    Identifier.fromNamespaceAndPath(MOD_ID, "example_modifier") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for the `GatherDataEvent`s.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Lookup any necessary registries.
    // Static registries only need to be looked up if you need to grab the tag data.
    HolderGetter<Biome> biomes = bootstrap.lookup(Registries.BIOME);

    // Register the biome modifiers.
    bootstrap.register(EXAMPLE_MODIFIER,
        new ExampleBiomeModifier(
            biomes.getOrThrow(Tags.Biomes.IS_OVERWORLD),
            20
        )
    );
});
```

这将生成如下 JSON：

```json5
// In data/examplemod/neoforge/biome_modifier/example_modifier.json
{
    // The registry key of the MapCodec for the modifier
    "type": "examplemod:example_biome_modifier",
    // All additional settings are applied to the root object
    "biomes": "#c:is_overworld",
    "value": 20
}
```

## 针对可能不存在的生物群系 {#targeting-biomes-that-may-not-exist}

有时，生物群系修改器需要针对一个并非总是存在于游戏中的生物群系。如果生物群系修改器直接针对某个未注册的生物群系，它会在世界加载时崩溃。绕过这个问题的办法是创建一个生物群系标签，并把目标生物群系作为可选标签项添加，方法是将该项的 required 设为 false。示例如下：

```json5
{
    "replace": false,
    "values": [
        {
            "id": "minecraft:pale_garden",
            "required": false
        }
    ]
}
```

为生物群系修改器使用这样的生物群系标签，即便该生物群系未注册也不会崩溃。一个此类用例是苍白花园生物群系，它仅在启用了 Winter Drop 数据包的 1.21.3 中才会创建。否则，该生物群系在生物群系注册表中根本不存在。另一个用例可以是针对模组生物群系，同时在添加这些生物群系的 Mod 不存在时仍能正常工作。

要为生物群系标签数据生成可选项，数据生成代码大致如下：

```java
// In a KeyTagProvider<Biome> subclass
// Assume we have some example TagKey<Biome> OPTIONAL_BIOMES_TAG
@Override
protected void addTags(HolderLookup.Provider registries) {
    this.tag(OPTIONAL_BIOMES_TAG)
        // Must be a ResourceKey<Biome>
        .addOptional(Biomes.PALE_GARDEN);
}
```

[datagen]: ../resources/index.md#data-generation
[datapackdatagen]: ../concepts/registries#data-generation-for-datapack-registries
[datapacks]: ../resources/index.md#data
[datareg]: ../concepts/registries.md#datapack-registries
[spawning]: ../entities/livingentity.md#natural-spawning
[staticreg]: ../concepts/registries.md#methods-for-registering

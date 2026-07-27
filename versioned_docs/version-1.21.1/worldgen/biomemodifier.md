import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 生物群系修饰符 {#biome-modifiers}

生物群落修改器是一个数据驱动的系统，可以改变生物群落的许多方面，包括注入或删除 PlacedFeatures、添加或删除生物生成、改变气候以及调整树叶和水的颜色的能力。 NeoForge 提供了几种默认的生物群系修改器，涵盖了玩家和 Mod 开发者的大多数用例。

### 推荐阅读部分： {#recommended-section-to-read}

- 玩家或包开发者：
    - [应用生物群系修改器](#applying-biome-modifiers)
    - [内置 Neoforge 生物群系修改器](#built-in-biome-modifiers)


- Mod 开发者进行简单的添加或删除生物群落修改：
    - [应用生物群系修改器](#applying-biome-modifiers)
    - [内置 Neoforge 生物群系修改器](#built-in-biome-modifiers)
    - [数据生成生物群系修改器](#datagenning-biome-modifiers)


- 想要进行自定义或复杂的生物群落修改的 Mod 开发者：
    - [应用生物群系修改器](#applying-biome-modifiers)
    - [创建自定义生物群落修改器](#creating-custom-biome-modifiers)
    - [数据生成生物群系修改器](#datagenning-biome-modifiers)


## 应用生物群系修改器 {#applying-biome-modifiers}

要让 NeoForge 将生物群落修改器 JSON 文件加载到游戏中，该文件需要位于 mod 资源中的 `data/<modid>/neoforge/biome_modifier/<path>.json` 文件夹下，或位于 [Datapack][datapacks] 中。然后，一旦 NeoForge 加载生物群落修改器，它将读取其指令，并在加载世界时将所描述的修改应用于所有目标生物群落。 Mod 中预先存在的生物群落修饰符可以被具有完全相同位置和名称的新 JSON 文件的数据包覆盖。

JSON 文件可以按照“[内置 NeoForge 生物群落修改器](#built-in-biome-modifiers)”部分中的示例手动创建，也可以按照“[数据生成生物群落修改器](#datagenning-biome-modifiers)”部分中所示的方式进行数据生成。

## 内置生物群系修改器 {#built-in-biome-modifiers}

这些生物群系修改器由 NeoForge 注册，供任何人使用。

### 无 {#none}

该生物群落修改器没有任何操作，也不会进行任何修改。包制作者和玩家可以在数据包中使用此功能，通过使用下面的 JSON 覆盖其生物群系修改器 JSON 来禁用 Mod 的生物群系修改器。

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
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "no_op_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
BUILDER.add(NeoForgeRegistries.Keys.BIOME_MODIFIERS, bootstrap -> {
    // Register the biome modifiers.
    bootstrap.register(NO_OP_EXAMPLE, NoneBiomeModifier.INSTANCE);
});
```

</TabItem>
</Tabs>

### 添加功能 {#add-features}

此生物群落修改器类型将 `PlacedFeature`（例如树木或矿石）添加到生物群落中，以便它们可以在世界生成期间生成。修改器接受要添加到的生物群落的生物群落 ID 或标签、要添加到所选生物群落的 `PlacedFeature`ID 或标签，以及将在其中生成的特征的 [`GenerationStep.Decoration`](#Available-Values-for-Decoration-Steps)。

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
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "add_features_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
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
将普通 `PlacedFeature` 添加到生物群落时应小心，因为这样做可能会导致所谓的功能循环违规（两个生物群落在其功能列表中具有相同的两个功能，但在同一 `GenerationStep` 中顺序不同），从而导致崩溃。出于类似的原因，你不应在多个生物群系修改器中使用相同的 `PlacedFeature`。

原版`PlacedFeature` 可以在生物群落 JSON 中引用或通过生物群落修饰符添加，但不应在两者中使用。如果你仍然需要以这种方式添加它们，那么在你自己的命名空间下制作普通 `PlacedFeature` 的副本是避免这些问题的最简单的解决方案。
:::

### 删除功能 {#remove-features}

这种生物群落修改器类型会从生物群落中删除特征（例如树木或矿石），以便它们在世界生成期间不再生成。修改器接受要从中删除要素的生物群落的生物群落 ID 或标签、要从所选生物群落中删除的 `PlacedFeature`ID 或标签，以及要从中删除要素的 [`GenerationStep.Decoration`](#Available-Values-for-Decoration-Steps)。

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
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "remove_features_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
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


### 添加生成点 {#add-spawns}

此生物群落修改器类型将实体生成添加到生物群落。修改器接受实体生成的生物群落的生物群落 ID 或标签，以及要添加的实体的 `SpawnerData`。每个 `SpawnerData` 包含实体 ID、生成重量以及给定时间生成的实体的最小/最大数量。

:::note
如果你是添加新实体的 Mod 开发者，请确保该实体已注册到 `RegisterSpawnPlacementsEvent` 的生成限制。生成限制用于使实体在表面或水中安全地生成。如果你没有注册生成限制，你的实体可能会在半空中生成、坠落并死亡。
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
            "weight": 100, // int, spawn weight
            "minCount": 1, // int, minimum group size
            "maxCount": 4 // int, maximum group size
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
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "add_spawns_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
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


### 删除生成点 {#remove-spawns}

此生物群落修改器类型会从生物群落中移除实体生成。修改器接受从中删除实体生成的生物群落的生物群落 ID 或标签，以及要删除的实体的 `EntityType`ID 或标签。

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
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "remove_spawns_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
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


### 添加生成成本 {#add-spawn-costs}

允许为生物群系添加新的生成成本。生成成本是一种使生物在生物群系中分散生成以减少集群的新方法。它的工作原理是让实体发出围绕它们的 `charge` 并与其他实体的 `charge` 相加。当生成新实体时，生成算法会查找该位置处的总 `charge` 字段乘以生成实体的 `charge` 值小于生成实体的 `energy_budget` 的点。这是一种生成小怪的高级方法，因此最好参考灵魂沙谷生物群系（这是该系统最著名的用户）来借用现有值。

该修改器接受添加生成成本的生物群落的生物群落 ID 或标签、要为其添加生成成本的实体类型的 `EntityType`ID 或标签，以及实体的 `MobSpawnSettings.MobSpawnCost`。 `MobSpawnCost` 包含能量预算，它指示根据为生成的每个实体提供的费用，可以在某个位置生成的实体的最大数量。

:::note
如果你是添加新实体的 Mod 开发者，请确保该实体已注册到 `RegisterSpawnPlacementsEvent` 的生成限制。
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
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "add_spawn_costs_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
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


### 删除生成成本 {#remove-spawn-costs}

允许从生物群落中消除生成成本。生成成本是一种使生物在生物群系中分散生成以减少集群的新方法。修改器接受从中删除生成成本的生物群落的生物群系 ID 或标签，以及要删除其生成成本的实体的 `EntityType`ID 或标签。

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
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "remove_spawn_costs_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
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


### 添加旧雕刻师 {#add-legacy-carvers}

这种生物群系修改器类型允许向生物群系添加雕刻洞穴和峡谷。这些是在洞穴和悬崖更新之前用于洞穴生成的内容。它不能将噪声洞穴添加到生物群落中，因为噪声洞穴是某些基于噪声的块生成器系统的一部分，并且实际上与生物群落无关。

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
    "carvers": "examplemod:add_carvers_example",
    // See GenerationStep.Carving in code for a list of valid enum names.
    // Only "air" and "liquid" are available.
    "step": "air"
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Assume we have some ConfiguredWorldCarver named EXAMPLE_CARVER.
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> ADD_CARVERS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "add_carvers_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
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
            HolderSet.direct(carvers.getOrThrow(EXAMPLE_CARVER)),
            // The generation step
            GenerationStep.Carving.AIR
        )
    );
});
```

</TabItem>
</Tabs>

### 删除旧版雕刻机 {#removing-legacy-carvers}

这种生物群落修改器类型允许从生物群落中移除雕刻洞穴和峡谷。这些是在洞穴和悬崖更新之前用于洞穴生成的内容。它无法从生物群落中移除噪音洞穴，因为噪音洞穴被烘焙到维度的噪音设置系统中，并且实际上并不与生物群系相关联。

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
    "carvers": "examplemod:add_carvers_example",
    // Can either be a single generation step, such as "air",
    // or a list of generation steps, such as ["air", "liquid"].
    // See GenerationStep.Carving for a list of valid enum names.
    // Only "air" and "liquid" are available.
    "steps": [
        "air",
        "liquid"
    ]
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> REMOVE_CARVERS_EXAMPLE = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "remove_carvers_example") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
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
            HolderSet.direct(carvers.getOrThrow(Carvers.CAVE)),
            // The generation steps to remove from
            Set.of(
                GenerationStep.Carving.AIR,
                GenerationStep.Carving.LIQUID
            )
        )
    );
});
```

</TabItem>
</Tabs>

### 装饰步骤的可用值 {#available-values-for-decoration-steps}

上述许多 JSON 中的 `step` 或 `steps` 字段均引用 `GenerationStep.Decoration` 枚举。该枚举具有按以下顺序列出的步骤，该顺序与游戏在世界生成期间生成的顺序相同。尝试将功能放入对他们最有意义的步骤中。

|           步骤|描述 |
|:------------------------:|:----------------------------------------------------------------------------------------|
|`raw_generation`|第一个跑。这用于特殊的地形特征，例如小恩德群岛。 |
|`lakes`|专用于熔岩湖等类似产卵池的特征。                             |
|`local_modifications`|用于修改地形，例如晶洞、冰山、巨石或滴水石。          |
|`underground_structures`|用于类似地下结构的小型特征，例如地下城或化石。         |
|`surface_structures`|对于小表面，仅类似结构的特征，例如沙漠井。                    |
|`strongholds`|专用于要塞结构。未修改的 Minecraft 中未添加任何功能。  |
|`underground_ores`|添加所有矿石和矿脉的步骤。这包括黄金、泥土、花岗岩等。
|`underground_decoration`|通常用于装饰洞穴。滴石簇和斯库克矿脉就在这里。         |
|`fluid_springs`|小熔岩瀑布和瀑布就来自这个阶段的特征。                    |
|`vegetal_decoration`|几乎所有植物（花卉、树木、藤蔓等）都会添加到此阶段。            |
|`top_layer_modification`|最后跑。用于将雪和冰放置在寒冷生物群系的表面。               |


## 创建自定义生物群系修改器 {#creating-custom-biome-modifiers}

### `BiomeModifier` 实施 {#the-biomemodifier-implementation}

在底层，生物群落修改器由三部分组成：

- [数据包已注册][datareg]`BiomeModifier` 用于修改生物群系构建器。
- [静态注册][staticreg]`MapCodec` 对修饰符进行编码和解码。
- 构造 `BiomeModifier` 的 JSON，使用 `MapCodec` 的注册 id 作为可索引类型。

`BiomeModifier` 包含两个方法：`#modify` 和 `#codec`。 `modify` 接收当前 `Biome`、当前 `BiomeModifier.Phase` 的 `Holder` 以及要修改的生物群系构建器。每个 `BiomeModifier` 都会被调用一次，以组织何时对生物群落进行某些修改：

|相|描述 |
|:-------------------:|:-------------------------------------------------------------------------|
|`BEFORE_EVERYTHING`|涵盖了标准阶段之前需要运行的所有内容。 |
|`ADD`|添加功能、生物生成等。
|`REMOVE`|删除功能、生物生成等。
|`MODIFY`|修改单个值（例如气候、颜色）。                         |
|`AFTER_EVERYTHING`|标准阶段之后需要运行的所有内容的包罗万象。  |

所有 `BiomeModifier` 都包含一个 `type` 密钥，该密钥引用用于 `BiomeModifier` 的 `MapCodec` 的 id。 `codec` 接收对修饰符进行编码和解码的 `MapCodec`。这个 `MapCodec` 是[静态注册的][staticreg]，它的 id 就是 `BiomeModifier` 的 `type`。

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

通过将 `RegistrySetBuilder` 传递给 `DatapackBuiltinEntriesProvider`，可以通过[数据生成][datagen] 创建 `BiomeModifier`JSON。 JSON 将放置在 `data/<modid>/neoforge/biome_modifier/<path>.json` 处。

有关 `RegistrySetBuilder` 和 `DatapackBuiltinEntriesProvider` 工作原理的更多信息，请参阅有关 [Datapack Registries 的数据生成][datapackdatagen] 的文章。

```java
// Define the ResourceKey for our BiomeModifier.
public static final ResourceKey<BiomeModifier> EXAMPLE_MODIFIER = ResourceKey.create(
    NeoForgeRegistries.Keys.BIOME_MODIFIERS, // The registry this key is for
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "example_modifier") // The registry name
);

// BUILDER is a RegistrySetBuilder passed to DatapackBuiltinEntriesProvider
// in a listener for GatherDataEvent.
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

这将导致创建以下 JSON：

```json5
// In data/examplemod/neoforge/biome_modifier/example_modifier.json
{
    // The registy key of the MapCodec for the modifier
    "type": "examplemod:example_biome_modifier",
    // All additional settings are applied to the root object
    "biomes": "#c:is_overworld",
    "value": 20
}
```

[datareg]: ../concepts/registries.md#datapack-registries
[staticreg]: ../concepts/registries.md#methods-for-registering
[datapacks]: ../resources/index.md#data
[datagen]: ../resources/index.md#data-generation
[datapackdatagen]: ../concepts/registries#data-generation-for-datapack-registries

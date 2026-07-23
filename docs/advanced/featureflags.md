# 特性标志 {#feature-flags}

特性标志（Feature Flag）是一套系统，允许开发者将一组特性置于某组必需标志之后进行门控，这些特性可以是注册的元素、玩法机制、数据包条目，或是你 Mod 中的其他独特系统。

一个常见用例是将实验性特性/元素置于一个实验性标志之后，让用户能够轻松开启它们，在其最终定型之前先行体验。

:::tip
你并非必须添加自己的标志。如果你发现某个原版标志正好契合你的用例，尽管用该标志来标记你的方块/物品/实体等等。

例如在 `1.21.3` 中，如果你要向 Pale Oak 木质方块集合中添加内容，你会希望它们只在启用了 `WINTER_DROP` 标志时才出现。
:::

## 创建特性标志 {#creating-a-feature-flag}

要创建新的特性标志，需要创建一个 JSON 文件，并在你的 `neoforge.mods.toml` 文件中通过 `[[mods]]` 块内的 `featureFlags` 条目引用它。指定的路径必须相对于 `resources` 目录：

```toml
# In neoforge.mods.toml:
[[mods]]
    # The file is relative to the output directory of the resources, or the root path inside the jar when compiled
    # The 'resources' directory represents the root output directory of the resources
    featureFlags="META-INF/feature_flags.json"
```

条目的定义由一组特性标志名称组成，它们会在游戏初始化期间被加载并注册。

```json5
{
    "flags": [
        // Identifier of a Feature flag to be registered
        "examplemod:experimental"
    ]
}
```

## 获取特性标志 {#retrieving-the-feature-flag}

已注册的特性标志可以通过 `FeatureFlagRegistry.getFlag(Identifier)` 获取。这可以在你 Mod 初始化期间的任意时刻完成，且推荐将其存储在某处以备将来使用，而不是每次需要标志时都去查询注册表。

```java
// Look up the 'examplemod:experimental' Feature flag
public static final FeatureFlag EXPERIMENTAL = FeatureFlags.REGISTRY.getFlag(Identifier.fromNamespaceAndPath("examplemod", "experimental"));
```

## 特性元素 {#feature-elements}

`FeatureElement` 是可以被赋予一组必需标志的注册值。只有当各自的必需标志与世界（Level）中启用的标志匹配时，这些值才会对玩家可用。

当一个特性元素被禁用时，它会完全从玩家的视野中隐藏，且所有交互都会被跳过。请注意，这些被禁用的元素仍然存在于注册表中，只是在功能上不可用而已。

以下是所有直接实现 `FeatureElement` 系统的注册表的完整列表：

- Item
- Block
- EntityType
- MenuType
- Potion
- MobEffect
- GameRule

### 标记元素 {#flagging-elements}

要将某个 `FeatureElement` 标记为需要你的特性标志，只需将该标志以及任何其他需要的标志传入相应的注册方法：

- `Item`：`Item.Properties#requiredFeatures`
- `Block`：`BlockBehaviour.Properties#requiredFeatures`
- `EntityType`：`EntityType.Builder#requiredFeatures`
- `MenuType`：`MenuType#new`
- `Potion`：`Potion#requiredFeatures`
- `MobEffect`：`MobEffect#requiredFeatures`
- `GameRule`：`GameRule#new`

```java
// These elements will only become available once the 'EXPERIMENTAL' flag is enabled

// Item
DeferredRegister.Items ITEMS = DeferredRegister.createItems("examplemod");
DeferredItem<Item> EXPERIMENTAL_ITEM = ITEMS.registerSimpleItem("experimental", props -> props
    .requiredFeatures(EXPERIMENTAL) // mark as requiring the 'EXPERIMENTAL' flag
);

// Block
DeferredRegister.Blocks BLOCKS = DeferredRegister.createBlocks("examplemod");
// Do note that BlockBehaviour.Properties#ofFullCopy and BlockBehaviour.Properties#ofLegacyCopy will copy over the required features.
// This means that in 1.21.3, using BlockBehaviour.Properties.ofFullCopy(Blocks.PALE_OAK_WOOD) would have your block require the 'WINTER_DROP' flag.
DeferredBlock<Block> EXPERIMENTAL_BLOCK = BLOCKS.registerSimpleBlock("experimental", BlockBehaviour.Properties.of()
    .requiredFeatures(EXPERIMENTAL) // mark as requiring the 'EXPERIMENTAL' flag
);

// BlockItems are special in that the required features are inherited from their respective Blocks.
// The same is also true for spawn eggs and their respective EntityTypes.
DeferredItem<BlockItem> EXPERIMENTAL_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(EXPERIMENTAL_BLOCK);

// EntityType
DeferredRegister<EntityType<?>> ENTITY_TYPES = DeferredRegister.create(Registries.ENTITY_TYPE, "examplemod");
DeferredHolder<EntityType<?>, EntityType<ExperimentalEntity>> EXPERIMENTAL_ENTITY = ENTITY_TYPES.register("experimental", registryName -> EntityType.Builder.of(ExperimentalEntity::new, MobCategory.AMBIENT)
    .requiredFeatures(EXPERIMENTAL) // mark as requiring the 'EXPERIMENTAL' flag
    .build(ResourceKey.create(Registries.ENTITY_TYPE, registryName))
);

// MenuType
DeferredRegister<MenuType<?>> MENU_TYPES = DeferredRegister.create(Registries.MENU, "examplemod");
DeferredHolder<MenuType<?>, MenuType<ExperimentalMenu>> EXPERIMENTAL_MENU = MENU_TYPES.register("experimental", () -> new MenuType<>(
    // Using vanilla's MenuSupplier:
    // This is used when your menu is not encoding complex data during `player.openMenu`. Example:
    // (windowId, inventory) -> new ExperimentalMenu(windowId, inventory),

    // Using NeoForge's IContainerFactory:
    // This is used when you wish to read complex data encoded during `player.openMenu`.
    // Casting is important here, as `MenuType` specifically expects a `MenuSupplier`.
    (IContainerFactory<ExperimentalMenu>) (windowId, inventory, buffer) -> new ExperimentalMenu(windowId, inventory, buffer),
    
    FeatureFlagSet.of(EXPERIMENTAL) // mark as requiring the 'EXPERIMENTAL' flag
));

// MobEffect
DeferredRegister<MobEffect> MOB_EFFECTS = DeferredRegister.create(Registries.MOB_EFFECT, "examplemod");
DeferredHolder<MobEffect, ExperimentalMobEffect> EXPERIMENTAL_MOB_EEFECT = MOB_EFFECTS.register("experimental", registryName -> new ExperimentalMobEffect(MobEffectCategory.NEUTRAL, CommonColors.WHITE)
    .requiredFeatures(EXPERIMENTAL) // mark as requiring the 'EXPERIMENTAL' flag
);

// Potion
DeferredRegister<Potion> POTIONS = DeferredRegister.create(Registries.POTION, "examplemod");
DeferredHolder<Potion, ExperimentalPotion> EXPERIMENTAL_POTION = POTIONS.register("experimental", registryName -> new ExperimentalPotion(registryName.toString(), new MobEffectInstance(EXPERIMENTAL_MOB_EEFECT))
    .requiredFeatures(EXPERIMENTAL) // mark as requiring the 'EXPERIMENTAL' flag
);

// GameRule
DeferredRegister<GameRule> GAME_RULES = DefeferredRegister.create(Registries.GAME_RULE, "examplemod");
DeferredHolder<GameRule, GameRule> EXPERIMENTAL_GAME_RULE = GAME_RULES.register("experimental", registryName -> new GameRule(
    GameRuleCategory.MISC, GameRuleType.BOOL, BoolArgumentType.bool(), GameRuleTypeVisitor::visitBoolean, Codec.BOOL, bool -> bool ? 1 : 0, false,
    FeatureFlagSet.of(EXPERIMENTAL) // mark as requiring the 'EXPERIMENTAL' flag
));
```

### 验证启用状态 {#validating-enabled-status}

为了验证某些特性是否应当被启用，你必须先获取已启用特性的集合。这可以通过多种方式完成，但常用且推荐的方法是 `LevelReader#enabledFeatures`。  

```java
level.enabledFeatures(); // from a 'LevelReader' instance
entity.level().enabledFeatures(); // from a 'Entity' instance

// Client Side
minecraft.getConnection().enabledFeatures();

// Server Side
server.getWorldData().enabledFeatures();
```

要验证某个 `FeatureFlagSet` 是否已启用，可以将已启用特性传给 `FeatureFlagSet#isSubsetOf`；要验证某个特定的 `FeatureElement` 是否已启用，可以调用 `FeatureElement#isEnabled`。

:::note
`ItemStack` 有一个特殊的 `isItemEnabled(FeatureFlagSet)` 方法。这样即使其背后 `Item` 的必需特性与已启用特性不匹配，空堆叠也会被视为已启用。在可能的情况下，推荐优先使用此方法，而不是 `Item#isEnabled`。
:::

```java
requiredFeatures.isSubsetOf(enabledFeatures);
featureElement.isEnabled(enabledFeatures);
itemStack.isItemEnabled(enabledFeatures);
```

## 特性包 {#feature-packs}

_另见：[资源包](../resources/index.md#assets)、[数据包](../resources/index.md#data)和 [Pack.mcmeta](../resources/index.md#packmcmeta)_

特性包是一种不仅能加载资源和/或数据、还能开启一组给定特性标志的包。这些标志定义在该包根目录下的 `pack.mcmeta` JSON 文件中，其格式如下：

:::note
此文件不同于你 Mod 的 `resources/` 目录中的那个文件。此文件定义了一个全新的特性包，因此必须放在它自己的文件夹中。
:::

```json5
{
    "features": {
        "enabled": [
            // Identifier of a Feature flag to be enabled
            // Must be a valid registered flag
            "examplemod:experimental"
        ]
    },
    "pack": { /*...*/ }
}
```

用户可以通过几种方式获取特性包，即从外部来源以数据包形式安装，或下载一个内置了特性包的 Mod。这两种方式随后需要根据[物理端](../concepts/sides.md)以不同的方法安装。

### 内置 {#built-in}

内置包与你的 Mod 捆绑在一起，并通过 `AddPackFindersEvent` 事件向游戏提供。

```java
@SubscribeEvent // on the mod event bus
public static void addFeaturePacks(final AddPackFindersEvent event) {
    event.addPackFinders(
            // Path relative to your mods 'resources' pointing towards this pack
            // Take note this also defines your packs id using the following format
            // mod/<namespace>:<path>`, e.g. `mod/examplemod:data/examplemod/datapacks/experimental`
            Identifier.fromNamespaceAndPath("examplemod", "data/examplemod/datapacks/experimental"),
            
            // What kind of resources are contained within this pack
            // 'CLIENT_RESOURCES' for packs with client assets (resource packs)
            // 'SERVER_DATA' for packs with server data (data packs)
            PackType.SERVER_DATA,
            
            // Display name shown in the Experiments screen
            Component.literal("ExampleMod: Experiments"),
            
            // In order for this pack to load and enable feature flags, this MUST be 'FEATURE',
            // any other PackSource type is invalid here
            PackSource.FEATURE,
            
            // If this is true, the pack is always active and cannot be disabled, should always be false for feature packs
            false,
            
            // Priority to load resources from this pack in
            // 'TOP' this pack will be prioritized over other packs
            // 'BOTTOM' other packs will be prioritized over this pack 
            Pack.Position.TOP
    );
}
```

#### 在单人游戏中启用 {#enabling-in-singleplayer}

1. 创建一个新世界。
2. 进入实验（Experiments）界面。
3. 开启所需的包。
4. 点击 `Done` 确认更改。

#### 在多人游戏中启用 {#enabling-in-multiplayer}

1. 打开你服务端的 `server.properties` 文件。
2. 将特性包 id 添加到 `initial-enabled-packs`，每个包之间用 `,` 分隔。包 id 在注册你的 pack finder 时定义，如上文所示。

### 外部 {#external}

外部包以数据包形式提供给你的用户。

#### 在单人游戏中安装 {#installation-in-singleplayer}

1. 创建一个新世界。
2. 进入数据包选择界面。
3. 将数据包 zip 文件拖放到游戏窗口上。
4. 将新出现的数据包移动到 `Selected` 包列表中。
5. 点击 `Done` 确认更改。

游戏现在会就任何新选择的实验性特性、潜在的漏洞、问题和崩溃向你发出警告。你可以点击 `Proceed` 确认这些更改，或点击 `Details` 查看所有已选择的包及其会启用哪些特性的详尽列表。

:::note
外部特性包不会显示在实验界面中。实验界面只会显示内置特性包。

要在启用外部特性包后将其禁用，请重新进入数据包界面，并将外部包从 `Selected` 移回 `Available`。
:::

#### 在多人游戏中安装 {#installation-in-multiplayer}

启用特性包只能在世界初次创建时完成，且一旦启用便无法禁用。

1. 创建目录 `./world/datapacks`
2. 将数据包 zip 文件上传到新创建的目录中
3. 打开你服务端的 `server.properties` 文件
4. 将数据包 zip 文件名（不含 `.zip`）添加到 `initial-enabled-packs`（每个包之间用 `,` 分隔）
   - 示例：zip 文件 `examplemod-experimental.zip` 应这样添加 `initial-enabled-packs=vanilla,examplemod-experimental`

### 数据生成 {#data-generation}

_另见：[数据生成（Datagen）](../resources/index.md#data-generation)_

特性包可以在常规的 Mod 数据生成期间生成。这最好与内置包结合使用，但也可以将生成的结果打包成 zip 并作为外部包分享。只需二选一即可，也就是说不要既将它作为外部包提供、又将它捆绑为内置包。

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(final GatherDataEvent.Client event) {
    DataGenerator generator = event.getGenerator();
    
    // To generate a feature pack, you must first obtain a pack generator instance for the desired pack.
    // generator.getBuiltinDatapack(<shouldGenerate>, <namespace>, <path>);
    // This will generate the feature pack into the following path:
    // ./data/<namespace>/datapacks/<path>
    PackGenerator featurePack = generator.getBuiltinDatapack(true, "examplemod", "experimental");
        
    // Register a provider to generate the `pack.mcmeta` file.
    featurePack.addProvider(output -> PackMetadataGenerator.forFeaturePack(
            output,
            
            // Description displayed in the Experiments screen
            Component.literal("Enabled experimental features for ExampleMod"),
            
            // Set of Feature flags this pack should enable
            FeatureFlagSet.of(EXPERIMENTAL)
    ));
    
    // Register additional providers (recipes, loot tables) to `featurePack` to write any generated resources into this pack, rather than the root pack.
}
```

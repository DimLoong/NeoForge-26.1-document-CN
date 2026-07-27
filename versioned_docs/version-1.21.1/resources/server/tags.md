# 标签 {#tags}

简单来说，标签（Tag）是一组同类型已注册对象的列表。它们从数据文件加载，可用于成员检查。例如，合成木棍时会接受任意组合的木板（带有 `minecraft:planks` 标签的物品）。标签通常通过在前面加 `#` 来与“常规”对象区分（例如 `#minecraft:planks`，而 `minecraft:oak_planks` 则不是）。

任何[注册表][registry]都可以拥有标签文件——虽然方块和物品是最常见的使用场景，但流体、实体类型或伤害类型等其他注册表也经常使用标签。如果需要，你也可以创建自己的标签。

对于 Minecraft 注册表，标签位于 `data/<tag_namespace>/tags/<registry_path>/<tag_path>.json`；对于非 Minecraft 注册表，则位于 `data/<tag_namespace>/tags/<registry_namespace>/<registry_path>/<tag_path>.json`。例如，要修改 `minecraft:planks` 物品标签，你需要把标签文件放在 `data/minecraft/tags/item/planks.json`。

:::info
与大多数其他 NeoForge 数据文件不同，NeoForge 新增的标签通常**不**使用 `neoforge` 命名空间。相反，它们使用 `c` 命名空间（例如 `c:ingots/gold`）。这是因为这些标签在 NeoForge 与 Fabric mod 加载器之间是统一的，这应许多在多个加载器上进行开发的 modder 的请求而设。

对于某些与 NeoForge 系统紧密关联的标签，此规则有少数例外。例如，许多[伤害类型][damagetype]标签就属于这种情况。
:::

对标签文件的覆盖通常是叠加式的，而非替换式的。这意味着，如果两个数据包指定了相同 id 的标签文件，那么两个文件的内容将被合并（除非另有指定）。这一行为使标签有别于大多数其他数据文件，后者会替换掉任何已有的值。

## 标签文件格式 {#tag-file-format}

标签文件具有以下语法：

```json5
{
    // The values of the tag.
    "values": [
        // A value object. Must specify the id of the object to add, and whether it is required.
        // If the entry is required, but the object is not present, the tag will not load. The "required" field
        // is technically optional, but when removed, the entry is equivalent to the shorthand below.
        {
            "id": "examplemod:example_ingot",
            "required": false
        }
        // Shorthand for {"id": "minecraft:gold_ingot", "required": true}, i.e. a required entry.
        "minecraft:gold_ingot",
        // A tag object. Distinguished from regular entries by the leading #. In this case, all planks
        // will be considered entries of the tag. Like normal entries, this can also have the "id"/"required" format.
        // Warning: Circular tag dependencies will lead to a datapack not being loaded!
        "#minecraft:planks"
    ],
    // Whether to remove all pre-existing entries before adding your own (true) or just add your own (false).
    // This should generally be false, the option to set this to true is primarily aimed at pack developers.
    "replace": false,
    // A finer-grained way to remove entries from the tag again, if present. Optional, NeoForge-added.
    // Entry syntax is the same as in the "values" array.
    "remove": [
        "minecraft:iron_ingot"
    ]
}
```

## 查找与命名标签 {#finding-and-naming-tags}

当你尝试查找一个现有标签时，通常推荐遵循以下步骤：

- 先看看 Minecraft 的标签，检查你要找的标签是否在其中。 Minecraft 的标签可以在 `BlockTags`、 `ItemTags`、 `EntityTypeTags` 等类中找到。
- 如果没有，再看看 NeoForge 的标签，检查你要找的标签是否在其中。 NeoForge 的标签可以在 `Tags.Blocks`、 `Tags.Items`、 `Tags.EntityTypes` 等类中找到。
- 否则，就认为该标签在 Minecraft 或 NeoForge 中都没有指定，因此你需要创建自己的标签。

在创建自己的标签时，你应当问自己以下问题：

- 这会修改我自己 mod 的行为吗？如果是，标签应该放在你自己 mod 的命名空间下。（例如“我的某物可以在此方块上生成”这类标签就很常见。）
- 其他 mod 也会想使用这个标签吗？如果是，标签应该放在 `c` 命名空间下。（例如新的金属或宝石就很常见。）
- 否则，使用你自己 mod 的命名空间。

给标签本身命名也有一些约定需要遵循：

- 使用复数形式。例如：`minecraft:planks`、 `c:ingots`。
- 为同类型的多个对象使用文件夹，并为每个文件夹设一个总体标签。例如：`c:ingots/iron`、 `c:ingots/gold`，以及包含二者的 `c:ingots`。（注意：这是 NeoForge 的约定，Minecraft 对大多数标签并不遵循此约定。）

## 使用标签 {#using-tags}

要在代码中引用标签，你必须使用一个[注册表键][regkey]和一个[资源位置][resloc]创建一个 `TagKey<T>`，其中 `T` 是标签的类型（`Block`、 `Item`、 `EntityType<?>` 等）：

```java
public static final TagKey<Block> MY_TAG = TagKey.create(
        // The registry key. The type of the registry must match the generic type of the tag.
        Registries.BLOCK,
        // The location of the tag. This example will put our tag at data/examplemod/tags/blocks/example_tag.json.
        ResourceLocation.fromNamespaceAndPath("examplemod", "example_tag")
);
```

:::warning
由于 `TagKey` 是一个 record，其构造函数是 public 的。然而，不应直接使用该构造函数，因为这样做可能导致各种问题，例如在查找标签条目时。
:::

然后我们就可以用我们的标签对其执行各种操作了。让我们从最显而易见的操作开始：检查某个对象是否在标签中。以下示例将假设使用方块标签，但对于每种类型的标签，功能都完全相同（除非另有指定）：

```java
// Check whether dirt is in our tag.
boolean isInTag = BuiltInRegistries.BLOCK.getOrCreateTag(MY_TAG).stream().anyMatch(e -> e == Items.DIRT);
```

由于这条语句非常冗长，尤其是在频繁使用时，因此标签系统两个最常见的使用者——`BlockState` 和 `ItemStack`——各自定义了一个 `#is` 辅助方法，用法如下：

```java
// Check whether the blockState's block is in our tag.
boolean isInBlockTag = blockState.is(MY_TAG);
// Check whether the itemStack's item is in our tag. Assumes the existence of MY_ITEM_TAG as a TagKey<Item>.
boolean isInItemTag = itemStack.is(MY_ITEM_TAG);
```

如果需要，我们也可以获取一个标签条目的流，如下所示：

```java
Stream<Block> blocksInTag = BuiltInRegistries.BLOCK.getOrCreateTag(MY_TAG).stream();
```

出于性能考虑，推荐把这些标签条目缓存到一个字段中，并在标签重新加载时使其失效（可以使用 `TagsUpdatedEvent` 监听这一事件）。可以这样做：

```java
public class MyTagsCacheClass {
    private static Set<Block> blocksInTag = null;

    public static Set<Block> getBlockTagContents() {
        if (blocksInTag == null) {
            // Wrap as an unmodifiable set, as we're not supposed to modify this anyway
            blocksInTag = Collections.unmodifiableSet(BuiltInRegistries.BLOCK.getOrCreateTag(MY_TAG).stream().collect(Collectors.toSet()));
        }
        return blocksInTag;
    }
    
    public static void invalidateCache() {
        blocksInTag = null;
    }
}

// In some event handler class
@SubscribeEvent // on the game event bus
public static void onTagsUpdated(TagsUpdatedEvent event) {
    MyTagsCacheClass.invalidateCache();
}
```

## 数据生成 {#datagen}

与许多其他 JSON 文件一样，标签也可以进行[数据生成][datagen]。每一种标签都有自己的数据生成基类——一个用于方块标签，一个用于物品标签，等等——因此，我们每一种标签也需要一个类。所有这些类都继承自 `TagsProvider<T>` 基类，其中 `T` 同样是标签的类型（`Block`、 `Item` 等）。下表列出了针对不同对象的标签提供器：

| 类型                       | 标签提供器类                           |
|----------------------------|----------------------------------------|
| `BannerPattern`            | `BannerPatternTagsProvider`            |
| `Biome`                    | `BiomeTagsProvider`                    |
| `Block`                    | `BlockTagsProvider`                    |
| `CatVariant`               | `CatVariantTagsProvider`               |
| `DamageType`               | `DamageTypeTagsProvider`               |
| `Enchantment`              | `EnchantmentTagsProvider`              |
| `EntityType`               | `EntityTypeTagsProvider`               |
| `FlatLevelGeneratorPreset` | `FlatLevelGeneratorPresetTagsProvider` |
| `Fluid`                    | `FluidTagsProvider`                    |
| `GameEvent`                | `GameEventTagsProvider`                |
| `Instrument`               | `InstrumentTagsProvider`               |
| `Item`                     | `ItemTagsProvider`                     |
| `PaintingVariant`          | `PaintingVariantTagsProvider`          |
| `PoiType`                  | `PoiTypeTagsProvider`                  |
| `Structure`                | `StructureTagsProvider`                |
| `WorldPreset`              | `WorldPresetTagsProvider`              |

值得一提的是 `IntrinsicHolderTagsProvider<T>` 类，它是 `TagsProvider<T>` 的子类，也是 `BlockTagsProvider`、 `ItemTagsProvider`、 `FluidTagsProvider`、 `EntityTypeTagsProvider` 和 `GameEventTagsProvider` 的共同父类。这些类（为简便起见，下文称为固有提供器）在生成方面具有一些额外功能，稍后会介绍。

作为示例，假设我们想生成方块标签。（所有其他类对于它们各自的标签类型都以相同方式工作。）

```java
public class MyBlockTagsProvider extends BlockTagsProvider {
    // Get parameters from GatherDataEvent.
    public MyBlockTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider, ExistingFileHelper existingFileHelper) {
        super(output, lookupProvider, ExampleMod.MOD_ID, existingFileHelper);
    }

    // Add your tag entries here.
    @Override
    protected void addTags(HolderLookup.Provider lookupProvider) {
        // Create a tag builder for our tag. This could also be e.g. a 原版 or NeoForge tag.
        tag(MY_TAG)
                // Add entries. This is a vararg parameter.
                // Non-intrinsic providers must provide ResourceKeys here instead of the actual objects.
                .add(Blocks.DIRT, Blocks.COBBLESTONE)
                // Add optional entries that will be ignored if absent. This example uses Botania's Pure Daisy.
                // Unlike #add, this is not a vararg parameter.
                .addOptional(ResourceLocation.fromNamespaceAndPath("botania", "pure_daisy"))
                // Add a tag entry.
                .addTag(BlockTags.PLANKS)
                // Add multiple tag entries. This is a vararg parameter.
                // Can cause unchecked warnings that can safely be suppressed.
                .addTags(BlockTags.LOGS, BlockTags.WOODEN_SLABS)
                // Add an optional tag entry that will be ignored if absent.
                .addOptionalTag(ResourceLocation.fromNamespaceAndPath("c", "ingots/tin"))
                // Add multiple optional tag entries. This is a vararg parameter.
                // Can cause unchecked warnings that can safely be suppressed.
                .addOptionalTags(ResourceLocation.fromNamespaceAndPath("c", "nuggets/tin"), ResourceLocation.fromNamespaceAndPath("c", "storage_blocks/tin"))
                // Set the replace property to true.
                .replace()
                // Set the replace property back to false.
                .replace(false)
                // Remove entries. This is a vararg parameter. Accepts either resource locations, resource keys,
                // tag keys, or (intrinsic providers only) direct values.
                // Can cause unchecked warnings that can safely be suppressed.
                .remove(ResourceLocation.fromNamespaceAndPath("minecraft", "crimson_slab"), ResourceLocation.fromNamespaceAndPath("minecraft", "warped_slab"));
    }
}
```

此示例生成以下标签 JSON：

```json5
{
    "values": [
        "minecraft:dirt",
        "minecraft:cobblestone",
        {
            "id": "botania:pure_daisy",
            "required": false
        },
        "#minecraft:planks",
        "#minecraft:logs",
        "#minecraft:wooden_slabs",
        {
            "id": "c:ingots/tin",
            "required": false
        },
        {
            "id": "c:nuggets/tin",
            "required": false
        },
        {
            "id": "c:storage_blocks/tin",
            "required": false
        }
    ],
    "remove": [
        "minecraft:crimson_slab",
        "minecraft:warped_slab"
    ]
}
```

与所有数据提供器一样，把每个标签提供器添加到 `GatherDataEvent`：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    PackOutput output = generator.getPackOutput();
    CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();

    // other providers here
    event.getGenerator().addProvider(
        event.includeServer(),
        new MyBlockTagsProvider(output, lookupProvider, existingFileHelper)
    );
}
```

`ItemTagsProvider` 有一个额外的辅助方法，名为 `#copy`。它面向物品标签镜像方块标签这一常见使用场景：

```java
// In an ItemTagsProvider's #addTags method, assuming types TagKey<Block> and TagKey<Item> for the two parameters.
copy(EXAMPLE_BLOCK_TAG, EXAMPLE_ITEM_TAG);
```

### 自定义标签提供器 {#custom-tag-providers}

要为自定义[注册表][registry]，或为默认没有标签提供器的原版或 NeoForge 注册表创建自定义标签提供器，你也可以像下面这样创建自定义标签提供器（以配方类型标签为例）：

```java
public class MyRecipeTypeTagsProvider extends TagsProvider<RecipeType<?>> {
    // Get parameters from GatherDataEvent.
    public MyRecipeTypeTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider, ExistingFileHelper existingFileHelper) {
        // Second parameter is the registry key we are generating the tags for.
        super(output, Registries.RECIPE_TYPE, lookupProvider, ExampleMod.MOD_ID, existingFileHelper);
    }
    
    @Override
    protected void addTags(HolderLookup.Provider lookupProvider) { /*...*/ }
}
```

如果需要且适用，你也可以继承 `IntrinsicHolderTagsProvider<T>` 而非 `TagsProvider<T>`，从而允许你直接传入对象，而不只是它们的资源键。这额外需要一个函数参数，为给定对象返回一个资源键。以属性标签为例：

```java
public class MyAttributeTagsProvider extends TagsProvider<Attribute> {
    // Get parameters from GatherDataEvent.
    public MyAttributeTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider, ExistingFileHelper existingFileHelper) {
        super(output,
                Registries.ATTRIBUTE,
                lookupProvider,
                // A function that, given an Attribute, returns a ResourceKey<Attribute>.
                attribute -> BuiltInRegistries.ATTRIBUTE.getResourceKey(attribute).orElseThrow(),
                ExampleMod.MOD_ID,
                existingFileHelper);
    }

    // Attributes can now be used here directly, instead of just their resource keys.
    @Override
    protected void addTags(HolderLookup.Provider lookupProvider) { /*...*/ }
}
```

:::info
`TagsProvider` 还暴露了 `#getOrCreateRawBuilder` 方法，它返回一个 `TagBuilder`。 `TagBuilder` 允许向标签添加原始的 `ResourceLocation`，这在某些场景下会很有用。由 `TagsProvider#tag` 返回的 `TagsProvider.TagAppender<T>` 类，其实只是对 `TagBuilder` 的一层包装。
:::

[damagetype]: damagetypes.md
[datagen]: ../index.md#data-generation
[registry]: ../../concepts/registries.md
[regkey]: ../../misc/resourcelocation.md#resourcekeys
[resloc]: ../../misc/resourcelocation.md

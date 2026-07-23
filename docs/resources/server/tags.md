# 标签 {#tags}

简单来说，标签（Tag）就是一组相同类型的已注册对象。它们从数据文件中加载，可用于成员检查。例如，合成木棍会接受任意组合的木板（带有 `minecraft:planks` 标签的物品）。标签通常通过在前面加上 `#` 来与"普通"对象区分（例如 `#minecraft:planks`，而 `minecraft:oak_planks` 则不带）。

任何[注册表][registry]都可以拥有标签文件——虽然方块和物品是最常见的用例，但流体、实体类型或伤害类型等其他注册表也经常使用标签。如果需要，你也可以创建自己的标签。

对于 Minecraft 注册表，标签位于 `data/<tag_namespace>/tags/<registry_path>/<tag_path>.json`；对于非 Minecraft 注册表，则位于 `data/<tag_namespace>/tags/<registry_namespace>/<registry_path>/<tag_path>.json`。例如，要修改 `minecraft:planks` 物品标签，你需要把标签文件放在 `data/minecraft/tags/item/planks.json`。

:::info
与大多数其他 NeoForge 数据文件不同，NeoForge 添加的标签通常不使用 `neoforge` 命名空间，而是使用 `c` 命名空间（例如 `c:ingots/gold`）。这是因为标签在 NeoForge 与 Fabric mod 加载器之间是统一的，这是应众多在多个加载器上开发的 Mod 开发者的请求而做的。

此规则有少数例外，针对一些与 NeoForge 系统紧密结合的标签。例如许多[伤害类型][damagetype]标签就属于此类。
:::

覆盖标签文件通常是叠加而非替换。这意味着，如果两个数据包指定了相同 id 的标签文件，两个文件的内容将被合并（除非另有说明）。这一行为使标签有别于大多数其他数据文件——后者会替换掉所有已有的值。

## 标签文件格式 {#tag-file-format}

标签文件的语法如下：

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

当你试图查找一个已有标签时，通常建议遵循以下步骤：

- 看看 Minecraft 的标签，检查你想找的标签是否在其中。Minecraft 的标签可在 `BlockTags`、`ItemTags`、`EntityTypeTags` 等中找到。
- 若没有，看看 NeoForge 的标签，检查你想找的标签是否在其中。NeoForge 的标签可在 `Tags.Blocks`、`Tags.Items`、`Tags.EntityTypes` 等中找到。
- 否则，就假定 Minecraft 或 NeoForge 中没有指定该标签，因此你需要创建自己的标签。

创建自己的标签时，你应该问自己以下问题：

- 这会修改我自己 Mod 的行为吗？如果是，标签应放在你 Mod 的命名空间下。（例如"我的某物可以在此方块上生成"这类标签就很常见。）
- 其他 Mod 是否也会想使用这个标签？如果是，标签应放在 `c` 命名空间下。（例如新的金属或宝石就很常见。）
- 否则，使用你 Mod 的命名空间。

标签本身的命名也有一些约定需要遵循：

- 使用复数形式。例如：`minecraft:planks`、`c:ingots`。
- 为同类型的多个对象使用文件夹，并为每个文件夹设一个总体标签。例如：`c:ingots/iron`、`c:ingots/gold`，以及包含二者的 `c:ingots`。（注意：这是 NeoForge 的约定，Minecraft 对大多数标签并不遵循此约定。）

## 使用标签 {#using-tags}

要在代码中引用标签，你必须创建一个 `TagKey<T>`，其中 `T` 是标签的类型（`Block`、`Item`、`EntityType<?>` 等），使用一个[注册表键][regkey]和一个[标识符][identifier]：

```java
public static final TagKey<Block> MY_TAG = TagKey.create(
        // The registry key. The type of the registry must match the generic type of the tag.
        Registries.BLOCK,
        // The location of the tag. This example will put our tag at data/examplemod/tags/blocks/example_tag.json.
        Identifier.fromNamespaceAndPath("examplemod", "example_tag")
);
```

:::warning
由于 `TagKey` 是一个 record，其构造器是公开的。然而，不应直接使用该构造器，因为这样做可能导致各种问题，例如在查找标签条目时。
:::

然后我们就可以用我们的标签对其执行各种操作。先从最明显的一个开始：检查某个对象是否在标签中。以下示例假定为方块标签，但除非另有说明，其功能对每种类型的标签都完全相同：

```java
// Check whether dirt is in our tag.
// Assume access to Level level
boolean isInTag = level.registryAccess().lookupOrThrow(BuiltInRegistries.BLOCK).getOrThrow(MY_TAG).stream().anyMatch(holder -> holder.is(Items.DIRT));
```

由于这个语句非常冗长，尤其是在频繁使用时，`BlockState` 和 `ItemStack`——标签系统最常见的两个使用者——各自定义了一个 `#is` 辅助方法，用法如下：

```java
// Check whether the blockState's block is in our tag.
boolean isInBlockTag = blockState.is(MY_TAG);
// Check whether the itemStack's item is in our tag. Assumes the existence of MY_ITEM_TAG as a TagKey<Item>.
boolean isInItemTag = itemStack.is(MY_ITEM_TAG);
```

如果需要，我们也可以获取一组标签条目来进行流式处理，如下所示：

```java
// Assume access to Level level
Stream<Holder<Block>> blocksInTag = level.registryAccess().lookupOrThrow(BuiltInRegistries.BLOCK).getOrThrow(MY_TAG).stream();
```

### 引导期间静态注册表的标签 {#tags-for-static-registries-during-bootstrap}

有时，你需要在注册过程中访问一个 `HolderSet`。在[数据组件上下文][datacomponent]中，初始化器会提供一个 `HolderLookup.Provider` 用于解析：

```java
Item.Properties props = new Item.Properties().delayedComponent(
    // The component to initialize
    DataComponents.DAMAGE_RESISTANT,
    // The initializer function, typically provides at least the registry lookup
    registries -> new DamageResistant(
        // Get the HolderSet from the TagKey
        registries.getOrThrow(DamageTypeTags.IS_FIRE)
    )
);
```

在数据组件上下文之外，**仅**对静态注册表而言，你可以通过 `BuiltInRegistries#acquireBootstrapRegistrationLookup` 获取所需的 `HolderGetter`：

```java
// Assume access to Level level
HolderSet<Block> blockTag = BuiltInRegistries.acquireBootstrapRegistrationLookup(BuiltInRegistries.BLOCK).getOrThrow(MY_TAG);
```

## 数据生成 {#datagen}

与许多其他 JSON 文件一样，标签可以进行[数据生成][datagen]。每种标签都有自己的数据生成基类——方块标签一个类，物品标签一个类，等等——因此我们每种标签也需要一个类。所有这些类都继承自 `TagsProvider<T>` 基类，`T` 同样是标签的类型（`Block`、`Item` 等）。`TagsProvider` 进一步归为两大类：`IntrinsicHolderTagsProvider<T>`，用于通常是静态注册表的对象，允许你直接把对象传给标签；以及 `KeyTagProvider`，用于通常是数据包注册表的对象，允许你把对象的 `ResourceKey` 传给标签。此外还有一个额外类别 `HolderTagProvider<T>`，用于以 `Holder` 包装的静态注册表对象，不过它目前仅被原版用于药水标签。

下表列出了不同对象的标签提供器：

| 类型                        | 标签提供器类                            | 提供器类型                     |
|----------------------------|----------------------------------------|-------------------------------|
| `BannerPattern`            | `BannerPatternTagsProvider`            | `KeyTagProvider`              |
| `Biome`                    | `BiomeTagsProvider`                    | `KeyTagProvider`              |
| `Block`                    | `BlockTagsProvider`\*                  | `IntrinsicHolderTagsProvider` |
| `ConfiguredFeature`        | `FeatureTagsProvider`                  | `KeyTagProvider`              |
| `DamageType`               | `DamageTypeTagsProvider`               | `KeyTagProvider`              |
| `Dialog`                   | `DialogTagsProvider`                   | `KeyTagProvider`              |
| `Enchantment`              | `EnchantmentTagsProvider`              | `KeyTagProvider`              |
| `EntityType`               | `EntityTypeTagsProvider`               | `IntrinsicHolderTagsProvider` |
| `FlatLevelGeneratorPreset` | `FlatLevelGeneratorPresetTagsProvider` | `IntrinsicHolderTagsProvider` |
| `Fluid`                    | `FluidTagsProvider`                    | `KeyTagProvider`              |
| `GameEvent`                | `GameEventTagsProvider`                | `KeyTagProvider`              |
| `Instrument`               | `InstrumentTagsProvider`               | `KeyTagProvider`              |
| `Item`                     | `ItemTagsProvider`\*                   | `IntrinsicHolderTagsProvider` |
| `PaintingVariant`          | `PaintingVariantTagsProvider`          | `KeyTagProvider`              |
| `PoiType`                  | `PoiTypeTagsProvider`                  | `KeyTagProvider`              |
| `Potion`                   | `PotionTagsProvider`                   | `HolderTagProvider`           |
| `Structure`                | `StructureTagsProvider`                | `KeyTagProvider`              |
| `Timeline`                 | `TimelineTagsProvider`                 | `KeyTagProvider`              |
| `VillagerTrade`            | `VillagerTradesTagsProvider`           | `KeyTagProvider`              |
| `WorldPreset`              | `WorldPresetTagsProvider`              | `KeyTagProvider`              |


\* 这些提供器由 NeoForge 提供。

举例来说，假设我们想生成方块标签（一个 intrinsic holder 类型）：

```java
public class MyBlockTagsProvider extends BlockTagsProvider {
    // Get parameters from one of the `GatherDataEvent`s.
    public MyBlockTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider) {
        super(output, lookupProvider, ExampleMod.MOD_ID);
    }

    // Add your tag entries here.
    @Override
    protected void addTags(HolderLookup.Provider lookupProvider) {
        // Create a TagAppender of registry objects for our tag. This could also be e.g. a vanilla or NeoForge tag.
        this.tag(MY_TAG)
            // Add entries. This is a vararg parameter.
            // Key tag providers must provide ResourceKeys here instead of the actual objects.
            .add(Blocks.DIRT, Blocks.COBBLESTONE)
            // Add optional entries that will be ignored if absent. This example uses Botania's Pure Daisy.
            // This is not a vararg parameter.
            .add(TagEntry.optionalElement(Identifier.fromNamespaceAndPath("botania", "pure_daisy")))
            // Add a tag entry.
            .addTag(BlockTags.PLANKS)
            // Add multiple tag entries. This is a vararg parameter.
            // Can cause unchecked warnings that can safely be suppressed.
            .addTags(BlockTags.LOGS, BlockTags.WOODEN_SLABS)
            // Add an optional tag entry that will be ignored if absent.
            .addOptionalTag(ItemTags.create(Identifier.fromNamespaceAndPath("c", "ingots/tin")))
            // Add multiple optional tag entries. This is a vararg parameter.
            // Can cause unchecked warnings that can safely be suppressed.
            .addOptionalTags(ItemTags.create(Identifier.fromNamespaceAndPath("c", "nuggets/tin")), ItemTags.create(Identifier.fromNamespaceAndPath("c", "storage_blocks/tin")))
            // Set the replace property to true.
            .replace()
            // Set the replace property back to false.
            .replace(false)
            // Remove entries. This is a vararg parameter.
            // Key tag providers must provide ResourceKeys here instead of the actual objects.
            // Can cause unchecked warnings that can safely be suppressed.
            .remove(Blocks.CRIMSON_SLAB, Blocks.WARPED_SLAB);
    }
}
```

该示例会生成以下标签 JSON：

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

与所有数据提供器一样，把每个标签提供器添加到 `GatherDataEvent` 中：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    // Call event.createDatapackRegistryObjects(...) first if adding datapack objects

    event.createProvider(MyBlockTagsProvider::new);
}
```

### 自定义标签提供器 {#custom-tag-providers}

无论是针对现有还是自定义[注册表][registry]，自定义标签提供器都可以通过直接继承 `TagsProvider<T>` 来创建，其中 `T` 是你要为其生成标签的注册表对象。

```java
public class MyRecipeTypeTagsProvider extends TagsProvider<RecipeType<?>> {
    // Get parameters from the `GatherDataEvent`s.
    public MyRecipeTypeTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider) {
        // Second parameter is the registry key we are generating the tags for.
        super(output, Registries.RECIPE_TYPE, lookupProvider, ExampleMod.MOD_ID);
    }
    
    @Override
    protected void addTags(HolderLookup.Provider lookupProvider) { /*...*/ }
}
```

从这里开始，通过 `getOrCreateRawBuilder` 创建一个 `TagBuilder` 即可从提供器生成标签。该 builder 包含用于按 `Identifier` 添加或移除元素和标签的方法。此外，builder 可以通过 `setReplace` 指定 `replace` 属性：

```java
public class MyRecipeTypeTagsProvider extends TagsProvider<RecipeType<?>> {
    
    // ...

    // Lets assume the following TagKey<RecipeType<?>> SMELTERS, CRAFTERS, SMITHERS
    @Override
    protected void addTags(HolderLookup.Provider lookupProvider) {
        // Create a TagBuilder for `Identifier`s.
        this.getOrCreateRawBuilder(MY_TAG)
            // Add entries.
            .addElement(Identifier.fromNamespaceAndPath("minecraft", "crafting"))
            .addElement(Identifier.fromNamespaceAndPath("minecraft", "smelting"))
            // Add optional entries that will be ignored if absent.
            .addOptionalElement(Identifier.fromNamespaceAndPath("minecraft", "blasting"))
            // Add a tag entry.
            .addTag(SMELTERS.location())
            // Add an optional tag entry that will be ignored if absent.
            .addOptionalTag(CRAFTERS.location())
            // Set the replace property to true.
            .setReplace(true)
            // Set the replace property back to false.
            .setReplace(false)
            // Remove entries.
            .removeElement(Identifier.fromNamespaceAndPath("minecraft", "campfire_cooking"))
            // Remove a tag entry.
            .removeTag(SMITHERS.location());
    }
}
```

目前，整个标签都是由 `Identifier` 构建的。然而，每次都指定原始标识符会变得繁琐，尤其是在已有 `ResourceKey` 或直接对象可用时。这时 `TagAppender` 就派上用场了。`TagAppender<E, T>` 在功能上是对 `TagBuilder` 的一个包装，它接收某种任意条目对象 `E`，并将其转换为针对注册表对象 `T` 的 `TagBuilder` 调用。只要存在将新对象类型转换为先前条目对象 `E` 的方法，`TagAppender` 就可以通过 `map` 重新映射为任意对象。这基本上就是 `KeyTagProvider` 和 `IntrinsicHolderTagsProvider` 所做的事情。它们提供一个 `tag` 方法，分别创建一个把 `ResourceKey` 映射为 `Identifier`、或把直接对象映射为 `Identifier` 的 `TagAppender`：

```java

public class MyRecipeTypeTagsProvider extends TagsProvider<RecipeType<?>> {
    
    // ...

    // Let's assume we have the TagKey<RecipeType<?>>s SMELTERS, CRAFTERS, SMITHERS
    @Override
    protected void addTags(HolderLookup.Provider lookupProvider) {
        // Create the TagAppender for `Identifier`s.
        this.tag(MY_TAG)
            // Replace property info
            .replace()
            // Handle any optional elements that may not be present
            .addOptional(Identifier.fromNamespaceAndPath("examplemod", "example_type"))
            // Can take in a TagKey
            .addOptionalTag(CRAFTERS)

            // Map to ResourceKey (KeyTagProvider)
            .map((Function<ResourceKey<RecipeType<?>>, Identifier>) ResourceKey::location)
            .add(BuiltInRegistries.RECIPE_TYPE.getResourceKey(RecipeType.CRAFTING).orElseThrow())

            // Map to direct object (IntrinsicHolderTagsProvider)
            .map((Function<RecipeType<?>, ResourceKey<RecipeType<?>>) type -> BuiltInRegistries.RECIPE_TYPE.getResourceKey(type).orElseThrow())
            .add(RecipeType.SMELTING)
            .addTag(SMELTERS)
            .remove(RecipeType.CAMPFIRE_COOKING)
            .remove(SMITHERS);
    }

    private TagAppender<Identifier, RecipeType<?>> tag(TagKey<RecipeType<?>> tag) {
        // Create the builder
        TagBuilder builder = this.getOrCreateRawBuilder(tag);

        // Generate the appender (can use TagAppender#forBuilder) instead
        return new TagAppender<Identifier, T>() {

            @Override
            public TagAppender<Identifier, T> add(Identifier element) {
                builder.addElement(element);
                return this;
            }

            @Override
            public TagAppender<Identifier, T> addOptional(Identifier element) {
                builder.addOptionalElement(element);
                return this;
            }

            @Override
            public TagAppender<Identifier, T> addTag(TagKey<T> tag) {
                builder.addTag(tag.location());
                return this;
            }

            @Override
            public TagAppender<Identifier, T> addOptionalTag(TagKey<T> tag) {
                builder.addOptionalTag(tag.location());
                return this;
            }

            // For situations where you cannot access the current entry object
            @Override
            public TagAppender<Identifier, T> add(TagEntry entry) {
                builder.add(entry);
                return this;
            }

            @Override
            public TagAppender<Identifier, T> replace(boolean value) {
                builder.setReplace(value);
                return this;
            }

            @Override
            public TagAppender<Identifier, T> remove(Identifier element) {
                builder.removeElement(element);
                return this;
            }

            @Override
            public TagAppender<ResourceKey<T>, T> remove(TagKey<T> tag) {
                builder.removeTag(tag.location());
                return this;
            }
        };
    }
}
```

#### 复制标签内容 {#copying-tag-contents}

NeoForge 提供了一种特殊的 `IntrinsicHolderTagsProvider`，名为 `BlockTagCopyingItemTagProvider`，用于让物品标签镜像其关联方块标签的内容。此时不使用 `TagAppender`，而是调用 `copy`，将要复制的方块标签传给物品标签。

```java
public class ExampleBlockTagCopyingItemTagProvider extends BlockTagCopyingItemTagProvider {

    public ExampleBlockTagCopyingItemTagProvider(
        PackOutput output,
        CompletableFuture<HolderLookup.Provider> lookupProvider,
        CompletableFuture<TagLookup<Block>> blockTags // Obtained from BlockTagsProvider#contentsGetter
    ) {
        super(output, lookupProvider, blockTags, ExampleMod.MOD_ID);
    }

    @Override
    protected void addTags(HolderLookup.Provider lookupProvider) {
        // Assuming types TagKey<Block> and TagKey<Item> for the two parameters
        this.copy(EXAMPLE_BLOCK_TAG, EXAMPLE_ITEM_TAG);

        // You can also add normal item tags here
    }

}
```

与所有数据提供器一样，复制标签提供器必须添加到 `GatherDataEvent` 中：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    // Call event.createDatapackRegistryObjects(...) first if adding datapack objects

    event.createBlockAndItemTags(MyBlockTagsProvider::new, ExampleBlockTagCopyingItemTagProvider::new);
}
```

[damagetype]: damagetypes.md
[datacomponent]: ../../items/datacomponents.md
[datagen]: ../index.md#data-generation
[registry]: ../../concepts/registries.md
[regkey]: ../../misc/identifier.md#resourcekeys
[identifier]: ../../misc/identifier.md

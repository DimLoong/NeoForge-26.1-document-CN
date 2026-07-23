# 配方材料 {#ingredients}

`Ingredient` 用于[配方][recipes]中，检查给定的 [`ItemStack`][itemstack] 是否为该配方的有效输入。为此，`Ingredient` 实现了 `Predicate<ItemStack>`，可以调用 `#test` 来确认给定的 `ItemStack` 是否匹配该材料。

遗憾的是，`Ingredient` 的许多内部实现十分混乱。NeoForge 通过尽可能绕开 `Ingredient` 类来规避这一问题，转而为自定义材料引入了 `ICustomIngredient` 接口。这并不是常规 `Ingredient` 的直接替代品，但我们可以分别通过 `ICustomIngredient#toVanilla` 和 `Ingredient#getCustomIngredient` 在 `Ingredient` 与其之间来回转换。

## 内置材料类型 {#built-in-ingredient-types}

获取材料最简单的方式是使用 `Ingredient#of` 辅助方法。存在若干变体：

- `Ingredient.of()` 返回一个空材料。
- `Ingredient.of(Blocks.IRON_BLOCK, Items.GOLD_BLOCK)` 返回一个接受铁块或金块的材料。参数是 [`ItemLike`][itemlike] 的可变参数，这意味着可以使用任意数量的方块和物品。
- `Ingredient.of(Stream.of(Items.DIAMOND_SWORD))` 返回一个接受某个物品的材料。与前一个方法类似，但接受 `Stream<ItemLike>`，以备你恰好手头有这样一个流时使用。
- `Ingredient.of(BuiltInRegistries.ITEM.getOrThrow(ItemTags.WOODEN_SLABS))` 返回一个接受指定[标签][tag]中任意物品的材料，例如任意木台阶。

此外，NeoForge 添加了几种额外的材料：

- `new BlockTagIngredient(BlockTags.CONVERTABLE_TO_MUD)` 返回一个类似于 `Ingredient.of()` 标签变体的材料，但用的是方块标签。这应用于本该使用物品标签、但只有方块标签可用的场景（例如 `minecraft:convertable_to_mud`）。
- `CustomDisplayIngredient.of(Ingredient.of(Items.DIRT), SlotDisplay.Empty.INSTANCE)` 返回一个带有你所提供的自定义 [`SlotDisplay`][slotdisplay] 的材料，用于决定该槽位在客户端渲染时如何被消耗显示。
- `CompoundIngredient.of(Ingredient.of(Items.DIRT))` 返回一个带有子材料的材料，子材料在构造函数中传入（可变参数）。只要其任一子材料匹配，该材料即匹配。
- `DataComponentIngredient.of(true, new ItemStack(Items.DIAMOND_SWORD))` 返回一个除物品外还匹配数据组件的材料。布尔参数表示严格匹配（true）或部分匹配（false）。严格匹配意味着数据组件必须完全一致，而部分匹配意味着数据组件必须匹配，但也可以存在其他数据组件。`#of` 还有额外的重载，允许指定多个 `Item`，或提供其他选项。
- `DifferenceIngredient.of(Ingredient.of(BuiltInRegistries.ITEM.getOrThrow(ItemTags.PLANKS)), Ingredient.of(BuiltInRegistries.ITEM.getOrThrow(ItemTags.NON_FLAMMABLE_WOOD)))` 返回一个材料，匹配第一个材料中所有不同时匹配第二个材料的内容。给定的示例只匹配可以燃烧的木板（即除绯红木板、诡异木板和 Mod 下界木木板之外的所有木板）。
- `IntersectionIngredient.of(Ingredient.of(BuiltInRegistries.ITEM.getOrThrow(ItemTags.PLANKS)), Ingredient.of(BuiltInRegistries.ITEM.getOrThrow(ItemTags.NON_FLAMMABLE_WOOD)))` 返回一个材料，匹配同时匹配两个子材料的所有内容。给定的示例只匹配无法燃烧的木板（即绯红木板、诡异木板和 Mod 下界木木板）。

:::note
如果你在数据生成中使用接受一个 `HolderSet` 作为标签实例的材料（即那些调用 `Registry#getOrThrow` 的材料），那么该 `HolderSet` 应通过 `HolderLookup.Provider` 获取，即用 `HolderLookup.Provider#lookupOrThrow` 获取物品注册表，再用带有 `TagKey` 的 `HolderGetter#getOrThrow` 获取该 holder set。
:::

请记住，NeoForge 提供的材料类型是 `ICustomIngredient`，如本文开头所述，在原版语境中使用它们之前必须调用 `#toVanilla`。

## 自定义材料类型 {#custom-ingredient-types}

Mod 开发者可以通过 `ICustomIngredient` 系统添加自己的自定义材料类型。为便于举例，我们来做一个附魔物品材料，它接受一个物品标签以及一个从附魔到最小等级的映射：

```java
public class MinEnchantedIngredient implements ICustomIngredient {
    private final TagKey<Item> tag;
    private final Map<Holder<Enchantment>, Integer> enchantments;
    // The codec for serializing the ingredient.
    public static final MapCodec<MinEnchantedIngredient> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            TagKey.codec(Registries.ITEM).fieldOf("tag").forGetter(e -> e.tag),
            Codec.unboundedMap(Enchantment.CODEC, Codec.INT)
                    .optionalFieldOf("enchantments", Map.of())
                    .forGetter(e -> e.enchantments)
    ).apply(inst, MinEnchantedIngredient::new));
    // Create a stream codec from the regular codec. In some cases, it might make sense to define
    // a new stream codec from scratch.
    public static final StreamCodec<RegistryFriendlyByteBuf, MinEnchantedIngredient> STREAM_CODEC =
            ByteBufCodecs.fromCodecWithRegistries(CODEC.codec());

    // Allow passing in a pre-existing map of enchantments to levels.
    public MinEnchantedIngredient(TagKey<Item> tag, Map<Holder<Enchantment>, Integer> enchantments) {
        this.tag = tag;
        this.enchantments = enchantments;
    }

    // Check if the passed ItemStack matches our ingredient by verifying the item is in the tag
    // and by testing for presence of all required enchantments with at least the required level.
    @Override
    public boolean test(ItemStack stack) {
        return stack.is(tag) && enchantments.keySet()
                .stream()
                .allMatch(ench -> EnchantmentHelper.getEnchantmentsForCrafting(stack).getLevel(ench) >= enchantments.get(ench));
    }

    // Determines whether this ingredient performs NBT or data component matching (false) or not (true).
    // Also determines whether a stream codec is used for syncing, more on this later.
    // We query enchantments on the stack, therefore our ingredient is not simple.
    @Override
    public boolean isSimple() {
        return false;
    }

    // Returns a stream of items that match this ingredient. Mostly for display purposes.
    // There's a few good practices to follow here:
    // - Always include at least one item, to prevent accidental recognition as empty.
    // - Include each accepted Item at least once.
    // - If #isSimple is true, this should be exact and contain every item that matches.
    //   If not, this should be as exact as possible, but doesn't need to be super accurate.
    // In our case, we use all items in the tag.
    @Override
    public Stream<Holder<Item>> items() {
        return BuiltInRegistries.ITEM.getOrThrow(tag).stream();
    }
}
```

自定义材料是一个[注册表][registry]，所以我们必须注册我们的材料。我们使用 NeoForge 提供的 `IngredientType` 类来做到这一点，它基本上是对一个 [`MapCodec`][codec] 以及可选的一个 [`StreamCodec`][streamcodec] 的包装。

```java
public static final DeferredRegister<IngredientType<?>> INGREDIENT_TYPES =
        DeferredRegister.create(NeoForgeRegistries.Keys.INGREDIENT_TYPE, ExampleMod.MOD_ID);

public static final Supplier<IngredientType<MinEnchantedIngredient>> MIN_ENCHANTED =
        INGREDIENT_TYPES.register("min_enchanted",
                // The stream codec parameter is optional, a stream codec will be created from the codec
                // using ByteBufCodecs#fromCodec or #fromCodecWithRegistries if the stream codec isn't specified.
                () -> new IngredientType<>(MinEnchantedIngredient.CODEC, MinEnchantedIngredient.STREAM_CODEC));
```

完成之后，我们还需要在材料类中重写 `#getType`：

```java
public class MinEnchantedIngredient implements ICustomIngredient {
    // other stuff here

    @Override    
    public IngredientType<?> getType() {
        return MIN_ENCHANTED.get();
    }
}
```

大功告成！我们的材料类型已经可以使用了。

## JSON 表示 {#json-representation}

由于原版材料相当受限，而 NeoForge 又为它们引入了一整套全新的注册表，因此也值得看看内置材料和我们自己的材料在 JSON 中是什么样子。

作为对象、且指定了 `neoforge:ingredient_type` 的材料，一般被认为是非原版的。例如：

```json5
{
    "neoforge:ingredient_type": "neoforge:block_tag",
    "tag": "minecraft:convertable_to_mud"
}
```

或另一个使用我们自己材料的示例：

```json5
{
    "neoforge:ingredient_type": "examplemod:min_enchanted",
    "tag": "c:swords",
    "enchantments": {
        "minecraft:sharpness": 4
    }
}
```

如果材料是一个字符串，即未指定 `neoforge:ingredient_type`，那么我们就有一个原版材料。原版材料是字符串，要么表示一个物品，要么在以 `#` 为前缀时表示一个标签。

原版物品材料的示例：

```json5
"minecraft:dirt"
```

原版标签材料的示例：

```json5
"#c:ingots"
```

[codec]: ../../../datastorage/codecs.md
[itemlike]: ../../../items/index.md#itemlike
[itemstack]: ../../../items/index.md#itemstacks
[recipes]: index.md
[registry]: ../../../concepts/registries.md
[slotdisplay]: index.md#slot-displays
[streamcodec]: ../../../networking/streamcodecs.md
[tag]: ../tags.md

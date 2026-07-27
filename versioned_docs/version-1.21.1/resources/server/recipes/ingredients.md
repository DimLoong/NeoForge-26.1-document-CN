# 配方材料 {#ingredients}

`Ingredient` 用于在[配方][recipes]中检查给定的 [`ItemStack`][itemstack] 是否是该配方的有效输入。为此，`Ingredient` 实现了 `Predicate<ItemStack>`，可以调用 `#test` 来确认给定的 `ItemStack` 是否与该配方材料匹配。

遗憾的是，`Ingredient` 的许多内部实现相当混乱。 NeoForge 的应对方式是尽可能绕开 `Ingredient` 类，转而为自定义配方材料引入了 `ICustomIngredient` 接口。它并不是常规 `Ingredient` 的直接替代品，但我们可以分别通过 `ICustomIngredient#to 原版` 和 `Ingredient#getCustomIngredient` 在两者之间来回转换。

## 内置配方材料类型 {#built-in-ingredient-types}

获取配方材料最简单的方式是使用 `Ingredient#of` 系列辅助方法。它有多个变体：

- `Ingredient.of()` 返回一个空配方材料。
- `Ingredient.of(Blocks.IRON_BLOCK, Items.GOLD_BLOCK)` 返回一个接受铁块或金块的配方材料。该参数是 [`ItemLike`][itemlike] 的可变参数，也就是说方块和物品都可以传入任意数量。
- `Ingredient.of(new ItemStack(Items.DIAMOND_SWORD))` 返回一个接受某个物品堆叠的配方材料。注意，其中的数量和数据组件会被忽略。
- `Ingredient.of(Stream.of(new ItemStack(Items.DIAMOND_SWORD)))` 返回一个接受某个物品堆叠的配方材料。与上一个方法类似，但接受的是 `Stream<ItemStack>`，方便你在手头恰好有这样一个流时使用。
- `Ingredient.of(ItemTags.WOODEN_SLABS)` 返回一个接受指定[标签（Tag）][tag]中任意物品的配方材料，例如任意一种木台阶。

此外，NeoForge 还额外添加了几种配方材料：

- `new BlockTagIngredient(BlockTags.CONVERTABLE_TO_MUD)` 返回一个与 `Ingredient.of()` 的标签变体类似的配方材料，但使用的是方块标签而非物品标签。当你本想使用物品标签，但只有方块标签可用时（例如 `minecraft:convertable_to_mud`），应使用这种方式。
- `CompoundIngredient.of(Ingredient.of(Items.DIRT))` 返回一个带有子配方材料的配方材料，子材料在构造函数中传入（可变参数）。只要其任意一个子材料匹配，该配方材料即匹配。
- `DataComponentIngredient.of(true, new ItemStack(Items.DIAMOND_SWORD))` 返回一个除物品外还会匹配数据组件的配方材料。布尔参数表示严格匹配（true）还是部分匹配（false）。严格匹配意味着数据组件必须完全一致，而部分匹配意味着数据组件必须匹配，但也允许存在其他数据组件。 `#of` 还有其他重载，允许指定多个 `Item`，或提供其他选项。
- `DifferenceIngredient.of(Ingredient.of(ItemTags.PLANKS), Ingredient.of(ItemTags.NON_FLAMMABLE_WOOD))` 返回一个配方材料，匹配第一个配方材料中所有不同时匹配第二个配方材料的内容。上面的例子只匹配可以燃烧的木板（即除绯红木板、诡异木板以及 Mod 添加的下界木木板之外的所有木板）。
- `IntersectionIngredient.of(Ingredient.of(ItemTags.PLANKS), Ingredient.of(ItemTags.NON_FLAMMABLE_WOOD))` 返回一个配方材料，匹配同时满足两个子配方材料的所有内容。上面的例子只匹配无法燃烧的木板（即绯红木板、诡异木板以及 Mod 添加的下界木木板）。

请记住，NeoForge 提供的这些配方材料类型都是 `ICustomIngredient`，在用于原版上下文之前必须调用 `#to 原版`，正如本文开头所述。

## 自定义配方材料类型 {#custom-ingredient-types}

Mod 开发者可以通过 `ICustomIngredient` 系统添加自己的配方材料类型。举例来说，我们来做一个附魔物品配方材料，它接受一个物品标签以及一个从附魔到最低等级的映射：

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

    public MinEnchantedIngredient(TagKey<Item> tag) {
        this(tag, new HashMap<>());
    }

    // Make this chainable for easy use.
    public MinEnchantedIngredient with(Holder<Enchantment> enchantment, int level) {
        enchantments.put(enchantment, level);
        return this;
    }

    // Check if the passed ItemStack matches our ingredient by verifying the item is in the tag
    // and by testing for presence of all required enchantments with at least the required level.
    @Override
    public boolean test(ItemStack stack) {
        return stack.is(tag) && enchantments.keySet()
                .stream()
                .allMatch(ench -> stack.getEnchantmentLevel(ench) >= enchantments.get(ench));
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
    // - Always include at least one item stack, to prevent accidental recognition as empty.
    // - Include each accepted Item at least once.
    // - If #isSimple is true, this should be exact and contain every item stack that matches.
    //   If not, this should be as exact as possible, but doesn't need to be super accurate.
    // In our case, we use all items in the tag, each with the required enchantments.
    @Override
    public Stream<ItemStack> getItems() {
        // Get a list of item stacks, one stack per item in the tag.
        List<ItemStack> stacks = BuiltInRegistries.ITEM
                .getOrCreateTag(tag)
                .stream()
                .map(ItemStack::new)
                .toList();
        // Enchant all stacks with all enchantments.
        for (ItemStack stack : stacks) {
            enchantments
                    .keySet()
                    .forEach(ench -> stack.enchant(ench, enchantments.get(ench)));
        }
        // Return stream variant of the list.
        return stacks.stream();
    }
}
```

自定义配方材料是一种[注册表][registry]，因此我们必须注册自己的配方材料。为此，我们使用 NeoForge 提供的 `IngredientType` 类，它本质上是对一个 [`MapCodec`][codec] 以及一个可选的 [`StreamCodec`][streamcodec] 的封装。

```java
public static final DeferredRegister<IngredientType<?>> INGREDIENT_TYPES =
        DeferredRegister.create(NeoForgeRegistries.Keys.INGREDIENT_TYPE, ExampleMod.MOD_ID);

public static final Supplier<IngredientType<MinEnchantedIngredient>> MIN_ENCHANTED =
        INGREDIENT_TYPES.register("min_enchanted",
                // The stream codec parameter is optional, a stream codec will be created from the codec
                // using ByteBufCodecs#fromCodec or #fromCodecWithRegistries if the stream codec isn't specified.
                () -> new IngredientType<>(MinEnchantedIngredient.CODEC, MinEnchantedIngredient.STREAM_CODEC));
```

完成之后，我们还需要在配方材料类中重写 `#getType`：

```java
public class MinEnchantedIngredient implements ICustomIngredient {
    // other stuff here

    @Override    
    public IngredientType<?> getType() {
        return MIN_ENCHANTED;
    }
}
```

大功告成！我们的配方材料类型可以使用了。

## JSON 表示 {#json-representation}

由于原版配方材料相当受限，而 NeoForge 又为其引入了一整套全新的注册表，因此也值得看一看内置配方材料以及我们自己的配方材料在 JSON 中长什么样。

指定了 `type` 的配方材料通常会被视为非原版配方材料。例如：

```json5
{
    "type": "neoforge:block_tag",
    "tag": "minecraft:convertable_to_mud"
}
```

再来一个使用我们自己配方材料的例子：

```json5
{
    "type": "examplemod:min_enchanted",
    "tag": "c:swords",
    "enchantments": {
        "minecraft:sharpness": 4
    }
}
```

如果未指定 `type`，那么这就是一个原版配方材料。原版配方材料可以指定 `item` 或 `tag` 两个属性中的一个。

一个原版物品配方材料的例子：

```json5
{
    "item": "minecraft:dirt"
}
```

一个原版标签配方材料的例子：

```json5
{
    "tag": "c:ingots"
}
```

[codec]: ../../../datastorage/codecs.md
[itemlike]: ../../../items/index.md#itemlike
[itemstack]: ../../../items/index.md#itemstacks
[recipes]: index.md
[registry]: ../../../concepts/registries.md
[streamcodec]: ../../../networking/streamcodecs.md
[tag]: ../tags.md

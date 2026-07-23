# 内置配方类型 {#built-in-recipe-types}

Minecraft 开箱即用地提供了多种配方类型和序列化器供你使用。本文将说明每种配方类型，以及如何生成它们。

## 合成 {#crafting}

合成配方通常在工作台、合成器，或 Mod 的工作台或机器中制作。它们的配方类型是 `minecraft:crafting`。

### 有序合成 {#shaped-crafting}

一些最重要的配方——例如工作台、木棍或大多数工具——是通过有序配方创建的。这些配方由一种合成模式或形状（因此得名“有序”）定义，物品必须按该形状放入。我们来看一个示例：

```json5
{
    "type": "minecraft:crafting_shaped",
    "category": "equipment",
    "key": {
        "#": "minecraft:stick",
        "X": "minecraft:iron_ingot"
    },
    "pattern": [
        "XXX",
        " # ",
        " # "
    ],
    "result": {
        "count": 1,
        "id": "minecraft:iron_pickaxe"
    }
}
```

我们逐行解析：

- `type`：这是有序配方序列化器的 id，`minecraft:crafting_shaped`。
- `category`：这个可选字段定义合成书中的 `CraftingBookCategory`。
- `key` 和 `pattern`：这两者共同定义物品必须如何放入合成网格。
    - pattern 定义最多三行、每行最多三格宽的字符串来定义形状。所有行必须等长，即 pattern 必须构成矩形。空格可用于表示应保持为空的槽位。
    - key 把 pattern 中使用的字符与[材料][ingredient]关联起来。在上面的示例中，pattern 中所有的 `X` 都必须是铁锭，所有的 `#` 都必须是木棍。
- `result`：配方的结果。这是[一个物品堆叠模板的 JSON 表示][itemjson]。
- 示例中未展示的是 `group` 键。这个可选的字符串属性会在配方书中创建一个分组。同一分组中的配方在配方书中会显示为一个。
- 示例中未展示的是 `show_notification`。这个可选的布尔值为 false 时，会禁用首次使用或解锁时在右上角显示的提示气泡。

接下来，我们看看如何在 `RecipeProvider#buildRecipes` 中生成这个配方：

```java
// We use a builder pattern, therefore no variable is created. Create a new builder by calling
// ShapedRecipeBuilder#shaped with the recipe category (found in the RecipeCategory enum)
// and a result item, a result item and count, or a result item stack template.
ShapedRecipeBuilder.shaped(this.registries.lookupOrThrow(Registries.ITEM), RecipeCategory.TOOLS, Items.IRON_PICKAXE)
        // Create the lines of your pattern. Each call to #pattern adds a new line.
        // Patterns will be validated, i.e. their shape will be checked.
        .pattern("XXX")
        .pattern(" # ")
        .pattern(" # ")
        // Create the keys for the pattern. All non-space characters used in the pattern must be defined.
        // This can either accept Ingredients, TagKey<Item>s or ItemLikes, i.e. items or blocks.
        .define('X', Items.IRON_INGOT)
        .define('#', Items.STICK)
        // Creates the recipe advancement. While not mandated by the consuming background systems,
        // the recipe builder will crash if you omit this. The first parameter is the advancement name,
        // and the second one is the condition. Normally, you want to use the has() shortcut for the condition.
        // Multiple advancement requirements can be added by calling #unlockedBy multiple times.
        .unlockedBy("has_iron_ingot", this.has(Items.IRON_INGOT))
        // Stores the recipe in the passed RecipeOutput, to be written to disk.
        // If you want to add conditions to the recipe, those can be set on the output.
        .save(this.output);
```

此外，你可以调用 `#group` 和 `#showNotification`，分别设置配方书分组和切换提示气泡。

### 无序合成 {#shapeless-crafting}

与有序合成配方不同，无序合成配方不关心材料传入的顺序。因此，没有 pattern 和 key，取而代之的只是一列材料：

```json5
{
    "type": "minecraft:crafting_shapeless",
    "category": "misc",
    "ingredients": [
        "minecraft:brown_mushroom",
        "minecraft:red_mushroom",
        "minecraft:bowl"
    ],
    "result": {
        "count": 1,
        "id": "minecraft:mushroom_stew"
    }
}
```

和之前一样，我们逐行解析：

- `type`：这是无序配方序列化器的 id，`minecraft:crafting_shapeless`。
- `category`：这个可选字段定义合成书中的类别。
- `ingredients`：一列[材料][ingredient]。列表顺序在代码中为配方查看目的而保留，但配方本身以任意顺序接受这些材料。
- `result`：配方的结果。这是[一个物品堆叠模板的 JSON 表示][itemjson]。
- 示例中未展示的是 `group` 键。这个可选的字符串属性会在配方书中创建一个分组。同一分组中的配方在配方书中会显示为一个。

接下来，我们看看如何在 `RecipeProvider#buildRecipes` 中生成这个配方：

```java
// We use a builder pattern, therefore no variable is created. Create a new builder by calling
// ShapelessRecipeBuilder#shapeless with the recipe category (found in the RecipeCategory enum)
// and a result item, a result item and count, or a result item stack template.
ShapelessRecipeBuilder.shapeless(this.registries.lookupOrThrow(Registries.ITEM), RecipeCategory.MISC, Items.MUSHROOM_STEW)
        // Add the recipe ingredients. This can either accept Ingredients, TagKey<Item>s or ItemLikes.
        // Overloads also exist that additionally accept a count, adding the same ingredient multiple times.
        .requires(Blocks.BROWN_MUSHROOM)
        .requires(Blocks.RED_MUSHROOM)
        .requires(Items.BOWL)
        // Creates the recipe advancement. While not mandated by the consuming background systems,
        // the recipe builder will crash if you omit this. The first parameter is the advancement name,
        // and the second one is the condition. Normally, you want to use the has() shortcut for the condition.
        // Multiple advancement requirements can be added by calling #unlockedBy multiple times.
        .unlockedBy("has_mushroom_stew", this.has(Items.MUSHROOM_STEW))
        .unlockedBy("has_bowl", this.has(Items.BOWL))
        .unlockedBy("has_brown_mushroom", this.has(Blocks.BROWN_MUSHROOM))
        .unlockedBy("has_red_mushroom", this.has(Blocks.RED_MUSHROOM))
        // Stores the recipe in the passed RecipeOutput, to be written to disk.
        // If you want to add conditions to the recipe, those can be set on the output.
        .save(this.output);
```

此外，你可以调用 `#group` 来设置配方书分组。

:::info
单物品配方（例如存储方块的拆包）应为无序配方，以遵循原版标准。
:::

### 灌注物品 {#imbuing-items}

灌注（imbue）配方是一种特殊的单物品合成配方，其中材料堆叠的药水内容物会被复制到结果堆叠。例如：

```json5
{
    "type": "minecraft:crafting_imbue",
    "category": "misc",
    "material": "minecraft:arrow",
    "result": {
        "count": 8,
        "id": "minecraft:tipped_arrow"
    },
    "source": "minecraft:lingering_potion"
}
```

和之前一样，我们逐行解析：

- `type`：这是配方序列化器的 id，`minecraft:crafting_imbue`。
- `category`：这个可选字段定义合成书中的类别。
- `group`：这个可选的字符串属性会在配方书中创建一个分组。同一分组中的配方在配方书中会显示为一个，这对于转化类配方通常是合理的。
- `source`：包含要灌注的药水内容物的[材料][ingredient]。
- `material`：用于灌注 source 的[材料][ingredient]。
- `result`：配方的结果。这是[一个物品堆叠模板的 JSON 表示][itemjson]。

接下来，我们看看如何在 `RecipeProvider#buildRecipes` 中生成这个配方：

```java
// We use a builder pattern, therefore no variable is created. Create a new builder by calling
// CustomCraftingRecipeBuilder#customCrafting with the recipe category (found in the RecipeCategory enum)
// and a factory function that takes in the `Recipe.CommonInfo` and `CraftingRecipe.CraftingBookInfo`
// to return the `Recipe` instance.
CustomCraftingRecipeBuilder.customCrafting(
    RecipeCategory.MISC,
    // The function used to construct the recipe instance.
    (commonInfo, bookInfo) -> new ImbueRecipe(
        commonInfo, bookInfo,
        // The source that contains the potion contents.
        Ingredient.of(Items.LINGERING_POTION),
        // The material used to imbue the source.
        Ingredient.of(Items.ARROW),
        // The resulting template with the potion contents.
        new ItemStackTemplate(Items.TIPPED_ARROW, 8)
    )
)
    // Creates the recipe advancement. While not mandated by the consuming background systems,
    // the recipe builder will crash if you omit this. The first parameter is the advancement name,
    // and the second one is the condition. Normally, you want to use the has() shortcut for the condition.
    // Multiple advancement requirements can be added by calling #unlockedBy multiple times.
    .unlockedBy("has_lingering_potion", this.has(Items.LINGERING_POTION))
    // Stores the recipe in the passed RecipeOutput, to be written to disk.
    // If you want to add conditions to the recipe, those can be set on the output.
    .save(this.output, "tipped_arrow");
```

此外，你可以调用 `#group` 来设置配方书分组。

### 嬗变合成 {#transmute-crafting}

嬗变（transmute）配方是一种特殊的单物品合成配方，其中输入堆叠的数据组件会被完整复制到结果堆叠。嬗变通常发生在两个不同物品之间，其中一个是另一个的染色版本。例如：

```json5
{
    "type": "minecraft:crafting_transmute",
    "category": "misc",
    "group": "shulker_box_dye",
    "input": "#minecraft:shulker_boxes",
    "material": "minecraft:blue_dye",
    "material_count": 1,
    "add_material_count_to_result": false,
    "result": {
        "id": "minecraft:blue_shulker_box"
    }
}
```

和之前一样，我们逐行解析：

- `type`：这是配方序列化器的 id，`minecraft:crafting_transmute`。
- `category`：这个可选字段定义合成书中的类别。
- `group`：这个可选的字符串属性会在配方书中创建一个分组。同一分组中的配方在配方书中会显示为一个，这对于嬗变类配方通常是合理的。
- `input`：要嬗变的[材料][ingredient]。
- `material`：把堆叠转化为其结果的[材料][ingredient]。
- `material_count`：把堆叠转化为其结果所需的 `material` 数量。
- `result`：配方的结果。这是[一个物品堆叠模板的 JSON 表示][itemjson]。
- `add_material_count_to_result`：所用材料的数量是否应加到作为结果返回的物品数量上。这通常用于克隆物品数据，例如地图。

接下来，我们看看如何在 `RecipeProvider#buildRecipes` 中生成这个配方：

```java
// We use a builder pattern, therefore no variable is created. Create a new builder by calling
// TransmuteRecipeBuilder#transmute with the recipe category (found in the RecipeCategory enum),
// the ingredient input, the ingredient material, and the resulting item.
TransmuteRecipeBuilder.transmute(RecipeCategory.MISC, this.tag(ItemTags.SHULKER_BOXES),
    Ingredient.of(DyeItem.byColor(DyeColor.BLUE)), ShulkerBoxBlock.getBlockByColor(DyeColor.BLUE).asItem())
        // Sets the group of the recipe to display in the recipe book.
        .group("shulker_box_dye")
        // Sets the number of materials required to transmute the stack.
        .setMaterialCount(TransmuteRecipe.DEFAULT_MATERIAL_COUNT)
        // Creates the recipe advancement. While not mandated by the consuming background systems,
        // the recipe builder will crash if you omit this. The first parameter is the advancement name,
        // and the second one is the condition. Normally, you want to use the has() shortcut for the condition.
        // Multiple advancement requirements can be added by calling #unlockedBy multiple times.
        .unlockedBy("has_shulker_box", this.has(ItemTags.SHULKER_BOXES))
        // Stores the recipe in the passed RecipeOutput, to be written to disk.
        // If you want to add conditions to the recipe, those can be set on the output.
        .save(this.output);
```

此外，可以用 `#addMaterialCountToOutput` 把所用材料的数量加到结果数量上。

### 染色物品 {#dying-items}

染色（dye）配方是一种特殊的单物品合成配方，其中染料堆叠的 `DataComponents#DYE` 会被合并为一个 `DataComponents#DYED_COLOR` 并应用到目标堆叠上以构造结果堆叠。目标堆叠的所有其他组件都会被复制到结果堆叠，类似于[嬗变合成][transmute]。例如：

```json5
{
    "type": "minecraft:crafting_dye",
    "category": "misc",
    "dye": "#minecraft:dyes",
    "group": "dyed_armor",
    "result": {
        "id": "minecraft:leather_boots"
    },
    "target": "minecraft:leather_boots"
}
```

和之前一样，我们逐行解析：

- `type`：这是配方序列化器的 id，`minecraft:crafting_transmute`。
- `category`：这个可选字段定义合成书中的类别。
- `group`：这个可选的字符串属性会在配方书中创建一个分组。同一分组中的配方在配方书中会显示为一个，这对于染色类配方通常是合理的。
- `target`：要应用染料的[材料][ingredient]。
- `dye`：用于给堆叠染色的[材料][ingredient]染料。它们都必须带有 `DataComponents#DYE` [数据组件][datacomponent]。
- `result`：配方的结果。这是[一个物品堆叠模板的 JSON 表示][itemjson]。

接下来，我们看看如何在 `RecipeProvider#buildRecipes` 中生成这个配方：

```java
// We use a builder pattern, therefore no variable is created. Create a new builder by calling
// CustomCraftingRecipeBuilder#customCrafting with the recipe category (found in the RecipeCategory enum)
// and a factory function that takes in the `Recipe.CommonInfo` and `CraftingRecipe.CraftingBookInfo`
// to return the `Recipe` instance.
CustomCraftingRecipeBuilder.customCrafting(
    RecipeCategory.MISC,
    // The function used to construct the recipe instance.
    (commonInfo, bookInfo) -> new DyeRecipe(
        commonInfo, bookInfo,
        // The target to apply the dyes to.
        Ingredient.of(Items.LEATHER_BOOTS),
        // The dyes that can be applied to the target.
        this.tag(ItemTags.DYES),
        // The resulting template with the applied dye color.
        new ItemStackTemplate(Items.LEATHER_BOOTS)
    )
)
    // Sets the group of the recipe to display in the recipe book.
    .group("dyed_armor")
    // Creates the recipe advancement. While not mandated by the consuming background systems,
    // the recipe builder will crash if you omit this. The first parameter is the advancement name,
    // and the second one is the condition. Normally, you want to use the has() shortcut for the condition.
    // Multiple advancement requirements can be added by calling #unlockedBy multiple times.
    .unlockedBy("has_leather_boots", this.has(Items.LEATHER_BOOTS))
    // Stores the recipe in the passed RecipeOutput, to be written to disk.
    // If you want to add conditions to the recipe, those can be set on the output.
    .save(this.output, "dyed_leather_boots");
```

### 特殊配方 {#special-recipes}

还有许多其他合成配方是专为单一用途而制作的（例如复制书、创建烟花），而非以通用方式应用。大多数时候，这是为了通过从输入堆叠计算出组件值来在输出上设置数据组件。这些配方仍然是可配置的，通常接受输入材料和模板结果。例如：

```json5
{
    "type": "minecraft:crafting_special_firework_rocket",
    "fuel": "minecraft:gunpowder",
    "result": {
        "count": 3,
        "id": "minecraft:firework_rocket"
    },
    "shell": "minecraft:paper",
    "star": "minecraft:firework_star"
}
```

这个配方用于创建烟花火箭，指定了用于创建结果的 fuel、shell 和 star 材料。不过，它假设 star 材料带有 `DataComponents#FIREWORK_EXPLOSION` 组件，否则不会添加任何爆炸效果。

Minecraft 给大多数特殊合成配方加上 `crafting_special_` 前缀，不过这一惯例并非必须遵循。

在 `RecipeProvider#buildRecipes` 中生成这个配方如下所示：

```java
// The parameter of #special is a Supplier<Recipe<?>>.
SpecialRecipeBuilder.special(
    () -> new FireworkRocketRecipe(
        Ingredient.of(Items.PAPER),
        Ingredient.of(Items.GUNPOWDER),
        Ingredient.of(Items.FIREWORK_STAR),
        new ItemStackTemplate(Items.FIREWORK_ROCKET, 3)
    )
)
    // This overload of #save allows us to specify a name. It can also be used on other recipe builders.
    .save(this.output, "firework_rocket");
```

原版提供以下特殊合成序列化器（Mod 可以添加更多）：

- `minecraft:crafting_special_bannerduplicate`：用于复制旗帜。
- `minecraft:crafting_special_bookcloning`：用于复制成书。这会使结果书的 generation 属性加一。
- `minecraft:crafting_special_firework_rocket`：用于合成烟花火箭。
- `minecraft:crafting_special_firework_star`：用于合成烟花之星。
- `minecraft:crafting_special_firework_star_fade`：用于给烟花之星应用渐变。
- `minecraft:crafting_special_mapextending`：用于扩展已填充的地图。
- `minecraft:crafting_special_repairitem`：用于把两个损坏的物品修复为一个。
- `minecraft:crafting_special_shielddecoration`：用于给盾牌应用旗帜。
- `minecraft:crafting_decorated_pot`：用于用陶片合成饰纹陶罐。

## 熔炉类配方 {#furnace-like-recipes}

第二重要的一组配方是通过熔炼或类似流程制作的配方。所有在熔炉（类型 `minecraft:smelting`）、烟熏炉（`minecraft:smoking`）、高炉（`minecraft:blasting`）和营火（`minecraft:campfire_cooking`）中制作的配方都使用相同的格式：

```json5
{
    "type": "minecraft:smelting",
    "category": "food",
    "cookingtime": 200,
    "experience": 0.1,
    "ingredient": {
        "item": "minecraft:kelp"
    },
    "result": {
        "id": "minecraft:dried_kelp"
    }
}
```

我们逐行解析：

- `type`：这是配方序列化器的 id，`minecraft:smelting`。这可能因你制作的熔炉类配方种类不同而不同。
- `category`：这个可选字段定义烹饪配方书中的类别。
- `cookingtime`：这个字段决定配方需要处理多久，单位为刻。所有原版熔炉配方使用 200，烟熏炉和高炉使用 100，营火使用 600。不过，这可以是你想要的任何值。
- `experience`：决定制作该配方时奖励的经验量。此字段可选，若缺省则不奖励任何经验。
- `ingredient`：配方的输入[材料][ingredient]。
- `result`：配方的结果。这是[一个物品堆叠模板的 JSON 表示][itemjson]。

在 `RecipeProvider#buildRecipes` 中对这些配方进行数据生成如下所示：

```java
// Use #smoking for smoking recipes, #blasting for blasting recipes, and #campfireCooking for campfire recipes.
// All of these builders work the same otherwise.
SimpleCookingRecipeBuilder.smelting(
        // Our input ingredient.
        Ingredient.of(Items.KELP),
        // Our recipe category.
        RecipeCategory.FOOD,
        CookingBookCategory.FOOD
        // Our result item. May also be an ItemStackTemplate.
        Items.DRIED_KELP,
        // Our experience reward
        0.1f,
        // Our cooking time.
        200
)
        // The recipe advancement, like with the crafting recipes above.
        .unlockedBy("has_kelp", this.has(Blocks.KELP))
        // This overload of #save allows us to specify a name.
        .save(this.output, "dried_kelp_smelting");
```

:::info
这些配方的配方类型与其配方序列化器相同，即熔炉使用 `minecraft:smelting`，烟熏炉使用 `minecraft:smoking`，以此类推。
:::

## 切石 {#stonecutting}

切石机配方使用 `minecraft:stonecutting` 配方类型。它们极其简单，只有一个类型、一个输入和一个输出：

```json5
{
    "type": "minecraft:stonecutting",
    "ingredient": "minecraft:andesite",
    "result": {
        "count": 2,
        "id": "minecraft:andesite_slab"
    }
}
```

`type` 定义配方序列化器（`minecraft:stonecutting`）。ingredient 是一个[材料][ingredient]，result 是一个基础的[物品堆叠模板 JSON][itemjson]。和合成配方一样，它们也可以可选地指定一个 `group` 用于在配方书中分组。

在 `RecipeProvider#buildRecipes` 中的数据生成同样简单：

```java
SingleItemRecipeBuilder.stonecutting(Ingredient.of(Items.ANDESITE), RecipeCategory.BUILDING_BLOCKS, Items.ANDESITE_SLAB, 2)
        .unlockedBy("has_andesite", this.has(Items.ANDESITE))
        .save(this.output, "andesite_slab_from_andesite_stonecutting");
```

请注意，单物品配方构建器不支持真正的 ItemStack 结果，因此也不支持带数据组件的结果。不过，配方 Codec 确实支持它们，所以若需要此功能，则需要实现自定义构建器。

## 锻造 {#smithing}

锻造台支持两种不同的配方序列化器。一种用于把输入转化为输出、并复制输入的组件（例如附魔），另一种用于把组件应用到输入上。两者都使用 `minecraft:smithing` 配方类型，并且都需要三个输入，分别称为基础项（base）、模板项（template）和添加项（addition）。

### 转化锻造 {#transform-smithing}

这个配方序列化器用于把两个输入物品转化为一个，并保留第一个输入的数据组件。原版主要将其用于下界合金装备，不过这里可以使用任意物品：

```json5
{
    "type": "minecraft:smithing_transform",
    "addition": "#minecraft:netherite_tool_materials",
    "base": "minecraft:diamond_axe",
    "result": {
        "id": "minecraft:netherite_axe"
    },
    "template": "minecraft:netherite_upgrade_smithing_template"
}
```

我们逐行解析：

- `type`：这是配方序列化器的 id，`minecraft:smithing_transform`。
- `base`：配方的基础[材料][ingredient]。通常，这是某件装备。
- `template`：配方的模板[材料][ingredient]。通常，这是一个锻造模板。
- `addition`：配方的添加[材料][ingredient]。通常，这是某种材料，例如下界合金锭。
- `result`：配方的结果。这是[一个物品堆叠模板的 JSON 表示][itemjson]。

在数据生成期间，在 `RecipeProvider#buildRecipes` 中调用 `SmithingTransformRecipeBuilder#smithing` 来添加你的配方：

```java
SmithingTransformRecipeBuilder.smithing(
        // The template ingredient.
        Ingredient.of(Items.NETHERITE_UPGRADE_SMITHING_TEMPLATE),
        // The base ingredient.
        Ingredient.of(Items.DIAMOND_AXE),
        // The addition ingredient.
        this.tag(ItemTags.NETHERITE_TOOL_MATERIALS),
        // The recipe book category.
        RecipeCategory.TOOLS,
        // The result item. Note that while the recipe codec accepts an item stack template here, the builder does not.
        // If you need an item stack template output, you need to use your own builder.
        Items.NETHERITE_AXE
)
        // The recipe advancement, like with the other recipes above.
        .unlocks("has_netherite_ingot", this.has(ItemTags.NETHERITE_TOOL_MATERIALS))
        // This overload of #save allows us to specify a name.
        .save(this.output, "netherite_axe_smithing");
```

### 纹饰锻造 {#trim-smithing}

纹饰锻造是把盔甲纹饰应用到盔甲上的过程：

```json5
{
    "type": "minecraft:smithing_trim",
    "addition": "#minecraft:trim_materials",
    "base": "#minecraft:trimmable_armor",
    "pattern": "minecraft:spire",
    "template": "minecraft:bolt_armor_trim_smithing_template"
}
```

我们再次逐条解析：

- `type`：这是配方序列化器的 id，`minecraft:smithing_trim`。
- `base`：配方的基础[材料][ingredient]。所有原版用例在此都使用 `minecraft:trimmable_armor` 标签。
- `template`：配方的模板[材料][ingredient]。所有原版用例在此都使用一个锻造纹饰模板。
- `addition`：配方的添加[材料][ingredient]。所有原版用例在此都使用 `minecraft:trim_materials` 标签。
- `pattern`：应用到基础材料上的纹饰图案。

值得注意的是，这个配方序列化器缺少一个 result 字段。这是因为它使用基础输入，并把模板项和添加项“应用”到它上面，即它根据其他输入设置基础项的组件，并将该操作的结果用作配方的结果。

在数据生成期间，在 `RecipeProvider#buildRecipes` 中调用 `SmithingTrimRecipeBuilder#smithingTrim` 来添加你的配方：

```java
SmithingTrimRecipeBuilder.smithingTrim(
        // The template ingredient.
        Ingredient.of(Items.BOLT_ARMOR_TRIM_SMITHING_TEMPLATE),
        // The base ingredient.
        this.tag(ItemTags.TRIMMABLE_ARMOR),
        // The addition ingredient.
        this.tag(ItemTags.TRIM_MATERIALS),
        // The trim pattern to apply to the base.
        this.registries.lookupOrThrow(Registries.TRIM_PATTERN).getOrThrow(TrimPatterns.SPIRE),
        // The recipe book category.
        RecipeCategory.MISC
)
        // The recipe advancement, like with the other recipes above.
        .unlocks("has_smithing_trim_template", this.has(Items.BOLT_ARMOR_TRIM_SMITHING_TEMPLATE))
        // This overload of #save allows us to specify a name. Yes, this name is copied from vanilla.
        .save(this.output, "bolt_armor_trim_smithing_template_smithing_trim");
```

[datacomponent]: ../../../items/datacomponents.md
[ingredient]: ingredients.md
[itemjson]: ../../../items/index.md#json-representation
[transmute]: #transmute-crafting

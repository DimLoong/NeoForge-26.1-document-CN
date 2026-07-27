# 内置配方类型 {#built-in-recipe-types}

Minecraft 开箱即用地提供了多种配方类型和序列化器供你使用。本文将逐一讲解每种配方类型，以及如何生成它们。

## 合成 {#crafting}

合成配方通常在工作台、合成器，或 Mod 添加的工作台或机器中制作。它们的配方类型是 `minecraft:crafting`。

### 有序合成 {#shaped-crafting}

一些最重要的配方——例如工作台、木棍或大多数工具——都是通过有序配方制作的。这些配方由一个物品必须按其摆放的合成图案或形状（因此称为“有序”）来定义。我们来看一个例子长什么样：

```json5
{
    "type": "minecraft:crafting_shaped",
    "category": "equipment",
    "pattern": [
        "XXX",
        " # ",
        " # "
    ],
    "key": {
        "#": {
            "item": "minecraft:stick"
        },
        "X": {
            "item": "minecraft:iron_ingot"
        }
    },
    "result": {
        "count": 1,
        "id": "minecraft:iron_pickaxe"
    }
}
```

我们来逐行解读：

- `type`：这是有序配方序列化器的 id，即 `minecraft:crafting_shaped`。
- `category`：这个可选字段定义了在合成书中的分类。
- `key` 和 `pattern`：二者共同定义了物品必须如何摆放到合成网格中。
    - pattern 定义了最多三行、每行最多三个字符宽的字符串来描述形状。所有行的长度必须相同，即整个图案必须构成一个矩形。空格可用于表示应保持为空的槽位。
    - key 将图案中使用的字符与[配方材料][ingredient]关联起来。在上面的例子中，图案里所有 `X` 都必须是铁锭，所有 `#` 都必须是木棍。
- `result`：配方的结果。这是[物品堆叠的 JSON 表示][itemjson]。
- 例子中未展示的是 `group` 键。这个可选的字符串属性会在合成书中创建一个分组。同一分组内的配方会在合成书中合并显示为一个。

接下来，我们看看你会如何生成这个配方：

```java
// We use a builder pattern, therefore no variable is created. Create a new builder by calling
// ShapedRecipeBuilder#shaped with the recipe category (found in the RecipeCategory enum)
// and a result item, a result item and count, or a result item stack.
ShapedRecipeBuilder.shaped(RecipeCategory.TOOLS, Items.IRON_PICKAXE)
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
        .unlockedBy("has_iron_ingot", has(Items.IRON_INGOT))
        // Stores the recipe in the passed RecipeOutput, to be written to disk.
        // If you want to add conditions to the recipe, those can be set on the output.
        .save(output);
```

此外，你还可以调用 `#group` 来设置合成书分组。

### 无序合成 {#shapeless-crafting}

与有序合成配方不同，无序合成配方并不关心配方材料的传入顺序。因此，它没有图案和键，取而代之的只是一个配方材料列表：

```json5
{
    "type": "minecraft:crafting_shapeless",
    "category": "misc",
    "ingredients": [
        {
            "item": "minecraft:brown_mushroom"
        },
        {
            "item": "minecraft:red_mushroom"
        },
        {
            "item": "minecraft:bowl"
        }
    ],
    "result": {
        "count": 1,
        "id": "minecraft:mushroom_stew"
    }
}
```

和之前一样，我们逐行解读：

- `type`：这是无序配方序列化器的 id，即 `minecraft:crafting_shapeless`。
- `category`：这个可选字段定义了在合成书中的分类。
- `ingredients`：一个[配方材料][ingredient]列表。列表顺序在代码中会被保留，用于配方查看，但配方本身接受任意顺序的配方材料。
- `result`：配方的结果。这是[物品堆叠的 JSON 表示][itemjson]。
- 例子中未展示的是 `group` 键。这个可选的字符串属性会在合成书中创建一个分组。同一分组内的配方会在合成书中合并显示为一个。

接下来，我们看看你会如何生成这个配方：

```java
// We use a builder pattern, therefore no variable is created. Create a new builder by calling
// ShapelessRecipeBuilder#shapeless with the recipe category (found in the RecipeCategory enum)
// and a result item, a result item and count, or a result item stack.
ShapelessRecipeBuilder.shapeless(RecipeCategory.MISC, Items.MUSHROOM_STEW)
        // Add the recipe ingredients. This can either accept Ingredients, TagKey<Item>s or ItemLikes.
        // Overloads also exist that additionally accept a count, adding the same ingredient multiple times.
        .requires(Blocks.BROWN_MUSHROOM)
        .requires(Blocks.RED_MUSHROOM)
        .requires(Items.BOWL)
        // Creates the recipe advancement. While not mandated by the consuming background systems,
        // the recipe builder will crash if you omit this. The first parameter is the advancement name,
        // and the second one is the condition. Normally, you want to use the has() shortcut for the condition.
        // Multiple advancement requirements can be added by calling #unlockedBy multiple times.
        .unlockedBy("has_mushroom_stew", has(Items.MUSHROOM_STEW))
        .unlockedBy("has_bowl", has(Items.BOWL))
        .unlockedBy("has_brown_mushroom", has(Blocks.BROWN_MUSHROOM))
        .unlockedBy("has_red_mushroom", has(Blocks.RED_MUSHROOM))
        // Stores the recipe in the passed RecipeOutput, to be written to disk.
        // If you want to add conditions to the recipe, those can be set on the output.
        .save(output);
```

此外，你还可以调用 `#group` 来设置合成书分组。

:::info
单物品配方（例如存储方块的拆解）应当使用无序配方，以遵循原版的惯例。
:::

### 特殊合成 {#special-crafting}

在某些情况下，输出必须根据输入动态生成。大多数时候，这是为了通过复制或计算输入堆叠中的值来为输出设置数据组件。这类配方通常只指定类型，其余一切都硬编码在代码中。例如：

```java
{
    "type": "minecraft:crafting_special_armordye"
}
```

这个配方用于皮革盔甲染色，它只指定了类型，其余一切都硬编码在代码中——最典型的就是颜色计算，这在 JSON 中会很难表达。 Minecraft 为所有特殊合成配方加上了 `crafting_special_` 前缀，不过并不必须遵循这一做法。

生成这个配方的方式如下：

```java
// The parameter of #special is a Function<CraftingBookCategory, Recipe<?>>.
// All 原版 special recipes use a constructor with one CraftingBookCategory parameter for this.
SpecialRecipeBuilder.special(ArmorDyeRecipe::new)
        // This overload of #save allows us to specify a name. It can also be used on shaped or shapeless builders.
        .save(output, "armor_dye");
```

原版提供了以下特殊合成序列化器（Mod 可以添加更多）：

- `minecraft:crafting_special_armordye`：用于给皮革盔甲以及其他可染色物品染色。
- `minecraft:crafting_special_bannerduplicate`：用于复制旗帜。
- `minecraft:crafting_special_bookcloning`：用于复制成书。这会使复制出的书的“代数”属性加一。
- `minecraft:crafting_special_firework_rocket`：用于合成烟花火箭。
- `minecraft:crafting_special_firework_star`：用于合成烟花之星。
- `minecraft:crafting_special_firework_star_fade`：用于为烟花之星添加渐变效果。
- `minecraft:crafting_special_mapcloning`：用于复制已填充的地图，对藏宝图同样有效。
- `minecraft:crafting_special_mapextending`：用于扩展已填充的地图。
- `minecraft:crafting_special_repairitem`：用于将两件损坏的物品修复合并为一件。
- `minecraft:crafting_special_shielddecoration`：用于将旗帜图案应用到盾牌上。
- `minecraft:crafting_special_shulkerboxcoloring`：用于在保留内容物的情况下给潜影盒染色。
- `minecraft:crafting_special_suspiciousstew`：用于根据输入的花朵合成迷之炖菜。
- `minecraft:crafting_special_tippedarrow`：用于根据输入的药水合成药箭。
- `minecraft:crafting_decorated_pot`：用于用陶片合成饰纹陶罐。

## 熔炉类配方 {#furnace-like-recipes}

第二重要的一组配方是通过熔炼或类似过程制作的配方。所有在熔炉（类型 `minecraft:smelting`）、烟熏炉（`minecraft:smoking`）、高炉（`minecraft:blasting`）和营火（`minecraft:campfire_cooking`）中制作的配方都使用相同的格式：

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

我们逐行解读：

- `type`：这是配方序列化器的 id，即 `minecraft:smelting`。它会根据你制作的熔炉类配方种类而有所不同。
- `category`：这个可选字段定义了在合成书中的分类。
- `cookingtime`：这个字段决定了配方需要处理多久，单位为刻（tick）。所有原版熔炉配方使用 200，烟熏炉和高炉使用 100，营火使用 600。不过，这可以是你想要的任意值。
- `experience`：决定制作这个配方时奖励的经验值。这个字段是可选的，如果省略则不奖励任何经验。
- `ingredient`：配方的输入[配方材料][ingredient]。
- `result`：配方的结果。这是[物品堆叠的 JSON 表示][itemjson]。

这些配方的数据生成如下所示：

```java
// Use #smoking for smoking recipes, #blasting for blasting recipes, and #campfireCooking for campfire recipes.
// All of these builders work the same otherwise.
SimpleCookingRecipeBuilder.smelting(
        // Our input ingredient.
        Ingredient.of(Items.KELP),
        // Our recipe category.
        RecipeCategory.FOOD,
        // Our result item. May also be an ItemStack.
        Items.DRIED_KELP,
        // Our experience reward
        0.1f,
        // Our cooking time.
        200
)
        // The recipe advancement, like with the crafting recipes above.
        .unlockedBy("has_kelp", has(Blocks.KELP))
        // This overload of #save allows us to specify a name.
        .save(p_301191_, "dried_kelp_smelting");
```

:::info
这些配方的配方类型与它们的配方序列化器相同，即熔炉使用 `minecraft:smelting`，烟熏炉使用 `minecraft:smoking`，以此类推。
:::

## 切石 {#stonecutting}

切石机配方使用 `minecraft:stonecutting` 配方类型。它们简单到不能再简单，只有一个类型、一个输入和一个输出：

```json5
{
    "type": "minecraft:stonecutting",
    "ingredient": {
        "item": "minecraft:andesite"
    },
    "result": {
        "count": 2,
        "id": "minecraft:andesite_slab"
    }
}
```

`type` 定义了配方序列化器（`minecraft:stonecutting`）。 ingredient 是一个[配方材料][ingredient]，result 是一个基本的[物品堆叠 JSON][itemjson]。与合成配方一样，它们也可以选择性地指定 `group`，用于在合成书中分组。

数据生成同样简单：

```java
SingleItemRecipeBuilder.stonecutting(Ingredient.of(Items.ANDESITE), RecipeCategory.BUILDING_BLOCKS, Items.ANDESITE_SLAB, 2)
        .unlockedBy("has_andesite", has(Items.ANDESITE))
        .save(output, "andesite_slab_from_andesite_stonecutting");
```

注意，单物品配方构建器不支持真正的 ItemStack 结果，因此也不支持带数据组件的结果。不过配方的 codec 确实支持它们，所以如果需要这一功能，就需要实现一个自定义构建器。

## 锻造 {#smithing}

锻造台支持两种不同的配方序列化器。一种用于将输入转化为输出，并复制输入的组件（例如附魔）；另一种用于将组件应用到输入上。二者都使用 `minecraft:smithing` 配方类型，并且都需要三个输入，分别称为基础物品（base）、模板（template）和附加物品（addition）。

### 转化锻造 {#transform-smithing}

这个配方序列化器用于将两个输入物品转化为一个，并保留第一个输入的数据组件。原版主要将其用于下界合金装备，不过这里可以使用任意物品：

```json5
{
    "type": "minecraft:smithing_transform",
    "base": {
        "item": "minecraft:diamond_axe"
    },
    "template": {
        "item": "minecraft:netherite_upgrade_smithing_template"
    },
    "addition": {
        "item": "minecraft:netherite_ingot"
    },
    "result": {
        "count": 1,
        "id": "minecraft:netherite_axe"
    }
}
```

我们逐行拆解：

- `type`：这是配方序列化器的 id，即 `minecraft:smithing_transform`。
- `base`：配方的基础[配方材料][ingredient]。通常这是某件装备。
- `template`：配方的模板[配方材料][ingredient]。通常这是一个锻造模板。
- `addition`：配方的附加[配方材料][ingredient]。通常这是某种材料，例如下界合金锭。
- `result`：配方的结果。这是[物品堆叠的 JSON 表示][itemjson]。

在数据生成时，调用 `SmithingTransformRecipeBuilder#smithing` 来添加你的配方：

```java
SmithingTransformRecipeBuilder.smithing(
        // The template ingredient.
        Ingredient.of(Items.NETHERITE_UPGRADE_SMITHING_TEMPLATE),
        // The base ingredient.
        Ingredient.of(Items.DIAMOND_AXE),
        // The addition ingredient.
        Ingredient.of(Items.NETHERITE_INGOT),
        // The recipe book category.
        RecipeCategory.TOOLS,
        // The result item. Note that while the recipe codec accepts an item stack here, the builder does not.
        // If you need an item stack output, you need to use your own builder.
        Items.NETHERITE_AXE
)
        // The recipe advancement, like with the other recipes above.
        .unlocks("has_netherite_ingot", has(Items.NETHERITE_INGOT))
        // This overload of #save allows us to specify a name.
        .save(output, "netherite_axe_smithing");
```

### 纹饰锻造 {#trim-smithing}

纹饰锻造是将盔甲纹饰应用到盔甲上的过程：

```json5
{
    "type": "minecraft:smithing_trim",
    "addition": {
        "tag": "minecraft:trim_materials"
    },
    "base": {
        "tag": "minecraft:trimmable_armor"
    },
    "template": {
        "item": "minecraft:bolt_armor_trim_smithing_template"
    }
}
```

同样，我们把它拆解成各个部分：

- `type`：这是配方序列化器的 id，即 `minecraft:smithing_trim`。
- `base`：配方的基础[配方材料][ingredient]。所有原版用例在此都使用 `minecraft:trimmable_armor` 标签。
- `template`：配方的模板[配方材料][ingredient]。所有原版用例在此都使用一个锻造纹饰模板。
- `addition`：配方的附加[配方材料][ingredient]。所有原版用例在此都使用 `minecraft:trim_materials` 标签。

值得注意的是，这个配方序列化器缺少一个 result 字段。这是因为它使用基础输入，并在其上“应用”模板和附加物品，也就是根据其他输入设置基础物品的组件，并将该操作的结果用作配方的结果。

在数据生成时，调用 `SmithingTrimRecipeBuilder#smithingTrim` 来添加你的配方：

```java
SmithingTrimRecipeBuilder.smithingTrim(
        // The base ingredient.
        Ingredient.of(ItemTags.TRIMMABLE_ARMOR),
        // The template ingredient.
        Ingredient.of(Items.BOLT_ARMOR_TRIM_SMITHING_TEMPLATE),
        // The addition ingredient.
        Ingredient.of(ItemTags.TRIM_MATERIALS),
        // The recipe book category.
        RecipeCategory.MISC
)
        // The recipe advancement, like with the other recipes above.
        .unlocks("has_smithing_trim_template", has(Items.BOLT_ARMOR_TRIM_SMITHING_TEMPLATE))
        // This overload of #save allows us to specify a name. Yes, this name is copied from 原版.
        .save(output, "bolt_armor_trim_smithing_template_smithing_trim");
```

[ingredient]: ingredients.md
[itemjson]: ../../../items/index.md#json-representation

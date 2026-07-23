import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 配方 {#recipes}

配方是一种在 Minecraft 世界中把一组对象转化为其他对象的方式。尽管 Minecraft 纯粹将这套系统用于物品转化，但该系统的构建方式允许任何类型的对象——方块、实体等——被转化。几乎所有配方都使用配方数据文件；除非明确说明，本文中的“配方”都默认指数据驱动的配方。

配方数据文件位于 `data/<namespace>/recipe/<path>.json`。例如，配方 `minecraft:diamond_block` 位于 `data/minecraft/recipe/diamond_block.json`。

## 术语 {#terminology}

- **配方 JSON**，或**配方文件**，是由 `RecipeManager` 加载和存储的 JSON 文件。它包含诸如配方类型、输入和输出等信息，以及其他附加信息（例如处理时间）。
- **`Recipe`** 持有所有 JSON 字段的代码内表示，以及匹配逻辑（“这个输入匹配该配方吗？”）和一些其他属性。
- **`RecipeInput`** 是一种为配方提供输入的类型。它有多个子类，例如 `CraftingInput` 或 `SingleRecipeInput`（用于熔炉及类似情形）。
- **配方材料**，或简称**材料**（ingredient），是配方的单个输入（而 `RecipeInput` 一般表示一组用于与配方材料进行比对的输入）。材料是一套非常强大的系统，因此在[其专属文章][ingredients]中另行介绍。
- **`PlacementInfo`** 是对配方所含物品及它们应填入哪些索引位置的定义。若无法在某种程度上根据所提供的物品捕获该配方（例如只改变数据组件），则使用 `PlacementInfo#NOT_PLACEABLE`。
- **`SlotDisplay`** 定义单个槽位在配方查看器（如配方书）中应如何显示。
- **`RecipeDisplay`** 定义一个配方的多个 `SlotDisplay`，供配方查看器（如配方书）使用。虽然该接口只包含关于配方结果以及配方所在工作台的方法，但其子类型可以捕获诸如材料或网格大小之类的信息。
- **`RecipeManager`** 是服务端上的一个单例字段，持有所有已加载的配方。
- **`RecipeSerializer`** 基本上是对一个 [`MapCodec`][codec] 和一个 [`StreamCodec`][streamcodec] 的包装，二者都用于序列化。
- **`RecipeType`** 是 `Recipe` 的已注册类型对应物。它主要用于按类型查找配方。作为经验法则，不同的合成容器应使用不同的 `RecipeType`。例如，`minecraft:crafting` 配方类型涵盖 `minecraft:crafting_shaped` 和 `minecraft:crafting_shapeless` 配方序列化器，以及各种特殊合成序列化器。
- **`RecipeBookCategory`** 是一个组，表示在配方书中查看时的一批配方。
- **配方[进度][advancement]**是负责在配方书中解锁配方的进度。它们并非必需，通常也会被玩家忽视而转用配方查看器 Mod，不过[配方数据提供器][datagen]会为你生成它们，所以建议顺其自然直接使用。
- **`RecipePropertySet`** 定义菜单中所定义的输入槽位可接受的材料列表。
- **`RecipeBuilder`** 在数据生成期间用于创建 JSON 配方。
- **配方工厂**（recipe factory）是一个方法引用，用于从 `RecipeBuilder` 创建 `Recipe`。它可以是对构造函数的引用、静态构建器方法，或专为此目的创建的函数式接口（通常命名为 `Factory`）。

## JSON 规范 {#json-specification}

配方文件的内容因所选类型的不同而差异很大。所有配方文件共有的是 `type` 和 [`neoforge:conditions`][conditions] 属性：

```json5
{
    // The recipe type. This maps to an entry in the recipe serializer registry.
    "type": "minecraft:crafting_shaped",
    // A list of data load conditions. Optional, NeoForge-added. See the article linked above for more information.
    "neoforge:conditions": [ /*...*/ ]
}
```

Minecraft 提供的完整类型列表可在[内置配方类型一文][builtin]中找到。Mod 也可以[定义自己的配方类型][customrecipes]。

## 使用配方 {#using-recipes}

配方通过 `RecipeManager` 类加载、存储和获取，而该类又通过 `ServerLevel#recipeAccess` 获取，或者——若你没有可用的 `ServerLevel`——通过 `ServerLifecycleHooks.getCurrentServer()#getRecipeManager` 获取。默认情况下服务端不会把配方同步到客户端，而只发送用于限制菜单槽位输入的 `RecipePropertySet`。此外，每当某个配方在配方书中被解锁时，它的 `RecipeDisplay` 及对应的 `RecipeDisplayEntry` 都会被发送到客户端（不包括所有 `Recipe#isSpecial` 返回 true 的配方）。因此，配方逻辑应始终运行在服务端。

获取配方最简单的方式是通过其资源键：

```java
RecipeManager recipes = serverLevel.recipeAccess();
// RecipeHolder<?> is a record of the resource key and the recipe itself.
Optional<RecipeHolder<?>> optional = recipes.byKey(
    ResourceKey.create(Registries.RECIPE, Identifier.withDefaultNamespace("diamond_block"))
);
optional.map(RecipeHolder::value).ifPresent(recipe -> {
    // Do whatever you want to do with the recipe here. Be aware that the recipe may be of any type.
});
```

一种更实用的方法是构造一个 `RecipeInput` 并尝试获取匹配的配方。在本例中，我们将使用 `CraftingInput#of` 创建一个包含一个钻石块的 `CraftingInput`。这会创建一个无序输入，有序输入则会改用 `CraftingInput#ofPositioned`，而其他输入会使用其他 `RecipeInput`（例如，熔炉配方一般会使用 `new SingleRecipeInput`）。

```java
RecipeManager recipes = serverLevel.recipeAccess();
// Construct a RecipeInput, as required by the recipe. For example, construct a CraftingInput for a crafting recipe.
// The parameters are width, height and items, respectively.
CraftingInput input = CraftingInput.of(1, 1, List.of(new ItemStack(Items.DIAMOND_BLOCK)));
// The generic wildcard on the recipe holder should then extend CraftingRecipe.
// This allows for more type safety later on.
Optional<RecipeHolder<? extends CraftingRecipe>> optional = recipes.getRecipeFor(
        // The recipe type to get the recipe for. In our case, we use the crafting type.
        RecipeType.CRAFTING,
        // Our recipe input.
        input,
        // Our level context.
        serverLevel
);
// This returns the diamond block -> 9 diamonds recipe (unless a datapack changes that recipe).
optional.map(RecipeHolder::value).ifPresent(recipe -> {
    // Do whatever you want here. Note that the recipe is now a CraftingRecipe instead of a Recipe<?>.
});
```

或者，你也可以获取一个（可能为空的）匹配你输入的配方列表，这对于可以合理假定有多个配方匹配的场景尤为有用：

```java
RecipeManager recipes = serverLevel.recipeAccess();
CraftingInput input = CraftingInput.of(1, 1, List.of(new ItemStack(Items.DIAMOND_BLOCK)));
// These are not Optionals, and can be used directly. However, the list may be empty, indicating no matching recipes.
Stream<RecipeHolder<? extends Recipe<CraftingInput>>> list = recipes.recipeMap().getRecipesFor(
    // Same parameters as above.
    RecipeType.CRAFTING, input, serverLevel
);
```

有了正确的配方输入之后，我们还想获取配方输出。这通过调用 `Recipe#assemble` 完成：

```java
RecipeManager recipes = serverLevel.recipeAccess();
CraftingInput input = CraftingInput.of(...);
Optional<RecipeHolder<? extends CraftingRecipe>> optional = recipes.getRecipeFor(...);
// Use ItemStack.EMPTY as a fallback.
ItemStack result = optional
        .map(RecipeHolder::value)
        .map(recipe -> recipe.assemble(input))
        .orElse(ItemStack.EMPTY);
```

如有必要，也可以遍历某一类型的所有配方。方法如下：

```java
RecipeManager recipes = serverLevel.recipeAccess();
// Like before, pass the desired recipe type.
Collection<RecipeHolder<?>> list = recipes.recipeMap().byType(RecipeType.CRAFTING);
```

## 配方优先级 {#recipe-priorities}

有时，一个配方会与其他配方重叠，通常是因为一个模式使用某个特定物品，而另一个相同模式使用一个包含该物品的标签。在这种情况下，原版会使用它找到的第一个配方，而这取决于哪个配方先被读取和加载。这可能成为一个问题，因为如果特定物品的配方在基于标签的配方之后加载，那么特定物品的配方就永远无法被获取到。

为解决这一问题，NeoForge 引入了配方优先级，用于排序哪些配方应先显示。这些条目表示为一个从配方注册键到整数优先级值的映射。优先级值按从高到低排序，未指定的配方默认为 `0`。这意味着优先级大于 `0` 的配方排在前面，而小于 `0` 的配方排在最后。优先级映射位于 `data/<namespace>/recipe_priorities.json`，其中所有配方优先级会被合并到一起，除非 `replace` 为 true，那样会清除之前加载的所有条目。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
{
    // When true, clears out all previously loaded entries.
    "replace": false,
    // The map of recipe entries to their priority values.
    // If a recipe does not have a priority, it defaults to 0.
    "entries": {
        // Points to 'data/examplemod/recipe/higher_priority.json'
        // This recipe will be checked before any defaults.
        "examplemod:higher_priority": 1,
        // Points to 'data/examplemod/recipe/lower_priority.json'
        // This recipe will be checked after any defaults.
        "examplemod:lower_priority": -1,
        // Points to 'data/examplemod/recipe/even_lower_priority.json'
        // This recipe will be checked after any defaults and the
        // 'lower_priority' recipe.
        "examplemod:even_lower_priority": -2
    }
}
```

</TabItem>
<TabItem value="datagen" label="Datagen">

```java
// Generates the recipe priorities
public class ExamplePrioritiesProvider extends RecipePrioritiesProvider {

    public ExamplePrioritiesProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> registries) {
        // Replace 'examplemod' with your mod id.
        super(output, registries, "examplemod");
    }

    @Override
    protected void start() {
        // Registers a recipe entry to a priority value.

        this.add(
            // Points to 'data/examplemod/recipe/higher_priority.json'
            ResourceKey.create(Registries.RECIPE, Identifier.fromNamespaceAndPath("examplemod", "higher_priority")),
            // This recipe will be checked before any defaults.
            1
        );

        this.add(
            // Points to 'data/examplemod/recipe/lower_priority.json'
            Identifier.fromNamespaceAndPath("examplemod", "lower_priority"),
            // This recipe will be checked after any defaults.
            -1
        );

        this.add(
            // Points to 'data/examplemod/recipe/even_lower_priority.json'
            // The namespace is inferred from the mod id passed to the provider.
            "even_lower_priority",
            // This recipe will be checked after any defaults and the 'lower_priority' recipe.
            -2
        );
    }
}
```

</TabItem>
</Tabs>

## 其他配方机制 {#other-recipe-mechanisms}

原版中的某些机制通常被视为配方，但在代码中的实现方式不同。这一般要么是出于历史遗留原因，要么是因为这些“配方”是从其他数据（例如[标签][tags]）构造出来的。

:::warning
配方查看器 Mod 通常不会识别这些配方。对这些 Mod 的支持必须手动添加，请参阅相应 Mod 的文档了解更多信息。
:::

### 铁砧配方 {#anvil-recipes}

铁砧有两个输入槽和一个输出槽。原版仅有的用例是工具修复、合并和重命名，由于每个用例都需要特殊处理，因此没有提供配方文件。不过，可以使用 `AnvilUpdateEvent` 在这套系统之上构建功能。该[事件][event]允许获取输入（左输入槽）和材料（右输入槽），并允许设置输出物品堆叠，以及经验消耗和要消耗的材料数量。也可以通过[取消][cancel]该事件来整体阻止这一过程。

```java
// This example allows repairing a stone pickaxe with a full stack of dirt, consuming half the stack, for 3 levels.
@SubscribeEvent // on the game event bus
public static void onAnvilUpdate(AnvilUpdateEvent event) {
    ItemStack left = event.getLeft();
    ItemStack right = event.getRight();
    if (left.is(Items.STONE_PICKAXE) && right.is(Items.DIRT) && right.getCount() >= 32) {
        event.setOutput(new ItemStack(Items.STONE_PICKAXE));
        event.setMaterialCost(32);
        event.setXpCost(3);
    }
}
```

### 酿造 {#brewing}

参见[状态效果与药水一文中的酿造章节][brewing]。

### 扩展合成网格大小 {#extending-the-crafting-grid-size}

`ShapedRecipePattern` 类负责持有有序合成配方的内存表示，它有一个硬编码的 3x3 槽位上限，这会妨碍那些既想添加更大的工作台又想复用原版有序合成配方类型的 Mod。为解决这一问题，NeoForge 补丁加入了一个名为 `ShapedRecipePattern#setCraftingSize(int width, int height)` 的静态方法，允许提高该上限。它应在 `FMLCommonSetupEvent` 期间调用。此处取最大值，例如若一个 Mod 添加了 4x6 工作台，另一个添加了 6x5 工作台，则最终结果值为 6x6。

:::danger
`ShapedRecipePattern#setCraftingSize` 不是线程安全的。它必须包裹在 `event#enqueueWork` 调用中。
:::

### 客户端配方 {#client-side-recipes}

默认情况下，原版不会向[逻辑客户端][logicalside]发送任何配方。取而代之的是，`RecipePropertySet` / `SelectableRecipe.SingleInputSet` 会被同步，以在用户交互期间处理正确的客户端行为。此外，当某个配方在配方书中被解锁时，它的 `RecipeDisplay` 会被同步。然而，这两种情况的适用范围有限，尤其是当需要从配方本身获取更多数据时。在这些情况下，NeoForge 提供了一种把给定 `RecipeType` 的完整配方发送到客户端的方式。

有两个事件必须在[游戏事件总线][events]上监听：`OnDatapackSyncEvent` 和 `RecipesReceivedEvent`。首先，通过调用 `OnDatapackSyncEvent#sendRecipes` 指定要同步到客户端的 `RecipeType`。然后，可以通过 `RecipesReceivedEvent#getRecipeMap` 从所提供的 `RecipeMap` 访问这些配方。此外，一旦玩家从世界登出，就应通过 `ClientPlayerNetworkEvent.LoggingOut` 清除所有存储在客户端的配方。

```java
// Assume we have some custom RecipeType<ExampleRecipe> EXAMPLE_RECIPE_TYPE

@SubscribeEvent // on the game event bus
public static void datapackSync(OnDatapackSyncEvent event) {
    // Specify what recipe types to sync to the client
    event.sendRecipes(EXAMPLE_RECIPE_TYPE);
}

// In some class only on the physical client

private static final List<RecipeHolder<ExampleRecipe>> EXAMPLE_RECIPES = new ArrayList<>();

@SubscribeEvent // on the game event bus only on the physical client
public static void recipesReceived(RecipesReceivedEvent event) {
    // First remove the previous recipes
    EXAMPLE_RECIPES.clear();

    // Then store the recipes you want
    EXAMPLE_RECIPES.addAll(event.getRecipeMap().byType(EXAMPLE_RECIPE_TYPE));
}

@SubscribeEvent // on the game event bus only on the physical client
public static void clientLogOut(ClientPlayerNetworkEvent.LoggingOut event) {
    // Clear the stored recipes on world log out
    EXAMPLE_RECIPES.clear();
}
```

:::warning
如果你打算为你的配方类型同步配方，`OnDatapackSyncEvent` 应在两个物理端上都被调用。所有世界，包括单人游戏，都在服务端和客户端之间有所划分，这意味着在客户端引用来自服务端的数据包注册项很可能会导致游戏崩溃。
:::

## 数据生成 {#data-generation}

和大多数其他 JSON 文件一样，配方可以数据生成。对于配方，我们要继承 `RecipeProvider` 类并重写 `#buildRecipes`，同时继承 `RecipeProvider.Runner` 类以传递给数据生成器：

```java
public class MyRecipeProvider extends RecipeProvider {

    // Construct the provider to run
    protected MyRecipeProvider(HolderLookup.Provider provider, RecipeOutput output) {
        super(provider, output);
    }
 
    @Override
    protected void buildRecipes() {
        // Add your recipes here.
    }

    // The runner to add to the data generator
    public static class Runner extends RecipeProvider.Runner {
        // Get the parameters from the `GatherDataEvent`s.
        public Runner(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider) {
            super(output, lookupProvider);
        }

        @Override
        protected RecipeProvider createRecipeProvider(HolderLookup.Provider provider, RecipeOutput output) {
            return new MyRecipeProvider(provider, output);
        }
    }
}
```

值得注意的是 `RecipeOutput` 参数。Minecraft 使用该对象为你自动生成一个配方进度。除此之外，NeoForge 向 `RecipeOutput` 注入了[条件][conditions]支持，可通过 `#withConditions` 调用。

配方本身通常通过 `RecipeBuilder` 的子类添加。列出所有原版配方构建器超出了本文范围（它们在[内置配方类型一文][builtin]中说明），不过创建你自己的构建器在[自定义配方页面][customdatagen]中说明。

和所有其他数据提供器一样，配方提供器必须像这样注册到 `GatherDataEvent`：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    // Call event.createDatapackRegistryObjects(...) first if adding datapack objects

    event.createProvider(MyRecipeProvider.Runner::new);
}
```

配方提供器还为常见场景添加了辅助方法，例如 `twoByTwoPacker`（用于 2x2 方块配方）、`threeByThreePacker`（用于 3x3 方块配方）或 `nineBlockStorageRecipes`（用于 3x3 方块配方及 1 个方块到 9 个物品的配方）。

[advancement]: ../advancements.md
[brewing]: ../../../items/mobeffects.md#brewing
[builtin]: builtin.md
[cancel]: ../../../concepts/events.md#cancellable-events
[codec]: ../../../datastorage/codecs.md
[conditions]: ../conditions.md
[customdatagen]: custom.md#data-generation
[customrecipes]: custom.md
[datagen]: #data-generation
[event]: ../../../concepts/events.md
[ingredients]: ingredients.md
[logicalside]: ../../../concepts/sides.md#the-logical-side
[streamcodec]: ../../../networking/streamcodecs.md
[tags]: ../tags.md

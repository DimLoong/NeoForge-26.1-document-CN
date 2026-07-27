# 配方 {#recipes}

配方是一种将 Minecraft 世界中的一组对象转换为其他对象的方法。尽管 Minecraft 使用该系统纯粹是为了进行物品转换，但该系统的构建方式允许任何类型的对象（块、实体等）进行转换。几乎所有的配方都使用配方数据文件；除非另有明确说明，否则本文中的“配方”假定为数据驱动的配方。

配方数据文件位于 `data/<namespace>/recipe/<path>.json`。例如，配方 `minecraft:diamond_block` 位于 `data/minecraft/recipe/diamond_block.json`。

## 术语 {#terminology}

- **配方 JSON**，或**配方文件**，是由 `RecipeManager` 加载和存储的 JSON 文件。它包含配方类型、输入和输出等信息，以及附加信息（例如处理时间）。
- **`Recipe`** 保存所有 JSON 字段的代码内表示，以及匹配逻辑（“此输入与配方匹配吗？”）和一些其他属性。
- **`RecipeInput`** 是一种为配方提供输入的类型。有几个子类，例如 `CraftingInput` 或 `SingleRecipeInput`（用于熔炉和类似设备）。
- **配方成分**，或只是**成分**，是配方的单个输入（而 `RecipeInput` 通常表示用于检查配方成分的输入集合）。成分是一个非常强大的系统，因此[在他们自己的文章中][ingredients]中进行了概述。
- **`RecipeManager`** 是服务器上的一个单例字段，用于保存所有加载的配方。
- **`RecipeSerializer`** 基本上是 [`MapCodec`][codec] 和 [`StreamCodec`][streamcodec] 的包装，两者都用于序列化。
- **`RecipeType`** 是与 `Recipe` 等效的注册类型。它主要用于按类型查找配方时。根据经验，不同的制作容器应使用不同的 `RecipeType`。例如，`minecraft:crafting` 配方类型涵盖 `minecraft:crafting_shaped` 和 `minecraft:crafting_shapeless` 配方序列化器以及特殊工艺序列化器。
- **配方[进度]**是负责解锁配方书中配方的进度。它们不是必需的，而且通常会被喜欢配方查看器 Mod 的玩家忽略，但是[配方数据提供者][datagen] 会为你生成它们，所以建议直接使用它。
- **`RecipeBuilder`** 在数据生成过程中使用来创建 JSON 配方。
- **配方工厂**是用于从 `RecipeBuilder` 创建 `Recipe` 的方法引用。它可以是对构造函数的引用，也可以是静态构建器方法，也可以是专门为此目的创建的功能接口（通常名为 `Factory`）。

## JSON 规范 {#json-specification}

配方文件的内容根据所选类型的不同而有很大差异。所有配方文件的共同点是 `type` 和 [`neoforge:conditions`][conditions] 属性：

```json5
{
    // The recipe type. This maps to an entry in the recipe serializer registry.
    "type": "minecraft:crafting_shaped",
    // A list of data load conditions. Optional, NeoForge-added. See the article linked above for more information.
    "neoforge:conditions": [ /*...*/ ]
}
```

Minecraft 提供的类型的完整列表可以在 [内置配方类型文章][builtin] 中找到。 Mod 还可以[定义自己的配方类型][customrecipes]。

## 使用配方 {#using-recipes}

配方通过 `RecipeManager` 类加载、存储和获取，而该类又通过 `ServerLevel#getRecipeManager` 获取，或者 - 如果你没有可用的 `ServerLevel`-`ServerLifecycleHooks.getCurrentServer()#getRecipeManager`。请注意，虽然客户端拥有 `RecipeManager` 的完整副本用于显示目的，但配方逻辑应始终在服务器上运行以避免同步问题。

获取配方的最简单方法是通过 ID：

```java
RecipeManager recipes = serverLevel.getRecipeManager();
// RecipeHolder<?> is a record of the recipe id and the recipe itself.
Optional<RecipeHolder<?>> optional = recipes.byId(ResourceLocation.withDefaultNamespace("diamond_block"));
optional.map(RecipeHolder::value).ifPresent(recipe -> {
        // Do whatever you want to do with the recipe here. Be aware that the recipe may be of any type.
});
```

更实际适用的方法是构造 `RecipeInput` 并尝试获得匹配的配方。在此示例中，我们将使用 `CraftingInput#of` 创建一个包含一个钻石块的 `CraftingInput`。这将创建一个无形状输入，成形输入将使用 `CraftingInput#ofPositioned`，其他输入将使用其他 `RecipeInput`（例如，熔炉配方通常会使用 `new SingleRecipeInput`）。

```java
RecipeManager recipes = serverLevel.getRecipeManager();
// Construct a RecipeInput, as required by the recipe. For example, construct a CraftingInput for a crafting recipe.
// The parameters are width, height and items, respectively.
CraftingInput input = CraftingInput.of(1, 1, List.of(Items.DIAMOND_BLOCK));
// The generic wildcard on the recipe holder should then extend Recipe<CraftingInput>.
// This allows for more type safety later on.
Optional<RecipeHolder<? extends Recipe<CraftingInput>>> optional = recipes.getRecipeFor(
        // The recipe type to get the recipe for. In our case, we use the crafting type.
        RecipeTypes.CRAFTING,
        // Our recipe input.
        input,
        // Our level context.
        serverLevel
);
// This returns the diamond block -> 9 diamonds recipe (unless a datapack changes that recipe).
optional.map(RecipeHolder::value).ifPresent(recipe -> {
        // Do whatever you want here. Note that the recipe is now a Recipe<CraftingInput> instead of a Recipe<?>.
});
```

或者，你还可以获取与你的输入匹配的可能为空的配方列表，这对于可以合理假设多个配方匹配的情况特别有用：

```java
RecipeManager recipes = serverLevel.getRecipeManager();
CraftingInput input = CraftingInput.of(1, 1, List.of(Items.DIAMOND_BLOCK));
// These are not Optionals, and can be used directly. However, the list may be empty, indicating no matching recipes.
List<RecipeHolder<? extends Recipe<CraftingInput>>> list = recipes.getRecipesFor(
        // Same parameters as above.
        RecipeTypes.CRAFTING, input, serverLevel
);
```

一旦我们有了正确的配方输入，我们还希望获得配方输出。这是通过调用 `Recipe#assemble` 来完成的：

```java
RecipeManager recipes = serverLevel.getRecipeManager();
CraftingInput input = CraftingInput.of(...);
Optional<RecipeHolder<? extends Recipe<CraftingInput>>> optional = recipes.getRecipeFor(...);
// Use ItemStack.EMPTY as a fallback.
ItemStack result = optional
        .map(RecipeHolder::value)
        .map(e -> e.assemble(input, serverLevel.registryAccess()))
        .orElse(ItemStack.EMPTY);
```

如有必要，还可以迭代某个类型的所有配方。这样做是这样的：

```java
RecipeManager recipes = serverLevel.getRecipeManager();
// Like before, pass the desired recipe type.
List<RecipeHolder<?>> list = recipes.getAllRecipesFor(RecipeTypes.CRAFTING);
```

## 其他配方机制 {#other-recipe-mechanisms}

原版 中的一些机制通常被认为是配方，但在代码中的实现方式有所不同。这通常是由于遗留原因，或者是因为“配方”是根据其他数据（例如[标签]）构建的。

:::warning
配方查看器 Mod 通常不会选择这些配方。必须手动添加对这些 mod 的支持，请参阅相应 mod 的文档以获取更多信息。
:::

### 砧配方 {#anvil-recipes}

砧座有两个输入槽和一个输出槽。唯一的普通用例是工具修复、组合和重命名，并且由于每个用例都需要特殊处理，因此不提供配方文件。但是，可以使用 `AnvilUpdateEvent` 构建该系统。此[事件]允许获取输入（左输入槽）和材料（右输入槽），并允许设置输出物品堆栈，以及经验成本和消耗的材料数量。还可以通过[取消][cancel]事件来整体阻止该过程。

```java
// This example allows repairing a stone pickaxe with a full stack of dirt, consuming half the stack, for 3 levels.
@SubscribeEvent // on the game event bus
public static void onAnvilUpdate(AnvilUpdateEvent event) {
    ItemStack left = event.getLeft();
    ItemStack right = event.getRight();
    if (left.is(Items.STONE_PICKAXE) && right.is(Items.DIRT) && right.getCount() >= 64) {
        event.setOutput(Items.STONE_PICKAXE);
        event.setMaterialCost(32);
        event.setCost(3);
    }
}
```

### 酿造 {#brewing}

请参阅[生物效果和药水文章中的酿造章节][brewing]。

## 定制配方 {#custom-recipes}

要添加自定义配方，我们至少需要三样东西：`Recipe`、 `RecipeType` 和 `RecipeSerializer`。根据你要实现的内容，如果重用现有子类不可行，你可能还需要自定义 `RecipeInput`。

为了举例，并突出许多不同的功能，我们将实现一个配方驱动的机制，要求你右键单击世界中的 `BlockState` 中的某个物品，破坏 `BlockState` 并删除结果物品。

### 配方输入 {#the-recipe-input}

让我们首先定义我们想要放入配方中的内容。重要的是要理解配方输入代表玩家现在正在使用的实际输入。因此，我们在这里不使用标签或成分，而是使用我们可用的实际物品堆栈和方块状态。

```java
// Our inputs are a BlockState and an ItemStack.
public record RightClickBlockInput(BlockState state, ItemStack stack) implements RecipeInput {
    // Method to get an item from a specific slot. We have one stack and no concept of slots, so we just assume
    // that slot 0 holds our item, and throw on any other slot. (Taken from SingleRecipeInput#getItem.)
    @Override
    public ItemStack getItem(int slot) {
        if (slot != 0) throw new IllegalArgumentException("No item for index " + slot);
        return this.stack();
    }

    // The slot size our input requires. Again, we don't really have a concept of slots, so we just return 1
    // because we have one item stack involved. Inputs with multiple items should return the actual count here.
    @Override
    public int size() {
        return 1;
    }
}
```

配方输入不需要以任何方式注册或序列化，因为它们是根据需要创建的。并不总是需要创建自己的，普通的（`CraftingInput`、 `SingleRecipeInput` 和 `SmithingRecipeInput`）适用于许多用例。

此外，NeoForge 提供了 `RecipeWrapper` 输入，它包装了与构造函数中传递的 `IItemHandler` 相关的 `#getItem` 和 `#size` 调用。基本上，这意味着任何基于网格的库存（例如箱子）都可以通过将其包装在 `RecipeWrapper` 中来用作配方输入。

### 配方类 {#the-recipe-class}

现在我们已经有了输入，让我们开始讨论配方本身。这是保存我们的配方数据的地方，并且还处理匹配和返回配方结果。因此，它通常是你的自定义配方中最长的课程。

```java
// The generic parameter for Recipe<T> is our RightClickBlockInput from above.
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // An in-code representation of our recipe data. This can be basically anything you want.
    // Common things to have here is a processing time integer of some kind, or an experience reward.
    // Note that we now use an ingredient instead of an item stack for the input.
    private final BlockState inputState;
    private final Ingredient inputItem;
    private final ItemStack result;

    // Add a constructor that sets all properties. 
    public RightClickBlockRecipe(BlockState inputState, Ingredient inputItem, ItemStack result) {
        this.inputState = inputState;
        this.inputItem = inputItem;
        this.result = result;
    }

    // A list of our ingredients. Does not need to be overridden if you have no ingredients
    // (the default implementation returns an empty list here). It makes sense to cache larger lists in a field.
    @Override
    public NonNullList<Ingredient> getIngredients() {
        NonNullList<Ingredient> list = NonNullList.create();
        list.add(this.inputItem);
        return list;
    }

    // Grid-based recipes should return whether their recipe can fit in the given dimensions.
    // We don't have a grid, so we just return if any item can be placed in there.
    @Override
    public boolean canCraftInDimensions(int width, int height) {
        return width * height >= 1;
    }

    // Check whether the given input matches this recipe. The first parameter matches the generic.
    // We check our blockstate and our item stack, and only return true if both match.
    @Override
    public boolean matches(RightClickBlockInput input, Level level) {
        return this.inputState == input.state() && this.inputItem.test(input.stack());
    }

    // Return an UNMODIFIABLE version of your result here. The result of this method is mainly intended
    // for the recipe book, and commonly used by JEI and other recipe viewers as well.
    @Override
    public ItemStack getResultItem(HolderLookup.Provider registries) {
        return this.result;
    }

    // Return the result of the recipe here, based on the given input. The first parameter matches the generic.
    // IMPORTANT: Always call .copy() if you use an existing result! If you don't, things can and will break,
    // as the result exists once per recipe, but the assembled stack is created each time the recipe is crafted.
    @Override
    public ItemStack assemble(RightClickBlockInput input, HolderLookup.Provider registries) {
        return this.result.copy();
    }

    // This example outlines the most important methods. There is a number of other methods to override.
    // Check the class definition of Recipe to view them all.
}
```

### 配方类型 {#the-recipe-type}

接下来是我们的配方类型。这相当简单，因为除了与配方类型关联的名称之外没有任何数据。它们是配方系统的两个[注册][registry]部分之一，因此与所有其他注册表一样，我们创建一个 `DeferredRegister` 并注册到它：

```java
public static final DeferredRegister<RecipeType<?>> RECIPE_TYPES =
        DeferredRegister.create(Registries.RECIPE_TYPE, ExampleMod.MOD_ID);

public static final Supplier<RecipeType<RightClickBlockRecipe>> RIGHT_CLICK_BLOCK =
        RECIPE_TYPES.register(
                "right_click_block",
                // We need the qualifying generic here due to generics being generics.
                () -> RecipeType.<RightClickBlockRecipe>simple(ResourceLocation.fromNamespaceAndPath(ExampleMod.MOD_ID, "right_click_block"))
        );
```

注册配方类型后，我们必须覆盖配方中的 `#getType`，如下所示：

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // other stuff here

    @Override
    public RecipeType<?> getType() {
        return RIGHT_CLICK_BLOCK.get();
    }
}
```

### 配方序列化器 {#the-recipe-serializer}

配方序列化器提供两种 Codec，一种映射 Codec 和一种流式编解码器，分别用于从/到 JSON 和从/到网络的序列化。本节不会深入讨论 Codec 的工作原理，请参阅[MapCodec][codec]和[流式编解码器][streamcodec]以获取更多信息。

由于配方序列化器可能变得相当大，因此原版将它们移动到单独的类中。建议但不要求遵循实践 - 较小的序列化器通常在配方类字段内的匿名类中定义。为了遵循良好的实践，我们将创建一个单独的类来保存我们的 Codec：

```java
// The generic parameter is our recipe class.
// Note: This assumes that simple RightClickBlockRecipe#getInputState, #getInputItem and #getResult getters
// are available, which were omitted from the code above.
public class RightClickBlockRecipeSerializer implements RecipeSerializer<RightClickBlockRecipe> {
    public static final MapCodec<RightClickBlockRecipe> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            BlockState.CODEC.fieldOf("state").forGetter(RightClickBlockRecipe::getInputState),
            Ingredient.CODEC.fieldOf("ingredient").forGetter(RightClickBlockRecipe::getInputItem),
            ItemStack.CODEC.fieldOf("result").forGetter(RightClickBlockRecipe::getResult)
    ).apply(inst, RightClickBlockRecipe::new));
    public static final StreamCodec<RegistryFriendlyByteBuf, RightClickBlockRecipe> STREAM_CODEC =
            StreamCodec.composite(
                    ByteBufCodecs.idMapper(Block.BLOCK_STATE_REGISTRY), RightClickBlockRecipe::getInputState,
                    Ingredient.CONTENTS_STREAM_CODEC, RightClickBlockRecipe::getInputItem,
                    ItemStack.STREAM_CODEC, RightClickBlockRecipe::getResult,
                    RightClickBlockRecipe::new
            );

    // Return our map codec.
    @Override
    public MapCodec<RightClickBlockRecipe> codec() {
        return CODEC;
    }

    // Return our stream codec.
    @Override
    public StreamCodec<RegistryFriendlyByteBuf, RightClickBlockRecipe> streamCodec() {
        return STREAM_CODEC;
    }
}
```

与类型一样，我们注册序列化器：

```java
public static final DeferredRegister<RecipeSerializer<?>> RECIPE_SERIALIZERS =
        DeferredRegister.create(Registries.RECIPE_SERIALIZER, ExampleMod.MOD_ID);

public static final Supplier<RecipeSerializer<RightClickBlockRecipe>> RIGHT_CLICK_BLOCK =
        RECIPE_SERIALIZERS.register("right_click_block", RightClickBlockRecipeSerializer::new);
```

同样，我们还必须在配方中覆盖 `#getSerializer`，如下所示：

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // other stuff here

    @Override
    public RecipeSerializer<?> getSerializer() {
        return RIGHT_CLICK_BLOCK.get();
    }
}
```

### 制作机械师 {#the-crafting-mechanic}

现在配方的所有部分都已完成，你可以自己制作一些配方 JSON（请参阅 [datagen] 部分），然后向配方管理器查询你的配方，如上所示。然后你如何处理这个配方就取决于你了。一个常见的用例是一台可以处理你的配方的机器，将活动配方存储为字段。

然而，在我们的例子中，我们希望在右键单击块上的物品时应用配方。我们将使用[事件处理器][event]来执行此操作。请记住，这是一个示例实现，你可以按照你喜欢的任何方式更改它（只要你在服务器上运行它）。

```java
@SubscribeEvent // on the game event bus
public static void useItemOnBlock(UseItemOnBlockEvent event) {
    // Skip if we are not in the block-dictated phase of the event. See the event's javadocs for details.
    if (event.getUsePhase() != UseItemOnBlockEvent.UsePhase.BLOCK) return;
    // Get the parameters we need.
    UseOnContext context = event.getUseOnContext();
    Level level = context.getLevel();
    BlockPos pos = context.getClickedPos();
    BlockState blockState = level.getBlockState(pos);
    ItemStack itemStack = context.getItemInHand();
    RecipeManager recipes = level.getRecipeManager();
    // Create an input and query the recipe.
    RightClickBlockInput input = new RightClickBlockInput(blockState, itemStack);
    Optional<RecipeHolder<? extends Recipe<CraftingInput>>> optional = recipes.getRecipeFor(
            // The recipe type.
            RIGHT_CLICK_BLOCK,
            input,
            level
    );
    ItemStack result = optional
            .map(RecipeHolder::value)
            .map(e -> e.assemble(input, level.registryAccess()))
            .orElse(ItemStack.EMPTY);
    // If there is a result, break the block and drop the result in the world.
    if (!result.isEmpty()) {
        level.removeBlock(pos, false);
        // If the level is not a server level, don't spawn the entity.
        if (!level.isClientSide()) {
            ItemEntity entity = new ItemEntity(level,
                    // Center of pos.
                    pos.getX() + 0.5, pos.getY() + 0.5, pos.getZ() + 0.5,
                    result);
            level.addFreshEntity(entity);
        }
        // Cancel the event to stop the interaction pipeline.
        event.cancelWithResult(ItemInteractionResult.sidedSuccess(level.isClientSide));
    }
}
```

### 扩展制作网格尺寸 {#extending-the-crafting-grid-size}

`ShapedRecipePattern` 类负责保存形状工艺配方的内存表示，具有 3x3 插槽的硬编码限制，阻碍了想要在重用原版形状工艺配方类型时添加更大工艺台的 mod。为了解决这个问题，NeoForge 修补了一个名为 `ShapedRecipePattern#setCraftingSize(int width, int height)` 的静态方法，该方法允许增加限制。应在 `FMLCommonSetupEvent` 期间调用。此处最大的值获胜，因此，例如，如果一个 Mod 添加了 4x6 工作台，另一个 Mod 添加了 6x5 工作台，则结果值为 6x6。

:::danger
`ShapedRecipePattern#setCraftingSize` 不是线程安全的。它必须包含在 `event#enqueueWork` 调用中。
:::

## 数据生成 {#data-generation}

与大多数其他 JSON 文件一样，配方可以进行数据生成。对于配方，我们要扩展 `RecipeProvider` 类并覆盖 `#buildRecipes`：

```java
public class MyRecipeProvider extends RecipeProvider {
    // Get the parameters from GatherDataEvent.
    public MyRecipeProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookupProvider) {
        super(output, registries);
    }

    @Override
    protected void buildRecipes(RecipeOutput output) {
        // Add your recipes here.
    }
}
```

值得注意的是 `#buildRecipes` 的 `RecipeOutput` 参数。 Minecraft 使用此对象自动为你生成配方进度。最重要的是，NeoForge 向 `RecipeOutput` 注入[条件]支持，可以通过 `#withConditions` 调用。

配方本身通常是通过 `RecipeBuilder` 的子类添加的。列出所有原始配方构建器超出了本文的范围（它们在[内置配方类型文章][builtin]中进行了解释），但是[下面][customdatagen]解释了创建你自己的构建器。

与所有其他数据提供者一样，配方提供者必须注册到 `GatherDataEvent`，如下所示：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();

    // other providers here
    generator.addProvider(
            event.includeServer(),
            new MyRecipeProvider(output, lookupProvider)
    );
}
```

配方提供程序还为常见场景添加了帮助程序，例如 `twoByTwoPacker`（用于 2x2 块配方）、 `threeByThreePacker`（用于 3x3 块配方）或 `nineBlockStorageRecipes`（用于 3x3 块配方和 1 块到 9 项配方）。

### 自定义配方的数据生成 {#data-generation-for-custom-recipes}

要为你自己的配方序列化器创建配方构建器，你需要实现 `RecipeBuilder` 及其方法。一个常见的实现，部分复制自普通版本，如下所示：

```java
// This class is abstract because there is a lot of per-recipe-serializer logic.
// It serves the purpose of showing the common part of all (原版) recipe builders.
public abstract class SimpleRecipeBuilder implements RecipeBuilder {
    // Make the fields protected so our subclasses can use them.
    protected final ItemStack result;
    protected final Map<String, Criterion<?>> criteria = new LinkedHashMap<>();
    @Nullable
    protected String group;

    // It is common for constructors to accept the result item stack.
    // Alternatively, static builder methods are also possible.
    public SimpleRecipeBuilder(ItemStack result) {
        this.result = result;
    }

    // This method adds a criterion for the recipe advancement.
    @Override
    public SimpleRecipeBuilder unlockedBy(String name, Criterion<?> criterion) {
        this.criteria.put(name, criterion);
        return this;
    }

    // This method adds a recipe book group. If you do not want to use recipe book groups,
    // remove the this.group field and make this method no-op (i.e. return this).
    @Override
    public SimpleRecipeBuilder group(@Nullable String group) {
        this.group = group;
        return this;
    }

    // 原版 wants an Item here, not an ItemStack. You still can and should use the ItemStack
    // for serializing the recipes.
    @Override
    public Item getResult() {
        return this.result.getItem();
    }
}
```

这样我们就有了配方构建器的基础。现在，在我们继续依赖于配方序列化器的部分之前，我们应该首先考虑如何创建我们的配方工厂。在我们的例子中，直接使用构造函数是有意义的。在其他情况下，使用静态助手或小型功能接口是正确的方法。如果你将一个构建器用于多个配方类，这一点尤其重要。

利用 `RightClickBlockRecipe::new` 作为我们的配方工厂，并重用上面的 `SimpleRecipeBuilder` 类，我们可以为 `RightClickBlockRecipe` 创建以下配方构建器：

```java
public class RightClickBlockRecipeBuilder extends SimpleRecipeBuilder {
    private final BlockState inputState;
    private final Ingredient inputItem;

    // Since we have exactly one of each input, we pass them to the constructor.
    // Builders for recipe serializers that have ingredient lists of some sort would usually
    // initialize an empty list and have #addIngredient or similar methods instead.
    public RightClickBlockRecipeBuilder(ItemStack result, BlockState inputState, Ingredient inputItem) {
        super(result);
        this.inputState = inputState;
        this.inputItem = inputItem;
    }

    // Saves a recipe using the given RecipeOutput and id. This method is defined in the RecipeBuilder interface.
    @Override
    public void save(RecipeOutput output, ResourceLocation id) {
        // Build the advancement.
        Advancement.Builder advancement = output.advancement()
                .addCriterion("has_the_recipe", RecipeUnlockedTrigger.unlocked(id))
                .rewards(AdvancementRewards.Builder.recipe(id))
                .requirements(AdvancementRequirements.Strategy.OR);
        this.criteria.forEach(advancement::addCriterion);
        // Our factory parameters are the result, the block state, and the ingredient.
        RightClickBlockRecipe recipe = new RightClickBlockRecipe(this.inputState, this.inputItem, this.result);
        // Pass the id, the recipe, and the recipe advancement into the RecipeOutput.
        output.accept(id, recipe, advancement.build(id.withPrefix("recipes/")));
    }
}
```

现在，在数据生成期间，你可以像其他任何人一样调用你的配方构建器：

```java
@Override
protected void buildRecipes(RecipeOutput output) {
    new RightClickRecipeBuilder(
            // Our constructor parameters. This example adds the ever-popular dirt -> diamond conversion.
            new ItemStack(Items.DIAMOND),
            Blocks.DIRT.defaultBlockState(),
            Ingredient.of(Items.APPLE)
    )
            .unlockedBy("has_apple", has(Items.APPLE))
            .save(output);
    // other recipe builders here
}
```

:::note
也可以将 `SimpleRecipeBuilder` 合并到 `RightClickBlockRecipeBuilder`（或你自己的配方构建器）中，特别是如果你只有一两个配方构建器。这里的抽象用于显示构建器的哪些部分依赖于配方，哪些部分不依赖于配方。
:::

[advancement]: ../advancements.md
[brewing]: ../../../items/mobeffects.md
[builtin]: builtin.md
[cancel]: ../../../concepts/events.md#cancellable-events
[codec]: ../../../datastorage/codecs.md
[conditions]: ../conditions.md
[customdatagen]: #data-generation-for-custom-recipes
[customrecipes]: #custom-recipes
[datagen]: #data-generation
[event]: ../../../concepts/events.md
[ingredients]: ingredients.md
[manager]: #using-recipes
[registry]: ../../../concepts/registries.md
[streamcodec]: ../../../networking/streamcodecs.md
[tags]: ../tags.md

# 自定义配方 {#custom-recipes}

要添加自定义配方，我们至少需要三样东西：一个 `Recipe`、一个 `RecipeType` 和一个 `RecipeSerializer`。根据你要实现的内容，若复用现有子类不可行，你可能还需要自定义 `RecipeInput`、`RecipeDisplay`、`SlotDisplay`、`RecipeBookCategory` 和 `RecipePropertySet`。

为便于举例，同时也为了突出许多不同的特性，我们将实现一个配方驱动的机制：它要求你用某种物品在世界中右键点击一个 `BlockState`，破坏该 `BlockState` 并掉落结果物品。

## 配方输入 {#the-recipe-input}

我们先来定义想要放入配方的内容。重要的是要理解，配方输入表示玩家此时此刻实际使用的输入。因此，我们这里不使用标签或材料，而是使用手头实际拥有的物品堆叠和方块状态。

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

配方输入无需以任何方式注册或序列化，因为它们是按需创建的。并不总是需要创建你自己的输入，原版的输入（`CraftingInput`、`SingleRecipeInput` 和 `SmithingRecipeInput`）在许多用例中都足够用。

## 配方类 {#the-recipe-class}

有了输入之后，我们来看配方本身。这里保存我们的配方数据，同时处理匹配和返回配方结果。因此，它通常是自定义配方中最长的类。

```java
// The generic parameter for Recipe<T> is our RightClickBlockInput from above.
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // An in-code representation of our recipe data. This can be basically anything you want.
    // Common things to have here is a processing time integer of some kind, or an experience reward.
    // Note that we now use an ingredient instead of an item stack for the input.
    private final Recipe.CommonInfo commonInfo;
    private final RightClickBlockRecipe.BlockBookInfo bookInfo;
    private final BlockState inputState;
    private final Ingredient inputItem;
    private final ItemStackTemplate result;

    // Add a constructor that sets all properties. 
    public RightClickBlockRecipe(Recipe.CommonInfo commonInfo, RightClickBlockRecipe.BlockBookInfo bookInfo, BlockState inputState, Ingredient inputItem, ItemStackTemplate result) {
        this.commonInfo = commonInfo;
        this.bookInfo = bookInfo;
        this.inputState = inputState;
        this.inputItem = inputItem;
        this.result = result;
    }

    // Check whether the given input matches this recipe. The first parameter matches the generic.
    // We check our blockstate and our item stack, and only return true if both match.
    // If we needed to check the dimensions of our input, we would also do so here.
    @Override
    public boolean matches(RightClickBlockInput input, Level level) {
        return this.inputState == input.state() && this.inputItem.test(input.stack());
    }

    // Return the result of the recipe here, based on the given input. The parameter matches the generic.
    // This can be created using `ItemStackTemplate#create`.
    @Override
    public ItemStack assemble(RightClickBlockInput input) {
        return this.result.create();
    }

    // When true, will prevent the recipe from being synced within the recipe book or awarded on use/unlock.
    // This should only be true if the recipe shouldn't appear in a recipe book, such as map extending.
    // Although this recipe takes in an input state, it could still be used in a custom recipe book using
    //   the methods below.
    @Override
    public boolean isSpecial() {
        return true;
    }

    // This example outlines the most important methods. There is a number of other methods to override.
    // Some methods will be explained in the below sections as they cannot be easily compressed and understood here.
    // Check the class definition of Recipe to view them all.
}
```

### 公共信息 {#common-information}

所有配方都有公共信息，尽管其实现方式未必相同，但都从 JSON 解析而来。对于所有配方，原版都提供了 `Recipe.CommonInfo`。目前，它允许配方指定在解锁时是否显示通知提示气泡。`CommonInfo` 还提供了一个[映射 Codec][codec] 和一个[流式编解码器][streamcodec]，用于与下文的 [`RecipeSerializer`][serializer] 集成。

因此，可以用 `CommonInfo` 在 `Recipe` 上指定一些方法：

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    
    private final Recipe.CommonInfo commonInfo;
    // Other fields

    public RightClickBlockRecipe(Recipe.CommonInfo commonInfo, ...) {
        this.commonInfo = commonInfo;
        // Other initializations
    }

    @Override
    public boolean showNotification() {
        return this.commonInfo.showNotification();
    }

    // Other methods
}
```

:::note
你并非必须使用 `CommonInfo` record，甚至不必在 JSON 上提供 `show_notification` 字段。是否使用它由 Mod 开发者自行决定。
:::

## 配方书信息 {#recipe-book-information}

和公共信息类似，还有一些从 JSON 解析而来、与配方书相关的字段：配方书是一种在某个转化菜单（例如工作台、熔炉等）中显示配方的 [GUI][gui]。对于这些字段，原版提供了 `Recipe.BookInfo<CategoryType>` 接口，其中 `CategoryType` 要么定义配方的类别（假定其可序列化），要么定义一个可转换为该类别的中间可序列化对象。和 `CommonInfo` 一样，它提供了一个[映射 Codec][codec] 和一个[流式编解码器][streamcodec]，用于与下文的 [`RecipeSerializer`][serializer] 集成。

例如：

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    
    private final RightClickBlockRecipe.BlockBookInfo bookInfo;
    // Other fields

    public RightClickBlockRecipe(RightClickBlockRecipe.BlockBookInfo bookInfo, ...) {
        this.bookInfo = bookInfo;
        // Other initializations
    }

    @Override
    public String group() {
        return this.bookInfo.group();
    }

    @Override
    public RecipeBookCategory recipeBookCategory() {
        // Convert the serializable entry to its recipe book category.
        return switch (this.bookInfo.category()) {
            case BUILDING -> RecipeBookCategories.CRAFTING_BUILDING_BLOCKS;
            case EQUIPMENT -> RecipeBookCategories.CRAFTING_EQUIPMENT;
            case REDSTONE -> RecipeBookCategories.CRAFTING_REDSTONE;
            case MISC -> RecipeBookCategories.CRAFTING_MISC;
        };
    }

    // Other methods

    public record BlockBookInfo(CraftingBookCategory category, String group) implements Recipe.BookInfo<CraftingBookCategory> {
        public static final MapCodec<BlockBookInfo> MAP_CODEC = Recipe.BookInfo.mapCodec(
            // Takes in the codec for the generic, the default generic value, and the
            // constructor of `(category, group) -> bookInfo`.
            CraftingBookCategory.CODEC, CraftingBookCategory.MISC, BlockBookInfo::new
        );
        public static final StreamCodec<RegistryFriendlyByteBuf, BlockBookInfo> STREAM_CODEC = Recipe.BookInfo.streamCodec(
            // Takes in the stream codec for the generic and the constructor of
            // `(category, group) -> bookInfo`.
            CraftingBookCategory.STREAM_CODEC, BlockBookInfo::new
        );
    }
}
```

:::note
和 `CommonInfo` 一样，你并非必须使用 `BookInfo`，甚至不必在 JSON 上提供相应字段。是否使用它对其配方有意义，由 Mod 开发者自行决定（即 `Recipe#isSpecial` 返回 true 的配方不会出现在配方书中，因此不应使用 `BookInfo`）。不过，`Recipe#group` 和 `recipeBookCategory` 都必须是非 null 对象。
:::

### 配方分组 {#recipe-groups}

分组的作用相当于一个键，用于把配方归入配方书中的单个条目。若分组设为空字符串，则会被视为其自身独立的条目。

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // other stuff here

    @Override
    public String group() {
        return this.bookInfo.group();
    }
}
```

### 书籍类别 {#book-categories}

`RecipeBookCategory` 只是定义在配方书中显示该配方的分组。例如，铁镐合成配方会出现在 `RecipeBookCategories#CRAFTING_EQUIPMENT` 中，而熟鳕鱼配方会出现在 `#FURNANCE_FOOD` 或 `#SMOKER_FOOD` 中。每个配方都有一个关联的 `RecipeBookCategory`。原版类别可在 `RecipeBookCategories` 中找到。

:::note
熟鳕鱼有两个配方，一个用于熔炉，一个用于烟熏炉。熔炉和烟熏炉配方有不同的书籍类别。
:::

如果你的配方不属于任何现有类别，通常是因为该配方没有使用某个现有的合成工作站（例如工作台、熔炉），那么可以创建一个新的 `RecipeBookCategory`。每个 `RecipeBookCategory` 都必须[注册][registry]到 `BuiltInRegistries#RECIPE_BOOK_CATEGORY`：

```java
/// For some DeferredRegister<RecipeBookCategory> RECIPE_BOOK_CATEGORIES
public static final Supplier<RecipeBookCategory> RIGHT_CLICK_BLOCK_CATEGORY = RECIPE_BOOK_CATEGORIES.register(
    "right_click_block", RecipeBookCategory::new
);
```

然后，要设置类别，我们可以重写 `#recipeBookCategory`，直接返回我们的类别，或利用书籍信息（若已实现）映射到我们的类别，如下所示：

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // other stuff here

    @Override
    public RecipeBookCategory recipeBookCategory() {
        return switch (this.bookInfo.category()) {
            case BUILDING -> RecipeBookCategories.CRAFTING_BUILDING_BLOCKS;
            case EQUIPMENT -> RecipeBookCategories.CRAFTING_EQUIPMENT;
            case REDSTONE -> RecipeBookCategories.CRAFTING_REDSTONE;
            case MISC -> RIGHT_CLICK_BLOCK_CATEGORY.get();
        };
    }
}
```

### 搜索类别 {#search-categories}

所有 `RecipeBookCategory` 在技术上都是 `ExtendedRecipeBookCategory`。还有另一种 `ExtendedRecipeBookCategory`，称为 `SearchRecipeBookCategory`，用于在配方书中查看所有配方时聚合多个 `RecipeBookCategory`。

NeoForge 允许用户通过 mod 事件总线上的 `RegisterRecipeBookSearchCategoriesEvent#register` 把自己的 `ExtendedRecipeBookCategory` 指定为搜索类别。`register` 接受表示搜索类别的 `ExtendedRecipeBookCategory` 以及构成该搜索类别的多个 `RecipeBookCategory`。`ExtendedRecipeBookCategory` 搜索类别无需注册到某个静态原版注册表。

```java
// In some location
public static final ExtendedRecipeBookCategory RIGHT_CLICK_BLOCK_SEARCH_CATEGORY = new ExtendedRecipeBookCategory() {};

@SubscribeEvent // on the mod event bus
public static void registerSearchCategories(RegisterRecipeBookSearchCategoriesEvent event) {
    event.register(
        // The search category
        RIGHT_CLICK_BLOCK_SEARCH_CATEGORY,
        // All recipe categories within the search category as varargs
        RecipeBookCategories.CRAFTING_BUILDING_BLOCKS,
        RecipeBookCategories.CRAFTING_EQUIPMENT,
        RecipeBookCategories.CRAFTING_REDSTONE,
        RIGHT_CLICK_BLOCK_CATEGORY.get()
    )
}
```

## 放置信息 {#placement-info}

`PlacementInfo` 用于定义配方消费者所用的合成要求，以及配方是否/如何能被放入其关联的合成工作站（例如工作台、熔炉）。`PlacementInfo` 仅适用于物品材料，因此如果需要其他类型的材料（例如流体、方块），则需要从头实现周边逻辑。在这些情况下，可以把配方标记为不可放置，并通过 `PlacementInfo#NOT_PLACEABLE` 加以说明。不过，如果你的配方中至少有一个类物品对象，你就应该创建一个 `PlacementInfo`。

`PlacementInfo` 可以通过 `create` 创建，它接受一个或一列材料；或通过 `createFromOptionals` 创建，它接受一列可选材料。如果你的配方包含对空槽位的某种表示，则应使用 `createFromOptionals`，为空槽位提供一个空 optional：

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // other stuff here
    private PlacementInfo info;

    @Override
    public PlacementInfo placementInfo() {
        // This delegate is in case the ingredient is not fully populated at this point in time
        // Tags and recipes are loaded at the same time, which is why this might be the case.
        if (this.info == null) {
            // Use optional ingredient as the block state may have an item representation
            List<Optional<Ingredient>> ingredients = new ArrayList<>();
            Item stateItem = this.inputState.getBlock().asItem();
            ingredients.add(stateItem != Items.AIR ? Optional.of(Ingredient.of(stateItem)): Optional.empty());
            ingredients.add(Optional.of(this.inputItem));

            // Create placement info
            this.info = PlacementInfo.createFromOptionals(ingredients);
        }

        return this.info;
    }
}
```

## 槽位显示 {#slot-displays}

`SlotDisplay` 表示当被配方消费者（如配方书）查看时，某个槽位应渲染什么内容的信息。一个 `SlotDisplay` 有两个方法。首先是 `resolve`，它接受包含可用注册表和燃料值（如 `SlotDisplayContext` 所示）的 `ContextMap`；以及当前的 `DisplayContentsFactory`（它接受该槽位要显示的内容）；并返回转换后的内容列表，作为要被接受的输出。其次是 `type`，它持有用于编码/解码显示的 [`MapCodec`][codec] 和 [`StreamCodec`][streamcodec]。

`SlotDisplay` 通常[通过 `Ingredient` 上的 `#display` 实现，对于 Mod 材料则通过 `ICustomIngredient#display` 实现][ingredients]；不过在某些情况下，输入可能不是材料，这意味着 `SlotDisplay` 将需要使用一个可用的，或者创建一个新的。

以下是原版和 NeoForge 提供的可用槽位显示：

- `SlotDisplay.Empty`：表示无内容的槽位。
- `SlotDisplay.ItemSlotDisplay`：表示一个物品的槽位。
- `SlotDisplay.ItemStackSlotDisplay`：表示一个物品堆叠模板的槽位。
- `SlotDisplay.TagSlotDisplay`：表示一个物品标签的槽位。
- `SlotDisplay.OnlyWithComponent`：把某个其他显示过滤为只显示带有给定数据组件的物品的槽位。
- `SlotDisplay.WithAnyPotion`：表示带有随机 `DataComponents#POTION_CONTENTS` 值的某个输入的槽位。
- `SlotDisplay.WithRemainder`：表示带有某种合成剩余物的某个输入的槽位。
- `SlotDisplay.AnyFuel`：表示所有燃料物品的槽位。
- `SlotDisplay.Composite`：表示其他多个槽位显示组合的槽位。
- `SlotDisplay.DyedSlotDemo`：表示一种染料被应用到某个目标上、并设置 `DataComponents#DYED_COLOR` 的槽位。
- `SlotDisplay.SmithingTrimDemoSlotDisplay`：表示用给定材料把一个随机锻造纹饰应用到某个基础项上的槽位。
- `FluidSlotDisplay`：表示一种流体的槽位。
- `FluidStackSlotDisplay`：表示一个流体堆叠的槽位。
- `FluidTagSlotDisplay`：表示一个流体标签的槽位。

我们的配方中有三个“槽位”：`BlockState` 输入、`Ingredient` 输入和 `ItemStack` 结果。`Ingredient` 输入已经有关联的 `SlotDisplay`，而 `ItemStack` 可以用 `SlotDisplay.ItemStackSlotDisplay` 表示。另一方面，`BlockState` 则需要它自己的自定义 `SlotDisplay` 和 `DisplayContentsFactory`，因为现有的这些只接受物品堆叠，而在本例中方块状态是以另一种方式处理的。

先从 `DisplayContentsFactory` 开始，它意在充当把某个类型转换为所需内容显示类型的转换器。可用的工厂有：

- `DisplayContentsFactory.ForStacks`：接受 `ItemStack` 的转换器。
- `DisplayContentsFactory.ForRemainders`：接受输入对象和一列剩余物对象的转换器。
- `ForFluidStacks`：接受 `FluidStack` 的转换器。

有了它，`DisplayContentsFactory` 就可以被实现来把所提供的对象转换为所需的输出。例如，`SlotDisplay.ItemStackContentsFactory` 接受 `ForStacks` 转换器，并把堆叠转换为 `ItemStack`。

对于我们的 `BlockState`，我们将创建一个接受该状态的工厂，以及一个输出该状态本身的基础实现。

```java
// A basic transformer for block states
public interface ForBlockStates<T> extends DisplayContentsFactory<T> {

    // Delegate methods
    default forState(Holder<Block> block) {
        return this.forState(block.value());
    }

    default forState(Block block) {
        return this.forState(block.defaultBlockState());
    }

    // The block state to take in and transform to the desired output
    T forState(BlockState state);
}

// An implementation for a block state output
public class BlockStateContentsFactory implements ForBlockStates<BlockState> {
    // Singleton instance
    public static final BlockStateContentsFactory INSTANCE = new BlockStateContentsFactory();

    private BlockStateContentsFactory() {}

    @Override
    public BlockState forState(BlockState state) {
        return state;
    }
}

// An implementation for an item stack output
public class BlockStateStackContentsFactory implements ForBlockStates<ItemStack> {
    // Singleton instance
    public static final BlockStateStackContentsFactory INSTANCE = new BlockStateStackContentsFactory();

    private BlockStateStackContentsFactory() {}

    @Override
    public ItemStack forState(BlockState state) {
        return new ItemStack(state.getBlock());
    }
}
```

然后，有了它，我们就可以创建一个新的 `SlotDisplay`。`SlotDisplay.Type` 必须被[注册][registry]：

```java
// A simple slot display
public record BlockStateSlotDisplay(BlockState state) implements SlotDisplay {
    public static final MapCodec<BlockStateSlotDisplay> CODEC = BlockState.CODEC.fieldOf("state")
        .xmap(BlockStateSlotDisplay::new, BlockStateSlotDisplay::state);
    public static final StreamCodec<RegistryFriendlyByteBuf, BlockStateSlotDisplay> STREAM_CODEC =
        StreamCodec.composite(
            ByteBufCodecs.idMapper(Block.BLOCK_STATE_REGISTRY), BlockStateSlotDisplay::state,
            BlockStateSlotDisplay::new
        );
    
    @Override
    public <T> Stream<T> resolve(ContextMap context, DisplayContentsFactory<T> factory) {
        return switch (factory) {
            // Check for our contents factory and transform if necessary
            case ForBlockStates<T> states -> Stream.of(states.forState(this.state));
            // If you want the contents to be handled differently depending on contents display
            //   then you can case on other displays like so
            case ForStacks<T> stacks -> Stream.of(stacks.forStack(state.getBlock().asItem()));
            // If no factories match, then do not return anything in the transformed stream
            default -> Stream.empty();
        }
    }

    @Override
    public SlotDisplay.Type<? extends SlotDisplay> type() {
        // Return the registered type from below
        return BLOCK_STATE_SLOT_DISPLAY.get();
    }
}

// In some registrar class
/// For some DeferredRegister<SlotDisplay.Type<?>> SLOT_DISPLAY_TYPES
public static final Supplier<SlotDisplay.Type<BlockStateSlotDisplay>> BLOCK_STATE_SLOT_DISPLAY = SLOT_DISPLAY_TYPES.register(
    "block_state",
    () -> new SlotDisplay.Type<>(BlockStateSlotDisplay.CODEC, BlockStateSlotDisplay.STREAM_CODEC)
);
```

## 配方显示 {#recipe-display}

`RecipeDisplay` 与 `SlotDisplay` 相同，只不过它表示整个配方。默认接口只跟踪配方的 `result` 以及表示应用该配方的工作台的 `craftingStation`。`RecipeDisplay` 也有一个 `type`，持有用于编码/解码显示的 [`MapCodec`][codec] 和 [`StreamCodec`][streamcodec]。不过，`RecipeDisplay` 的现有子类型都不包含在客户端正确渲染我们配方所需的全部信息。因此，我们将需要创建自己的 `RecipeDisplay`。

所有槽位和材料都应表示为 `SlotDisplay`。任何限制（例如网格大小）都可以由用户自行决定以任意方式提供。

```java
// A simple recipe display
public record RightClickBlockRecipeDisplay(
    SlotDisplay inputState,
    SlotDisplay inputItem,
    SlotDisplay result, // Implements RecipeDisplay#result
    SlotDisplay craftingStation // Implements RecipeDisplay#craftingStation
) implements RecipeDisplay {
    public static final MapCodec<RightClickBlockRecipeDisplay> MAP_CODEC = RecordCodecBuilder.mapCodec(
        instance -> instance.group(
                    SlotDisplay.CODEC.fieldOf("input_state").forGetter(RightClickBlockRecipeDisplay::inputState),
                    SlotDisplay.CODEC.fieldOf("input_item").forGetter(RightClickBlockRecipeDisplay::inputItem),
                    SlotDisplay.CODEC.fieldOf("result").forGetter(RightClickBlockRecipeDisplay::result),
                    SlotDisplay.CODEC.fieldOf("crafting_station").forGetter(RightClickBlockRecipeDisplay::craftingStation)
                )
                .apply(instance, RightClickBlockRecipeDisplay::new)
    );
    public static final StreamCodec<RegistryFriendlyByteBuf, RightClickBlockRecipeDisplay> STREAM_CODEC = StreamCodec.composite(
        SlotDisplay.STREAM_CODEC,
        RightClickBlockRecipeDisplay::inputState,
        SlotDisplay.STREAM_CODEC,
        RightClickBlockRecipeDisplay::inputItem,
        SlotDisplay.STREAM_CODEC,
        RightClickBlockRecipeDisplay::result,
        SlotDisplay.STREAM_CODEC,
        RightClickBlockRecipeDisplay::craftingStation,
        RightClickBlockRecipeDisplay::new
    );

    @Override
    public RecipeDisplay.Type<? extends RecipeDisplay> type() {
        // Return the registered type from below
        return RIGHT_CLICK_BLOCK_RECIPE_DISPLAY.get();
    }
}

// In some registrar class
/// For some DeferredRegister<RecipeDisplay.Type<?>> RECIPE_DISPLAY_TYPES
public static final Supplier<RecipeDisplay.Type<RightClickBlockRecipeDisplay>> RIGHT_CLICK_BLOCK_RECIPE_DISPLAY = RECIPE_DISPLAY_TYPES.register(
    "right_click_block",
    () -> new RecipeDisplay.Type<>(RightClickBlockRecipeDisplay.CODEC, RightClickBlockRecipeDisplay.STREAM_CODEC)
);
```

然后我们可以通过重写 `#display` 为配方创建配方显示，如下所示：

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // other stuff here

    @Override
    public List<RecipeDisplay> display() {
        // You can have many different displays for the same recipe
        // But this example will only use one like the other recipes.
        return List.of(
            // Add our recipe display with the specified slots
            new RightClickBlockRecipeDisplay(
                new BlockStateSlotDisplay(this.inputState),
                this.inputItem.display(),
                new SlotDisplay.ItemStackSlotDisplay(this.result),
                new SlotDisplay.ItemSlotDisplay(Items.GRASS_BLOCK)
            )
        )
    }
}
```

## 配方类型 {#the-recipe-type}

接下来是我们的配方类型。这相当简单，因为与配方类型关联的除了名称之外没有其他数据。它们是配方系统中两个[已注册][registry]部分之一，所以和所有其他注册表一样，我们创建一个 `DeferredRegister` 并向它注册：

```java
public static final DeferredRegister<RecipeType<?>> RECIPE_TYPES =
        DeferredRegister.create(Registries.RECIPE_TYPE, ExampleMod.MOD_ID);

public static final Supplier<RecipeType<RightClickBlockRecipe>> RIGHT_CLICK_BLOCK_TYPE =
        RECIPE_TYPES.register(
                "right_click_block",
                // Creates the recipe type, setting `toString` to the registry name of the type
                RecipeType::simple
        );
```

注册配方类型之后，我们必须在配方中重写 `#getType`，如下所示：

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // other stuff here

    @Override
    public RecipeType<? extends Recipe<RightClickBlockInput>> getType() {
        return RIGHT_CLICK_BLOCK_TYPE.get();
    }
}
```

## 配方序列化器 {#the-recipe-serializer}

配方序列化器提供两个 Codec，一个映射 Codec 和一个流式编解码器，分别用于从/到 JSON 的序列化以及从/到网络的序列化。本节不会深入讲解这些 Codec 的工作原理，请参见[映射 Codec][codec] 和[流式编解码器][streamcodec]了解更多信息。

我们将在配方类内部创建一个映射 Codec 和一个流式编解码器。

```java
public static final MapCodec<RightClickBlockRecipe> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
        Recipe.CommonInfo.MAP_CODEC.forGetter(recipe -> recipe.commonInfo),
        RightClickBlockRecipe.BlockBookInfo.MAP_CODEC.forGetter(recipe -> recipe.bookInfo),
        BlockState.CODEC.fieldOf("state").forGetter(RightClickBlockRecipe::getInputState),
        Ingredient.CODEC.fieldOf("ingredient").forGetter(RightClickBlockRecipe::getInputItem),
        ItemStack.CODEC.fieldOf("result").forGetter(RightClickBlockRecipe::getResult)
).apply(inst, RightClickBlockRecipe::new));

public static final StreamCodec<RegistryFriendlyByteBuf, RightClickBlockRecipe> STREAM_CODEC = StreamCodec.composite(
        Recipe.CommonInfo.STREAM_CODEC, recipe -> recipe.commonInfo,
        RightClickBlockRecipe.BlockBookInfo.STREAM_CODEC, recipe -> recipe.bookInfo,
        ByteBufCodecs.idMapper(Block.BLOCK_STATE_REGISTRY), RightClickBlockRecipe::getInputState,
        Ingredient.CONTENTS_STREAM_CODEC, RightClickBlockRecipe::getInputItem,
        ItemStack.STREAM_CODEC, RightClickBlockRecipe::getResult,
        RightClickBlockRecipe::new
);
```

和类型一样，我们将创建并注册我们的序列化器：

```java
public static final DeferredRegister<RecipeType<?>> RECIPE_SERIALIZERS =
        DeferredRegister.create(Registries.RECIPE_SERIALIZER, ExampleMod.MOD_ID);

public static final Supplier<RecipeSerializer<RightClickBlockRecipe>> RIGHT_CLICK_BLOCK =
        RECIPE_SERIALIZERS.register("right_click_block", ()-> new RecipeSerializer<>(RightClickBlockRecipe.CODEC, RightClickBlockRecipe.STREAM_CODEC));
```

类似地，我们还必须在配方中重写 `#getSerializer`，如下所示：

```java
public class RightClickBlockRecipe implements Recipe<RightClickBlockInput> {
    // other stuff here

    @Override
    public RecipeSerializer<? extends Recipe<RightClickBlockInput>> getSerializer() {
        return RIGHT_CLICK_BLOCK.get();
    }
}
```

## 合成机制 {#the-crafting-mechanic}

现在你的配方的所有部分都已完成，你可以给自己制作一些配方 JSON（参见[数据生成][datagen]一节），然后像上文那样向配方管理器查询你的配方。之后如何处理配方由你决定。一个常见用例是一台能处理你配方的机器，把当前活动配方作为字段存储。

不过在我们的例子中，我们想在物品右键点击方块时应用配方。我们将使用一个[事件处理器][event]来做到这一点。请记住，这是一个示例实现，你可以随意以任何方式修改它（只要你在服务端运行它）。由于我们希望交互状态在客户端和服务端都能匹配，我们还需要[跨网络同步任何相关的输入状态][networking]。

我们可以像这样搭建一个简单的网络实现来同步配方输入：

```java
// A basic packet class, must be registered.
public record ClientboundRightClickBlockRecipesPayload(
    Set<BlockState> inputStates, Set<Holder<Item>> inputItems
) implements CustomPacketPayload {

    // ...
}

// Packet stores data in an instance class.
// Present on both server and client to do initial matching.
public interface RightClickBlockRecipeInputs {

    Set<BlockState> inputStates();
    Set<Holder<Item>> inputItems();

    default boolean test(BlockState state, ItemStack stack) {
        return this.inputStates().contains(state) && this.inputItems().contains(stack.getItemHolder());
    }
}

// Server resource listener so it can be reloaded when recipes are.
public class ServerRightClickBlockRecipeInputs implements ResourceManagerReloadListener, RightClickBlockRecipeInputs {

    public static final Identifier ID = Identifier.fromNamespaceAndPath("examplemod", "block_recipe_inputs");

    private final RecipeManager recipeManager;

    private Set<BlockState> inputStates;
    private Set<Holder<Item>> inputItems;

    public RightClickBlockRecipeInputs(RecipeManager recipeManager) {
        this.recipeManager = recipeManager;
    }

    // Set inputs here as #apply is fired synchronously based on listener registration order.
    // Recipes are always applied first.
    @Override
    public void onResourceManagerReload(ResourceManager manager) {
        MinecraftServer server = ServerLifecycleHooks.getCurrentServer();
        if (server == null) return; // Should never be null

        // Populate inputs
        Set<BlockState> inputStates = new HashSet<>();
        Set<Holder<Item>> inputItems = new HashSet<>();

        this.recipeManager.recipeMap().byType(RIGHT_CLICK_BLOCK_TYPE.get())
            .forEach(holder -> {
                var recipe = holder.value();
                inputStates.add(recipe.getInputState());
                inputItems.addAll(recipe.getInputItem().items());
            });
        
        this.inputStates = Set.copyOf(inputStates);
        this.inputItems = Set.copyOf(inputItems);
    }

    public void syncToClient(Stream<ServerPlayer> players) {
        ClientboundRightClickBlockRecipesPayload payload =
            new ClientboundRightClickBlockRecipesPayload(this.inputStates, this.inputItems);
        players.forEach(player -> PacketDistributor.sendToPlayer(player, payload));
    }

    @Override
    public Set<BlockState> inputStates() {
        return this.inputStates;
    }

    @Override
    public Set<Holder<Item>> inputItems() {
        return this.inputItems;
    }
}

// Client implementation to hold the inputs.
public record ClientRightClickBlockRecipeInputs(
    Set<BlockState> inputStates, Set<Holder<Item>> inputItems
) implements RightClickBlockRecipeInputs {

    public ClientRightClickBlockRecipeInputs(Set<BlockState> inputStates, Set<Holder<Item>> inputItems) {
        this.inputStates = Set.copyOf(inputStates);
        this.inputItems = Set.copyOf(inputItems);
    }
}

// Handling the recipe instance depending on side.
public class ServerRightClickBlockRecipes {

    private static ServerRightClickBlockRecipeInputs inputs;

    public static RightClickBlockRecipeInputs inputs() {
        return ServerRightClickBlockRecipes.inputs;
    }

    @SubscribeEvent // on the game event bus
    public static void addListener(AddServerReloadListenersEvent event) {
        // Register server reload listener
        ServerRightClickBlockRecipes.inputs = new ServerRightClickBlockRecipeInputs(
            event.getServerResources().getRecipeManager()
        );
        event.addListener(ServerRightClickBlockRecipeInputs.ID, ServerRightClickBlockRecipes.inputs);
        // Make sure it runs after recipes
        event.addDependency(VanillaServerListeners.RECIPES, ServerRightClickBlockRecipeInputs.ID);
    }

    @SubscribeEvent // on the game event bus
    public static void datapackSync(OnDatapackSyncEvent event) {
        // Send to client
        ServerRightClickBlockRecipes.inputs.syncToClient(event.getRelevantPlayers());
    }
}

public class ClientRightClickBlockRecipes {

    private static ClientRightClickBlockRecipeInputs inputs;

    public static RightClickBlockRecipeInputs inputs() {
        return ClientRightClickBlockRecipes.inputs;
    }

    // Handling the sent packet
    public static void handle(final ClientboundRightClickBlockRecipesPayload data, final IPayloadContext context) {
        // Do something with the data, on the main thread
        ClientRightClickBlockRecipes.inputs = new ClientRightClickBlockRecipeInputs(
            data.inputStates(), data.inputItems()
        );
    }

    @SubscribeEvent // on the game event bus only on the physical client
    public static void clientLogOut(ClientPlayerNetworkEvent.LoggingOut event) {
        // Clear the stored inputs on world log out
        ClientRightClickBlockRecipes.inputs = null;
    }
}

public class RightClickBlockRecipes {
    // Make proxy method to access properly
    public static RightClickBlockRecipeInputs inputs(Level level) {
        return level.isClientSide()
            ? ClientRightClickBlockRecipes.inputs()
            : ServerRightClickBlockRecipes.inputs();
    }
}
```

或者，你也可以[改为把完整配方同步到客户端][clientrecipes]：

```java
// Present on both server and client to do initial matching.
public interface RightClickBlockRecipeInputs {

    Set<BlockState> inputStates();
    Set<Holder<Item>> inputItems();

    default boolean test(BlockState state, ItemStack stack) {
        return this.inputStates().contains(state) && this.inputItems().contains(stack.getItemHolder());
    }
}

// Server resource listener so it can be reloaded when recipes are.
public class ServerRightClickBlockRecipeInputs implements ResourceManagerReloadListener, RightClickBlockRecipeInputs {

    public static final Identifier ID = Identifier.fromNamespaceAndPath("examplemod", "block_recipe_inputs");

    private final RecipeManager recipeManager;

    private Set<BlockState> inputStates;
    private Set<Holder<Item>> inputItems;

    public RightClickBlockRecipeInputs(RecipeManager recipeManager) {
        this.recipeManager = recipeManager;
    }

    // Set inputs here as #apply is fired synchronously based on listener registration order.
    // Recipes are always applied first.
    @Override
    public void onResourceManagerReload(ResourceManager manager) {
        MinecraftServer server = ServerLifecycleHooks.getCurrentServer();
        if (server != null) { // Should never be null
            // Populate inputs
            Set<BlockState> inputStates = new HashSet<>();
            Set<Holder<Item>> inputItems = new HashSet<>();

            this.recipeManager.recipeMap().byType(RIGHT_CLICK_BLOCK_TYPE.get())
                .forEach(holder -> {
                    var recipe = holder.value();
                    inputStates.add(recipe.getInputState());
                    inputItems.addAll(recipe.getInputItem().items());
                });
            
            this.inputStates = Set.copyOf(inputStates);
            this.inputItems = Set.copyOf(inputItems);
        }
    }

    @Override
    public Set<BlockState> inputStates() {
        return this.inputStates;
    }

    @Override
    public Set<Holder<Item>> inputItems() {
        return this.inputItems;
    }
}

// Client implementation to hold the inputs.
public record ClientRightClickBlockRecipeInputs(
    Set<BlockState> inputStates, Set<Holder<Item>> inputItems
) implements RightClickBlockRecipeInputs {

    public ClientRightClickBlockRecipeInputs(Set<BlockState> inputStates, Set<Holder<Item>> inputItems) {
        this.inputStates = Set.copyOf(inputStates);
        this.inputItems = Set.copyOf(inputItems);
    }
}

// Handling the recipe instance depending on side.
public class ServerRightClickBlockRecipes {

    private static ServerRightClickBlockRecipeInputs inputs;

    public static RightClickBlockRecipeInputs inputs() {
        return ServerRightClickBlockRecipes.inputs;
    }

    @SubscribeEvent // on the game event bus
    public static void addListener(AddServerReloadListenersEvent event) {
        // Register server reload listener
        ServerRightClickBlockRecipes.inputs = new ServerRightClickBlockRecipeInputs(
            event.getServerResources().getRecipeManager()
        );
        event.addListener(ServerRightClickBlockRecipeInputs.ID, ServerRightClickBlockRecipes.inputs);
        // Make sure it runs after recipes
        event.addDependency(VanillaServerListeners.RECIPES, ServerRightClickBlockRecipeInputs.ID);
    }

    @SubscribeEvent // on the game event bus
    public static void datapackSync(OnDatapackSyncEvent event) {
        // Specify what recipe types to sync to the client
        event.sendRecipes(RIGHT_CLICK_BLOCK_TYPE.get());
    }
}

public class ClientRightClickBlockRecipes {

    private static ClientRightClickBlockRecipeInputs inputs;

    public static RightClickBlockRecipeInputs inputs() {
        return ClientRightClickBlockRecipes.inputs;
    }

    @SubscribeEvent // on the game event bus only on the physical client
    public static void recipesReceived(RecipesReceivedEvent event) {
        // Store the recipes
        Set<BlockState> inputStates = new HashSet<>();
        Set<Holder<Item>> inputItems = new HashSet<>();

        event.getRecipeMap().byType(RIGHT_CLICK_BLOCK_TYPE.get())
            .forEach(holder -> {
                var recipe = holder.value();
                inputStates.add(recipe.getInputState());
                inputItems.addAll(recipe.getInputItem().items());
            });
        
        ClientRightClickBlockRecipes.inputs = new ClientRightClickBlockRecipeInputs(
            inputStates, inputItems
        );
    }

    @SubscribeEvent // on the game event bus only on the physical client
    public static void clientLogOut(ClientPlayerNetworkEvent.LoggingOut event) {
        // Clear the stored inputs on world log out
        ClientRightClickBlockRecipes.inputs = null;
    }
}

public class RightClickBlockRecipes {
    // Make proxy method to access properly
    public static RightClickBlockRecipeInputs inputs(Level level) {
        return level.isClientSide()
            ? ClientRightClickBlockRecipes.inputs()
            : ServerRightClickBlockRecipes.inputs();
    }
}
```

然后，利用已同步的输入，我们可以在游戏中检查所用的输入：

```java
@SubscribeEvent // on the game event bus
public static void useItemOnBlock(UseItemOnBlockEvent event) {
    // Skip if we are not in the block-dictated phase of the event. See the event's javadocs for details.
    if (event.getUsePhase() != UseItemOnBlockEvent.UsePhase.BLOCK) return;
    // Get parameters to check input first
    Level level = event.getLevel();
    BlockPos pos = event.getPos();
    BlockState blockState = level.getBlockState(pos);
    ItemStack itemStack = event.getItemStack();

    // Check if the input can result in a recipe on both sides
    if (!RightClickBlockRecipes.inputs(level).test(blockState, itemStack)) return;

    // If so, make sure on server before checking recipe
    if (!level.isClientSide() && level instanceof ServerLevel serverLevel) {
        // Create an input and query the recipe.
        RightClickBlockInput input = new RightClickBlockInput(blockState, itemStack);
        Optional<RecipeHolder<? extends Recipe<CraftingInput>>> optional = serverLevel.recipeAccess().getRecipeFor(
            // The recipe type.
            RIGHT_CLICK_BLOCK_TYPE.get(),
            input,
            level
        );
        ItemStack result = optional
            .map(RecipeHolder::value)
            .map(e -> e.assemble(input))
            .orElse(ItemStack.EMPTY);
        
        // If there is a result, break the block and drop the result in the world.
        if (!result.isEmpty()) {
            level.removeBlock(pos, false);
            ItemEntity entity = new ItemEntity(level,
                    // Center of pos.
                    pos.getX() + 0.5, pos.getY() + 0.5, pos.getZ() + 0.5,
                    result);
            level.addFreshEntity(entity);
        }
    }

    // Cancel the event to stop the interaction pipeline regardless of side.
    // Already made sure that there could be a result.
    event.cancelWithResult(InteractionResult.SUCCESS_SERVER);
}
```

## 数据生成 {#data-generation}

要为你自己的配方序列化器创建配方构建器，你需要实现 `RecipeBuilder` 及其方法。一个常见的实现，部分从原版复制而来，看起来如下所示：

```java
// This class is abstract because there is a lot of per-recipe-serializer logic.
// It serves the purpose of showing the common part of all (vanilla) recipe builders.
public abstract class SimpleRecipeBuilder implements RecipeBuilder {
    // Make the fields protected so our subclasses can use them.
    protected final ItemStackTemplate result;
    protected String group = "";
    protected boolean showNotification = true;

    // Provides a common way to build the recipe unlock advancement.
    // If used, the builder must also specify a `RecipeCategory` to determine
    // the output folder.
    protected final RecipeUnlockAdvancementBuilder advancementBuilder;
    protected final RecipeCategory category;

    // It is common for constructors to accept the result item stack template.
    // Alternatively, static builder methods are also possible.
    public SimpleRecipeBuilder(ItemStackTemplate result, RecipeCategory category) {
        this.result = result;
        this.category = category;
        this.advancementBuilder = new RecipeUnlockAdvancementBuilder();
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
        this.group = Objects.requireNonNullElse(group, "");
        return this;
    }

    // This method sets whether to show the notification toast when unlocking. If you want
    // this value to be hardcoded, remove the this.showNotification field and this method.
    public SimpleRecipeBuilder showNotification(boolean showNotification) {
        this.showNotification = showNotification;
        return this;
    }

    // Returns the id of the recipe when using `#save(RecipeOutput)`.
    @Override
    public ResourceKey<Recipe<?>> defaultId() {
        // If the result is not an `ItemStackTemplate`, you will need to manually
        // construct the `ResourceKey` using the result.
        return RecipeBuilder.getDefaultRecipeId(this.result);
    }
}
```

这样我们就有了配方构建器的基础。现在，在继续依赖具体配方序列化器的部分之前，我们应先考虑把什么作为配方工厂。在我们的例子中，直接使用构造函数是合理的。在其他情况下，使用静态辅助方法或一个小型函数式接口才是正道。如果你用一个构建器服务于多个配方类，这一点尤为重要。

以 `RightClickBlockRecipe::new` 作为配方工厂，并复用上面的 `SimpleRecipeBuilder` 类，我们可以为 `RightClickBlockRecipe` 创建以下配方构建器：

```java
public class RightClickBlockRecipeBuilder extends SimpleRecipeBuilder {
    private final BlockState inputState;
    private final Ingredient inputItem;

    // Since we have exactly one of each input, we pass them to the constructor.
    // Builders for recipe serializers that have ingredient lists of some sort would usually
    // initialize an empty list and have #addIngredient or similar methods instead.
    public RightClickBlockRecipeBuilder(ItemStackTemplate result, RecipeCategory category, BlockState inputState, Ingredient inputItem) {
        super(result, category);
        this.inputState = inputState;
        this.inputItem = inputItem;
    }

    // Saves a recipe using the given RecipeOutput and key. This method is defined in the RecipeBuilder interface.
    @Override
    public void save(RecipeOutput output, ResourceKey<Recipe<?>> key) {
        // Create the recipe.
        RightClickBlockRecipe recipe = new RightClickBlockRecipe(
            RecipeBuilder.createCraftingCommonInfo(this.showNotification),
            new RightClickBlockRecipe.BlockBookInfo(
                RecipeBuilder.determineCraftingBookCategory(this.category),
                this.group
            ),
            this.inputState,
            this.inputItem,
            this.result
        );

        // Pass the id, recipe, and the recipe advancement into the RecipeOutput.
        output.accept(key, recipe, this.advancementBuilder.build(output, key, this.category));
    }
}
```

现在，在[数据生成][recipedatagen]期间，你可以像调用任何其他构建器一样调用你的配方构建器：

```java
@Override
protected void buildRecipes(RecipeOutput output) {
    new RightClickRecipeBuilder(
            // Our constructor parameters. This example adds the ever-popular dirt -> diamond conversion.
            new ItemStackTemplate(Items.DIAMOND),
            RecipeCategory.MISC,
            Blocks.DIRT.defaultBlockState(),
            Ingredient.of(Items.APPLE)
    )
            .unlockedBy("has_apple", this.has(Items.APPLE))
            .save(output);
    // other recipe builders here
}
```

:::note
也可以把 `SimpleRecipeBuilder` 合并进 `RightClickBlockRecipeBuilder`（或你自己的配方构建器），尤其是当你只有一两个配方构建器时。这里的抽象是为了展示构建器中哪些部分依赖具体配方、哪些部分不依赖。
:::

[clientrecipes]: index.md#client-side-recipes
[codec]: ../../../datastorage/codecs.md
[datagen]: #data-generation
[event]: ../../../concepts/events.md
[gui]: ../../../rendering/screens.md
[ingredients]: ingredients.md
[networking]: ../../../networking/payload.md
[recipedatagen]: index.md#data-generation
[registry]: ../../../concepts/registries.md#methods-for-registering
[serializer]: #the-recipe-serializer
[streamcodec]: ../../../networking/streamcodecs.md

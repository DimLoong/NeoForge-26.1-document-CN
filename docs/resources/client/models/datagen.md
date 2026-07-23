# 模型数据生成 {#model-datagen}

和大多数 JSON 数据一样，方块模型、物品模型，以及它们所需的 blockstate 文件和[客户端物品][citems]，都可以通过[数据生成][datagen]来产出。这一切都由原版的 `ModelProvider` 处理，NeoForge 借助 `ExtendedModelTemplateBuilder` 提供了相应的扩展。由于方块模型和物品模型的模型 JSON 本身较为相似，二者的数据生成代码也相对接近。

## 模型模板 {#model-templates}

每个模型都以 `ModelTemplate` 为起点。在原版中，`ModelTemplate` 相当于某个预先生成的模型文件的父模型，用于定义父模型、所需的纹理槽以及要附加的文件后缀。而在 NeoForge 中，`ExtendedModelTemplate` 通过 `ExtendedModelTemplateBuilder` 构建，让用户能够从最基础的元素与面开始生成模型，并使用 NeoForge 添加的各种功能。

`ModelTemplate` 可通过 `ModelTemplates` 中的某个方法创建，或直接调用构造函数创建。构造函数接收：相对于 `models` 目录的父模型可选 `Identifier`、一个附加到文件路径末尾的可选字符串（例如按下状态的按钮会带上 `_pressed` 后缀），以及一组 `TextureSlot` 可变参数——这些槽位必须被定义，否则数据生成会崩溃。`TextureSlot` 本质上就是一个字符串，用于定义 `textures` 映射中某个纹理的“键”。每个键还可以拥有一个父 `TextureSlot`，当该槽位本身没有指定纹理时便会回退解析到父槽位。例如，`TextureSlot#PARTICLE` 会先查找已定义的 `particle` 纹理，再检查已定义的 `texture` 值，最后检查 `all`。如果该槽位及其父槽位都未定义，数据生成期间就会抛出崩溃。

```java
// Assumes there is a texture referenced as '#base'
// Can be resolved by either specifying 'base' or 'all'
public static final TextureSlot BASE = TextureSlot.create("base", TextureSlot.ALL);

// Assume there exists some model 'examplemod:block/example_template'
public static final ModelTemplate EXAMPLE_TEMPLATE = new ModelTemplate(
    // The parent model location
    Optional.of(
        ModelLocationUtils.decorateBlockModelLocation("examplemod:example_template")
    ),
    // The suffix to apply to the end of any model that uses this template
    Optional.of("_example"),
    // All texture slots that must be defined
    // Should be as specific as possible based on what's undefined in the parent model
    TextureSlot.PARTICLE,
    BASE
);
```

NeoForge 添加的 `ExtendedModelTemplate` 可通过 `ExtendedModelTemplateBuilder#builder` 构建，也可对已有的原版模板调用 `ModelTemplate#extend` 得到。随后可用 `#build` 将构建器解析为模板。构建器的各个方法可对模型 JSON 的构建提供完全的控制：

| 方法                                           | 作用                                                                                                                                                                                                                                                                                                                                                  |
|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `#parent(Identifier parent)`                                         | 设置相对于 `models` 目录的父模型位置。 |
| `#suffix(String suffix)`                                                   | 将字符串附加到模型文件路径末尾。 |
| `#requiredTextureSlot(TextureSlot slot)`                                   | 添加一个纹理槽，生成时它必须在 `TextureMapping` 中被定义。 |
| `transform(ItemDisplayContext type, Consumer<TransformVecBuilder> action)` | 添加一个由 consumer 配置的 `TransformVecBuilder`，用于设置模型上的 `display`。 |
| `#ambientOcclusion(boolean ambientOcclusion)`                              | 设置是否使用[环境光遮蔽][ao]。                                                                                                                                                                                                                                                                                                     |
| `#guiLight(UnbakedModel.GuiLight light)`                                   | 设置 GUI 光照。可为 `GuiLight.FRONT` 或 `GuiLight.SIDE`。                                                                                                                                                                                                                                                                                         |
| `#element(Consumer<ElementBuilder> action)`                                | 添加一个由 consumer 配置的新 `ElementBuilder`（等同于向模型添加一个新的[元素][elements]）。                                                                                                                                                                                                 |                                                                                                                                                                                                                                                            |
| `#customLoader(Supplier customLoaderFactory, Consumer action)`            | 使用给定的工厂让该模型采用[自定义加载器][custommodelloader]，从而得到一个由 consumer 配置的自定义加载器构建器。这会改变构建器类型，因此可能会用到不同的方法，具体取决于该加载器的实现。NeoForge 开箱即用地提供了若干自定义加载器，详见所链接的文章（含数据生成部分）。 |
| `#rootTransforms(Consumer<RootTransformsBuilder> action)`                  | 通过 consumer 配置模型的变换，这些变换在物品显示变换和方块状态变换之前应用。 |

:::tip
虽然可以通过数据生成创建精巧复杂的模型，但推荐改用诸如 [Blockbench][blockbench] 之类的建模软件来创建更复杂的模型，然后直接使用导出的模型，或将其作为其他模型的父模型。
:::

### 创建模型实例 {#creating-the-model-instance}

有了 `ModelTemplate` 之后，就可以调用某个 `ModelTemplate#create*` 方法来生成模型本身。尽管各个 create 方法接收的参数不尽相同，但其核心都会接收：代表文件名的 `Identifier`、一个把 `TextureSlot` 映射到相对于 `textures` 目录的某个 `Identifier` 的 `TextureMapping`，以及作为 `BiConsumer<Identifier, ModelInstance>` 的模型输出。随后，该方法基本上就是创建用于生成模型的 `JsonObject`，若提供了任何重复项则抛出错误。

:::note
调用基础的 `create` 方法不会应用已存储的后缀。只有接收方块或物品的 `create*` 方法才会应用后缀。
:::

```java
// Given some BiConsumer<Identifier, ModelInstance> modelOutput
// Assume there is a DeferredBlock<Block> EXAMPLE_BLOCK
EXAMPLE_TEMPLATE.create(
    // Creates the model at 'assets/minecraft/models/block/example_block_example.json'
    EXAMPLE_BLOCK.get(),
    // Define textures in slots
    new TextureMapping()
        // "particle": "examplemod:item/example_block"
        .put(TextureSlot.PARTICLE, TextureMapping.getBlockTexture(EXAMPLE_BLOCK.get()))
        // "base": "examplemod:item/example_block_base"
        .put(TextureSlot.BASE, TextureMapping.getBlockTexture(EXAMPLE_BLOCK.get(), "_base")),
    // The consumer of the generated model json
    modelOutput
);
```

有时，生成的模型会为其纹理使用相似的模型模板和命名模式（例如，普通方块的纹理就是方块的名称）。在这些情况下，可以创建一个 `TexturedModel.Provider` 来帮助消除冗余。该 provider 实际上是一个函数式接口，接收某个 `Block` 并返回一个 `TexturedModel`（即 `ModelTemplate`/`TextureMapping` 的组合）来生成模型。该接口通过 `TexturedModel#createDefault` 构建，它接收一个把 `Block` 映射到其 `TextureMapping` 的函数以及所要使用的 `ModelTemplate`。随后，只需调用 `TexturedModel.Provider#create` 并传入要生成的 `Block`，即可生成模型。

```java
public static final TexturedModel.Provider EXAMPLE_TEMPLATE_PROVIDER = TexturedModel.createDefault(
    // Block to texture mapping
    block -> new TextureMapping()
        .put(TextureSlot.PARTICLE, TextureMapping.getBlockTexture(block))
        .put(TextureSlot.BASE, TextureMapping.getBlockTexture(block, "_base")),
    // The template to generate from
    EXAMPLE_TEMPLATE
);

// Given some BiConsumer<Identifier, ModelInstance> modelOutput
// Assume there is a DeferredBlock<Block> EXAMPLE_BLOCK
EXAMPLE_TEMPLATE_PROVIDER.create(
    // Creates the model at 'assets/minecraft/models/block/example_block_example.json'
    EXAMPLE_BLOCK.get(),
    // The consumer of the generated model json
    modelOutput
);
```

## `ModelProvider` {#modelprovider}

方块模型和物品模型的数据生成都使用 `registerModels` 提供的生成器，分别名为 `BlockModelGenerators` 和 `ItemModelGenerators`。每个生成器既生成模型 JSON，也生成所需的其他附加文件（blockstate、客户端物品）。每个生成器都包含各种辅助方法，把所有文件的构建批量整合进一个易用的单一方法，例如用 `ItemModelGenerators#generateFlatItem` 搭配 `ModelTemplates#FLAT_ITEM` 创建一个基础的 `item/generated` 模型，或用 `BlockModelGenerators#createTrivialCube` 创建一个基础的 `block/cube_all` 模型。

```java
public class ExampleModelProvider extends ModelProvider {

    public ExampleModelProvider(PackOutput output) {
        // Replace "examplemod" with your own mod id.
        super(output, "examplemod");
    }

    @Override
    protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
        // Generate models and associated files here
    }
}
```

和所有数据提供器一样，别忘了把你的提供器注册到事件上：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createProvider(ExampleModelProvider::new);
}
```

### 方块模型数据生成 {#block-model-datagen}

要真正生成 blockstate 和方块模型文件，你可以在 `ModelProvider#registerModels` 中调用 `BlockModelGenerators` 里众多公开方法之一，也可以自行把生成好的文件传入：blockstate 文件传给 `blockStateOutput`、非平凡的客户端物品传给 `itemModelOutput`、模型 JSON 传给 `modelOutput`。

:::note
如果你为方块注册了关联的 `BlockItem` 且没有生成客户端物品，`ModelProvider` 会自动使用默认的方块模型位置 `assets/<namespace>/models/block/<path>.json` 作为其模型来生成一个客户端物品。
:::

```java
public class ExampleModelProvider extends ModelProvider {

    public ExampleModelProvider(PackOutput output) {
        // Replace "examplemod" with your own mod id.
        super(output, "examplemod");
    }

    @Override
    protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
        // Placeholders, their usages should be replaced with real values. See above for how to use the model builder,
        // and below for the helpers the model builder offers.
        Block block = MyBlocksClass.EXAMPLE_BLOCK.get();

        // Create a simple block model with the same texture on each side.
        // The texture must be located at assets/<namespace>/textures/block/<path>.png, where
        // <namespace> and <path> are the block's registry name's namespace and path, respectively.
        // Used by the majority of (full) blocks, such as planks, cobblestone or bricks.
        blockModels.createTrivialCube(block);

        // Overload that accepts a `TexturedModel.Provider` to use.
        blockModels.createTrivialBlock(block, EXAMPLE_TEMPLATE_PROVIDER);

        // Block items have a model generated automatically
        // But let's assume you want to generate a different item, such as a flat item
        blockModels.registerSimpleFlatItemModel(block);

        // Adds a log block model. Requires two textures at assets/<namespace>/textures/block/<path>.png and
        // assets/<namespace>/textures/block/<path>_top.png, referencing the side and top texture, respectively.
        // Note that the block input here is limited to RotatedPillarBlock, which is the class vanilla logs use.
        blockModels.woodProvider(block).log(block);
        
        // Like WoodProvider#logWithHorizontal. Used by quartz pillars and similar blocks.
        blockModels.createRotatedPillarWithHorizontalVariant(block, TexturedModel.COLUMN_ALT, TexturedModel.COLUMN_HORIZONTAL_ALT);

        // Using the `ExtendedModelTemplate` to specify the render type to use.
        blockModels.createRotatedPillarWithHorizontalVariant(block,
            TexturedModel.COLUMN_ALT.updateTemplate(template ->
                template.extend().renderType("minecraft:cutout").build()
            ),
            TexturedModel.COLUMN_HORIZONTAL_ALT.updateTemplate(template ->
                template.extend().renderType(this.mcLocation("cutout_mipped")).build()
            )
        );

        // Specifies a horizontally-rotatable block model with a side texture, a front texture, and a top texture.
        // The bottom will use the side texture as well. If you don't need the front or top texture,
        // just pass in the side texture twice. Used by e.g. furnaces and similar blocks.
        blockModels.createHorizontallyRotatedBlock(
            block,
            TexturedModel.Provider.ORIENTABLE_ONLY_TOP.updateTexture(mapping ->
                mapping.put(TextureSlot.SIDE, this.modLocation("block/example_texture_side"))
                .put(TextureSlot.FRONT, this.modLocation("block/example_texture_front"))
                .put(TextureSlot.TOP, this.modLocation("block/example_texture_top"))
            )
        );

        // Specifies a horizontally-rotatable block model that is attached to a face, e.g. for buttons.
        // Accounts for placing the block on the ground and on the ceiling, and rotates them accordingly.
        blockModels.familyWithExistingFullBlock(block).button(block);

        // Create a model to use for blockstatefiles
        Identifier modelLoc = TexturedModel.CUBE.create(block, blockModels.modelOutput);

        // Create a common variant to transform
        Variant variant = new Variant(modelLoc);

        // Basic single variant model
        blockModels.blockStateOutput.accept(
            MultiVariantGenerator.dispatch(
                block,
                new MultiVariant(
                    WeightedList.of(
                        new Weighted<>(
                            // Set model
                            variant
                                // Set rotations around the x and y axes
                                .with(VariantMutator.X_ROT.withValue(Quadrant.R90))
                                .with(VariantMutator.Y_ROT.withValue(Quadrant.R180))
                                // Set a uvlock
                                .with(VariantMutator.UV_LOCK.withValue(true)),
                            // Set a weight
                            5
                        )
                    )
                )
            )
        );

        // Add one or multiple models based on the block state properties
        blockModels.blockStateOutput.accept(
            MultiVariantGenerator.dispatch(
                block,
                // Create the basic multi-variant
                BlockModelGenerators.variant(variant)
            ).with(
                // Apply a property dispatch
                // Will mutate the variant based on the provided mutators
                PropertyDispatch.modify(BlockStateProperties.AXIS)
                    .select(Direction.Axis.Y, BlockModelGenerators.NOP)
                    .select(Direction.Axis.Z, BlockModelGenerators.X_ROT_90)
                    .select(Direction.Axis.X, BlockModelGenerators.X_ROT_90.then(BlockModelGenerators.Y_ROT_90))
            )
        );

        // Generate a multipart
        blockModels.blockStateOutput.accept(
            MultiPartGenerator.multiPart(block)
                // Provide the base model
                .with(BlockModelGenerators.variant(variant))
                // Add conditions for variant to appear
                .with(
                    // Add conditions to apply
                    new CombinedCondition(
                        CombinedCondition.Operation.OR,
                        List.of(
                            // Where at least one of the conditions are true
                            BlockModelGenerators.condition().term(BlockStateProperties.FACING, Direction.NORTH, Direction.SOUTH)
                            // Can nest as many conditions or groups as necessary
                            new CombinedCondition(
                                CombinedCondition.Operation.AND,
                                List.of(
                                    BlockModelGenerators.condition().term(BlockStateProperties.FACING, Direction.NORTH)
                                )
                            )
                        )
                    ),
                    // Supply variant to mutate
                    BlockModelGenerators.variant(variant)
                )
        );
    }
}
```

## 物品模型数据生成 {#item-model-datagen}

生成物品模型要简单得多，这主要归功于 `ItemModelGenerators` 中的各种辅助方法，以及 `ItemModelUtils` 中提供属性信息的方法。与上文类似，你可以在 `ModelProvider#registerModels` 中调用 `ItemModelGenerators` 里众多公开方法之一，也可以自行把生成好的文件传入：非平凡的客户端物品传给 `itemModelOutput`、模型 JSON 传给 `modelOutput`。

```java
public class ExampleModelProvider extends ModelProvider {

    public ExampleModelProvider(PackOutput output) {
        // Replace "examplemod" with your own mod id.
        super(output, "examplemod");
    }

    @Override
    protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
        // The most common item
        // item/generated with the layer0 texture as the item name
        itemModels.generateFlatItem(MyItemsClass.EXAMPLE_ITEM.get(), ModelTemplates.FLAT_ITEM);

        // A bow-like item
        ItemModel.Unbaked bow = ItemModelUtils.plainModel(ModelLocationUtils.getModelLocation(MyItemsClass.EXAMPLE_ITEM.get()));
        ItemModel.Unbaked pullingBow0 = ItemModelUtils.plainModel(this.createFlatItemModel(MyItemsClass.EXAMPLE_ITEM.get(), "_pulling_0", ModelTemplates.BOW));
        ItemModel.Unbaked pullingBow1 = ItemModelUtils.plainModel(this.createFlatItemModel(MyItemsClass.EXAMPLE_ITEM.get(), "_pulling_1", ModelTemplates.BOW));
        ItemModel.Unbaked pullingBow2 = ItemModelUtils.plainModel(this.createFlatItemModel(MyItemsClass.EXAMPLE_ITEM.get(), "_pulling_2", ModelTemplates.BOW));
        this.itemModelOutput.accept(
            MyItemsClass.EXAMPLE_ITEM.get(),
            // Conditional model for item
            ItemModelUtils.conditional(
                // Checks if item is being used
                ItemModelUtils.isUsingItem(),
                // When true, select model based on use duration
                ItemModelUtils.rangeSelect(
                    new UseDuration(false),
                    // Scalar to apply to the thresholds
                    0.05F,
                    pullingBow0,
                    // Threshold when 0.65
                    ItemModelUtils.override(pullingBow1, 0.65F),
                    // Threshold when 0.9
                    ItemModelUtils.override(pullingBow2, 0.9F)
                ),
                // When false, use the base bow model
                bow
            ),
            // Some settings to use during the rendering process
            new ClientItem.Properties(
                // When false, disables the animation where the item is raised
                // up towards its normal position on item swap
                false,
                // When true, allows the model to render outside its defined
                // slot bounds (defined in GuiItemRenderState#bounds) in a GUI
                // instead of being scissored
                false,
                // Applies the scalar to the height of the hand when swapping
                1.0F
            )
        );
    }
}
```

[ao]: https://en.wikipedia.org/wiki/Ambient_occlusion
[blockbench]: https://www.blockbench.net
[citems]: items.md
[custommodelloader]: modelloaders.md#datagen
[datagen]: ../../index.md#data-generation
[elements]: index.md#elements

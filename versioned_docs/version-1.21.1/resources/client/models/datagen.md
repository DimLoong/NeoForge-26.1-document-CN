# 模型 Datagen {#model-datagen}

与大多数 JSON 数据一样，块和物品模型可以 [datagenned][datagen]。由于物品模型和方块模型之间有些东西是通用的，因此一些数据生成代码也是如此。

## 模型数据生成类 {#model-datagen-classes}

### `ModelBuilder` {#modelbuilder}

每个模型都以某种形式的 `ModelBuilder` 开始 - 通常是 `BlockModelBuilder` 或 `ItemModelBuilder`，具体取决于你生成的内容。它包含模型的所有属性：其父模型、纹理、元素、变换、加载器等。每个属性都可以通过方法设置：

|方法|效果|
|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`#texture(String key, ResourceLocation texture)`|添加具有给定键和给定纹理位置的纹理变量。具有重载，其中第二个参数是 `String`。                                                                                                                                                                                                                    |
|`#renderType(ResourceLocation renderType)`|设置渲染类型。具有参数为 `String` 的重载。有关有效值的列表，请参阅 `RenderType` 类。                                                                                                                                                                                                                        |
|`#ao(boolean ao)`|设置是否使用[环境光遮挡][ao]。                                                                                                                                                                                                                                                                                                     |
|`#guiLight(GuiLight light)`|设置 GUI 灯。可能是 `GuiLight.FRONT` 或 `GuiLight.SIDE`。                                                                                                                                                                                                                                                                                         |
|`#element()`|添加新的 `ElementBuilder`（相当于向模型添加新的[元素][elements]）。返回 `ElementBuilder` 以供进一步修改。                                                                                                                                                                                                      |
|`#transforms()`|返回构建器的 `TransformVecBuilder`，用于在模型上设置 `display`。                                                                                                                                                                                                                                                                 |
|`#customLoader(BiFunction customLoaderFactory)`|使用给定的工厂，使该模型使用[自定义加载程序][custommodelloader]，从而使用自定义加载程序构建器。这会更改构建器类型，因此可能会使用不同的方法，具体取决于加载器的实现。 NeoForge 提供了一些开箱即用的自定义加载器，请参阅链接文章以获取更多信息（包括 datagen）。 |

:::tip
虽然可以通过 datagen 创建复杂的模型，但建议使用 [Blockbench][blockbench] 等建模软件来创建更复杂的模型，然后直接使用导出的模型或作为其他模型的父模型。
:::

### `ModelProvider` {#modelprovider}

块和物品模型数据生成器都使用 `ModelProvider` 的子类，分别命名为 `BlockModelProvider` 和 `ItemModelProvider`。物品模型 datagen 直接扩展 `ItemModelProvider`，而方块模型 datagen 使用 `BlockStateProvider` 基类，该基类具有可通过 `BlockStateProvider#models()` 访问的内部 `BlockModelProvider`。此外，`BlockStateProvider` 还具有自己的内部 `ItemModelProvider`，可通过 `BlockStateProvider#itemModels()` 访问。 `ModelProvider` 最重要的部分是 `getBuilder(String path)` 方法，该方法在给定位置返回 `BlockModelBuilder`（或 `ItemModelBuilder`）。

但是，`ModelProvider` 还包含各种辅助方法。最重要的辅助方法可能是 `withExistingParent(String name, ResourceLocation parent)`，它返回一个新的构建器（通过 `getBuilder(name)`）并将给定的 `ResourceLocation` 设置为模型父级。另外两个非常常见的帮助器是 `mcLoc(String name)`，它返回一个 `ResourceLocation`，其名称空间为 `minecraft`，给定名称为路径；`modLoc(String name)`，它执行相同的操作，但使用提供者的 mod id（通常是你的 mod id）而不是 `minecraft`。此外，它还提供了各种辅助方法，这些方法是 `#withExistingParent` 对于常见事物（如楼板、楼梯、栅栏、门等）的快捷方式。

### `ModelFile` {#modelfile}

最后，最后一个重要的类是 `ModelFile`。 `ModelFile` 是磁盘上模型 JSON 的代码内表示。 `ModelFile` 是一个抽象类，有两个内部子类 `ExistingModelFile` 和 `UncheckedModelFile`。使用 `ExistingFileHelper` 验证 `ExistingModelFile` 的存在，而无需进一步检查就假定 `UncheckedModelFile` 存在。此外，`ModelBuilder` 也被视为 `ModelFile`。

## 方块模型数据生成器 {#block-model-datagen}

现在，要实际生成方块状态和方块模型文件，请扩展 `BlockStateProvider` 并覆盖 `registerStatesAndModels()` 方法。请注意，方块模型将始终放置在 `models/block` 子文件夹中，但引用是相对于 `models` 的（即它们必须始终以 `block/` 为前缀）。在大多数情况下，从许多预定义的帮助器方法中选择一种是有意义的：

```java
public class MyBlockStateProvider extends BlockStateProvider {
    // Parameter values are provided by GatherDataEvent.
    public MyBlockStateProvider(PackOutput output, ExistingFileHelper existingFileHelper) {
        // Replace "examplemod" with your own mod id.
        super(output, "examplemod", existingFileHelper);
    }
    
    @Override
    protected void registerStatesAndModels() {
        // Placeholders, their usages should be replaced with real values. See above for how to use the model builder,
        // and below for the helpers the model builder offers.
        ModelFile exampleModel = models().withExistingParent("example_model", this.mcLoc("block/cobblestone"));
        Block block = MyBlocksClass.EXAMPLE_BLOCK.get();
        ResourceLocation exampleTexture = modLoc("block/example_texture");
        ResourceLocation bottomTexture = modLoc("block/example_texture_bottom");
        ResourceLocation topTexture = modLoc("block/example_texture_top");
        ResourceLocation sideTexture = modLoc("block/example_texture_front");
        ResourceLocation frontTexture = modLoc("block/example_texture_front");

        // Create a simple block model with the same texture on each side.
        // The texture must be located at assets/<namespace>/textures/block/<path>.png, where
        // <namespace> and <path> are the block's registry name's namespace and path, respectively.
        // Used by the majority of (full) blocks, such as planks, cobblestone or bricks.
        simpleBlock(block);
        // Overload that accepts a model file to use.
        simpleBlock(block, exampleModel);
        // Overload that accepts one or multiple (vararg) ConfiguredModel objects.
        // See below for more info about ConfiguredModel.
        simpleBlock(block, ConfiguredModel.builder().build());
        // Adds an item model file with the block's name, parenting the given model file, for a block item to pick up.
        simpleBlockItem(block, exampleModel);
        // Shorthand for calling #simpleBlock() (model file overload) and #simpleBlockItem.
        simpleBlockWithItem(block, exampleModel);
        
        // Adds a log block model. Requires two textures at assets/<namespace>/textures/block/<path>.png and
        // assets/<namespace>/textures/block/<path>_top.png, referencing the side and top texture, respectively.
        // Note that the block input here is limited to RotatedPillarBlock, which is the class 原版 logs use.
        logBlock(block);
        // Like #logBlock, but the textures are named <path>_side.png and <path>_end.png instead of
        // <path>.png and <path>_top.png, respectively. Used by quartz pillars and similar blocks.
        // Has an overload that allow you to specify a different texture base name, that is then suffixed
        // with _side and _end as needed, an overload that allows you to specify two resource locations
        // for the side and end textures, and an overload that allows specifying side and end model files.
        axisBlock(block);
        // Variants of #logBlock and #axisBlock that additionally allow for render types to be specified.
        // Comes in string and resource location variants for the render type,
        // in all combinations with all variants of #logBlock and #axisBlock.
        logBlockWithRenderType(block, "minecraft:cutout");
        axisBlockWithRenderType(block, mcLoc("cutout_mipped"));
        
        // Specifies a horizontally-rotatable block model with a side texture, a front texture, and a top texture.
        // The bottom will use the side texture as well. If you don't need the front or top texture,
        // just pass in the side texture twice. Used by e.g. furnaces and similar blocks.
        horizontalBlock(block, sideTexture, frontTexture, topTexture);
        // Specifies a horizontally-rotatable block model with a model file that will be rotated as needed.
        // Has an overload that instead of a model file accepts a Function<BlockState, ModelFile>,
        // allowing for different rotations to use different models. Used e.g. by the stonecutter.
        horizontalBlock(block, exampleModel);
        // Specifies a horizontally-rotatable block model that is attached to a face, e.g. for buttons or levers.
        // Accounts for placing the block on the ground and on the ceiling, and rotates them accordingly.
        // Like #horizontalBlock, has an overload that accepts a Function<BlockState, ModelFile> instead.
        horizontalFaceBlock(block, exampleModel);
        // Similar to #horizontalBlock, but for blocks that are rotatable in all directions, including up and down.
        // Again, has an overload that accepts a Function<BlockState, ModelFile> instead.
        directionalBlock(block, exampleModel);
    }
}
```

此外，`BlockStateProvider` 中还存在以下常见模方块模型的帮助程序：

- 楼梯
- 板坯
- 按钮
- 压力板
- 标志
- 栅栏
- 栅栏门
- 墙壁
- 窗格
- 门
- 活板门

在某些情况下，方块状态不需要特殊的外壳，但模型需要。对于这种情况，可通过 `BlockStateProvider#models()` 访问的 `BlockModelProvider` 提供了一些额外的帮助程序，所有这些都接受名称作为第一个参数，并且其中大多数在某种程度上与完整的多维数据集相关。它们通常用作模型文件参数，例如 `simpleBlock`。这些帮助程序包括 `BlockStateProvider` 中的支持方法，以及：

- `withExistingParent`：前面已经提到过，此方法返回具有给定父级的新模型构建器。父级必须已存在或在模型之前创建。
- `getExistingFile`：在模型提供者的 `ExistingFileHelper` 中执行查找，如果存在则返回相应的 `ModelFile`，否则抛出 `IllegalStateException`。
- `singleTexture`：接受父级和单个纹理位置，返回具有给定父级的模型，并将纹理变量 `texture` 设置为给定纹理位置。
- `sideBottomTop`：接受一个父级和三个纹理位置，返回一个模型，其中给定的父级以及设置为三个纹理位置的侧面、底部和顶部纹理。
- `cube`：接受六个面的六个纹理资源位置，返回一个完整的立方体模型，其中六个面设置为六个纹理。
- `cubeAll`：接受纹理位置，返回一个完整的立方体模型，并将给定的纹理应用于所有六个面。如果你愿意的话，可以将 `singleTexture` 和 `cube` 混合起来。
- `cubeTop`：接受两个纹理位置，返回完整的立方体模型，其中第一个纹理应用于侧面和底部，第二个纹理应用于顶部。
- `cubeBottomTop`：接受三个纹理位置，返回一个完整的立方体模型，其中侧面、底部和顶部纹理设置为三个纹理位置。如果你愿意的话，可以将 `cube` 和 `sideBottomTop` 混合起来。
- `cubeColumn` 和 `cubeColumnHorizontal`：接受两个纹理位置，返回“站立”或“放置”的柱立方体模型，并将侧面和末端纹理设置为两个纹理位置。由 `BlockStateProvider#logBlock`、 `BlockStateProvider#axisBlock` 及其变体使用。
- `orientable`：接受三个纹理位置，返回具有“前”纹理的立方体。三个纹理位置分别是侧面、正面和顶部纹理。
- `orientableVertical`：`orientable` 的变体，省略顶部参数，而是也使用侧面参数。
- `orientableWithBottom`：`orientable` 的变体，具有第四个参数，用于位于前面参数和顶部参数之间的底部纹理。
- `crop`：接受纹理位置，返回具有给定纹理的类似作物的模型，如四种原版作物所使用的那样。
- `cross`：接受纹理位置，返回具有给定纹理的交叉模型，如花朵、树苗和许多其他树叶块所使用的。
- `torch`：接受纹理位置，返回具有给定纹理的火炬模型。
- `wall_torch`：接受纹理位置，返回具有给定纹理的壁火炬模型（壁火炬是与立式火炬分开的块）。
- `carpet`：接受纹理位置，返回具有给定纹理的地毯模型。

最后，不要忘记将你的方块状态提供程序注册到该事件：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();

    // other providers here
    generator.addProvider(
        event.includeClient(),
        new MyBlockStateProvider(output, existingFileHelper)
    );
}
```

### `ConfiguredModel.Builder` {#configuredmodelbuilder}

如果默认助手无法为你执行此操作，你还可以使用 `ConfiguredModel.Builder` 直接构建模型对象，然后在 `VariantBlockStateBuilder` 中使用它们来构建 `variants` 方块状态文件，或在 `MultiPartBlockStateBuilder` 中使用它们来构建 `multipart` 方块状态文件：

```java
// Create a ConfiguredModel.Builder. Alternatively, you can use one of the ways demonstrated below
// (VariantBlockStateBuilder.PartialBlockstate#modelForState or MultiPartBlockStateBuilder#part) where applicable.
ConfiguredModel.Builder<?> builder = ConfiguredModel.builder()
// Use a model file. As mentioned previously, can either be an ExistingModelFile, an UncheckedModelFile,
// or some sort of ModelBuilder. See above for how to use ModelBuilder.
        .modelFile(models().withExistingParent("example_model", this.mcLoc("block/cobblestone")))
        // Set rotations around the x and y axes.
        .rotationX(90)
        .rotationY(180)
        // Set a uvlock.
        .uvlock(true)
        // Set a weight.
        .weight(5);
// Build the configured model. The return type is an array
// to account for multiple possible models in the same blockstate.
ConfiguredModel[] model = builder.build();

// Get a variant block state builder.
VariantBlockStateBuilder variantBuilder = getVariantBuilder(MyBlocksClass.EXAMPLE_BLOCK.get());
// Create a partial state and set properties on it.
VariantBlockStateBuilder.PartialBlockstate partialState = variantBuilder.partialState();
// Add one or multiple models for a partial blockstate. The models are a vararg parameter.
variantBuilder.addModels(partialState,
    // Specify at least one ConfiguredModel.Builder, as seen above. Create through #modelForState().
    partialState.modelForState()
        .modelFile(models().withExistingParent("example_variant_model", this.mcLoc("block/cobblestone")))
        .uvlock(true)
);
// Alternatively, forAllStates(Function<BlockState, ConfiguredModel[]>) creates a model for every state.
// The passed function will be called once for each possible state.
variantBuilder.forAllStates(state -> {
    // Return a ConfiguredModel depending on the state's properties.
    // For example, the following code will rotate the model depending on the horizontal rotation of the block.
    return ConfiguredModel.builder()
        .modelFile(models().withExistingParent("example_variant_model", this.mcLoc("block/cobblestone")))
        .rotationY((int) state.getValue(BlockStateProperties.HORIZONTAL_FACING).toYRot())
        .build();
});

// Get a multipart block state builder.
MultiPartBlockStateBuilder multipartBuilder = getMultipartBuilder(MyBlocksClass.EXAMPLE_BLOCK.get());
// Add a new part. Starts with .part() and ends with .end().
multipartBuilder.part()
    // Step one: Build the model. multipartBuilder.part() returns a ConfiguredModel.Builder,
    // meaning that all methods seen above can be used here as well.
    .modelFile(models().withExistingParent("example_multipart_model", this.mcLoc("block/cobblestone")))
    // Call .addModel(). Now that the model is built, we can proceed to step two: add the part data.
    .addModel()
    // Add a condition for the part. Requires a property
    // and at least one property value; property values are a vararg.
    .condition(BlockStateProperties.FACING, Direction.NORTH, Direction.SOUTH)
    // Set the multipart conditions to be ORed instead of the default ANDing.
    .useOr()
    // Creates a nested condition group.
    .nestedGroup()
    // Adds a condition to the nested group.
    .condition(BlockStateProperties.FACING, Direction.NORTH)
    // Sets only this condition group to be ORed instead of ANDed.
    .useOr()
    // Creates yet another nested condition group. There is no limit on how many groups can be nested.
    .nestedGroup()
    // Ends the nested condition group, returning to the owning part builder or condition group level.
    // Called twice here since we currently have two nested groups.
    .endNestedGroup()
    .endNestedGroup()
    // End the part builder and add the resulting part to the multipart builder.
    .end();
```

## 物品 模型 Datagen {#item-model-datagen}

生成物品模型要简单得多，这主要是因为我们直接在 `ItemModelProvider` 上操作，而不是使用像 `BlockStateProvider` 这样的中间类，这当然是因为物品模型没有与方块状态文件等效的东西，而是直接使用。

与上面类似，我们创建一个类并让它扩展基本提供程序，在本例中为 `ItemModelProvider`。由于我们直接位于 `ModelProvider` 的子类中，因此所有 `models()` 调用都会变成 `this`（或被省略）。

```java
public class MyItemModelProvider extends ItemModelProvider {
    public MyItemModelProvider(PackOutput output, ExistingFileHelper existingFileHelper) {
        super(output, "examplemod", existingFileHelper);
    }
    
    @Override
    protected void registerModels() {
        // Block items generally use their corresponding block models as parent.
        withExistingParent(MyItemsClass.EXAMPLE_BLOCK_ITEM.getId().toString(), modLoc("block/example_block"));
        // Items generally use a simple parent and one texture. The most common parents are item/generated and item/handheld.
        // In this example, the item texture would be located at assets/examplemod/textures/item/example_item.png.
        // If you want a more complex model, you can use getBuilder() and then work from that, like you would with block models.
        withExistingParent(MyItemsClass.EXAMPLE_ITEM.getId().toString(), mcLoc("item/generated")).texture("layer0", "item/example_item");
        // The above line is so common that there is a shortcut for it. Note that the item registry name and the
        // texture path, relative to textures/item, must match.
        basicItem(MyItemsClass.EXAMPLE_ITEM.get());
    }
}
```

与所有数据提供商一样，不要忘记将你的提供商注册到活动中：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();

    // other providers here
    generator.addProvider(
        event.includeClient(),
        new MyItemModelProvider(output, existingFileHelper)
    );
}
```

[ao]: https://en.wikipedia.org/wiki/Ambient_occlusion
[blockbench]: https://www.blockbench.net
[custommodelloader]: modelloaders.md#datagen
[datagen]: ../../index.md#data-generation
[elements]: index.md#elements

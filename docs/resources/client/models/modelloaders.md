# 自定义模型加载器 {#custom-model-loaders}

模型本质上就是一个形状。它可以是一个立方体、一组立方体、一组三角形，或任何其他几何形状（乃至几何形状的集合）。在大多数场景下，模型如何定义并不重要，因为一切最终都会被烘焙成 `QuadCollection`。因此，NeoForge 增加了注册自定义模型加载器的能力，让你能把任意模型转换成供游戏使用的烘焙格式。

## 模型加载器 {#model-loaders}

方块模型的入口仍然是模型 JSON 文件。不过，你可以在 JSON 的根节点指定一个 `loader` 字段，用你自己的加载器替换默认加载器。自定义模型加载器可以忽略默认加载器所需的全部字段。

除默认模型加载器外，NeoForge 还提供了若干内置加载器，各自服务于不同目的。

### 复合模型 {#composite-model}

复合模型可用于在父模型中指定多个不同的模型部件，而在子模型中只应用其中一部分。用一个例子来说明最为直观。考虑位于 `examplemod:example_composite_model` 的以下父模型：

```json5
{
    "loader": "neoforge:composite",
    // Specify model parts.
    "children": {
        // These can either be references to another model or a model itself.
        "part_1": {
            "parent": "examplemod:some_model_1"
        },
        "part_2": {
            "parent": "examplemod:some_model_2"
        }
    },
    "visibility": {
        // Disable part 2 by default.
        "part_2": false
    }
}
```

随后，我们可以在 `examplemod:example_composite_model` 的子模型中单独禁用或启用某些部件：

```json5
{
    "parent": "examplemod:example_composite_model",
    // Override visibility. If a part is missing, it will use the parent model's visibility value.
    "visibility": {
        "part_1": false,
        "part_2": true
    }
}
```

要为该模型进行[数据生成][modeldatagen]，请使用自定义加载器类 `CompositeModelBuilder`。

:::warning
复合模型加载器不应用于[客户端物品][citems]所使用的模型。这类模型应改用定义本身提供的[复合模型][itemcomposite]。
:::

### 空模型 {#empty-model}

空模型什么也不渲染。

```json5
{
    "loader": "neoforge:empty"
}
```

### OBJ 模型 {#obj-model}

OBJ 模型加载器允许你在游戏中使用 Wavefront `.obj` 3D 模型，从而在模型中包含任意形状（包括三角形、圆形等）。`.obj` 模型必须放置在 `models` 文件夹（或其子文件夹）中，并且必须提供（或手动设置）一个同名的 `.mtl` 文件。例如，位于 `models/block/example.obj` 的 OBJ 模型必须有一个对应的 MTL 文件 `models/block/example.mtl`。

```json5
{
    "loader": "neoforge:obj",
    // Required. Reference to the model file. Note that this is relative to the namespace root, not the model folder.
    "model": "examplemod:models/example.obj",
    // Normally, .mtl files must be put into the same location as the .obj file, with only the file ending differing.
    // This will cause the loader to automatically pick them up. However, you can also set the location
    // of the .mtl file manually if needed.
    "mtl_override": "examplemod:models/example_other_name.mtl",
    // These textures can be referenced in the .mtl file as #texture0, #particle, etc.
    // This usually requires manual editing of the .mtl file.
    "textures": {
        "texture0": "minecraft:block/cobblestone",
        "particle": "minecraft:block/stone"
    },
    // Enable or disable automatic culling of the model. Optional, defaults to true.
    "automatic_culling": false,
    // Whether to shade the model or not. Optional, defaults to true.
    "shade_quads": false,
    // Some modeling programs will assume V=0 to be bottom instead of the top. This property flips the Vs upside-down.
    // Optional, defaults to false.
    "flip_v": true,
    // Whether to enable emissivity or not. Optional, defaults to true.
    "emissive_ambient": false
}
```

要为该模型进行[数据生成][modeldatagen]，请使用自定义加载器类 `ObjModelBuilder`。

### 创建自定义模型加载器 {#creating-custom-model-loaders}

要创建自己的模型加载器，你需要四个类，外加一个事件处理器：

- 一个 `UnbakedModelLoader` 类
- 一个 `UnbakedGeometry` 类，通常是一个 `ExtendedUnbakedGeometry` 实例
- 一个 `UnbakedModel` 类，通常是一个 `AbstractUnbakedModel` 实例
- 一个用于存放烘焙后四边形的 `QuadCollection` 类，通常就是该类本身
- 一个针对 `ModelEvent.RegisterLoaders` 的[客户端][sides][事件处理器][event]，用于注册未烘焙模型加载器
- 可选：一个针对 `AddClientReloadListenersEvent` 的[客户端][sides][事件处理器][event]，供那些会缓存所加载内容相关数据的模型加载器使用

为说明这些类之间如何关联，我们来跟随一个模型的加载过程：

- 在模型加载期间，一个 `loader` 属性设置为你的加载器的模型 JSON 会被传递给你的未烘焙模型加载器。加载器随即读取该模型 JSON，并根据其属性返回一个 `UnbakedModel` 对象，以及一个包含模型未烘焙四边形的 `UnbakedGeometry`。
- 在模型烘焙期间，`UnbakedGeometry#bake` 会被调用，返回一个 `QuadCollection`。
- 在模型渲染期间，`QuadCollection` 连同[客户端物品][citems]或[方块状态定义][blockstatedefinition]所需的其他信息一起参与渲染。

:::note
如果你要为物品或方块状态所使用的模型创建自定义模型加载器，视具体用例而定，创建一个新的 `ItemModel` 或 `BlockStateModel` 可能更合适。例如，使用或生成 `QuadCollection` 的模型作为 `ItemModel` 或 `BlockStateModel` 更为合理，而解析不同数据格式（如 `.obj`）的模型则应使用新的模型加载器。
:::

让我们通过一个基本的类结构进一步说明。加载器类命名为 `MyUnbakedModelLoader`，未烘焙类命名为 `MyUnbakedModel`，未烘焙几何体命名为 `MyUnbakedGeometry`。我们还假设该模型加载器需要某种缓存：

```java
// This is the class used to load the model into its unbaked format
public class MyUnbakedModelLoader implements UnbakedModelLoader<MyUnbakedModel>, ResourceManagerReloadListener {
    // It is highly recommended to use a singleton pattern for unbaked model loaders, as all models can be loaded through one loader.
    public static final MyUnbakedModelLoader INSTANCE = new MyUnbakedModelLoader();
    // The id we will use to register this loader. Also used in the loader datagen class.
    public static final Identifier ID = Identifier.fromNamespaceAndPath("examplemod", "my_custom_loader");

    // In accordance with the singleton pattern, make the constructor private.        
    private MyUnbakedModelLoader() {}

    @Override
    public void onResourceManagerReload(ResourceManager resourceManager) {
        // Handle any cache clearing logic
    }

    @Override
    public MyUnbakedModel read(JsonObject obj, JsonDeserializationContext context) throws JsonParseException {
        // Use the given JsonObject and, if needed, the JsonDeserializationContext to get properties from the model JSON.
        // The MyUnbakedModel constructor may have constructor parameters (see below).

        // Read the data used to create the quads
        MyUnbakedGeometry geometry;

        // For the basic parameters provided by vanilla and NeoForge, you can use the StandardModelParameters
        StandardModelParameters params = StandardModelParameters.parse(obj, context);

        return new MyUnbakedModel(params, geometry);
    }
}

// Holds the unbaked quads to render
// Other information that is stored in the unbaked model should be passed to the context map
public class MyUnbakedGeometry implements ExtendedUnbakedGeometry {

    public MyUnbakedGeometry(...) {
        // Store the unbaked quads to bake
    }

    // Method responsible for model baking, returning the quad collection. Parameters in this method are:
    // - The map of texture names to their associated materials.
    // - The model baker. Can be used for getting sub-models to bake and getting sprites from the texture slots.
    // - The model state. This holds the transformations from the blockstate file, typically from rotations and the uvlock.
    // - The name of the model.
    // - A ContextMap of settings provided by NeoForge and your unbaked model. See the 'NeoForgeModelProperties' class for all available properties.
    @Override
    public QuadCollection bake(TextureSlots textureSlots, ModelBaker baker, ModelState state, ModelDebugName debugName, ContextMap additionalProperties) {
        // The builder to create the collection
        var builder = new QuadCollection.Builder();
        // Build the quads for baking
        builder.addUnculledFace(...); // or addCulledFace(Direction, BakedQuad)
        // Create the quad collection
        return builder.build();
    }
}

// The unbaked model contains all the information read from the JSON.
// It provides the basic settings and geometry.
// Using AbstractUnbakedModel sets the Vanilla and NeoForge properties methods
public class MyUnbakedModel extends AbstractUnbakedModel {

    private final MyUnbakedGeometry geometry;

    public MyUnbakedModel(StandardModelParameters params, MyUnbakedGeometry geometry) {
        super(params);
        this.geometry = geometry;
    }

    @Override
    public UnbakedGeometry geometry() {
        // The geometry to used to construct the baked quads
        return this.geometry;
    }

    @Override
    public void fillAdditionalProperties(ContextMap.Builder propertiesBuilder) {
        super.fillAdditionalProperties(propertiesBuilder);
        // Add additional properties below by calling withParameter(ContextKey<T>, T)
        // They can then be accessed in the ContextMap provided in UnbakedGeometry#bake
    }
}
```

一切就绪后，别忘了实际注册你的加载器：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerLoaders(ModelEvent.RegisterLoaders event) {
    event.register(MyUnbakedModelLoader.ID, MyUnbakedModelLoader.INSTANCE);
}

// If you are caching data in the model loader:
@SubscribeEvent // on the mod event bus only on the physical client
public static void addClientResourceListeners(AddClientReloadListenersEvent event) {
    // Register the listener with our id
    event.addListener(MyUnbakedModelLoader.ID, MyUnbakedModelLoader.INSTANCE);
    // Add a dependency for our model loader to run before models are loaded
    // Allows the cache to be cleared before the new data is populated
    event.addDependency(MyUnbakedModelLoader.ID, VanillaClientListeners.MODELS);
}
```

#### 模型加载器数据生成 {#model-loader-datagen}

当然，我们也可以对模型进行[数据生成][datagen]。为此，我们需要一个继承 `CustomLoaderBuilder` 的类：

```java
public class MyLoaderBuilder extends CustomLoaderBuilder {
    public MyLoaderBuilder() {
        super(
            // Your model loader's id.
            MyUnbakedModelLoader.ID,
            // Whether the loader allows inline vanilla elements as a fallback if the loader is absent.
            false
        );
    }
    
    // Add fields and setters for the fields here. The fields can then be used below.

    @Override
    protected CustomLoaderBuilder copyInternal() {
        // Create a new instance of your loader builder and copy the properties from this builder
        // to the new instance.
        MyLoaderBuilder builder = new MyLoaderBuilder();
        // builder.<field> = this.<field>;
        return builder;
    }
    
    // Serialize the model to JSON.
    @Override
    public JsonObject toJson(JsonObject json) {
        // Add your fields to the given JsonObject.
        // Then call super, which adds the loader property and some other things.
        return super.toJson(json);
    }
}
```

要使用这个加载器构建器，在方块（或物品）[模型数据生成][modeldatagen]期间执行以下操作：

```java
// This assumes an extension of ModelProvider and a DeferredBlock<Block> EXAMPLE_BLOCK.
// The parameter for customLoader() is a Supplier to construct the builder and a Consumer to set to associated properties.
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    blockModels.createTrivialBlock(
        // The block to generate the model for
        EXAMPLE_BLOCK.get(),
        TexturedModel.createDefault(
            // A mapping used to get the textures
            block -> new TextureMapping().put(
                TextureSlot.ALL, TextureMapping.getBlockTexture(block)
            ),
            // The model template builder used to create the JSON
            ExtendedModelTemplateBuilder.builder()
                // Say we are using a custom model loader
                .customLoader(MyLoaderBuilder::new, loader -> {
                    // Set any required fields here
                })
                // Textures required by the model
                .requiredTextureSlot(TextureSlot.ALL)
                // Call build once complete
                .build()
        )
    );
}
```

#### 可见性 {#visibility}

`CustomLoaderBuilder` 的默认实现提供了应用可见性的方法。你可以选择在自己的模型加载器中使用或忽略 `visibility` 属性。目前，只有[复合模型加载器][composite]和 [OBJ 加载器][obj]会使用该属性。

## 方块状态模型加载器 {#block-state-model-loaders}

由于方块状态模型被视为独立于模型 JSON 文件，NeoForge 也提供了自定义加载器，通过在某个 variant 或 multipart 中指定 `type` 来处理。自定义方块状态模型加载器可以忽略该加载器所需的全部字段。

### 复合方块状态模型 {#composite-block-state-model}

复合方块状态模型可用于将多个 `BlockStateModel` 一起渲染。

```json5
{
    "variants": {
        "": {
            "type": "neoforge:composite",
            // Specify model parts.
            "models": [
                // These must be inlined block state models
                {
                    "variants": {
                        // ...
                    }
                },
                {
                    "multipart": [
                        // ...
                    ]
                }
                // ...
            ]
        }
    }
}
```

要为该方块状态模型进行[数据生成][modeldatagen]，请使用自定义加载器类 `CompositeBlockStateModelBuilder`。

### 复用默认模型加载器 {#reusing-the-default-model-loader}

在某些场景下，与其彻底替换原版模型加载器，不如复用它，只在其之上构建你自己的模型逻辑。我们可以用一个巧妙的技巧来做到：在模型加载器中，我们直接移除 `loader` 属性，再把它送回模型反序列化器，骗它以为这现在是一个普通的未烘焙模型。随后，我们可以在烘焙过程之前修改模型或其几何体，在那里想怎么做都行。

```java
public class MyUnbakedModelLoader implements UnbakedModelLoader<MyUnbakedModel> {
    public static final MyUnbakedModelLoader INSTANCE = new MyUnbakedModelLoader();
    public static final Identifier ID = Identifier.fromNamespaceAndPath("examplemod", "my_custom_loader");
    
    private MyUnbakedModelLoader() {}

    @Override
    public MyUnbakedModel read(JsonObject jsonObject, JsonDeserializationContext context) throws JsonParseException {
        // Trick the deserializer into thinking this is a normal model by removing the loader field
        // Then, pass it to the deserializer.
        jsonObject.remove("loader");
        UnbakedModel model = context.deserialize(jsonObject, UnbakedModel.class);
        return new MyUnbakedModel(model, /* other parameters here */);
    }
}

// We extend the delegate class as that stores the wrapped model
public class MyUnbakedModel extends DelegateUnbakedModel {

    // Store the model for use below
    public MyUnbakedModel(UnbakedModel model, /* other parameters here */) {
       super(model);
    }
}
```

### 创建自定义方块状态模型加载器 {#creating-custom-block-state-model-loaders}

要创建自己的方块状态模型加载器，你需要五个类，外加一个事件处理器：

- 一个用于加载方块状态模型的 `CustomUnbakedBlockStateModel` 类
- 一个用于烘焙模型的 `BlockStateModel` 类，通常是一个 `DynamicBlockStateModel` 实例
- 一个用于加载模型 JSON 的 `BlockStateModelPart.Unbaked`
- 一个用于对给定面或模型应用变换的 `ModelState`
- 一个用于存放四边形、环境光遮蔽和粒子纹理的 `BlockStateModelPart`，通常是一个 `SimpleModelWrapper`
- 一个针对 `RegisterBlockStateModels` 的[客户端][sides][事件处理器][event]，用于为未烘焙方块状态模型加载器注册 codec

为说明这些类之间如何关联，我们来跟随一个方块状态模型的加载过程：

- 在定义加载期间，某个 variant、multipart 或[自定义定义][customdefinition]中，`type` 属性设置为你的加载器的方块状态模型会被解码为你的 `CustomUnbakedBlockStateModel`。
- 在模型烘焙期间，`CustomUnbakedBlockStateModel#bake` 会被调用，返回一个 `BlockStateModel`，其中包含若干 `BlockStateModelPart` 组成的列表。
- 在模型渲染期间，`BlockStateModel#collectParts` 会收集要渲染的 `BlockStateModelPart` 列表。

让我们通过一个基本的类结构进一步说明。烘焙后的模型命名为 `MyBlockStateModel`，未烘焙类是内部记录 `MyBlockStateModel.Unbaked`，模型部件命名为 `MyBlockStateModelPart`，未烘焙部件类是内部记录 `MyBlockStateModelPart.Unbaked`，`ModelState` 命名为 `MyModelState`：

```java
// The model state used to apply the necessary transformations
// If you are using an intermediate object to hold the model state, it must be transformable to a ModelState
public class MyModelState implements ModelState {

    // Used for the unbaked block model part
    public static final Codec<MyModelState> CODEC = Codec.unit(new MyModelState());

    public MyModelState() {}

    @Override
    public Transformation transformation() {
        // Returns the model rotation to apply to the baking vertices
        return Transformation.identity();
    }

    @Override
    public Matrix4fc faceTransformation(Direction direction) {
        // Returns the matrix that is applied to a given face on the model after the transformation
        // This is currently unused in Vanilla
        return NO_TRANSFORM;
    }

    @Override
    public Matrix4fc inverseFaceTransformation(Direction direction) {
        // Returns the inverse of faceTransformation that is applied to a given face on the model
        // This is passed to the FaceBakery
        return NO_TRANSFORM;
    }
}

// The model part representing a baked model
// useAmbientOcclusion and particleMaterial are implemented as part of the record
public record MyBlockStateModelPart(QuadCollection quads, boolean useAmbientOcclusion, Material.Baked particleMaterial) implements BlockStateModelPart {

    // Get the baked quads to render
    @Override
    List<BakedQuad> getQuads(@Nullable Direction direction) {
        return this.quads.getQuads(direction);
    }

    // The flags of the materials backing the quads.
    @Override
    public int materialFlags() {
        return this.quads.materialFlags();
    }

    // The unbaked model that is read from the block state json
    public record Unbaked(Identifier modelLocation, MyModelState modelState) implements BlockStateModelPart.Unbaked {

        // Used for the unbaked block state model
        public static final MapCodec<MyBlockStateModelPart.Unbaked> CODEC = RecordCodecBuilder.mapCodec(
            instance -> instance.group(
                Identifier.CODEC.fieldOf("model").forGetter(MyBlockStateModelPart.Unbaked::modelLocation),
                MyModelState.CODEC.fieldOf("state").forGetter(MyBlockStateModelPart.Unbaked::modelState)
            ).apply(instance, MyBlockStateModelPart.Unbaked::new)
        );

        @Override
        public void resolveDependencies(ResolvableModel.Resolver resolver) {
            // Mark any models used by the model part
            resolver.markDependency(this.modelLocation);
        }

        @Override
        public BlockStateModelPart bake(ModelBaker baker) {
            // Get the model to bake
            ResolvedModel resolvedModel = baker.getModel(this.modelLocation);

            // Get the necessary settings for the model part
            TextureSlots slots = resolvedModel.getTopTextureSlots();
            boolean ao = resolvedModel.getTopAmbientOcclusion();
            Material.Baked particle = resolvedModel.resolveParticleMaterial(slots, baker);
            QuadCollection quads = resolvedModel.bakeTopGeometry(slots, baker, this.modelState);
            
            // Return the baked part
            return new MyBlockStateModelPart(quads, ao, particle);
        }
    }
}

// The state model representing the baked block state
public record MyBlockStateModel(MyBlockStateModelPart model) implements DynamicBlockStateModel {

    // Sets the particle material
    // While it needs to be implemented, any actual logic should be delegated to the level-aware version
    @Override
    public Material.Baked particleMaterial() {
        return this.model.particleMaterial();
    }

    // The flags of the materials backing the quads.
    // While it needs to be implemented, any actual logic should be delegated to the level-aware version
    @Override
    public int materialFlags() {
        return this.quads.materialFlags();
    }

    // This effectively acts as a key to reuse geometry previous produced. This should generally be as deterministic as possible.
    @Override
    public Object createGeometryKey(BlockAndTintGetter level, BlockPos pos, BlockState state, RandomSource random) {
        return this;
    }

    // Method responsible for collecting the parts to be rendered. Parameters in this method are:
    // - The getter for the blocks and tints, usually the level.
    // - The position of the block to render.
    // - The state of the block.
    // - A random instance.
    // - This list of model parts to be rendered. Add your model parts here.
    @Override
    public void collectParts(BlockAndTintGetter level, BlockPos pos, BlockState state, RandomSource random, List<BlockStateModelPart> parts) {
        // If you want the block rendered to be dependent on the block entity (e.g., your block entity implements `BlockEntity#getModelData`)
        // You can call `BlockAndTintGetter#getModelData` with the block position
        // You can read the property using `get` with the `ModelProperty` key
        // Remember that your block entity should call `BlockEntity#requestModelDataUpdate` to sync the model data to the client
        ModelData data = level.getModelData(pos);

        // Add the model to be rendered
        parts.add(this.model);
    }

    @Override
    public Material.Baked particleMaterial(BlockAndTintGetter level, BlockPos pos, BlockState state) {
        // Override this if you want to use the level to determine what particle to render
        return self().particleMaterial();
    }

    @Override
    public int materialFlags(BlockAndTintGetter level, BlockPos pos, BlockState state) {
        // Override this if you want to use the level to determine what material flags the model has
        return self().materialFlags();
    }

    // The unbaked model that is read from the block state json
    public record Unbaked(MyBlockStateModelPart.Unbaked model) implements CustomUnbakedBlockStateModel {

        // The codec to register
        public static final MapCodec<MyBlockStateModel.Unbaked> CODEC = MyBlockStateModelPart.Unbaked.CODEC.xmap(
            MyBlockStateModel.Unbaked::new, MyBlockStateModel.Unbaked::model
        );
        public static final Identifier ID = Identifier.fromNamespaceAndPath("examplemod", "my_custom_model_loader");

        @Override
        public void resolveDependencies(ResolvableModel.Resolver resolver) {
            // Mark any models used by the state model
            this.model.resolveDependencies(resolver);
        }

        @Override
        public BlockStateModel bake(ModelBaker baker) {
            // Bake the model parts and pass into the block state model
            return new MyBlockStateModel(this.model.bake(baker));
        }
    }
}
```


一切就绪后，别忘了实际注册你的加载器：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerDefinitions(RegisterBlockStateModels event) {
    event.registerModel(MyBlockStateModel.Unbaked.ID, MyBlockStateModel.Unbaked.CODEC);
}
```

#### 状态模型加载器数据生成 {#state-model-loader-datagen}

当然，我们也可以对模型进行[数据生成][datagen]。为此，我们需要一个继承 `CustomBlockStateModelBuilder` 的类：

```java
// The builder used to construct the block state JSON
public class MyBlockStateModelBuilder extends CustomBlockStateModelBuilder {

    private MyBlockStateModelPart.Unbaked model;

    public MyBlockStateModelBuilder() {}
    
    // Add fields and setters for the fields here. The fields can then be used below.

    @Override
    public MyBlockStateModelBuilder with(VariantMutator variantMutator) {
        // If you want to apply any mutators that assumes your unbaked model part is a `Variant`
        // If not, this should do nothing
        return this;
    }

    // This is for generalized unbaked blockstate models
    @Override
    public MyBlockStateModelBuilder with(UnbakedMutator unbakedMutator) {
        var result = new MyBlockStateModelBuilder();

        if (this.model != null) {
            result.model = unbakedMutator.apply(this.model);
        }

        return result;
    }

    // Converts the builder to its unbaked variant to encode
    @Override
    public CustomUnbakedBlockStateModel toUnbaked() {
        return new MyBlockStateModel.Unbaked(this.model);
    }
}
```

要使用这个状态定义加载器构建器，在方块（或物品）[模型数据生成][modeldatagen]期间执行以下操作：

```java
// This assumes an extension of ModelProvider and a DeferredBlock<Block> EXAMPLE_BLOCK.
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    blockModels.blockStateOutput.accept(
        MultiVariantGenerator.dispatch(
            // The block to generate the model for
            EXAMPLE_BLOCK.get(),
            // Our custom block state builder
            MultiVariant.of(new CustomBlockStateModelBuilder().with(...))
        )
    );
}
```

这将生成如下所示的模型：

```json5
{
  "variants": {
    "": {
        "type": "examplemod:my_custom_model_loader"
        // Other fields
    }
  }
}
```

## 方块状态定义加载器 {#block-state-definition-loaders}

单个方块状态模型处理的是单一方块状态的加载，而方块状态定义加载器处理的是整个方块状态文件的加载，通过指定 `neoforge:definition_type` 来处理。自定义方块状态定义加载器可以忽略该加载器所需的全部字段。

### 创建自定义方块状态定义加载器 {#creating-custom-block-state-definition-loaders}

要创建自己的方块状态定义加载器，你需要两个类，外加一个事件处理器：

- 一个用于加载方块状态定义的 `CustomBlockModelDefinition` 类
- 一个用于将方块状态烘焙为其 `BlockStateModel` 的 `BlockStateModel.UnbakedRoot` 类
- 一个针对 `RegisterBlockStateModels` 的[客户端][sides][事件处理器][event]，用于为未烘焙方块状态模型加载器注册 codec

为说明这些类之间如何关联，我们来跟随一个方块状态模型的加载过程：

- 在定义加载期间，一个 `neoforge:definition_type` 属性设置为你的加载器的方块状态定义会被解码为一个 `CustomBlockModelDefinition`。
- 然后，`CustomBlockModelDefinition#instantiate` 会被调用，将所有可能的方块状态映射到它们各自的 `BlockStateModel.UnbakedRoot`。对于简单情形，这是通过 `BlockStateModel.Unbaked#asRoot` 构造的。复杂的实例则会创建它们自己的 `BlockStateModel.UnbakedRoot`。
- 在模型烘焙期间，`BlockStateModel.UnbakedRoot#bake` 会被调用，为某个 `BlockState` 返回一个 `BlockStateModel`。

让我们通过一个基本的类结构进一步说明。方块模型定义命名为 `MyBlockModelDefinition`，我们将复用 `BlockStateModel.Unbaked#asRoot` 来构造 `BlockStateModel.UnbakedRoot`：

```java
public record MyBlockModelDefinition(MyBlockStateModel.Unbaked model) implements CustomBlockModelDefinition {

    // The codec to register
    public static final MapCodec<MyBlockModelDefinition> CODEC = MyBlockStateModel.Unbaked.CODEC.xmap(
        MyBlockModelDefinition::new, MyBlockModelDefinition::model
    );
    public static final Identifier ID = Identifier.fromNamespaceAndPath("examplemod", "my_custom_definition_loader");

    // This method maps all possible states to some unbaked root
    // As the root will generally share block states models, they are typically operated using a `ModelBaker.SharedOperationKey` to cache the loading model
    @Override
    public Map<BlockState, BlockStateModel.UnbakedRoot> instantiate(StateDefinition<Block, BlockState> states, Supplier<String> sourceSupplier) {
        Map<BlockState, BlockStateModel.UnbakedRoot> result = new HashMap<>();

        // Handle for all possible states
        var unbakedRoot = this.model.asRoot();
        states.getPossibleStates().forEach(state -> result.put(state, unbakedRoot));

        return result;
    }

    @Override
    public MapCodec<? extends CustomBlockModelDefinition> codec() {
        return CODEC;
    }
}
```

一切就绪后，别忘了实际注册你的加载器：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerDefinitions(RegisterBlockStateModels event) {
    event.registerDefinition(MyBlockModelDefinition.ID, MyBlockModelDefinition.CODEC);
}
```

#### 状态定义加载器数据生成 {#state-definition-loader-datagen}

当然，我们也可以对定义进行[数据生成][datagen]。为此，我们需要一个继承 `BlockModelDefinitionGenerator` 的类：

```java
public class MyBlockModelDefinitionGenerator implements BlockModelDefinitionGenerator {

    private final Block block;
    private final MyBlockStateModelBuilder builder;

    private MyBlockModelDefinitionGenerator(Block block, MyBlockStateModelBuilder builder) {
        this.block = block;
        this.builder = builder;
    }

    public static MyBlockModelDefinitionGenerator dispatch(Block block, MyBlockStateModelBuilder builder) {
        return new MyBlockModelDefinitionGenerator(block, builder);
    }

    @Override
    public Block block() {
        // Returns the block you are generating the definition file for
        return this.block;
    }

    @Override
    public BlockModelDefinition create() {
        // Creates the block model definition used to encode and decode the file
        return new MyBlockModelDefinition(this.builder.toUnbaked());
    }
} 
```

要使用这个状态定义加载器构建器，在方块（或物品）[模型数据生成][modeldatagen]期间执行以下操作：

```java
// This assumes a DeferredBlock<Block> EXAMPLE_BLOCK.
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    blockModels.blockStateOutput.accept(
        MyBlockModelDefinitionGenerator.dispatch(
            // The block to generate the model for
            EXAMPLE_BLOCK.get(),
            new CustomBlockStateModelBuilder(...)
        )
    );
}
```

这将生成如下所示的模型：

```json5
{
    "neoforge:definition_type": "examplemod:my_custom_definition_loader"
    // Other fields
}
```

[citems]: items.md
[composite]: #composite-model
[customdefinition]: #block-state-definition-loaders
[datagen]: ../../index.md#data-generation
[event]: ../../../concepts/events.md#registering-an-event-handler
[itemcomposite]: items.md#composite-models
[modeldatagen]: datagen.md
[obj]: #obj-model
[sides]: ../../../concepts/sides.md

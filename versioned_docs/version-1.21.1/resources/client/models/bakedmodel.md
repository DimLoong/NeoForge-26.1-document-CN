# 烘焙模型 {#baked-models}

`BakedModel`s 是带有纹理的形状的代码内表示。它们可以来自多个源，例如来自对 `UnbakedModel#bake`（默认模型加载器）或 `IUnbakedGeometry#bake`（[自定义模型加载器][modelloader]）的调用。一些[块实体渲染器][ber]也使用烘焙模型。模型的复杂程度没有限制。

模型存储在 `ModelManager` 中，可以通过 `Minecraft.getInstance().modelManager` 访问。然后，你可以调用 `ModelManager#getModel` 通过其[`ResourceLocation`][rl]或[`ModelResourceLocation`][mrl]来获取某个模型。 Mod 基本上总是会重用之前自动加载和烘焙的模型。

## `BakedModel` 的方法 {#methods-of-bakedmodel}

### `getQuads` {#getquads}

烘焙模型最重要的方法是 `getQuads`。此方法负责返回 `BakedQuad` 列表，然后可以将其发送到 GPU。在建模程序（以及大多数其他游戏）中，四边形相当于三角形，但是由于 Minecraft 一般关注正方形，因此开发人员选择使用四边形（4 个顶点）而不是三角形（3 个顶点）在 Minecraft 中进行渲染。 `getQuads` 有五个可用参数：

- A`BlockState`：正在渲染的[blockstate]。可能为 null，表示正在渲染某个物品。
- A`Direction`：被剔除的面的方向。可能为空，这意味着应该返回不能被遮挡的四边形。
- A`RandomSource`：可用于随机化的客户端绑定随机源。
- A`ModelData`：要使用的额外模型数据。这可能包含渲染所需的来自块实体的附加数据。由 `BakedModel#getModelData` 提供。
- A`RenderType`：用于渲染块的[渲染类型][rendertype]。可能为 null，表示应返回该模型使用的所有渲染类型的四边形。否则，它是 `BakedModel#getRenderTypes` 返回的渲染类型之一（见下文）。

模型应该大量缓存。这是因为，即使块仅在其中的块发生更改时才重建，但在此方法中完成的计算仍然需要尽可能快，并且理想情况下应该大量缓存，因为每个块部分调用此方法的次数（给定模型使用的每个 RenderType 最多 7 次 * 相应模型使用的 RenderType 数量 * 每个块部分 4096 个块）。此外，[BERs][ber] 或实体渲染器实际上可能每帧多次调用此方法。

### `applyTransform` 和 `getTransforms` {#applytransform-and-gettransforms}

`applyTransform` 允许在对模型应用透视变换时应用自定义逻辑，包括返回完全独立的模型。 NeoForge 添加此方法作为普通 `getTransforms()` 方法的替代，该方法只允许你自定义变换本身，但不能自定义它们的应用方式。但是，`applyTransform` 的默认实现遵循 `getTransforms`，因此如果你只需要自定义转换，你也可以覆盖 `getTransforms` 并完成它。 `applyTransforms` 提供三个参数：

- `ItemDisplayContext`：模型正在转换到的[视角]。
- A`PoseStack`：用于渲染的姿势堆栈。
- A`boolean`：是否使用修改值进行左手渲染而不是默认的右手渲染；`true` 如果渲染的手是左手（副手，如果在选项中启用了左手模式，则为主手）

:::note
`applyTransform` 和 `getTransforms` 仅适用于商品模型。
:::

### 其他 {#others}

你可以覆盖和/或查询 `BakedModel` 中的其他方法包括：

|签名|效果|
|-------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`TriState useAmbientOcclusion()`|是否使用[环境光遮挡][ao]。接受 `BlockState`、 `RenderType` 和 `ModelData` 参数并返回 `TriState`，它不仅允许强制禁用 AO，还允许强制启用 AO。有两个重载，每个重载都返回 `boolean` 参数，并且仅接受 `BlockState` 或根本不接受参数；这两个变体均已被弃用并删除，取而代之的是第一个变体。 |
|`boolean isGui3d()`|该模型在 GUI 插槽中呈现为 3d 还是平面。                                                                                                                                                                                                                                                                                                                                                      |
|`boolean usesBlockLight()`|为模型照明时是否使用 3D 照明 (`true`) 还是正面平面照明 (`false`)。                                                                                                                                                                                                                                                                                                      |
|`boolean isCustomRenderer()`|如果为 true，则跳过正常渲染并调用关联的 [`BlockEntityWithoutLevelRenderer`][bewlr] 的 `renderByItem` 方法。如果为 false，则通过默认渲染器进行渲染。                                                                                                                                                                                                                         |
|`ItemOverrides getOverrides()`|返回与此模型关联的 [`ItemOverrides`][itemoverrides]。这仅与物品模型相关。                                                                                                                                                                                                                                                                                              |
|`ModelData getModelData(BlockAndTintGetter, BlockPos, BlockState, ModelData)`|返回用于模型的模型数据。此方法传递一个现有的 `ModelData`，如果该块具有关联的块实体，则该值是 `BlockEntity#getModelData()` 的结果；如果不是这种情况，则该值是 `ModelData.EMPTY` 的结果。此方法可用于需要模型数据但没有块实体的块，例如具有连接纹理的块。                    |
|`TextureAtlasSprite getParticleIcon(ModelData)`|返回用于模型的粒子精灵。可以使用模型数据来针对不同的模型数据值使用不同的粒子精灵。添加了 NeoForge，替换了没有参数的普通 `getParticleIcon()` 重载。                                                                                                                                                                          |
|`ChunkRenderTypeSet getRenderTypes(BlockState, RandomSource, ModelData)`|返回包含用于渲染方块模型的渲染类型的 `ChunkRenderTypeSet`。 `ChunkRenderTypeSet` 是设置支持的有序 `Iterable<RenderType>`。默认情况下回退到[从模型 JSON 获取渲染类型][rendertype]。仅用于方块模型，物品模型使用下面的重载。                                                                               |
|`List<RenderType> getRenderTypes(ItemStack, boolean)`|返回包含用于渲染物品模型的渲染类型的 `List<RenderType>`。默认情况下，会退回到正常的模型绑定渲染类型查找，该查找始终会生成一个包含一个元素的列表。仅用于物品模型，方块模型使用上面的重载。                                                                                                                            |

## 观点 {#perspectives}

Minecraft 的渲染引擎总共可识别 8 种透视类型（如果包含代码内后备，则为 9 种）进行物品渲染。它们在模型 JSON 的 `display` 块中使用，并通过 `ItemDisplayContext` 枚举在代码中表示。

|枚举值| JSON 密钥 |用途 |
|---------------------------|---------------------------|------------------------------------------------------------------------------------------------------------------|
|`THIRD_PERSON_RIGHT_HAND`|`"thirdperson_righthand"`|第三人称右手（F5 视图，或其他玩家）|
|`THIRD_PERSON_LEFT_HAND`|`"thirdperson_lefthand"`|第三人称左手（F5 视图，或其他玩家）|
|`FIRST_PERSON_RIGHT_HAND`|`"firstperson_righthand"`|第一人称右手 |
|`FIRST_PERSON_LEFT_HAND`|`"firstperson_lefthand"`|第一人称左手|
|`HEAD`|`"head"`|当处于玩家头部装甲槽中时（通常只能通过命令实现）|
|`GUI`|`"gui"`|库存、玩家热栏|
|`GROUND`|`"ground"`|掉落的物品；请注意，放置物品的旋转是由放置物品渲染器处理的，而不是模型 |
|`FIXED`|`"fixed"`|物品框架|
|`NONE`|`"none"`|代码中的后备用途，不应在 JSON 中使用 |

## `ItemOverrides` {#itemoverrides}

`ItemOverrides` 是一个类，它为烘焙模型提供了一种处理 [`ItemStack`][itemstack] 状态的方法，并通过 `#resolve` 方法返回新的烘焙模型。 `#resolve` 有五个参数：

- A`BakedModel`：原始模型。
- `ItemStack`：正在渲染的物品堆栈。
- A`ClientLevel`：模型正在渲染的关卡。这应该仅用于查询关卡，而不应以任何方式改变它。可能为空。
- A`LivingEntity`：渲染模型的实体。可能为空，例如从[块实体渲染器][ber]渲染时。
- `int`：用于随机化的种子。

`ItemOverrides` 还将模型的覆盖选项保留为 `BakedOverride`。 `BakedOverride` 的对象是模型的 [`overrides`][overrides] 块的代码内表示。烘焙模型可以使用它根据其内容返回不同的模型。通过 `ItemOverrides#getOverrides()` 可以检索 `ItemOverrides` 实例的所有 `BakedOverride` 的列表。

## `BakedModelWrapper` {#bakedmodelwrapper}

`BakedModelWrapper` 可用于修改现有的 `BakedModel`。 `BakedModelWrapper` 是 `BakedModel` 的子类，它在构造函数中接受另一个 `BakedModel`（“原始”模型），并默认将所有方法重定向到原始模型。然后，你的实现可以仅重写选择的方法，如下所示：

```java
// The generic parameter may optionally be a more specific subclass of BakedModel.
// If it is, the constructor parameter must match that type.
public class MyBakedModelWrapper extends BakedModelWrapper<BakedModel> {
    // Pass the original model to super.
    public MyBakedModelWrapper(BakedModel originalModel) {
        super(originalModel);
    }
    
    // Override whatever methods you want here. You may also access originalModel if needed.
}
```

编写模型包装器类后，你必须将包装器应用到它应该影响的模型。在 `ModelEvent.ModifyBakingResult` 的 [客户端][sides] [事件处理器][event] 中执行此操作：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void modifyBakingResult(ModelEvent.ModifyBakingResult event) {
    // For block models
    event.getModels().computeIfPresent(
        // The model resource location of the model to modify. Get it from
        // BlockModelShaper#stateToModelLocation with the blockstate to be affected as a parameter.
        BlockModelShaper.stateToModelLocation(MyBlocksClass.EXAMPLE_BLOCK.defaultBlockState()),
        // A BiFunction with the location and the original models as parameters, returning the new model.
        (location, model) -> new MyBakedModelWrapper(model);
    );
    // For item models
    event.getModels().computeIfPresent(
        // The model resource location of the model to modify.
        new ModelResourceLocation(
            ResourceLocation.fromNamespaceAndPath("examplemod", "example_item"),
            "inventory"
        ),
        // A BiFunction with the location and the original models as parameters, returning the new model.
        (location, model) -> new MyBakedModelWrapper(model);
    );
}
```

:::warning
如果可能的话，通常鼓励使用[自定义模型加载器][modelloader] 来将烘焙模型包裹在 `ModelEvent.ModifyBakingResult` 中。如果需要，自定义模型加载器也可以使用 `BakedModelWrapper`。
:::

[ao]: https://en.wikipedia.org/wiki/Ambient_occlusion
[ber]: ../../../blockentities/ber.md
[bewlr]: ../../../blockentities/ber.md#blockentitywithoutlevelrenderer
[blockstate]: ../../../blocks/states.md
[event]: ../../../concepts/events.md
[itemoverrides]: #itemoverrides
[itemstack]: ../../../items/index.md#itemstacks
[modelloader]: modelloaders.md
[mrl]: ../../../misc/resourcelocation.md#modelresourcelocations
[overrides]: index.md#overrides
[perspective]: #perspectives
[rendertype]: index.md#render-types
[rl]: ../../../misc/resourcelocation.md
[sides]: ../../../concepts/sides.md

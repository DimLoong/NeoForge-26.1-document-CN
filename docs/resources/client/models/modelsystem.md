
# 理解模型系统 {#understanding-the-model-system}

Minecraft 中的模型本质上就是一组带有贴图纹理的四边形。建模过程的每个环节都有各自独立的实现，底层的模型 JSON 会被反序列化成一个 `UnbakedModel`。到最后，各条管线的每个环节都会接收某种 `List<BakedQuad>` 以及各自管线所需的属性。一些[方块实体渲染器][ber]也会使用这些模型。模型的复杂程度没有上限。

模型存储在 `ModelManager` 中，可通过 `Minecraft.getInstance().getModelManager()` 访问。对于物品管线，你可以传入一个 [`Identifier`][rl]，通过 `ModelManager#getItemModel` 获取关联的 [`ItemModel`][itemmodels]。对于方块状态管线，你可以传入一个 `BlockState`，通过 `ModelManager.getBlockStateModelSet().get()` 获取关联的 `BlockStateModel`。Mod 基本上总是复用先前自动加载并烘焙好的模型。

## 通用模型与几何体 {#common-models-and-geometry}

基础的模型 JSON（位于 `assets/<namespace>/models`）会被反序列化成一个 `UnbakedModel`。`UnbakedModel` 通常距离其烘焙输出只差一步，包含了各类通用属性的某种一般形态。它包含的最重要的东西是通过 `UnbakedModel#geometry` 得到的 `UnbakedGeometry`，它表示即将变成 `BakedQuad` 的数据。这些四边形会（最终）通过调用 `UnbakedGeometry#bake` 内联到物品和方块状态模型中。这通常会构造出一个 `QuadCollection`，其中包含那份 `BakedQuad` 列表，这些四边形可以在任意时刻渲染，也可以只在某个给定方向未被剔除时才渲染。四边形对应于建模程序（以及大多数其他游戏）中的三角形，不过由于 Minecraft 总体上以方形为主，开发者选择在 Minecraft 中使用四边形（4 个顶点）而非三角形（3 个顶点）进行渲染。

`UnbakedModel` 所包含的信息，或供[方块状态定义][bsd]使用，或供[物品模型][itemmodelsection]使用，或两者共用。例如，`useAmbientOcclusion` 仅由方块状态定义使用，`guiLight` 和 `transforms` 仅由物品模型使用，而 `textureSlots` 和 `parent` 则由两者共用。

在烘焙过程中，每个 `UnbakedModel` 都会被包装成一个 `ResolvedModel`，由 `ModelBaker` 为物品或方块状态取得。顾名思义，`ResolvedModel` 就是一个已解析所有遗留引用的 `UnbakedModel`。随后可从 `getTop*` 方法获取关联数据，这些方法会根据当前模型及其父模型计算出属性和几何体。将 `ResolvedModel` 烘焙为其 `QuadCollection` 通常就在这里通过调用 `ResolvedModel#bakeTopGeometry` 完成。

## 方块状态定义 {#block-state-definitions}

方块状态定义 JSON（位于 `assets/<namespace>/blockstates`）会为每个 `BlockState` 编译并烘焙成一个 `BlockStateModel`。创建 `BlockStateModel` 的过程如下：

- 在加载过程中：
    - 方块状态定义 JSON 被加载成一个 `BlockStateModel.UnbakedRoot`。这个根是一套通用的共享缓存系统，用于将某个 `BlockState` 关联到某组 `BlockStateModel`。
    - `BlockStateModel.UnbakedRoot` 加载各个 `BlockStateModel.Unbaked`，并准备将它们关联到相应的 `BlockState`。
    - `BlockStateModel.Unbaked` 加载它的 `BlockStateModelPart.Unbaked`，后者用于获取通用的 `UnbakedModel`（更确切地说是 `ResolvedModel`）。
- 在烘焙过程中：
    - `BlockStateModel.UnbakedRoot#bake` 会为每个 `BlockState` 调用。
    - `BlockStateModel.Unbaked#bake` 会为给定的 `BlockState` 调用，创建出一个 `BlockStateModel`。
    - `BlockStateModelPart.Unbaked#bake` 会为 `BlockStateModel` 内的各个模型部件调用，将 `ResolvedModel` 内联为一个 `QuadCollection`，同时默认还会获取环境光遮蔽设置、粒子图标和渲染类型。

`BlockStateModel` 中最重要的方法是 `collectParts`，它负责向要渲染的 `BlockStateModelPart` 列表追加内容。记住，每个 `BlockStateModelPart` 都通过 `BlockStateModelPart#getQuads` 持有各自的 `BakedQuad` 列表，随后这些四边形会被上传到顶点消费者并渲染。`collectParts` 有五个参数：

- 一个 `BlockAndTintGetter`：`BlockState` 所渲染于其中的世界的一种表示。
- 一个 `BlockPos`：方块渲染所在的位置。
- 一个 `BlockState`：正在渲染的[方块状态][blockstate]。可能为 null，表示正在渲染的是一个物品。
- 一个 `RandomSource`：一个客户端绑定的随机源，可用于随机化。
- 一个 `List<BlockStateModelPart>`：应接收要渲染部件的列表。

### 模型数据 {#model-data}

有时，`BlockStateModel` 可能依赖 `BlockEntity` 来决定在 `collectParts` 中选择哪些 `BlockStateModelPart`。NeoForge 提供了 `ModelData` 系统来从 `BlockEntity` 同步并传递数据。为此，`BlockEntity` 必须实现 `getModelData` 并返回它想要同步的数据。随后可通过调用 `BlockEntity#requestModelDataUpdate` 将数据发送到客户端。然后，在 `collectParts` 内，可在 `BlockAndTintGetter` 上以 `BlockPos` 调用 `getModelData` 来获取数据。

## 物品模型 {#item-models}

[客户端物品][clientitem] JSON（位于 `assets/<namespace>/items`）会为给定的 `Item` 编译并烘焙成一个 `ItemModel`，供 `ItemStack` 使用。创建 `ItemModel` 的过程如下：

- 在加载过程中：
    - 客户端物品 JSON 被加载成一个 `ClientItem`。它持有物品模型以及关于其应如何渲染的一些通用属性。
    - `ClientItem` 加载其中的 `ItemModel.Unbaked`。
- 在烘焙过程中：
    - `ItemModel.Unbaked#bake` 会为每个 `Item` 调用，将 `ResolvedModel` 内联为一个 `List<BakedQuad>`，同时还会带上一些通用的 `ModelRenderProperties`，若该 `Item` 是 `BlockItem` 则还带上渲染类型。

关于物品渲染的信息可在[手动渲染物品][itemmodels]一节中找到。

### 视角 {#perspectives}

Minecraft 的渲染引擎为物品渲染共识别 8 种视角类型（若算上代码中的兜底项则为 9 种）。它们在模型 JSON 的 `display` 块中使用，并在代码中通过 `ItemDisplayContext` 枚举来表示。它们通常从 `UnbakedModel` 传递到 `ItemModel` 中的 `ModelRenderProperties`，再通过 `ModelRenderProperties#applyToLayer` 应用到 `ItemStackRenderState`。

| 枚举值                     | JSON 键                    | 用途                                                                                                            |
|---------------------------|---------------------------|------------------------------------------------------------------------------------------------------------------|
| `THIRD_PERSON_RIGHT_HAND` | `"thirdperson_righthand"` | 第三人称下的右手（F5 视角，或其他玩家身上）                                                                        |
| `THIRD_PERSON_LEFT_HAND`  | `"thirdperson_lefthand"`  | 第三人称下的左手（F5 视角，或其他玩家身上）                                                                        |
| `FIRST_PERSON_RIGHT_HAND` | `"firstperson_righthand"` | 第一人称下的右手                                                                                                  |
| `FIRST_PERSON_LEFT_HAND`  | `"firstperson_lefthand"`  | 第一人称下的左手                                                                                                  |
| `HEAD`                    | `"head"`                  | 位于玩家头部盔甲槽时（通常只能通过命令实现）                                                                        |
| `GUI`                     | `"gui"`                   | 物品栏、玩家快捷栏                                                                                                |
| `GROUND`                  | `"ground"`                | 掉落物；注意掉落物的旋转由掉落物渲染器处理，而非模型                                                                |
| `FIXED`                   | `"fixed"`                 | 物品展示框                                                                                                        |
| `ON_SHELF`                | `"on_shelf"`              | 位于置物架方块上                                                                                                  |
| `NONE`                    | `"none"`                  | 用于代码中的兜底目的，不应在 JSON 中使用                                                                            |

NeoForge 允许对 `ItemDisplayContext` 进行[扩展][extended]，以用于自定义渲染调用。带 Mod 的 `ItemDisplayContext` 可以指定一个兜底变换，在模型中未指定时使用。否则，其行为与原版相同。

## 修改烘焙结果 {#modifying-a-baking-result}

在代码中修改已有的方块状态模型或物品堆叠模型，通常可以通过将模型包装进某种委托来完成。方块状态模型有 `DelegateBlockStateModel`，而物品堆叠模型则没有现成的实现。你的实现随后可以只重写选定的方法，如下所示：

```java
// For block states
public class MyDelegateBlockStateModel extends DelegateBlockStateModel {
    // Pass the original model to super.
    public MyDelegateBlockStateModel(BlockStateModel originalModel) {
        super(originalModel);
    }
    
    // Override whatever methods you want here. You may also access originalModel if needed.
}

// For item models
public class MyDelegateItemModel implements ItemModel {

    private final ItemModel originalModel;

    public MyDelegateItemModel(ItemModel originalModel) {
        this.originalModel = originalModel;
    }

    // Override whatever methods you want here. You may also access originalModel if needed.
    @Override
    public void update(ItemStackRenderState renderState, ItemStack stack, ItemModelResolver resolver, ItemDisplayContext displayContext, @Nullable ClientLevel level, @Nullable ItemOwner owner, int seed
    ) {
        this.originalModel.update(renderState, stack, resolver, displayContext, level, owner, seed);
    }
}
```

编写好模型包装类后，你必须把这些包装应用到它应影响的模型上。在[**Mod 事件总线**][modbus]上针对 `ModelEvent.ModifyBakingResult` 的[客户端][sides][事件处理器][event]中执行此操作：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void modifyBakingResult(ModelEvent.ModifyBakingResult event) {
    // For block state models
    event.getBakingResult().blockStateModels().computeIfPresent(
        // The block state of the model to modify.
        MyBlocksClass.EXAMPLE_BLOCK.get().defaultBlockState(),
        // A BiFunction with the location and the original models as parameters, returning the new model.
        (location, model) -> new MyDelegateBakedModel(model);
    );

    // For item models
    event.getBakingResult().itemStackModels().computeIfPresent(
        // The resource location the model to modify.
        // Typically the item registry name; however, can be anything due to the ITEM_MODEL data component
        MyItemsClass.EXAMPLE_ITEM.getKey().identifier(),
        // A BiFunction with the location and the original models as parameters, returning the new model.
        (location, model) -> new MyDelegateItemModel(model);
    );
}
```

:::warning
一般而言，在可能的情况下，推荐使用[自定义模型加载器][modelloader]，而非在 `ModelEvent.ModifyBakingResult` 中包装烘焙后的模型。自定义模型加载器在需要时同样可以使用委托模型。
:::

[ao]: https://en.wikipedia.org/wiki/Ambient_occlusion
[ber]: ../../../blockentities/ber.md
[blockstate]: ../../../blocks/states.md
[bsd]: #block-state-definitions
[clientitem]: items.md
[event]: ../../../concepts/events.md
[extended]: ../../../advanced/extensibleenums.md#creating-an-enum-entry
[itemmodels]: items.md#manually-rendering-an-item
[itemmodelsection]: #item-models
[livingentity]: ../../../entities/livingentity.md
[modbus]: ../../../concepts/events.md#event-buses
[modelloader]: modelloaders.md
[rl]: ../../../misc/identifier.md
[perspective]: #perspectives
[rendertype]: index.md#render-types
[sides]: ../../../concepts/sides.md

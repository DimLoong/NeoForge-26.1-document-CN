# BlockEntityRenderer {#blockentityrenderer}

`BlockEntityRenderer`，常缩写为 BER，用于以静态[烘焙模型][model]（JSON、OBJ 等）无法表现的方式来“渲染”[方块][block]。例如，它可用于动态渲染类箱子方块的容器内容物。方块实体渲染器要求方块拥有一个 [`BlockEntity`][blockentity]，即便该方块本身并不存储任何数据。

创建 BER 时，需要直接实现 `BlockEntityRenderer`，并在其中提交方块实体的[渲染元素][features]：

```java
// The generic type in the superinterface should be set to what block entity
// you are trying to render, along with its extracted render state. More on this below.
public class MyBlockEntityRenderer implements BlockEntityRenderer<MyBlockEntity, MyBlockEntityRenderState> {

    public MyBlockEntityRenderer(BlockEntityRendererProvider.Context context) {
        // Get whatever is necessary from the context
    }

    // Tell the renderer how to create a new render state.
    @Override
    public MyBlockEntityRenderState createRenderState() {
        return new MyBlockEntityRenderState();
    }

    // Update the render state by copying the needed values from the passed block entity
    // to the passed render state.
    // The block entity and render state are the generic types passed to the renderer
    @Override
    public void extractRenderState(MyBlockEntity blockEntity, MyBlockEntityRenderState renderState, float partialTick, Vec3 cameraPos, @Nullable ModelFeatureRenderer.CrumblingOverlay crumblingOverlay) {
        // Always call super or `BlockEntityRenderState#extractBase`
        super.extractRenderState(blockEntity, renderState, partialTick, cameraPos, crumblingOverlay);

        // Extract and store any additional values in the state here.
        renderState.value = blockEntity.getValue();
    }

    // Actually submit the features of the block entity to render.
    // The first parameter matches the render state's generic type.
    @Override
    public void submit(MyBlockEntityRenderState renderState, PoseStack poseStack, SubmitNodeCollector collector, CameraRenderState cameraState) {
        // Submit using the collector here.
    }
}
```

现在有了 BER，我们还需要注册它并将其与所属的方块实体关联起来。这是在 [`EntityRenderersEvent.RegisterRenderers`][event] 中完成的，如下所示：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerEntityRenderers(EntityRenderersEvent.RegisterRenderers event) {
    event.registerBlockEntityRenderer(
            // The block entity type to register the renderer for.
            MyBlockEntities.MY_BLOCK_ENTITY.get(),
            // A function of BlockEntityRendererProvider.Context to BlockEntityRenderer.
            MyBlockEntityRenderer::new
    );
}
```

:::note

如果你的 BER 中不需要提供器上下文，也可以移除该构造函数：

```java
public class MyBlockEntityRenderer implements BlockEntityRenderer<MyBlockEntity, MyBlockEntityRenderState> {

    // ...
}

// In some event handler class
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerEntityRenderers(EntityRenderersEvent.RegisterRenderers event) {
    event.registerBlockEntityRenderer(MyBlockEntities.MY_BLOCK_ENTITY.get(),
            // Pass the context to an empty (default) constructor call
            context -> new MyBlockEntityRenderer()
    );
}
```

:::

## 方块实体渲染状态 {#block-entity-render-states}

如上例所示，方块实体渲染状态用于从实际的方块实体中提取渲染所需的值。它本质上是一个继承自 `BlockEntityRenderState` 的可变数据存储对象：

```java
public class MyBlockEntityRenderState extends BlockEntityRenderState {
    public boolean value;
}
```

随后，这些值应在 `BlockEntityRenderer#extractRenderState` 中从 `BlockEntity` 子类填充进来。

## 物品方块渲染 {#item-block-rendering}

并非所有带有渲染器的方块实体都能用静态物品模型表示。此时可以使用 [`SpecialModelRenderer`][special]，以更灵活地控制渲染过程。你既要创建特殊模型渲染器来提交所需的[渲染元素][features]，也要注册对应的特殊方块模型渲染器，供直接提交方块本身而非其物品形态时使用（例如末影人搬运方块）。

更多信息请参阅[客户端物品文档][special]。

[block]: ../blocks/index.md
[blockentity]: index.md
[event]: ../concepts/events.md#registering-an-event-handler
[features]: ../rendering/feature.md
[item]: ../items/index.md
[model]: ../resources/client/models/index.md
[special]: ../resources/client/models/items.md#special-models

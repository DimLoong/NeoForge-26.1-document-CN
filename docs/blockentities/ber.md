# BlockEntityRenderer {#blockentityrenderer}

`BlockEntityRenderer`，常缩写为 BER，用于以静态[烘焙模型][model]（JSON、OBJ 等）无法表现的方式来“渲染”[方块][block]。例如，它可用于动态渲染类箱子方块的容器内容物。方块实体渲染器要求方块拥有一个 [`BlockEntity`][blockentity]，即便该方块本身并不存储任何数据。


BER 直接实现 `BlockEntityRenderer`，后者提交其[地物][features]以供渲染：

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

正如上面的示例中所提到的，方块实体渲染状态用于从实际方块实体的值中提取出渲染所需的值。它们在功能上是可变的数据存储对象，扩展自 `BlockEntityRenderState`：

```java
public class MyBlockEntityRenderState extends BlockEntityRenderState {
    public boolean value;
}
```

随后，这些值应在 `BlockEntityRenderer#extractRenderState` 中从 `BlockEntity` 子类填充进来。

## 物品方块渲染 {#item-block-rendering}

由于并非所有带渲染器的方块实体都能用静态物品模型来表现，可以创建一个特殊的渲染器来更动态地控制这一过程。这是通过 [`SpecialModelRenderer`][special] 完成的。在这些情况下，既需要创建一个特殊模型渲染器来提交所需的[地物][features]，也需要一个对应的、已注册的特殊方块模型渲染器，以应对方块本身（而非某个物品变体）被提交渲染的场景（例如末影人搬运方块）。

更多信息请参阅[客户端物品文档][special]。

[block]: ../blocks/index.md
[blockentity]: index.md
[event]: ../concepts/events.md#registering-an-event-handler
[features]: ../rendering/feature.md
[item]: ../items/index.md
[model]: ../resources/client/models/index.md
[special]: ../resources/client/models/items.md#special-models

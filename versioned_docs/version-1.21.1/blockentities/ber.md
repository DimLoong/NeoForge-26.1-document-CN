# 块实体渲染器 {#blockentityrenderer}

`BlockEntityRenderer`（常缩写为 BER）用于以静态[烘焙模型][model]（JSON、 OBJ 等）无法表现的方式来渲染[方块][block]。例如，它可以用来动态渲染箱子类方块中容器的内容物。方块实体渲染器要求方块拥有一个[`BlockEntity`][blockentity]，即便该方块本身并不存储任何数据。

要创建 BER，先创建一个继承自 `BlockEntityRenderer` 的类。它带有一个泛型参数，用于指定方块的 `BlockEntity` 类，该类型会用作 BER 的 `render` 方法的参数类型。

```java
// Assumes the existence of MyBlockEntity as a subclass of BlockEntity.
public class MyBlockEntityRenderer implements BlockEntityRenderer<MyBlockEntity> {
    // Add the constructor parameter for the lambda below. You may also use it to get some context
    // to be stored in local fields, such as the entity renderer dispatcher, if needed.
    public MyBlockEntityRenderer(BlockEntityRendererProvider.Context context) {
    }
    
    // This method is called every frame in order to render the block entity. Parameters are:
    // - blockEntity:   The block entity instance being rendered. Uses the generic type passed to the super interface.
    // - partialTick:   The amount of time, in fractions of a tick (0.0 to 1.0), that has passed since the last tick.
    // - poseStack:     The pose stack to render to.
    // - bufferSource:  The buffer source to get vertex buffers from.
    // - packedLight:   The light value of the block entity.
    // - packedOverlay: The current overlay value of the block entity, usually OverlayTexture.NO_OVERLAY.
    @Override
    public void render(MyBlockEntity blockEntity, float partialTick, PoseStack stack, MultiBufferSource bufferSource, int packedLight, int packedOverlay) {
        // Do the rendering here.
    }
}
```

对于给定的 `BlockEntityType<?>`，只能存在一个 BER。因此，特定于单个方块实体实例的值应存储在那个方块实体实例中，而不是 BER 本身。

创建好 BER 之后，还必须将其注册到 `EntityRenderersEvent.RegisterRenderers`，这是一个在 [Mod 事件总线][eventbus]上触发的[事件][event]：

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

如果你在 BER 中不需要 BER 提供器上下文，也可以移除构造器：

```java
public class MyBlockEntityRenderer implements BlockEntityRenderer<MyBlockEntity> {
    @Override
    public void render( /* ... */ ) { /* ... */ }
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

## `BlockEntityWithoutLevelRenderer` {#blockentitywithoutlevelrenderer}

`BlockEntityWithoutLevelRenderer`，俗称 BEWLR，是常规 `BlockEntityRenderer` 针对特殊[物品][item]渲染的改良版（之所以叫“without level”，是因为物品没有 level 上下文）。它的总体用途相同：在静态模型不够用的情况下进行特殊渲染。

要添加 BEWLR，创建一个继承 `BlockEntityWithoutLevelRenderer` 并重写 `#renderByItem` 的类。它还需要一些额外的构造器设置：

```java
public class MyBlockEntityWithoutLevelRenderer extends BlockEntityWithoutLevelRenderer {
    // We need some boilerplate in the constructor, telling the superclass where to find the central block entity and entity renderers.
    public MyBlockEntityWithoutLevelRenderer() {
        super(Minecraft.getInstance().getBlockEntityRenderDispatcher(), Minecraft.getInstance().getEntityModels());
    }
    
    @Override
    public void renderByItem(ItemStack stack, ItemDisplayContext transform, PoseStack poseStack, MultiBufferSource bufferSource, int packedLight, int packedOverlay) {
        // Do the rendering here.
    }
}
```

请记住，与 BER 一样，你的 BEWLR 只有一个实例。因此，特定于物品堆叠的属性应存储在堆叠中，而不是 BEWLR 里。

与 BER 不同，我们不直接注册 BEWLR，而是向 `RegisterClientExtensionsEvent` 注册一个 `IClientItemExtensions` 实例。 `IClientItemExtensions` 是一个接口，允许我们为物品指定若干与渲染相关的行为，其中之一（但不限于此）就是 BEWLR。因此，我们对该接口的实现可以像这样：

```java
public class MyClientItemExtensions implements IClientItemExtensions {
    // Cache our BEWLR in a field.
    private final MyBlockEntityWithoutLevelRenderer myBEWLR = new MyBlockEntityWithoutLevelRenderer();

    // Return our BEWLR here.
    @Override
    public BlockEntityWithoutLevelRenderer getCustomRenderer() {
        return myBEWLR;
    }
}
```

然后，我们就可以把 `IClientItemExtensions` 注册到该事件：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerClientExtensions(RegisterClientExtensionsEvent event) {
    event.registerItem(
            // The only instance of our IClientItemExtensions, and as such, the only instance of our BEWLR.
            new MyClientItemExtensions(),
            // A vararg list of items that use this BEWLR.
            MyItems.ITEM_1, MyItems.ITEM_2
    );
}
```

:::info
`IClientItemExtensions` 通常应被视为单例。不要在 `RegisterClientExtensionsEvent` 之外构造它们！
:::

[block]: ../blocks/index.md
[blockentity]: index.md
[event]: ../concepts/events.md#registering-an-event-handler
[eventbus]: ../concepts/events.md#event-buses
[item]: ../items/index.md
[model]: ../resources/client/models/index.md

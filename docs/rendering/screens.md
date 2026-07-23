# 界面 {#screens}

界面（Screen）通常是 Minecraft 中所有图形用户界面（GUI）的基础：接收用户输入，在服务端进行校验，并将由此产生的行为同步回客户端。它们可以与[菜单][menus]结合，为类似物品栏的视图搭建一套通信网络；也可以独立使用，由 Mod 开发者通过自己的[网络][network]实现来处理。

界面由众多部分组成，这使得人们很难完全理解 Minecraft 中的“界面”究竟是什么。因此，本文将在讨论界面本身之前，先逐一介绍界面的各个组成部分及其应用方式。

## 渲染 GUI {#rendering-a-gui}

渲染 GUI 分两步进行：提交阶段和渲染阶段。

提交阶段负责收集所有要渲染到界面上的元素（例如按钮、文本、物品）。每次提交都会存入 `GuiRenderState`，以便在渲染阶段被处理并渲染。原版提供了四类元素：`GuiElementRenderState`、`GuiItemRenderState`、`GuiTextRenderState` 和 `PictureInPictureRenderState`。下文各节讨论的一切，都是在提交阶段通过内部创建上述某种渲染状态来完成的。

渲染阶段，顾名思义，把元素渲染到界面上。首先，`PictureInPictureRenderState`、`GuiItemRenderState` 和 `GuiTextRenderState` 被准备并处理为 `GuiElementRenderState`。然后，元素在最终绘制到界面之前先被排序。最后，`GuiRenderState` 被重置，准备用于下一个 GUI 或下一次渲染 tick。

### 相对坐标 {#relative-coordinates}

每当有东西提交给渲染状态时，都需要一些坐标来指定该元素将在何处渲染。经过大量抽象后，Minecraft 的大多数渲染调用都接收 X 和 Y 坐标。X 值从左到右递增，Y 值从上到下递增。然而，这些坐标并不固定在某个特定范围内。它们的范围会随界面大小以及游戏选项中指定的 GUI 缩放而变化。因此，必须格外小心，确保传递给渲染调用的坐标值能正确缩放——即相对化正确——以适应可变的界面大小。

关于如何相对化你的坐标，相关信息见[界面][screen]一节。

:::caution
如果你选择使用固定坐标，或对界面缩放处理不当，渲染出的对象可能会显得怪异或位置错乱。检查坐标是否相对化正确的一个简便方法，是点击视频设置中的“GUI 缩放”按钮。在确定 GUI 应以何种比例渲染时，该值会被用作显示器宽度和高度的除数。
:::

### GuiGraphicsExtractor {#guigraphicsextractor}

提交给 `GuiRenderState` 的任何元素通常都通过 `GuiGraphicsExtractor` 处理。`GuiGraphicsExtractor` 是提交阶段几乎每个方法的第一个参数，包含用于提交常用渲染对象的各种方法。

`GuiGraphicsExtractor` 将当前的 pose 暴露为 `Matrix3x2fStack`，以便应用任何 XY 变换：

```java
// For some GuiGraphicsExtractor graphics

// Push a new matrix onto the stack
graphics.pose().pushMatrix();

// Apply the transformations you want the element to render with

// Takes in some XY offset
graphics.pose().translate(10, 10);
// Takes in some rotation angle in radians
graphics.pose().rotate((float) Math.PI);
// Takes in some XY scalar
graphics.pose().scale(2f, 2f);

// Submit elements to the `GuiRenderState`
graphics.blitSprite(...);

// Pop the matrix to reset the transformations
graphics.pose().popMatrix();
```

此外，元素还可以使用 `enableScissor` 和 `disableScissor` 被裁剪到某个特定区域：

```java
// For some GuiGraphicsExtractor graphics

// Enable the scissor with the bounds to render within
graphics.enableScissor(
    // The left X coordinate
    0,
    // The top Y coordinate
    0,
    // The right X coordinate
    10,
    // The bottom Y coordinate
    10
);

// Submit elements to the `GuiRenderState`
graphics.blitSprite(...);

// Disable the scissor to reset the rendering area
graphics.disableScissor();
```

### 节点树与层组 {#node-trees-and-strata}

当向 `GuiRenderState` 提交元素时，它并不只是被加入某个列表。若真如此，某些元素可能会因提交顺序不同而被其他元素完全遮挡。为绕过这一难题，元素在初始时会被排序进某个层组（stratum）中的节点树。元素如何被排序，取决于其定义的 `ScreenArea#bounds`；否则，该元素不会被提交渲染。

`GuiRenderState` 由 `GuiRenderState.Node` 组成，形成一个单向链表，用“up”持有对下一个元素的引用。节点从第一个元素向“up”方向逐一渲染。每个节点持有自己的层数据，其中包含渲染状态。当一个元素初始提交给 `GuiRenderState` 时，它会根据自己定义的 `ScreenArea#bounds` 来决定使用或创建哪个节点。所选或所创建的节点，是位于所有与之元素相交的最高节点之上的那一个节点。

:::warning
尽管 `ScreenArea#bounds` 被标记为可空，但提交给渲染状态的元素若未定义 bounds，将不会被添加。该方法之所以可空，是因为在渲染阶段提交的元素会被加入当前节点，而不是根据 bounds 计算其节点。
:::

每个节点链表在渲染状态中被称为一个层组（stratum）。渲染状态可以通过调用 `GuiGraphicsExtractor#nextStratum` 拥有多个层组，从而创建一个新的节点链表。新层组会渲染在此前所有层组的元素之上（例如物品的工具提示）。一旦调用了 `nextStratum`，你就无法再回到之前的层组。

### `GuiElementRenderState` {#guielementrenderstate}

`GuiElementRenderState` 持有关于一个 GUI 元素如何渲染到界面上的元数据。元素渲染状态继承 `ScreenArea`，以定义其在界面上的 `bounds`。bounds 应始终涵盖被渲染的整个元素，以便它在节点链表中被正确排序。bounds 的计算通常会用到下面的一些参数，包括位置和 pose。

`scissorArea` 裁剪元素可以渲染的区域。如果 `scissorArea` 为 `null`，则整个元素都会渲染到界面上。同样地，如果 `scissorArea` 矩形与 `bounds` 不相交，则什么都不会渲染。

其余三个方法处理元素的实际渲染。`pipeline` 定义元素所用的着色器和元数据。`textureSetup` 可以指定 `Sampler0`、`Sampler1`、`Sampler2` 之一，或它们在片段着色器中的某种组合。最后，`buildVertices` 传入要上传到缓冲区的顶点。它接收用于传递顶点的 `VertexConsumer`。

如果 `GuiGraphicsExtractor` 提供的现有方法不够用，NeoForge 添加了 `GuiGraphicsExtractor#submitGuiElementRenderState` 方法来提交自定义的元素渲染状态。

```java
// For some GuiGraphicsExtractor graphics
graphics.submitGuiElementRenderState(new GuiElementRenderState() {

    // Store the current pose of the stack
    private final Matrix3x2f pose = new Matrix3x2f(graphics.pose());
    // Store the current scissor area
    @Nullable
    private final ScreenRectangle scissorArea = graphics.peekScissorStack();

    @Override
    public ScreenRectangle bounds() {
        // We will assume the bounds is 0, 0, 10, 10
        
        // Compute the initial rectangle
        ScreenRectangle rectangle = new ScreenRectangle(
            // The XY position
            0, 0,
            // The width and height of the element
            10, 10
        );

        // Transform the rectangle to its appropriate location using the pose
        rectangle = rectangle.transformMaxBounds(this.pose);

        // If there is a scissor area defined, return the intersection of the two rectangles
        // Otherwise, return the full bounds
        return this.scissorArea != null
            ? this.scissorArea.intersection(rectangle)
            : rectangle;
    }

    @Override
    @Nullable
    public ScreenRectangle scissorArea() {
        return this.scissorArea;
    }

    @Override
    public RenderPipeline pipeline() {
        return RenderPipelines.GUI;
    }

    @Override
    public TextureSetup textureSetup() {
        // Returns the textures to be used by the samplers in a fragment shader
        // When used by the fragment shader:
        // - Sampler0 typically contains the element texture
        // - Sampler1 typically provides a second element texture, currently only used by the end portal pipeline
        // - Sampler2 typically contains the game's lightmap texture

        // Should generally specify at least one texture in Sampler0
        return TextureSetup.noTexture();
    }

    @Override
    public void buildVertices(VertexConsumer consumer) {
        // Build the vertices using the vertex format specified by the pipeline
        // For GUI, uses quads with position and color
        // Color must be in ARGB format
        consumer.addVertexWith2DPose(this.pose, 0,   0).setUv(0, 0).setColor(0xFFFFFFFF);
        consumer.addVertexWith2DPose(this.pose, 0,  10).setUv(0, 1).setColor(0xFFFFFFFF);
        consumer.addVertexWith2DPose(this.pose, 10, 10).setUv(1, 1).setColor(0xFFFFFFFF);
        consumer.addVertexWith2DPose(this.pose, 10,  0).setUv(1, 0).setColor(0xFFFFFFFF);
    }
});
```

### 元素排序 {#element-ordering}

到目前为止，上面展示的元素都只在 XY 坐标上操作。Z 坐标在 GUI 渲染中被忽略，因为绘制到界面上的所有元素都使用一个禁用深度测试的 `RenderPipeline`。即便是带有更高级管线的 3D 元素，默认也会使用 `RenderPipeline#GUI_TEXTURED_PREMULTIPLIED_ALPHA` 绘制到一张 2D 纹理上，该管线同样禁用深度测试，从而在常见用例中避免任何 Z-fighting。

因此，在渲染阶段，每个层组按顺序渲染，节点链表中的节点从第一个元素向“up”方向渲染。但同一个节点内部又如何呢？这由 `GuiRenderer#ELEMENT_SORT_COMPARATOR` 处理，它依次根据元素的 `GuiElementRenderState#scissorArea`、`pipeline`，再到 `textureSetup` 对其排序。

:::warning
为文本渲染的字形（glyph）不参与排序，且总是在当前节点中所有元素之后渲染。
:::

未指定 `scissorArea` 的元素总是最先渲染，其后依次按顶部 Y、底部 Y、左侧 X，最后右侧 X 排序。如果两个元素的 `scissorArea` 相同，则使用 `pipeline` 的排序键（通过 `RenderPipeline#getSortKey`）。排序键基于 `RenderPipeline` 被构建的顺序，在原版中即 `RenderPipelines` 内静态常量的类加载顺序。如果排序键也相同，则使用 `textureSetup`。未指定 `textureSetup` 的元素排在最前，其后是带纹理元素的排序键（通过 `TextureSetup#getSortKey`）。

:::warning
从技术层面看，由于 `RenderPipeline` 和 `TextureSetup` 的存在，元素排序并非确定性的。这是因为排序的目标并不是确定性，而是尽可能以最少的管线和纹理切换次数来渲染元素。
:::

## `GuiGraphicsExtractor` 中的方法 {#methods-in-guigraphicsextractor}

`GuiGraphicsExtractor` 包含用于提交常用渲染对象的方法。它们分为六类：彩色矩形、字符串、纹理、物品、工具提示，以及画中画。这些方法各自提交一个元素，从 `pose` 继承当前 pose，并根据 `enableScissor` / `disableScissor` 从 `peekScissorStack` 继承裁剪区域。传给这些方法的任何颜色都必须为 [ARGB][argb] 格式。

### 彩色矩形 {#colored-rectangles}

彩色矩形使用 `ColoredRectangleRenderState` 提交。所有 fill 方法都可以接收一个可选的 `RenderPipeline` 和 `TextureSetup`，以指定矩形应如何渲染。可以提交三种彩色矩形。

首先，是彩色的水平和垂直一像素宽的线，分别为 `horizontalLine` 和 `verticalLine`。`horizontalLine` 接收定义左右边界的两个 X 坐标（含端点）、顶部 Y 坐标和颜色。`verticalLine` 接收左侧 X 坐标、定义上下边界的两个 Y 坐标（含端点）和颜色。

其次，是 `fill` 方法，它提交一个要绘制到界面上的矩形。前面的线方法内部都调用此方法。它接收左侧 X 坐标、顶部 Y 坐标、右侧 X 坐标、底部 Y 坐标和颜色。

第三，是 `outline` 方法，它提交四个一像素宽的矩形以充当轮廓。它接收左侧 X 坐标、顶部 Y 坐标、轮廓宽度、轮廓高度和颜色。

最后，是 `fillGradient` 方法，它绘制一个带垂直渐变的矩形。它接收左侧 X 坐标、顶部 Y 坐标、右侧 X 坐标、底部 Y 坐标，以及底部和顶部的颜色。

### 字符串 {#strings}

字符串、[`Component`][component] 和 `FormattedCharSequence` 使用 `GuiTextRenderState` 提交。每个字符串都通过所提供的 `Font` 绘制，`Font` 用于创建 `BakedGlyph.GlyphInstance` 以及可选的 `BakedGlyph.Effect`，并使用指定的 `GlyphRenderTypes#guiPipeline`。随后在渲染阶段，文本渲染状态会针对字符串中的每个字符转换为 `GlyphRenderState`，以及可能的 `GlyphEffectRenderState`。

字符串可以两种对齐方式渲染：左对齐字符串（`text`）和居中对齐字符串（`centeredText`）。二者都接收字符串将使用的字体、要绘制的字符串、分别代表字符串左端或中心的 X 坐标、顶部 Y 坐标和颜色。左对齐字符串还可以接收一个参数，指定是否为文本绘制投影阴影。

如果文本应在给定边界内换行，可改用 `textWithWordWrap`。如果文本应带有某种矩形背景，可使用 `textWithBackdrop`。二者默认都提交左对齐字符串。

字符串也可以使用 `ActiveTextCollector` 提交，它提供了以特定元数据（如对齐方式、不透明度和滚动）渲染字符串的方法。文本收集器通过 `GuiGraphicsExtractor#textRenderer` 或 `textRendererForWidget` 创建，或者也可以对 `ActiveTextCollector` 本身进行子类化，通常会接收一个 `$HoveredTextEffects` 用于配置是否渲染工具提示或改变光标等一些基本选项。此后，可使用 `accept` 或 `acceptScrolling` 来渲染文本，它们接收相对于对齐方式的 X 位置、Y 位置、来自 `GuiGraphicsExtractor` 的一组参数、文本本身，以及可选的文本对齐方式。`acceptScrolling` 还接收最左、最右、最上和最下位置，以表示滚动边界。

:::note
字符串通常应作为 [`Component`][component] 传入，因为它能处理各种用例，包括该方法的另外两个重载。
:::

### 纹理 {#textures}

纹理通过 `BlitRenderState` 提交，因此方法名为 `blit`。`BlitRenderState` 复制一张图像的位数据，并通过 `RenderPipeline` 参数将其渲染到界面上。每个 `blit` 还接收一个 `Identifier`，它代表纹理的绝对位置：

```java
// Points to 'assets/examplemod/textures/gui/container/example_container.png'
private static final Identifier TEXTURE = Identifier.fromNamespaceAndPath("examplemod", "textures/gui/container/example_container.png");
```

虽然 `blit` 有许多不同的重载，但我们只讨论其中两个。

第一个 `blit`（假设图像位于一个 PNG 文件上）接收两个整数，然后两个浮点数，最后再接收四个整数。它接收左侧 X 与顶部 Y 的屏幕坐标、PNG 内部的左侧 X 与顶部 Y 坐标、要渲染的图像宽度和高度，以及 PNG 文件的宽度和高度。

:::tip
必须指定 PNG 文件的大小，以便坐标能被归一化以求得关联的 UV 值。
:::

第二个 `blit` 在末尾额外加了一个整数，代表要绘制的图像的着色颜色。如果不指定，着色颜色为 `0xFFFFFFFF`。

#### `blitSprite` {#blitsprite}

`blitSprite` 是 `blit` 的一种特殊实现，其纹理取自 GUI 纹理图集。大多数叠加在背景之上的纹理，如熔炉 GUI 中的“燃烧进度”覆盖层，都是精灵图。所有精灵纹理都相对于 `textures/gui/sprites`，且无需指定文件扩展名。

```java
// Points to 'assets/examplemod/textures/gui/sprites/container/example_container/example_sprite.png'
private static final Identifier SPRITE = Identifier.fromNamespaceAndPath("examplemod", "container/example_container/example_sprite");
```

有一组 `blitSprite` 方法的参数与 `blit` 相同，只是去掉了那四个涉及 PNG 坐标、宽度和高度的整数。

另一组 `blitSprite` 方法接收更多纹理信息，以支持绘制精灵图的一部分。这些方法接收精灵宽度和高度、精灵内的 X 和 Y 坐标、左侧 X 与顶部 Y 的屏幕坐标、着色颜色，以及要渲染的图像宽度和高度。

如果精灵大小与纹理大小不匹配，则精灵可以三种方式之一进行缩放：`stretch`、`tile` 和 `nine_slice`。`stretch` 将图像从纹理大小拉伸到屏幕大小。`tile` 将纹理反复平铺，直到填满屏幕大小。`nine_slice` 将纹理划分为一个中心、四条边和四个角，以将纹理平铺到所需的屏幕大小。

这通过在一个与纹理文件同名的 mcmeta 文件中添加 `gui.scaling` JSON 对象来设置。

```json5
// For some texture file example_sprite.png
// In example_sprite.png.mcmeta

// Stretch example
{
    "gui": {
        "scaling": {
            "type": "stretch"
        }
    }
}

// Tile example
{
    "gui": {
        "scaling": {
            "type": "tile",
            // The size to begin tiling at
            // This is usually the size of the texture
            "width": 40,
            "height": 40
        }
    }
}

// Nine slice example
{
    "gui": {
        "scaling": {
            "type": "nine_slice",
            // The size to begin tiling at
            // This is usually the size of the texture
            "width": 40,
            "height": 40,
            "border": {
                // The padding of the texture that will be sliced into the border texture
                "left": 1,
                "right": 1,
                "top": 1,
                "bottom": 1
            },
            // When true the center part of the texture will be applied like
            // the stretch type instead of a nine slice tiling.
            "stretch_inner": true
        }
    }
}
```

:::note
`blitSprite` 在使用设置了 tile 或 nine slice 的纹理时，会用 `TiledBlitRenderState` 提交其元素，它在 `BlitRenderState` 的其他参数之外，还指定了平铺的宽度和高度。
:::

### 物品 {#items}

物品使用 `GuiItemRenderState` 提交。物品渲染状态随后在渲染阶段根据物品边界和客户端物品属性，转换为 `BlitRenderState` 或 `OversizedItemRenderState`。

`item` 接收一个 `ItemStack`，以及屏幕上的左侧 X 和顶部 Y 坐标。它还可以选择性地接收持有物品的 `LivingEntity`、物品堆叠所在的当前 `Level`，以及一个种子值。还有一个替代的 `fakeItem`，它将 `LivingEntity` 设为 `null`。

物品装饰——如耐久条、冷却和数量——通过 `itemDecorations` 处理。它接收与基础 `item` 相同的参数，另外还接收 `Font` 和一个数量文本覆盖值。

### 工具提示 {#tooltips}

工具提示通过上述多种渲染状态提交。工具提示方法分为两类：“下一帧”和“即时”。两类方法都接收用于渲染文本的 `Font`、某个 `Component` 列表、用于特殊渲染的可选 `TooltipComponent`、左侧 X 和顶部 Y、用于调整位置的 `ClientTooltipPositioner`，以及背景和边框纹理。

下一帧工具提示实际上并不会在下一帧提交工具提示，而是将工具提示的提交推迟到 `Screen#render` 被调用之后。工具提示被添加到一个新的层组中，也就是说它会渲染在界面所有元素之上。下一帧方法的形式为 `set*Tooltip*ForNextFrame`。它们还可以接收一个额外的布尔值，指示是否覆盖当前已推迟的工具提示（如果存在），以及一个所渲染工具提示应使用的 `ItemStack`。

即时工具提示则在方法被调用时立即提交。即时方法的形式为 `tooltip`。它们还接收工具提示所悬浮于其上的 `ItemStack`。

### 画中画 {#picture-in-picture}

画中画（Picture-in-Picture，PiP）允许将任意对象绘制到界面上。PiP 不是直接绘制到输出，而是将对象绘制到一张中间纹理，即一张“画（picture）”上，然后（默认情况下）在渲染阶段将其作为 `BlitRenderState` 提交给 `GuiRenderState`。`GuiGraphicsExtractor` 为地图（`map`）、实体（`entity`）、玩家皮肤（`skin`）、书本模型（`book`）、旗帜图案（`bannerPattern`）、告示牌（`sign`）和性能分析器图表（`profilerChart`）提供了相应方法。

:::note
当 `ClientItem.Properties#oversizedInGui` 为 true 时，超出默认 16x16 边界的物品会使用 `OversizedItemRenderer` PiP 作为其渲染机制。
:::

每个 PiP 都提交一个 `PictureInPictureRenderState` 以将对象渲染到界面上。与 `GuiElementRenderState` 类似，`PictureInPictureRenderState` 同样继承 `ScreenArea`，以定义其 `bounds` 和通过 `scissorArea` 定义的裁剪区域。`PictureInPictureRenderState` 随后定义画的渲染位置和大小，指定左侧 X（`x0`）、右侧 X（`x1`）、顶部 Y（`y0`）和底部 Y（`y1`）。画内的元素还可以通过某个浮点值进行 `scale` 缩放。最后，还可以用一个额外的 `pose` 来变换画的 XY 坐标。默认情况下，这是恒等 pose，因为通常所渲染的对象在画内部已经完成了变换。为便于实现，`bounds` 可以使用 `PictureInPictureRenderState#getBounds` 计算，不过如果修改了 `pose`，你就需要自行实现相应逻辑。

```java
// Other parameters can be added, but this is the minimum required to implement all methods
public record ExampleRenderState(
    int x0, // The left X
    int x1, // The right X
    int y0, // The top Y
    int y1, // The bottom Y
    float scale, // The scale factor when drawing to the picture
    @Nullable ScreenRectangle scissorArea, // The rendering area
    @Nullable ScreenRectangle bounds // The bounds of the element
) implements PictureInPictureRenderState {

    // Additional constructors
    public ExampleRenderState(int x, int y, int width, int height, @Nullable ScreenRectangle scissorArea) {
        this(
            x, // x0
            x + width, // x1
            y, // y0
            y + height, // y1
            1f, // scale
            scissorArea,
            PictureInPictureRenderState.getBounds(x, y, x + width, y + height, scissorArea)
        );
    }
}
```

要将 PiP 渲染状态绘制并提交到一张画上，每个 PiP 都有自己的 `PictureInPictureRenderer<T>`，其中 `T` 是所实现的 `PictureInPictureRenderState`。有许多方法可以重写，让用户几乎完全掌控整条管线，但有三个方法必须实现。

第一个是 `getRenderStateClass`，它只是返回 `PictureInPictureRenderState` 的类。在原版中，此方法用于注册该渲染器所用于的渲染状态。NeoForge 仍然使用渲染状态类，但通过一个事件提供注册，以映射到一个动态的渲染器池，而不是调用 `getRenderStateClass`。

接着是 `getTextureLabel`，它为被写入的画提供一个唯一的调试标签。最后是 `renderToTexture`，它实际将对象绘制到画上，类似于其他渲染方法。

```java
public class ExampleRenderer extends PictureInPictureRenderer<ExampleRenderState> {

    // Takes in the buffers used to write the object to the picture
    public ExampleRenderer(MultiBufferSource.BufferSource bufferSource) {
        super(bufferSource);
    }

    @Override
    public Class<ExampleRenderState> getRenderStateClass() {
        // Returns the render state class
        return ExampleRenderState.class;
    }

    @Override
    protected String getTextureLabel() {
        // Can be any string, but should be unique
        // Prefix with mod id for greater clarity
        return "examplemod: example pip";
    }

    @Override
    protected void renderToTexture(ExampleRenderState renderState, PoseStack pose) {
        // Modify pose if desired
        // Can push/pop if wanted, but a new `PoseStack` is created for writing to the picture
        pose.translate(...);

        // Render the object to the screen
        VertexConsumer consumer = this.bufferSource.getBuffer(RenderType.lines());
        consumer.addVertex(...).setColor(...).setNormal(...);
        consumer.addVertex(...).setColor(...).setNormal(...);
    }

    // Additional methods

    @Override
    protected void blitTexture(ExampleRenderState renderState, GuiRenderState guiState) {
        // Submits the picture to the gui render state as a `BlitRenderState` by default
        // Override this if you want to modify the `BlitRenderState`
        // Should call `GuiRenderState#submitBlitToCurrentLayer`
        // Bounds can be `null`
        super.blitTexture(renderState, guiState);
    }

    @Override
    protected boolean textureIsReadyToBlit(ExampleRenderState renderState) {
        // When true, this reuses the already written-to picture instead of
        // constructing a new picture and writing to it using `renderToTexture`.
        // This should only be true if it is guaranteed that two elements will
        // be rendered *exactly* the same.
        return super.textureIsReadyToBlit(renderState);
    }

    @Override
    protected float getTranslateY(int scaledHeight, int guiScale) {
        // Sets the initial offset the `PoseStack` is translated by in the Y direction.
        // Common implementations use `scaledHeight / 2f` to center the Y coordinate similar to X.
        return scaledHeight;
    }

    @Override
    public boolean canBeReusedFor(ExampleRenderState state, int textureWidth, int textureHeight) {
        // A NeoForge-added method used to check if this renderer can be reused on a subsequent frame.
        // When true, this will reuse the constructed state and renderer from the previous frame.
        // When false, a new renderer will be created.
        return super.canBeReusedFor(state, textureWidth, textureHeight);
    }
}
```

要使用该 PiP，必须在 [mod 事件总线][modbus]上把渲染器注册到 `RegisterPictureInPictureRenderersEvent`。

```java
@SubscribeEvent // on the mod event bus
public static void registerPip(RegisterPictureInPictureRenderersEvent event) {
    event.register(
        // The PiP render state class
        ExampleRenderState.class,
        // A factory that takes in the `MultiBufferSource.BufferSource` and returns the PiP renderer
        ExampleRenderer::new
    );
}
```

随后即可使用 NeoForge 添加的 `GuiGraphicsExtractor#submitPictureInPictureRenderState` 提交 PiP 渲染状态：

```java
// For some GuiGraphicsExtractor graphics
graphics.submitPictureInPictureRenderState(new ExampleRenderState(
    0, 0,
    10, 10,
    // Get the scissor area from the stack
    graphics.peekScissorStack()
));
```

:::note
NeoForge 修复了一个 bug，该 bug 会阻止在任意给定帧中提交同一 PiP 渲染状态的多个实例。
:::

## Renderable {#renderable}

`Renderable` 本质上就是被渲染的对象。这些包括界面、按钮、聊天框、列表等。`Renderable` 只有一个方法：`#extractRenderState`。它接收用于向界面提交元素的 `GuiGraphicsExtractor`、缩放到相对界面大小的鼠标 x 和 y 位置，以及 tick delta（自上一帧以来经过了多少 tick）。

一些常见的 renderable 是界面和“控件（widget）”：可交互的元素，如 `Button`、其子类型 `ImageButton`，以及用于在界面上输入文本的 `EditBox`。

## GuiEventListener {#guieventlistener}

Minecraft 中的任何界面都实现了 `GuiEventListener`。`GuiEventListener` 负责处理用户与界面的交互。这些包括来自鼠标（移动、点击、释放、拖拽、滚动、悬停）和键盘（按下、释放、键入）的输入。每个方法返回相应操作是否成功影响了界面。按钮、聊天框、列表等控件也实现了此接口。

### ContainerEventHandler {#containereventhandler}

与 `GuiEventListener` 几乎同义的，是它们的子类型：`ContainerEventHandler`。它们负责处理在包含控件的界面上的用户交互，管理当前哪个控件被聚焦，以及相关交互如何应用。`ContainerEventHandler` 增加了三项额外功能：可交互的子元素、拖拽和聚焦。

事件处理器持有子元素，用于确定元素的交互顺序。在鼠标事件处理器（拖拽除外）期间，列表中第一个被鼠标悬停的子元素会执行其逻辑。

用鼠标拖拽元素（通过 `#mouseClicked` 和 `#mouseReleased` 实现）提供了更精确执行的逻辑。

聚焦允许某个特定子元素被优先检查并在事件执行期间处理，例如在键盘事件或拖拽鼠标期间。焦点通常通过 `#setFocused` 设置。此外，可交互的子元素可以使用 `#nextFocusPath` 循环切换，根据传入的 `FocusNavigationEvent` 选择子元素。

:::note
界面通过 `AbstractContainerEventHandler` 实现 `ContainerEventHandler`，后者加入了用于拖拽和聚焦子元素的 setter 和 getter 逻辑。
:::

## NarratableEntry {#narratableentry}

`NarratableEntry` 是可以通过 Minecraft 无障碍旁白功能朗读的元素。每个元素可以根据悬停或选中的对象提供不同的旁白，通常按焦点、悬停，然后其他所有情况的优先级排序。

`NarratableEntry` 有四个方法：两个用于确定元素在被朗读时的优先级（`#narrationPriority` 和 `#getTabOrderGroup`），一个用于确定是否朗读旁白（`#isActive`），最后一个用于将旁白提供给其关联的输出，无论是朗读还是显示（`#updateNarration`）。

:::note
Minecraft 的所有控件都是 `NarratableEntry`，因此如果使用现有的子类型，通常无需手动实现。
:::

## Screen 子类型 {#the-screen-subtype}

有了以上全部知识，就可以构造一个基础界面了。为便于理解，界面的各组成部分将按其通常被遇到的顺序来介绍。

首先，所有界面都接收一个代表界面标题的 `Component`。该组件通常由界面的某个子类型绘制到界面上。在基础界面中，它仅用于旁白消息。界面还可以接收 `Minecraft` 实例和渲染文本时所用的 `Font`；如果不指定，则使用默认实例和字体。

```java
// In some Screen subclass
public MyScreen(Component title) {
    super(Minecraft.getInstance(), Minecraft.getInstance().font, title);
}
```

### 初始化 {#initialization}

界面被初始化后，会调用 `#init` 方法。`init` 方法根据 `Minecraft` 实例，将界面内的初始设置设为经游戏缩放的相对宽度和高度。任何设置工作，如添加控件或预计算相对坐标，都应在此方法中完成。如果游戏窗口被调整大小，界面会通过调用 `init` 方法重新初始化。

向界面添加控件有三种方式，各有其用途：

| 方法                  | 描述                                                            |
|:--------------------:|:------------------------------------------------------------------------------|
|`addWidget`           | 添加一个可交互且带旁白，但不渲染的控件。                          |
|`addRenderableOnly`   | 添加一个只会被渲染的控件；它不可交互，也不带旁白。                |
|`addRenderableWidget` | 添加一个可交互、带旁白且会被渲染的控件。                          |

通常，`addRenderableWidget` 使用得最频繁。

```java
// In some Screen subclass
@Override
protected void init() {
    super.init();

    // Add widgets and precomputed values
    this.addRenderableWidget(new EditBox(/* ... */));
}
```

### 界面的 tick {#ticking-screens}

界面也使用 `#tick` 方法进行 tick，以执行某种层面上用于渲染目的的客户端逻辑。

```java
// In some Screen subclass
@Override
public void tick() {
    super.tick();

    // Execute some logic every frame
}
```

### 输入处理 {#input-handling}

由于界面是 `GuiEventListener` 的子类型，输入处理器也可以被重写，例如用于处理特定[按键][keymapping]的逻辑。

### 渲染界面 {#rendering-the-screen}

界面通过 `#extractRenderStateWithTooltipAndSubtitles` 在三个不同的层组中提交其元素以供渲染：背景层组、元素层组，以及可选的可悬停层组。

背景层组的元素首先通过 `#extractBackground` 提交，通常包含任何模糊或背景纹理。

:::warning
模糊（通过 `GuiGraphicsExtractor#blurBeforeThisStratum` 处理）在任意给定帧中只能调用一次。尝试提交第二次模糊将导致抛出异常。
:::

元素层组的元素接下来通过 `#extractRenderState` 方法提交，该方法因作为 `Renderable` 子类型而提供。它主要提交控件和标签，同时设置要提交的可悬停元素。

最后，可悬停层组提交悬浮于之前元素之上的元素，如工具提示。

```java
// In some Screen subclass

// mouseX and mouseY indicate the scaled coordinates of where the cursor is in on the screen
@Override
public void extractBackground(GuiGraphicsExtractor graphics, int mouseX, int mouseY, float partialTick) {
    // Submit things on the background stratum
    this.extractTransparentBackground(graphics);
}

@Override
public void extractRenderState(GuiGraphicsExtractor graphics, int mouseX, int mouseY, float partialTick) {
    // Submit things before widgets

    // Then the widgets if this is a direct child of the Screen
    super.extractRenderState(graphics, mouseX, mouseY, partialTick);

    // Submit things after widgets

    // Set the tooltip to be added above everything in this method
    graphics.setTooltipForNextFrame(...);
}
```

### 关闭界面 {#closing-the-screen}

当界面被关闭时，有两个方法处理清理工作：`#onClose` 和 `#removed`。

`onClose` 在用户做出关闭当前界面的输入时被调用。此方法通常用作回调，用于销毁并保存界面自身的任何内部进程。这包括向服务端发送数据包。

`removed` 在界面即将切换并被释放交给垃圾回收器之前被调用。它处理任何在界面打开前未重置回其初始状态的内容。

```java
// In some Screen subclass

@Override
public void onClose() {
    // Stop any handlers here

    // Call last in case it interferes with the override
    super.onClose();
}

@Override
public void removed() {
    // Reset initial states here

    // Call last in case it interferes with the override
    super.removed()
;}
```

## `AbstractContainerScreen` {#abstractcontainerscreen}

如果一个界面直接附加到某个[菜单][menus]上，则应改为继承 `AbstractContainerScreen`。`AbstractContainerScreen` 充当菜单的界面和输入处理器，并包含用于同步槽位和与槽位交互的逻辑。因此，通常只需重写或实现两个方法，即可拥有一个可用的容器界面。同样地，为便于理解，容器界面的各组成部分将按其通常被遇到的顺序来介绍。

`AbstractContainerScreen` 通常需要五个参数：被打开的容器菜单（由泛型 `T` 表示）、玩家物品栏（仅用于显示名称）、界面自身的标题，以及背景纹理的宽度和高度。

:::note
如果背景纹理宽高为 176 x 166，则可以从父构造函数中省略背景纹理的宽度和高度。这里指的不是图像大小（通常是 256 x 256 的 PNG），而是其中特定的纹理边界。
:::


在此可以设置若干定位字段：

字段              | 描述
:---:             | :---
`titleLabelX`     | 界面标题将被渲染的相对 x 坐标。
`titleLabelY`     | 界面标题将被渲染的相对 y 坐标。
`inventoryLabelX` | 玩家物品栏名称将被渲染的相对 x 坐标。
`inventoryLabelY` | 玩家物品栏名称将被渲染的相对 y 坐标。

:::caution
在前面某一节中提到，预计算的相对坐标应在 `#init` 方法中设置。这一点仍然成立，因为此处提到的这些值不是预计算坐标，而是静态值和相对化坐标。

图像相关的值是静态且不变的，因为它们代表背景纹理的大小。为便于渲染，另外两个值（`leftPos` 和 `topPos`）在 `init` 方法中预计算，标记背景将被渲染处的左上角。标签坐标相对于这些值。

`leftPos` 和 `topPos` 也可作为渲染背景的便捷方式，因为它们已经代表了要传入 `GuiGraphicsExtractor#blit` 的位置。
:::

```java
// In some AbstractContainerScreen subclass
public MyContainerScreen(MyMenu menu, Inventory playerInventory, Component title) {
    super(menu, playerInventory, title, 176, 166);

    this.titleLabelX = 10;
    this.inventoryLabelX = 10;
}
```

### 访问菜单 {#menu-access}

由于菜单被传入界面，菜单中任何已被同步的值（无论是通过槽位、数据槽位还是自定义系统）现在都可以通过 `menu` 字段访问。

### 容器 tick {#container-tick}

当玩家存活并看着界面时，容器界面在 `#tick` 方法内通过 `#containerTick` 进行 tick。它在容器界面中实质上取代了 `tick`，最常见的用途是对配方书进行 tick。

```java
// In some AbstractContainerScreen subclass
@Override
protected void containerTick() {
    super.containerTick();

    // Tick things here
}
```

### 渲染容器界面 {#rendering-the-container-screen}

容器界面使用全部三个层组来提交其元素。首先，背景层组通过重写 `#extractBackground` 提交背景纹理。然后，元素层组像之前一样在 `#extractContents` 内提交控件，其后是 `#extractLabels` 中的标签。最后，`AbstractContainerScreen` 通过 `extractTooltip` 设置在可悬停层组期间提交的工具提示。

从背景开始，`extractBackground` 被调用以将界面的背景元素提交到背景层组。

```java
// In some AbstractContainerScreen subclass

// The location of the background texture (assets/<namespace>/<path>)
private static final Identifier BACKGROUND_LOCATION = Identifier.fromNamespaceAndPath(MOD_ID, "textures/gui/container/my_container_screen.png");

@Override
protected void extractBackground(GuiGraphicsExtractor graphics, int mouseX, int mouseY, float partialTick) {
    super.extractBackground(graphics, mouseX, mouseY, a);

    // Submits the background texture. 'leftPos' and 'topPos' should
    // already represent the top left corner of where the texture
    // should be rendered as it was precomputed from the 'imageWidth'
    // and 'imageHeight'. The two zeros represent the integer u/v
    // coordinates inside the PNG file, whose size is represented by
    // the last two integers (typically 256 x 256).
    graphics.blit(
        RenderPipelines.GUI_TEXTURED,
        BACKGROUND_LOCATION,
        this.leftPos, this.topPos,
        0, 0,
        this.imageWidth, this.imageHeight,
        256, 256
    );
}
```

`extractLabels` 被调用，以在渲染层组中控件之后提交任何文本。它使用界面字体调用 `text` 来提交关联的组件。

```java
// In some AbstractContainerScreen subclass
@Override
protected void extractLabels(GuiGraphicsExtractor graphics, int mouseX, int mouseY) {
    super.extractLabels(graphics, mouseX, mouseY);

    // Assume we have some Component 'label'
    // 'label' is drawn at 'labelX' and 'labelY'
    // The color is an ARGB value
    // The final boolean renders the drop shadow when true
    graphics.text(this.font, this.label, this.labelX, this.labelY, 0xFF404040, false);
}
```

:::note
提交标签时，你**不**需要指定 `leftPos` 和 `topPos` 偏移。它们已经在 `Matrix3x2fStack` 内被平移过了，因此此方法内的一切都是相对于那些坐标提交的。
:::

## 注册 AbstractContainerScreen {#registering-an-abstractcontainerscreen}

要将 `AbstractContainerScreen` 与菜单配合使用，需要将其注册。这可以通过在 [**mod 事件总线**][modbus]上的 `RegisterMenuScreensEvent` 内调用 `register` 来完成。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerScreens(RegisterMenuScreensEvent event) {
    event.register(MY_MENU.get(), MyContainerScreen::new);
}
```

[menus]: ../inventories/menus.md
[network]: ../networking/index.md
[screen]: #the-screen-subtype
[argb]: https://en.wikipedia.org/wiki/RGBA_color_model#ARGB32
[component]: ../resources/client/i18n.md#components
[keymapping]: ../misc/keymappings.md#inside-a-gui
[modbus]: ../concepts/events.md#event-buses

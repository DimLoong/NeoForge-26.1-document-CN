# 界面 {#screens}

界面（Screen）通常是 Minecraft 中所有图形用户界面（GUI）的基础：它接收用户输入、在服务端进行校验，并将由此产生的操作结果同步回客户端。界面可以与[菜单][menus]结合，为类物品栏的视图构建一套通信网络；也可以是独立的，此时 Mod 开发者可以通过自己的[网络通信][network]实现来处理它。

界面由众多部分组成，这使得人们很难完全理解在 Minecraft 中一个“界面”究竟是什么。因此，本文将先逐一介绍界面的各个组成部分及其用法，然后再讨论界面本身。

## 相对坐标 {#relative-coordinates}

每当渲染任何东西时，都需要有某种标识来指定它将出现在何处。经过众多抽象之后，Minecraft 的大多数渲染调用会在一个坐标平面中接收 x、 y、 z 值。 x 值从左到右递增，y 值从上到下递增，z 值从远到近递增。然而，这些坐标并不固定在某个指定范围内。它们的范围会随界面尺寸以及游戏选项中所设置的“GUI 缩放”而变化。因此，必须格外小心，确保传给渲染调用的坐标值能够随可变的界面尺寸正确缩放——也就是被正确地相对化。

关于如何将坐标相对化的信息，见[界面][screen]一节。

:::caution
如果你选择使用固定坐标，或对界面进行了错误的缩放，渲染出的对象可能会显得奇怪或错位。检查坐标是否正确相对化的一个简便方法，是点击视频设置中的“Gui Scale”按钮。在确定 GUI 应以何种比例渲染时，该值会作为除数，去除以显示器的宽度和高度。
:::

## 图形图形 {#gui-graphics}

Minecraft 渲染的任何 GUI 通常都通过 `GuiGraphics` 完成。 `GuiGraphics` 是几乎所有渲染方法的第一个参数；它包含用于渲染常用对象的基础方法。这些方法可分为五类：彩色矩形、字符串、纹理、物品和工具提示（tooltip）。此外还有一个用于渲染组件片段的额外方法（`#enableScissor` / `#disableScissor`）。 `GuiGraphics` 还暴露了 `PoseStack`，用于施加将组件正确渲染到目标位置所需的变换。另外，颜色采用 [ARGB][argb] 格式。

### 彩色矩形 {#colored-rectangles}

彩色矩形通过一个位置颜色着色器（position color shader）绘制。所有填充方法都可以接收一个可选的 `RenderType`，用来指定矩形应如何渲染。可以绘制的彩色矩形共有三种。

第一种是一像素宽的彩色水平线和垂直线，分别对应 `#hLine` 和 `#vLine`。 `#hLine` 接收定义左右端点（含端点）的两个 x 坐标、顶部的 y 坐标，以及颜色。 `#vLine` 接收左侧 x 坐标、定义上下端点（含端点）的两个 y 坐标，以及颜色。

第二种是 `#fill` 方法，用于向界面绘制一个矩形。上述画线方法内部都会调用该方法。它接收左侧 x 坐标、顶部 y 坐标、右侧 x 坐标、底部 y 坐标，以及颜色。 `#fillRenderType` 作用相同，只是它绘制顶点时不会对坐标位置进行校正。

最后是 `#fillGradient` 方法，用于绘制带有垂直渐变的矩形。它接收右侧 x 坐标、底部 y 坐标、左侧 x 坐标、顶部 y 坐标、 z 坐标，以及底部和顶部的颜色。

### 字符串 {#strings}

字符串通过其 `Font` 绘制，通常包含各自用于普通、透视和偏移模式的着色器。可以渲染两种对齐方式的字符串，每种都带有背影：左对齐字符串（`#drawString`）和居中对齐字符串（`#drawCenteredString`）。二者都接收用于渲染字符串的字体、要绘制的字符串、分别代表字符串左端或中心的 x 坐标、顶部 y 坐标，以及颜色。

如果文本需要在给定边界内换行，则可改用 `#drawWordWrap`。它默认渲染左对齐字符串。

:::note
字符串通常应作为 [`Component`][component] 传入，因为 `Component` 能处理各种用例，也包含该方法的另外两个重载。
:::

### 纹理 {#textures}

纹理通过位块传输（blitting）绘制，这也是方法名 `#blit` 的由来——就本用途而言，它复制一张图像的位并将其直接绘制到界面上。这些操作通过一个位置纹理着色器（position texture shader）完成。

每个 `#blit` 方法都接收一个 `ResourceLocation`，它代表纹理的绝对位置：

```java
// Points to 'assets/examplemod/textures/gui/container/example_container.png'
private static final ResourceLocation TEXTURE = ResourceLocation.fromNamespaceAndPath("examplemod", "textures/gui/container/example_container.png");
```

尽管 `#blit` 有许多不同的重载，这里只讨论其中两个。

第一个 `#blit` 接收六个整数，并假定所渲染的纹理位于一张 256 x 256 的 PNG 文件中。它接收界面上的左侧 x 与顶部 y 坐标、 PNG 内部的左侧 x 与顶部 y 坐标，以及要渲染图像的宽度和高度。

:::tip
必须指定 PNG 文件的尺寸，这样才能对坐标进行归一化，从而得到相应的 UV 值。
:::

第二个 `#blit`（第一个会调用它）在此基础上扩展为七个整数和两个浮点数用于 PNG 坐标，只假定图像位于一张 PNG 文件中。它接收界面上的左侧 x 与顶部 y 坐标、 z 坐标（称为 blit 偏移量）、 PNG 内部的左侧 x 与顶部 y 坐标、要渲染图像的宽度和高度，以及 PNG 文件的宽度和高度。

#### `blitSprite` {#blitsprite}

`#blitSprite` 是 `#blit` 的一种特殊实现，其纹理会被写入 GUI 纹理图集（texture atlas）。大多数叠加在背景之上的纹理，例如熔炉 GUI 中的“燃烧进度”覆盖层，都是精灵（sprite）。所有精灵纹理都相对于 `textures/gui/sprites`，且无需指定文件扩展名。

```java
// Points to 'assets/examplemod/textures/gui/sprites/container/example_container/example_sprite.png'
private static final ResourceLocation SPRITE = ResourceLocation.fromNamespaceAndPath("examplemod", "container/example_container/example_sprite");
```

其中一组 `#blitSprite` 方法与 `#blit` 具有相同的参数，只是不含精灵内部的 x、 y 坐标。

另一组 `#blitSprite` 方法接收更多纹理信息，以便渲染精灵的一部分。这些方法接收纹理宽度和高度、精灵内的 x、 y 坐标、界面上的左侧 x 与顶部 y 坐标、 z 坐标（称为 blit 偏移量），以及要渲染图像的宽度和高度。

如果精灵尺寸与纹理尺寸不一致，则可以用以下三种方式之一对精灵进行缩放：`stretch`、 `tile` 和 `nine_slice`。 `stretch` 会将图像从纹理尺寸拉伸到界面尺寸。 `tile` 会不断重复渲染纹理，直到铺满界面尺寸。 `nine_slice` 会将纹理划分为一个中心、四条边和四个角，从而将纹理平铺到所需的界面尺寸。

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
            }
        }
    }
}
```

#### Blit 偏移量 {#blit-offset}

渲染纹理时的 z 坐标通常被设置为 blit 偏移量。该偏移量负责在查看界面时正确地对各次渲染进行分层。 z 坐标较小的渲染会绘制在背景中，反之，z 坐标较大的渲染会绘制在前景中。 z 偏移量可以直接通过 `#translate` 在 `PoseStack` 上设置。 `GuiGraphics` 的某些方法内部会应用一些基本的偏移逻辑（例如物品渲染）。

:::caution
设置 blit 偏移量后，你必须在渲染完对象之后将其重置。否则，界面内的其他对象可能会被渲染到错误的层，导致图形显示问题。推荐在平移之前压入（push）当前的 pose，并在该偏移量下的所有渲染完成后再弹出（pop）。
:::

## 可渲染 {#renderable}

`Renderable` 本质上就是会被渲染的对象。它们包括界面、按钮、聊天框、列表等等。 `Renderable` 只有一个方法：`#render`。它接收用于将内容渲染到界面的 `GuiGraphics`、缩放到相对界面尺寸后的鼠标 x、 y 位置，以及 tick delta（自上一帧以来经过了多少 tick）。

一些常见的 renderable 是界面和“控件”（widget）：即通常渲染在界面上的可交互元素，例如 `Button`、其子类型 `ImageButton`，以及用于在界面上输入文本的 `EditBox`。

## GuiEventListener {#guieventlistener}

Minecraft 中渲染的任何界面都实现了 `GuiEventListener`。 `GuiEventListener` 负责处理用户与界面的交互。这些交互包括来自鼠标的输入（移动、点击、释放、拖动、滚动、悬停）和键盘的输入（按下、释放、键入）。每个方法都会返回相应操作是否成功影响了界面。按钮、聊天框、列表等控件也实现了该接口。

### ContainerEventHandler {#containereventhandler}

与 `GuiEventListener` 几乎同义的是其子类型 `ContainerEventHandler`。它负责处理在包含控件的界面上的用户交互，管理当前哪个控件处于聚焦状态，以及相关交互如何被应用。 `ContainerEventHandler` 增加了三项额外特性：可交互的子元素、拖动和聚焦。

事件处理器持有一些子元素，用于确定各元素的交互顺序。在鼠标事件处理器（不含拖动）执行期间，列表中第一个被鼠标悬停到的子元素会执行其逻辑。

用鼠标拖动某个元素（通过 `#mouseClicked` 和 `#mouseReleased` 实现）可提供更精确执行的逻辑。

聚焦允许某个特定的子元素在事件执行期间被优先检查和处理，例如在键盘事件或拖动鼠标期间。聚焦通常通过 `#setFocused` 设置。此外，可交互的子元素可以使用 `#nextFocusPath` 循环切换，它会根据传入的 `FocusNavigationEvent` 来选择子元素。

:::note
界面通过 `AbstractContainerEventHandler` 实现 `ContainerEventHandler`，后者为拖动和聚焦子元素补充了 setter 和 getter 逻辑。
:::

## 叙述条目 {#narratableentry}

`NarratableEntry` 是可以通过 Minecraft 的无障碍旁白（narration）功能被朗读的元素。每个元素可以根据被悬停或被选中的情况提供不同的旁白，其优先级通常依次为聚焦、悬停，然后是所有其他情况。

`NarratableEntry` 有三个方法：一个用于确定元素的优先级（`#narrationPriority`），一个用于确定是否朗读旁白（`#isActive`），最后一个用于将旁白提供给其相应的输出，无论是朗读还是读取（`#updateNarration`）。

:::note
Minecraft 中的所有控件都是 `NarratableEntry`，因此如果使用现有的子类型，通常无需手动实现它。
:::

## Screen 子类型 {#the-screen-subtype}

有了以上所有知识，就可以构造一个基本的界面了。为便于理解，下面将按照界面各组成部分通常被遇到的顺序来介绍它们。

首先，所有界面都接收一个代表界面标题的 `Component`。该组件通常由界面的某个子类型绘制到界面上。在基础界面中，它仅用于旁白消息。

```java
// In some Screen subclass
public MyScreen(Component title) {
    super(title);
}
```

### 初始化 {#initialization}

界面被初始化后，会调用 `#init` 方法。 `#init` 方法会依据 `Minecraft` 实例，将界面内部的初始设置设为经游戏缩放后的相对宽度和高度。任何诸如添加控件或预计算相对坐标之类的准备工作，都应在此方法中完成。如果游戏窗口被调整大小，界面会通过再次调用 `#init` 方法而被重新初始化。

向界面添加控件有三种方式，各有不同用途：

方法                   | 说明
:---:                  | :---
`#addWidget`           | 添加一个可交互并会被旁白的控件，但不渲染。
`#addRenderableOnly`   | 添加一个仅会被渲染的控件；它既不可交互也不会被旁白。
`#addRenderableWidget` | 添加一个可交互、会被旁白且会被渲染的控件。

通常，`#addRenderableWidget` 会使用得最为频繁。

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

界面也会通过 `#tick` 方法进行 tick，以执行一定程度上用于渲染目的的客户端逻辑。

```java
// In some Screen subclass
@Override
public void tick() {
    super.tick();

    // Execute some logic every frame
}
```

### 输入处理 {#input-handling}

由于界面是 `GuiEventListener` 的子类型，因此也可以重写其输入处理器，例如用于处理某个特定[按键][keymapping]的逻辑。

### 渲染界面 {#rendering-the-screen}

最后，界面通过 `#render` 方法渲染，该方法由其作为 `Renderable` 子类型而提供。如前所述，`#render` 方法会在每一帧绘制界面需要渲染的一切内容，例如背景、控件、工具提示等。默认情况下，`#render` 方法只会把控件渲染到界面上。

界面中最常被渲染、且通常不由子类型处理的两样东西，是背景和工具提示。

背景可以使用 `#renderBackground` 渲染，其中一个方法会接收一个 v 偏移量，用于在界面渲染时其背后的世界无法被渲染的情况下渲染选项背景。

工具提示通过 `GuiGraphics#renderTooltip` 或 `GuiGraphics#renderComponentTooltip` 渲染，它们可以接收要渲染的文本组件、一个可选的自定义工具提示组件，以及工具提示应在界面上渲染位置的 x / y 相对坐标。

```java
// In some Screen subclass

// mouseX and mouseY indicate the scaled coordinates of where the cursor is in on the screen
@Override
public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
    // Background is typically rendered first
    this.renderBackground(graphics);

    // Render things here before widgets (background textures)

    // Then the widgets if this is a direct child of the Screen
    super.render(graphics, mouseX, mouseY, partialTick);

    // Render things after widgets (tooltips)
}
```

### 关闭界面 {#closing-the-screen}

界面被关闭时，有两个方法负责收尾：`#onClose` 和 `#removed`。

`#onClose` 在用户做出关闭当前界面的输入时被调用。该方法通常用作回调，以销毁并保存界面自身内部的任何进行中处理，其中包括向服务端发送数据包。

`#removed` 在界面即将切换、并被交给垃圾回收器之前被调用。它负责处理任何尚未在界面打开之前重置回初始状态的东西。

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

如果一个界面直接依附于[菜单][menus]，则应改为继承 `AbstractContainerScreen`。 `AbstractContainerScreen` 充当菜单的渲染器和输入处理器，并包含用于同步槽位和与之交互的逻辑。因此，通常只需重写或实现两个方法，就能得到一个可用的容器界面。同样地，为便于理解，下面将按照容器界面各组成部分通常被遇到的顺序来介绍它们。

`AbstractContainerScreen` 通常需要三个参数：正在打开的容器菜单（由泛型 `T` 表示）、玩家物品栏（仅用于显示名称），以及界面本身的标题。在此过程中，可以设置若干定位字段：

字段              | 说明
:---:             | :---
`imageWidth`      | 用作背景的纹理的宽度。它通常位于一张 256 x 256 的 PNG 中，默认值为 176。
`imageHeight`     | 用作背景的纹理的高度。它通常位于一张 256 x 256 的 PNG 中，默认值为 166。
`titleLabelX`     | 界面标题渲染位置的相对 x 坐标。
`titleLabelY`     | 界面标题渲染位置的相对 y 坐标。
`inventoryLabelX` | 玩家物品栏名称渲染位置的相对 x 坐标。
`inventoryLabelY` | 玩家物品栏名称渲染位置的相对 y 坐标。

:::caution
在前面的章节中曾提到，预计算的相对坐标应在 `#init` 方法中设置。这一点依然成立，因为这里提到的这些值并不是预计算坐标，而是静态值和相对化坐标。

image 系列的值是静态且不变的，因为它们代表背景纹理的尺寸。为了让渲染更方便，还有两个额外的值（`leftPos` 和 `topPos`）会在 `#init` 方法中预计算，它们标记背景将被渲染位置的左上角。标签坐标则相对于这两个值。

`leftPos` 和 `topPos` 也是渲染背景的一种便捷手段，因为它们已经代表了要传入 `#blit` 方法的位置。
:::

```java
// In some AbstractContainerScreen subclass
public MyContainerScreen(MyMenu menu, Inventory playerInventory, Component title) {
    super(menu, playerInventory, title);

    this.titleLabelX = 10;
    this.inventoryLabelX = 10;

    /*
     * If the 'imageHeight' is changed, 'inventoryLabelY' must also be
     * changed as the value depends on the 'imageHeight' value.
     */
}
```

### 访问菜单 {#menu-access}

由于菜单被传入了界面，因此菜单中任何曾被同步的值（无论是通过槽位、数据槽位，还是自定义系统）现在都可以通过 `menu` 字段访问。

### 容器 tick {#container-tick}

当玩家存活并正在查看界面时，容器界面会在 `#tick` 方法内通过 `#containerTick` 进行 tick。在容器界面中，它实际上取代了 `#tick` 的位置，其最常见的用途是对配方书（recipe book）进行 tick。

```java
// In some AbstractContainerScreen subclass
@Override
protected void containerTick() {
    super.containerTick();

    // Tick things here
}
```

### 渲染容器界面 {#rendering-the-container-screen}

容器界面通过三个方法渲染：`#renderBg`，用于渲染背景纹理；`#renderLabels`，用于在背景之上渲染任何文本；以及 `#render`，它在前两个方法之外，还负责提供变灰的背景和工具提示。

先从 `#render` 说起，最常见的重写（通常也是唯一的情况）会添加背景、调用父类以渲染容器界面，最后在其之上渲染工具提示。

```java
// In some AbstractContainerScreen subclass
@Override
public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
    this.renderBackground(graphics);
    super.render(graphics, mouseX, mouseY, partialTick);

    /*
     * This method is added by the container screen to render
     * the tooltip of the hovered slot.
     */
    this.renderTooltip(graphics, mouseX, mouseY);
}
```

在父类内部，会调用 `#renderBg` 来渲染界面的背景。最标准的做法使用三个方法调用：两个用于准备工作，一个用于绘制背景纹理。

```java
// In some AbstractContainerScreen subclass

// The location of the background texture (assets/<namespace>/<path>)
private static final ResourceLocation BACKGROUND_LOCATION = ResourceLocation.fromNamespaceAndPath(MOD_ID, "textures/gui/container/my_container_screen.png");

@Override
protected void renderBg(GuiGraphics graphics, float partialTick, int mouseX, int mouseY) {
    /*
     * Renders the background texture to the screen. 'leftPos' and
     * 'topPos' should already represent the top left corner of where
     * the texture should be rendered as it was precomputed from the
     * 'imageWidth' and 'imageHeight'. The two zeros represent the
     * integer u/v coordinates inside the 256 x 256 PNG file.
     */
    graphics.blit(BACKGROUND_LOCATION, this.leftPos, this.topPos, 0, 0, this.imageWidth, this.imageHeight);
}
```

最后，调用 `#renderLabels` 来渲染任何位于背景之上、但在工具提示之下的文本。它只是使用字体来绘制相关的组件。

```java
// In some AbstractContainerScreen subclass
@Override
protected void renderLabels(GuiGraphics graphics, int mouseX, int mouseY) {
    super.renderLabels(graphics, mouseX, mouseY);

    // Assume we have some Component 'label'
    // 'label' is drawn at 'labelX' and 'labelY'
    graphics.drawString(this.font, this.label, this.labelX, this.labelY, 0x404040);
}
```

:::note
渲染标签时，你**不**需要指定 `leftPos` 和 `topPos` 偏移量。它们已经在 `PoseStack` 内完成了平移，因此该方法内的一切都是相对于那些坐标绘制的。
:::

## 注册 AbstractContainerScreen {#registering-an-abstractcontainerscreen}

要将 `AbstractContainerScreen` 与菜单一起使用，需要对其进行注册。可以通过在 [**mod 事件总线**][modbus]上的 `RegisterMenuScreensEvent` 中调用 `register` 来完成。

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerScreens(RegisterMenuScreensEvent event) {
    event.register(MY_MENU.get(), MyContainerScreen::new);
}
```

[menus]: ./menus.md
[network]: ../networking/index.md
[screen]: #the-screen-subtype
[argb]: https://en.wikipedia.org/wiki/RGBA_color_model#ARGB32
[component]: ../resources/client/i18n.md#components
[keymapping]: ../misc/keymappings.md#inside-a-gui
[modbus]: ../concepts/events.md#event-buses

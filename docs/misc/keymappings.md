# 按键映射 {#key-mappings}

按键映射（key mapping），或称按键绑定（key binding），定义了一个应当与某个输入（鼠标点击、按键按下等）相绑定的特定动作。按键映射所定义的每个动作，都可以在客户端能够接受输入时进行检查。此外，每个按键映射都可以通过[控制选项菜单][controls]被分配给任意输入。

## 注册 `KeyMapping` {#registering-a-keymapping}

可以通过在[Mod 事件总线][eventbus]上监听 `RegisterKeyMappingsEvent`（仅在物理客户端）并调用 `#register` 来注册一个 `KeyMapping`。

```java
// In some physical client only class

// Key mapping is lazily initialized so it doesn't exist until it is registered
public static final Lazy<KeyMapping> EXAMPLE_MAPPING = Lazy.of(() -> /*...*/);

@SubscribeEvent // on the mod event bus only on the physical client
public static void registerBindings(RegisterKeyMappingsEvent event) {
    event.register(EXAMPLE_MAPPING.get());
}
```

## 创建 `KeyMapping` {#creating-a-keymapping}

可以使用 `KeyMapping` 的构造器来创建它。`KeyMapping` 接受一个定义该映射名称的[翻译键][tk]、该映射的默认输入，以及一个 `KeyMapping.Category`，后者定义了该映射在[控制选项菜单][controls]中所归属的类别。

:::tip
可以通过创建一个带有 `Identifier` 的新 `KeyMapping.Category`，并在[Mod 事件总线][eventbus]上（仅在[物理客户端][sides]）通过 `RegisterKeyMappingsEvent#registerCategory` 注册它，从而将某个 `KeyMapping` 添加到自定义类别中。该类别所关联的[翻译键][tk]为 `key.category.<namespace>.<path>`。

```java
public static final KeyMapping.Category EXAMPLE_CATEGORY = new KeyMapping.Category(Identifier.fromNamespaceAndPath("examplemod", "category"));

@SubscribeEvent // on the mod event bus only on the physical client
public static void registerBindings(RegisterKeyMappingsEvent event) {
    // Register category
    event.registerCategory(EXAMPLE_CATEGORY);

    // Register binding with category used
    event.register(EXAMPLE_MAPPING.get());
}
```

:::

### 默认输入 {#default-inputs}

每个按键映射都关联着一个默认输入。这是通过 `InputConstants.Key` 提供的。每个输入由一个 `InputConstants.Type`（定义是哪种设备提供该输入）和一个整数（定义该输入在设备上所关联的标识符）组成。

原版提供了三种输入类型：`KEYSYM`，它通过所提供的 `GLFW` 键位标记（key token）定义键盘；`SCANCODE`，它通过平台特定的扫描码定义键盘；以及 `MOUSE`，它定义鼠标。

:::note
对于键盘，强烈推荐使用 `KEYSYM` 而非 `SCANCODE`，因为 `GLFW` 键位标记不绑定于任何特定系统。你可以在 [GLFW 文档][keyinput]中了解更多。
:::

该整数取决于所提供的类型。所有输入码都定义在 `GLFW` 中：`KEYSYM` 标记以 `GLFW_KEY_*` 为前缀，而 `MOUSE` 码以 `GLFW_MOUSE_*` 为前缀。

```java
new KeyMapping(
    "key.examplemod.example1", // Will be localized using this translation key
    InputConstants.Type.KEYSYM, // Default mapping is on the keyboard
    GLFW.GLFW_KEY_P, // Default key is P
    KeyMapping.Category.MISC // Mapping will be in the misc category
)
```

:::note
如果该按键映射不应绑定到某个默认值，则应将输入设为 `InputConstants#UNKNOWN`。原版构造器会要求你通过 `InputConstants$Key#getValue` 提取输入码，而 NeoForge 构造器则可以直接接受原始的输入字段。
:::

### `IKeyConflictContext` {#ikeyconflictcontext}

并非所有映射都在每个上下文中使用。有些映射只在 GUI 中使用，而另一些只纯粹在游戏中使用。为了避免相同按键在不同上下文中使用的映射彼此冲突，可以为其分配一个 `IKeyConflictContext`。

每个冲突上下文包含两个方法：`#isActive`，它定义该映射是否可以在当前游戏状态下使用；以及 `#conflicts`，它定义该映射是否与相同或不同冲突上下文中的某个按键相冲突。

目前，NeoForge 通过 `KeyConflictContext` 定义了三种基本上下文：`UNIVERSAL`，即默认值，表示该按键可以在任何上下文中使用；`GUI`，表示该映射只能在有 `Screen` 打开时使用；以及 `IN_GAME`，表示该映射只能在没有 `Screen` 打开时使用。可以通过实现 `IKeyConflictContext` 来创建新的冲突上下文。

```java
new KeyMapping(
    "key.examplemod.example2",
    KeyConflictContext.GUI, // Mapping can only be used when a screen is open
    InputConstants.Type.MOUSE, // Default mapping is on the mouse
    GLFW.GLFW_MOUSE_BUTTON_LEFT, // Default mouse input is the left mouse button
    EXAMPLE_CATEGORY // Mapping will be in the new example category
)
```

### `KeyModifier` {#keymodifier}

Mod 开发者可能不希望在同时按住某个修饰键时映射产生相同的行为（例如 `G` 与 `CTRL + G`）。为此，NeoForge 为构造器额外增加了一个参数，用于接受一个 `KeyModifier`，它可以为任意输入施加 control（`KeyModifier#CONTROL`）、shift（`KeyModifier#SHIFT`）或 alt（`KeyModifier#ALT`）修饰。`KeyModifier#NONE` 是默认值，不施加任何修饰。

可以在[控制选项菜单][controls]中通过同时按住修饰键和所关联的输入来添加一个修饰键。

```java
new KeyMapping(
    "key.examplemod.example3",
    KeyConflictContext.UNIVERSAL,
    KeyModifier.SHIFT, // Default mapping requires shift to be held down
    InputConstants.Type.KEYSYM, // Default mapping is on the keyboard
    GLFW.GLFW_KEY_G, // Default key is G
    KeyMapping.Category.MISC
)
```

## 检查 `KeyMapping` {#checking-a-keymapping}

可以检查一个 `KeyMapping` 是否已被点击。根据检查的时机，该映射可以用在一个条件判断中，以执行相关联的逻辑。

### 在游戏中 {#within-the-game}

在游戏中，应当通过在[事件总线][eventbus]上监听 `ClientTickEvent.Post`，并在一个 while 循环内检查 `KeyMapping#consumeClick` 来检查映射。`#consumeClick` 只会在输入被执行且尚未被先前处理的次数内返回 `true`，因此它不会无限地卡住游戏。

```java
@SubscribeEvent // on the game event bus only on the physical client
public static void onClientTick(ClientTickEvent.Post event) {
    while (EXAMPLE_MAPPING.get().consumeClick()) {
        // Execute logic to perform on click here
    }
}
```

:::caution
不要用 `InputEvent` 作为 `ClientTickEvent.Post` 的替代方案。键盘和鼠标输入分别有各自独立的事件，因此它们不会处理任何额外的输入。
:::

### 在 GUI 内 {#inside-a-gui}

在 GUI 内，可以在某个 `GuiEventListener` 方法中使用 `IKeyMappingExtension#isActiveAndMatches` 来检查映射。最常检查的方法是 `#keyPressed` 和 `#mouseClicked`。

`#keyPressed` 接受一个 `KeyEvent`，其中包含 `GLFW` 键位标记、平台特定的扫描码，以及一个表示被按住修饰键的位域。可以通过使用 `InputConstants#getKey` 创建输入，来将某个按键与映射进行比对。修饰键已经在映射方法自身内部被检查过了。

```java
// In some Screen subclass
@Override
public boolean keyPressed(KeyEvent event) {
    if (EXAMPLE_MAPPING.get().isActiveAndMatches(InputConstants.getKey(event))) {
        // Execute logic to perform on key press here
        return true;
    }
    return super.keyPressed(event);
} 
```

:::note
如果你并不拥有你想要检查**按键**的那个界面，可以改为在[游戏事件总线][eventbus]上监听 `ScreenEvent.KeyPressed` 的 `Pre` 或 `Post` 事件。
:::

`#mouseClicked` 接受一个 `MouseButtonEvent`，其中包含鼠标的 x 位置、y 位置以及被点击的 `MouseButtonInfo`；此外还有一个表示用户是否进行了双击的 `boolean`。可以通过使用 `InputConstants.Type#getOrCreate` 并配合 `MOUSE` 输入来创建输入，从而将某个鼠标按键与映射进行比对。

```java
// In some Screen subclass
@Override
public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
    if (EXAMPLE_MAPPING.get().isActiveAndMatches(InputConstants.Type.MOUSE.getOrCreate(event.button()))) {
        // Execute logic to perform on mouse click here
        return true;
    }
    return super.mouseClicked(event, doubleClick);
} 
```

:::note
如果你并不拥有你想要检查**鼠标**的那个界面，可以改为在[游戏事件总线][eventbus]上监听 `ScreenEvent.MouseButtonPressed` 的 `Pre` 或 `Post` 事件。
:::

[eventbus]: ../concepts/events.md#registering-an-event-handler
[controls]: https://minecraft.wiki/w/Options#Controls
[tk]: ../resources/client/i18n.md#components
[keyinput]: https://www.glfw.org/docs/3.3/input_guide.html#input_key
[sides]: ../concepts/sides.md#the-physical-side

# 按键映射 {#key-mappings}

键映射或键绑定定义了应与输入绑定的特定操作：鼠标单击、按键等。只要客户端可以接受输入，就可以检查键映射定义的每个操作。此外，每个键映射可以通过[控制选项菜单][controls]分配给任何输入。

## 注册 `KeyMapping` {#registering-a-keymapping}

可以通过仅在物理客户端上监听[mod 事件总线][eventbus]上的 `RegisterKeyMappingsEvent` 并调用 `#register` 来注册 `KeyMapping`。

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

可以使用它的构造函数创建 `KeyMapping`。 `KeyMapping` 接受定义映射名称、映射默认输入的 [翻译键][tk]，以及定义映射将放入 [控件选项菜单][controls] 中的类别的 [翻译键][tk]。

:::tip
通过提供原版未提供的类别[翻译关键字][tk]，可以将 `KeyMapping` 添加到自定义类别中。自定义类别翻译键应包含 mod id（例如 `key.categories.examplemod.examplecategory`）。
:::

### 默认输入 {#default-inputs}

每个键映射都有一个与其关联的默认输入。这是通过 `InputConstants.Key` 提供的。每个输入都包含一个 `InputConstants.Type`（定义提供输入的设备）和一个整数（定义设备上输入的关联标识符）。

原版 提供三种类型的输入：`KEYSYM`（通过提供的 `GLFW` 密钥标记定义键盘）、 `SCANCODE`（通过特定于平台的扫描码定义键盘）和 `MOUSE`（定义鼠标）。

:::note
强烈建议对键盘使用 `KEYSYM` 而不是 `SCANCODE`，因为 `GLFW` 密钥令牌不绑定到任何特定系统。你可以在 [GLFW 文档][keyinput] 上阅读更多内容。
:::

整数取决于提供的类型。所有输入代码均在 `GLFW` 中定义：`KEYSYM` 令牌以 `GLFW_KEY_*` 为前缀，而 `MOUSE` 代码以 `GLFW_MOUSE_*` 为前缀。

```java
new KeyMapping(
    "key.examplemod.example1", // Will be localized using this translation key
    InputConstants.Type.KEYSYM, // Default mapping is on the keyboard
    GLFW.GLFW_KEY_P, // Default key is P
    "key.categories.misc" // Mapping will be in the misc category
)
```

:::note
如果键映射不应映射到默认值，则输入应设置为 `InputConstants#UNKNOWN`。普通构造函数将要求你通过 `InputConstants$Key#getValue` 提取输入代码，而 NeoForge 构造函数可以提供原始输入字段。
:::

### `IKeyConflictContext` {#ikeyconflictcontext}

并非所有映射都在每个上下文中使用。有些映射仅在 GUI 中使用，而其他映射仅在游戏中使用。为了避免在不同上下文中使用的相同密钥的映射相互冲突，可以分配 `IKeyConflictContext`。

每个冲突上下文包含两个方法：`#isActive`，它定义映射是否可以在当前游戏状态中使用；`#conflicts`，它定义映射是否与相同或不同冲突上下文中的键冲突。

目前，NeoForge 通过 `KeyConflictContext` 定义了三个基本上下文：`UNIVERSAL`，这是默认的，意味着密钥可以在每个上下文中使用；`GUI`，这意味着映射只能在 `Screen` 打开时使用；`IN_GAME`，这意味着映射只能在 `Screen` 打开时使用。 `Screen` 未开放。可以通过实施 `IKeyConflictContext` 创建新的冲突上下文。

```java
new KeyMapping(
    "key.examplemod.example2",
    KeyConflictContext.GUI, // Mapping can only be used when a screen is open
    InputConstants.Type.MOUSE, // Default mapping is on the mouse
    GLFW.GLFW_MOUSE_BUTTON_LEFT, // Default mouse input is the left mouse button
    "key.categories.examplemod.examplecategory" // Mapping will be in the new example category
)
```

### `KeyModifier` {#keymodifier}

如果修饰键保持相同（例如 `G` 与 `CTRL + G`），Mod 开发者可能不希望映射具有相同的行为。为了解决这个问题，NeoForge 在构造函数中添加了一个额外的参数来接收 `KeyModifier`，它可以将控制 (`KeyModifier#CONTROL`)、移位 (`KeyModifier#SHIFT`) 或 alt (`KeyModifier#ALT`) 应用于任何输入。 `KeyModifier#NONE` 是默认值，不会应用任何修饰符。

通过按住修改键和关联的输入，可以在[控件选项菜单][controls]中添加修改器。

```java
new KeyMapping(
    "key.examplemod.example3",
    KeyConflictContext.UNIVERSAL,
    KeyModifier.SHIFT, // Default mapping requires shift to be held down
    InputConstants.Type.KEYSYM, // Default mapping is on the keyboard
    GLFW.GLFW_KEY_G, // Default key is G
    "key.categories.misc"
)
```

## 检查 `KeyMapping` {#checking-a-keymapping}

可以检查 `KeyMapping` 是否被点击。根据何时，可以在条件中使用映射来应用关联的逻辑。

### 游戏内 {#within-the-game}

在游戏中，应通过在 [事件总线][eventbus] 上监听 `ClientTickEvent.Post` 并在 while 循环内检查 `KeyMapping#consumeClick` 来检查映射。 `#consumeClick` 将仅返回 `true` 执行输入且之前尚未处理的次数，因此它不会无限地停止游戏。

```java
@SubscribeEvent // on the game event bus only on the physical client
public static void onClientTick(ClientTickEvent.Post event) {
    while (EXAMPLE_MAPPING.get().consumeClick()) {
        // Execute logic to perform on click here
    }
}
```

:::caution
请勿使用 `InputEvent` 作为 `ClientTickEvent.Post` 的替代品。仅针对键盘和鼠标输入有单独的事件，因此它们不会处理任何其他输入。
:::

### GUI 内部 {#inside-a-gui}

在 GUI 中，可以使用 `IKeyMappingExtension#isActiveAndMatches` 在 `GuiEventListener` 方法之一中检查映射。最常见的检查方法是 `#keyPressed` 和 `#mouseClicked`。

`#keyPressed` 接收 `GLFW` 密钥令牌、特定于平台的扫描代码以及按下的修饰符的位字段。可以通过使用 `InputConstants#getKey` 创建输入来检查映射的键。修饰符已经在映射方法本身中进行了检查。

```java
// In some Screen subclass
@Override
public boolean keyPressed(int key, int scancode, int mods) {
    if (EXAMPLE_MAPPING.get().isActiveAndMatches(InputConstants.getKey(key, scancode))) {
        // Execute logic to perform on key press here
        return true;
    }
    return super.keyPressed(x, y, button);
} 
```

:::note
如果你不拥有要检查**键**的屏幕，则可以改为在[事件总线][eventbus]上监听 `ScreenEvent.KeyPressed` 的 `Pre` 或 `Post` 事件。
:::

`#mouseClicked` 获取鼠标的 x 位置、 y 位置和单击的按钮。通过使用 `InputConstants.Type#getOrCreate` 和 `MOUSE` 输入创建输入，可以根据映射检查鼠标按钮。

```java
// In some Screen subclass
@Override
public boolean mouseClicked(double x, double y, int button) {
    if (EXAMPLE_MAPPING.get().isActiveAndMatches(InputConstants.TYPE.MOUSE.getOrCreate(button))) {
        // Execute logic to perform on mouse click here
        return true;
    }
    return super.mouseClicked(x, y, button);
} 
```

:::note
如果你不拥有要检查**鼠标**的屏幕，则可以改为监听[事件总线][eventbus]上 `ScreenEvent.MouseButtonPressed` 的 `Pre` 或 `Post` 事件。
:::

[eventbus]: ../concepts/events.md#registering-an-event-handler
[controls]: https://minecraft.wiki/w/Options#Controls
[tk]: ../resources/client/i18n.md#components
[keyinput]: https://www.glfw.org/docs/3.3/input_guide.html#input_key

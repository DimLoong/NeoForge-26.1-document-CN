# 模型 {#models}

模型是 JSON 文件，用于确定块或物品的视觉形状和纹理。模型由长方体元素组成，每个元素都有自己的大小，然后为每个面分配纹理。

每个物品都有一个按其注册表名称分配给它的物品模型。例如，注册表名称为 `examplemod:example_item` 的物品将获得分配给它的模型 `assets/examplemod/models/item/example_item.json`。对于块来说，这有点复杂，因为它们首先被分配一个方块状态文件。有关详细信息，请参阅[下文][bsfile]。

## 规格 {#specification}

_另请参阅：[Minecraft Wiki][mcwiki] 上的[模型][mcwikimodel]_

模型是一个 JSON 文件，根标记中具有以下可选属性：

- `loader`：添加了 NeoForge。设置自定义模型加载器。有关更多信息，请参阅[自定义模型加载器][custommodelloader]。
- `parent`：设置父模型，形式为相对于 `models` 文件夹的[资源位置][rl]。所有父属性将被应用，然后被声明模型中设置的属性覆盖。常见的父母包括：
    - `minecraft:block/block`：所有方块模型的共同父级。
    - `minecraft:block/cube`：所有使用 1x1x1 立方体模型的模型的父级。
    - `minecraft:block/cube_all`：立方体模型的变体，在所有六个面上使用相同的纹理，例如鹅卵石或木板。
    - `minecraft:block/cube_bottom_top`：立方体模型的变体，在所有四个水平面上使用相同的纹理，并在顶部和底部使用单独的纹理。常见的例子包括砂岩或凿刻石英。
    - `minecraft:block/cube_column`：立方体模型的变体，具有侧面纹理以及底部和顶部纹理。例如，原木、石英柱和紫珀柱。
    - `minecraft:block/cross`：使用两个具有相同纹理的平面的模型，一个顺时针旋转45°，另一个逆时针旋转45°，从上面看形成一个 X（因此得名）。例子包括大多数植物，例如草、树苗和鲜花。
    - `minecraft:item/generated`：经典 2D 平面物品模型的父级。游戏中的大多数物品都会使用。忽略 `elements` 块，因为它的四边形是从纹理生成的。
    - `minecraft:item/handheld`：看似由玩家实际持有的 2D 平面物品模型的父级。主要由工具使用。 `item/generated` 的子模型，这会导致它也忽略 `elements` 块。
    - `minecraft:builtin/entity`：指定除 `particle` 之外的任何纹理。如果这是父级，则 [`BakedModel#isCustomRenderer()`][iscustomrenderer] 返回 `true` 以允许使用 [`BlockEntityWithoutLevelRenderer`][bewlr]。
    - 方块物品通常（但并非总是）使用其相应的方块模型作为父项。例如，鹅卵石物品模型使用父级 `minecraft:block/cobblestone`。
- `ambientocclusion`：是否启用[环境光遮挡][ao]。仅对方块模型有效。默认为 `true`。如果你的自定义方块模型有奇怪的阴影，请尝试将其设置为 `false`。
- `render_type`：请参阅[渲染类型][rendertype]。
- `gui_light`：可以是 `"front"` 或 `"side"`。如果是 `"front"`，光线将从前面发出，对于平面 2D 模型很有用。如果是 `"side"`，光线将从侧面发出，对于 3D 模型（尤其是方块模型）很有用。默认为 `"side"`。仅对物品模型有效。
- `textures`：将名称（称为纹理变量）映射到[纹理位置][textures]的子对象。然后可以在[elements]中使用纹理变量。它们也可以在元素中指定，但不指定以便子模型指定它们。
    - 方块模型还应指定 `particle` 纹理。当跌倒、跑过或打破方块时会使用此纹理。
    - 物品模型还可以使用图层纹理，命名为 `layer0`、 `layer1` 等，其中索引较高的图层渲染在索引较低的图层之上（例如，`layer1` 将渲染在 `layer0` 之上）。仅当父级为 `item/generated` 时才有效，并且仅适用于最多 5 层（`layer0` 到 `layer4`）。
- `elements`：长方体[元素]列表。
- `overrides`：[覆盖模型][overrides]的列表。仅对物品模型有效。
- `display`：一个子对象，包含不同[视角]的不同显示选项，请参阅链接文章了解可能的键。仅对物品模型有效，但通常在方块模型中指定，以便物品模型可以继承显示选项。每个透视图都是一个可选的子对象，可能包含以下选项，这些选项按该顺序应用：
    - `translation`：模型的翻译，指定为 `[x, y, z]`。
    - `rotation`：模型的旋转，指定为 `[x, y, z]`。
    - `scale`：模型的比例，指定为 `[x, y, z]`。
    - `right_rotation`：添加了 NeoForge。缩放后应用的第二次旋转，指定为 `[x, y, z]`。
- `transform`：请参阅[根变换][roottransforms]。

:::tip
如果你无法确定如何准确指定某些内容，请查看具有类似功能的普通模型。
:::

### 渲染类型 {#render-types}

使用可选的 NeoForge 添加的 `render_type` 字段，你可以为模型设置渲染类型。如果未设置此选项（就像所有普通模型中的情况一样），游戏将回退到 `ItemBlockRenderTypes` 中硬编码的渲染类型。如果 `ItemBlockRenderTypes` 也不包含该块的渲染类型，它将回退到 `minecraft:solid`。 原版 提供以下默认渲染类型：

- `minecraft:solid`：用于完全实心的块，例如石头。
- `minecraft:cutout`：用于任何像素完全实心或完全透明的块，即完全透明或不透明，例如玻璃。
- `minecraft:cutout_mipped`：`minecraft:cutout` 的变体，它将在远距离处按比例缩小纹理以避免视觉伪影（[mipmapping]）。不将 mipmap 应用于物品渲染，因为它通常在物品上是不需要的，并且可能会导致伪影。例如用于叶子。
- `minecraft:cutout_mipped_all`：`minecraft:cutout_mipped` 的变体，它也将 mipmapping 应用于物品模型。
- `minecraft:translucent`：用于任何像素可能部分透明的块，例如彩色玻璃。
- `minecraft:tripwire`：由具有渲染到天气目标（即绊线）特殊要求的块使用。

选择正确的渲染类型在某种程度上是性能问题。实体渲染比剪切渲染快，剪切渲染比半透明渲染快。因此，你应该指定适用于你的用例的“最严格”渲染类型，因为它也是最快的。

如果需要，你还可以添加自己的渲染类型。为此，请订阅 [mod 总线][modbus] [事件]`RegisterNamedRenderTypesEvent` 和 `#register` 你的渲染类型。 `#register` 有三四个参数：

- 渲染类型的名称。将带有你的 mod id 前缀。例如，这里使用 `"my_cutout"` 将提供 `examplemod:my_cutout` 作为新的渲染类型供你使用（当然前提是你的 mod id 是 `examplemod`）。
- 块渲染类型。可以使用 `RenderType.chunkBufferLayers()` 返回的列表中的任何类型。
- 实体渲染类型。必须是具有 `DefaultVertexFormat.NEW_ENTITY` 顶点格式的渲染类型。
- 可选：精彩的渲染类型。必须是具有 `DefaultVertexFormat.NEW_ENTITY` 顶点格式的渲染类型。如果图形模式设置为 _Fabulous!_，将使用它代替常规实体渲染类型。如果省略，则回退到常规渲染类型。通常建议设置渲染类型是否以某种方式使用透明度。

### 元素 {#elements}

元素是长方体对象的 JSON 表示形式。它具有以下属性：

- `from`：长方体起始角点的坐标，指定为 `[x, y, z]`。以 1/16 块单位指定。例如，`[0, 0, 0]` 将是块的“左下”角，`[8, 8, 8]` 将是中心，`[16, 16, 16]` 将是块的“右上角”角。
- `to`：长方体的端角坐标，指定为 `[x, y, z]`。与 `from` 一样，它以 1/16 块为单位指定。

:::tip
`from` 和 `to` 中的值被 Minecraft 限制为 `[-16, 32]` 范围。但是，强烈建议不要超过 `[0, 16]`，因为这会导致照明和/或剔除问题。
:::

- `neoforge_data`：参见[额外面部数据][extrafacedata]。
- `faces`：包含最多 6 个人脸数据的对象，分别命名为 `north`、 `south`、 `east`、 `west`、 `up` 和 `down`。每一张脸都有以下数据：
    - `uv`：脸部的 uv，指定为 `[u1, v1, u2, v2]`，其中 `u1, v1` 是左上角 uv 坐标，`u2, v2` 是右下 uv 坐标。
    - `texture`：用于面部的纹理。必须是以 `#` 为前缀的纹理变量。例如，如果你的模型具有名为 `wood` 的纹理，你将使用 `#wood` 来引用该纹理。从技术上讲是可选的，如果不存在，将使用缺失的纹理。
    - `rotation`：可选。将纹理顺时针旋转 90、180 或 270 度。
    - `cullface`：可选。当有一个完整的块沿指定方向接触脸部时，告诉渲染引擎跳过渲染该脸部。方向可以是 `north`、 `south`、 `east`、 `west`、 `up` 或 `down`。
    - `tintindex`：可选。指定颜色处理器可以使用的色调索引，有关详细信息，请参阅[色调][tinting]。默认为-1，表示不着色。
    - `neoforge_data`：参见[额外面部数据][extrafacedata]。

此外，它还可以指定以下可选属性：

- `shade`：仅适用于方块模型。选修的。该元素的面是否应具有方向相关的阴影。默认为 true。
- `rotation`：对象的旋转，指定为包含以下数据的子对象：
    - `angle`：旋转角度，单位为度。可以是 -45 到 45，步长为 22.5 度。
    - `axis`：旋转轴。目前无法绕多个轴旋转对象。
    - `origin`：可选。旋转的原点，指定为 `[x, y, z]`。请注意，这些是绝对值，即它们与立方体的位置无关。如果未指定，将使用 `[0, 0, 0]`。

#### 额外面部数据 {#extra-face-data}

额外面数据 (`neoforge_data`) 可应用于元素和元素的单个面。在所有可用的情况下，它都是可选的。如果同时指定了元素级和面级额外面数据，则面级数据将覆盖元素级数据。额外数据可以指定以下数据：

- `color`：用​​给定的颜色给脸部着色。必须是 ARGB 值。可以指定为字符串或十进制整数（JSON 不支持十六进制文字）。默认为 `0xFFFFFFFF`。如果颜色值恒定，这可以用作着色的替代品。
- `block_light`：覆盖用于该面的块光值。默认为 0。
- `sky_light`：覆盖用于该面的天空光值。默认为 0。
- `ambient_occlusion`：禁用或启用该面的环境光遮挡。默认为模型中设置的值。

使用自定义 `neoforge:item_layers` 加载程序，你还可以指定额外的面数据以应用于 `item/generated` 模型中的所有几何体。在以下示例中，第 1 层将被染成红色并以全亮度发光：

```json5
{
    "loader": "neoforge:item_layers",
    "parent": "minecraft:item/generated",
    "textures": {
        "layer0": "minecraft:item/stick",
        "layer1": "minecraft:item/glowstone_dust"
    },
    "neoforge_data": {
        "layers": {
            "1": {
                "color": "0xFFFF0000",
                "block_light": 15,
                "sky_light": 15,
                "ambient_occlusion": false
            }
        }
    }
}
```

### 覆盖 {#overrides}

物品覆盖可以根据浮点值（称为覆盖值）为物品分配不同的模型。例如，弓和弩使用它来根据拉动的时间来改变纹理。覆盖既有模型又有代码。

该模型可以指定当覆盖值等于或大于给定阈值时应使用的一个或多个覆盖模型。例如，弓使用两种不同的属性 `pulling` 和 `pull`。 `pulling` 被视为布尔值，1 解释为拉动，0 解释为不拉动，而 `pull` 表示弓当前拉动的程度。然后，当充电低于 65%（`pulling`1，无 `pull` 值）、65%（`pulling`1、 `pull`0.65）和 90%（`pulling`1、 `pull`0.9)。如果应用多个模型（因为值不断变大），则列表的最后一个元素匹配，因此请确保你的顺序正确。覆盖如下所示：

```json5
{
    // other stuff here
    "overrides": [
        {
            // pulling = 1
            "predicate": {
                "pulling": 1
            },
            "model": "item/bow_pulling_0"
        },
        {
            // pulling = 1, pull >= 0.65
            "predicate": {
                "pulling": 1,
                "pull": 0.65
            },
            "model": "item/bow_pulling_1"
        },
        // pulling = 1, pull >= 0.9
        {
            "predicate": {
                "pulling": 1,
                "pull": 0.9
            },
            "model": "item/bow_pulling_2"
        }
    ]
}
```

代码方面非常简单。假设我们要向物品添加一个名为 `examplemod:property` 的属性，我们将在[客户端][side][事件处理器][eventhandler]中使用以下代码：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void onClientSetup(FMLClientSetupEvent event) {
    event.enqueueWork(() -> { // ItemProperties#register is not threadsafe, so we need to call it on the main thread
        ItemProperties.register(
            // The item to apply the property to.
            ExampleItems.EXAMPLE_ITEM,
            // The id of the property.
            ResourceLocation.fromNamespaceAndPath("examplemod", "property"),
            // A reference to a method that calculates the override value.
            // Parameters are the used item stack, the level context, the player using the item,
            // and a random seed you can use.
            (stack, level, player, seed) -> someMethodThatReturnsAFloat()
        );
    });
}
```

:::info
原版 Minecraft 仅允许 0 到 1 之间的浮点值。 NeoForge 对此进行了修补，以允许任意浮点值。
:::

### 根变换 {#root-transforms}

在模型的顶层添加 `transform` 属性告诉加载程序应在应用 [方块状态文件][bsfile]（对于方块模型）中的旋转或应用 `display` 块（对于物品模型）中的转换之前应用对所有几何图形的转换。这是 NeoForge 添加的。

根变换可以通过两种方式指定。第一种方法是名为 `matrix` 的单个属性，其中包含嵌套 JSON 数组形式的转换 3x4 矩阵（行主要顺序，最后一行被省略）。该矩阵是按平移、左旋转、缩放、右旋转和变换原点的顺序组成的。一个例子如下：

```json5
{
    // ...
    "transform": {
        "matrix": [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ]
    }
}
```

第二种方法是指定一个包含以下条目任意组合的 JSON 对象，并按该顺序应用：

- `translation`：相对翻译。指定为三维向量 (`[x, y, z]`)，如果不存在则默认为 `[0, 0, 0]`。
- `rotation` 或 `left_rotation`：在缩放之前应用的围绕平移原点的旋转。默认不旋转。通过以下方式之一指定：
    - 具有单轴到旋转映射的 JSON 对象，例如 `{"x": 90}`
    - JSON 对象数组，每个对象都有一个轴到旋转映射，按照它们指定的顺序应用，例如 `[{"x": 90}, {"y": 45}, {"x": -22.5}]`
    - 具有三个值的数组，每个值指定绕每个轴的旋转，例如 `[90, 45, -22.5]`
    - 具有四个值的数组直接指定四元数，例如 `[0.38268346, 0, 0, 0.9238795]`（= 绕 X 轴 45 度）
- `scale`：相对于翻译原点的比例。指定为三维向量 (`[x, y, z]`)，如果不存在则默认为 `[1, 1, 1]`。
- `post_rotation` 或 `right_rotation`：缩放后应用的围绕平移原点的旋转。默认不旋转。指定与 `rotation` 相同。
- `origin`：用于旋转和缩放的原点。作为最后一步，转换也移至此处。指定为三维向量 (`[x, y, z]`) 或使用三个内置值之一 `"corner"`(=`[0, 0, 0]`)、 `"center"`(=`[0.5, 0.5, 0.5]`) 或 `"opposing-corner"`(=`[1, 1, 1]`)，默认）。

## 方块状态文件 {#blockstate-files}

_另请参阅：[Minecraft Wiki][mcwiki] 上的 [Blockstate 文件][mcwikiblockstate]_

游戏使用方块状态文件将不同的模型分配给不同的[方块状态]。每个区块必须有一个方块状态文件注册到游戏中。为方块状态指定方块模型有两种互斥的方式：通过变体或通过多部分。

在 `variants` 块内，每个方块状态都有一个元素。这是将方块状态与模型关联起来的主要方式，被绝大多数方块所使用。
- 关键是不带方块名称的方块状态的字符串表示形式，例如 `"type=top,waterlogged=false"` 表示未浸水的顶板，或者 `""` 表示没有属性的方块。值得注意的是，未使用的属性可以被省略。例如，如果 `waterlogged` 属性对所选模型没有影响，则两个对象 `type=top,waterlogged=false` 和 `type=top,waterlogged=true` 可能会折叠为一个 `type=top` 对象。这也意味着空字符串对于每个块都有效。
- 该值可以是单个模型对象或模型对象数组。如果使用模型对象数组，则会从中随机选择一个模型。模型对象由以下数据组成：
    - `model`：模型文件位置的路径，相对于命名空间的 `models` 文件夹，例如 `minecraft:block/cobblestone`。
    - `x` 和 `y`：模型在 x 轴/y 轴上的旋转。仅限于 90 度的步长。每一项可选，默认为 0。
    - `uvlock`：旋转时是否锁定模型的 UV。可选，默认为 false。
    - `weight`：仅对模型对象数组有用。为对象赋予权重，在选择随机模型对象时使用。可选，默认为 1。

相反，在 `multipart` 块内，元素根据方块状态的属性进行组合。此方法主要用于栅栏和墙壁，它们根据布尔属性启用四个方向部分。多部分元素由两部分组成：`when` 块和 `apply` 块。

- `when` 块指定方块状态的字符串表示形式或要应用的元素必须满足的属性列表。这些列表可以命名为 `"OR"` 或 `"AND"`，对其内容执行相应的逻辑操作。单个方块状态和列表值都可以通过用 `|` 分隔来另外指定多个实际值（例如 `facing=east|facing=west`）。
- `apply` 块指定要使用的模型对象或模型对象数组。这与 `variants` 块的工作原理完全相同。

## 调色 {#tinting}

某些块（例如草或树叶）会根据其位置和/或属性更改其纹理颜色。 [模型元素][elements] 可以在其面上指定色调索引，这将允许颜色处理器处理相应的面。代码方面通过两个事件进行工作，一个用于方块颜色处理器，另一个用于物品颜色处理器。它们的工作方式非常相似，所以让我们首先看一下方块处理器：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerBlockColorHandlers(RegisterColorHandlersEvent.Block event) {
    // Parameters are the block's state, the level the block is in, the block's position, and the tint index.
    // The level and position may be null.
    event.register((state, level, pos, tintIndex) -> {
        // Replace with your own calculation. See the BlockColors class for 原版 references.
        // Colors are in ARGB format. Generally, if the tint index is -1, it means that no tinting
        // should take place and a default value should be used instead.
        return 0xFFFFFFFF;
    },
    // A varargs of blocks to apply the tinting to
    EXAMPLE_BLOCK.value(), ...);
}
```

物品处理器的工作原理几乎相同，除了一些命名和 lambda 参数之外：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerItemColorHandlers(RegisterColorHandlersEvent.Item event) {
    // Parameters are the item stack and the tint index.
    event.register((stack, tintIndex) -> {
        // Like above, replace with your own calculation. 原版 values are in the ItemColors class.
        // Also like above, tint index -1 means no tint and should use a default value instead.
        return 0xFFFFFFFF;
    },
    // A varargs of items to apply the tinting to
    EXAMPLE_ITEM.value(), ...);
}
```

请注意，`item/generated` 模型为其各个层指定色调索引 -`layer0` 的色调索引为 0，`layer1` 的色调索引为 1 等。此外，请记住，块物品是物品，而不是块，并且需要物品颜色处理器进行着色。

## 注册其他模型 {#registering-additional-models}

不以某种方式与块或物品关联，但在其他上下文中仍然需要的模型（例如[块实体渲染器][ber]）可以通过 `ModelEvent.RegisterAdditional` 注册：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerAdditional(ModelEvent.RegisterAdditional event) {
    event.register(new ModelResourceLocation(
        // The id of the model
        ResourceLocation.fromNamespaceAndPath("examplemod", "block/example_unused_model"),
        // The string representing what variant of the model this is for
        // In normal 原版, this would be one of three values:
        // - Blocks: The stringified block state
        // - Items: 'inventory' as it is the inventory model
        // - Standalone: 'standalone' as this does not refer to any other model
        "variant_type=true"
    ));

    // An inventory model example
    event.register(ModelResourceLocation.inventory(
        ResourceLocation.fromNamespaceAndPath("examplemod", "item/example_unused_inventory_model")
    ));

    // A standalone model example
    event.register(ModelResourceLocation.standalone(
        ResourceLocation.fromNamespaceAndPath("examplemod", "block/example_unused_standalone_model")
    ));
}
```

[ao]: https://en.wikipedia.org/wiki/Ambient_occlusion
[ber]: ../../../blockentities/ber.md
[bewlr]: ../../../blockentities/ber.md#blockentitywithoutlevelrenderer
[bsfile]: #blockstate-files
[custommodelloader]: modelloaders.md
[elements]: #elements
[event]: ../../../concepts/events.md
[eventhandler]: ../../../concepts/events.md#registering-an-event-handler
[extrafacedata]: #extra-face-data
[iscustomrenderer]: bakedmodel.md#others
[mcwiki]: https://minecraft.wiki
[mcwikiblockstate]: https://minecraft.wiki/w/Tutorials/Models#Block_states
[mcwikimodel]: https://minecraft.wiki/w/Model
[mipmapping]: https://en.wikipedia.org/wiki/Mipmap
[modbus]: ../../../concepts/events.md#event-buses
[overrides]: #overrides
[perspectives]: bakedmodel.md#perspectives
[rendertype]: #render-types
[roottransforms]: #root-transforms
[rl]: ../../../misc/resourcelocation.md
[side]: ../../../concepts/sides.md
[textures]: ../textures.md
[tinting]: #tinting

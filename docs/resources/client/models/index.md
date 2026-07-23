# 模型 {#models}

模型是决定方块或物品视觉形状与纹理的 JSON 文件。一个模型由若干长方体元素组成，每个元素都有各自的尺寸，随后为每个面各自指定一张纹理。

物品使用其 [客户端物品][citems] 所定义的关联模型，而方块则使用 [blockstate 文件][bsfile] 中的关联模型。这些位置相对于 `models` 目录，因此名为 `examplemod:item/example_model` 的模型引用，其定义在 `assets/examplemod/models/item/example_model.json` 的 JSON 中。
 
## 规范 {#specification}

_另见：[Minecraft Wiki][mcwiki] 上的 [Model][mcwikimodel]_

模型是一个 JSON 文件，其根标签中可包含以下可选属性：

- `loader`：NeoForge 新增。设置自定义模型加载器。详见 [模型加载器][custommodelloader]。
- `parent`：设置父模型，形式为相对于 `models` 文件夹的 [资源标识符][rl]。父模型的所有属性都会被应用，随后被声明模型中所设的属性覆盖。常见的父模型包括：
    - `minecraft:block/block`：所有方块模型的公共父模型。
    - `minecraft:block/cube`：所有使用 1x1x1 立方体模型的模型的父模型。
    - `minecraft:block/cube_all`：立方体模型的变体，六个面使用同一张纹理，例如圆石或木板。
    - `minecraft:block/cube_bottom_top`：立方体模型的变体，四个水平面使用同一张纹理，顶面和底面各用单独的纹理。常见例子包括砂岩或錾制石英块。
    - `minecraft:block/cube_column`：立方体模型的变体，具有一个侧面纹理以及底面和顶面纹理。例子包括木质原木，以及石英柱和紫珀柱。
    - `minecraft:block/cross`：使用两个平面、且它们使用同一张纹理的模型，一个顺时针旋转 45°、另一个逆时针旋转 45°，从上往下看形成一个 X（因此得名）。例子包括大多数植物，例如草、树苗和花。
    - `minecraft:item/generated`：经典 2D 平面物品模型的父模型。游戏中大多数物品都使用它。会忽略 `elements` 块，因为它的四边形（quad）是从纹理生成的。
    - `minecraft:item/handheld`：看起来像被玩家真正握在手中的 2D 平面物品模型的父模型。主要由工具使用。它是 `item/generated` 的子模型，因此同样会忽略 `elements` 块。
    - 方块物品通常（但并非总是）在其 [物品模型][itemmodels] 中使用其对应的方块模型。例如，圆石的客户端物品使用 `minecraft:block/cobblestone` 模型。
- `ambientocclusion`：是否启用 [环境光遮蔽][ao]。仅对方块模型有效。默认为 `true`。如果你的自定义方块模型出现奇怪的着色，可以尝试将其设为 `false`。
- `gui_light`：可以是 `"front"` 或 `"side"`。若为 `"front"`，光线来自正面，适用于平面 2D 模型；若为 `"side"`，光线来自侧面，适用于 3D 模型（尤其是方块模型）。默认为 `"side"`。仅对物品模型有效。
- `textures`：一个子对象，将名称（称为材质变量）映射到 `Material`。材质变量随后可在 [元素][elements] 中使用。它们也可以在元素中指定，但可以保持未指定，以便子模型来指定它们。
    - `sprite`：[纹理的位置][textures]。
    - `force_translucent`：当为 `true` 时，强制应用了此纹理的面在“translucent”（半透明）层渲染。当为 `false` 时：
        - 若纹理只有不透明像素（alpha 为 `255`），该面将在“solid”（实心）层渲染
        - 若纹理的像素要么不透明、要么完全透明（alpha 为 `0` 或 `255`），该面将在“cutout”（镂空）层渲染
        - 否则，该面将在“translucent”（半透明）层渲染

:::tip
方块模型还应额外指定一个 `particle` 纹理。该纹理在落到方块上、在方块上奔跑或破坏方块时使用。

物品模型也可以使用层纹理，命名为 `layer0`、`layer1` 等，索引越高的层渲染在索引越低的层之上（例如 `layer1` 会渲染在 `layer0` 之上）。仅当父模型为 `item/generated` 时有效，且最多只支持 5 层（`layer0` 至 `layer4`）。
:::

- `elements`：长方体 [元素][elements] 的列表。
- `display`：一个子对象，持有不同 [视角][perspectives] 下的不同显示选项，可用的键见所链接的文章。仅对物品模型有效，但常在方块模型中指定，以便物品模型能继承这些显示选项。每个视角都是一个可选的子对象，可包含以下选项，按此顺序应用：
    - `translation`：模型的平移，指定为 `[x, y, z]`。
    - `rotation`：模型的旋转，指定为 `[x, y, z]`。
    - `scale`：模型的缩放，指定为 `[x, y, z]`。
    - `right_rotation`：NeoForge 新增。在缩放之后应用的第二次旋转，指定为 `[x, y, z]`。
- `transform`：见 [根变换][roottransforms]。

:::tip
如果你难以弄清楚具体该如何指定某项内容，可以看看某个做了类似事情的原版模型。
:::

### 元素 {#elements}

元素是长方体对象的 JSON 表示。它具有以下属性：

- `from`：长方体起始角的坐标，指定为 `[x, y, z]`。以 1/16 方块为单位。例如，`[0, 0, 0]` 是“左下”角，`[8, 8, 8]` 是中心，`[16, 16, 16]` 是方块的“右上”角。
- `to`：长方体结束角的坐标，指定为 `[x, y, z]`。与 `from` 一样，以 1/16 方块为单位。

:::tip
`from` 和 `to` 中的值被 Minecraft 限制在 `[-16, 32]` 范围内。然而，强烈不建议超出 `[0, 16]`，因为那会导致光照和/或剔除问题。
:::

- `neoforge_data`：见 [额外面数据][extrafacedata]。
- `faces`：一个对象，包含至多 6 个面的数据，分别命名为 `north`、`south`、`east`、`west`、`up` 和 `down`。每个面具有以下数据：
    - `uv`：面的 uv，指定为 `[u1, v1, u2, v2]`，其中 `u1, v1` 是左上角 uv 坐标，`u2, v2` 是右下角 uv 坐标。
    - `texture`：该面所用的纹理。必须是以 `#` 为前缀的纹理变量。例如，如果你的模型有一个名为 `wood` 的纹理，你会用 `#wood` 来引用该纹理。从技术上讲是可选的，若缺失将使用缺失纹理（missing texture）。
    - `rotation`：可选。将纹理顺时针旋转 90、180 或 270 度。
    - `cullface`：可选。告诉渲染引擎，当指定方向上有一个完整方块与之相邻时，跳过对该面的渲染。方向可以是 `north`、`south`、`east`、`west`、`up` 或 `down`。
    - `tintindex`：可选。指定一个 tint 索引，可供颜色处理器使用，详见 [染色][tinting]。默认为 -1，表示不染色。
    - `neoforge_data`：见 [额外面数据][extrafacedata]。

此外，它还可以指定以下可选属性：

- `shade`：仅用于方块模型。可选。该元素的各个面是否应带有与方向相关的着色。默认为 true。
- `rotation`：对象的旋转，指定为一个包含以下数据的子对象：
    - `angle`：旋转角度，以度为单位。
    - `axis`：旋转所绕的轴。目前无法让一个对象绕多于一个轴旋转。
    - `origin`：可选。旋转所绕的原点，指定为 `[x, y, z]`。注意这些是绝对值，即它们不是相对于立方体位置的。若未指定，将使用 `[0, 0, 0]`。

#### 额外面数据 {#extra-face-data}

额外面数据（`neoforge_data`）既可应用于元素，也可应用于元素的单个面。在所有可用的场合它都是可选的。如果同时指定了元素级和面级的额外面数据，面级数据将覆盖元素级数据。额外数据可以指定以下数据：

- `color`：用给定颜色为该面染色。必须是 ARGB 值。可指定为字符串或十进制整数（JSON 不支持十六进制字面量）。默认为 `0xFFFFFFFF`。若颜色值恒定，这可以用作染色的替代方案。
- `block_light`：覆盖此面所用的方块光照值。默认为 0。
- `sky_light`：覆盖此面所用的天空光照值。默认为 0。
- `ambient_occlusion`：为此面禁用或启用环境光遮蔽。默认为模型中所设的值。

### 根变换 {#root-transforms}

在模型顶层添加 `transform` 属性会告诉加载器：应在应用 [blockstate 文件][bsfile] 中的旋转（对于方块模型）或 `display` 块中的变换（对于物品模型）之前，对所有几何体应用一次变换。此项由 NeoForge 添加。

根变换可以用两种方式指定。第一种方式是作为一个名为 `matrix` 的单一属性，包含一个 3x4 变换矩阵（行主序，省略最后一行），以嵌套 JSON 数组的形式给出。该矩阵是平移、左旋转、缩放、右旋转和变换原点按此顺序的复合。示例如下：

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

第二种方式是指定一个 JSON 对象，包含以下条目的任意组合，按此顺序应用：

- `translation`：相对平移。指定为三维向量（`[x, y, z]`），缺省时默认为 `[0, 0, 0]`。
- `rotation` 或 `left_rotation`：绕平移后原点的旋转，在缩放之前应用。默认为不旋转。可用以下方式之一指定：
    - 一个仅含单个“轴到旋转”映射的 JSON 对象，例如 `{"x": 90}`
    - 一个 JSON 对象数组，每个对象含单个“轴到旋转”映射，按其指定顺序应用，例如 `[{"x": 90}, {"y": 45}, {"x": -22.5}]`
    - 一个含三个值的数组，各自指定绕每个轴的旋转，例如 `[90, 45, -22.5]`
    - 一个含四个值的数组，直接指定一个四元数，例如 `[0.38268346, 0, 0, 0.9238795]`（= 绕 X 轴旋转 45 度）
- `scale`：相对于平移后原点的缩放。指定为三维向量（`[x, y, z]`），缺省时默认为 `[1, 1, 1]`。
- `post_rotation` 或 `right_rotation`：绕平移后原点的旋转，在缩放之后应用。默认为不旋转。指定方式与 `rotation` 相同。
- `origin`：用于旋转和缩放的原点。作为最后一步，变换也会移动到此处。既可指定为三维向量（`[x, y, z]`），也可使用三个内置值之一：`"corner"`（= `[0, 0, 0]`）、`"center"`（= `[0.5, 0.5, 0.5]`）或 `"opposing-corner"`（= `[1, 1, 1]`，默认值）。

## Blockstate 文件 {#blockstate-files}

_另见：[Minecraft Wiki][mcwiki] 上的 [Blockstate 文件][mcwikiblockstate]_

游戏使用 blockstate 文件为不同的 [方块状态][blockstates] 分配不同的模型。游戏中注册的每个方块必须恰好有一个 blockstate 文件。为方块状态指定方块模型有三种互斥的方式：通过 variants、通过 multipart，或通过 NeoForge 新增的 definition 类型。

在 `variants` 块中，每个方块状态都有一个元素。这是将方块状态与模型关联起来的主要方式，绝大多数方块都使用它。
- 键是不含方块名的方块状态的字符串表示，例如非含水的顶部台阶为 `"type=top,waterlogged=false"`，无属性的方块为 `""`。值得注意的是，未使用的属性可以省略。例如，如果 `waterlogged` 属性对所选模型没有影响，那么 `type=top,waterlogged=false` 和 `type=top,waterlogged=true` 两个对象可以合并为一个 `type=top` 对象。这也意味着空字符串对每个方块都是有效的。
- 值要么是单个模型对象，要么是模型对象的数组。若使用模型对象数组，将从中随机选择一个模型。一个模型对象由以下数据组成：
    - `type`：NeoForge 新增。设置自定义方块状态模型加载器。详见 [方块状态模型加载器][bsmmodelloader]。
    - `model`：模型文件位置的路径，相对于命名空间的 `models` 文件夹，例如 `minecraft:block/cobblestone`。
    - `x` 和 `y`：模型在 x 轴/y 轴上的旋转。限制为 90 度的步进。各自可选，默认为 0。
    - `uvlock`：旋转时是否锁定模型的 UV。可选，默认为 false。
    - `weight`：仅在模型对象数组中有用。为对象赋予权重，在随机选择模型对象时使用。可选，默认为 1。

相比之下，在 `multipart` 块中，元素是根据方块状态的属性来组合的。此方法主要由栅栏和墙使用，它们根据布尔属性来启用四个方向上的部件。一个 multipart 元素由两部分组成：一个 `when` 块和一个 `apply` 块。

- `when` 块指定要么是方块状态的字符串表示，要么是元素得以应用所必须满足的属性列表。列表可以命名为 `"OR"` 或 `"AND"`，对其内容执行相应的逻辑运算。单个方块状态值和列表值都还可以通过用 `|` 分隔来额外指定多个实际取值（例如 `facing=east|facing=west`）。
- `apply` 块指定要使用的模型对象或模型对象数组。其工作方式与 `variants` 块完全相同。

最后，`neoforge:definition_type` 可以指定一个自定义模型加载器来注册该方块状态文件。详见 [方块状态定义加载器][bsdmodelloader]。

## 客户端物品 {#client-items}

游戏使用 [客户端物品][citems] 为 `ItemStack` 的各种状态分配一个或多个模型。虽然模型 JSON 中有一些物品专用的字段，但客户端物品会根据上下文消费模型来进行渲染，因此它们的大部分信息已被移至各自单独的 [章节][citems]。

## 染色 {#tinting}

某些方块（例如草或树叶）会根据其所在位置和/或属性来改变纹理颜色。[模型元素][elements] 可以在其面上指定一个 tint 索引，这将允许一个颜色处理器来处理相应的面。代码这边通过三个事件工作：一个用于方块 tint 源，一个用于基于生物群系的方块 tint（与方块 tint 源配合使用），一个用于物品 tint 源。那么先来看一个方块 tint 源：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerBlockColorHandlers(RegisterColorHandlersEvent.BlockTintSources event) {
    // Parameters are the block's state, the level the block is in, the block's position, and the tint index.
    // The level and position may be null.
    event.register(
        // A list of tint sources to apply to the block. The 'tintindex' defined in
        // the model indexes into the list.
        List.of(
            // For 'tintindex: 0'.
            // Takes in the block's state.
            state -> {
                // Replace with your own calculation. See the BlockColors class for vanilla references.
                // Colors are in ARGB format.
                return 0xFFFFFFFF;
            },
            // For 'tintindex: 1',
            new BlockTintSource() {

                @Override
                public int color(BlockState state) {
                    // The default tint to apply.
                    return 0xFFFFFFFF;
                }

                @Override
                public int colorInWorld(BlockState state, BlockAndTintGetter level, BlockPos pos) {
                    // The tint to apply when the block is in the world.
                    // Defaults to `color` if not overridden.
                    return 0xFFFFFFFF;
                }

                @Override
                public int colorAsTerrainParticle(BlockState state, BlockAndTintGetter level, BlockPos pos) {
                    // The tint to apply when a `TerrainParticle` is spawned.
                    // Defaults to `colorInWorld` if not overridden.
                    return 0xFFFFFFFF;
                }
            }
        ),
        // A varargs of blocks to apply the tinting to
        EXAMPLE_BLOCK.get(), ...
    );
}
```

下面是一个颜色解析器（color resolver）的示例：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerColorResolvers(RegisterColorHandlersEvent.ColorResolvers event) {
    // Parameters are the current biome, the block's X position, and the block's Z position.
    event.register((biome, x, z) -> {
        // Replace with your own calculation. See the BiomeColors class for vanilla references.
        // Colors are in ARGB format.
        return 0xFFFFFFFF;
    });
}
```

关于物品染色，请参见 [客户端物品文章中的相关章节][itemtints]。

## 注册独立模型 {#registering-standalone-models}

那些不以任何方式与方块或物品相关联、但在其他上下文中仍需使用的模型（例如 [方块实体渲染器][ber]），可以通过 `ModelEvent.RegisterStandalone` 注册：

```java
// This can be any type as long as it can be obtained from the ResolvedModel and the ModelBaker
// The generic type should be whatever is the generic type of the UnbakedStandaloneModel<T>
public static final StandaloneModelKey<QuadCollection> EXAMPLE_KEY = new StandaloneModelKey<>(
    new ModelDebugName() {
        @Override
        public String debugName() {
            // A name for the standalone model
            // Can be any string, but it should contain the mod id
            return "examplemod: Example Model";
        }
    }
);



@SubscribeEvent // on the mod event bus only on the physical client
public static void registerAdditional(ModelEvent.RegisterStandalone event) {
    event.register(
        // The model to get
        EXAMPLE_KEY,
        // An UnbakedStandaloneModel<T> we care about, in this case one that returns a QuadCollection
        // Can use the static methods from SimpleUnbakedStandaloneModel<T> for simplicity
        SimpleUnbakedStandaloneModel.quadCollection(
            // The model id, relative to `assets/<namespace>/models/<path>.json`
            Identifier.fromNamespaceAndPath("examplemod", "block/example_unused_model")
        )
    );
}
```

[ao]: https://en.wikipedia.org/wiki/Ambient_occlusion
[ber]: ../../../blockentities/ber.md
[bsfile]: #blockstate-files
[bsdmodelloader]: modelloaders.md#block-state-definition-loaders
[bsmmodelloader]: modelloaders.md#block-state-model-loaders
[custommodelloader]: modelloaders.md#model-loaders
[elements]: #elements
[event]: ../../../concepts/events.md
[extrafacedata]: #extra-face-data
[citems]: items.md
[itemmodel]: items.md#a-basic-model
[itemtints]: items.md#tinting
[mcwiki]: https://minecraft.wiki
[mcwikiblockstate]: https://minecraft.wiki/w/Tutorials/Models#Block_states
[mcwikimodel]: https://minecraft.wiki/w/Model
[mipmapping]: https://en.wikipedia.org/wiki/Mipmap
[modbus]: ../../../concepts/events.md#event-buses
[perspectives]: modelsystem.md#perspectives
[rendertype]: #render-types
[roottransforms]: #root-transforms
[rl]: ../../../misc/identifier.md
[textures]: ../textures.md
[tinting]: #tinting

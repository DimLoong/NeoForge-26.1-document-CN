import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 客户端物品 {#client-items}

客户端物品（Client Item）是在代码中对某个 `ItemStack` 应如何被提交以在游戏内渲染的表示，用于指定在给定状态下使用哪些模型。客户端物品位于 [`assets` 文件夹][assets]内的 `items` 子目录中，具体位置由 `DataComponents#ITEM_MODEL` 中的相对位置指定。默认情况下，这就是该对象的注册名（例如 `minecraft:apple` 默认位于 `assets/minecraft/items/apple.json`）。

客户端物品存储在 `ModelManager` 中，可通过 `Minecraft.getInstance().modelManager` 访问。随后，你可以调用 `ModelManager#getItemModel` 或 `getItemProperties`，按其 [`Identifier`][rl] 获取客户端物品信息。

:::warning
不要把它们与游戏内[实际被烘焙并真正渲染的模型][models]相混淆。
:::

## 概述 {#overview}

客户端物品的 JSON 可分为两部分：由 `model` 定义的模型，以及由 `properties` 定义的属性。`model` 负责定义在给定上下文中提交 `ItemStack` 进行渲染时使用哪些模型 JSON；而 `properties` 则负责定义渲染器所使用的各项设置。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    // Defines the model to submit for rendering
    "model": {
        "type": "minecraft:model",
        // Points to a model JSON relative to the 'models' directory
        // Located at 'assets/examplemod/models/item/example_item.json'
        "model": "examplemod:item/example_item"
    },
    // Defines some settings to use during the rendering process
    "properties": {
        // When false, disables the animation where the item is raised
        // up towards its normal position on item swap
        "hand_animation_on_swap": false,
        // When true, allows the model to render outside its defined
        // slot bounds (defined in GuiItemRenderState#bounds) in a GUI
        // instead of being scissored
        "oversized_in_gui": false,
        // Applies the scalar to the height of the hand when swapping
        "swap_animation_scale": 1.0
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.register(
        EXAMPLE_ITEM.get(),
        // Defines the model to submit for rendering
        new CuboidItemModelWrapper.Unbaked(
            // Points to a model JSON relative to the 'models' directory
            // Located at 'assets/examplemod/models/item/example_item.json'
            ModelLocationUtils.getModelLocation(EXAMPLE_ITEM.get()),
            Optional.empty(),
            Collections.emptyList()
        ),
        // Defines some settings to use during the rendering process
        new ClientItem.Properties(
            // When false, disables the animation where the item is raised
            // up towards its normal position on item swap
            false,
            // When true, allows the model to render outside its defined
            // slot bounds (defined in GuiItemRenderState#bounds) in a GUI
            // instead of being scissored
            false,
            // Applies the scalar to the height of the hand when swapping
            1.0F
        )
    );
}
```

</TabItem>
</Tabs>

关于物品模型如何被提交以进行渲染的更多信息，可参见[下文][itemmodel]。

## 基础模型 {#a-basic-model}

`model` 中的 `type` 字段决定了如何为该物品选择要提交渲染的模型。最简单的类型由 `minecraft:model`（即 `CuboidItemModelWrapper`）处理，其作用是定义要提交渲染的模型 JSON，路径相对于 `models` 目录（例如 `assets/<namespace>/models/<path>.json`）。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:model",
        // Points to a model JSON relative to the 'models' directory
        // Located at 'assets/examplemod/models/item/example_item.json'
        "model": "examplemod:item/example_item"
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new CuboidItemModelWrapper.Unbaked(
            // Points to a model JSON relative to the 'models' directory
            // Located at 'assets/examplemod/models/item/example_item.json'
            ModelLocationUtils.getModelLocation(EXAMPLE_ITEM.get()),
            Optional.empty(),
            Collections.emptyList()
        )
    );
}
```

</TabItem>
</Tabs>

### 局部变换 {#local-transforms}

大多数客户端物品模型都可以为物品模型指定一个 `Transformation`，类似于模型 JSON。这些 `Transformation` 会在对应显示上下文的模型 JSON 变换之后应用。它通过 `minecraft:model` 类型的 `transformation` 字段设置。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:model",
        // Points to 'assets/examplemod/models/item/example_item.json'
        "model": "examplemod:item/example_item",
        // The transformations to apply after the model JSON transforms.
        "transformation": {
            // The translation of the client item, specified as `[x, y, z]`.
            "translation": [
                0.5,
                0.0,
                0.5
            ],
            // The initial rotation of the client item, specified as:
            // - `[x, y, z, w]`
            // - { angle, [x, y, z] rotation axis }
            "left_rotation": [
                1.0,
                0.0,
                0.0,
                0.0
            ],
            // The scale of the client item, specified as `[x, y, z]`.
            "scale": [
                1.0,
                1.0,
                1.0
            ],
            // The rotation of the client item after scaling, specified as:
            // - `[x, y, z, w]`
            // - { angle, [x, y, z] rotation axis }
            "right_rotation": {
                "angle": 0,
                "axis": [
                    0.0,
                    0.0,
                    0.0
                ]
            }
        }
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new CuboidItemModelWrapper.Unbaked(
            // Points to 'assets/examplemod/models/item/example_item.json'
            ModelLocationUtils.getModelLocation(EXAMPLE_ITEM.get()),
            // The transformations to apply after the model JSON transforms.
            Optional.of(new Transformation(
                // The translation of the client item.
                new Vector3f(0.5f, 0f, 0.5f),
                // The initial rotation of the client item.
                new Quaternionf(1f, 0f, 0f, 0f),
                // The scale of the client item.
                new Vector3f(1f, 1f, 1f),
                // The rotation of the client item after scaling.
                new Quaternionf(new AxisAngle4f(0f, 0f, 0f, 0f))
            )),
            Collections.emptyList()
        )
    );
}
```

</TabItem>
</Tabs>

### 染色 {#tinting}

和大多数模型一样，客户端物品可以根据物品堆叠的属性改变指定纹理的颜色。为此，`minecraft:model` 类型提供了 `tints` 字段，用于定义要应用的不透明颜色。它们被称为 `ItemTintSource`，定义在 `ItemTintSources` 中。它们同样有一个 `type` 字段来定义使用哪个来源。它们所应用到的 `tintindex` 由其在列表中的索引指定。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:model",
        // Points to 'assets/examplemod/models/item/example_item.json'
        "model": "examplemod:item/example_item",
        // A list of tints to apply
        "tints": [
            {
                // For when tintindex: 0
                "type": "minecraft:constant",
                // 0x00FF00 (or pure green)
                "value": 65280
            },
            {
                // For when tintindex: 1
                "type": "minecraft:dye",
                // 0x0000FF (or pure blue)
                // Only is called if `DataComponents#DYED_COLOR` is not set
                "default": 255
            }
        ]
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new CuboidItemModelWrapper.Unbaked(
            // Points to 'assets/examplemod/models/item/example_item.json'
            ModelLocationUtils.getModelLocation(EXAMPLE_ITEM.get()),
            Optional.empty(),
            // A list of tints to apply
            List.of(
                // For when tintindex: 0
                new Constant(
                    // Pure green
                    0x00FF00
                ),
                // For when tintindex: 1
                new Dye(
                    // Pure blue
                    // Only is called if `DataComponents#DYED_COLOR` is not set
                    0x0000FF
                )
            )
        )
    );
}
```

</TabItem>
</Tabs>

创建自己的 `ItemTintSource` 与创建其他任何基于 codec 的注册对象类似。你创建一个实现 `ItemTintSource` 的类，创建一个用于编码和解码该对象的 `MapCodec`，并在 [mod 事件总线][modbus]上通过 `RegisterColorHandlersEvent.ItemTintSources` 将该 codec 注册到其注册表。`ItemTintSource` 只包含一个方法 `calculate`，它接收当前的 `ItemStack`、该物品堆叠所在的世界，以及持有该物品堆叠的实体，返回一个 ARGB 格式的不透明颜色，其中高 8 位为 0xFF。

```java
public record DamageBar(int defaultColor) implements ItemTintSource {

    // The map codec to register
    public static final MapCodec<DamageBar> MAP_CODEC = ExtraCodecs.RGB_COLOR_CODEC.fieldOf("default")
        .xmap(DamageBar::new, DamageBar::defaultColor);

    public DamageBar(int defaultColor) {
        // Make sure the passed in color is opaque
        this.defaultColor = ARGB.opaque(defaultColor);
    }

    @Override
    public int calculate(ItemStack stack, @Nullable ClientLevel level, @Nullable LivingEntity entity) {
        return stack.isDamaged() ? ARGB.opaque(stack.getBarColor()) : defaultColor;
    }

    @Override
    public MapCodec<DamageBar> type() {
        return MAP_CODEC;
    }
}

// In some event handler class
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerItemTintSources(RegisterColorHandlersEvent.ItemTintSources event) {
    event.register(
        // The name to reference as the type
        Identifier.fromNamespaceAndPath("examplemod", "damage_bar"),
        // The map codec
        DamageBar.MAP_CODEC
    )
}
```

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:model",
        // Points to 'assets/examplemod/models/item/example_item.json'
        "model": "examplemod:item/example_item",
        // A list of tints to apply
        "tints": [
            {
                // For when tintindex: 0
                "type": "examplemod:damage_bar",
                // 0x00FF00 (or pure green)
                "default": 65280
            }
        ]
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new CuboidItemModelWrapper.Unbaked(
            // Points to 'assets/examplemod/models/item/example_item.json'
            ModelLocationUtils.getModelLocation(EXAMPLE_ITEM.get()),
            Optional.empty(),
            // A list of tints to apply
            List.of(
                // For when tintindex: 0
                new DamageBar(
                    // Pure green
                    0x00FF00
                )
            )
        )
    );
}
```

</TabItem>
</Tabs>

## 组合模型 {#composite-models}

有时，你可能想为单个物品注册多个模型。这虽然可以直接用[组合模型加载器][composite]实现，但对于物品模型，还有一个自定义的 `minecraft:composite` 类型，它接收一个要提交渲染的模型列表。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:composite",

        // The models to submit for rendering
        // Will be drawn in the order they appear in the list
        "models": [
            {
                "type": "minecraft:model",
                // Points to 'assets/examplemod/models/item/example_item_1.json'
                "model": "examplemod:item/example_item_1"
            },
            {
                "type": "minecraft:model",
                // Points to 'assets/examplemod/models/item/example_item_2.json'
                "model": "examplemod:item/example_item_2"
            }
        ]
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new CompositeModel.Unbaked(
            // The models to submit for rendering
            // Will be drawn in the order they appear in the list
            List.of(
                new CuboidItemModelWrapper.Unbaked(
                    // Points to 'assets/examplemod/models/item/example_item_1.json'
                    Identifier.fromNamespaceAndPath("examplemod", "item/example_item_1"),
                    Optional.empty(),
                    Collections.emptyList()
                ),
                new CuboidItemModelWrapper.Unbaked(
                    // Points to 'assets/examplemod/models/item/example_item_2.json'
                    Identifier.fromNamespaceAndPath("examplemod", "item/example_item_2"),
                    Optional.empty(),
                    Collections.emptyList()
                )
            )
        )
    );
}
```

</TabItem>
</Tabs>

## 属性模型 {#property-models}

某些物品会根据其物品堆叠中存储的数据改变状态（例如拉弓、鞘翅破损、时钟在特定维度中的表现等）。为了让模型能够依据状态变化，物品模型可以指定一个要追踪的属性，并据此条件选择模型。属性模型共有三种不同类型：范围分派（range dispatch）、选择（select）和条件（conditional）。它们分别相当于针对某个浮点数的表达式、switch case 以及布尔值。

### 范围分派模型 {#range-dispatch-models}

范围分派模型让其 type 定义某个 `RangeSelectItemModelProperty`，以获取一个用于切换模型的浮点数。随后每个条目都有一个阈值，浮点数必须大于该阈值才会被提交渲染。所选的模型是阈值最接近且不超过属性值的那一个（例如，若属性值为 `4`，阈值为 `3` 和 `5`，则绘制与 `3` 关联的模型；若属性值为 `6`，则绘制与 `5` 关联的模型）。可用的 `RangeSelectItemModelProperty` 可在 `RangeSelectItemModelProperties` 中找到。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:range_dispatch",

        // The `RangeSelectItemModelProperty` to use
        "property": "minecraft:count",
        // A scalar to multiply to the computed property value
        // If count was 0.3 and scale was 0.2, then the threshold checked would be 0.3*0.2=0.06
        "scale": 1,
        "fallback": {
            // The fallback model to use if no threshold matches
            // Can be any unbaked model type
            "type": "minecraft:model",
            // Points to 'assets/examplemod/models/item/example_item.json'
            "model": "examplemod:item/example_item"
        },

        // Properties defined by `Count`
        // When true, normalizes the count using its max stack size
        "normalize": true,

        // Entries with threshold information
        "entries": [
            {
                // When the count is a third of its current max stack size
                "threshold": 0.33,
                "model": {
                    // Can be any unbaked model type
                    "type": "minecraft:model",
                    // Points to 'assets/examplemod/models/item/example_item_1.json'
                    "model": "examplemod:item/example_item_1"
                }
            },
            {
                // When the count is two thirds of its current max stack size
                "threshold": 0.66,
                "model": {
                    // Can be any unbaked model type
                    "type": "minecraft:model",
                    // Points to 'assets/examplemod/models/item/example_item_2.json'
                    "model": "examplemod:item/example_item_2"
                }
            }
        ]
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new RangeSelectItemModel.Unbaked(
            new Count(
                // When true, normalizes the count using its max stack size
                true
            ),
            // A scalar to multiply to the computed property value
            // If count was 0.3 and scale was 0.2, then the threshold checked would be 0.3*0.2=0.06
            1,
            // Entries with threshold information
            List.of(
                new RangeSelectItemModel.Entry(
                    // When the count is a third of its current max stack size
                    0.33,
                    // Can be any unbaked model type
                    new CuboidItemModelWrapper.Unbaked(
                        // Points to 'assets/examplemod/models/item/example_item_1.json'
                        Identifier.fromNamespaceAndPath("examplemod", "item/example_item_1"),
                        Optional.empty(),
                        Collections.emptyList()
                    )
                ),
                new RangeSelectItemModel.Entry(
                    // When the count is two thirds of its current max stack size
                    0.66,
                    // Can be any unbaked model type
                    new CuboidItemModelWrapper.Unbaked(
                        // Points to 'assets/examplemod/models/item/example_item_2.json'
                        Identifier.fromNamespaceAndPath("examplemod", "item/example_item_2"),
                        Optional.empty(),
                        Collections.emptyList()
                    )
                )
            ),
            // The fallback model to use if no threshold matches
            Optional.of(
                new CuboidItemModelWrapper.Unbaked(
                    // Points to 'assets/examplemod/models/item/example_item.json'
                    ModelLocationUtils.getModelLocation(EXAMPLE_ITEM.get()),
                    Optional.empty(),
                    Collections.emptyList()
                )
            )
        )
    );
}
```

</TabItem>
</Tabs>

创建自己的 `RangeSelectItemModelProperty` 与创建其他任何基于 codec 的注册对象类似。你创建一个实现 `RangeSelectItemModelProperty` 的类，创建一个用于编码和解码该对象的 `MapCodec`，并在 [mod 事件总线][modbus]上通过 `RegisterRangeSelectItemModelPropertyEvent` 将该 codec 注册到其注册表。`RangeSelectItemModelProperty` 只包含一个方法 `get`，它接收当前的 `ItemStack`、该物品堆叠所在的世界、持有该物品堆叠的实体，以及某个种子值，返回一个任意浮点数，供范围分派模型解读。

```java
public record AppliedEnchantments() implements RangeSelectItemModelProperty {

    public static final MapCodec<AppliedEnchantments> MAP_CODEC = MapCodec.unit(new AppliedEnchantments());

    @Override
    public float get(ItemStack stack, @Nullable ClientLevel level, @Nullable ItemOwner owner, int seed) {
        return (float) stack.getTagEnchantments().size();
    }

    @Override
    public MapCodec<AppliedEnchantments> type() {
        return MAP_CODEC;
    }
}

// In some event handler class
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerRangeProperties(RegisterRangeSelectItemModelPropertyEvent event) {
    event.register(
        // The name to reference as the type
        Identifier.fromNamespaceAndPath("examplemod", "applied_enchantments"),
        // The map codec
        AppliedEnchantments.MAP_CODEC
    )
}
```

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:range_dispatch",

        // The `RangeSelectItemModelProperty` to use
        "property": "examplemod:applied_enchantments",
        // A scalar to multiply to the computed property value
        // If count was 0.3 and scale was 0.2, then the threshold checked would be 0.3*0.2=0.06
        "scale": 0.5,
        "fallback": {
            // The fallback model to use if no threshold matches
            // Can be any unbaked model type
            "type": "minecraft:model",
            // Points to 'assets/examplemod/models/item/example_item.json'
            "model": "examplemod:item/example_item"
        },

        // Entries with threshold information
        "entries": [
            {
                // When there is at least one enchantment present
                // Since 1 * the scale 0.5 = 0.5
                "threshold": 0.5,
                "model": {
                    // Can be any unbaked model type
                    "type": "minecraft:model",
                    // Points to 'assets/examplemod/models/item/example_item_1.json'
                    "model": "examplemod:item/example_item_1"
                }
            },
            {
                // When there are at least two enchantments present
                // Since 2 * the scale 0.5 = 1
                "threshold": 1,
                "model": {
                    // Can be any unbaked model type
                    "type": "minecraft:model",
                    // Points to 'assets/examplemod/models/item/example_item_2.json'
                    "model": "examplemod:item/example_item_2"
                }
            }
        ]
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new RangeSelectItemModel.Unbaked(
            new AppliedEnchantments(),
            // A scalar to multiply to the computed property value
            // If count was 0.3 and scale was 0.2, then the threshold checked would be 0.3*0.2=0.06
            0.5,
            // Entries with threshold information
            List.of(
                new RangeSelectItemModel.Entry(
                    // When there is at least one enchantment present
                    0.5,
                    // Can be any unbaked model type
                    new CuboidItemModelWrapper.Unbaked(
                        // Points to 'assets/examplemod/models/item/example_item_1.json'
                        Identifier.fromNamespaceAndPath("examplemod", "item/example_item_1"),
                        Optional.empty(),
                        Collections.emptyList()
                    )
                ),
                new RangeSelectItemModel.Entry(
                    // When there are at least two enchantments present
                    1,
                    // Can be any unbaked model type
                    new CuboidItemModelWrapper.Unbaked(
                        // Points to 'assets/examplemod/models/item/example_item_2.json'
                        Identifier.fromNamespaceAndPath("examplemod", "item/example_item_2"),
                        Optional.empty(),
                        Collections.emptyList()
                    )
                )
            ),
            // The fallback model to use if no threshold matches
            Optional.of(
                new CuboidItemModelWrapper.Unbaked(
                    // Points to 'assets/examplemod/models/item/example_item.json'
                    ModelLocationUtils.getModelLocation(EXAMPLE_ITEM.get()),
                    Optional.empty(),
                    Collections.emptyList()
                )
            )
        )
    );
}
```

</TabItem>
</Tabs>

### 选择模型 {#select-models}

选择模型与范围分派模型类似，但它根据 `SelectItemModelProperty` 所定义的某个值来切换，就像针对枚举的 switch 语句。所选的模型是与 switch case 中的值精确匹配的那一个。可用的 `SelectItemModelProperty` 可在 `SelectItemModelProperties` 中找到。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:select",

        // The `SelectItemModelProperty` to use
        "property": "minecraft:display_context",
        "fallback": {
            // The fallback model to use if no case matches
            // Can be any unbaked model type
            "type": "minecraft:model",
            "model": "examplemod:item/example_item"
        },

        // Switch cases based on Selectable Property
        "cases": [
            {
                // When the display context is `ItemDisplayContext#GUI`
                "when": "gui",
                "model": {
                    // Can be any unbaked model type
                    "type": "minecraft:model",
                    // Points to 'assets/examplemod/models/item/example_item_1.json'
                    "model": "examplemod:item/example_item_1"
                }
            },
            {
                // When the display context is `ItemDisplayContext#FIRST_PERSON_RIGHT_HAND`
                "when": "firstperson_righthand",
                "model": {
                     // Can be any unbaked model type
                    "type": "minecraft:model",
                    // Points to 'assets/examplemod/models/item/example_item_2.json'
                    "model": "examplemod:item/example_item_2"
                }
            }
        ]
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new SelectItemModel.Unbaked(
            new SelectItemModel.UnbakedSwitch(
                // The `SelectItemModelProperty` to use
                new DisplayContext(),
                // Switch cases based on selectable property
                List.of(
                    new SelectItemModel.SwitchCase(
                        // The list of cases to match for this model
                        List.of(ItemDisplayContext.GUI),
                        // Can be any unbaked model type
                        new CuboidItemModelWrapper.Unbaked(
                            // Points to 'assets/examplemod/models/item/example_item_1.json'
                            Identifier.fromNamespaceAndPath("examplemod", "item/example_item_1"),
                            Optional.empty(),
                            Collections.emptyList()
                        )
                    ),
                    new SelectItemModel.SwitchCase(
                        // The list of cases to match for this model
                        List.of(ItemDisplayContext.FIRST_PERSON_RIGHT_HAND),
                        // Can be any unbaked model type
                        new CuboidItemModelWrapper.Unbaked(
                            // Points to 'assets/examplemod/models/item/example_item_2.json'
                            Identifier.fromNamespaceAndPath("examplemod", "item/example_item_2"),
                            Optional.empty(),
                            Collections.emptyList()
                        )
                    )
                )
            ),
            // The fallback model to use if no case matches
            Optional.of(
                new CuboidItemModelWrapper.Unbaked(
                    // Points to 'assets/examplemod/models/item/example_item.json'
                    ModelLocationUtils.getModelLocation(EXAMPLE_ITEM.get()),
                    Optional.empty(),
                    Collections.emptyList()
                )
            )
        )
    );
}
```

</TabItem>
</Tabs>

创建自己的 `SelectItemModelProperty` 与创建基于 codec 的注册对象类似。你创建一个实现 `SelectItemModelProperty<T>` 的类，创建一个用于序列化和反序列化属性值的 `Codec`，创建一个用于编码和解码该对象的 `MapCodec`，并在 [mod 事件总线][modbus]上通过 `RegisterSelectItemModelPropertyEvent` 将该 codec 注册到其注册表。`SelectItemModelProperty` 带有一个泛型 `T`，代表用于切换的值。它只包含一个方法 `get`，它接收当前的 `ItemStack`、该物品堆叠所在的世界、持有该物品堆叠的实体、某个种子值以及该物品的显示上下文，返回一个任意的 `T`，供选择模型解读。

```java
// The select property class
public record StackRarity() implements SelectItemModelProperty<Rarity> {

    // The object to register that contains the relevant codecs
    public static final SelectItemModelProperty.Type<StackRarity, Rarity> TYPE = SelectItemModelProperty.Type.create(
        // The map codec for this property
        MapCodec.unit(new StackRarity()),
        // The codec for the object being selected
        // Used to serialize the case entries ("when": <property value>)
        Rarity.CODEC
    );

    @Nullable
    @Override
    public Rarity get(ItemStack stack, @Nullable ClientLevel level, @Nullable LivingEntity entity, int seed, ItemDisplayContext displayContext) {
        // When null, uses the fallback model
        return stack.get(DataComponents.RARITY);
    }

    @Override
    public SelectItemModelProperty.Type<StackRarity, Rarity> type() {
        return TYPE;
    }
}

// In some event handler class
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerSelectProperties(RegisterSelectItemModelPropertyEvent event) {
    event.register(
        // The name to reference as the type
        Identifier.fromNamespaceAndPath("examplemod", "rarity"),
        // The property type
        StackRarity.TYPE
    )
}
```

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:select",

        // The `SelectItemModelProperty` to use
        "property": "examplemod:rarity",
        "fallback": {
            // The fallback model to use if no case matches
            // Can be any unbaked model type
            "type": "minecraft:model",
            "model": "examplemod:item/example_item"
        },

        // Switch cases based on Selectable Property
        "cases": [
            {
                // When the rarity is `Rarity#UNCOMMON`
                "when": "uncommon",
                "model": {
                    // Can be any unbaked model type
                    "type": "minecraft:model",
                    // Points to 'assets/examplemod/models/item/example_item_1.json'
                    "model": "examplemod:item/example_item_1"
                }
            },
            {
                // When the rarity is `Rarity#RARE`
                "when": "rare",
                "model": {
                     // Can be any unbaked model type
                    "type": "minecraft:model",
                    // Points to 'assets/examplemod/models/item/example_item_2.json'
                    "model": "examplemod:item/example_item_2"
                }
            }
        ]
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new SelectItemModel.Unbaked(
            new SelectItemModel.UnbakedSwitch(
                // The `SelectItemModelProperty` to use
                new StackRarity(),
                // Switch cases based on selectable property
                List.of(
                    new SelectItemModel.SwitchCase(
                        // The list of cases to match for this model
                        List.of(Rarity.UNCOMMON),
                        // Can be any unbaked model type
                        new CuboidItemModelWrapper.Unbaked(
                            // Points to 'assets/examplemod/models/item/example_item_1.json'
                            Identifier.fromNamespaceAndPath("examplemod", "item/example_item_1"),
                            Optional.empty(),
                            Collections.emptyList()
                        )
                    ),
                    new SelectItemModel.SwitchCase(
                        // The list of cases to match for this model
                        List.of(Rarity.RARE),
                        // Can be any unbaked model type
                        new CuboidItemModelWrapper.Unbaked(
                            // Points to 'assets/examplemod/models/item/example_item_2.json'
                            Identifier.fromNamespaceAndPath("examplemod", "item/example_item_2"),
                            Optional.empty(),
                            Collections.emptyList()
                        )
                    )
                )
            ),
            // The fallback model to use if no case matches
            Optional.of(
                new CuboidItemModelWrapper.Unbaked(
                    // Points to 'assets/examplemod/models/item/example_item.json'
                    ModelLocationUtils.getModelLocation(EXAMPLE_ITEM.get()),
                    Optional.empty(),
                    Collections.emptyList()
                )
            )
        )
    );
}
```

</TabItem>
</Tabs>

### 条件模型 {#conditional-models}

条件模型是三者中最简单的。其 type 定义某个 `ConditionalItemModelProperty`，以获取一个用于切换模型的布尔值。所选的模型取决于返回的布尔值为 true 还是 false。可用的 `ConditionalItemModelProperty` 可在 `ConditionalItemModelProperties` 中找到。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:condition",

        // The `ConditionalItemModelProperty` to use
        "property": "minecraft:damaged",

        // What the boolean outcome is
        "on_true": {
            // Can be any unbaked model type
            "type": "minecraft:model",
            // Points to 'assets/examplemod/models/item/example_item_1.json'
            "model": "examplemod:item/example_item_1"
            
        },
        "on_false": {
            // Can be any unbaked model type
            "type": "minecraft:model",
            // Points to 'assets/examplemod/models/item/example_item_2.json'
            "model": "examplemod:item/example_item_2"
        }
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new ConditionalItemModel.Unbaked(
            // The property to check
            new Damaged(),
            // When the boolean is true
            new CuboidItemModelWrapper.Unbaked(
                // Points to 'assets/examplemod/models/item/example_item_1.json'
                Identifier.fromNamespaceAndPath("examplemod", "item/example_item_1"),
                Optional.empty(),
                Collections.emptyList()
            ),
            // When the boolean is false
            new CuboidItemModelWrapper.Unbaked(
                // Points to 'assets/examplemod/models/item/example_item_2.json'
                Identifier.fromNamespaceAndPath("examplemod", "item/example_item_2"),
                Optional.empty(),
                Collections.emptyList()
            )
        )
    );
}
```

</TabItem>
</Tabs>

创建自己的 `ConditionalItemModelProperty` 与创建其他任何基于 codec 的注册对象类似。你创建一个实现 `ConditionalItemModelProperty` 的类，创建一个用于编码和解码该对象的 `MapCodec`，并在 [mod 事件总线][modbus]上通过 `RegisterConditionalItemModelPropertyEvent` 将该 codec 注册到其注册表。`RangeSelectItemModelProperty` 只包含一个方法 `get`，它接收当前的 `ItemStack`、该物品堆叠所在的世界、持有该物品堆叠的实体、某个种子值以及该物品的显示上下文，返回一个任意布尔值，供条件模型解读（`on_true` 或 `on_false`）。

```java
public record BarVisible() implements ConditionalItemModelProperty {

    public static final MapCodec<BarVisible> MAP_CODEC =  MapCodec.unit(new BarVisible());

    @Override
    public boolean get(ItemStack stack, @Nullable ClientLevel level, @Nullable LivingEntity entity, int seed, ItemDisplayContext context) {
        return stack.isBarVisible();
    }

    @Override
    public MapCodec<BarVisible> type() {
        return MAP_CODEC;
    }
}

// In some event handler class
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerConditionalProperties(RegisterConditionalItemModelPropertyEvent event) {
    event.register(
        // The name to reference as the type
        Identifier.fromNamespaceAndPath("examplemod", "bar_visible"),
        // The map codec
        BarVisible.MAP_CODEC
    )
}
```

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:condition",

        // The `ConditionalItemModelProperty` to use
        "property": "examplemod:bar_visible",

        // What the boolean outcome is
        "on_true": {
            // Can be any unbaked model type
            "type": "minecraft:model",
            // Points to 'assets/examplemod/models/item/example_item_1.json'
            "model": "examplemod:item/example_item_1"
            
        },
        "on_false": {
            // Can be any unbaked model type
            "type": "minecraft:model",
            // Points to 'assets/examplemod/models/item/example_item_2.json'
            "model": "examplemod:item/example_item_2"
        }
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new ConditionalItemModel.Unbaked(
            // The property to check
            new BarVisible(),
            // When the boolean is true
            new CuboidItemModelWrapper.Unbaked(
                // Points to 'assets/examplemod/models/item/example_item_1.json'
                Identifier.fromNamespaceAndPath("examplemod", "item/example_item_1"),
                Optional.empty(),
                Collections.emptyList()
            ),
            // When the boolean is false
            new CuboidItemModelWrapper.Unbaked(
                // Points to 'assets/examplemod/models/item/example_item_2.json'
                Identifier.fromNamespaceAndPath("examplemod", "item/example_item_2"),
                Optional.empty(),
                Collections.emptyList()
            )
        )
    );
}
```

</TabItem>
</Tabs>

## 特殊模型 {#special-models}

并非所有模型都能用基础的模型 JSON 表示。有些模型可能包含动态组件，或使用为 [`BlockEntityRenderer`][ber] 创建的现有 `Model`。在这些情况下，可以使用一种特殊模型类型，自行指定要提交的[渲染元素][features]。这种渲染器称为 `SpecialModelRenderer`，其原版实现定义在 `SpecialModelRenderers` 中。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:special",

        // The parent model to read the particle texture and display transformation from
        // Points to 'assets/minecraft/models/item/template_skull.json'
        "base": "minecraft:item/template_skull",
        "model": {
            // The special model renderer to use
            "type": "minecraft:head",

            // Properties defined by `SkullSpecialRenderer.Unbaked`
            // The type of the skull block
            "kind": "wither_skeleton",
            // The texture to use when rendering the head
            // Points to 'assets/examplemod/textures/entity/heads/skeleton_override.png'
            "texture": "examplemod:heads/skeleton_override",
            // The animation float used to animate the head model
            "animation": 0.5
        }
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new SpecialModelWrapper.Unbaked(
            // The parent model to read the particle texture and display transformation from
            // Points to 'assets/minecraft/models/item/template_skull.json'
            Identifier.fromNamespaceAndPath("minecraft", "item/template_skull"),
            // The special model renderer to use
            new SkullSpecialRenderer.Unbaked(
                // The type of the skull block
                SkullBlock.Types.WITHER_SKELETON,
                // The texture to use when rendering the head
                // Points to 'assets/examplemod/textures/entity/heads/skeleton_override.png'
                Optional.of(
                    Identifier.fromNamespaceAndPath("examplemod", "heads/skeleton_override")
                ),
                // The animation float used to animate the head model
                0.5f
            )
        )
    );
}
```

</TabItem>
</Tabs>

创建自己的 `SpecialModelRenderer` 包含三部分：用于提交物品[渲染元素][features]的 `SpecialModelRenderer` 实例、用于读写 JSON 的 `SpecialModelRenderer.Unbaked` 实例，以及供物品使用该渲染器的注册代码（必要时也为方块注册）。

首先是 `SpecialModelRenderer`。它的工作方式与其他任何渲染器类（例如方块实体渲染器、实体渲染器）类似。它应接收提交过程中使用的静态数据（例如 `Model` 子类、纹理的 `SpriteId` 等）。有两个方法需要注意。第一个是 `extractArgument`。它用于只从 `ItemStack` 中提供必要的数据，从而限制 `submit` 方法可用的数据量。

:::note
如果你不确定可能需要哪些数据，可以让它直接返回相应的 `ItemStack`。如果你不需要来自物品堆叠的任何数据，则可以改用 `NoDataSpecialModelRenderer`，它已为你实现了该方法。
:::

接下来是 `submit` 方法。它接收 `extractArgument` 的返回值、姿态栈、用于提交所需渲染元素的收集器、打包光照值、覆盖层纹理、物品堆叠是否带有附魔光效，以及轮廓颜色。所有渲染元素都应在该方法中提交。

```java
public record ExampleSpecialRenderer(SpriteGetter spriteGetter, Model.Simple model, SpriteId sprite) implements SpecialModelRenderer<Boolean> {

    @Nullable
    public Boolean extractArgument(ItemStack stack) {
        // Extract the data to be used
        return stack.isBarVisible();
    }

    // Submit the features of the model
    @Override
    public void submit(Boolean argument, PoseStack poseStack, SubmitNodeCollector collector, int lightCoords, int overlayCoords, boolean hasFoil, int outlineColor) {
        collector.submitModel(
            this.model, Unit.INSTANCE,
            poseStack, this.sprite.renderType(barVisible ? RenderType::entityCutout : RenderType::entitySolid),
            lightCoords, overlayCoords, -1, this.spriteGetter.get(this.sprite), outlineColor, null
        );
    }
}
```

接下来是 `SpecialModelRenderer.Unbaked` 实例。它应包含可从文件读取的数据，用于决定要传入特殊渲染器的内容。它同样包含两个方法：`bake`，用于构造特殊渲染器实例；以及 `type`，用于定义读写文件时所使用的 `MapCodec`。

```java
public record ExampleSpecialRenderer(SpriteGetter spriteGetter, Model.Simple model, SpriteId sprite) implements SpecialModelRenderer<Boolean> {

    // ...

    public record Unbaked(Identifier texture) implements SpecialModelRenderer.Unbaked {

        public static final MapCodec<ExampleSpecialRenderer.Unbaked> MAP_CODEC = Identifier.CODEC.fieldOf("texture")
            .xmap(ExampleSpecialRenderer.Unbaked::new, ExampleSpecialRenderer.Unbaked::texture);

        @Override
        public MapCodec<ExampleSpecialRenderer.Unbaked> type() {
            return MAP_CODEC;
        }

        @Override
        public SpecialModelRenderer<?> bake(SpecialModelRenderer.BakingContext ctx) {
            // Resolve resource location to absolute path
            Identifier textureLoc = this.texture.withPath(path -> "textures/entity/" + path + ".png");

            // Get the model and the sprites to render
            return new ExampleSpecialRenderer(ctx.sprites(), ...);
        }
    }
}
```

最后，我们把这些对象注册到必要的位置。对于客户端物品，这通过 [mod 事件总线][modbus]上的 `RegisterSpecialModelRendererEvent` 完成。如果该特殊渲染器还应作为 `BlockEntityRenderer` 的一部分使用，例如在某种类似物品的上下文中渲染（如末影人手持方块），则应在 [mod 事件总线][modbus]上通过 `RegisterBlockModelsEvent` 为该方块注册一个 `Unbaked` 版本。

```java
// In some event handler class
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerSpecialRenderers(RegisterSpecialModelRendererEvent event) {
    event.register(
        // The name to reference as the type
        Identifier.fromNamespaceAndPath("examplemod", "example_special"),
        // The map codec
        ExampleSpecialRenderer.Unbaked.MAP_CODEC
    );
}

// For rendering a block in an item-like context
// Assume some DeferredBlock<ExampleBlock> EXAMPLE_BLOCK
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerSpecialBlockRenderers(RegisterBlockModelsEvent event) {
    event.register(
        // The unbaked instance to use
        new SpecialBlockModelWrapper.Unbaked(
            new ExampleSpecialRenderer.Unbaked(Identifier.fromNamespaceAndPath("examplemod", "entity/example_special")),
            Optional.empty()
        ),
        // The block to render for
        EXAMPLE_BLOCK.get()
    );
}
```

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "minecraft:special",

        // The parent model to read the particle texture and display transformation from
        // Points to 'assets/minecraft/models/item/template_skull.json'
        "base": "minecraft:item/template_skull",
        "model": {
            // The special model renderer to use
            "type": "examplemod:example_special",

            // Properties defined by `ExampleSpecialRenderer.Unbaked`
            // The texture to use
            // Points to 'assets/examplemod/textures/entity/example/example_texture.png'
            "texture": "examplemod:example/example_texture"
        }
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new SpecialModelWrapper.Unbaked(
            // The parent model to read the particle texture and display transformation from
            // Points to 'assets/minecraft/models/item/template_skull.json'
            Identifier.fromNamespaceAndPath("minecraft", "item/template_skull"),
            // The special model renderer to use
            new ExampleSpecialRenderer.Unbaked(
                // The texture to use
                // Points to 'assets/examplemod/textures/entity/example/example_texture.png'
                Identifier.fromNamespaceAndPath("examplemod", "example/example_texture")
            )
        )
    );
}
```

</TabItem>
</Tabs>

## 动态流体容器 {#dynamic-fluid-container}

NeoForge 添加了一种物品模型，用于构建动态流体容器，它能够在运行时重新贴图以匹配所容纳的流体。

:::note
为了让流体染色作用于流体纹理，相应物品必须附加了 `Capabilities.FluidHandler.ITEM`。如果你的物品没有直接使用 `BucketItem`（也不是其子类型），那么你需要[为你的物品注册该 Capability][capability]。
:::

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "neoforge:fluid_container",

        // The textures used to construct the container
        // These are in reference to the block atlas, so they are relative to the `textures` directory
        "textures": {
            // Sets the model particle sprite
            // If not set, uses the first texture that is not null:
            // - Fluid still texture
            // - Container base texture
            // - Container cover texture, if not used as a mask
            // Points to 'assets/minecraft/textures/item/bucket.png'
            "particle": "minecraft:item/bucket",
            // Sets the texture to use on the first layer, generally the container of the fluid
            // If not set, the layer will not be added
            // Points to 'assets/minecraft/textures/item/bucket.png'
            "base": "minecraft:item/bucket",
            // Sets the texture to use as the mask for the still fluid texture
            // Areas where the fluid is seen should be pure white
            // If not set or the fluid is empty, then the layer is not drawn
            // Points to 'assets/neoforge/textures/item/mask/bucket_fluid.png'
            "fluid": "neoforge:item/mask/bucket_fluid",
            // Sets the texture to use as either
            // - The overlay texture when 'cover_is_mask' is false
            // - The mask to apply to the base texture (should be pure white to see) when 'cover_is_mask' is true
            // If not set or no base texture is set when 'cover_is_mask' is true, then the layer is not drawn
            // Points to 'assets/neoforge/textures/item/mask/bucket_fluid_cover.png'
            "cover": "neoforge:item/mask/bucket_fluid_cover",
        },

        // When true, rotates the model 180 degrees for fluids whose density is negative or zero
        // Defaults to false
        "flip_gas": true,
        // When true, uses the cover texture as a mask for the base texture
        // Defaults to true
        "cover_is_mask": true,
        // When true, sets the lightmap of the fluid texture layer to its max value
        // for fluids whose light level is greater than zero
        // Defaults to true
        "apply_fluid_luminosity": false
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<ExampleFluidContainerItem> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new DynamicFluidContainerModel.Unbaked(
            // The textures used to construct the container
            // These are in reference to the block atlas, so they are relative to the `textures` directory
            new DynamicFluidContainerModel.Textures(
                // Sets the model particle sprite
                // If not set, uses the first texture that is not null:
                // - Fluid still texture
                // - Container base texture
                // - Container cover texture, if not used as a mask
                // Points to 'assets/minecraft/textures/item/bucket.png'
                Optional.of(Identifier.withDefaultNamespace("item/bucket")),
                // Sets the texture to use on the first layer, generally the container of the fluid
                // If not set, the layer will not be added
                // Points to 'assets/minecraft/textures/item/bucket.png'
                Optional.of(Identifier.withDefaultNamespace("item/bucket")),
                // Sets the texture to use as the mask for the still fluid texture
                // Areas where the fluid is seen should be pure white
                // If not set or the fluid is empty, then the layer is not rendered
                // Points to 'assets/neoforge/textures/item/mask/bucket_fluid.png'
                Optional.of(Identifier.fromNamespaceAndPath("neoforge", "item/mask/bucket_fluid")),
                // Sets the texture to use as either
                // - The overlay texture when 'cover_is_mask' is false
                // - The mask to apply to the base texture (should be pure white to see) when 'cover_is_mask' is true
                // If not set or no base texture is set when 'cover_is_mask' is true, then the layer is not rendered
                // Points to 'assets/neoforge/textures/item/mask/bucket_fluid_cover.png'
                Optional.of(Identifier.fromNamespaceAndPath("neoforge", "item/mask/bucket_fluid_cover"))
            ),
            // When true, rotates the model 180 degrees
            // Defaults to false
            true,
            // When true, uses the cover texture as a mask for the base texture
            // Defaults to true
            true,
            // When true, sets the lightmap of the fluid texture layer to its max value
            // Defaults to true
            false
        )
    );
}
```

</TabItem>
</Tabs>

## 手动提交物品进行渲染 {#manually-submitting-an-item-for-rendering}

如果需要在 `BlockEntityRenderer` 或 `EntityRenderer` 等位置手动提交物品的[渲染元素][features]，可以分三步完成。首先，由相应的渲染器创建 `ItemStackRenderState`，用于保存物品堆叠的状态。然后，调用 `ItemModelResolver` 的相应方法，根据当前要提交的物品更新该状态。最后，通过 `ItemStackRenderState#submit` 提交物品。

`ItemStackRenderState` 负责追踪绘制所用的数据。每个“模型”都拥有自己的 `ItemStackRenderState.LayerRenderState`，其中包含要渲染的 `BakedQuad`，以及它的渲染类型、附魔光效状态、染色信息、动画标志、范围（extents）以及所用的任何特殊渲染器。图层通过 `newLayer` 方法创建，并通过 `clear` 方法清空以便渲染。如果使用了预定数量的图层，则用 `ensureCapacity` 确保有足够数量的 `LayerRenderStates` 以正确渲染。

:::note
[界面][screens]使用子类 `TrackingItemStackRenderState` 来保存模型标识元素，以便跨帧缓存渲染状态。
:::

`ItemModelResolver` 负责更新 `ItemStackRenderState`。这通过以下方法完成：生物实体持有的物品用 `updateForLiving`，其他类型实体持有的物品用 `updateForNonLiving`，其余所有情况用 `updateForTopItem`。这些方法接收渲染状态、要渲染的物品堆叠以及当前显示上下文。其余参数则更新关于所持之手、世界、物品持有者和种子值的信息。每个方法都会先调用 `ItemStackRenderState#clear`，再对从 `DataComponents#ITEM_MODEL` 获取的 `ItemModel` 调用 `update`。如果你不在某个渲染器上下文中（例如 `BlockEntityRenderer`、`EntityRenderer`），也总是可以通过 `Minecraft#getItemModelResolver` 获取 `ItemModelResolver`。

## 自定义物品模型定义 {#custom-item-model-definitions}

创建自己的 `ItemModel` 分为三部分：用于更新渲染状态的 `ItemModel` 实例、用于读写 JSON 的 `ItemModel.Unbaked` 实例，以及注册以使用该 `ItemModel`。

:::warning
请务必确认你所需的物品模型无法用上文已有的系统实现。在大多数情况下，无需创建自定义 `ItemModel`。
:::

首先是 `ItemModel`。它负责更新 `ItemStackRenderState`，使物品被正确绘制。它应接收提交过程中使用的静态数据（例如 `BakedQuad` 列表、属性信息等）。唯一的方法是 `update`，它接收渲染状态、物品堆叠、模型解析器、显示上下文、世界、物品持有者以及某个种子值，用于更新 `ItemStackRenderState`。`ItemStackRenderState` 应是唯一被修改的参数，其余参数都应视为只读数据。

```java
public record ExampleModelWrapper(QuadCollection quads, List<ItemTintSource> tints, ModelRenderProperties properties, Matrix4fc transformation) implements ItemModel {

    // Update the render state
    @Override
    public void update(ItemStackRenderState state, ItemStack stack, ItemModelResolver resolver, ItemDisplayContext displayContext, @Nullable ClientLevel level, @Nullable ItemOwner owner, int seed) {
        // Set the identity used by the model
        state.appendModelIdentityElement(this);

        // Create a new layer
        ItemStackRenderState.LayerRenderState layerState = state.newLayer();

        // Sets the foil to use
        if (stack.hasFoil()) {
            layerState.setFoilType(ItemStackRenderState.FoilType.STANDARD);
            state.appendModelIdentityElement(ItemStackRenderState.FoilType.STANDARD);
        }


        // Apply the tint sources
        int tintSize = this.tints.size();
        int[] tintLayers = layerState.prepareTintLayers(tintSize);

        for (int idx = 0; idx < tintSize; idx++) {
            int tintColor = this.tints.get(idx).calculate(stack, level, owner.asLivingEntity());
            tintLayers[idx] = tintColor;
            state.appendModelIdentityElement(tintColor);
        }

        // Computes the bounds of the model
        // Used for GUI render bounds (when oversized) and item entity bobbing
        layerState.setExtents(CuboidItemModelWrapper.computeExtents(this.quads.getAll()));

        // Set the local transforms to apply for the client item
        layerState.setLocalTransform(this.transformation);

        // Set other common model properties
        this.properties.applyToLayer(layerState, displayContext);

        // Adds the quads to submit
        layerState.prepareQuadList().addAll(this.quads.getAll());

        // Set animated if it has the associated material flag
        if (this.quads.hasMaterialFlag(BakedQuad.FLAG_ANIMATED)) {
            layerState.setAnimated();
        }
    }
}
```

接下来是 `ItemModel.Unbaked` 实例。它应包含可从文件读取的数据，用于决定要传入物品模型的内容。它同样包含两个方法：`bake`，用于构造 `ItemModel` 实例；以及 `type`，用于定义读写文件时所使用的 `MapCodec`。

```java
public record ExampleModelWrapper(QuadCollection quads, List<ItemTintSource> tints, ModelRenderProperties properties, Matrix4fc transformation) implements ItemModel {

    // ...

     public record Unbaked(Identifier model, List<ItemTintSource> tints, Optional<Transformation> transformation) implements ItemModel.Unbaked {
        // The map codec to register
        public static final MapCodec<ExampleModelWrapper.Unbaked> MAP_CODEC = RecordCodecBuilder.mapCodec(instance ->
            instance.group(
                Identifier.CODEC.fieldOf("model").forGetter(ExampleModelWrapper.Unbaked::model),
                ItemTintSources.CODEC.listOf().optionalFieldOf("tints", List.of()).forGetter(ExampleModelWrapper.Unbaked::tints)
                Transformation.EXTENDED_CODEC.optionalFieldOf("transformation").forGetter(ExampleModelWrapper.Unbaked::transformation)
            )
            .apply(instance, ExampleModelWrapper.Unbaked::new)
        );

        @Override
        public void resolveDependencies(ResolvableModel.Resolver resolver) {
            // Mark all dependencies for this item model
            resolver.markDependency(this.model);
        }

        @Override
        public ItemModel bake(ItemModel.BakingContext context, Matrix4fc parentTransform) {
            // Get the baked quads and return
            ModelBaker baker = context.blockModelBaker();
            ResolvedModel resolvedModel = baker.getModel(this.model);
            TextureSlots slots = resolvedModel.getTopTextureSlots();

            return new ExampleModelWrapper(
                resolvedModel.bakeTopGeometry(slots, baker, BlockModelRotation.IDENTITY),
                this.tints,
                ModelRenderProperties.fromResolvedModel(baker, resolvedModel, slots),
                Transformation.compose(parentTransform, this.transformation)
            );
        }

        @Override
        public MapCodec<ExampleModelWrapper.Unbaked> type() {
            return MAP_CODEC;
        }
    }
}
```

然后，我们在 [mod 事件总线][modbus]上通过 `RegisterItemModelsEvent` 注册该 map codec。

```java
// In some event handler class
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerItemModels(RegisterItemModelsEvent event) {
    event.register(
        // The name to reference as the type
        Identifier.fromNamespaceAndPath("examplemod", "render_type"),
        // The map codec
        ExampleModelWrapper.Unbaked.MAP_CODEC
    )
}
```

最后，我们就可以在 JSON 中使用该 `ItemModel`，或将其作为数据生成流程的一部分。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some item 'examplemod:example_item'
// JSON at 'assets/examplemod/items/example_item.json'
{
    "model": {
        "type": "examplemod:render_type",
        // Points to 'assets/examplemod/models/item/example_item.json'
        "model": "examplemod:item/example_item",
        // Any tints to apply to the model texture
        "tints": []
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Assume there is some DeferredItem<Item> EXAMPLE_ITEM
// Within an extended ModelProvider
@Override
protected void registerModels(BlockModelGenerators blockModels, ItemModelGenerators itemModels) {
    itemModels.itemModelOutput.accept(
        EXAMPLE_ITEM.get(),
        new ExampleModelWrapper.Unbaked(
            // Points to 'assets/examplemod/models/item/example_item.json'
            ModelLocationUtils.getModelLocation(EXAMPLE_ITEM.get()),
            // Any tints to apply to the model texture
            List.of(),
            // The transformations to apply after the model JSON transforms
            Optional.empty()
        )
    );
}
```

</TabItem>
</Tabs>

[assets]: ../../index.md#assets
[ber]: ../../../blockentities/ber.md
[capability]: ../../../inventories/capabilities.md#registering-capabilities
[composite]: modelloaders.md#composite-model
[features]: ../../../rendering/feature.md
[itemmodel]: #manually-submitting-an-item-for-rendering
[modbus]: ../../../concepts/events.md#event-buses
[models]: modelsystem.md
[rl]: ../../../misc/identifier.md
[screens]: ../../../rendering/screens.md#items

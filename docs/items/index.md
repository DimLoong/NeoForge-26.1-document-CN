# 物品 {#items}

物品与方块一样，都是 Minecraft 的核心组成部分。方块构成了你周围的世界，而物品则存在于各类物品栏之中。

## 物品到底是什么？ {#what-even-is-an-item}

在深入创建物品之前，理解物品究竟是什么，以及它与诸如[方块][block]之类的东西有何区别，是很重要的。我们用一个例子来说明：

- 在世界中，你遇到一个泥土方块并想挖掉它。这是一个**方块**，因为它被放置在世界里。（严格来说，它并不是一个方块，而是一个方块状态。更详细的信息请参阅[方块状态一文][blockstates]。）
    - 并非所有方块在被破坏时都会掉落自身（例如树叶），更多信息请参阅[战利品表][loottables]一文。
- 一旦你[挖掉了这个方块][breaking]，它就会被移除（即被替换为空气方块），泥土随之掉落。掉落的泥土是一个物品**[实体][entity]**。这意味着，和其他实体（猪、僵尸、箭等）一样，它天然会受到水流推动、被火与熔岩烧毁等因素的影响。
- 一旦你捡起这个物品实体，它就会变成你物品栏中的一个**物品堆叠**。简单来说，物品堆叠是某个物品的一个实例，并附带一些额外信息，例如堆叠数量。
- 物品堆叠由其对应的**物品**（也就是我们正在创建的东西）作为支撑。物品持有[数据组件][datacomponents]，其中包含所有物品堆叠初始化时所依据的默认信息（例如，每把铁剑的最大耐久度都是 250），而物品堆叠可以修改这些数据组件，从而让同一物品的两个不同堆叠拥有不同的信息（例如，一把铁剑还剩 100 次使用，另一把铁剑还剩 200 次使用）。关于哪些工作通过物品完成、哪些工作通过物品堆叠完成的更多信息，请继续阅读。
    - 物品与物品堆叠之间的关系，大致等同于[方块][block]与[方块状态][blockstates]之间的关系，即方块状态始终由方块作为支撑。这个类比并不算十分准确（例如物品堆叠并不是单例），但它能让你对这里的概念有个基本的认识。

## 创建一个物品 {#creating-an-item}

既然我们已经理解了物品是什么，那就来创建一个吧！

和基础方块一样，对于不需要特殊功能的基础物品（比如木棍、糖等），可以直接使用 `Item` 类。为此，在注册时用一个 `Item.Properties` 参数实例化 `Item`。这个 `Item.Properties` 参数可以通过 `Item.Properties#of` 创建，并可通过调用其方法进行自定义：

- `setId` —— 设置物品的资源键。
    - 每个物品都**必须**设置此项；否则将抛出异常。
- `overrideDescription` —— 设置物品的翻译键。创建出的 `Component` 会存储在 `DataComponents#ITEM_NAME` 中。
- `useBlockDescriptionPrefix` —— 便捷辅助方法，它以翻译键 `block.<modid>.<registry_name>` 调用 `overrideDescription`。任何 `BlockItem` 都应当调用此方法。
- `requiredFeatures` —— 设置该物品所需的特性标志。这主要用于原版在小版本中的特性锁定系统。不建议使用它，除非你要与原版通过特性标志锁定的某个系统进行集成。
- `stacksTo` —— 设置该物品的最大堆叠数量（通过 `DataComponents#MAX_STACK_SIZE`）。默认为 64。例如末影珍珠或其他只能堆叠到 16 的物品会用到它。
- `durability` —— 设置该物品的耐久度（通过 `DataComponents#MAX_DAMAGE`），并将初始损耗设为 0（通过 `DataComponents#DAMAGE`）。默认为 0，即表示“无耐久度”。例如铁制工具在此使用 250。注意，设置耐久度会自动将最大堆叠数量锁定为 1。
- `fireResistant` —— 使使用该物品的物品实体免疫火与熔岩（通过 `DataComponents#FIRE_RESISTANT`）。各种下界合金物品会用到它。
- `rarity` —— 设置该物品的稀有度（通过 `DataComponents#RARITY`）。目前这只是改变物品的颜色。`Rarity` 是一个枚举，包含四个值：`COMMON`（白色，默认）、`UNCOMMON`（黄色）、`RARE`（青色）和 `EPIC`（浅紫色）。注意 Mod 可能会添加更多稀有度类型。
- `setNoCombineRepair` —— 禁用该物品的砂轮修复与合成网格修复。原版未使用。
- `jukeboxPlayable` —— 设置放入唱片机时要播放的数据包 `JukeboxSong` 的资源键。
- `food` —— 设置该物品的 [`FoodProperties`][food]（通过 `DataComponents#FOOD`）。

若需示例，或想查看 Minecraft 所使用的各种数值，可参阅 `Items` 类。

### 剩余物与冷却 {#remainders-and-cooldowns}

物品可以拥有一些额外属性，它们在物品被使用时生效，或者在一段设定的时间内阻止物品被使用：

- `craftRemainder` —— 设置该物品的合成剩余物。原版用它来处理装满的桶，这些桶在合成后会留下空桶。
- `usingConvertsTo` —— 设置物品通过 `Item#use`、`IItemExtension#finishUsingItem` 或 `Item#releaseUsing` 使用完毕后要返回的物品。该 `ItemStack` 存储在 `DataComponents#USE_REMAINDER` 中。
- `useCooldown` —— 设置物品再次可用之前需要经过的秒数（通过 `DataComponents#USE_COOLDOWN`）。

### 工具与盔甲 {#tools-and-armor}

有些物品的行为类似[工具][tools]和[盔甲][armor]。它们通过一系列物品属性构建而成，只有部分用法委托给其关联的类：

- `enchantable` —— 设置堆叠的最大[附魔][enchantment]值，使物品可被附魔（通过 `DataComponents#ENCHANTABLE`）。
- `repairable` —— 设置可用于修复该物品耐久度的物品或标签（通过 `DataComponents#REPAIRABLE`）。物品必须具有耐久度相关组件，且不具有 `DataComponents#UNBREAKABLE`。
- `equippable` —— 设置该物品可装备到的槽位（通过 `DataComponents#EQUIPPABLE`）。
- `equippableUnswappable` —— 与 `equippable` 相同，但禁用通过使用物品按钮（默认为右键）进行的快速切换。

更多信息可在其相关页面上找到。

### 更多功能 {#more-functionality}

直接使用 `Item` 只能实现非常基础的物品。如果你想添加功能，例如右键交互，则需要一个继承 `Item` 的自定义类。`Item` 类有许多可被重写以实现不同行为的方法；更多信息请参阅 `Item` 和 `IItemExtension` 类。

物品最常见的两种用途是左键点击和右键点击。由于它们的复杂性以及涉及其他系统，它们在单独的[交互一文][interactions]中讲解。

### `DeferredRegister.Items` {#deferredregisteritems}

所有注册表都使用 `DeferredRegister` 来注册其内容，物品也不例外。然而，由于添加新物品是绝大多数 Mod 的一项基础功能，NeoForge 提供了 `DeferredRegister.Items` 辅助类，它继承自 `DeferredRegister<Item>` 并提供了一些物品专用的辅助方法：

```java
public static final DeferredRegister.Items ITEMS = DeferredRegister.createItems(ExampleMod.MOD_ID);

public static final DeferredItem<Item> EXAMPLE_ITEM = ITEMS.registerItem(
    "example_item",
    Item::new, // The factory that the properties will be passed into.
    props -> props // A unary operator of the properties to use.
);
```

在内部，它只是通过把属性参数应用到所提供的物品工厂（通常是构造函数）上，来调用 `ITEMS.register("example_item", registryName -> new Item(new Item.Properties().setId(ResourceKey.create(Registries.ITEM, registryName))))`。id 会在属性上被设置。

如果你想使用 `Item::new`，可以完全省略工厂参数，改用 `simple` 方法变体：

```java
public static final DeferredItem<Item> EXAMPLE_ITEM = ITEMS.registerSimpleItem(
    "example_item",
    props -> props // A unary operator of the properties to use.
);
```

这与前一个示例的效果完全相同，只是稍微短一些。当然，如果你想使用 `Item` 的子类而非 `Item` 本身，那就必须改用前一种方法。

这两个方法还都有省略 `new Item.Properties()` 参数的重载：

```java
public static final DeferredItem<Item> EXAMPLE_ITEM = ITEMS.registerItem("example_item", Item::new);

// Variant that also omits the Item::new parameter
public static final DeferredItem<Item> EXAMPLE_ITEM = ITEMS.registerSimpleItem("example_item");
```

最后，方块物品也有其快捷方式。除了 `setId`，这些方法还会调用 `useBlockDescriptionPrefix`，将翻译键设为方块所用的翻译键：

```java
public static final DeferredItem<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    "example_block",
    ExampleBlocksClass.EXAMPLE_BLOCK,
    props -> props
);

// Variant that omits the properties parameter:
public static final DeferredItem<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    "example_block",
    ExampleBlocksClass.EXAMPLE_BLOCK
);

// Variant that omits the name parameter, instead using the block's registry name:
public static final DeferredItem<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    // Must be an instance of `Holder<Block>`
    // DeferredBlock<T> also works
    ExampleBlocksClass.EXAMPLE_BLOCK,
    props -> props
);

// Variant that omits both the name and the properties:
public static final DeferredItem<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    // Must be an instance of `Holder<Block>`
    // DeferredBlock<T> also works
    ExampleBlocksClass.EXAMPLE_BLOCK
);
```

:::note
如果你把注册的方块保存在一个单独的类中，则应当在类加载物品类之前先类加载方块类。
:::

### 资源 {#resources}

如果你注册了物品并获取到它（通过 `/give` 或[创造模式物品栏标签页][creativetabs]），你会发现它缺少合适的模型和纹理。这是因为纹理和模型由 Minecraft 的资源系统处理。

对于每一个物品，你都需要添加——或[生成][datagen]——以下内容的 JSON 文件：

- 一个[客户端物品][citems]及其关联的[纹理][texture]
- 一个[翻译][i18n]
- 一个[配方][recipes]（可选）
- 一些物品[标签][tags]（可选）

对于上述所有内容，也可参考相似的原版方块所使用的文件和数据生成器。

## `ItemStack` {#itemstacks}

和方块与方块状态一样，大多数你以为会用到 `Item` 的地方，实际上用的都是 `ItemStack`。`ItemStack` 表示容器（例如物品栏）中由一个或多个物品组成的堆叠。同样地，和方块与方块状态一样，方法应当由 `Item` 重写，并在 `ItemStack` 上调用，而 `Item` 中许多方法都会传入一个 `ItemStack` 实例。

一个 `ItemStack` 由三个主要部分组成：

- 它所表示的 `Item`，可通过 `ItemStack#getItem` 获取，或用 `getItemHolder` 获取 `Holder<Item>`。
- 堆叠数量，通常在 1 到 64 之间，可通过 `getCount` 获取，并通过 `setCount` 或 `shrink` 改变。
- [数据组件][datacomponents]映射，其中存储着堆叠专属的数据。可通过 `getComponents` 获取。组件值通常通过 `has`、`get`、`set`、`update` 和 `remove` 来访问和修改。

要创建一个新的 `ItemStack`，调用 `new ItemStack(Item)`，传入作为支撑的物品。默认情况下，这会使用数量 1 且无 NBT 数据；如有需要，也有接受数量和 NBT 数据的构造函数重载。注意，在组件被绑定之前、或世界存在之前，`ItemStack` 无法存在。在此之前，你应当使用下文详述的 `ItemStackTemplate`。

`ItemStack` 是可变对象（见下文），然而有时需要把它们当作不可变对象来对待。如果你需要修改一个应被视作不可变的 `ItemStack`，可以用 `#copy` 克隆该堆叠，或在需要指定堆叠数量时用 `#copyWithCount`。

如果你想表示一个堆叠不含任何物品，使用 `ItemStack.EMPTY`。如果你想检查一个 `ItemStack` 是否为空，调用 `#isEmpty`。

### `ItemStack` 的可变性 {#mutability-of-itemstacks}

`ItemStack` 是可变对象。这意味着，如果你调用例如 `#setCount` 或任何数据组件映射方法，`ItemStack` 本身就会被修改。原版大量利用了 `ItemStack` 的可变性，多个方法都依赖于此。例如，`#split` 会从被调用的堆叠中拆分出给定数量，在此过程中既修改调用者本身，又返回一个新的 `ItemStack`。

然而，这有时会在同时处理多个 `ItemStack` 时导致问题。最常见的情形出现在处理物品栏槽位时，因为你既要考虑当前被光标选中的 `ItemStack`，也要考虑你试图向其中插入/从中取出的 `ItemStack`。

:::tip
拿不准时，宁可稳妥也别冒险，直接 `#copy` 该堆叠。
:::

## `ItemStackTemplate` {#itemstacktemplates}

`ItemStackTemplate` 是 `ItemStack` 的不可变形式，通常表示不可变上下文中的一个堆叠，例如配方。模板包含构成 `ItemStack` 的基本要素：持有的 holder `Item`、堆叠数量，以及物品所拥有的[数据组件][datacomponents]（以补丁形式存储）。

要创建一个新的 `ItemStackTemplate`，调用某个 `new ItemStackTemplate(...)` 方法，传入 `Item` 以及其他所需要素。然后，当需要一个堆叠时，可通过 `ItemStackTemplate#create` 创建出一个 `ItemStack`。

### JSON 表示 {#json-representation}

在许多情形下，例如[配方][recipes]中，`ItemStackTemplate` 需要表示为 JSON 对象。物品堆叠模板的 JSON 表示如下所示：

```json5
{
    // The item ID. Required.
    "id": "minecraft:dirt",
    // The item stack count [1, 99]. Optional, defaults to 1.
    "count": 4,
    // A map of data components. Optional, defaults to an empty map.
    "components": {
        "minecraft:enchantment_glint_override": true
    }
}
```

## `ItemInstance` {#iteminstance}

`ItemInstance` 是一个由 `ItemStack` 和 `ItemStackTemplate` 共同实现的父接口。一般来说，`ItemStack` 和 `ItemStackTemplate` 用于彼此隔离的上下文中。然而，当堆叠与模板可以互换使用时（例如堆叠/模板中的物品数量），就会改用 `ItemInstance` 父接口，而非某个具体类型。

`ItemInstance` 提供了用于检查 `Item`（`#is`）、堆叠数量（`count`），以及通过 `DataComponentGetter` 读取数据组件的通用方法。

## 创造模式物品栏标签页 {#creative-tabs}

默认情况下，你的物品只能通过 `/give` 获得，而不会出现在创造模式物品栏中。让我们来改变这一点！

将物品加入创造模式菜单的方式，取决于你想把它加到哪个标签页。

### 已有的创造模式标签页 {#existing-creative-tabs}

:::note
此方法用于把你的物品加入 Minecraft 的标签页，或加入其他 Mod 的标签页。要把物品加入你自己的标签页，请见下文。
:::

可通过 `BuildCreativeModeTabContentsEvent` 将物品加入某个已有的 `CreativeModeTab`，该事件在[模组事件总线][modbus]上触发，且仅在[逻辑客户端][sides]上触发。通过调用 `event#accept` 来添加物品。

```java
//MyItemsClass.MY_ITEM is a Supplier<? extends Item>, MyBlocksClass.MY_BLOCK is a Supplier<? extends Block>
@SubscribeEvent // on the mod event bus
public static void buildContents(BuildCreativeModeTabContentsEvent event) {
    // Is this the tab we want to add to?
    if (event.getTabKey() == CreativeModeTabs.INGREDIENTS) {
        event.accept(MyItemsClass.MY_ITEM.get());
        // Accepts an ItemLike. This assumes that MY_BLOCK has a corresponding item.
        event.accept(MyBlocksClass.MY_BLOCK.get());
    }
}
```

该事件还提供了一些额外信息，例如用 `getFlags` 获取已启用的特性标志列表，或用 `hasPermissions` 检查玩家是否有权限查看管理员物品标签页。

### 自定义创造模式标签页 {#custom-creative-tabs}

`CreativeModeTab` 是一种注册表，这意味着自定义 `CreativeModeTab` 必须被[注册][registering]。创建创造模式标签页使用构建器系统，构建器可通过 `CreativeModeTab#builder` 获取。该构建器提供了设置标题、图标、默认物品以及许多其他属性的选项。此外，NeoForge 还提供了额外的方法来自定义标签页的图像、标签文字与槽位颜色、标签页应排列在何处等。

```java
//CREATIVE_MODE_TABS is a DeferredRegister<CreativeModeTab>
public static final Supplier<CreativeModeTab> EXAMPLE_TAB = CREATIVE_MODE_TABS.register("example", () -> CreativeModeTab.builder()
    //Set the title of the tab. Don't forget to add a translation!
    .title(Component.translatable("itemGroup." + MOD_ID + ".example"))
    //Set the icon of the tab.
    .icon(() -> new ItemStack(MyItemsClass.EXAMPLE_ITEM.get()))
    //Add your items to the tab.
    .displayItems((params, output) -> {
        output.accept(MyItemsClass.MY_ITEM.get());
        // Accepts an ItemLike. This assumes that MY_BLOCK has a corresponding item.
        output.accept(MyBlocksClass.MY_BLOCK.get());
    })
    .build()
);
```

## `ItemLike` {#itemlike}

`ItemLike` 是原版中由 `Item` 和[`Block`][block]实现的接口。它定义了 `#asItem` 方法，该方法返回对象实际内容的物品表示：`Item` 直接返回自身，而 `Block` 在可用时返回其关联的 `BlockItem`，否则返回 `Blocks.AIR`。`ItemLike` 用于各种不关心物品“来源”的场景，例如许多[数据生成器][datagen]中。

你也可以在自己的自定义对象上实现 `ItemLike`。只需重写 `#asItem` 即可。

[armor]: armor.md
[block]: ../blocks/index.md
[blockstates]: ../blocks/states.md
[breaking]: ../blocks/index.md#breaking-a-block
[citems]: ../resources/client/models/items.md
[creativetabs]: #creative-tabs
[datacomponents]: datacomponents.md
[datagen]: ../resources/index.md#data-generation
[enchantment]: ../resources/server/enchantments/index.md#enchantment-costs-and-levels
[entity]: ../entities/index.md
[food]: consumables.md#food
[hunger]: https://minecraft.wiki/w/Hunger#Mechanics
[interactions]: interactions.md
[loottables]: ../resources/server/loottables/index.md
[modbus]: ../concepts/events.md#event-buses
[recipes]: ../resources/server/recipes/index.md
[registering]: ../concepts/registries.md#methods-for-registering
[sides]: ../concepts/sides.md
[tools]: tools.md
[datagen]: ../resources/index.md#data-generation
[i18n]: ../resources/client/i18n.md
[texture]: ../resources/client/textures.md
[tags]: ../resources/server/tags.md

# 物品 {#items}

物品和方块一样，都是 Minecraft 的核心组成部分。方块构筑起你周围的世界，而物品则存在于物品栏之中。

## 物品到底是什么？ {#what-even-is-an-item}

在深入创建物品之前，先要弄清楚物品究竟是什么，以及它和[方块][block]之类的东西有何区别。我们用一个例子来说明：

- 在世界中，你遇到一个泥土方块并想把它挖掉。它是一个**方块**，因为它被放置在世界里。（严格来说它不是方块，而是方块状态。详见[方块状态一文][blockstates]。）
    - 并非所有方块在破坏时都会掉落自身（例如树叶），详见[战利品表][loottables]一文。
- 当你[挖掉这个方块][breaking]后，它被移除（＝替换为空气方块），泥土随之掉落。掉落的泥土是一个物品**实体**。这意味着，它和其他实体（猪、僵尸、箭等）一样，天生就会受到诸如水流推动等因素的影响而移动，或被火焰和熔岩烧毁。
- 当你捡起这个物品实体后，它就变成了物品栏中的一个**物品堆叠**。简单来说，物品堆叠就是某个物品的实例，外加一些额外信息，比如堆叠数量。
- 物品堆叠的背后是与之对应的**物品**（也就是我们要创建的东西）。物品持有[数据组件][datacomponents]，其中包含所有物品堆叠初始化时所采用的默认信息（例如，每把铁剑的最大耐久度都是 250），而物品堆叠可以修改这些数据组件，从而让同一物品的两个不同堆叠拥有不同的信息（例如，一把铁剑还剩 100 次使用次数，另一把铁剑还剩 200 次）。关于哪些逻辑由物品处理、哪些由物品堆叠处理，请继续往下读。
    - 物品与物品堆叠的关系，大致与[方块][block]和[方块状态][blockstates]的关系相同：方块状态的背后总有一个方块支撑。这个类比并不十分精确（例如物品堆叠并不是单例），但足以让你对这里的概念有个基本认识。

## 创建物品 {#creating-an-item}

既然理解了物品是什么，那就来创建一个吧！

和基础方块一样，对于不需要特殊功能的基础物品（比如木棍、糖等），可以直接使用 `Item` 类。为此，在注册时用一个 `Item.Properties` 参数实例化 `Item`。这个 `Item.Properties` 参数可以通过 `Item.Properties#of` 创建，并可通过调用其方法进行自定义：

- `stacksTo` —— 设置该物品的最大堆叠数量（通过 `DataComponents#MAX_STACK_SIZE`）。默认为 64。末影珍珠等只能堆叠到 16 的物品会用到它。
- `durability` —— 设置该物品的耐久度（通过 `DataComponents#MAX_DAMAGE`），并将初始损耗设为 0（通过 `DataComponents#DAMAGE`）。默认为 0，表示“无耐久度”。例如铁制工具在此使用 250。注意，设置耐久度会自动将最大堆叠数量锁定为 1。
- `craftRemainder` —— 设置该物品的合成剩余物。原版用它来处理装满的桶，使其在合成后留下空桶。
- `fireResistant` —— 使用该物品的物品实体免疫火焰和熔岩（通过 `DataComponents#FIRE_RESISTANT`）。多种下界合金物品会用到它。
- `setNoRepair` —— 禁用该物品的铁砧修复和合成格修复。原版未使用。
- `rarity` —— 设置该物品的稀有度（通过 `DataComponents#RARITY`）。目前这只会改变物品的名称颜色。 `Rarity` 是一个枚举，包含四个值：`COMMON`（白色，默认）、 `UNCOMMON`（黄色）、 `RARE`（青色）和 `EPIC`（浅紫色）。请注意，Mod 可能会添加更多稀有度类型。
- `requiredFeatures` —— 设置该物品所需的特性标志。这主要用于原版在小版本更新中的特性锁定系统。不建议使用它，除非你要与原版通过特性标志锁定的某个系统对接。
- `food` —— 设置该物品的 [`FoodProperties`][food]（通过 `DataComponents#FOOD`）。

如需示例，或想查看 Minecraft 使用的各种数值，可以参考 `Items` 类。

### 食物 {#food}

`Item` 类为食物类物品提供了默认功能，也就是说你无需为此单独编写一个类。要让你的物品可食用，只需通过 `Item.Properties` 中的 `food` 方法为它设置 `FoodProperties` 即可。

`FoodProperties` 通过 `FoodProperties.Builder` 创建。随后你可以在其上设置各种属性：

- `nutrition` —— 设置恢复多少饥饿点数。以半个饥饿点为单位计数，例如 Minecraft 的牛排恢复 8 个饥饿点。
- `saturationMod` —— 饱和度修饰符，用于计算食用该食物时恢复的[饱和度值][hunger]。计算公式为 `min(2 * nutrition * saturationMod, playerNutrition)`，也就是说使用 `0.5` 会让实际的饱和度值与营养值相等。
- `alwaysEdible` —— 该物品是否始终可以食用，即使饥饿条已满。默认为 `false`；金苹果等除填饱饥饿条外还提供额外增益的物品为 `true`。
- `fast` —— 该食物是否启用快速食用。默认为 `false`；原版中干海带为 `true`。
- `effect` —— 添加一个在食用该物品时应用的 [`MobEffectInstance`][mobeffectinstance]。第二个参数表示该效果被应用的概率；例如，腐肉在食用时有 80%（＝0.8）的概率施加饥饿效果。该方法有两种变体；你应当使用接受 supplier 的那一个（另一个直接接受一个状态效果实例，因类加载问题已被 NeoForge 弃用）。
- `usingConvertsTo` —— 设置该物品在使用后会转变成的物品。
- `build` —— 设置好所有想设置的内容后，调用 `build` 得到一个 `FoodProperties` 对象以供后续使用。

如需示例，或想查看 Minecraft 使用的各种数值，可以参考 `Foods` 类。

要获取某个物品的 `FoodProperties`，调用 `Item#getFoodProperties(ItemStack, LivingEntity)`。它可能返回 null，因为并非每个物品都可食用。要判断某个物品是否可食用，对 `getFoodProperties` 调用的返回结果做 null 检查即可。

### 更多功能 {#more-functionality}

直接使用 `Item` 只能实现非常基础的物品。如果想添加功能，例如右键交互，就需要一个继承 `Item` 的自定义类。 `Item` 类有许多可以重写以实现不同行为的方法；详见 `Item` 和 `IItemExtension` 两个类。

物品最常见的两种用例是左键点击和右键点击。左键点击相关内容参见[破坏方块][breaking]和攻击实体（编写中）。右键点击相关内容参见[交互流水线][interactionpipeline]。

### `DeferredRegister.Items` {#deferredregisteritems}

所有注册表都使用 `DeferredRegister` 来注册其内容，物品也不例外。不过，由于添加新物品对绝大多数 Mod 来说都是极其基础的功能，NeoForge 提供了 `DeferredRegister.Items` 辅助类，它继承自 `DeferredRegister<Item>` 并提供了一些物品专属的辅助方法：

```java
public static final DeferredRegister.Items ITEMS = DeferredRegister.createItems(ExampleMod.MOD_ID);

public static final Supplier<Item> EXAMPLE_ITEM = ITEMS.registerItem(
    "example_item",
    Item::new, // The factory that the properties will be passed into.
    new Item.Properties() // The properties to use.
);
```

在内部，这只会通过将 properties 参数应用于所提供的物品工厂（通常就是构造函数）来调用 `ITEMS.register("example_item", () -> new Item(new Item.Properties()))`。

如果你想使用 `Item::new`，可以完全省略工厂，改用 `simple` 方法变体：

```java
public static final Supplier<Item> EXAMPLE_ITEM = ITEMS.registerSimpleItem(
    "example_item",
    new Item.Properties() // The properties to use.
);
```

它与前一个例子做的事情完全相同，只是稍短一些。当然，如果你想使用 `Item` 的子类而非 `Item` 本身，就只能改用前面那个方法。

这两个方法都还有省略 `new Item.Properties()` 参数的重载：

```java
public static final Supplier<Item> EXAMPLE_ITEM = ITEMS.registerItem("example_item", Item::new);
// Variant that also omits the Item::new parameter
public static final Supplier<Item> EXAMPLE_ITEM = ITEMS.registerSimpleItem("example_item");
```

最后，还有针对方块物品的快捷方法：

```java
public static final Supplier<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    "example_block",
    ExampleBlocksClass.EXAMPLE_BLOCK, new Item.Properties()
);
// Variant that omits the properties parameter:
public static final Supplier<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    "example_block",
    ExampleBlocksClass.EXAMPLE_BLOCK
);
// Variant that omits the name parameter, instead using the block's registry name:
public static final Supplier<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    ExampleBlocksClass.EXAMPLE_BLOCK,
    new Item.Properties()
);
// Variant that omits both the name and the properties:
public static final Supplier<BlockItem> EXAMPLE_BLOCK_ITEM = ITEMS.registerSimpleBlockItem(
    ExampleBlocksClass.EXAMPLE_BLOCK
);
```

:::note
如果你把已注册的方块放在一个单独的类里，那么应当在你的物品类之前先对方块类进行类加载。
:::

### 资源 {#resources}

如果你注册了物品并将其取到手中（通过 `/give` 或[创造模式物品栏标签页][creativetabs]），你会发现它缺少合适的模型和纹理。这是因为纹理和模型由 Minecraft 的资源系统处理。

对于每个物品，你都需要添加——或[生成][datagen]——以下内容的 JSON 文件：

- 一个带有关联[纹理][texture]的[物品模型][model]
- 一个[翻译][i18n]
- 一个[配方][recipes]（可选）
- 一些物品[标签][tags]（可选）

对于上述所有内容，也可参考类似原版方块的文件和数据生成器。

## `ItemStack` {#itemstacks}

和方块与方块状态一样，大多数你以为会用到 `Item` 的地方，实际用的其实是 `ItemStack`。 `ItemStack` 表示容器（例如物品栏）中由一个或多个物品组成的堆叠。同样和方块与方块状态一样，方法应当由 `Item` 重写、在 `ItemStack` 上调用，而且 `Item` 中的许多方法都会传入一个 `ItemStack` 实例。

一个 `ItemStack` 由三个主要部分构成：

- 它所代表的 `Item`，可通过 `ItemStack#getItem` 获取。
- 堆叠数量，通常介于 1 到 64 之间，可通过 `getCount` 获取，并可通过 `setCount` 或 `shrink` 更改。
- [数据组件][datacomponents]映射，用于存储堆叠专属的数据。可通过 `getComponents` 获取。组件值通常通过 `has`、 `get`、 `set`、 `update` 和 `remove` 访问和修改。

要创建一个新的 `ItemStack`，调用 `new ItemStack(Item)`，传入背后的物品。默认情况下，这会使用数量 1 且不带 NBT 数据；如有需要，也有接受数量和 NBT 数据的构造函数重载。

`ItemStack` 是可变对象（见下文），但有时需要把它们当作不可变对象来处理。如果你需要修改一个应被视为不可变的 `ItemStack`，可以用 `#copy` 克隆该堆叠，或在需要指定堆叠数量时用 `#copyWithCount`。

如果你想表示一个堆叠不含任何物品，使用 `ItemStack.EMPTY`。如果你想检查某个 `ItemStack` 是否为空，调用 `#isEmpty`。

### `ItemStack` 的可变性 {#mutability-of-itemstacks}

`ItemStack` 是可变对象。这意味着如果你调用例如 `#setCount` 或任何数据组件映射方法，`ItemStack` 本身就会被修改。原版大量利用了 `ItemStack` 的可变性，多个方法都依赖于此。例如，`#split` 会从其被调用的堆叠上分出指定数量，在此过程中既修改调用者，又返回一个新的 `ItemStack`。

然而，在同时处理多个 `ItemStack` 时，这有时会引发问题。最常见的情形出现在处理物品栏槽位时，因为你既要考虑当前被光标选中的 `ItemStack`，又要考虑你正试图向其插入或从其取出的 `ItemStack`。

:::tip
拿不准的时候，宁可稳妥也别冒险，用 `#copy` 复制一份堆叠。
:::

### JSON 表示 {#json-representation}

在许多场景下，例如[配方][recipes]，物品堆叠需要表示为 JSON 对象。物品堆叠的 JSON 表示形如：

```json5
{
    // The item ID. Required.
    "id": "minecraft:dirt",
    // The item stack count. Optional, defaults to 1.
    "count": 4,
    // A map of data components. Optional, defaults to an empty map.
    "components": {
        "minecraft:enchantment_glint_override": true
    }
}
```

## 创造模式标签页 {#creative-tabs}

默认情况下，你的物品只能通过 `/give` 获得，不会出现在创造模式物品栏中。我们来改变这一点！

把物品放进创造模式菜单的方式，取决于你想把它添加到哪个标签页。

### 已有的创造模式标签页 {#existing-creative-tabs}

:::note
此方法用于将你的物品添加到 Minecraft 的标签页，或添加到其他 Mod 的标签页。要将物品添加到你自己的标签页，请见下文。
:::

物品可以通过 `BuildCreativeModeTabContentsEvent` 添加到一个已有的 `CreativeModeTab` 中，该事件在[Mod 事件总线][modbus]上触发，且仅在[逻辑客户端][sides]上触发。通过调用 `event#accept` 添加物品。

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

该事件还提供了一些额外信息，例如 `getFlags` 用于获取已启用特性标志的列表，或 `hasPermissions` 用于检查玩家是否有权限查看管理员物品标签页。

### 自定义创造模式标签页 {#custom-creative-tabs}

`CreativeModeTab` 属于一个注册表，也就是说自定义的 `CreativeModeTab` 必须[注册][registering]。创建创造模式标签页使用构建器系统，构建器可通过 `CreativeModeTab#builder` 获取。该构建器提供了设置标题、图标、默认物品以及其他一系列属性的选项。此外，NeoForge 还提供了额外的方法来自定义标签页的图像、标签和槽位颜色、标签页的排序位置等。

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

`ItemLike` 是原版中由 `Item` 和[`Block`][block]实现的一个接口。它定义了 `#asItem` 方法，该方法返回对象本身的物品表示：`Item` 直接返回自身，而 `Block` 在有对应 `BlockItem` 时返回该 `BlockItem`，否则返回 `Blocks.AIR`。 `ItemLike` 用于各种不关心物品“来源”的场景，例如许多[数据生成器][datagen]中。

你也可以在自己的自定义对象上实现 `ItemLike`。只需重写 `#asItem` 即可搞定。

[block]: ../blocks/index.md
[blockstates]: ../blocks/states.md
[breaking]: ../blocks/index.md#breaking-a-block
[creativetabs]: #creative-tabs
[datacomponents]: ./datacomponents.md
[datagen]: ../resources/index.md#data-generation
[food]: #food
[hunger]: https://minecraft.wiki/w/Hunger#Mechanics
[i18n]: ../resources/client/i18n.md
[interactionpipeline]: interactionpipeline.md
[loottables]: ../resources/server/loottables/index.md
[mobeffectinstance]: mobeffects.md#mobeffectinstances
[modbus]: ../concepts/events.md#event-buses
[model]: ../resources/client/models/index.md
[recipes]: ../resources/server/recipes/index.md
[registering]: ../concepts/registries.md#methods-for-registering
[resources]: ../resources/index.md#assets
[sides]: ../concepts/sides.md
[tags]: ../resources/server/tags.md
[texture]: ../resources/client/textures.md
[wikicomponents]: https://minecraft.wiki/w/Data_component_format

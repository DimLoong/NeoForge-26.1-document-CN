# 资源位置 {#resource-locations}

`ResourceLocation` 是 Minecraft 中最重要的东西之一。它们被用作[注册表][registries]中的键、数据或资源文件的标识符、代码中模型的引用以及许多其他地方。 `ResourceLocation` 由两部分组成：命名空间和路径，由 `:` 分隔。

命名空间表示该位置所指的 Mod、资源包或数据包。例如，Mod ID 为 `examplemod` 的 Mod 将使用 `examplemod` 命名空间。 Minecraft 使用 `minecraft` 命名空间。只需创建相应的数据文件夹即可随意定义额外的命名空间，这通常由数据包完成，以保持其逻辑与其与普通集成的点分开。

该路径是对命名空间内你想要的任何对象的引用。例如，`minecraft:cow` 是对 `minecraft` 命名空间中名为 `cow` 的引用 - 通常此位置将用于从实体注册表中获取奶牛实体。另一个例子是 `examplemod:example_item`，它可能用于从物品注册表中获取 mod 的 `example_item`。

`ResourceLocation` 只能包含小写字母、数字、下划线、点和连字符。路径还可以包含正斜杠。请注意，由于 Java 模块限制，mod id 可能不包含连字符，这意味着 mod 命名空间也可能不包含连字符（它们在路径中仍然允许）。

:::info
`ResourceLocation` 本身并没有说明我们将其用于何种对象。例如，名为 `minecraft:dirt` 的对象存在于多个位置。接收到 `ResourceLocation` 的对象可以与它关联。
:::

可以通过调用 `ResourceLocation.fromNamespaceAndPath("examplemod", "example_item")` 或 `ResourceLocation.parse("examplemod:example_item")` 来创建新的 `ResourceLocation`。如果使用 `withDefaultNamespace`，则字符串将用作路径，`minecraft` 将用作命名空间。例如，`ResourceLocation.withDefaultNamespace("example_item")` 将导致 `minecraft:example_item`。

`ResourceLocation` 的命名空间和路径可以分别使用 `ResourceLocation#getNamespace()` 和 `#getPath()` 检索，并且可以通过 `ResourceLocation#toString` 检索组合形式。

`ResourceLocation` 是不可变的。 `ResourceLocation` 上的所有实用程序方法（例如 `withPrefix` 或 `withSuffix`）都会返回新的 `ResourceLocation`。

## 解析 `ResourceLocation` {#resolving-resourcelocations}

有些地方，例如注册中心，直接使用 `ResourceLocation`。然而，其他一些地方将根据需要解析 `ResourceLocation`。例如：

- `ResourceLocation`s 用作 GUI 背景的标识符。例如，熔炉 GUI 使用资源位置 `minecraft:textures/gui/container/furnace.png`。这映射到磁盘上的文件 `assets/minecraft/textures/gui/container/furnace.png`。请注意，此资源位置需要 `.png` 后缀。
- `ResourceLocation` 用作块模型的标识符。例如，污垢的块模型使用资源位置 `minecraft:block/dirt`。这映射到磁盘上的文件 `assets/minecraft/models/block/dirt.json`。请注意，此处不需要 `.json` 后缀。另请注意，此资源位置会自动映射到 `models` 子文件夹。
- `ResourceLocation` 用作配方的标识符。例如，铁块制作配方使用资源位置 `minecraft:iron_block`。这映射到磁盘上的文件 `data/minecraft/recipe/iron_block.json`。请注意，此处不需要 `.json` 后缀。另请注意，此资源位置会自动映射到 `recipe` 子文件夹。

`ResourceLocation` 是否需要文件后缀，或者资源位置到底解析为什么，取决于用例。

## `ModelResourceLocation`s {#modelresourcelocations}

`ModelResourceLocation` 是一种特殊类型的资源位置，其中包括称为变体的第三部分。 Minecraft 使用这些主要是为了区分模型的不同变体，其中不同的变体用于不同的显示上下文（例如三叉戟，其在第一人称、第三人称和库存中具有不同的模型）。对于物品，变体始终为 `inventory`，对于方块状态，则为逗号分隔的属性值对字符串（例如 `facing=north,waterlogged=false`，对于没有方块状态属性的方块为空）。

该变体与 `#` 一起附加到常规资源位置。例如，钻石剑的物品模型全名为 `minecraft:diamond_sword#inventory`。但是，在大多数情况下，可以省略 `inventory` 变体。

`ModelResourceLocation` 是一个[仅限客户端][sides] 类。这意味着引用此类的服务器将崩溃并显示 `NoClassDefFoundError`。

## `ResourceKey`s {#resourcekeys}

`ResourceKey`s 将注册表 ID 与注册表名称组合在一起。例如，注册表 ID 为 `minecraft:item` 且注册表名称为 `minecraft:diamond_sword` 的注册表项。与 `ResourceLocation` 不同，`ResourceKey` 实际上指的是唯一的元素，因此能够清楚地识别元素。它们最常用于许多不同注册管理机构相互接触的情况。一个常见的用例是数据包，尤其是 worldgen。

可以通过静态方法 `ResourceKey#create(ResourceKey<? extends Registry<T>>, ResourceLocation)` 创建一个新的 `ResourceKey`。这里的第二个参数是注册表名称，而第一个参数是所谓的注册表项。注册表项是一种特殊的 `ResourceKey`，其注册表是根注册表（即所有其他注册表的注册表）。可以通过 `ResourceKey#createRegistryKey(ResourceLocation)` 使用所需注册表 ID 创建注册表项。

`ResourceKey` 在创建时被拘留。这意味着通过引用相等进行比较（`==`）是可能的并且受到鼓励，但它们的创建相对昂贵。

[registries]: ../concepts/registries.md
[sides]: ../concepts/sides.md

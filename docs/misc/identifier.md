# Identifier {#identifiers}

`Identifier` 是 Minecraft 中最重要的东西之一。它们被用作[注册表][registries]中的键，用作数据或资源文件的标识符，用作代码中对模型的引用，以及许多其他场景。一个 `Identifier` 由两部分组成：命名空间和路径，两者以 `:` 分隔。

命名空间表明该位置所指向的是哪个 Mod、资源包或数据包。例如，一个 mod id 为 `examplemod` 的 Mod 将使用 `examplemod` 命名空间。Minecraft 使用 `minecraft` 命名空间。只需创建相应的数据文件夹，就可以随意定义额外的命名空间，数据包通常这样做，以便将它们自己的逻辑与其和原版集成的地方分隔开来。

路径是对你想要的任意对象的引用，位于你的命名空间之内。例如，`minecraft:cow` 是对 `minecraft` 命名空间中某个名为 `cow` 的东西的引用——通常该位置会被用来从实体注册表中获取 cow 实体。另一个例子是 `examplemod:example_item`，它很可能被用来从物品注册表中获取你 Mod 的 `example_item`。

`Identifier` 只能包含小写字母、数字、下划线、点和连字符。路径还可以额外包含正斜杠。请注意，由于 Java 模块的限制，mod id 不能包含连字符，这也就意味着 Mod 的命名空间同样不能包含连字符（它们在路径中仍然是允许的）。

:::info
`Identifier` 本身并不说明我们要将其用于何种对象。例如，名为 `minecraft:dirt` 的对象存在于多个地方。将某个对象与 `Identifier` 关联起来，取决于接收该 `Identifier` 的一方。
:::

可以通过调用 `Identifier.fromNamespaceAndPath("examplemod", "example_item")` 或 `Identifier.parse("examplemod:example_item")` 创建一个新的 `Identifier`。如果使用 `withDefaultNamespace`，则该字符串会被用作路径，命名空间则使用 `minecraft`。因此举例来说，`Identifier.withDefaultNamespace("example_item")` 会得到 `minecraft:example_item`。

`Identifier` 的命名空间和路径可以分别通过 `Identifier#getNamespace()` 和 `#getPath()` 获取，而其组合形式可以通过 `Identifier#toString` 获取。

`Identifier` 是不可变的。`Identifier` 上的所有工具方法，例如 `withPrefix` 或 `withSuffix`，都会返回一个新的 `Identifier`。

## 解析 `Identifier` {#resolving-identifiers}

有些地方，例如注册表，会直接使用 `Identifier`。而另一些地方则会按需解析 `Identifier`。例如：

- `Identifier` 被用作 GUI 背景的标识符。例如，熔炉 GUI 使用标识符 `minecraft:textures/gui/container/furnace.png`。它映射到磁盘上的文件 `assets/minecraft/textures/gui/container/furnace.png`。注意此标识符中需要 `.png` 后缀。
- `Identifier` 被用作方块模型的标识符。例如，泥土的方块模型使用标识符 `minecraft:block/dirt`。它映射到磁盘上的文件 `assets/minecraft/models/block/dirt.json`。注意这里不需要 `.json` 后缀。另外注意此标识符会自动映射到 `models` 子文件夹中。
- `Identifier` 被用作客户端物品的标识符。例如，苹果的客户端物品使用标识符 `minecraft:apple`（由 `DataComponents#ITEM_MODEL` 定义）。它映射到文件 `assets/minecraft/items/apple.json`。注意这里不需要 `.json` 后缀。另外注意此标识符会自动映射到 `items` 子文件夹中。
- `Identifier` 被用作配方的标识符。例如，铁块的合成配方使用标识符 `minecraft:iron_block`。它映射到磁盘上的文件 `data/minecraft/recipe/iron_block.json`。注意这里不需要 `.json` 后缀。另外注意此标识符会自动映射到 `recipe` 子文件夹中。

`Identifier` 是否需要文件后缀，或者它究竟解析成什么，取决于具体的用例。

## `ResourceKey` {#resourcekeys}

`ResourceKey` 将一个注册表 id 与一个注册名组合起来。一个例子是注册表 id 为 `minecraft:item`、注册名为 `minecraft:diamond_sword` 的资源键。与 `Identifier` 不同，`ResourceKey` 实际上指向一个唯一的元素，因此能够明确地标识某个元素。它们最常用于许多不同注册表相互接触的场景。一个常见用例是数据包，尤其是世界生成。

可以通过静态方法 `ResourceKey#create(ResourceKey<? extends Registry<T>>, Identifier)` 创建一个新的 `ResourceKey`。这里第二个参数是注册名，第一个参数则是所谓的注册表键（registry key）。注册表键是一种特殊的 `ResourceKey`，其注册表是根注册表（即所有其他注册表所在的注册表）。可以通过 `ResourceKey#createRegistryKey(Identifier)` 并传入所需注册表的 id 来创建一个注册表键。

`ResourceKey` 在创建时会被驻留（intern）。这意味着可以并鼓励使用引用相等（`==`）进行比较，但它们的创建开销相对较大。

[registries]: ../concepts/registries.md
[sides]: ../concepts/sides.md

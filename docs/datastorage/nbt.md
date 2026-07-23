---
sidebar_position: 1
---
# 具名二进制标签（NBT） {#named-binary-tag-nbt}

NBT 是 Minecraft 最早期引入的一种格式，由 Notch 本人编写。它在整个 Minecraft 代码库中被广泛用于数据存储。

## 规范 {#specification}

NBT 规范与 JSON 规范类似，但有若干差异：

- 存在专门的字节、短整型、长整型和浮点型，分别以 `b`、`s`、`l` 和 `f` 作为后缀，这与它们在 Java 代码中的表示方式类似。
    - 双精度浮点数也可以加上 `d` 后缀，但这并非必需，与 Java 代码一致。Java 中整数可用的 `i` 后缀在这里不允许使用。
    - 后缀不区分大小写。例如 `64b` 与 `64B` 相同，`0.5F` 与 `0.5f` 相同。
- 不存在布尔值，它们改由字节表示。`true` 变为 `1b`，`false` 变为 `0b`。
    - 当前实现将所有非零值都视为 `true`，因此 `2b` 也会被当作 `true`。
- NBT 中没有 `null` 的对应物。
- 键两侧的引号是可选的。因此 JSON 属性 `"duration": 20` 在 NBT 中既可以写成 `duration: 20`，也可以写成 `"duration": 20`。
- JSON 中所谓的子对象，在 NBT 中称为**复合标签**（或简称复合，compound）。
- 与 JSON 不同，NBT 列表不能混用多种类型。列表类型由第一个元素决定，或在代码中定义。
    - 不过，列表的列表可以混用不同的列表类型。因此一个包含两个列表的列表是允许的，例如第一个是字符串列表，第二个是字节列表。
- 存在几种特殊的**数组**类型，它们与列表不同，但同样遵循用方括号包含元素的写法。共有三种数组类型：
    - 字节数组，以数组开头的 `B;` 标识。示例：`[B;0b,30b]`
    - 整数数组，以数组开头的 `I;` 标识。示例：`[I;0,-300]`
    - 长整型数组，以数组开头的 `L;` 标识。示例：`[L;0l,240l]`
- 列表、数组和复合标签允许出现尾随逗号。

## NBT 文件 {#nbt-files}

Minecraft 大量使用 `.nbt` 文件，例如[数据包][datapack]中的结构文件。区域文件（`.mca`，包含一个区域即一批区块的内容），以及游戏在各处使用的各种 `.dat` 文件，都是 NBT 文件。

NBT 文件通常使用 GZip 压缩。因此它们是二进制文件，无法直接编辑。

## 代码中的 NBT {#nbt-in-code}

与 JSON 类似，所有 NBT 对象都是某个外层封闭对象的子节点。所以我们先创建一个：

```java
CompoundTag tag = new CompoundTag();
```

现在可以把数据放入该标签：

```java
tag.putInt("Color", 0xffffff);
tag.putString("Level", "minecraft:overworld");
tag.putDouble("IAmRunningOutOfIdeasForNamesHere", 1d);
```

这里存在若干辅助方法，例如 `putIntArray` 除了接收 `int[]` 的标准变体外，还有一个接收 `List<Integer>` 的便捷方法。

当然，我们也可以从该标签中取值：

```java
Optional<Integer> color = tag.getInt("Color");
Optional<String> level = tag.getString("Level");
Optional<Double> d = tag.getDouble("IAmRunningOutOfIdeasForNamesHere");
```

由于无法确定标签是否存在，返回的值都用 Optional 包装。可以通过基本类型对应的某个 `*Or*` 方法来指定默认值。`ListTag` 可以通过 `getListOrEmpty` 设定默认值，`CompoundTag` 则通过 `getCompoundOrEmpty`。基本类型的数组没有对应的 `*Or*` 方法。

```java
int color = tag.getIntOr("Color", 0xffffff);
String level = tag.getStringOr("Level", "minecraft:overworld");
double d = tag.getDoubleOr("IAmRunningOutOfIdeasForNamesHere", 1d);
```


所有标签类型都实现了 `Tag` 接口。除 `CompoundTag` 之外的大多数标签类型基本是内部使用的，例如 `ByteTag` 或 `StringTag`，不过如果你偶然遇到它们，直接使用 `CompoundTag#get` 和 `#put` 方法也可以处理。

但有一个明显的例外：`ListTag`。处理它比较特殊，因为它关联着某种在内部计算得出的标签类型：

```java
ListTag newList = new ListTag();
// Adds the tags to the list
newList.add(StringTag.valueOf("Value1"));
newList.add(StringTag.valueOf("Value2"));

// Getting the tag
ListTag getList = tag.getListOrEmpty("SomeListHere");
```

最后，在其他 `CompoundTag` 内部处理 `CompoundTag` 时，直接使用 `CompoundTag#get` 和 `#put`：

```java
tag.put("Tag", new CompoundTag());

// Can use regular `get` as well if you want to handle null case instead
tag.getCompoundOrEmpty("Tag");
```

## NBT 的用途 {#usages-of-nbt}

NBT 在 Minecraft 的许多地方被使用。[`BlockEntity`][blockentity] 和[`Entity`][entity]把 NBT 的使用抽象为[值访问][valueio]。`ItemStack` 则把这一使用抽象为[数据组件][datacomponents]。

## 参见 {#see-also}

- [Minecraft Wiki 上的 NBT 格式][nbtwiki]

[blockentity]: ../blockentities/index.md
[datapack]: ../resources/index.md#data
[datacomponents]: ../items/datacomponents.md
[entity]: ../entities/index.md
[nbtwiki]: https://minecraft.wiki/w/NBT_format
[valueio]: valueio.md

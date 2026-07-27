---
sidebar_position: 1
---
# 命名二进制标签（NBT） {#named-binary-tag-nbt}

NBT 是 Minecraft 早期由 Notch 本人引入的一种格式。它在整个 Minecraft 代码库中被广泛用于数据存储。

## 规范 {#specification}

NBT 规范与 JSON 规范类似，但有以下几点区别：

- 存在独立的字节（byte）、短整型（short）、长整型（long）和浮点型（float）类型，分别以 `b`、 `s`、 `l` 和 `f` 作后缀，类似于它们在 Java 代码中的表示方式。
    - 双精度浮点数（double）也可以用 `d` 作后缀，但并非必需，这也与 Java 代码一致。 Java 中整数可用的可选后缀 `i` 在此不被允许。
    - 后缀不区分大小写。因此例如 `64b` 与 `64B` 相同，`0.5F` 与 `0.5f` 相同。
- 不存在布尔值，而是用字节来表示。 `true` 变为 `1b`，`false` 变为 `0b`。
    - 当前实现将所有非零值都视为 `true`，因此 `2b` 同样会被视为 `true`。
- NBT 中没有与 `null` 对应的概念。
- 键两侧的引号是可选的。因此 JSON 属性 `"duration": 20` 在 NBT 中既可以写成 `duration: 20`，也可以写成 `"duration": 20`。
- JSON 中称为子对象（sub-object）的东西，在 NBT 中称为**复合标签**（compound tag，或简称 compound）。
- 与 JSON 不同，NBT 列表不能混用多种类型。列表类型由第一个元素决定，或在代码中定义。
    - 不过，列表的列表可以混用不同的列表类型。因此，一个包含两个列表的列表——其中第一个是字符串列表、第二个是字节列表——是允许的。
- 存在特殊的**数组**（array）类型，它们不同于列表，但同样遵循用方括号包含元素的写法。共有三种数组类型：
    - 字节数组，以数组开头的 `B;` 标记。示例：`[B;0b,30b]`
    - 整型数组，以数组开头的 `I;` 标记。示例：`[I;0,-300]`
    - 长整型数组，以数组开头的 `L;` 标记。示例：`[L;0l,240l]`
- 列表、数组和复合标签中允许出现尾随逗号。

## NBT 文件 {#nbt-files}

Minecraft 大量使用 `.nbt` 文件，例如[数据包][datapack]中的结构文件。存储某个区域（region，即一组区块）内容的区域文件（`.mca`），以及游戏在不同场景下使用的各种 `.dat` 文件，也都是 NBT 文件。

NBT 文件通常使用 GZip 压缩。因此它们是二进制文件，无法直接编辑。

## 代码中的 NBT {#nbt-in-code}

与 JSON 一样，所有 NBT 对象都是某个外层对象的子级。那我们先来创建一个：

```java
CompoundTag tag = new CompoundTag();
```

现在可以把数据放进这个标签：

```java
tag.putInt("Color", 0xffffff);
tag.putString("Level", "minecraft:overworld");
tag.putDouble("IAmRunningOutOfIdeasForNamesHere", 1d);
```

这里存在多个辅助方法，例如除了接收 `int[]` 的标准变体外，`putIntArray` 还有一个接收 `List<Integer>` 的便捷方法。

当然，我们也可以从该标签中获取值：

```java
int color = tag.getInt("Color");
String level = tag.getString("Level");
double d = tag.getDouble("IAmRunningOutOfIdeasForNamesHere");
```

数字类型在缺失时返回 0。字符串在缺失时返回 `""`。更复杂的类型（列表、数组、复合标签）在缺失时会抛出异常。

因此，我们要通过检查某个标签元素是否存在来加以防范：

```java
boolean hasColor = tag.contains("Color");
boolean hasColorMoreExplicitly = tag.contains("Color", Tag.TAG_INT);
```

`TAG_INT` 常量定义在 `Tag` 中，`Tag` 是所有标签类型的父接口。除 `CompoundTag` 外，大多数标签类型基本是内部使用的，例如 `ByteTag` 或 `StringTag`，不过如果你碰巧遇到它们，直接的 `CompoundTag#get` 和 `#put` 方法也能与之配合使用。

不过有一个明显的例外：`ListTag`。处理它比较特殊，因为通过 `CompoundTag#getList` 获取列表标签时，你还必须指定列表类型。例如，获取一个字符串列表的写法如下：

```java
ListTag list = tag.getList("SomeListHere", Tag.TAG_STRING);
```

同样，创建 `ListTag` 时也必须在创建过程中指定列表类型：

```java
ListTag list = new ListTag(List.of("Value1", "Value2"), Tag.TAG_STRING);
```

最后，处理嵌套在其他 `CompoundTag` 中的 `CompoundTag` 时，直接使用 `CompoundTag#get` 和 `#put`：

```java
tag.put("Tag", new CompoundTag());
tag.get("Tag");
```

## NBT 的用途 {#usages-of-nbt}

NBT 在 Minecraft 的许多地方都有使用。最常见的例子包括 [`BlockEntity`][blockentity] 和 `Entity`。

:::note
`ItemStack` 已将 NBT 的用法抽象为[数据组件][datacomponents]。
:::

## 另见 {#see-also}

- [Minecraft Wiki 上的 NBT 格式][nbtwiki]

[blockentity]: ../blockentities/index.md
[datapack]: ../resources/index.md#data
[datacomponents]: ../items/datacomponents.md
[nbtwiki]: https://minecraft.wiki/w/NBT_format

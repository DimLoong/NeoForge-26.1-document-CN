# 调试分析器 {#debug-profiler}

Minecraft 提供了一个调试分析器，它提供系统数据、当前游戏设置、 JVM 数据、关卡数据和侧面刻度信息，以查找耗时的代码。考虑到像 `TickEvent`s 和勾选 `BlockEntities` 这样的东西，这对于想要找到滞后源的 Mod 开发者和服务器所有者来说非常有用。

## 使用调试分析器 {#using-the-debug-profiler}

调试分析器使用起来非常简单。它需要调试键绑定 `F3 + L` 来启动分析器。 10秒后自动停止；但是，可以通过再次按下按键绑定来提前停止它。

:::note
当然，你只能分析实际到达的代码路径。你要分析的 `Entities` 和 `BlockEntities` 必须存在于关卡中才能显示在结果中。
:::

停止调试器后，它将在运行目录的 `debug/profiling` 子目录中创建一个新的 zip。
文件名的日期和时间格式为 `yyyy-mm-dd_hh_mi_ss-WorldName-VersionNumber.zip`

## 读取分析结果 {#reading-a-profiling-result}

在每个侧面文件夹（`client` 和 `server`）中，你将找到包含结果数据的 `profiling.txt` 文件。在顶部，它首先告诉你它运行了多长时间（以毫秒为单位）以及在这段时间内运行了多少个滴答声。

在其下方，你将找到类似于以下代码片段的信息：

```
[00] levels - 96.70%/96.70%
[01] |   Level Name - 99.76%/96.47%
[02] |   |   tick - 99.31%/95.81%
[03] |   |   |   entities - 47.72%/45.72%
[04] |   |   |   |   regular - 98.32%/44.95%
[04] |   |   |   |   blockEntities - 0.90%/0.41%
[05] |   |   |   |   |   unspecified - 64.26%/0.26%
[05] |   |   |   |   |   minecraft:furnace - 33.35%/0.14%
[05] |   |   |   |   |   minecraft:chest - 2.39%/0.01%
```

以下是每个部分含义的简短解释：

| [02]|勾选| 99.31% | 95.81% |
| :----------------------- | :---------------------- | :----------- | :----------- |
|本节的深度 |部门名称 |相对于其父级所花费的时间百分比。对于第 0 层，它是一个刻度所花费的时间的百分比。对于第 1 层，它是其父层所用时间的百分比。 |第二个百分比告诉你整个滴答花费了多少时间。

## 分析你自己的代码 {#profiling-your-own-code}

调试分析器对 `Entity` 和 `BlockEntity` 具有基本支持。如果你想分析其他内容，你可能需要手动创建你的部分，如下所示：

```java
ProfilerFiller#push(yourSectionName : String);
//The code you want to profile
ProfilerFiller#pop();
```
你可以从 `Level`、 `MinecraftServer`、 `Minecraft` 实例获取 `ProfilerFiller` 实例。
现在你只需在结果文件中搜索你的部分名称即可。

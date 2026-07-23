# 调试性能分析器 {#debug-profiler}

Minecraft 提供了一个调试性能分析器（Debug Profiler），它可提供系统数据、当前游戏设置、JVM 数据、世界数据以及分端的 tick 信息，用于查找耗时的代码。考虑到诸如 `TickEvent` 以及正在 tick 的 `BlockEntity` 之类的情况，它对于想要查找卡顿来源的 Mod 开发者和服务端所有者会非常有用。

## 使用调试性能分析器 {#using-the-debug-profiler}

调试性能分析器的使用非常简单。它需要调试快捷键 `F3 + L` 来启动分析器。10 秒后它会自动停止；不过，也可以再次按下快捷键来提前停止。

:::note
自然地，你只能分析那些确实被执行到的代码路径。你想要分析的 [`Entity`][entity] 和 [`BlockEntity`][blockentity] 必须存在于世界中，才会出现在结果里。
:::

停止调试器后，它会在你运行目录下的 `debug/profiling` 子目录中创建一个新的 zip 文件。
文件名会以日期和时间格式化为 `yyyy-mm-dd_hh_mi_ss-WorldName-VersionNumber.zip`。

## 读取分析结果 {#reading-a-profiling-result}

在每个分端文件夹（`client` 和 `server`）中，你都会找到一个包含结果数据的 `profiling.txt` 文件。在文件顶部，它首先会告诉你分析器运行了多少毫秒，以及在这段时间内运行了多少个 tick。

在其下方，你会看到类似下面这段的信息：

```
[00] tick(201/1) - 41.46%/41.46%
[01] |   levels(201/1) - 96.62%/40.05%
[02] |   |   ServerLevel[New World] minecraft:overworld(201/1) - 98.80%/39.58%
[03] |   |   |   tick(201/1) - 99.98%/39.57%
[04] |   |   |   |   entities(201/1) - 56.83%/22.49%
[05] |   |   |   |   |   tick(44717/222) - 95.81%/21.54%
[06] |   |   |   |   |   |   minecraft:skeleton(4585/23) - 13.91%/3.00%
[07] |   |   |   |   |   |   |   #tickNonPassenger 4585/22
[07] |   |   |   |   |   |   |   travel(4573/23) - 33.12%/0.99%
[08] |   |   |   |   |   |   |   |   #getChunkCacheMiss 7/0
[08] |   |   |   |   |   |   |   |   #getChunk 47227/234
[08] |   |   |   |   |   |   |   |   move(4573/23) - 40.10%/0.40%
[09] |   |   |   |   |   |   |   |   |   #getEntities 4573/22
[09] |   |   |   |   |   |   |   |   |   #getChunkCacheMiss 1353/6
[09] |   |   |   |   |   |   |   |   |   #getChunk 28482/141
[08] |   |   |   |   |   |   |   |   unspecified(4573/23) - 36.24%/0.36%
[08] |   |   |   |   |   |   |   |   rest(4573/23) - 23.66%/0.23%
[09] |   |   |   |   |   |   |   |   |   #getChunkCacheMiss 59/0
[09] |   |   |   |   |   |   |   |   |   #getChunk 65867/327
[09] |   |   |   |   |   |   |   |   |   #getChunkNow 531/2
```

有些条目形如 `[03] tick(201/1) - 99.98%/39.57%`，它们是 `ProfilerFiller#push` 和 `pop` 的结果。其含义为：

- `[03]` - 该分段的深度。
- `tick` - 该分段的名称。
    - 若某段耗时没有关联的子分段，则显示为 `unspecified`。
- `201` - 在分析器运行期间该分段被调用的次数。
- `1` - 该分段在单个 tick 内被调用的平均次数（向下取整）。
- `99.98%` - 相对于其父分段所耗时间的百分比。
    - 对于第 0 层，它是占单个 tick 耗时的百分比。
    - 对于第 1 层，它是占其父分段耗时的百分比。
- `39.57%` - 占整个 tick 所耗时间的百分比。

还有一些条目形如 `[07] #tickNonPassenger 4585/22`，它们是 `ProfileFiller#incrementCounter` 的结果。其含义为：

- `[07]` - 该分段的深度。
- `#tickNonPassenger` - 被递增的计数器的名称。
    - `#` 是自动前置的。
- `4585` - 在分析器运行期间该计数器被递增的次数。
- `22` - 该计数器在单个 tick 内被递增的平均次数（向下取整）。

## 分析你自己的代码 {#profiling-your-own-code}

调试性能分析器对 `Entity` 和 `BlockEntity` 有基本的支持。如果你想分析其他内容，可能需要像下面这样手动创建你自己的分段：

```java
Profiler.get().push("yourSectionName");
//The code you want to profile
Profiler.get().pop();
```

现在你只需在结果文件中搜索你的分段名称即可。

[blockentity]: ../blockentities/index.md
[entity]: ../entities/index.md

---
sidebar_position: 2
---
# 侧面 {#sides}

与许多其他程序一样，Minecraft 遵循客户端-服务器概念，其中客户端负责显示数据，而服务器负责更新数据。当使用这些术语时，我们对我们的意思有一个相当直观的理解......对吧？

事实证明，并没有那么多。很多混乱源于《我的世界》有两种不同的侧面概念，具体取决于上下文：物理侧面和逻辑侧面。

## 逻辑端与物理端 {#logical-vs-physical-side}

### 物理侧 {#the-physical-side}

当你打开 Minecraft 启动器，选择 Minecraft 安装并按播放键时，你将启动 **物理客户端**。这里使用的“物理”一词的意思是“这是一个客户端程序”。这尤其意味着客户端功能（例如所有渲染内容）都可以在此处使用，并且可以根据需要使用。相比之下，**物理服务器**（也称为专用服务器）是你启动 Minecraft 服务器 JAR 时打开的服务器。虽然 Minecraft 服务器附带了一个基本的 GUI，但它缺少所有客户端功能。最值得注意的是，这意味着服务器 JAR 中缺少各种客户端类。在物理服务器上调用这些类会导致丢失类错误，即崩溃，因此我们需要防范这种情况。

### 逻辑端 {#the-logical-side}

逻辑方面主要关注 Minecraft 的内部程序结构。 **逻辑服务器**是游戏逻辑运行的地方。时间和天气变化、实体滴答、实体生成等都在服务器上运行。各种数据，例如库存内容，也是服务器的责任。另一方面，**逻辑客户端**负责显示要显示的所有内容。 Minecraft 将所有客户端代码保存在一个独立的 `net.minecraft.client` 包中，并在称为渲染线程的单独线程中运行它，而其他所有内容都被视为通用（即客户端和服务器）代码。

### 有什么区别？ {#whats-the-difference}

物理侧和逻辑侧之间的差异最好通过两种情况来说明：

- 玩家加入**多人**世界。这相当简单：玩家的物理（和逻辑）客户端连接到其他地方的物理（和逻辑）服务器 - 玩家不关心在哪里；只要它们可以连接，这就是客户端所知道的，也是客户端需要知道的。
- 玩家加入**单人**世界。这就是事情变得有趣的地方。玩家的物理客户端启动逻辑服务器，然后，现在以逻辑客户端的角色连接到同一台计算机上的该逻辑服务器。如果你熟悉网络，则可以将其视为与 `localhost` 的连接（仅在概念上；不涉及实际的套接字或类似内容）。

这两个场景也显示了主要问题：如果逻辑服务器可以使用你的代码，那么仅此并不能保证物理服务器也能够使用。这就是为什么你应该始终使用专用服务器进行测试以检查意外行为的原因。由于客户端和服务器分离不正确而导致的 `NoClassDefFoundError` 和 `ClassNotFoundException` 是改装中最常见的错误之一。另一个常见的错误是使用静态字段并从逻辑两侧访问它们。这特别棘手，因为通常没有迹象表明出现问题。

:::tip
如果需要从一侧传输数据到另一侧，则必须[发送数据包][networking]。
:::

在 NeoForge 代码库中，物理端由名为 `Dist` 的枚举表示，而逻辑端由名为 `LogicalSide` 的枚举表示。

:::info
从历史上看，服务器 JAR 具有客户端没有的类。在现代版本中，情况已不再如此。如果你愿意的话，物理服务器是物理客户端的子集。
:::

## 执行特定于侧面的操作 {#performing-side-specific-operations}

### `Level#isClientSide()` {#levelisclientside}

这种布尔检查将是你最常用的检查侧面的方法。在 `Level` 对象上查询此字段可确定该级别所属的**逻辑**端：如果该字段是 `true`，则该级别正在逻辑客户端上运行。如果字段为 `false`，则该级别在逻辑服务器上运行。因此，物理服务器将始终在此字段中包含 `false`，但我们不能假设 `false` 暗示物理服务器，因为对于物理客户端（即单人游戏世界）内的逻辑服务器，该字段也可以是 `false`。

每当你需要确定是否应该运行游戏逻辑和其他机制时，请使用此检查。例如，如果你想在玩家每次点击你的方块时对其造成伤害，或者让你的机器将污垢加工成钻石，那么你应该仅在确保 `#isClientSide` 为 `false` 后才执行此操作。将游戏逻辑应用于逻辑客户端在最好的情况下可能会导致不同步（幽灵实体、不同步的统计数据等），而在最坏的情况下会导致崩溃。

:::tip
此检查应用作你的默认设置。每当你有可用的 `Level` 时，请使用此检查。
:::

### `FMLEnvironment.dist` {#fmlenvironmentdist}

`FMLEnvironment.dist` 是 `Level#isClientSide()` 支票的**物理**对应项。如果此字段为 `Dist.CLIENT`，则你使用的是物理客户端。如果该字段为 `Dist.DEDICATED_SERVER`，则你位于物理服务器上。


#### `@Mod` {#mod}

在处理仅限客户端的课程时，检查物理环境非常重要。分离仅应在一个物理客户端上执行的代码的推荐方法是指定单独的 [`@Mod` 注释][mod]，将 `dist` 参数设置为应该加载 mod 类的物理端：

```java
@Mod("examplemod")
public class ExampleMod {
    public ExampleMod(IEventBus modBus) {
        // Perform logic in that should be executed on both sides
    }
}

@Mod(value = "examplemod", dist = Dist.CLIENT) 
public class ExampleModClient {
    public ExampleModClient(IEventBus modBus) {
        // Perform logic in that should only be executed on the physical client
        Minecraft.getInstance().whatever();
    }
}

@Mod(value = "examplemod", dist = Dist.DEDICATED_SERVER) 
public class ExampleModDedicatedServer {
    public ExampleModDedicatedServer(IEventBus modBus) {
        // Perform logic in that should only be executed on the physical server
    }
}
```

:::tip
通常预计 Mod 在任何一侧都可以工作。这尤其意味着，如果你正在开发仅限客户端的 mod，你应该验证该 mod 是否确实在物理客户端上运行，如果没有，则不执行任何操作。
:::

[networking]: ../networking/index.md
[mod]: ../gettingstarted/modfiles.md#javafml-and-mod

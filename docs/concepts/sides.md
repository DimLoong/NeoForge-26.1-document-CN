---
sidebar_position: 2
---
# 端 {#sides}

与许多其他程序一样，Minecraft 遵循客户端-服务端的概念，其中客户端负责显示数据，而服务端负责更新数据。当我们使用这些术语时，对其含义有一种相当直观的理解……对吧？

事实证明，并非如此。许多混淆都源于 Minecraft 在不同语境下有两种不同的“端”的概念：物理端和逻辑端。

## 逻辑端 vs. 物理端 {#logical-vs-physical-side}

### 物理端 {#the-physical-side}

当你打开 Minecraft 启动器、选择一个 Minecraft 安装并点击游玩时，你启动的是一个**物理客户端**。这里的“物理”一词是“这是一个客户端程序”的意思。这尤其意味着，客户端专属的功能（例如所有的渲染相关内容）在这里都可用，可以按需使用。与之相对，**物理服务端**（也称为专用服务端）是你启动 Minecraft 服务端 JAR 时所打开的东西。虽然 Minecraft 服务端自带一个简陋的 GUI，但它缺失了所有纯客户端功能。最值得注意的是，这意味着服务端 JAR 中缺失了各种客户端类。在物理服务端上调用这些类将导致缺失类错误，即崩溃，因此我们需要对此加以防护。

### 逻辑端 {#the-logical-side}

逻辑端主要关注 Minecraft 的内部程序结构。**逻辑服务端**是游戏逻辑运行的地方。诸如时间和天气变化、实体的刻更新（tick）、实体生成等都在服务端运行。各种数据（例如物品栏内容）也都是服务端的职责。而另一方面，**逻辑客户端**负责显示一切需要显示的内容。Minecraft 将所有客户端代码保存在一个隔离的 `net.minecraft.client` 包中，并在一个名为渲染线程（Render Thread）的独立线程中运行它，而其他一切都被视为公共（即客户端与服务端共用）代码。

### 有什么区别？ {#whats-the-difference}

物理端与逻辑端之间的区别最好用两个场景来说明：

- 玩家加入一个**多人**世界。这相当直接：玩家的物理（以及逻辑）客户端连接到位于别处的某个物理（以及逻辑）服务端——玩家并不关心它在哪里；只要能连上，那就是客户端所知的全部，也是客户端需要知道的全部。
- 玩家加入一个**单人**世界。这里事情就变得有趣了。玩家的物理客户端启动一个逻辑服务端，然后以逻辑客户端的身份连接到同一台机器上的那个逻辑服务端。如果你熟悉网络通信，可以把它想象成一个到 `localhost` 的连接（仅在概念上如此；实际并不涉及任何真正的套接字之类的东西）。

这两个场景也揭示了其中的主要问题：如果一个逻辑服务端能与你的代码正常配合，仅凭这一点并不能保证物理服务端也能正常配合。这就是为什么你应当始终用专用服务端进行测试，以检查是否有意料之外的行为。由于客户端与服务端分离不当而引发的 `NoClassDefFoundError` 和 `ClassNotFoundException` 是 Mod 开发中最常见的错误之一。另一个常见错误是使用静态字段并从两个逻辑端同时访问它们；这尤其棘手，因为通常没有任何迹象表明出了问题。

:::tip
如果你需要将数据从一端传输到另一端，你必须[发送一个网络包][networking]。
:::

在 NeoForge 代码库中，物理端由一个名为 `Dist` 的枚举表示，而逻辑端由一个名为 `LogicalSide` 的枚举表示。

:::info
从历史上看，服务端 JAR 曾拥有客户端所没有的类。在现代版本中，情况已不再如此；可以说，物理服务端是物理客户端的一个子集。
:::

## 执行端专属操作 {#performing-side-specific-operations}

### `Level#isClientSide()` {#levelisclientside}

这个布尔检查将是你最常用的判断端的方式。在一个 `Level` 对象上查询该字段可以确定该 level 所属的**逻辑**端：如果该字段为 `true`，则该 level 运行在逻辑客户端上；如果该字段为 `false`，则该 level 运行在逻辑服务端上。由此可知，物理服务端在该字段中将始终为 `false`，但我们不能假定 `false` 就意味着物理服务端，因为对于物理客户端内部的逻辑服务端（即单人世界），该字段同样可以为 `false`。

每当你需要判断是否应运行游戏逻辑和其他机制时，就使用这个检查。例如，如果你想在玩家每次点击你的方块时对其造成伤害，或让你的机器把泥土加工成钻石，你都应当在确保 `#isClientSide()` 为 `false` 之后才这样做。将游戏逻辑应用到逻辑客户端，在最好的情况下会导致不同步（幽灵实体、统计数据不同步等），在最坏的情况下会导致崩溃。

:::tip
这个检查应作为你的首选默认做法。每当你手头有一个 `Level` 可用时，就使用这个检查。
:::

### `FMLEnvironment#getDist()` {#fmlenvironmentgetdist}

`FMLEnvironment#getDist()` 是与 `Level#isClientSide()` 检查相对应的**物理**端版本。如果该字段为 `Dist.CLIENT`，则你处于物理客户端上。如果该字段为 `Dist.DEDICATED_SERVER`，则你处于物理服务端上。

#### `@Mod` {#mod}

在处理纯客户端类时，检查物理环境非常重要。将只应在某一物理端执行的代码分离出来的推荐做法，是指定一个单独的 [`@Mod` 注解][mod]，把 `dist` 参数设为该 Mod 类应加载的物理端：

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
一般期望 Mod 能在任一端工作。这尤其意味着，如果你正在开发一个纯客户端 Mod，你应当验证该 Mod 确实能在物理客户端上运行，并在其无法运行的情况下不执行任何操作（no-op）。
:::

[networking]: ../networking/index.md
[mod]: ../gettingstarted/modfiles.md#javafml-and-mod

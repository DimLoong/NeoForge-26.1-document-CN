# 游戏测试 {#game-tests}

游戏测试是运行游戏内单元测试的一种方法。该系统被设计为可扩展和并行，以有效地运行大量不同的测试。测试对象交互和行为只是该框架众多应用中的一小部分。

## 创建游戏测试 {#creating-a-game-test}

标准游戏测试遵循三个基本步骤：

1. 加载一个结构或模板来保存测试交互或行为的场景。
1. 方法执行在场景中执行的逻辑。
1. 方法逻辑执行。如果达到成功状态，则测试成功。否则，测试将失败，并且结果将存储在与场景相邻的讲台内。

因此，要创建游戏测试，必须有一个保存场景初始启动状态的现有模板和一个提供执行逻辑的方法。

### 测试方法 {#the-test-method}

游戏测试方法是 `Consumer<GameTestHelper>` 引用，这意味着它接受 `GameTestHelper` 并且不返回任何内容。要识别游戏测试方法，它必须具有 `@GameTest` 注释：

```java
public class ExampleGameTests {
    @GameTest
    public static void exampleTest(GameTestHelper helper) {
        // Do stuff
    }
}
```

`@GameTest` 注释还包含配置游戏测试应如何运行的成员。

```java
// In some class
@GameTest(
    setupTicks = 20L, // The test spends 20 ticks to set up for execution
    required = false // The failure is logged but does not affect the execution of the batch
)
public static void exampleConfiguredTest(GameTestHelper helper) {
    // Do stuff
}
```

#### 相对定位 {#relative-positioning}

所有 `GameTestHelper` 方法都使用结构块的当前位置将结构模板场景内的相对坐标转换为其绝对坐标。为了方便相对定位和绝对定位之间的转换，可以分别使用 `GameTestHelper#absolutePos` 和 `GameTestHelper#relativePos`。

结构模板的相对位置可以在游戏中通过[测试命令][test]加载结构，将玩家放置在想要的位置，最后运行 `/test pos` 命令来获得。这将获取玩家相对于玩家 200 块内最近的结构的坐标。该命令会将相对位置导出为聊天中的可复制文本组件，以用作最终的局部变量。

:::tip
`/test pos` 生成的局部变量可以通过将其附加到命令末尾来指定其引用名称：

```bash
/test pos <var> # Exports 'final BlockPos <var> = new BlockPos(...);'
```
:::

#### 成功完成 {#successful-completion}

游戏测试方法负责一件事：在有效完成时标记测试成功。如果在达到超时（由 `GameTest#timeoutTicks` 定义）之前未达到成功状态，则测试自动失败。

`GameTestHelper` 内部有很多抽象方法可以用来定义成功状态；然而，有四点非常需要注意。

方法|描述
:---:                | :---
`#succeed`|测试被标记为成功。
`#succeedIf`|提供的 `Runnable` 会立即进行测试，如果没有抛出 `GameTestAssertException` 则测试成功。如果测试在立即计时未成功，则将其标记为失败。
`#succeedWhen`|所提供的 `Runnable` 在每个刻度之前都会进行测试，直到超时，如果对其中一个刻度的检查没有抛出 `GameTestAssertException`，则成功。
`#succeedOnTickWhen`|提供的 `Runnable` 在指定的刻度上进行测试，如果没有抛出 `GameTestAssertException` 则将成功。如果 `Runnable` 在任何其他刻度上成功，则将其标记为失败。

:::caution
每个刻度都会执行游戏测试，直到测试标记为成功。因此，在给定的刻度上安排成功的方法必须小心，以免在任何先前的刻度上失败。
:::

#### 调度操作 {#scheduling-actions}

测试开始时并非所有操作都会发生。可以安排操作在特定时间或间隔发生：

方法|描述
:---:            | :---
`#runAtTickTime`|该操作在指定的刻度上运行。
`#runAfterDelay`|该操作在当前刻度之后运行 `x` 刻度。
`#onEachTick`|该动作在每个刻度处运行。

#### 断言 {#assertions}

在游戏测试期间的任何时候，都可以做出断言来检查给定条件是否为真。 `GameTestHelper` 内部有多种断言方法；但是，只要不满足适当的状态，它就会简化为抛出 `GameTestAssertException`。

### 生成的测试方法 {#generated-test-methods}

如果需要动态生成游戏测试方法，可以创建测试方法生成器。这些方法不接受任何参数并返回 `TestFunction` 的集合。要识别测试方法生成器，它必须具有 `@GameTestGenerator` 注释：

```java
public class ExampleGameTests {
    @GameTestGenerator
    public static Collection<TestFunction> exampleTests() {
        // Return a collection of TestFunctions
    }
}
```

#### 测试函数 {#testfunction}

`TestFunction` 是 `@GameTest` 注释和运行测试的方法所保存的装箱信息。

:::tip
使用 `@GameTest` 注释的任何方法都会使用 `GameTestRegistry#turnMethodIntoTestFunction` 转换为 `TestFunction`。该方法可以用作创建 `TestFunction` 的参考，而无需使用注释。
:::

### 配料 {#batching}

游戏测试可以批量执行，而不是按注册顺序执行。可以通过提供相同的 `GameTest#batch` 字符串将测试添加到批次中。

就其本身而言，批处理并不能提供任何有用的东西。但是，批处理可用于在运行测试的当前级别上执行设置和拆卸状态。这是通过使用 `@BeforeBatch` 进行设置或 `@AfterBatch` 进行拆卸来注释方法来完成的。 `#batch` 方法必须与提供给游戏测试的字符串匹配。

批处理方法是 `Consumer<ServerLevel>` 引用，这意味着它们接受 `ServerLevel` 并且不返回任何内容：

```java
public class ExampleGameTests {
    @BeforeBatch(batch = "firstBatch")
    public static void beforeTest(ServerLevel level) {
        // Perform setup
    }

    @GameTest(batch = "firstBatch")
    public static void exampleTest2(GameTestHelper helper) {
        // Do stuff
    }
}
```

## 注册游戏测试 {#registering-a-game-test}

游戏测试必须注册才能在游戏中运行。有两种方法可以执行此操作：通过 `@GameTestHolder` 注释或 `RegisterGameTestsEvent`。两种注册方法仍然要求测试方法用 `@GameTest`、 `@GameTestGenerator`、 `@BeforeBatch` 或 `@AfterBatch` 进行注释。

### GameTestHolder {#gametestholder}

`@GameTestHolder` 注释注册类型（类、接口、枚举或记录）内的任何测试方法。 `@GameTestHolder` 包含具有多种用途的单一方法。在这种情况下，提供的 `#value` 必须是 mod 的 mod id；否则，测试将不会在默认配置下运行。

```java
@GameTestHolder(MODID)
public class ExampleGameTests {
    // ...
}
```

### 注册游戏测试事件 {#registergametestsevent}

`RegisterGameTestsEvent` 还可以使用 `#register` 注册类或方法。事件监听器必须被[添加][event]到 mod 事件总线。以这种方式注册的测试方法必须在每个用 `@GameTest` 注释的方法上向 ZX​​Q000002QXZ 提供其 mod id。

```java
// In some event handler class
@SubscribeEvent  // on the mod event bus
public static void registerTests(RegisterGameTestsEvent event) {
    event.register(ExampleGameTests.class);
}

// In ExampleGameTests
@GameTest(templateNamespace = MODID)
public static void exampleTest3(GameTestHelper helper) {
    // Perform setup
}
```

:::note
提供给 `GameTestHolder#value` 和 `GameTest#templateNamespace` 的值可以与当前 mod id 不同。 [buildscript][namespaces] 中的配置需要更改。
:::

## 结构模板 {#structure-templates}

游戏测试在由结构或模板加载的场景中执行。所有模板都定义场景的尺寸以及将加载的初始数据（块和实体）。该模板必须作为 `.nbt` 文件存储在 `data/<namespace>/structure` 中。

:::tip
可以使用结构块创建和保存结构模板。
:::

模板的位置由几个因素指定：

- 如果指定了模板的命名空间。
- 类是否应该添加到模板名称前面。
- 如果指定了模板的名称。

模板的命名空间由 `GameTest#templateNamespace` 确定，如果未指定则为 `GameTestHolder#value`，如果均未指定则为 `minecraft`。

如果 `@PrefixGameTestTemplate` 应用于带有测试注释的类或方法并设置为 `false`，则简单类名称不会添加到模板名称前面。否则，简单类名称将变为小写，并在模板名称之前添加一个点。

模板的名称由 `GameTest#template` 确定。如果未指定，则使用方法的小写名称。

```java
// Modid for all structures will be MODID
@GameTestHolder(MODID)
public class ExampleGameTests {

    // Class name is prepended, template name is not specified
    // Template Location at 'modid:examplegametests.exampletest'
    @GameTest
    public static void exampleTest(GameTestHelper helper) { /*...*/ }

    // Class name is not prepended, template name is not specified
    // Template Location at 'modid:exampletest2'
    @PrefixGameTestTemplate(false)
    @GameTest
    public static void exampleTest2(GameTestHelper helper) { /*...*/ }

    // Class name is prepended, template name is specified
    // Template Location at 'modid:examplegametests.test_template'
    @GameTest(template = "test_template")
    public static void exampleTest3(GameTestHelper helper) { /*...*/ }

    // Class name is not prepended, template name is specified
    // Template Location at 'modid:test_template2'
    @PrefixGameTestTemplate(false)
    @GameTest(template = "test_template2")
    public static void exampleTest4(GameTestHelper helper) { /*...*/ }
}
```

## 运行游戏测试 {#running-game-tests}

可以使用 `/test` 命令运行游戏测试。 `test` 命令具有高度可配置性；然而，只有少数对于运行测试很重要：

|子命令 |描述 |
|:-----------:|:------------------------------------------------------|
|`run`|运行指定的测试：`run <test_name>`。           |
|`runall`|运行所有可用的测试。                             |
|`runclosest`|在 15 个区块内运行距离玩家最近的测试。 |
|`runthese`|在玩家周围 200 个区块内运行测试。           |
|`runfailed`|运行上次运行中失败的所有测试。       |

:::note
子命令遵循测试命令：`/test <subcommand>`。
:::

## 构建脚本配置 {#buildscript-configurations}

游戏测试在构建脚本（`build.gradle` 文件）中提供额外的配置设置，以运行并集成到不同的设置中。

### 启用其他命名空间 {#enabling-other-namespaces}

如果构建脚本是[建议设置][buildscript]，则只会启用当前 mod id 下的游戏测试。要使其他命名空间能够从中加载游戏测试，运行配置必须将属性 `neoforge.enabledGameTestNamespaces` 设置为指定每个命名空间并以逗号分隔的字符串。如果该属性为空或未设置，则将加载所有命名空间。

```gradle
// Inside a run configuration
property 'neoforge.enabledGameTestNamespaces', 'modid1,modid2,modid3'
```

:::caution
命名空间之间不能有空格；否则，命名空间将无法正确加载。
:::

### 游戏测试服务器运行配置 {#game-test-server-run-configuration}

游戏测试服务器是运行构建服务器的特殊配置。构建服务器返回所需的失败游戏测试数量的退出代码。所有失败的测试，无论是必需的还是可选的，都会被记录。该服务器可以使用 `gradlew runGameTestServer` 运行。

<details>
<summary>Important infromation on NeoGradle</summary>

:::caution
由于 Gradle 工作方式的一个怪癖，默认情况下，如果任务强制系统退出，Gradle 守护进程将被终止，导致 Gradle 运行程序报告构建失败。 NeoGradle 默认情况下会在运行任务上设置强制退出，这样任何子项目都不会按顺序执行。然而，因此，游戏测试服务器总是会失败。

可以通过使用 `#setForceExit` 方法禁用运行配置上的强制退出来修复此问题：

```gradle
// Game Test Server run configuration
gameTestServer {
    // ...
    setForceExit false
}
```
:::
</details>


### 在其他运行配置中启用游戏测试 {#enabling-game-tests-in-other-run-configurations}

默认情况下，仅 `client`、 `server` 和 `gameTestServer` 运行配置启用了游戏测试。如果另一个运行配置应运行游戏测试，则 `neoforge.enableGameTest` 属性必须设置为 `true`。

```gradle
// Inside a run configuration
property 'neoforge.enableGameTest', 'true'
```

[test]: #running-game-tests
[namespaces]: #enabling-other-namespaces
[event]: ../concepts/events.md#registering-an-event-handler
[buildscript]: ../gettingstarted/index.md#simple-buildgradle-customizations

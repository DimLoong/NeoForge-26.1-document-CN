import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 游戏测试 {#game-tests}

游戏测试（Game Test）是一种运行游戏内单元测试的方式。该系统在设计上具有可扩展性，并能并行运行，从而高效地执行大量不同的测试。测试对象交互与行为只是这套框架众多用途中的一小部分。由于该系统既可以完全在代码中实现，也可以通过[数据包][datapacks]实现，下面两种方式都会展示。

## 创建游戏测试 {#creating-a-game-test}

一个标准的游戏测试遵循四个基本步骤：

1. 加载一个结构，或称模板，其中承载着用于测试交互或行为的场景。
1. 一个供测试运行的环境。
1. 一个用于运行逻辑的已注册函数。如果达到成功状态，则测试通过。否则，测试失败，结果会存储在场景旁边的一个讲台（lectern）中。
1. 一个将其他三个对象连接在一起的测试实例。

## 测试数据 {#the-test-data}

所有测试实例都持有一些 `TestData`，它定义了游戏测试应当如何运行，从其初始配置到要使用的环境和结构模板。由于 `TestData` 被序列化为一个 `MapCodec`，这些数据会与所有其他实例特定的参数一起存储在文件的根层级。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some game test examplemod:example_test
// In 'data/examplemod/test_instance/example_test.json'
{
    // `TestData`

    // The environment to run the test in
    // Points to 'data/examplemod/test_environment/example_environment.json'
    "environment": "examplemod:example_environment",

    // The structure used for the game test
    // Points to 'data/examplemod/structure/example_structure.nbt'
    "structure": "examplemod:example_structure",

    // The number of ticks that the game test will run until it automatically fails
    "max_ticks": 400,

    // The number of ticks that are used to setup everything required for the game test
    // This is not counted towards the maximum number of ticks the test can take
    // If not specified, defaults to 0
    "setup_ticks": 50,

    // Whether the test is required to succeed to mark the batch run as successful
    // If not specified, defaults to true
    "required": true,

    // Specifies how the structure and all subsequent helper methods should be rotated for the test
    // If not specified, nothing is rotated
    // Can be 'none', 'clockwise_90', '180', 'counterclockwise_90'
    "rotation": "clockwise_90",

    // When true, the test can only be ran through the `/test` command
    // If not specified, defaults to false
    "manual_only": true,

    // Specifies the maximum number of times that the test can be reran
    // If not specified, defaults to 1
    "max_attempts": 3,

    // Specifies the minimum number of successes that must occur for a test to be marked as successful
    // This must be less than or equal to the maximum number of attempts allowed
    // If not specified, defaults to 1
    "required_successes": 1,

    // Returns whether the structure boundary should keep the top empty
    // This is currently only used in block-based test instances
    // If not specified, defaults to false 
    "sky_access": false

    // ...
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Let's assume we have some test environment
public static final ResourceKey<TestEnvironmentDefinition<?>> EXAMPLE_ENVIRONMENT = ResourceKey.create(
    Registries.TEST_ENVIRONMENT,
    Identifier.fromNamespaceAndPath("examplemod", "example_environment")
);

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(
        new RegistrySetBuilder().add(Registries.TEST_INSTANCE, bootstrap -> {
            // Use this to get the test environments
            HolderGetter<TestEnvironmentDefinition<?>> environments = bootstrap.lookup(Registries.TEST_ENVIRONMENT);

            // Register a game test
            // Any fields not relevant to the test data are hidden
            bootstrap.register(..., new FunctionGameTestInstance(...,
                new TestData<>(
                    // The environment to run the test in
                    // Points to 'data/examplemod/test_environment/example_environment.json'
                    environments.getOrThrow(EXAMPLE_ENVIRONMENT),

                    // The structure used for the game test
                    // Points to 'data/examplemod/structure/example_structure.nbt'
                    Identifier.fromNamespaceAndPath("examplemod", "example_structure"),

                    // The number of ticks that the game test will run until it automatically fails
                    400,

                    // The number of ticks that are used to setup everything required for the game test
                    // This is not counted towards the maximum number of ticks the test can take
                    // If not specified, defaults to 0
                    50,

                    // Whether the test is required to succeed to mark the batch run as successful
                    // If not specified, defaults to true
                    true,

                    // Specifies how the structure and all subsequent helper methods should be rotated for the test
                    // If not specified, nothing is rotated
                    // Can be 'none', 'clockwise_90', '180', 'counterclockwise_90'
                    Rotation.CLOCKWISE_90,

                    // When true, the test can only be ran through the `/test` command
                    // If not specified, defaults to false
                    true,

                    // Specifies the maximum number of times that the test can be reran
                    // If not specified, defaults to 1
                    3,

                    // Specifies the minimum number of successes that must occur for a test to be marked as successful
                    // This must be less than or equal to the maximum number of attempts allowed
                    // If not specified, defaults to 1
                    1,

                    // Returns whether the structure boundary should keep the top empty
                    // This is currently only used in block-based test instances
                    // If not specified, defaults to false 
                    false
                )
            ));
        })
    );
}
```

</TabItem>
</Tabs>

## 结构模板 {#structure-templates}

游戏测试在由结构（或称模板）加载的场景中执行。所有模板都定义了场景的尺寸以及将被加载的初始数据（方块和实体）。模板必须以 `.nbt` 文件的形式存储在 `data/<namespace>/structure` 内。`TestData#structure` 使用一个相对的 `Identifier` 引用该 NBT 文件（例如，`examplemod:example_structure` 指向 `data/examplemod/structure/example_structure.nbt`）。

## 测试环境 {#test-environments}

所有游戏测试都在某个 `TestEnvironmentDefinition` 中运行，它决定了当前的 `ServerLevel` 应当如何被设置。然后，一旦测试完成，环境会被拆除，以便下一个或下一批实例运行。所有环境都是分批的，这意味着如果多个测试实例拥有相同的环境，它们会同时运行。所有测试环境都位于 `data/<namespace>/test_environment/<path>.json` 内。

原版提供了 `minecraft:default`，它不会修改 `ServerLevel`。不过，还有其他受支持的定义类型可用于构造环境。

### 游戏规则 {#game-rules}

此环境类型设置用于测试的游戏规则。在拆除期间，游戏规则会被重置为其默认值。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// examplemod:example_environment
// In 'data/examplemod/test_environment/example_environment.json'
{
    "type": "minecraft:game_rules",

    // A map of game rules to their set values
    "rules": {
        "minecraft:fire_damage": false,
        "minecraft:players_sleeping_percentage": 50
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Let's assume we have some test environment
public static final ResourceKey<TestEnvironmentDefinition<?>> EXAMPLE_ENVIRONMENT = ResourceKey.create(
    Registries.TEST_ENVIRONMENT,
    Identifier.fromNamespaceAndPath("examplemod", "example_environment")
);

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(
        new RegistrySetBuilder().add(Registries.TEST_ENVIRONMENT, bootstrap -> {

            // Register the environment
            bootstrap.register(
                EXAMPLE_ENVIRONMENT,
                new TestEnvironmentDefinition.SetGameRules(
                    new GameRuleMap.Builder()
                        // A map of game rules to their set values
                        .set(GameRules.FIRE_DAMAGE, false)
                        .set(GameRules.PLAYERS_SLEEPING_PERCENTAGE, 50)
                        .build()
                )
            );
        })
    );
}
```

</TabItem>
</Tabs>

### 时钟时间 {#clock-time}

此环境类型将指定的 `WorldClock` 时间设置为某个非负整数，类似于使用 `/time of <clock> set <number>` 命令的方式。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// examplemod:example_environment
// In 'data/examplemod/test_environment/example_environment.json'
{
    "type": "minecraft:clock_time",

    // The clock to set the time of
    // Points to a registered clock at `data/<namespace>/world_clock/<path>.json`
    "clock": "minecraft:overworld",

    // Sets the time of the clock
    "time": 13000
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Let's assume we have some test environment
public static final ResourceKey<TestEnvironmentDefinition<?>> EXAMPLE_ENVIRONMENT = ResourceKey.create(
    Registries.TEST_ENVIRONMENT,
    Identifier.fromNamespaceAndPath("examplemod", "example_environment")
);

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(
        new RegistrySetBuilder().add(Registries.TEST_ENVIRONMENT, bootstrap -> {
            // Getting clocks
            HolderGetter<WorldClock> clocks = bootstrap.lookup(Registries.WORLD_CLOCK);

            // Register the environment
            bootstrap.register(
                EXAMPLE_ENVIRONMENT,
                new TestEnvironmentDefinition.ClockTime(
                    // The clock to set the time of
                    clocks.getOrThrow(WorldClocks.OVERWORLD),
                    // Sets the time of the clock
                    13000
                )
            );
        })
    );
}
```

</TabItem>
</Tabs>

### 时间线属性 {#timeline-attributes}

此环境类型设置要应用于世界中环境属性的时间线（timeline）。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// examplemod:example_environment
// In 'data/examplemod/test_environment/example_environment.json'
{
    "type": "minecraft:timeline_attributes",

    // The timelines to apply to the level
    "timelines": [
        "minecraft:day",
        "minecraft:moon"
    ]
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Let's assume we have some test environment
public static final ResourceKey<TestEnvironmentDefinition<?>> EXAMPLE_ENVIRONMENT = ResourceKey.create(
    Registries.TEST_ENVIRONMENT,
    Identifier.fromNamespaceAndPath("examplemod", "example_environment")
);

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(
        new RegistrySetBuilder().add(Registries.TEST_ENVIRONMENT, bootstrap -> {
            // Getting timelines
            HolderGetter<Timeline> timelines = bootstrap.lookup(Registries.TIMELINE);

            // Register the environment
            bootstrap.register(
                EXAMPLE_ENVIRONMENT,
                new TestEnvironmentDefinition.Timelines(
                    // The timelines to apply to the level
                    List.of(
                        timelines.getOrThrow(Timelines.OVERWORLD_DAY),
                        timelines.getOrThrow(Timelines.MOON)
                    )
                )
            );
        })
    );
}
```

</TabItem>
</Tabs>

### 天气 {#weather}

此环境类型设置天气，类似于使用 `/weather` 命令的方式。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// examplemod:example_environment
// In 'data/examplemod/test_environment/example_environment.json'
{
    "type": "minecraft:weather",

    // Can be one of three values:
    // - clear   (No weather)
    // - rain    (Rain)
    // - thunder (Rain and thunder)
    "weather": "thunder"
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Let's assume we have some test environment
public static final ResourceKey<TestEnvironmentDefinition<?>> EXAMPLE_ENVIRONMENT = ResourceKey.create(
    Registries.TEST_ENVIRONMENT,
    Identifier.fromNamespaceAndPath("examplemod", "example_environment")
);

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(
        new RegistrySetBuilder().add(Registries.TEST_ENVIRONMENT, bootstrap -> {

            // Register the environment
            bootstrap.register(
                EXAMPLE_ENVIRONMENT,
                new TestEnvironmentDefinition.Weather(
                    // Can be one of three values:
                    // - clear   (No weather)
                    // - rain    (Rain)
                    // - thunder (Rain and thunder)
                    TestEnvironmentDefinition.Weather.Type.THUNDER
                )
            );
        })
    );
}
```

</TabItem>
</Tabs>

### Minecraft 函数 {#minecraft-functions}

此环境类型提供两个指向 `mcfunction` 的 Identifier，分别用于设置和拆除世界。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// examplemod:example_environment
// In 'data/examplemod/test_environment/example_environment.json'
{
    "type": "minecraft:function",

    // The setup mcfunction to use
    // If not specified, nothing will be ran
    // Points to 'data/examplemod/function/example/setup.mcfunction'
    "setup": "examplemod:example/setup",

    // The teardown mcfunction to use
    // If not specified, nothing will be ran
    // Points to 'data/examplemod/function/example/teardown.mcfunction'
    "teardown": "examplemod:example/teardown"
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Let's assume we have some test environment
public static final ResourceKey<TestEnvironmentDefinition<?>> EXAMPLE_ENVIRONMENT = ResourceKey.create(
    Registries.TEST_ENVIRONMENT,
    Identifier.fromNamespaceAndPath("examplemod", "example_environment")
);

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(
        new RegistrySetBuilder().add(Registries.TEST_ENVIRONMENT, bootstrap -> {

            // Register the environment
            bootstrap.register(
                EXAMPLE_ENVIRONMENT,
                new TestEnvironmentDefinition.Functions(
                    // The setup mcfunction to use
                    // If not specified, nothing will be ran
                    // Points to 'data/examplemod/function/example/setup.mcfunction'
                    Optional.of(Identifier.fromNamespaceAndPath("examplemod", "example/setup")),

                    // The teardown mcfunction to use
                    // If not specified, nothing will be ran
                    // Points to 'data/examplemod/function/example/teardown.mcfunction'
                    Optional.of(Identifier.fromNamespaceAndPath("examplemod", "example/teardown"))
                )
            );
        })
    );
}
```

</TabItem>
</Tabs>

### 复合 {#composites}

可以使用复合环境类型将多个环境合并起来。定义列表既可以接受对现有定义的引用，也可以接受内联定义。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// examplemod:example_environment
// In 'data/examplemod/test_environment/example_environment.json'
{
    "type": "minecraft:all_of",

    // A list of test environments to use
    // Can either specified the registry name or the environment itself
    "definitions": [
        // Points to 'data/minecraft/test_environment/default.json'
        "minecraft:default",
        {
            // A raw environment definition
            "type": "..."
        }
        // ...
    ]
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Let's assume we have some test environment
public static final ResourceKey<TestEnvironmentDefinition<?>> EXAMPLE_ENVIRONMENT = ResourceKey.create(
    Registries.TEST_ENVIRONMENT,
    Identifier.fromNamespaceAndPath("examplemod", "example_environment")
);

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(
        new RegistrySetBuilder().add(Registries.TEST_ENVIRONMENT, bootstrap -> {
            // Getting existing environments
            HolderGetter<TestEnvironmentDefinition<?>> environments = bootstrap.lookup(Registries.TEST_ENVIRONMENT);

            // Register the environment
            bootstrap.register(
                EXAMPLE_ENVIRONMENT,
                new TestEnvironmentDefinition.AllOf(
                    List.of(
                        // Points to 'data/minecraft/test_environment/default.json'
                        environments.getOrThrow(GameTestEnvironments.DEFAULT_KEY),
                        Holder.direct(
                            // Create a new TestEnvironmentDefinition here
                            ...
                        )
                        // ...
                    )
                )
            );
        })
    );
}
```

</TabItem>
</Tabs>

### 自定义定义类型 {#custom-definition-types}

一个自定义的 `TestEnvironmentDefinition<SavedDataType>` 类型提供三个方法：`setup`，用于修改 `ServerLevel` 并返回先前的 `SavedDataType` 泛型状态；`teardown`，用于借助 `SavedDataType` 重置被修改的内容；以及 `codec`，用于提供编码和解码该类型的 `MapCodec`：

```java
public record ExampleEnvironmentType(int value1, boolean value2) implements TestEnvironmentDefinition<Pair<Integer, Boolean>> {

    // Construct the map codec to register
    public static final MapCodec<ExampleEnvironmentType> CODEC = RecordCodecBuilder.mapCodec(instance -> instance.group(
            Codec.INT.fieldOf("value1").forGetter(ExampleEnvironmentType::value1),
            Codec.BOOL.fieldOf("value2").forGetter(ExampleEnvironmentType::value2)
        ).apply(instance, ExampleEnvironmentType::new)
    );

    @Override
    public Pair<Integer, Boolean> setup(ServerLevel level) {
        // Setup whatever is necessary here
        // return the original values of the modified level data
    }

    @Override
    public void teardown(ServerLevel level, Pair<Integer, Boolean> originalState) {
        // Undo whatever was changed within the setup method
        // This use the original state to reset the data
    }

    @Override
    public MapCodec<ExampleEnvironmentType> codec() {
        return CODEC;
    }
}
```

然后，可以将该 `MapCodec` [注册][registered]：


```java
public static final DeferredRegister<MapCodec<? extends TestEnvironmentDefinition>> TEST_ENVIRONMENT_DEFINITION_TYPES = DeferredRegister.create(
        BuiltInRegistries.TEST_ENVIRONMENT_DEFINITION_TYPE,
        "examplemod"
);

public static final Supplier<MapCodec<ExampleEnvironmentType>> EXAMPLE_ENVIRONMENT_CODEC = TEST_ENVIRONMENT_DEFINITION_TYPES.register(
    "example_environment_type",
    () -> ExampleEnvironmentType.CODEC
);
```

最后，就可以在你的环境定义中使用该类型：

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// examplemod:example_environment
// In 'data/examplemod/test_environment/example_environment.json'
{
    "type": "examplemod:example_environment_type",

    "value1": 0,
    "value2": true
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// Let's assume we have some test environment
public static final ResourceKey<TestEnvironmentDefinition<?>> EXAMPLE_ENVIRONMENT = ResourceKey.create(
    Registries.TEST_ENVIRONMENT,
    Identifier.fromNamespaceAndPath("examplemod", "example_environment")
);

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(
        new RegistrySetBuilder().add(Registries.TEST_ENVIRONMENT, bootstrap -> {

            // Register the environment
            bootstrap.register(
                EXAMPLE_ENVIRONMENT,
                new ExampleEnvironmentType(
                    0, true
                )
            );
        })
    );
}
```

</TabItem>
</Tabs>

## 测试函数 {#the-test-function}

游戏测试的基本概念围绕着运行某个接受 `GameTestHelper` 且无返回值的方法展开。调用 `GameTestHelper` 中的方法决定了测试是成功还是失败。每个测试函数都会被[注册][registered]，从而可以在测试实例中被引用：

```java
public class ExampleFunctions {

    // Here is our example function
    public static void exampleTest(GameTestHelper helper) {
        // Do Stuff
    }
}

// Register our function for use
public static final DeferredRegister<Consumer<GameTestHelper>> TEST_FUNCTION = DeferredRegister.create(
        BuiltInRegistries.TEST_FUNCTION,
        "examplemod"
);

public static final DeferredHolder<Consumer<GameTestHelper>, Consumer<GameTestHelper>> EXAMPLE_FUNCTION = TEST_FUNCTION.register(
    "example_function",
    () -> ExampleFunctions::exampleTest
);
```

### 相对定位 {#relative-positioning}

所有测试函数都会使用结构方块当前的位置，将结构模板场景内的相对坐标转换为绝对坐标。为了便于在相对定位和绝对定位之间转换，可以分别使用 `GameTestHelper#absolutePos` 和 `GameTestHelper#relativePos`。

在游戏中，可以通过[test 命令][test]加载结构、将玩家置于所需位置，最后运行 `/test pos` 命令来获取结构模板的相对位置。这会获取玩家相对于其 200 个方块范围内最近的结构的坐标。该命令会在聊天栏中将相对位置导出为一个可复制的文本组件，以用作最终的局部变量。

:::tip
`/test pos` 生成的局部变量可以通过在命令末尾追加引用名称来指定该名称：

```bash
/test pos <var> # Exports 'final BlockPos <var> = new BlockPos(...);'
```
:::

### 成功完成 {#successful-completion}

测试函数只负责一件事：在有效完成时将测试标记为成功。如果在到达超时（由 `TestData#maxTicks` 定义）之前没有达成任何成功状态，则测试自动失败。

`GameTestHelper` 中有许多抽象方法可用于定义成功状态；不过，有四个方法极其重要，需要了解。

方法               | 描述
:---:                | :---
`#succeed`           | 将测试标记为成功。
`#succeedIf`         | 立即测试所提供的 `Runnable`，若未抛出 `GameTestAssertException` 则成功。如果测试没有在当前这一 tick 立即成功，则被标记为失败。
`#succeedWhen`       | 每个 tick 都测试所提供的 `Runnable` 直到超时，若其中某个 tick 的检查未抛出 `GameTestAssertException` 则成功。
`#succeedOnTickWhen` | 在指定 tick 测试所提供的 `Runnable`，若未抛出 `GameTestAssertException` 则成功。如果该 `Runnable` 在任何其他 tick 上成功，则被标记为失败。

:::caution
游戏测试每个 tick 都会执行，直到测试被标记为成功。因此，那些在给定 tick 上排定成功的方法必须小心，务必在此前的任何 tick 上都保持失败。
:::

### 排定动作 {#scheduling-actions}

并非所有动作都会在测试开始时发生。可以将动作排定在特定时间或间隔发生：

方法           | 描述
:---:            | :---
`#runAtTickTime` | 该动作在指定 tick 运行。
`#runAfterDelay` | 该动作在当前 tick 之后的第 `x` 个 tick 运行。
`#onEachTick`    | 该动作每个 tick 都运行。

### 断言 {#assertions}

在游戏测试期间的任何时刻，都可以做出断言以检查某个给定条件是否为真。`GameTestHelper` 中有大量断言方法；不过，它们最终都归结为：一旦未满足相应状态，就抛出一个 `GameTestAssertException`。

## 注册测试实例 {#registering-the-test-instance}

有了 `TestData`、`TestEnvironmentDefinition` 和测试函数，我们现在就可以通过一个 `GameTestInstance` 将它们全部连接起来。每个测试实例都代表一个要运行的游戏测试。所有测试实例都位于 `data/<namespace>/test_instance/<path>.json` 内。

### 基于函数的测试 {#function-based-tests}

`FunctionGameTestInstance` 将一个 `TestData` 与某个已注册的测试函数关联起来。当被调用时，该测试实例会运行该测试函数。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some game test examplemod:example_test
// In 'data/examplemod/test_instance/example_test.json'
{
    // `TestData`

    "environment": "examplemod:example_environment",
    "structure": "examplemod:example_structure",
    "max_ticks": 400,
    "setup_ticks": 50,
    "required": true,
    "rotation": "clockwise_90",
    "manual_only": true,
    "max_attempts": 3,
    "required_successes": 1,
    "sky_access": false,

    // `FunctionGameTestInstance`
    "type": "minecraft:function",

    // Points to a 'Consumer<GameTestHelper>' in the test function registry
    "function": "examplemod:example_function"
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// The test instance key
public static final ResourceKey<GameTestInstance> EXAMPLE_TEST_INSTANCE = ResourceKey.create(
    Registries.TEST_INSTANCE,
    Identifier.fromNamespaceAndPath("examplemod", "example_test")
);

// Let's assume we have some test environment
public static final ResourceKey<TestEnvironmentDefinition<?>> EXAMPLE_ENVIRONMENT = ResourceKey.create(
    Registries.TEST_ENVIRONMENT,
    Identifier.fromNamespaceAndPath("examplemod", "example_environment")
);

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(
        new RegistrySetBuilder().add(Registries.TEST_INSTANCE, bootstrap -> {
            // Use this to get the test environments
            HolderGetter<TestEnvironmentDefinition<?>> environments = bootstrap.lookup(Registries.TEST_ENVIRONMENT);

            // Register a game test
            // Any fields not relevant to the test data are hidden
            bootstrap.register(EXAMPLE_TEST_INSTANCE,
                new FunctionGameTestInstance(
                    // Points to a 'Consumer<GameTestHelper>' in the test function registry
                    EXAMPLE_FUNCTION.getKey()
                    new TestData<>(
                        environments.getOrThrow(EXAMPLE_ENVIRONMENT),
                        Identifier.fromNamespaceAndPath("examplemod", "example_structure"),
                        400,
                        50,
                        true,
                        Rotation.CLOCKWISE_90,
                        true,
                        3,
                        1,
                        false
                    )
            ));
        })
    );
}
```

</TabItem>
</Tabs>

### 基于方块的测试 {#block-based-tests}

`BlockBasedTestInstance` 是一种特殊的测试实例，它依赖于 `Blocks#TEST_BLOCK` 收发的红石信号。为了让这种测试正常工作，结构模板必须至少包含两个测试方块：有且仅有一个设为 `TestBlockMode#START`，一个设为 `TestBlockMode#ACCEPT`。测试开始时，起始测试方块被触发，发出持续一个 tick 的 15 强度信号脉冲。预期该信号最终会触发其他处于 `LOG`、`FAIL` 或 `ACCEPT` 状态的测试方块。`LOG` 测试方块在被激活时也会发出一个 15 强度信号脉冲。`ACCEPT` 和 `FAIL` 测试方块则分别使测试实例成功或失败。在给定 tick 上，`ACCEPT` 始终优先于 `FAIL`。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some game test examplemod:example_test
// In 'data/examplemod/test_instance/example_test.json'
{
    // `TestData`

    "environment": "examplemod:example_environment",
    "structure": "examplemod:example_structure",
    "max_ticks": 400,
    "setup_ticks": 50,
    "required": true,
    "rotation": "clockwise_90",
    "manual_only": true,
    "max_attempts": 3,
    "required_successes": 1,
    "sky_access": false,

    // `BlockBasedTestInstance`
    "type": "minecraft:block_based"
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// The test instance key
public static final ResourceKey<GameTestInstance> EXAMPLE_TEST_INSTANCE = ResourceKey.create(
    Registries.TEST_INSTANCE,
    Identifier.fromNamespaceAndPath("examplemod", "example_test")
);

// Let's assume we have some test environment
public static final ResourceKey<TestEnvironmentDefinition<?>> EXAMPLE_ENVIRONMENT = ResourceKey.create(
    Registries.TEST_ENVIRONMENT,
    Identifier.fromNamespaceAndPath("examplemod", "example_environment")
);

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(
        new RegistrySetBuilder().add(Registries.TEST_INSTANCE, bootstrap -> {
            // Use this to get the test environments
            HolderGetter<TestEnvironmentDefinition<?>> environments = bootstrap.lookup(Registries.TEST_ENVIRONMENT);

            // Register a game test
            // Any fields not relevant to the test data are hidden
            bootstrap.register(EXAMPLE_TEST_INSTANCE,
                new BlockBasedTestInstance(
                    new TestData<>(
                        environments.getOrThrow(EXAMPLE_ENVIRONMENT),
                        Identifier.fromNamespaceAndPath("examplemod", "example_structure"),
                        400,
                        50,
                        true,
                        Rotation.CLOCKWISE_90,
                        true,
                        3,
                        1,
                        false
                    )
            ));
        })
    );
}
```

</TabItem>
</Tabs>

### 自定义测试实例 {#custom-test-instances}

如果你出于任何原因需要实现自己的基于测试的逻辑，可以扩展 `GameTestInstance`。必须实现两个方法：`run`，它代表测试函数；以及 `typeDescription`，它提供测试实例的描述。如果该测试实例要在数据生成中使用，它必须有一个 `MapCodec` 才能被[注册][registered]。

```java
public class ExampleTestInstance extends GameTestInstance {

    public ExampleTestInstance(int value1, boolean value2, TestData<Holder<TestEnvironmentDefinition>> info) {
        super(info);
    }

    @Override
    public void run(GameTestHelper helper) {
        // Run whatever game test commands you want
        helper.assertBlockPresent(...);

        // Make sure you have some way to succeed
        helper.succeedIf(() -> ...);
    }

    @Override
    public MapCodec<ExampleTestInstance> codec() {
        return EXAMPLE_INSTANCE_CODEC.get();
    }

    @Override
    protected MutableComponent typeDescription() {
        // Provides a description about what this test is supposed to be
        // Should use a translatable component
        return Component.literal("Example Test Instance");
    }
}

// Register our test instance for use
public static final DeferredRegister<MapCodec<? extends GameTestInstance>> TEST_INSTANCE = DeferredRegister.create(
        BuiltInRegistries.TEST_INSTANCE_TYPE,
        "examplemod"
);

public static final Supplier<MapCodec<? extends GameTestInstance>> EXAMPLE_INSTANCE_CODEC = TEST_INSTANCE.register(
    "example_test_instance",
    () -> RecordCodecBuilder.mapCodec(instance -> instance.group(
            Codec.INT.fieldOf("value1").forGetter(test -> test.value1),
            Codec.BOOL.fieldOf("value2").forGetter(test -> test.value2),
            TestData.CODEC.forGetter(ExampleTestInstance::info)
        ).apply(instance, ExampleTestInstance::new)
    )
);
```

然后，就可以在数据包中使用该测试实例：

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// For some game test examplemod:example_test
// In 'data/examplemod/test_instance/example_test.json'
{
    // `TestData`

    "environment": "examplemod:example_environment",
    "structure": "examplemod:example_structure",
    "max_ticks": 400,
    "setup_ticks": 50,
    "required": true,
    "rotation": "clockwise_90",
    "manual_only": true,
    "max_attempts": 3,
    "required_successes": 1,
    "sky_access": false,

    // `ExampleTestInstance`
    "type": "examplemod:example_test_instance",

    "value1": 0,
    "value2": true
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
// The test instance key
public static final ResourceKey<GameTestInstance> EXAMPLE_TEST_INSTANCE = ResourceKey.create(
    Registries.TEST_INSTANCE,
    Identifier.fromNamespaceAndPath("examplemod", "example_test")
);

// Let's assume we have some test environment
public static final ResourceKey<TestEnvironmentDefinition<?>> EXAMPLE_ENVIRONMENT = ResourceKey.create(
    Registries.TEST_ENVIRONMENT,
    Identifier.fromNamespaceAndPath("examplemod", "example_environment")
);

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(
        new RegistrySetBuilder().add(Registries.TEST_INSTANCE, bootstrap -> {
            // Use this to get the test environments
            HolderGetter<TestEnvironmentDefinition<?>> environments = bootstrap.lookup(Registries.TEST_ENVIRONMENT);

            // Register a game test
            // Any fields not relevant to the test data are hidden
            bootstrap.register(EXAMPLE_TEST_INSTANCE,
                new ExampleTestInstance(
                    0,
                    true,
                    new TestData<>(
                        environments.getOrThrow(EXAMPLE_ENVIRONMENT),
                        Identifier.fromNamespaceAndPath("examplemod", "example_structure"),
                        400,
                        50,
                        true,
                        Rotation.CLOCKWISE_90,
                        true,
                        3,
                        1,
                        false
                    )
            ));
        })
    );
}
```

</TabItem>
</Tabs>

### 跳过数据包 {#skipping-the-datapack}

如果你不想使用数据包来构造你的游戏测试，可以改为在[Mod 事件总线][event]上监听 `RegisterGameTestsEvent`，并分别通过 `registerEnvironment` 和 `registerTest` 注册你的环境和测试实例。

```java
@SubscribeEvent // on the mod event bus
public static void registerTests(RegisterGameTestsEvent event) {
    Holder<TestEnvironmentDefinition<?>> environment = event.registerEnvironment(
        // The name of the test environment
        EXAMPLE_ENVIRONMENT.identifier(),
        // A varargs of test environment definitions
        new ExampleEnvironmentType(
            0, true
        )
    );

    event.registerTest(
        // The name of the test instance
        EXAMPLE_TEST_INSTANCE.identifier(),
        new ExampleTestInstance(
            0,
            true,
            new TestData<>(
                environment,
                Identifier.fromNamespaceAndPath("examplemod", "example_structure"),
                400,
                50,
                true,
                Rotation.CLOCKWISE_90,
                true,
                3,
                1,
                false
            )
        )
    );
}
```

## 运行游戏测试 {#running-game-tests}

可以使用 `/test` 命令运行游戏测试。`test` 命令高度可配置；不过，对于运行测试而言，只有少数几个是重要的：

| 子命令  | 描述                                           |
|:-----------:|:------------------------------------------------------|
| `run`       | 运行指定的测试：`run <test_name>`。           |
| `runall`    | 运行所有可用的测试。                             |
| `runclosest`| 运行距离玩家 15 个方块内最近的测试。 |
| `runthese`  | 运行玩家 200 个方块范围内的测试。           |
| `runfailed` | 运行上一次运行中所有失败的测试。       |

:::note
子命令跟在 test 命令之后：`/test <subcommand>`。
:::

## 构建脚本配置 {#buildscript-configurations}

游戏测试在构建脚本（`build.gradle` 文件）中提供了额外的配置设置，以便在不同环境下运行和集成。

### 游戏测试服务端运行配置 {#game-test-server-run-configuration}

游戏测试服务端（Game Test Server）是一个特殊配置，它运行一个构建服务器。该构建服务器返回一个退出码，其值为必需的、失败的游戏测试的数量。所有失败的测试，无论是必需的还是可选的，都会被记录下来。可以使用 `gradlew runGameTestServer` 运行该服务器。

### 在其他运行配置中启用游戏测试 {#enabling-game-tests-in-other-run-configurations}

默认情况下，只有 `client` 和 `gameTestServer` 运行配置启用了游戏测试。如果另一个运行配置也应运行游戏测试，则必须将 `neoforge.enableGameTest` 属性设为 `true`。

```gradle
// Inside a run configuration
property 'neoforge.enableGameTest', 'true'
```

[datapacks]: ../resources/index.md#data
[registered]: ../concepts/registries.md#methods-for-registering
[test]: #running-game-tests
[event]: ../concepts/events.md#registering-an-event-handler

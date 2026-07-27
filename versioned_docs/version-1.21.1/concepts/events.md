---
sidebar_position: 3
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 事件 {#events}

NeoForge 的主要功能之一是事件系统。游戏中发生的各种事件都会触发事件。例如，当玩家右键单击时、当玩家或另一个实体跳跃时、当块被渲染时、当游戏加载时等时，有一些事件。 Mod 开发者可以为每个事件订阅事件处理器，然后在这些事件处理器内执行他们想要的行为。

事件在各自的事件总线上触发。最重要的总线是 `NeoForge.EVENT_BUS`，也称为**游戏**总线。除此之外，在启动过程中，会为每个加载的 mod 生成一个 mod 总线，并将其传递到 mod 的构造函数中。许多 mod 总线事件是并行触发的（与始终在同一线程上运行的主总线事件相反），从而显着提高了启动速度。有关详细信息，请参阅[下文][modbus]。

## 注册事件处理器 {#registering-an-event-handler}

有多种方法可以注册事件处理器。所有这些方法的共同点是每个事件处理器都是具有单个事件参数且没有结果的方法（即返回类型 `void`）。

### `IEventBus#addListener` {#ieventbusaddlistener}

注册方法处理器的最简单方法是注册其方法引用，如下所示：

```java
@Mod("yourmodid")
public class YourMod {
    public YourMod(IEventBus modBus) {
        NeoForge.EVENT_BUS.addListener(YourMod::onLivingJump);
    }

    // Heals an entity by half a heart every time they jump.
    private static void onLivingJump(LivingJumpEvent event) {
        Entity entity = event.getEntity();
        // Only heal on the server side
        if (!entity.level().isClientSide()) {
            entity.heal(1);
        }
    }
}
```

### `@SubscribeEvent` {#subscribeevent}

或者，事件处理器可以通过创建事件处理器方法并使用 `@SubscribeEvent` 对其进行注释来进行注释驱动。然后，你可以将包含类的实例传递到事件总线，注册该实例的所有带 `@SubscribeEvent` 注释的事件处理器：

```java
public class EventHandler {
    @SubscribeEvent
    public void onLivingJump(LivingJumpEvent event) {
        Entity entity = event.getEntity();
        if (!entity.level().isClientSide()) {
            entity.heal(1);
        }
    }
}

@Mod("yourmodid")
public class YourMod {
    public YourMod(IEventBus modBus) {
        NeoForge.EVENT_BUS.register(new EventHandler());
    }
}
```

你也可以静态地进行。只需将所有事件处理器设为静态，而不是类实例，而是传入类本身：

```java
public class EventHandler {
	@SubscribeEvent
    public static void onLivingJump(LivingJumpEvent event) {
        Entity entity = event.getEntity();
        if (!entity.level().isClientSide()) {
            entity.heal(1);
        }
    }
}

@Mod("yourmodid")
public class YourMod {
    public YourMod(IEventBus modBus) {
        NeoForge.EVENT_BUS.register(EventHandler.class);
    }
}
```

### `@EventBusSubscriber` {#eventbussubscriber}

<Tabs defaultValue="latest">
<TabItem value="latest" label="Latest">

我们可以更进一步，用 `@EventBusSubscriber` 注释事件处理器类。该注释由 NeoForge 自动发现，允许你从 mod 构造函数中删除所有与事件相关的代码。本质上，相当于在 mod 构造函数末尾调用 `NeoForge.EVENT_BUS.register(EventHandler.class)` 和 `modBus.register(EventHandler.class)`。这意味着所有处理器也必须是静态的。

</TabItem>
<TabItem value="21.1.180" label="[21.1.0,21.1.180]">

我们可以更进一步，用 `@EventBusSubscriber` 注释事件处理器类。该注释由 NeoForge 自动发现，允许你从 mod 构造函数中删除所有与事件相关的代码。本质上，它相当于在 mod 构造函数末尾调用 `NeoForge.EVENT_BUS.register(EventHandler.class)`。这意味着所有处理器也必须是静态的。

</TabItem>
</Tabs>

虽然不是必需的，但强烈建议在注释中指定 `modid` 参数，以便使调试更容易（特别是当涉及 mod 冲突时）。

```java
@EventBusSubscriber(modid = "yourmodid")
public class EventHandler {
    @SubscribeEvent
    public static void onLivingJump(LivingJumpEvent event) {
        Entity entity = event.getEntity();
        if (!entity.level().isClientSide()) {
            entity.heal(1);
        }
    }
}
```

## 事件选项 {#event-options}

### 字段和方法 {#fields-and-methods}

字段和方法可能是事件中最明显的部分。大多数事件都包含供事件处理器使用的上下文，例如导致事件的实体或事件发生的级别。

### 层次结构 {#hierarchy}

为了利用继承的优点，一些事件不直接扩展 `Event`，而是其子类之一，例如 `BlockEvent`（包含块相关事件的块上下文）或 `EntityEvent`（同样包含实体上下文）及其子类 `LivingEvent`（用于 `LivingEntity` 特定上下文）和 `PlayerEvent`（针对 `Player` 特定上下文）。这些提供上下文的超级事件是 `abstract`，无法收听。

:::danger
如果你监听 `abstract` 事件，你的游戏将会崩溃，因为这绝不是你想要的。你总是想听其中一个子事件。
:::

### 可取消的活动 {#cancellable-events}

某些事件实现 `ICancellableEvent` 接口。这些事件可以使用 `#setCanceled(boolean canceled)` 取消，并且可以使用 `#isCanceled()` 检查取消状态。如果取消某个事件，则该事件的其他事件处理器将不会运行，并且会启用与“取消”相关的某种行为。例如，取消 `LivingJumpEvent` 将阻止跳转。

事件处理器可以选择显式接收已取消的事件。这是通过将 `IEventBus#addListener`（或 `@SubscribeEvent`，具体取决于附加事件处理器的方式）中的 `receiveCanceled` 布尔参数设置为 true 来完成的。

### 三态和结果 {#tristates-and-results}

某些事件具有由 `TriState` 表示的三种潜在返回状态，或直接在事件类上的 `Result` 枚举。返回状态通常可以取消事件正在处理的操作 (`TriState#FALSE`)、强制操作运行 (`TriState#TRUE`) 或执行默认的普通行为 (`TriState#DEFAULT`)。

具有三种潜在返回状态的事件有一些 `set*` 方法来设置所需的结果。

```java
// In some event handler class

@SubscribeEvent // on the game event bus
public static void renderNameTag(RenderNameTagEvent event) {
    // Uses TriState to set the return state
    event.setCanRender(TriState.FALSE);
}

@SubscribeEvent // on the game event bus
public static void mobDespawn(MobDespawnEvent event) {
    // Uses a Result enum to set the return state
    event.setResult(MobDespawnEvent.Result.DENY);
}
```

### 优先级 {#priority}

可以选择为事件处理器分配优先级。 `EventPriority` 枚举包含五个值：`HIGHEST`、 `HIGH`、 `NORMAL`（默认）、 `LOW` 和 `LOWEST`。事件处理器按优先级从最高到最低的顺序执行。如果它们具有相同的优先级，它们会在主总线上按注册顺序触发，这与 mod 加载顺序大致相关，并且在 mod 总线上按确切的 mod 加载顺序触发（见下文）。

可以通过在 `IEventBus#addListener` 或 `@SubscribeEvent` 中设置 `priority` 参数来定义优先级，具体取决于附加事件处理器的方式。请注意，并行触发的事件的优先级将被忽略。

### 侧面事件 {#sided-events}

有些事件仅在一侧触发[side]。常见的示例包括各种渲染事件，这些事件仅在客户端上触发。由于仅限客户端的事件通常需要访问 Minecraft 代码库的其他仅限客户端的部分，因此需要相应地注册它们。

使用 `IEventBus#addListener()` 的事件处理器应通过 `FMLEnvironment.dist` 或制作的 mod 构造函数中的 `Dist` 参数检查当前物理端，并将监听器添加到单独的仅客户端类中，如 [sides][side] 上的文章中所述。

使用 `@EventBusSubscriber` 的事件处理器可以将边指定为注释的 `value` 参数，例如 `@EventBusSubscriber(value = Dist.CLIENT, modid = "yourmodid")`。

## 活动总线 {#event-buses}

虽然大多数事件发布在 `NeoForge.EVENT_BUS` 上，但有些事件发布在 mod 事件总线上。这些通常称为 mod 总线事件。 Mod 总线事件可以通过其超级接口 `IModBusEvent` 与常规事件区分开来。

<Tabs defaultValue="latest">
<TabItem value="latest" label="Latest">

mod 事件总线作为 mod 构造函数中的参数传递给你，然后你可以向其订阅 mod 总线事件。如果你使用 `@EventBusSubscriber`，事件将自动订阅到正确的总线。

</TabItem>
<TabItem value="21.1.180" label="[21.1.0,21.1.180]">

mod 事件总线作为 mod 构造函数中的参数传递给你，然后你可以向其订阅 mod 总线事件。如果你使用 `@EventBusSubscriber`，你还可以将总线设置为注释参数，如下所示：`@EventBusSubscriber(bus = Bus.MOD, modid = "yourmodid")`。默认总线为 `Bus.GAME`。

</TabItem>
</Tabs>

### Mod 生命周期 {#the-mod-lifecycle}

大多数 Mod 总线事件都是所谓的生命周期事件。生命周期事件在启动期间在每个 mod 的生命周期中运行一次。其中许多是通过子类化 `ParallelDispatchEvent` 并行触发的；如果你想在主线程上运行这些事件之一的代码，请使用 `#enqueueWork(Runnable runnable)` 将它们排入队列。

生命周期一般遵循以下顺序：

- 调用 mod 构造函数。在此处或下一步中注册你的事件处理器。
- 所有 `@EventBusSubscriber` 均被调用。
- `FMLConstructModEvent` 被解雇。
- 注册表事件被触发，其中包括 [`NewRegistryEvent`][newregistry]、[`DataPackRegistryEvent.NewRegistry`][newdatapackregistry]，对于每个注册表，还有 [`RegisterEvent`][registerevent]。
- `FMLCommonSetupEvent` 被解雇。这是各种杂项设置发生的地方。
- [side][side] 设置被触发：如果在物理客户端上，则为 `FMLClientSetupEvent`；如果在物理服务器上，则为 `FMLDedicatedServerSetupEvent`。
- `InterModComms` 已处理（见下文）。
- `FMLLoadCompleteEvent` 被解雇。

#### `InterModComms` {#intermodcomms}

`InterModComms` 是一个允许 Mod 开发者向其他 Mod 发送消息以获得兼容性功能的系统。该类保存 mod 的消息，所有方法的调用都是线程安全的。系统主要由两个事件驱动：`InterModEnqueueEvent` 和 `InterModProcessEvent`。

在 `InterModEnqueueEvent` 期间，你可以使用 `InterModComms#sendTo` 向其他 mod 发送消息。这些方法接受要发送消息的 mod 的 id、与消息数据关联的密钥（以区分不同的消息）以及保存消息数据的 `Supplier`。也可以选择指定发送者。

然后，在 `InterModProcessEvent` 期间，你可以使用 `InterModComms#getMessages` 将所有收到的消息作为 `IMCMessage` 对象获取流。它们保存数据的发送者、数据的预期接收者、数据密钥和实际数据的提供者。

### 其他 Mod 总线事件 {#other-mod-bus-events}

除了生命周期事件之外，还有一些在 mod 事件总线上触发的杂项事件，主要是出于遗留原因。这些事件通常是你可以注册、设置或初始化各种事物的事件。与生命周期事件相比，这些事件中的大多数不是并行运行的。举几个例子：

- `RegisterColorHandlersEvent`
- `ModelEvent.BakingCompleted`
- `TextureAtlasStitchedEvent`

:::warning
大多数这些事件计划在未来版本中转移到主事件总线上。
:::

[modbus]: #event-buses
[newdatapackregistry]: registries.md#custom-datapack-registries
[newregistry]: registries.md#custom-registries
[registerevent]: registries.md#registerevent
[side]: sides.md

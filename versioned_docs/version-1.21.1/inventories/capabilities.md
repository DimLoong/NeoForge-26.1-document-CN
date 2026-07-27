---
sidebar_position: 2
---
# Capability {#capabilities}

Capability 允许以动态且灵活的方式公开 Capability，而无需直接实现许多接口。

一般来说，每个 Capability 都以接口的形式提供一个 Capability。

NeoForge 增加了对方块、实体和物品堆栈的 Capability 支持。这将在以下部分中更详细地解释。

## 为什么要使用 Capability？ {#why-use-capabilities}

Capability 旨在将方块、实体或物品堆栈可以做什么和它如何做分开。如果你想知道 Capability 是否是适合工作的工具，请问自己以下问题：

1. 我是否只关心方块、实体或物品堆栈可以做什么，而不关心它如何做？
1. **什么**行为是否仅适用于某些方块、实体或物品堆栈，而不是全部？
1. 该行为的实现方式取决于特定的方块、实体或物品堆栈吗？

以下是良好使用 Capability 的一些示例：

- *“我希望我的流体容器与其他 Mod 的流体容器兼容，但我不知道每个流体容器的具体细节。”* - 是的，使用 `IFluidHandler` Capability。
- *“我想计算某个实体中有多少个物品，但我不知道该实体如何存储它们。”* - 是的，使用 `IItemHandler` Capability。
- *“我想用能量填充一些物品堆栈，但我不知道物品堆栈如何存储它。”* - 是的，使用 `IEnergyStorage` Capability。
- *“我想对玩家当前瞄准的任何方块应用一些颜色，但我不知道该方块将如何转换。”* - 是的。 NeoForge 不提供对方块进行着色的 Capability，但你可以自己实现。

以下是不鼓励使用 Capability 的示例：

- *“我想检查一个实体是否在我的机器范围内。”* - 不，请使用辅助方法。

## NeoForge 提供的 Capability {#neoforge-provided-capabilities}

NeoForge 提供以下三个接口的 Capability：`IItemHandler`、 `IFluidHandler` 和 `IEnergyStorage`。

`IItemHandler` 公开了一个用于处理库存槽位的接口。 `IItemHandler` 型的 Capability 为：

- `Capabilities.ItemHandler.BLOCK`：可自动访问的方块库存（用于箱子、机器等）。
- `Capabilities.ItemHandler.ENTITY`：实体的库存内容（额外的玩家位置、生物/生物库存/袋子）。
- `Capabilities.ItemHandler.ENTITY_AUTOMATION`：可自动访问的实体库存（船、矿车等）。
- `Capabilities.ItemHandler.ITEM`：物品堆栈的内容（便携式背包等）。

`IFluidHandler` 公开了用于处理流体库存的接口。 `IFluidHandler` 型的 Capability 为：

- `Capabilities.FluidHandler.BLOCK`：可自动访问的方块的流体库存。
- `Capabilities.FluidHandler.ENTITY`：实体的流体库存。
- `Capabilities.FluidHandler.ITEM`：物品堆栈的流动库存。
由于桶容纳流体的方式，此 Capability 属于特殊的 `IFluidHandlerItem` 类型。

`IEnergyStorage` 公开了用于处理能量容器的接口。它基于 TeamCoFH 的 RedstoneFlux API。 `IEnergyStorage` 型的 Capability 为：

- `Capabilities.EnergyStorage.BLOCK`：方块内包含的能量。
- `Capabilities.EnergyStorage.ENTITY`：实体内部包含的能量。
- `Capabilities.EnergyStorage.ITEM`：物品堆栈中包含的能量。

## 创建 Capability {#creating-a-capability}

NeoForge 支持方块、实体和物品堆栈的 Capability。

Capability 允许使用某些调度逻辑查找某些 API 的实现。 NeoForge 中实现了以下几种 Capability：

- `BlockCapability`：方块和方块实体的 Capability；行为取决于特定的 `Block`。
- `EntityCapability`：实体的 Capability：行为取决于特定的 `EntityType`。
- `ItemCapability`：物品堆栈的 Capability：行为取决于特定的 `Item`。

:::tip
为了与其他 mod 兼容，如果可能，我们建议使用 NeoForge 在 `Capabilities` 类中提供的 Capability。否则，你可以按照本节中的描述创建自己的。
:::

创建 Capability 是单个函数调用，生成的对象应存储在 `static final` 字段中。必须提供以下参数：

- Capability 的名称。
    - 多次创建同名的 Capability 将始终返回相同的对象。
    - 不同名称的 Capability**完全独立**，可以用于不同的目的。
- 正在查询的行为类型。这是 `T` 类型参数。
- 查询中附加上下文的类型。这是 `C` 类型参数。

例如，以下是如何声明侧面感知方块 `IItemHandler`s 的 Capability：

```java
public static final BlockCapability<IItemHandler, @Nullable Direction> ITEM_HANDLER_BLOCK =
    BlockCapability.create(
        // Provide a name to uniquely identify the capability.
        ResourceLocation.fromNamespaceAndPath("mymod", "item_handler"),
        // Provide the queried type. Here, we want to look up `IItemHandler` instances.
        IItemHandler.class,
        // Provide the context type. We will allow the query to receive an extra `Direction side` parameter.
        Direction.class);
```

`@Nullable Direction` 对于方块来说非常常见，因此有一个专门的帮助程序：

```java
public static final BlockCapability<IItemHandler, @Nullable Direction> ITEM_HANDLER_BLOCK =
    BlockCapability.createSided(
        // Provide a name to uniquely identify the capability.
        ResourceLocation.fromNamespaceAndPath("mymod", "item_handler"),
        // Provide the queried type. Here, we want to look up `IItemHandler` instances.
        IItemHandler.class);
```

如果不需要上下文，则应使用 `Void`。还有一个用于无上下文 Capability 的专用助手：

```java
public static final BlockCapability<IItemHandler, Void> ITEM_HANDLER_NO_CONTEXT =
    BlockCapability.createVoid(
        // Provide a name to uniquely identify the capability.
        ResourceLocation.fromNamespaceAndPath("mymod", "item_handler_no_context"),
        // Provide the queried type. Here, we want to look up `IItemHandler` instances.
        IItemHandler.class);
```

对于实体和物品堆栈，类似的方法分别存在于 `EntityCapability` 和 `ItemCapability` 中。

## 查询 Capability {#querying-capabilities}

一旦我们在静态字段中拥有 `BlockCapability`、 `EntityCapability` 或 `ItemCapability` 对象，我们就可以查询 Capability。

对于实体和物品堆栈，我们可以尝试使用 `getCapability` 查找 Capability 的实现。如果结果是 `null`，则没有可用的实现。

例如：

```java
var object = entity.getCapability(CAP, context);
if (object != null) {
    // Use object
}
```

```java
var object = stack.getCapability(CAP, context);
if (object != null) {
    // Use object
}
```

方块 Capability 的使用有点不同，因为没有方块实体的方块也可以具有 Capability。现在在 `level` 上执行查询，并使用我们正在查找的 `pos`ition 作为附加参数：

```java
var object = level.getCapability(CAP, pos, context);
if (object != null) {
    // Use object
}
```

如果方块实体和/或方块状态已知，则可以传递它们以节省查询时间：

```java
var object = level.getCapability(CAP, pos, blockState, blockEntity, context);
if (object != null) {
    // Use object
}
```

举一个更具体的例子，下面是如何从 `Direction.NORTH` 端查询一个方块的 `IItemHandler` Capability：

```java
IItemHandler handler = level.getCapability(Capabilities.ItemHandler.BLOCK, pos, Direction.NORTH);
if (handler != null) {
    // Use the handler for some item-related operation.
}
```

## 方块 Capability 缓存 {#block-capability-caching}

当查找 Capability 时，系统将在后台执行以下步骤：

1. 如果未提供方块实体和方块状态，则获取它们。
1. 获取已注册的 Capability 提供者。 （更多内容见下文）。
1. 迭代提供商并询问他们是否可以提供该 Capability。
1. 其中一个提供者将返回一个 Capability 实例，可能会分配一个新对象。

该实现相当高效，但对于频繁执行的查询（例如每个游戏周期），这些步骤可能会占用大量服务器时间。 `BlockCapabilityCache` 系统为给定位置频繁查询的 Capability 提供了显着的加速。

:::tip
一般情况下，会创建一次 `BlockCapabilityCache`，然后将其存储在频繁进行 Capability 查询的对象的字段中。存储缓存的具体时间和位置取决于你。
:::

要创建缓存，请调用具有查询 Capability、级别、位置和查询上下文的 `BlockCapabilityCache.create`。

```java
// Declare the field:
private BlockCapabilityCache<IItemHandler, @Nullable Direction> capCache;

// Later, for example in `onLoad` for a block entity:
this.capCache = BlockCapabilityCache.create(
    Capabilities.ItemHandler.BLOCK, // capability to cache
    level, // level
    pos, // target position
    Direction.NORTH // context
);
```

然后使用 `getCapability()` 查询缓存：

```java
IItemHandler handler = this.capCache.getCapability();
if (handler != null) {
    // Use the handler for some item-related operation.
}
```

**缓存会被垃圾收集器自动清除，无需注销。**

当 Capability 对象发生变化时也可以收到通知！这包括 Capability 更改 (`oldHandler != newHandler`)、变得不可用 (`null`) 或再次可用（不再是 `null`）。

然后需要使用两个附加参数创建缓存：

- 有效性检查，用于确定缓存是否仍然有效。
    - 在作为方块实体字段的最简单用法中，`() -> !this.isRemoved()` 就可以了。
- 失效监听器，在 Capability 更改时调用。
    - 你可以在此处对 Capability 更改、删除或外观做出反应。

```java
// With optional invalidation listener:
this.capCache = BlockCapabilityCache.create(
    Capabilities.ItemHandler.BLOCK, // capability to cache
    level, // level
    pos, // target position
    Direction.NORTH, // context
    () -> !this.isRemoved(), // validity check (because the cache might outlive the object it belongs to)
    () -> onCapInvalidate() // invalidation listener
);
```

## 区块 Capability 失效 {#block-capability-invalidation}

:::info
失效是方块 Capability 独有的。实体和物品堆栈 Capability 无法缓存，也不需要失效。
:::

为了确保缓存可以正确更新其存储的 Capability，**修改者必须在 Capability 更改、出现或消失时调用 `level.invalidateCapabilities(pos)`**。

```java
// whenever a capability changes, appears, or disappears:
level.invalidateCapabilities(pos);
```

NeoForge 已经处理常见情况，例如方块加载/卸载和方块实体创建/删除，但其他情况需要由 Mod 开发者显式处理。例如，Mod 开发者必须在以下情况下使 Capability 失效：

- 如果之前返回的 Capability 不再有效。
- 如果通过覆盖 `onPlace` 来放置 Capability 提供方块（没有方块实体）或更改状态。
- 如果通过覆盖 `onRemove` 来删除提供 Capability 的方块（没有方块实体）。

有关普通方块示例，请参阅 `ComposterBlock.java` 文件。

有关更多信息，请参阅[`IBlockCapabilityProvider`][block-cap-provider]的 javadoc。

## 注册 Capability {#registering-capabilities}

Capability_提供者_是最终提供 Capability 的东西。 Capability 提供者是一个可以返回 Capability 实例的函数，如果无法提供该 Capability，则可以返回 `null`。提供商具体针对：

- 他们提供的给定 Capability，以及
- 它们所提供的方块实例、方块实体类型、实体类型或物品实例。

它们需要在 `RegisterCapabilitiesEvent` 中注册。

区块提供商注册为 `registerBlock`。例如：

```java
@SubscribeEvent  // on the mod event bus
public static void registerCapabilities(RegisterCapabilitiesEvent event) {
    event.registerBlock(
        Capabilities.ItemHandler.BLOCK, // capability to register for
        (level, pos, state, be, side) -> <return the IItemHandler>,
        // blocks to register for
        MY_ITEM_HANDLER_BLOCK,
        MY_OTHER_ITEM_HANDLER_BLOCK
    );
}
```

一般来说，注册将特定于某些方块实体类型，因此还提供了 `registerBlockEntity` 帮助器方法：

```java
event.registerBlockEntity(
    Capabilities.ItemHandler.BLOCK, // capability to register for
    MY_BLOCK_ENTITY_TYPE, // block entity type to register for
    (myBlockEntity, side) -> myBlockEntity.myIItemHandlerForTheGivenSide
);
```

:::danger
如果之前由方块或方块实体提供者返回的 Capability 不再有效，*你必须通过调用 `level.invalidateCapabilities(pos)` 使缓存无效**。更多信息请参阅上面的[无效部分][invalidation]。
:::

实体注册类似，使用 `registerEntity`：

```java
event.registerEntity(
    Capabilities.ItemHandler.ENTITY, // capability to register for
    MY_ENTITY_TYPE, // entity type to register for
    (myEntity, context) -> myEntity.myIItemHandlerForTheGivenContext
);
```

物品注册也类似。请注意，提供者接收堆栈：

```java
event.registerItem(
    Capabilities.ItemHandler.ITEM, // capability to register for
    (itemStack, context) -> <return the IItemHandler for the itemStack>,
    // items to register for
    MY_ITEM,
    MY_OTHER_ITEM
);
```

## 所有对象的注册 Capability {#registering-capabilities-for-all-objects}

如果由于某种原因你需要为所有方块、实体或物品注册提供程序，则你将需要迭代相应的注册表并为每个对象注册提供程序。

例如，NeoForge 使用此系统为所有 `BucketItem`（不包括子类）注册流体处理器 Capability：

```java
// For reference, you can find this code in the `CapabilityHooks` class.
for (Item item : BuiltInRegistries.ITEM) {
    if (item.getClass() == BucketItem.class) {
        event.registerItem(Capabilities.FluidHandler.ITEM, (stack, ctx) -> new FluidBucketWrapper(stack), item);
    }
}
```

提供商需要按照注册的顺序提供 Capability。如果你想在 NeoForge 已经为你的对象之一注册的提供程序之前运行，请以更高的优先级注册你的 `RegisterCapabilitiesEvent` 处理器。

例如：

```java
modBus.addListener(RegisterCapabilitiesEvent.class, event -> {
    event.registerItem(
        Capabilities.FluidHandler.ITEM,
        (stack, ctx) -> new MyCustomFluidBucketWrapper(stack),
        // blocks to register for
        MY_CUSTOM_BUCKET);
}, EventPriority.HIGH); // use HIGH priority to register before NeoForge!
```

有关 NeoForge 本身注册的提供程序列表，请参阅 [`CapabilityHooks`][capability-hooks]。

[block-cap-provider]: https://github.com/neoforged/NeoForge/blob/1.21.x/src/main/java/net/neoforged/neoforge/capabilities/IBlockCapabilityProvider.java
[capability-hooks]: https://github.com/neoforged/NeoForge/blob/1.21.x/src/main/java/net/neoforged/neoforge/capabilities/CapabilityHooks.java
[invalidation]: #block-capability-invalidation

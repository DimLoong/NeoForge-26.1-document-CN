---
sidebar_position: 1
---
# Capabilities {#capabilities}

Capability（能力系统）能够以动态、灵活的方式暴露功能，而无需直接去实现大量接口。

概括来说，每个 Capability 都以接口的形式提供一项功能。

NeoForge 为方块、实体和物品堆叠添加了 Capability 支持。后续章节会更详细地介绍这一点。

## 为什么要使用 Capability？ {#why-use-capabilities}

Capability 的设计目标是把方块、实体或物品堆叠**能做什么**与它**如何做到**分离开来。如果你拿不准 Capability 是否适合某项工作，可以问自己以下几个问题：

1. 我是否只关心某个方块、实体或物品堆叠**能做什么**，而不关心它**如何做到**？
1. 这个**能做什么**（即行为）是否只在部分方块、实体或物品堆叠上可用，而非全部？
1. 这个**如何做到**（即该行为的实现）是否取决于具体的方块、实体或物品堆叠？

以下是几个恰当使用 Capability 的示例：

- *“我希望自己的流体容器能与其他 Mod 的流体容器兼容，但我并不清楚每个流体容器的具体实现。”* —— 可以，使用 `ResourceHandler<FluidResource>` Capability。
- *“我想统计某个实体里有多少物品，但我不知道该实体是如何存储它们的。”* —— 可以，使用 `ResourceHandler<ItemResource>` Capability。
- *“我想为某个物品堆叠充能，但我不知道该物品堆叠是如何存储能量的。”* —— 可以，使用 `EnergyHandler` Capability。
- *“我想为玩家当前瞄准的任意方块上色，但我不知道该方块会被如何变换。”* —— 可以。NeoForge 并未提供为方块上色的 Capability，但你可以自己实现一个。

以下是一个不建议使用 Capability 的示例：

- *“我想检查某个实体是否在我的机器的作用范围内。”* —— 不要这样做，改用辅助方法即可。

## NeoForge 提供的 Capability {#neoforge-provided-capabilities}

NeoForge 为以下三种[资源处理器（Resource Handler）][resourcehandler]提供了 Capability：`ResourceHandler<ItemResource>`、`ResourceHandler<FluidResource>` 和 `EnergyHandler`。

`ResourceHandler<ItemResource>` 暴露了一个用于管理物品栏槽位的接口。类型为 `ResourceHandler<ItemResource>` 的 Capability 有：

- `Capabilities.Item.BLOCK`：方块的、可供自动化访问的物品栏（用于箱子、机器等）。
- `Capabilities.Item.ENTITY`：实体的物品栏内容（额外的玩家槽位、生物/怪物的物品栏/背包）。
- `Capabilities.Item.ENTITY_AUTOMATION`：实体的、可供自动化访问的物品栏（船、矿车等）。
- `Capabilities.Item.ITEM`：物品堆叠的内容物（便携背包之类）。

`ResourceHandler<FluidResource>` 暴露了一个用于管理流体物品栏的接口。类型为 `ResourceHandler<FluidResource>` 的 Capability 有：

- `Capabilities.Fluid.BLOCK`：方块的、可供自动化访问的流体物品栏。
- `Capabilities.Fluid.ENTITY`：实体的流体物品栏。
- `Capabilities.Fluid.ITEM`：物品堆叠的流体物品栏。

`EnergyHandler` 暴露了一个用于处理能量容器的接口。它基于 TeamCoFH 的 RedstoneFlux API。类型为 [`EnergyHandler`][energyhandler] 的 Capability 有：

- `Capabilities.Energy.BLOCK`：方块内部存储的能量。
- `Capabilities.Energy.ENTITY`：实体内部存储的能量。
- `Capabilities.Energy.ITEM`：物品堆叠内部存储的能量。

## 创建 Capability {#creating-a-capability}

NeoForge 支持为方块、实体和物品堆叠创建 Capability。

Capability 允许通过某种分发逻辑来查找某些 API 的实现。NeoForge 实现了以下几类 Capability：

- `BlockCapability`：针对方块与方块实体的 Capability；行为取决于具体的 `Block`。
    - 该 Capability 通常会指定一个 `Direction` 上下文，以便根据不同的面提供不同的资源。
- `EntityCapability`：针对实体的 Capability；行为取决于具体的 `EntityType`。
    - 该 Capability 通常会指定一个 `Direction` 上下文，以便根据不同的面提供不同的资源。
- `ItemCapability`：针对物品堆叠的 Capability；行为取决于具体的 `Item`。
    - 该 Capability 通常会为持有该物品资源指定一个 [`ItemAccess`][itemaccess] 上下文。

:::tip
为了与其他 Mod 兼容，我们推荐尽量使用 NeoForge 在 `Capabilities` 类中提供的 Capability。否则，你可以按照本节所述自行创建。
:::

创建 Capability 只需一次函数调用，得到的对象应存储在一个 `static final` 字段中。必须提供以下参数：

- Capability 的名称。
    - 用同一名称多次创建 Capability 总会返回同一个对象。
    - 名称不同的 Capability **彼此完全独立**，可用于不同的用途。
- 被查询的行为类型。这就是 `T` 类型参数。
- 查询中附加上下文的类型。这就是 `C` 类型参数。

例如，下面演示了如何为面向不同面的方块 `ResourceHandler<ItemResource>` 声明一个 Capability：

```java
public static final BlockCapability<ResourceHandler<ItemResource>, @Nullable Direction> ITEM_HANDLER_BLOCK =
    BlockCapability.create(
        // Provide a name to uniquely identify the capability.
        Identifier.fromNamespaceAndPath("mymod", "item_handler"),
        // Provide the queried type. Here, we want to look up `ResourceHandler<ItemResource>` instances.
        ResourceHandler.asClass(),
        // Provide the context type. We will allow the query to receive an extra `Direction side` parameter.
        Direction.class
    );
```

`@Nullable Direction` 对方块来说非常常见，因此有一个专门的辅助方法：

```java
public static final BlockCapability<ResourceHandler<ItemResource>, @Nullable Direction> ITEM_HANDLER_BLOCK =
    BlockCapability.createSided(
        // Provide a name to uniquely identify the capability.
        Identifier.fromNamespaceAndPath("mymod", "item_handler"),
        // Provide the queried type. Here, we want to look up `ResourceHandler<ItemResource>` instances.
        ResourceHandler.asClass()
    );
```

如果不需要上下文，应使用 `Void`。对于无上下文的 Capability，同样有一个专门的辅助方法：

```java
public static final BlockCapability<ResourceHandler<ItemResource>, Void> ITEM_HANDLER_NO_CONTEXT =
    BlockCapability.createVoid(
        // Provide a name to uniquely identify the capability.
        Identifier.fromNamespaceAndPath("mymod", "item_handler_no_context"),
        // Provide the queried type. Here, we want to look up `ResourceHandler<ItemResource>` instances.
        ResourceHandler.asClass()
    );
```

对于实体和物品堆叠，`EntityCapability` 和 `ItemCapability` 中分别提供了类似的方法。

## 查询 Capability {#querying-capabilities}

一旦我们在静态字段中拥有了 `BlockCapability`、`EntityCapability` 或 `ItemCapability` 对象，就可以查询 Capability 了。

对于实体和物品堆叠，我们可以用 `getCapability` 尝试查找某个 Capability 的实现。如果结果为 `null`，则表示没有可用的实现。

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

方块 Capability 的用法略有不同，因为没有方块实体的方块同样可以拥有 Capability。此时查询在 `level` 上进行，并把我们要查找的 `pos`（位置）作为附加参数：

```java
var object = level.getCapability(CAP, pos, context);
if (object != null) {
    // Use object
}
```

如果已知方块实体和/或方块状态，可以把它们传入以节省查询时间：

```java
var object = level.getCapability(CAP, pos, blockState, blockEntity, context);
if (object != null) {
    // Use object
}
```

举一个更具体的例子，下面演示了如何从 `Direction.NORTH` 面查询某个方块的 `ResourceHandler<ItemResource>` Capability：

```java
ResourceHandler<ItemResource> handler = level.getCapability(Capabilities.Item.BLOCK, pos, Direction.NORTH);
if (handler != null) {
    // Use the handler for some item-related operation.
}
```

## 方块 Capability 缓存 {#block-capability-caching}

查询某个 Capability 时，系统会在底层执行以下步骤：

1. 若未提供方块实体和方块状态，则获取它们。
1. 获取已注册的 Capability 提供器（下文详述）。
1. 遍历这些提供器，询问它们能否提供该 Capability。
1. 其中一个提供器会返回一个 Capability 实例，可能会分配一个新对象。

该实现相当高效，但对于频繁执行的查询（例如每游戏刻一次），这些步骤会占用可观的服务端时间。`BlockCapabilityCache` 系统能为在给定位置频繁查询的 Capability 带来大幅提速。

:::tip
一般来说，`BlockCapabilityCache` 会创建一次，然后存储在执行频繁 Capability 查询的对象的字段中。具体何时、在何处存储该缓存由你决定。
:::

要创建缓存，调用 `BlockCapabilityCache.create`，传入要查询的 Capability、level、位置以及查询上下文。

```java
// Declare the field:
private BlockCapabilityCache<ResourceHandler<ItemResource>, @Nullable Direction> capCache;

// Later, for example in `onLoad` for a block entity:
this.capCache = BlockCapabilityCache.create(
    Capabilities.Item.BLOCK, // capability to cache
    level, // level
    pos, // target position
    Direction.NORTH // context
);
```

随后使用 `getCapability()` 查询缓存：

```java
ResourceHandler<ItemResource> handler = this.capCache.getCapability();
if (handler != null) {
    // Use the handler for some item-related operation.
}
```

**该缓存会由垃圾回收器自动清理，无需手动注销。**

你还可以在 Capability 对象发生变化时收到通知！这包括 Capability 发生更换（`oldHandler != newHandler`）、变为不可用（`null`）或再次变为可用（不再是 `null`）。

此时创建缓存需要额外两个参数：

- 一个有效性检查，用于判断缓存是否仍然有效。
    - 在最简单的场景下，作为方块实体的字段，`() -> !this.isRemoved()` 即可满足需求。
- 一个失效监听器，当 Capability 变化时被调用。
    - 你可以在这里对 Capability 的变化、移除或出现作出响应。

```java
// In `onLoad` for a block entity:
// With optional invalidation listener:
this.capCache = BlockCapabilityCache.create(
    Capabilities.Item.BLOCK, // capability to cache
    level, // level
    pos, // target position
    Direction.NORTH, // context
    () -> !this.isRemoved(), // validity check (because the cache might outlive the object it belongs to)
    () -> onCapInvalidate() // invalidation listener
);
```

## 方块 Capability 失效处理 {#block-capability-invalidation}

:::info
失效处理仅适用于方块 Capability。实体和物品堆叠的 Capability 无法被缓存，也不需要失效处理。
:::

为确保缓存能正确更新其存储的 Capability，**Mod 开发者必须在 Capability 发生变化、出现或消失时调用 `level.invalidateCapabilities(pos)`**。

```java
// whenever a capability changes, appears, or disappears:
level.invalidateCapabilities(pos);
```

NeoForge 已经处理了区块加载/卸载、方块实体创建/移除等常见情形，但其他情形需要 Mod 开发者显式处理。例如，Mod 开发者必须在以下情况下使 Capability 失效：

- 当先前返回的某个 Capability 不再有效时。
- 当一个提供 Capability 的方块（没有方块实体）被放置或改变状态时，通过重写 `onPlace` 处理。
- 当一个提供 Capability 的方块（没有方块实体）被移除时，通过重写 `onRemove` 处理。

关于纯方块的示例，可参阅 `ComposterBlock.java` 文件。

更多信息请参阅 [`IBlockCapabilityProvider`][block-cap-provider] 的 javadoc。

## 注册 Capability {#registering-capabilities}

Capability _提供器（provider）_ 是最终供给 Capability 的东西。Capability 提供器是一个函数，它要么返回一个 Capability 实例，要么在无法提供该 Capability 时返回 `null`。提供器针对以下两点是专用的：

- 它所提供的那个具体 Capability，以及
- 它所服务的方块实例、方块实体类型、实体类型或物品实例。

它们需要在 `RegisterCapabilitiesEvent` 中注册。

方块提供器通过 `registerBlock` 注册。例如：

```java
@SubscribeEvent // on the mod event bus
public static void registerCapabilities(RegisterCapabilitiesEvent event) {
    event.registerBlock(
        Capabilities.Item.BLOCK, // capability to register for
        (level, pos, state, be, side) -> <return the ResourceHandler<ItemResource>>,
        // blocks to register for
        MY_ITEM_HANDLER_BLOCK,
        MY_OTHER_ITEM_HANDLER_BLOCK
    );
}
```

一般来说，注册会针对某些方块实体类型，因此还提供了 `registerBlockEntity` 辅助方法：

```java
event.registerBlockEntity(
    Capabilities.Item.BLOCK, // capability to register for
    MY_BLOCK_ENTITY_TYPE, // block entity type to register for
    (myBlockEntity, side) -> myBlockEntity.myResourceHandlerForTheGivenSide
);
```

:::danger
如果某个方块或方块实体提供器先前返回的 Capability 不再有效，*你必须使缓存失效*，方法是调用 `level.invalidateCapabilities(pos)`。更多信息请参阅上文的[失效处理章节][invalidation]。
:::

实体注册与之类似，使用 `registerEntity`：

```java
event.registerEntity(
    Capabilities.Item.ENTITY, // capability to register for
    MY_ENTITY_TYPE, // entity type to register for
    (myEntity, v) -> myEntity.myResourceHandlerForTheGivenContext
);
```

物品注册也类似。注意提供器接收的是物品堆叠：

```java
event.registerItem(
    Capabilities.Item.ITEM, // capability to register for
    (stack, itemAccess) -> <return the ResourceHandler<ItemResource> for the itemStack>,
    // items to register for
    MY_ITEM,
    MY_OTHER_ITEM
);
```

## 为所有对象注册 Capability {#registering-capabilities-for-all-objects}

如果出于某种原因你需要为所有方块、实体或物品注册一个提供器，你需要遍历对应的注册表，并为每个对象注册该提供器。

例如，NeoForge 就用这套机制为所有 `BucketItem`（不含其子类）注册了流体资源处理器 Capability：

```java
// For reference, you can find this code in the `CapabilityHooks` class.
for (Item item : BuiltInRegistries.ITEM) {
    if (item.getClass() == BucketItem.class) {
        event.registerItem(Capabilities.Fluid.ITEM, (stack, itemAccess) -> new BucketResourceHandler(itemAccess), item);
    }
}
```

提供器会按其注册顺序被依次询问 Capability。如果你想在 NeoForge 已为你的某个对象注册的提供器之前运行，请以更高的优先级注册你的 `RegisterCapabilitiesEvent` 处理器。

例如：

```java
// use HIGH priority to register before NeoForge!
@SubscribeEvent(priority = EventPriority.HIGH) // on the mod event bus
public static void registerCapabilities(RegisterCapabilitiesEvent event) {
    event.registerItem(
        Capabilities.Fluid.ITEM,
        (stack, itemAccess) -> new BucketResourceHandler(itemAccess),
        // Items to register for
        MY_CUSTOM_BUCKET
    );
}
```

NeoForge 自身注册的提供器列表参见 [`CapabilityHooks`][capability-hooks]。

[block-cap-provider]: https://github.com/neoforged/NeoForge/blob/26.1.x/src/main/java/net/neoforged/neoforge/capabilities/IBlockCapabilityProvider.java
[capability-hooks]: https://github.com/neoforged/NeoForge/blob/26.1.x/src/main/java/net/neoforged/neoforge/capabilities/CapabilityHooks.java
[energyhandler]: transactions.md#energy-handler
[invalidation]: #block-capability-invalidation
[itemaccess]: transactions.md#item-access
[resourcehandler]: transactions.md#resource-handlers

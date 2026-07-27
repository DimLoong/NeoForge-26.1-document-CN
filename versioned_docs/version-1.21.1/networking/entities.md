---
sidebar_position: 4
---
# 实体 {#entities}

除了常规的网络消息之外，NeoForge 还提供了多种其他系统来处理实体数据的同步。

## 生成数据 {#spawn-data}

自 1.20.2 起，Mojang 引入了捆绑包（Bundle packet）的概念，用于把实体生成数据包打包在一起发送。这样就能随生成数据包发送更多数据，并且发送得更高效。

你可以通过实现下面这个接口，为 NeoForge 发送的生成数据包添加额外数据。

### IEntityWithComplexSpawn {#ientitywithcomplexspawn}

如果你的实体拥有客户端需要、但不会随时间变化的数据，就可以通过该接口把它加入实体生成数据包。 `#writeSpawnData` 和 `#readSpawnData` 控制这些数据应如何编码到网络缓冲区、以及如何从中解码。此外，你也可以重写 `IEntityExtension#sendPairingData` 方法，它会在实体的初始数据被发送到客户端时调用。该方法在服务端调用，可用于把额外的载荷与生成数据包放在同一个捆绑包中一并发往客户端。

## 动态数据参数 {#dynamic-data-parameters}

这是原版把实体数据从服务端同步到客户端的主要系统。因此，有大量原版示例可供参考。

首先，你需要为想要保持同步的数据准备一个 `EntityDataAccessor<T>`。它应当以 `static final` 字段的形式存储在你的实体类中，通过调用 `SynchedEntityData#defineId` 并传入实体类和该数据类型对应的序列化器来获得。可用的序列化器实现可以在 `EntityDataSerializers` 类中的静态常量里找到。

:::caution
你**只**应当为你自己的实体、并且是_在该实体自己的类中_创建数据参数。给你无法掌控的实体添加参数，会导致用于在网络上发送这些数据的 ID 发生错位，从而引发难以调试的崩溃。
:::

接着，重写 `Entity#defineSynchedData`，并为每个数据参数调用 `SynchedEntityData.Builder#define`，传入参数本身和一个初始值。记得始终先调用 `super` 方法！

然后，你就可以通过实体的 `entityData` 实例来读取和设置这些值。所做的更改会自动同步到客户端。

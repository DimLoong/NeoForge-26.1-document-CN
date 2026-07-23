---
sidebar_position: 1
---
# 注册网络载荷 {#registering-payloads}

网络载荷（Payload）是一种在客户端与服务端之间发送任意数据的方式。它们通过 `RegisterPayloadHandlersEvent` 事件中的 `PayloadRegistrar` 进行注册。

```java
@SubscribeEvent // on the mod event bus
public static void register(RegisterPayloadHandlersEvent event) {
    // Sets the current network version
    final PayloadRegistrar registrar = event.registrar("1");
}
```

假设我们想发送以下数据：

```java
public record MyData(String name, int age) {}
```

那么我们可以实现 `CustomPacketPayload` 接口，创建一个能够收发这些数据的载荷。

```java
public record MyData(String name, int age) implements CustomPacketPayload {
    
    public static final CustomPacketPayload.Type<MyData> TYPE = new CustomPacketPayload.Type<>(Identifier.fromNamespaceAndPath("mymod", "my_data"));

    // Each pair of elements defines the stream codec of the element to encode/decode and the getter for the element to encode
    // 'name' will be encoded and decoded as a string
    // 'age' will be encoded and decoded as an integer
    // The final parameter takes in the previous parameters in the order they are provided to construct the payload object
    public static final StreamCodec<ByteBuf, MyData> STREAM_CODEC = StreamCodec.composite(
        ByteBufCodecs.STRING_UTF8,
        MyData::name,
        ByteBufCodecs.VAR_INT,
        MyData::age,
        MyData::new
    );
    
    @Override
    public CustomPacketPayload.Type<? extends CustomPacketPayload> type() {
        return TYPE;
    }
}
```

从上面的例子可以看到，`CustomPacketPayload` 接口要求我们实现 `type` 方法。`type` 方法负责为该载荷返回一个唯一标识符。此外，我们还需要一个读取器，稍后配合 `StreamCodec` 一起注册，用于读写载荷数据。

最后，我们可以将该载荷注册到注册器：

```java
// In some common event class

@SubscribeEvent // on the mod event bus
public static void register(RegisterPayloadHandlersEvent event) {
    final PayloadRegistrar registrar = event.registrar("1");
    registrar.playBidirectional(
        MyData.TYPE,
        MyData.STREAM_CODEC,
        ServerPayloadHandler::handleDataOnMain
    );
}

// In some client-only event class

@SubscribeEvent // on the mod event bus only on the physical client
public static void register(RegisterClientPayloadHandlersEvent event) {
    event.register(
        MyData.TYPE,
        ClientPayloadHandler::handleDataOnMain
    );
}
```

剖析上面的代码，我们可以注意到几点：
- 注册器有一组 `play*` 方法，用于注册在游戏的游玩阶段（play phase）发送的载荷。
    - 代码中未出现的 `configuration*` 和 `common*` 方法同样存在；它们也可用于注册配置阶段（configuration phase）的载荷。`common` 方法可用于同时为配置阶段和游玩阶段注册载荷。
- 注册器使用了 `*Bidirectional` 方法，用于注册同时发送给逻辑服务端与逻辑客户端的载荷。
    - 代码中未出现的 `*ToClient` 和 `*ToServer` 方法同样存在；它们可分别用于只向逻辑客户端或只向逻辑服务端注册载荷。
- 载荷的 type 用作该载荷的唯一标识符。
- [流式编解码器][streamcodec]用于将载荷读写到跨网络发送的缓冲区，以及从中读写回来。
- 载荷处理器是载荷抵达某一逻辑端时的回调。
    - 如果使用 `*ToServer` 方法，载荷处理器会作为方法的最后一个参数。
    - 如果使用 `*ToClient` 方法，载荷处理器需要通过 `RegisterClientPayloadHandlersEvent` 注册，并传入载荷 type 与处理器。
    - 如果使用 `*Bidirectional` 方法，则需要同时使用上述两种方式来注册载荷处理器。

:::note
客户端载荷处理器有专属的事件 `RegisterClientPayloadHandlersEvent`，以防止代码跨越逻辑[端][sides]与物理端。
:::

现在我们已经注册了载荷，接下来需要实现一个处理器。本示例专门看一下客户端处理器，不过服务端处理器与它非常相似。

```java
public class ClientPayloadHandler {
    
    public static void handleDataOnMain(final MyData data, final IPayloadContext context) {
        // Do something with the data, on the main thread
        blah(data.age());
    }
}
```

这里有几点值得注意：

- 这里的处理方法拿到载荷以及一个上下文对象。
- 载荷的处理方法默认在主线程上调用。

如果你需要执行一些资源开销较大的计算，那么这些工作应当在网络线程上完成，而不是阻塞主线程。对于服务端接收（serverbound）的连接，可在注册载荷之前通过 `PayloadRegistrar#executesOn` 将 `PayloadRegistrar` 的 `HandlerThread` 设为 `HandlerThread#NETWORK`；对于客户端接收（clientbound）的连接，则向 `RegisterClientPayloadHandlersEvent#register` 传入 `HandlerThread`。

```java
// In some common event class

@SubscribeEvent // on the mod event bus
public static void register(RegisterPayloadHandlersEvent event) {
    final PayloadRegistrar registrar = event.registrar("1")
        .executesOn(HandlerThread.NETWORK); // All subsequent payloads will register on the network thread
    registrar.playBidirectional(
        MyData.TYPE,
        MyData.STREAM_CODEC,
        ServerPayloadHandler::handleDataOnNetwork
    );
}

// In some client-only event class

@SubscribeEvent // on the mod event bus only on the physical client
public static void register(RegisterClientPayloadHandlersEvent event) {
    event.register(
        MyData.TYPE,
        HandlerThread.NETWORK // Payload handler will be invoked on the network thread
        ClientPayloadHandler::handleDataOnNetwork
    );
}
```

:::note
在某次 `executesOn` 调用之后注册的所有载荷，都会保持相同的线程执行位置，直到再次调用 `executesOn`。

```java
PayloadRegistrar registrar = event.registrar("1");

registrar.playBidirectional(...); // On the main thread
registrar.playBidirectional(...); // On the main thread

// Configuration methods modify the state of the registrar
// by creating a new instance, so the change needs to be
/// updated by storing the result
registrar = registrar.executesOn(HandlerThread.NETWORK);

registrar.playBidirectional(...); // On the network thread
registrar.playBidirectional(...); // On the network thread

registrar = registrar.executesOn(HandlerThread.MAIN);

registrar.playBidirectional(...); // On the main thread
registrar.playBidirectional(...); // On the main thread
```
:::

这里有几点值得注意：

- 如果你想在游戏主线程上运行代码，可以使用 `enqueueWork` 向主线程提交一个任务。
    - 该方法会返回一个 `CompletableFuture`，它将在主线程上完成。
    - 注意：这里返回的是一个 `CompletableFuture`，这意味着你可以把多个任务串联起来，并在同一处集中处理异常。
    - 如果你不在 `CompletableFuture` 中处理异常，那么异常会被吞掉，**并且你不会收到任何通知**。

```java
public class ClientPayloadHandler {
    
    public static void handleDataOnNetwork(final MyData data, final IPayloadContext context) {
        // Do something with the data, on the network thread
        blah(data.name());
        
        // Do something with the data, on the main thread
        context.enqueueWork(() -> {
            blah(data.age());
        })
        .exceptionally(e -> {
            // Handle exception
            context.disconnect(Component.translatable("my_mod.networking.failed", e.getMessage()));
            return null;
        });
    }
}
```

有了自己的载荷之后，你就可以借助它们通过[配置任务][configuration]来配置客户端和服务端。

## 发送网络载荷 {#sending-payloads}

`CustomPacketPayload` 通过原版的数据包系统跨网络发送：向服务端发送时用 `ServerboundCustomPayloadPacket` 包装载荷，向客户端发送时用 `ClientboundCustomPayloadPacket` 包装。发送给客户端的载荷最多只能包含 1 MiB 数据，而发送给服务端的载荷只能包含少于 32 KiB 的数据。

所有载荷都通过 `Connection#send` 以某种抽象层级发送；不过，如果你想根据给定条件把网络包发给多个人，直接调用这些方法通常并不方便。因此，`PacketDistributor` 提供了若干便捷实现用于向客户端发送载荷，而 `ClientPacketDistributor` 则包含一个用于向服务端发送网络包的方法（`sendToServer`）。

```java
// ON THE CLIENT

// Send payload to server
ClientPacketDistributor.sendToServer(new MyData(...));

// ON THE SERVER

// Send to one player (ServerPlayer serverPlayer)
PacketDistributor.sendToPlayer(serverPlayer, new MyData(...));

/// Send to all players tracking this chunk (ServerLevel serverLevel, ChunkPos chunkPos)
PacketDistributor.sendToPlayersTrackingChunk(serverLevel, chunkPos, new MyData(...));

/// Send to all connected players
PacketDistributor.sendToAllPlayers(new MyData(...));
```

更多实现请参阅 `PacketDistributor` 和 `ClientPacketDistributor` 类。

[configuration]: configuration-tasks.md
[sides]: ../concepts/sides.md
[streamcodec]: streamcodecs.md

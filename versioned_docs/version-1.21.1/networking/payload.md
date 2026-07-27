---
sidebar_position: 1
---
# 注册网络载荷 {#registering-payloads}

网络载荷（Payload）是一种在客户端与服务端之间发送任意数据的方式。它们通过 `RegisterPayloadHandlersEvent` 事件提供的 `PayloadRegistrar` 进行注册。

```java
@SubscribeEvent // on the mod event bus
public static void register(final RegisterPayloadHandlersEvent event) {
    // Sets the current network version
    final PayloadRegistrar registrar = event.registrar("1");
}
```

假设我们想要发送如下数据：

```java
public record MyData(String name, int age) {}
```

那么可以实现 `CustomPacketPayload` 接口，创建一个能够收发这些数据的载荷。

```java
public record MyData(String name, int age) implements CustomPacketPayload {
    
    public static final CustomPacketPayload.Type<MyData> TYPE = new CustomPacketPayload.Type<>(ResourceLocation.fromNamespaceAndPath("mymod", "my_data"));

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

从上面的示例可以看到，`CustomPacketPayload` 接口要求我们实现 `type` 方法。 `type` 方法负责为该载荷返回一个唯一标识符。此外，我们还需要一个读取器，稍后连同 `StreamCodec` 一起注册，用于读写载荷数据。

最后，我们可以把这个载荷注册到注册器上：

```java
@SubscribeEvent // on the mod event bus
public static void register(final RegisterPayloadHandlersEvent event) {
    final PayloadRegistrar registrar = event.registrar("1");
    registrar.playBidirectional(
        MyData.TYPE,
        MyData.STREAM_CODEC,
        new DirectionalPayloadHandler<>(
            ClientPayloadHandler::handleDataOnMain,
            ServerPayloadHandler::handleDataOnMain
        )
    );
}
```

剖析上面的代码，可以注意到几点：
- 注册器提供了 `play*` 系列方法，用于注册在游戏的游玩阶段（play phase）发送的载荷。
    - 代码中未出现的还有 `configuration*` 和 `common*` 系列方法；它们同样可用于注册配置阶段的载荷。 `common` 方法可以同时为配置阶段和游玩阶段注册载荷。
- 注册器使用了 `*Bidirectional` 方法，用于注册同时发往逻辑服务端和逻辑客户端的载荷。
    - 代码中未出现的还有 `*ToClient` 和 `*ToServer` 方法；它们可分别用于只向逻辑客户端或只向逻辑服务端注册载荷。
- 载荷的类型（type）被用作该载荷的唯一标识符。
- [流式编解码器][streamcodec]用于把载荷读写到通过网络发送的缓冲区中，或从中读出。
- 载荷处理器是一个回调，在载荷到达某一逻辑端时触发。
    - 如果使用了 `*Bidirectional` 方法，可以用 `DirectionalPayloadHandler` 为两个逻辑端分别提供各自的载荷处理器。

注册好载荷之后，我们需要实现一个处理器。本示例专门看客户端一侧的处理器，不过服务端一侧的处理器非常相似。

```java
public class ClientPayloadHandler {
    
    public static void handleDataOnMain(final MyData data, final IPayloadContext context) {
        // Do something with the data, on the main thread
        blah(data.age());
    }
}
```

这里有几点值得注意：

- 这个处理方法接收载荷本身以及一个上下文对象。
- 默认情况下，载荷的处理方法在主线程上被调用。


如果你需要执行一些资源消耗较大的计算，就应当把工作放到网络线程上进行，而不是阻塞主线程。做法是在注册载荷之前，通过 `PayloadRegistrar#executesOn` 把 `PayloadRegistrar` 的 `HandlerThread` 设为 `HandlerThread#NETWORK`。

```java
@SubscribeEvent // on the mod event bus
public static void register(final RegisterPayloadHandlersEvent event) {
    final PayloadRegistrar registrar = event.registrar("1")
        .executesOn(HandlerThread.NETWORK); // All subsequent payloads will register on the network thread
    registrar.playBidirectional(
        MyData.TYPE,
        MyData.STREAM_CODEC,
        new DirectionalPayloadHandler<>(
            ClientPayloadHandler::handleDataOnNetwork,
            ServerPayloadHandler::handleDataOnNetwork
        )
    );
}
```

:::note
在一次 `executesOn` 调用之后注册的所有载荷都会沿用相同的线程执行位置，直到再次调用 `executesOn` 为止。

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
    - 注意：返回的是 `CompletableFuture`，这意味着你可以把多个任务串联起来，并在同一处集中处理异常。
    - 如果你不在 `CompletableFuture` 中处理异常，异常会被吞掉，**而你完全不会收到任何提示**。

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

有了自己的载荷之后，你就可以借助它们，通过[配置任务][configuration]来配置客户端和服务端。

## 发送网络载荷 {#sending-payloads}

`CustomPacketPayload` 通过原版的数据包系统在网络上发送：发往服务端时用 `ServerboundCustomPayloadPacket` 包装载荷，发往客户端时用 `ClientboundCustomPayloadPacket` 包装。发往客户端的载荷最多只能包含 1 MiB 数据，而发往服务端的载荷则必须小于 32 KiB。

所有载荷都通过 `Connection#send` 发送并带有一定程度的抽象；不过，如果你想根据某个条件把数据包发给多个人，直接调用这些方法通常并不方便。为此，`PacketDistributor` 提供了若干便捷实现来发送载荷。向服务端发送数据包只有一个方法（`sendToServer`）；而向客户端发送数据包则有多个方法，具体取决于应由哪些玩家接收该载荷。

```java
// ON THE CLIENT

// Send payload to server
PacketDistributor.sendToServer(new MyData(...));

// ON THE SERVER

// Send to one player (ServerPlayer serverPlayer)
PacketDistributor.sendToPlayer(serverPlayer, new MyData(...));

/// Send to all players tracking this chunk (ServerLevel serverLevel, ChunkPos chunkPos)
PacketDistributor.sendToPlayersTrackingChunk(serverLevel, chunkPos, new MyData(...));

/// Send to all connected players
PacketDistributor.sendToAllPlayers(new MyData(...));
```

更多实现请参阅 `PacketDistributor` 类。

[configuration]: ./configuration-tasks.md
[streamcodec]: ./streamcodecs.md

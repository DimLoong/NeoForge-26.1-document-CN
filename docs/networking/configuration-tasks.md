---
sidebar_position: 3
---
# 使用配置任务 {#using-configuration-tasks}

客户端与服务端之间的网络协议有一个特定阶段，服务端可以在玩家真正进入游戏之前对客户端进行配置。这个阶段称为配置阶段（configuration phase），例如原版服务端就用它向客户端发送资源包信息。

Mod 也可以利用这个阶段在玩家进入游戏之前配置客户端。

## 注册配置任务 {#registering-a-configuration-task}

使用配置阶段的第一步是注册一个配置任务。这可以通过在 `RegisterConfigurationTasksEvent` 事件中注册一个新的配置任务来完成。

```java
@SubscribeEvent // on the mod event bus
public static void register(final RegisterConfigurationTasksEvent event) {
    event.register(new MyConfigurationTask());
}
```

`RegisterConfigurationTasksEvent` 事件在 Mod 总线上触发，并暴露出服务端用于配置对应客户端的当前监听器。Mod 开发者可以利用暴露出的监听器判断客户端是否正在运行该 Mod，如果是，则注册一个配置任务。

## 实现配置任务 {#implementing-a-configuration-task}

配置任务是一个简单的接口：`ICustomConfigurationTask`。该接口有两个方法：`void run(Consumer<CustomPacketPayload> sender);`，以及返回配置任务类型的 `ConfigurationTask.Type type();`。type 用于标识配置任务。下面是一个配置任务的示例：

```java
public record MyConfigurationTask implements ICustomConfigurationTask {
    public static final ConfigurationTask.Type TYPE = new ConfigurationTask.Type(Identifier.fromNamespaceAndPath("mymod", "my_task"));
    
    @Override
    public void run(final Consumer<CustomPacketPayload> sender) {
        final MyData payload = new MyData();
        sender.accept(payload);
    }

    @Override
    public ConfigurationTask.Type type() {
        return TYPE;
    }
}
```

## 确认配置任务 {#acknowledging-a-configuration-task}

你的配置在服务端上执行，服务端需要知道何时可以执行下一个配置任务。这通过对该配置任务的执行进行确认来实现。

主要有两种实现方式：

### 捕获监听器 {#capturing-the-listener}

当客户端不需要确认配置任务时，可以捕获监听器，并直接在服务端确认配置任务。

```java
public record MyConfigurationTask(ServerConfigurationPacketListener listener) implements ICustomConfigurationTask {
    public static final ConfigurationTask.Type TYPE = new ConfigurationTask.Type(Identifier.fromNamespaceAndPath("mymod", "my_task"));
    
    @Override
    public void run(final Consumer<CustomPacketPayload> sender) {
        final MyData payload = new MyData();
        sender.accept(payload);
        this.listener().finishCurrentTask(this.type());
    }

    @Override
    public ConfigurationTask.Type type() {
        return TYPE;
    }
}
```

要使用这样的配置任务，需要在 `RegisterConfigurationTasksEvent` 事件中捕获监听器。

```java
@SubscribeEvent // on the mod event bus
public static void register(final RegisterConfigurationTasksEvent event) {
    event.register(new MyConfigurationTask(event.getListener()));
}
```

这样，下一个配置任务会在当前配置任务完成后立即执行，客户端无需确认配置任务。此外，服务端也不会等待客户端正确处理已发送的载荷。

### 确认配置任务 {#acknowledging-the-configuration-task}

当客户端需要确认配置任务时，你就需要向客户端发送自己的载荷：

```java
public record AckPayload() implements CustomPacketPayload {
    public static final CustomPacketPayload.Type<AckPayload> TYPE = new CustomPacketPayload.Type<>(Identifier.fromNamespaceAndPath("mymod", "ack"));
    
    // Unit codec with no data to write
    public static final StreamCodec<ByteBuf, AckPayload> STREAM_CODEC = StreamCodec.unit(new AckPayload());

    @Override
    public CustomPacketPayload.Type<? extends CustomPacketPayload> type() {
        return TYPE;
    }
}
```

当来自服务端配置任务的载荷被正确处理后，你可以把这个载荷发送给服务端，以确认该配置任务。

```java
public void onMyData(MyData data, IPayloadContext context) {
    context.enqueueWork(() -> {
        blah(data.name());
    })
    .exceptionally(e -> {
        // Handle exception
        context.disconnect(Component.translatable("my_mod.configuration.failed", e.getMessage()));
        return null;
    })
    .thenAccept(v -> {
        context.reply(new AckPayload());
    });     
}
```

其中 `onMyData` 是由服务端配置任务发送的那个载荷的处理器。

当服务端收到这个载荷时，它会确认该配置任务，随后下一个配置任务将会执行：

```java
public void onAck(AckPayload payload, IPayloadContext context) {
    context.finishCurrentTask(MyConfigurationTask.TYPE);
}
```

其中 `onAck` 是由客户端发送的那个载荷的处理器。

## 阻塞登录流程 {#stalling-the-login-process}

如果配置任务未被确认，服务端将永远等待下去，客户端也永远无法进入游戏。因此，务必始终确认配置任务；除非配置任务失败，此时你可以断开客户端连接。

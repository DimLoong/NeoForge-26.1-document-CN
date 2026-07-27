---
sidebar_position: 3
---
# 使用配置任务 {#using-configuration-tasks}

客户端与服务端之间的网络协议有一个特定阶段，服务端可以在玩家真正加入游戏之前对客户端进行配置。这个阶段称为配置阶段（configuration phase），例如原版服务端就用它向客户端发送资源包信息。

Mod 也可以利用这个阶段，在玩家加入游戏之前对客户端进行配置。

## 注册配置任务 {#registering-a-configuration-task}

使用配置阶段的第一步是注册一个配置任务。做法是在 `RegisterConfigurationTasksEvent` 事件中注册一个新的配置任务。

```java
@SubscribeEvent // on the mod event bus
public static void register(final RegisterConfigurationTasksEvent event) {
    event.register(new MyConfigurationTask());
}
```

`RegisterConfigurationTasksEvent` 事件在 Mod 总线上触发，并暴露出服务端当前用于配置相关客户端的监听器。 Mod 开发者可以利用暴露出来的监听器判断该客户端是否运行了本 Mod，若是，则注册相应的配置任务。

## 实现配置任务 {#implementing-a-configuration-task}

配置任务是一个简单的接口：`ICustomConfigurationTask`。该接口有两个方法：`void run(Consumer<CustomPacketPayload> sender);`，以及返回配置任务类型的 `ConfigurationTask.Type type();`。类型用于标识配置任务。下面给出一个配置任务的示例：

```java
public record MyConfigurationTask implements ICustomConfigurationTask {
    public static final ConfigurationTask.Type TYPE = new ConfigurationTask.Type(ResourceLocation.fromNamespaceAndPath("mymod", "my_task"));
    
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

你的配置任务在服务端执行，而服务端需要知道何时可以执行下一个配置任务。这是通过确认（acknowledge）该配置任务的执行完成来实现的。

主要有两种做法：

### 捕获监听器 {#capturing-the-listener}

当客户端无需确认配置任务时，可以捕获监听器，直接在服务端一侧确认配置任务。

```java
public record MyConfigurationTask(ServerConfigurationPacketListener listener) implements ICustomConfigurationTask {
    public static final ConfigurationTask.Type TYPE = new ConfigurationTask.Type(ResourceLocation.fromNamespaceAndPath("mymod", "my_task"));
    
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

这样一来，下一个配置任务会在当前配置任务完成后立即执行，客户端无需确认该配置任务。此外，服务端也不会等待客户端妥善处理完已发送的载荷。

### 确认配置任务 {#acknowledging-the-configuration-task}

当客户端需要确认配置任务时，你就得向客户端发送自己的载荷：

```java
public record AckPayload() implements CustomPacketPayload {
    public static final CustomPacketPayload.Type<AckPayload> TYPE = new CustomPacketPayload.Type<>(ResourceLocation.fromNamespaceAndPath("mymod", "ack"));
    
    // Unit codec with no data to write
    public static final StreamCodec<ByteBuf, AckPayload> STREAM_CODEC = StreamCodec.unit(new AckPayload());

    @Override
    public CustomPacketPayload.Type<? extends CustomPacketPayload> type() {
        return TYPE;
    }
}
```

当来自服务端配置任务的载荷被妥善处理后，你可以把这个载荷发回服务端，以确认该配置任务。

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

其中 `onMyData` 是服务端配置任务所发送载荷的处理器。

当服务端收到这个载荷时，它会确认该配置任务，随后执行下一个配置任务：

```java
public void onAck(AckPayload payload, IPayloadContext context) {
    context.finishCurrentTask(MyConfigurationTask.TYPE);
}
```

其中 `onAck` 是客户端所发送载荷的处理器。

## 阻塞登录流程 {#stalling-the-login-process}

如果配置任务未被确认，服务端将永远等待下去，客户端也就永远无法加入游戏。因此，务必始终确认配置任务；除非配置任务执行失败，此时你可以断开客户端连接。

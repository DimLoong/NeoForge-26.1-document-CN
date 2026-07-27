# 网络通信 {#networking}

服务端与客户端之间的通信是 Mod 能否成功运作的根基。

网络通信主要有两个目标：

1. 确保客户端的视图与服务端的视图保持“同步”
    - 坐标 (X, Y, Z) 处的花朵刚刚长大了
1. 为客户端提供一种途径，把玩家身上发生的变化告知服务端
    - 玩家按下了某个键

实现这些目标最常见的方式是在客户端与服务端之间传递消息。这些消息通常是结构化的，按照特定的排列方式包含数据，以便于收发。

NeoForge 提供了一套主要构建在 [netty] 之上的技术来简化通信。使用时，监听 `RegisterPayloadHandlersEvent` 事件，然后向注册器注册某种特定类型的[网络载荷][payloads]、它的读取器以及它的处理函数即可。

[netty]: https://netty.io "Netty Website"
[payloads]: ./payload.md "Registering custom Payloads"

# 组织你的 Mod 结构 {#structuring-your-mod}

良好组织的 Mod 有利于维护、便于他人贡献代码，也能让人更清晰地理解底层代码库。下面列出了来自 Java、Minecraft 和 NeoForge 的一些建议。

:::note
你不必遵循下面的建议；你可以按你认为合适的任何方式来组织你的 Mod。不过，仍然强烈推荐这样做。
:::

## 打包 {#packaging}

在组织你的 Mod 时，请选择一个独特的顶级包（top-level package）结构。许多程序员会为不同的类、接口等使用相同的名称。只要位于不同的包中，Java 允许类拥有相同的名称。因此，如果两个类拥有相同的包和相同的名称，那么只有其中一个会被加载，这很可能导致游戏崩溃。

```
a.jar
    - com.example.ExampleClass
b.jar
    - com.example.ExampleClass // This class will not normally be loaded
```

在涉及加载模块时，这一点甚至更为重要。如果在两个独立模块中存在同名包下的类文件，这将导致 Mod 加载器在启动时崩溃，因为 Mod 模块会被导出给游戏和其他 Mod。

```
module A
    - package X
        - class I
        - class J
module B
    - package X // This package will cause the mod loader to crash, as there already is a module with package X being exported
        - class R
        - class S
        - class T
```

因此，你的顶级包应当是你所拥有的东西：一个域名、电子邮件地址、一个（子）网站等等。它甚至可以是你的姓名或用户名，只要你能保证它在预期目标范围内是唯一可识别的即可。此外，顶级包还应与你的 [group id][group] 匹配。

|   类型    |       值       | 顶级包   |
|:---------:|:-----------------:|:--------------------|
|  域名   |    example.com    | `com.example`       |
| 子域名 | example.github.io | `io.github.example` |
|   电子邮件   | example@gmail.com | `com.gmail.example` |

接下来一级的包应当是你的 mod id（例如 `com.example.examplemod`，其中 `examplemod` 是 mod id）。这将保证：除非你有两个 id 相同的 Mod（这种情况绝不应发生），否则你的包在加载时不会出现任何问题。

你可以在 [Oracle 的教程页面][naming] 上找到一些额外的命名约定。

### 子包组织 {#sub-package-organization}

除了顶级包之外，强烈推荐把你的 Mod 的类拆分到各个子包中。有两种主要的做法：

- **按功能分组**：为具有共同用途的类建立子包。例如，方块可以放在 `block` 下，物品放在 `item` 下，实体放在 `entity` 下，等等。Minecraft 自身也使用了类似的结构（有少数例外）。
- **按逻辑分组**：为具有共同逻辑的类建立子包。例如，如果你正在创建一种新的工作台，你会把它的方块、菜单、物品等都放在 `feature.crafting_table` 下。

#### 客户端、服务端与数据包 {#client-server-and-data-packages}

一般而言，仅用于某一端或某一运行时的代码应当与其他类隔离，放在单独的子包中。例如，与[数据生成][datagen]相关的代码应放在 `data` 包中，而仅在专用服务端上运行的代码应放在 `server` 包中。

强烈推荐将[纯客户端代码][sides]隔离到 `client` 子包中。这是因为专用服务端无法访问 Minecraft 中任何纯客户端的包，如果你的 Mod 仍试图访问它们，将会崩溃。因此，拥有一个专门的包提供了一个不错的合理性检查，可以帮助你确认自己没有在 Mod 内跨端调用。

## 类命名方案 {#class-naming-schemes}

统一的类命名方案能让人更容易辨明类的用途，或更方便地定位特定的类。

类通常以其类型作为后缀，例如：

- 一个名为 `PowerRing` 的 `Item` -> `PowerRingItem`。
- 一个名为 `NotDirt` 的 `Block` -> `NotDirtBlock`。
- 一个用于 `Oven` 的菜单 -> `OvenMenu`。

:::tip
Mojang 通常对除实体以外的所有类都遵循类似的结构。实体则仅用其名称表示（例如 `Pig`、`Zombie` 等）。
:::

## 多选一 {#choose-one-method-from-many}

完成某项任务有许多方法：注册对象、监听事件等等。一般推荐保持一致，即用单一的方法来完成给定的任务。这能提升可读性，并避免可能出现的奇怪交互或冗余（例如你的事件监听器运行了两次）。

[group]: index.md#the-group-id
[naming]: https://docs.oracle.com/javase/tutorial/java/package/namingpkgs.html
[datagen]: ../resources/index.md#data-generation
[sides]: ../concepts/sides.md

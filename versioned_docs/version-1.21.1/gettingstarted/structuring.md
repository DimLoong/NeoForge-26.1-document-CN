# 组织你的 Mod 结构 {#structuring-your-mod}

结构良好的 Mod 有利于维护、便于他人贡献，也能让人更清晰地理解底层代码库。下面列出了一些来自 Java、 Minecraft 和 NeoForge 的建议。

:::note
你不必遵循下面的建议；你可以按你认为合适的任何方式组织 Mod 结构。不过，仍然强烈推荐这样做。
:::

## 分包 {#packaging}

组织 Mod 结构时，请选择一个独特的顶层包结构。许多程序员会为不同的类、接口等使用相同的名称。 Java 允许类使用相同的名称，只要它们位于不同的包中。因此，如果两个类拥有相同的包和相同的名称，就只会加载其中一个，这极有可能导致游戏崩溃。

```
a.jar
    - com.example.ExampleClass
b.jar
    - com.example.ExampleClass // This class will not normally be loaded
```

当涉及模块加载时，这一点更为关键。如果在不同模块中、相同名称的两个包里存在类文件，就会导致 Mod 加载器在启动时崩溃，因为 Mod 模块会被导出给游戏和其他 Mod。

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

因此，你的顶层包名应当是你所拥有的东西：一个域名、电子邮件地址、某个（子）网站等。它甚至可以是你的姓名或用户名，只要你能保证它在预期目标范围内是唯一可识别的。此外，顶层包名还应当与你的 [group id][group] 匹配。

|   类型    |       值          | 顶层包名            |
|:---------:|:-----------------:|:--------------------|
|  域名     |    example.com    | `com.example`       |
| 子域名    | example.github.io | `io.github.example` |
|  电子邮件 | example@gmail.com | `com.gmail.example` |

下一级包名随后应当是你 Mod 的 id（例如 `com.example.examplemod`，其中 `examplemod` 是 mod id）。这样一来，除非你有两个 id 相同的 Mod（这种情况绝不应发生），否则你的包在加载时都不应出现任何问题。

你可以在 [Oracle 的教程页面][naming]找到一些额外的命名约定。

### 子包组织 {#sub-package-organization}

除了顶层包之外，还强烈推荐把你 Mod 的类分散到各个子包中。这样做主要有两种方法：

- **按功能分组**：为具有共同用途的类创建子包。例如，方块可以放在 `block` 下，物品放在 `item` 下，实体放在 `entity` 下，等等。 Minecraft 本身也使用类似的结构（有一些例外）。
- **按逻辑分组**：为具有共同逻辑的类创建子包。例如，如果你要创建一种新的工作台，你会把它的方块、菜单、物品等都放在 `feature.crafting_table` 下。

#### 客户端、服务端和数据包 {#client-server-and-data-packages}

一般来说，只用于某一端或某一运行环境的代码，应当与其他类隔离在一个单独的子包中。例如，与[数据生成][datagen]相关的代码应当放在 `data` 包中，而只在专用服务端上运行的代码应当放在 `server` 包中。

强烈推荐把[仅客户端代码][sides]隔离到 `client` 子包中。这是因为专用服务端无法访问 Minecraft 中任何仅客户端的包，如果你的 Mod 仍试图访问它们，服务端就会崩溃。因此，设立一个专门的包提供了一个不错的合理性检查，帮你确认自己没有在 Mod 内跨端访问。

## 类命名方案 {#class-naming-schemes}

一套通用的类命名方案能让人更容易看出类的用途，或更容易定位特定的类。

类通常以其类型作为后缀，例如：

- 一个名为 `PowerRing` 的 `Item` -> `PowerRingItem`。
- 一个名为 `NotDirt` 的 `Block` -> `NotDirtBlock`。
- 一个给 `Oven` 用的菜单 -> `OvenMenu`。

:::tip
Mojang 对除实体之外的所有类通常遵循类似的结构。实体则只用它们的名称来表示（例如 `Pig`、 `Zombie` 等）。
:::

## 多种方法中择其一 {#choose-one-method-from-many}

完成某项任务有许多方法：注册对象、监听事件等。一般推荐保持一致，用单一的方法来完成某项给定的任务。这能提升可读性，并避免可能出现的怪异交互或冗余（例如你的事件监听器运行了两次）。

[group]: index.md#the-group-id
[naming]: https://docs.oracle.com/javase/tutorial/java/package/namingpkgs.html
[datagen]: ../resources/index.md#data-generation
[sides]: ../concepts/sides.md

# 配置 {#configuration}

配置定义了可应用于某个 Mod 实例的设置和使用者偏好。 NeoForge 采用一套基于 [TOML][toml] 文件的配置系统，并借助 [NightConfig][nightconfig] 进行读取。

## 创建配置 {#creating-a-configuration}

配置可以通过 `IConfigSpec` 的某个子类型来创建。 NeoForge 通过 `ModConfigSpec` 实现了该类型，并借助 `ModConfigSpec.Builder` 提供其构造方式。构建器可以通过 `Builder#push` 创建一个分节、 `Builder#pop` 离开一个分节，从而把配置值划分到不同分节中。之后，可以用以下两种方法之一构建配置：

 方法       | 说明
 :---       | :---
`build`     | 创建 `ModConfigSpec`。
`configure` | 创建一个由持有配置值的类和 `ModConfigSpec` 组成的对（pair）。

:::note
`ModConfigSpec.Builder#configure` 通常与一个 `static` 块，以及一个把 `ModConfigSpec.Builder` 作为构造函数参数的类配合使用，用来附加并持有这些值：

```java
//Define a field to keep the config and spec for later
public static final ExampleConfig CONFIG;
public static final ModConfigSpec CONFIG_SPEC;
    
//CONFIG and CONFIG_SPEC are both built from the same builder, so we use a static block to seperate the properties
static {
    Pair<ExampleConfig, ModConfigSpec> pair =
            new ModConfigSpec.Builder().configure(ExampleConfig::new);
        
    //Store the resulting values
    CONFIG = pair.getLeft();
    CONFIG_SPEC = pair.getRight();
}
```
:::

每个配置值都可以附带额外的上下文，以提供额外行为。上下文必须在配置值完全构建之前定义：

| 方法           | 说明                                                                     |
|:---------------|:-------------------------------------------------------------------------|
| `comment`      | 提供对该配置值作用的说明。可以提供多个字符串以形成多行注释。             |
| `translation`  | 为配置值的名称提供一个翻译键。                                            |
| `worldRestart` | 更改此配置值之前，必须重启世界。                                          |

### 配置值 {#configvalue}

配置值可以使用任意 `#define` 方法，结合已提供的上下文（若有定义）来构建。

所有配置值方法至少接收两个组成部分：

- 一个代表变量名的路径：以 `.` 分隔的字符串，表示该配置值所处的各个分节
- 当不存在有效配置时使用的默认值

`ConfigValue` 特有的方法还额外接收两个组成部分：

- 一个校验器，用于确保反序列化得到的对象有效
- 一个代表该配置值数据类型的类

```java
//Store the config properties as public finals
public final ModConfigSpec.ConfigValue<String> welcomeMessage;

private ExampleConfig(ModConfigSpec.Builder builder) {
    //Define each property
    //One property could be a message to log to the console when the game is initialised
    welcomeMessage = builder.define("welcome_message", "Hello from the config!");
}
```

值本身可以通过 `ConfigValue#get` 获取。这些值还会被缓存，以避免多次从文件中读取。

#### 其他配置值类型 {#additional-config-value-types}

- **范围值（Range Values）**
    - 说明：值必须处于所定义的上下界之间
    - 类类型：`Comparable<T>`
    - 方法名：`#defineInRange`
    - 额外组成部分：
        - 配置值可取的最小值和最大值
        - 一个代表该配置值数据类型的类

:::note
`DoubleValue`、 `IntValue` 和 `LongValue` 都是范围值，其类分别指定为 `Double`、 `Integer` 和 `Long`。
:::

- **白名单值（Whitelisted Values）**
    - 说明：值必须在所提供的集合中
    - 类类型：`T`
    - 方法名：`#defineInList`
    - 额外组成部分：
        - 一个由所有允许取值组成的集合

- **列表值（List Values）**
    - 说明：值是一个由若干项组成的列表
    - 类类型：`List<T>`
    - 方法名：`#defineList`；如果列表可以为空，则用 `#defineListAllowEmpty`
    - 额外组成部分：
        - 一个 Supplier，在配置界面中新增条目时返回要使用的默认值。
        - 一个校验器，用于确保从列表中反序列化得到的元素有效
        - （可选）一个校验器，用于确保列表的条目数量不会过少或过多

- **枚举值（Enum Values）**
    - 说明：所提供集合中的某个枚举值
    - 类类型：`Enum<T>`
    - 方法名：`#defineEnum`
    - 额外组成部分：
        - 一个取值器，用于把字符串或整数转换为枚举
        - 一个由所有允许取值组成的集合

- **布尔值（Boolean Values）**
    - 说明：一个 `boolean` 值
    - 类类型：`Boolean`
    - 方法名：`#define`

## 注册配置 {#registering-a-configuration}

`ModConfigSpec` 构建完成后，必须将其注册，以便 NeoForge 按需加载、跟踪并同步这些配置设置。配置应当在 Mod 构造函数中通过 `ModContainer#registerConfig` 注册。注册配置时，可以传入一个代表该配置所属端的[给定类型][configtype]、 `ModConfigSpec`，以及可选的一个特定配置文件名。

```java
// In the main mod file with a ModConfigSpec CONFIG_SPEC
public ExampleMod(ModContainer container) {
    ...
    //Register the config
    container.registerConfig(ModConfig.Type.COMMON, ExampleConfig.CONFIG_SPEC);
    ...
}
```

### 配置类型 {#configuration-types}

配置类型决定了配置文件所处的位置、加载的时机，以及该文件是否会在网络上同步。默认情况下，所有配置要么在物理客户端从 `.minecraft/config` 加载，要么在物理服务端从 `<server_folder>/config` 加载。各配置类型之间的一些细微差别可以在以下小节中找到。

:::tip
NeoForge 在其代码库中记录了这些[配置类型][type]。
:::

- `STARTUP`
    - 在物理客户端和物理服务端上都从 config 文件夹加载
    - 注册时立即读取
    - **不会**在网络上同步
    - 默认以 `-startup` 作为后缀

:::warning
以 `STARTUP` 类型注册的配置可能导致客户端与服务端之间发生错位（desync），例如当该配置被用于禁用某些内容的注册时。因此，强烈建议不要用 `STARTUP` 中的任何配置来启用或禁用可能改变 Mod 内容的功能。
:::

- `CLIENT`
    - **仅**在物理客户端上从 config 文件夹加载
        - 此配置类型没有服务端位置
    - 在 `FMLCommonSetupEvent` 触发前立即读取
    - **不会**在网络上同步
    - 默认以 `-client` 作为后缀
- `COMMON`
    - 在物理客户端和物理服务端上都从 config 文件夹加载
    - 在 `FMLCommonSetupEvent` 触发前立即读取
    - **不会**在网络上同步
    - 默认以 `-common` 作为后缀
- `SERVER`
    - 在物理客户端和物理服务端上都从 config 文件夹加载
        - 可以为每个世界单独覆盖，方法是把配置添加到：
            - 客户端：`.minecraft/saves/<world_name>/serverconfig`
            - 服务端：`<server_folder>/world/serverconfig`
    - 在 `ServerAboutToStartEvent` 触发前立即读取
    - 会在网络上同步到客户端
    - 默认以 `-server` 作为后缀

## 配置事件 {#configuration-events}

每当配置被加载或重新加载时需要执行的操作，可以借助 `ModConfigEvent.Loading` 和 `ModConfigEvent.Reloading` 事件完成。这些事件必须[注册][events]到 Mod 事件总线。

:::caution
这些事件会为该 Mod 的所有配置调用；应当使用所提供的 `ModConfig` 对象来判断正在加载或重新加载的是哪个配置。
:::
## 配置界面 {#configuration-screen}

配置界面让用户能在游戏内编辑某个 Mod 的配置值，而无需打开任何文件。该界面会自动解析你已注册的配置文件并填充内容。

Mod 可以使用 NeoForge 提供的内置配置界面。 Mod 可以继承 `ConfigurationScreen` 来改变默认界面的行为，或制作自己的配置界面。 Mod 也可以从零开始创建自己的界面，并通过下面的扩展点把这个自定义界面提供给 NeoForge。

可以在 Mod 构造期间、在[客户端][client]注册一个 `IConfigScreenFactory` 扩展点，从而为该 Mod 注册配置界面：
```java
// In the main client mod file
public ExampleModClient(ModContainer container) {
    ...
    // This will use NeoForge's ConfigurationScreen to display this mod's configs
    container.registerExtensionPoint(IConfigScreenFactory.class, ConfigurationScreen::new);
    ...
}
```

在游戏中，可以通过进入“Mods”页面、从侧边栏选择该 Mod、并点击“Config”按钮来访问配置界面。 Startup、 Common 和 Client 配置项在任何时刻都可编辑。 Server 配置只有在本地游玩某个世界时才能在界面中编辑。如果连接到某个服务端、或连接到他人的局域网世界，Server 配置项在界面中将被禁用。该 Mod 配置界面的第一页会列出所有已注册的配置文件，供玩家选择要编辑哪一个。

:::warning
如果你要制作界面，应当为所有配置条目添加翻译键，并在语言 JSON 中定义相应文本。

你可以通过 `ModConfigSpec$Builder#translation` 方法为配置指定翻译键，于是我们可以把前面的代码扩展为：
```java
ConfigValue<T> value = builder.comment("This value is called 'config_value_name', and is set to defaultValue if no existing config is present")
    .translation("modid.config.config_value_name")
    .define("config_value_name", defaultValue);
```

为了让翻译更轻松，可以打开配置界面并浏览所有配置及其子分节，然后退回到 Mod 列表界面。此时，所有遇到过的未翻译配置条目都会被打印到控制台。这样你就更容易知道要翻译什么，以及它们的翻译键是什么。
:::

[toml]: https://toml.io/
[nightconfig]: https://github.com/TheElectronWill/night-config
[configtype]: #configuration-types
[type]: https://github.com/neoforged/FancyModLoader/blob/1b6af92893464a4f477cab310256639f39d41ea7/loader/src/main/java/net/neoforged/fml/config/ModConfig.java#L81-L114
[events]: ../concepts/events.md#registering-an-event-handler
[client]: ../concepts/sides.md#mod

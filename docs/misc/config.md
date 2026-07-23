# 配置 {#configuration}

配置定义了可应用于某个 Mod 实例的设置和用户偏好。NeoForge 使用一套配置系统，基于 [TOML][toml] 文件，并通过 [NightConfig][nightconfig] 读取。

## 创建配置 {#creating-a-configuration}

配置可以使用 `IConfigSpec` 的某个子类型来创建。NeoForge 通过 `ModConfigSpec` 实现该类型，并借助 `ModConfigSpec.Builder` 来构造它。该构建器可以通过 `Builder#push` 创建一个分节、`Builder#pop` 离开一个分节，从而将配置值分隔到不同的分节中。之后，可以使用以下两种方法之一来构建配置：

 方法     | 描述
 :---       | :---
`build`     | 创建 `ModConfigSpec`。
`configure` | 创建一个二元组，包含持有配置值的类和 `ModConfigSpec`。

:::note
`ModConfigSpec.Builder#configure` 通常与一个 `static` 块以及一个将 `ModConfigSpec.Builder` 作为其构造器参数的类配合使用，用来挂接并持有这些值：

```java
//Define a field to keep the config and spec for later
public static final ExampleConfig CONFIG;
public static final ModConfigSpec CONFIG_SPEC;

private ExampleConfig(ModConfigSpec.Builder builder) {
    // Define properties used by the configuration
    // ...
}

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

每个配置值都可以附加额外的上下文来提供额外的行为。上下文必须在配置值完全构建之前定义：

| 方法         | 描述                                                                                                 |
|:---------------|:------------------------------------------------------------------------------------------------------------|
| `comment`      | 提供配置值作用的描述。可以提供多个字符串以形成多行注释。 |
| `translation`  | 为配置值的名称提供一个翻译键。                                                |
| `worldRestart` | 更改此配置值前必须重启世界。                                         |
| `gameRestart`  | 更改此配置值前必须重启游戏。                                          |

### ConfigValue {#configvalue}

配置值可以使用任意 `#define` 方法，并结合已提供的上下文（如已定义）来构建。

所有配置值方法都至少接受两个组成部分：

- 表示变量名称的路径：一个以 `.` 分隔的字符串，表示该配置值所在的各个分节
- 当没有有效配置时使用的默认值

`ConfigValue` 特有的方法还接受另外两个组成部分：

- 一个验证器，用于确保反序列化后的对象有效
- 一个表示配置值数据类型的类

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

#### 额外的配置值类型 {#additional-config-value-types}

- **范围值（Range Values）**
    - 描述：值必须介于所定义的边界之间
    - 类类型：`Comparable<T>`
    - 方法名：`#defineInRange`
    - 额外组成部分：
        - 配置值可取的最小值和最大值
        - 一个表示配置值数据类型的类

:::note
`DoubleValue`、`IntValue` 和 `LongValue` 都是范围值，它们分别将类指定为 `Double`、`Integer` 和 `Long`。
:::

- **白名单值（Whitelisted Values）**
    - 描述：值必须在所提供的集合中
    - 类类型：`T`
    - 方法名：`#defineInList`
    - 额外组成部分：
        - 一个包含配置允许取值的集合

- **列表值（List Values）**
    - 描述：值是一个条目列表
    - 类类型：`List<T>`
    - 方法名：`#defineList`；若列表可以为空则用 `#defineListAllowEmpty`
    - 额外组成部分：
        - 一个供给器（supplier），在配置界面中添加新条目时返回要使用的默认值。
        - 一个验证器，用于确保从列表中反序列化出的元素有效
        - （可选）一个验证器，用于确保列表的条目数量不会过少或过多

- **枚举值（Enum Values）**
    - 描述：所提供集合中的一个枚举值
    - 类类型：`Enum<T>`
    - 方法名：`#defineEnum`
    - 额外组成部分：
        - 一个 getter，用于将字符串或整数转换为枚举
        - 一个包含配置允许取值的集合

- **布尔值（Boolean Values）**
    - 描述：一个 `boolean` 值
    - 类类型：`Boolean`
    - 方法名：`#define`

## 注册配置 {#registering-a-configuration}

一旦 `ModConfigSpec` 构建完成，就必须将其注册，以便 NeoForge 按需加载、跟踪和同步配置设置。配置应当在 Mod 构造器中通过 `ModContainer#registerConfig` 注册。注册配置时可以传入一个表示该配置所属端的[给定类型][configtype]、`ModConfigSpec`，以及一个可选的、用于该配置的特定文件名。

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

配置类型决定了配置文件所在的位置、在什么时机加载，以及该文件是否会通过网络同步。默认情况下，所有配置要么从物理客户端的 `.minecraft/config` 加载，要么从物理服务端的 `<server_folder>/config` 加载。各配置类型之间的一些细微差别可参见以下各小节。

:::tip
NeoForge 在其代码库中记录了这些[配置类型][type]。
:::

- `STARTUP`
    - 在物理客户端和物理服务端上均从 config 文件夹加载
    - 在注册时立即读取
    - **不**通过网络同步
    - 默认以 `-startup` 为后缀

:::warning
以 `STARTUP` 类型注册的配置可能导致客户端与服务端之间不同步，例如当该配置被用于禁用某些内容的注册时。因此，强烈建议 `STARTUP` 中的任何配置都不要用于启用或禁用可能改变 Mod 内容的特性。
:::

- `CLIENT`
    - **仅**在物理客户端上从 config 文件夹加载
        - 此配置类型没有服务端位置
    - 在 `FMLCommonSetupEvent` 触发前立即读取
    - **不**通过网络同步
    - 默认以 `-client` 为后缀
- `COMMON`
    - 在物理客户端和物理服务端上均从 config 文件夹加载
    - 在 `FMLCommonSetupEvent` 触发前立即读取
    - **不**通过网络同步
    - 默认以 `-common` 为后缀
- `SERVER`
    - 在物理客户端和物理服务端上均从 config 文件夹加载
        - 可以通过向以下位置添加配置，为每个世界单独覆盖：
            - 客户端：`.minecraft/saves/<world_name>/serverconfig`
            - 服务端：`<server_folder>/world/serverconfig`
    - 在 `ServerAboutToStartEvent` 触发前立即读取
    - 通过网络同步到客户端
    - 默认以 `-server` 为后缀

## 配置事件 {#configuration-events}

每当配置被加载、重新加载或卸载时需要执行的操作，可以借助 `ModConfigEvent.Loading`、`ModConfigEvent.Reloading` 和 `ModConfigEvent.Unloading` 事件来完成。这些事件必须[注册][events]到 Mod 事件总线上。

:::caution
这些事件会针对该 Mod 的所有配置被调用；应当使用所提供的 `ModConfig` 对象来判断正在加载或重新加载的是哪一份配置。
:::

## 配置界面 {#configuration-screen}

配置界面允许用户在游戏中编辑某个 Mod 的配置值，而无需打开任何文件。该界面会自动解析你已注册的配置文件并填充界面内容。

Mod 可以使用 NeoForge 提供的内置配置界面。Mod 可以扩展 `ConfigurationScreen` 来改变默认界面的行为，或制作自己的配置界面。Mod 也可以从零开始创建自己的界面，并通过下述扩展点将该自定义界面提供给 NeoForge。

通过在 Mod 构造期间于[客户端][client]注册一个 `IConfigScreenFactory` 扩展点，即可为 Mod 注册一个配置界面：

```java
// In the main client mod file
public ExampleModClient(ModContainer container) {
    ...
    // This will use NeoForge's ConfigurationScreen to display this mod's configs
    container.registerExtensionPoint(IConfigScreenFactory.class, ConfigurationScreen::new);
    ...
}
```

在游戏中，可以进入 'Mods' 页面、从侧栏选择该 Mod、并点击 'Config' 按钮来访问配置界面。Startup、Common 和 Client 配置选项在任何时候都可以编辑。Server 配置只有在本地游玩某个世界时才能在界面中编辑。如果已连接到某个服务端或他人的 LAN 世界，Server 配置选项在界面中将被禁用。该 Mod 配置界面的首页会显示所有已注册的配置文件，供玩家选择要编辑哪一个。

:::warning
如果你要制作界面，应当为所有配置条目添加翻译键，并在语言 JSON 中定义相应的文本。

你可以使用 `ModConfigSpec$Builder#translation` 方法为某个配置指定翻译键，因此我们可以将前面的代码扩展为：
```java
ConfigValue<T> value = builder.comment("This value is called 'config_value_name', and is set to defaultValue if no existing config is present")
    .translation("modid.config.config_value_name")
    .define("config_value_name", defaultValue);
```

为了让翻译更容易，可以打开配置界面并浏览所有配置及其子分节，然后退回到 Mod 列表界面。此时，所有遇到过的未翻译配置条目都会被打印到控制台。这样便于你了解需要翻译的内容以及对应的翻译键是什么。
:::

[toml]: https://toml.io/
[nightconfig]: https://github.com/TheElectronWill/night-config
[configtype]: #configuration-types
[type]: https://github.com/neoforged/FancyModLoader/blob/aafe4660ae6eff2702ec786dba8e83c69c0d9e91/loader/src/main/java/net/neoforged/fml/config/ModConfig.java#L88-L121
[events]: ../concepts/events.md#registering-an-event-handler
[client]: ../concepts/sides.md#mod

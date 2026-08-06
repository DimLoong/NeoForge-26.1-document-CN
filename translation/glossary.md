# NeoForge 26.1 文档中文翻译术语表

本术语表用于统一 NeoForge 26.1 文档简体中文译文的用词。翻译时**必须**遵循本表；如遇本表未收录的术语，应结合 NeoForge / Minecraft / Java 生态的实际语境判断，并在此补充。

> 原则：不按普通英语含义翻译 NeoForge 专用术语，必须结合其 API 与上下文。同一术语全文只用一种主要译法。

---

## 一、保留英文的代码与专有标识符（不翻译）

以下内容一律保留英文原样，通常以行内代码 `` ` `` 形式出现：

- 所有 Java 类名、接口名、方法名、字段名、枚举、注解、泛型：如 `ItemStack`、`DeferredRegister`、`BlockEntity`、`@SubscribeEvent`、`Supplier<T>`
- 包名、文件路径、文件名：如 `net.neoforged.bus`、`build.gradle`、`gradle.properties`、`src/main/java`
- Gradle 任务与 Shell 命令：如 `gradlew build`、`runClient`、`runServer`
- 配置键、注册表名、资源路径：如 `mod_id`、`online-mode`、`minecraft:dirt`、`BuiltInRegistries.BLOCK`
- 代码块内的全部内容（含注释）
- URL、相对链接目标、图片路径、锚点 ID

## 二、专有名词（保留英文，不翻译）

| 英文 | 处理方式 |
| --- | --- |
| NeoForge | 保留，不翻译 |
| NeoForged | 保留（组织名） |
| Minecraft | 保留，不翻译 |
| Forge | 保留 |
| Gradle | 保留 |
| NeoGradle | 保留 |
| ModDevGradle | 保留 |
| Mojang / Microsoft | 保留 |
| Java / JDK / JVM | 保留 |
| Vanilla | 译为“原版”（指未修改的 Minecraft） |
| Datapack | 译为“数据包”；首次可写“数据包（Datapack）” |
| Resource Pack | 译为“资源包” |

## 三、Mod 相关

| 英文 | 中文 | 说明 |
| --- | --- | --- |
| Mod | Mod | 默认保留 `Mod`，不强行译为“模组/模块”；根据上下文统一 |
| modder / mod developer | Mod 开发者 | |
| mod loader | Mod 加载器 | |
| mod id | mod id | 保留（代码标识符含义） |
| MDK (Mod Development Kit) | MDK（Mod 开发套件） | 首次并列，后续用 MDK |
| addon mod | 附属 Mod | |

## 四、固定翻译术语

| 英文 | 中文 | 说明 |
| --- | --- | --- |
| registry | 注册表 | |
| registration | 注册 | |
| register (v.) | 注册 | |
| registry entry | 注册项 | |
| registry name | 注册名 | |
| singleton | 单例 | |
| event | 事件 | |
| event bus | 事件总线 | |
| event handler | 事件处理器 | |
| event listener | 事件监听器 | |
| to fire (an event) | 触发（事件） | |
| to subscribe | 订阅 | |
| logical side | 逻辑端 | |
| physical side | 物理端 | |
| client | 客户端 | |
| server | 服务端 | |
| dedicated server | 专用服务端 | |
| integrated server | 集成服务端 | |
| logical client / server | 逻辑客户端 / 逻辑服务端 | |
| data component | 数据组件 | |
| capability | Capability | 保留英文（NeoForge 特定系统），首次可写“能力系统（Capability）” |
| attachment | 附加数据（Attachment） | 首次并列，后续统一“附加数据” |
| payload | 网络载荷（Payload） | 首次并列，后续按语境用“载荷”或 `Payload` |
| datapack registry | 数据包注册表 | 亦称动态注册表 / 世界生成注册表 |
| dynamic registry | 动态注册表 | |
| codec | Codec | 保留英文（类型名概念） |
| tag | 标签（Tag） | Minecraft 的标签系统 |
| block | 方块 | |
| block state | 方块状态 | |
| block entity | 方块实体（BlockEntity） | 首次并列 |
| item | 物品 | |
| item stack | 物品堆叠 | 或按语境保留 `ItemStack` |
| entity | 实体 | |
| living entity | 生物实体（LivingEntity） | |
| mob effect | 状态效果（MobEffect） | 即药水效果类 |
| inventory | 物品栏 | |
| container | 容器 | |
| menu | 菜单（Menu） | GUI 相关 |
| screen | 界面（Screen） | |
| slot | 槽位 | |
| recipe | 配方 | |
| ingredient | 配方材料（Ingredient） | |
| loot table | 战利品表 | |
| loot function | 战利品函数 | |
| loot condition | 战利品条件 | |
| advancement | 进度（Advancement） | Minecraft 成就系统 |
| enchantment | 附魔 | |
| attribute | 属性（Attribute） | |
| damage type | 伤害类型 | |
| biome modifier | 生物群系修改器（BiomeModifier） | |
| world generation / worldgen | 世界生成 | |
| feature | 地物（Feature） | 仅限世界生成语境；渲染管线中译为“渲染元素” |
| rendering feature | 渲染元素 | 指提交到渲染收集器、稍后统一绘制的模型、文本、粒子等对象 |
| feature submission | 渲染元素提交 | 渲染管线语境 |
| model | 模型 | |
| texture | 纹理 | |
| sound | 声音 | |
| particle | 粒子 | |
| renderer | 渲染器 | |
| rendering | 渲染 | |
| data generation / datagen | 数据生成（datagen） | |
| data provider | 数据提供器 | |
| serialization / deserialization | 序列化 / 反序列化 | |
| serialize | 序列化 | |
| networking | 网络通信 | |
| packet | 数据包（网络） | 注意与 datapack“数据包”区分，网络语境用“网络包/`Packet`” |
| stream codec | 流式编解码器（StreamCodec） | |
| configuration task | 配置任务 | 网络握手阶段 |
| access transformer | 访问转换器（Access Transformer） | |
| feature flag | 特性标志（Feature Flag） | |
| mixin | Mixin | 保留 |
| classload | 类加载 | |
| namespace | 命名空间 | |
| resource location / Identifier | Identifier | 保留类名；概念可称“资源标识符” |
| resource key | 资源键（ResourceKey） | |
| holder | Holder | 保留 |
| supplier | Supplier | 保留（类型名） |
| deferred | 延迟（注册） | `DeferredRegister` 保留 |
| bootstrap | bootstrap | 保留（引导上下文语境） |
| lambda | Lambda 表达式 | |
| NBT | NBT | 保留 |
| saved data | 存档数据（SavedData） | |
| game test | 游戏测试（GameTest） | |
| key mapping | 按键映射 | |
| config | 配置 | |
| profiler | 性能分析器 | |
| debug | 调试 | |
| update checker | 更新检查器 | |
| i18n / internationalization | 国际化（i18n） | |
| localization | 本地化 | |
| translation key | 翻译键 | |

## 五、规范性词语（严格保持强度）

| 英文 | 中文 |
| --- | --- |
| MUST | 必须 |
| MUST NOT | 禁止 / 不得 |
| SHOULD | 应当 |
| SHOULD NOT | 不应 |
| MAY | 可以 |
| RECOMMENDED | 推荐 |
| NOT RECOMMENDED / discouraged | 不建议 |
| required | 必需的 |
| optional | 可选的 |
| deprecated | 已弃用 |

- 不把“可能性描述”改成“确定性结论”。
- 不把“推荐”写成“强制要求”。

## 六、容易误译，需特别注意

| 英文 | 正确译法 | 常见错误 |
| --- | --- | --- |
| side（logical/physical） | 端（逻辑端/物理端） | 误译为“边/侧” |
| feature | 世界生成语境为“地物”；渲染管线语境为“渲染元素” | 不分语境一律译为“地物”“功能”或“特征” |
| dedicated server | 专用服务端 | “专注服务器” |
| vanilla | 原版 | “香草” |
| render / rendering | 渲染 | “翻译”（同形词 render） |
| tick | 刻（游戏刻 tick） | 保留 tick 或“游戏刻” |
| level | 世界（Level 指维度/世界实例） | 慎译“等级” |
| world | 世界 | |
| singleton | 单例 | |
| classloading | 类加载 | |
| supplier | Supplier（类型）/ 提供者（概念） | |
| mapping（Mojang mappings） | 映射 | |

## 七、文风约定

- 使用现代简体中文，句子适合中国开发者阅读。
- 避免翻译腔：不用“进行一个……操作”“对于……来说”“通过使用……”。
- 中文正文使用中文标点（，。：；“”（）），代码/标识符内保持英文标点。
- 中英文之间、中文与行内代码之间可留空格以提升可读性（全文统一）。
- 标题简洁、便于导航，术语与正文一致。

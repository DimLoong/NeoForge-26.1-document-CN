# 战利品表 {#loot-tables}

战利品表是用于定义随机掉落物的数据文件。战利品表可以被“掷取”（roll），返回一个（可能为空的）物品堆叠列表。这一过程的输出取决于（伪）随机性。战利品表位于 `data/<mod_id>/loot_table/<name>.json`。例如，泥土方块使用的战利品表 `minecraft:blocks/dirt` 位于 `data/minecraft/loot_table/blocks/dirt.json`。

Minecraft 在游戏的多个环节使用战利品表，包括[方块][block]掉落、[实体][entity]掉落、箱子战利品、钓鱼战利品等等。战利品表如何被引用取决于具体语境：

- 默认情况下，每个方块都会获得一个关联的战利品表，位于 `<block_namespace>:blocks/<block_name>`。通过在方块的 `Properties` 上调用 `#noLootTable` 可以禁用这一行为，此时不会创建战利品表，方块也不会掉落任何东西；这主要用于类空气方块或技术性方块。
- 默认情况下，每个未调用 `EntityType.Builder#noLootTable` 的实体（通常是 `MobCategory#MISC` 中的实体会调用该方法）都会获得一个关联的战利品表，位于 `<entity_namespace>:entities/<entity_name>`。通过重写 `#getLootTable` 可以改变这一行为。例如，绵羊利用它根据羊毛颜色掷取不同的战利品表。
- 结构中的箱子在其方块实体数据里指定各自的战利品表。Minecraft 把所有箱子战利品表存放在 `minecraft:chests/<chest_name>`；建议 Mod 遵循这一惯例，但并非强制。
- 村民在袭击后可能扔给玩家的礼物物品，其战利品表定义在 [`neoforge:raid_hero_gifts` 数据映射][raidherogifts] 中。
- 其他战利品表，例如钓鱼战利品表，在需要时通过 `level.getServer().reloadableRegistries().getLootTable(lootTableKey)` 获取。所有原版战利品表位置的完整列表可在 `BuiltInLootTables` 中找到。

:::warning
战利品表一般只应为属于你自己 Mod 的内容创建。若要修改已有的战利品表，应改用[全局战利品修改器（GLM）][glm]。
:::

由于战利品表系统较为复杂，战利品表由若干各具用途的子系统组合而成。

## 战利品项 {#loot-entry}

战利品项（或称战利品池项），在代码中通过抽象类 `LootPoolEntryContainer` 表示，是单个战利品元素。它可以指定一个或多个要掉落的物品。

战利品项通常分为两组：单例项（共同父类为 `LootPoolSingletonContainer`）和复合项（共同父类为 `CompositeEntryBase`），其中复合项由多个单例项构成。Minecraft 提供了以下单例类型：

- `minecraft:empty`：空战利品项，表示没有物品。在代码中通过调用 `EmptyLootItem#emptyItem` 创建。
- `minecraft:item`：单个战利品物品项，掷取时掉落指定物品。在代码中通过对目标物品调用 `LootItem#lootTableItem` 创建。
    - 设置堆叠大小、数据组件等可以通过战利品函数完成。
- `minecraft:tag`：标签项，掷取时掉落指定标签中的所有物品。根据布尔属性 `expand` 的取值有两种变体。若 `expand` 为 true，则为标签中的每个物品各生成一个独立项，否则用一个项掉落所有物品。通过调用 `TagEntry#tagContents`（对应 `expand=false`）或 `TagEntry#expandTag`（对应 `expand=true`）创建，各自接受一个物品[标签键][tags]参数。
    - 例如，若 `expand` 为 true 且标签为 `#minecraft:planks`，则为每种木板各生成一个项（因此原版 11 种木板生成 11 个项，每种 Mod 木板再各生成一个项），每个项带有指定的权重、品质和函数；而若 `expand` 为 false，则使用单个掉落全部木板的项。
- `minecraft:slots`：引用任意物品栏槽位（如实体、物品等）的战利品项。`minecraft:slot_range` 来源可用于针对实体和方块实体，而 `minecraft:contents` 可用于针对带有基于内容的数据组件、并且定义并注册了 `ContainerComponentManipulator` 的物品。
- `minecraft:dynamic`：引用动态掉落的战利品项。动态掉落是一套用于向战利品表添加无法预先指定、而是在代码中添加的项的系统。一个动态掉落项由一个 id 和一个实际添加物品的 `Consumer<ItemStack>` 组成。要添加动态掉落项，需指定一个带有目标 id 的 `minecraft:dynamic` 项，然后在[战利品上下文][context]中添加对应的消费者。通过 `DynamicLoot#dynamicEntry` 创建。
- `minecraft:loot_table`：掷取另一个战利品表的战利品项，将该战利品表的结果作为单个项加入。另一个战利品表既可以通过 id 指定，也可以整体内联。在代码中通过带有 `Identifier` 参数的 `NestedLootTable#lootTableReference` 创建，或对于内联战利品表通过带有 `LootTable` 对象参数的 `NestedLootTable#inlineLootTable` 创建。

Minecraft 提供了以下复合类型：

- `minecraft:group`：包含一列其他战利品项的战利品项，这些项按顺序运行。在代码中通过调用 `EntryGroup#list` 创建，或对另一个 `LootPoolSingletonContainer.Builder` 调用 `#append` 创建，两者都接受其他战利品项构建器。
- `minecraft:sequence`：类似 `minecraft:group`，但一旦某个子项失败，该战利品项就停止运行，并丢弃其后的所有项。在代码中通过调用 `SequentialEntry#sequential` 创建，或对另一个 `LootPoolSingletonContainer.Builder` 调用 `#then` 创建，两者都接受其他战利品项构建器。
- `minecraft:alternatives`：与 `minecraft:sequence` 大致相反，但一旦某个子项成功（而非某个子项失败），该战利品项就停止运行，并丢弃其后的所有项。在代码中通过调用 `AlternativesEntry#alternatives` 创建，或对另一个 `LootPoolSingletonContainer.Builder` 调用 `#otherwise` 创建，两者都接受其他战利品项构建器。

通过共同父类 `LootPoolEntryContainer`，它们都拥有 `conditions` 属性，用于提供一列应用于该战利品项的[战利品条件][lootcondition]。若有一个条件失败，则该项被视为不存在。

对于继承 `LootPoolSingletonContainer` 的单例项，它们还额外拥有：

- `weight`：权重值。默认为 1。用于某些物品应比其他物品更常见的场景。例如，给定两个战利品项，一个权重为 3，一个权重为 1，那么第一个项被选中的概率为 75%，第二个项为 25%。
- `quality`：品质值。默认为 0。若该值非零，则掷取战利品表时，它会乘以幸运值（在[战利品上下文][context]中设置）再加到权重上。
- `functions`：一列应用于该战利品项输出的[战利品函数][lootfunction]。

对于 Mod 开发者，也可以定义[自定义战利品项类型][customentry]。

## 战利品池 {#loot-pool}

战利品池本质上是一列战利品项。战利品表可以包含多个战利品池，每个战利品池都会独立于其他池被掷取。

战利品池可以包含以下内容：

- `entries`：一列战利品项。
- `conditions`：一列应用于该战利品池的[战利品条件][lootcondition]。若有一个条件失败，则该战利品池的所有项都不会被掷取。
- `functions`：一列应用于该战利品池所有战利品项输出的[战利品函数][lootfunction]。
- `rolls` 和 `bonus_rolls`：两个数值提供器（详见下文），二者共同决定该战利品池被掷取的次数。公式为 rolls + bonus_rolls * luck，其中幸运值在[战利品参数][parameters]中设置。
- `name`：战利品池的名称。由 NeoForge 添加。可供 [GLM][glm] 使用。若未指定，则为战利品池的哈希码，并以 `custom#` 为前缀。

## 数值提供器 {#number-provider}

数值提供器是在数据包语境下获取（伪）随机数的一种方式。它们主要供战利品表使用，但也用于其他语境，例如世界生成。原版提供以下六种数值提供器：

- `minecraft:constant`：常量浮点值，在需要时四舍五入为整数。通过 `ConstantValue#exactly` 创建。
- `minecraft:uniform`：均匀分布的随机整数或浮点值，需设置 min 和 max 值。min 与 max 之间的所有值出现概率相同。通过 `UniformGenerator#between` 创建。
- `minecraft:binomial`：二项分布的随机整数值，需设置 n 和 p 值。关于这些值的含义，参见[二项分布][binomial]。通过 `BinomialDistributionGenerator#binomial` 创建。
- `minecraft:score`：给定一个实体目标、一个计分项名称以及（可选的）一个缩放值，获取该实体目标对应的记分板值，并（如提供）将其乘以给定的缩放值。通过 `ScoreboardValue#fromScoreboard` 创建。
- `minecraft:storage`：命令存储中给定 nbt 路径处的值。通过 `new StorageValue` 创建。
- `minecraft:sum`：将其他数值提供器的值相加。通过 `new Sum` 创建。
- `minecraft:enchantment_level`：为每个附魔等级提供值的提供器。通过 `EnchantmentLevelProvider#forEnchantmentLevel` 创建，需提供一个 `LevelBasedValue`。有效的 `LevelBasedValue` 有：
    - 直接是一个常量值，不指定类型。通过 `LevelBasedValue#constant` 创建。
    - `minecraft:linear`：每个附魔等级线性递增的值，外加一个可选的常量基础值。通过 `LevelBasedValue#perLevel` 创建。
    - `minecraft:levels_squared`：对附魔值求平方，然后加上一个可选的基础值。通过 `new LevelBasedValue.LevelsSquared` 创建。
    - `minecraft:fraction`：接受另外两个 `LevelBasedValue`，用它们构成一个分数。通过 `new LevelBasedValue.Fraction` 创建。
    - `minecraft:clamped`：接受另一个 `LevelBasedValue`，以及 min 和 max 值。使用该 `LevelBasedValue` 计算值并将结果钳制在范围内。通过 `new LevelBasedValue.Clamped` 创建。
    - `minecraft:exponent`：接受另外两个 `LevelBasedValue`，将第一个值提升为第二个值的幂。通过 `new LevelBasedValue.Exponent` 创建。
    - `minecraft:lookup`：接受一个 `List<Float>` 和一个后备 `LevelBasedValue`。在列表中查找要使用的值（等级 1 为列表中第一个元素，等级 2 为第二个元素，以此类推），若某等级对应的值缺失则使用后备值。通过 `LevelBasedValue#lookup` 创建。
- `minecraft:environment_attribute`：获取当前位置或维度处某个环境属性的数值。通过 `new EnvironmentAttributeValue` 创建。

如有需要，Mod 开发者也可以注册[自定义数值提供器][customnumber]和[自定义基于等级的值][customlevelbased]。

## 战利品参数 {#loot-parameters}

战利品参数，在内部称为 `ContextKey<T>`，是掷取战利品表时提供给它的参数，其中 `T` 是所提供参数的类型，例如 `BlockPos` 或 `Entity`。它们可供[战利品条件][lootcondition]和[战利品函数][lootfunction]使用。例如，`minecraft:killed_by_player` 战利品条件会检查 `minecraft:player` 参数是否存在。

Minecraft 提供以下战利品参数：

- `minecraft:this_entity`：与战利品表关联的实体，通常是被杀死的实体。通过 `LootContextParams.THIS_ENTITY` 访问。
- `minecraft:interacting_entity`：正在与战利品表交互的实体，例如正在挖掘方块的玩家。通过 `LootContextParams.INTERACTING_ENTITY` 访问。
- `minecraft:target_entity`：与战利品表关联的实体，通常是某次交互的目标。通过 `LootContextParams.TARGET_ENTITY` 访问。
- `minecraft:last_damage_player`：与战利品表关联的玩家，通常是最后攻击被杀死实体的玩家，即使这次玩家击杀是间接的（例如：玩家轻击了该实体，随后它被尖刺杀死）。例如用于仅玩家击杀才掉落的物品。通过 `LootContextParams.LAST_DAMAGE_PLAYER` 访问。
- `minecraft:damage_source`：与战利品表关联的[伤害来源][damagesource]，通常是杀死该实体的伤害来源。通过 `LootContextParams.DAMAGE_SOURCE` 访问。
- `minecraft:attacking_entity`：与战利品表关联的攻击实体，通常是该实体的击杀者。通过 `LootContextParams.ATTACKING_ENTITY` 访问。
- `minecraft:direct_attacking_entity`：与战利品表关联的直接攻击实体。例如，若攻击实体是骷髅，则直接攻击实体就是箭。通过 `LootContextParams.DIRECT_ATTACKING_ENTITY` 访问。
- `minecraft:origin`：与战利品表关联的位置，例如战利品箱的位置。通过 `LootContextParams.ORIGIN` 访问。
- `minecraft:block_state`：与战利品表关联的方块状态，例如被破坏的方块状态。通过 `LootContextParams.BLOCK_STATE` 访问。
- `minecraft:block_entity`：与战利品表关联的方块实体，例如与被破坏方块关联的方块实体。例如潜影盒用它将其物品栏保存到掉落物中。通过 `LootContextParams.BLOCK_ENTITY` 访问。
- `minecraft:tool`：与战利品表关联的物品实例，例如用于破坏方块的物品。它不一定是工具。通过 `LootContextParams.TOOL` 访问。
- `minecraft:explosion_radius`：当前语境中的爆炸半径。主要用于对掉落物应用爆炸衰减。通过 `LootContextParams.EXPLOSION_RADIUS` 访问。
- `minecraft:enchantment_level`：附魔等级，由附魔逻辑使用。通过 `LootContextParams.ENCHANTMENT_LEVEL` 访问。
- `minecraft:enchantment_active`：所用物品是否带有某种附魔，例如由精准采集判定使用。通过 `LootContextParams.ENCHANTMENT_ACTIVE` 访问。
- `minecraft:additional_cost_component_allowed`：若交易元数据需要，允许村民交易产生额外成本。

自定义战利品参数可通过用目标 id 调用 `new ContextKey<T>` 创建。由于它们只是资源标识符的包装，因此无需注册。

### 实体目标 {#entity-targets}

实体目标是战利品条件和函数中使用的一种类型，在代码中由 `LootContext.EntityTarget` 枚举表示。它们用于指定在条件或函数语境中要查询的实体战利品参数。有效值为：

- `"this"` 或 `LootContext.EntityTarget.THIS`：表示 `"minecraft:this_entity"` 参数。
- `"attacker"` 或 `LootContext.EntityTarget.ATTACKER`：表示 `"minecraft:attacking_entity"` 参数。
- `"direct_attacker"` 或 `LootContext.EntityTarget.DIRECT_ATTACKER`：表示 `"minecraft:direct_attacking_entity"` 参数。
- `"attacking_player"` 或 `LootContext.EntityTarget.ATTACKING_PLAYER`：表示 `"minecraft:last_damage_player"` 参数。
- `"target_entity"` 或 `LootContext.EntityTarget.TARGET_ENTITY`：表示 `"minecraft:target_entity"` 参数。
- `"interacting_entity"` 或 `LootContext.EntityTarget.INTERACTING_ENTITY`：表示 `"minecraft:interacting_entity"` 参数。

例如，`minecraft:entity_properties` 战利品条件接受一个实体目标，从而允许检查全部四个战利品参数（如果你作为战利品表作者有此需要）。

### 战利品参数集 {#loot-parameter-sets}

战利品参数集，也称为战利品表类型，在代码中称为 `ContextKeySet`，是一组必需和可选战利品参数的集合。尽管名为“集”，它们并不是 `Set`（甚至不是 `Collection`）。实际上，它们是对两个 `Set<ContextKey<?>>` 的包装，一个持有必需参数（`#required`），一个持有可选参数（`#allowed`）。它们用于验证战利品参数的使用者只使用预期可用的参数，并在掷取表时验证必需参数已经存在。除此之外，它们还用于进度和附魔逻辑。

原版提供以下战利品参数集（必需参数以**粗体**表示，可选参数以_斜体_表示；代码中的名称是 `LootContextParamSets` 中的常量）：

| ID                               | 代码中名称           | 指定的战利品参数                                                                                                                                                                                                                                                                                            | 用途                                                     |
|----------------------------------|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| `minecraft:empty`                | `EMPTY`                | 无                                                                                                                                                                                                                                                                                                                  | 用于后备。                                        |
| `minecraft:generic`              | `ALL_PARAMS`           | **`minecraft:origin`**, **`minecraft:tool`**, **`minecraft:block_state`**, **`minecraft:block_entity`**, **`minecraft:explosion_radius`**, **`minecraft:this_entity`**, **`minecraft:damage_source`**, **`minecraft:attacking_entity`**, **`minecraft:direct_attacking_entity`**, **`minecraft:last_damage_player`** | 验证。                                               |
| `minecraft:command`              | `COMMAND`              | **`minecraft:origin`**, _`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | 命令。                                                 |
| `minecraft:selector`             | `SELECTOR`             | **`minecraft:origin`**, _`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | 命令中的实体选择器。                             |
| `minecraft:villager_trade`       | `VILLAGER_TRADE`       | **`minecraft:origin`**, **`minecraft:this_entity`**, **`minecraft:additional_cost_component_allowed`**,                                                                                                                                                                                                                                      | 村民交易。                                        |
| `minecraft:block`                | `BLOCK`                | **`minecraft:origin`**, **`minecraft:tool`**, **`minecraft:block_state`**, _`minecraft:block_entity`_, _`minecraft:explosion_radius`_, _`minecraft:this_entity`_                                                                                                                                                     | 方块破坏。                                           |
| `minecraft:block_use`            | `BLOCK_USE`            | **`minecraft:origin`**, **`minecraft:block_state`**, **`minecraft:this_entity`**                                                                                                                                                                                                                                     | 原版无使用。                                          |
| `minecraft:block_interact`       | `BLOCK_INTERACT`       | **`minecraft:block_state`**, _`minecraft:block_entity`_, _`minecraft:interacting_entity`_, _`minecraft:tool`_                                                                                                                                                                 | 方块交互。                                         |
| `minecraft:hit_block`            | `HIT_BLOCK`            | **`minecraft:origin`**, **`minecraft:enchantment_level`**, **`minecraft:block_state`**, **`minecraft:this_entity`**                                                                                                                                                                                                  | 引雷附魔。                               |
| `minecraft:chest`                | `CHEST`                | **`minecraft:origin`**, _`minecraft:this_entity`_, _`minecraft:attacking_entity`_                                                                                                                                                                                                                                    | 战利品箱及类似容器、战利品箱矿车。 |
| `minecraft:archaeology`          | `ARCHAEOLOGY`          | **`minecraft:origin`**, **`minecraft:this_entity`**, **`minecraft:tool`**                                                                                                                                                                                                                                                                    | 考古。                                              |
| `minecraft:vault`                | `VAULT`                | **`minecraft:origin`**, _`minecraft:this_entity`_, _`minecraft:tool`_                                                                                                                                                                                                                                                                    | 试炼密室宝库奖励。                              |
| `minecraft:entity`               | `ENTITY`               | **`minecraft:origin`**, **`minecraft:this_entity`**, **`minecraft:damage_source`**, _`minecraft:attacking_entity`_, _`minecraft:direct_attacking_entity`_, _`minecraft:last_damage_player`_                                                                                                                          | 实体击杀。                                             |
| `minecraft:entity_interact`      | `ENTITY_INTERACT`      | **`minecraft:target_entity`**, **`minecraft:tool`**, _`minecraft:interacting_entity`_ | 实体交互。                                            |
| `minecraft:shearing`             | `SHEARING`             | **`minecraft:origin`**, **`minecraft:this_entity`**, **`minecraft:tool`**                                                                                                                                                                                                                                                                    | 剪切实体，例如绵羊。                            |
| `minecraft:equipment`            | `EQUIPMENT`            | **`minecraft:origin`**, **`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | 例如僵尸的实体装备。                        |
| `minecraft:gift`                 | `GIFT`                 | **`minecraft:origin`**, **`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | 袭击英雄礼物。                                          |
| `minecraft:barter`               | `PIGLIN_BARTER`        | **`minecraft:this_entity`**                                                                                                                                                                                                                                                                                          | 猪灵以物易物。                                         |
| `minecraft:fishing`              | `FISHING`              | **`minecraft:origin`**, **`minecraft:tool`**, _`minecraft:this_entity`_, _`minecraft:attacking_entity`_                                                                                                                                                                                                              | 钓鱼。                                                  |
| `minecraft:enchanted_item`       | `ENCHANTED_ITEM`       | **`minecraft:tool`**, **`minecraft:enchantment_level`**                                                                                                                                                                                                                                                              | 若干附魔。                                     |
| `minecraft:enchanted_entity`     | `ENCHANTED_ENTITY`     | **`minecraft:origin`**, **`minecraft:enchantment_level`**, **`minecraft:this_entity`**                                                                                                                                                                                                                               | 若干附魔。                                     |
| `minecraft:enchanted_damage`     | `ENCHANTED_DAMAGE`     | **`minecraft:origin`**, **`minecraft:enchantment_level`**, **`minecraft:this_entity`**, **`minecraft:damage_source`**, _`minecraft:attacking_entity`_, _`minecraft:direct_attacking_entity`_                                                                                                                         | 伤害与保护类附魔。                       |
| `minecraft:enchanted_location`   | `ENCHANTED_LOCATION`   | **`minecraft:origin`**, **`minecraft:enchantment_level`**, **`minecraft:enchantment_active`**, **`minecraft:this_entity`**                                                                                                                                                                                           | 冰霜行者和灵魂疾行附魔。                 |
| `minecraft:advancement_entity`   | `ADVANCEMENT_ENTITY`   | **`minecraft:origin`**, **`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | 若干[进度条件][advancement]。              |
| `minecraft:advancement_location` | `ADVANCEMENT_LOCATION` | **`minecraft:origin`**, **`minecraft:tool`**, **`minecraft:block_state`**, **`minecraft:this_entity`**                                                                                                                                                                                                               | 若干[进度触发器][advancement]。              |
| `minecraft:advancement_reward`   | `ADVANCEMENT_REWARD`   | **`minecraft:origin`**, **`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | [进度奖励][advancement]。                       |

### 战利品上下文 {#loot-context}

战利品上下文是一个包含掷取战利品表所需情境信息的对象。这些信息包括：

- 掷取战利品表所在的 `ServerLevel`。通过 `#getLevel` 获取。
- 用于掷取战利品表的 `RandomSource`。通过 `#getRandom` 获取。
- 战利品参数。使用 `#hasParameter` 检查是否存在，使用 `#getParameter` 获取单个参数。
- 幸运值，用于计算奖励掷取次数和品质值。通常由实体的幸运属性填充。通过 `#getLuck` 获取。
- 动态掉落消费者。详见[上文][entry]。通过 `#addDynamicDrops` 设置。没有对应的 getter。

## 战利品表 {#loot-table}

把前面所有元素组合起来，我们终于得到一张战利品表。战利品表 JSON 可以指定以下值：

- `pools`：一列战利品池。
- `neoforge:conditions`：一列[数据加载条件][conditions]。**警告：这些是数据加载条件，不是[战利品条件][lootcondition]！**
- `functions`：一列应用于该战利品表所有战利品项输出的[战利品函数][lootfunction]。
- `type`：一个战利品参数集，用于验证战利品参数的正确使用。可选；若缺省，则跳过验证。
- `random_sequence`：该战利品表的随机序列，以资源标识符的形式给出。随机序列由 `Level` 提供，用于在完全相同条件下获得一致的战利品表掷取结果。它通常使用战利品表的位置。

一个示例战利品表可能具有如下格式：

```json5
{
    "type": "chest", // loot parameter set
    "neoforge:conditions": [
        // data load conditions
    ],
    "functions": [
        // table-wide loot functions
    ],
    "pools": [ // list of loot pools
        {
            "rolls": 1, // amount of rolls of the loot table, using 5 here will yield 5 results from the pool
            "bonus_rolls": 0.5, // amount of bonus rolls
            "name": "my_pool",
            "conditions": [
                // pool-wide loot conditions
            ],
            "functions": [
                // pool-wide loot functions
            ],
            "entries": [ // list of loot table entries
                {
                    "type": "minecraft:item", // loot entry type
                    "name": "minecraft:dirt", // type-specific properties, for example the name of the item
                    "weight": 3, // weight of an entry
                    "quality": 1, // quality of an entry
                    "conditions": [
                        // entry-wide loot conditions
                    ],
                    "functions": [
                        // entry-wide loot functions
                    ]
                }
            ]
        }
    ]
}
```

## 掷取战利品表 {#rolling-a-loot-table}

要掷取战利品表，我们需要两样东西：战利品表本身，以及一个战利品上下文。

先从获取战利品表本身开始。我们可以使用 `level.getServer().reloadableRegistries().getLootTable(lootTableId)` 获取战利品表。由于战利品数据只能通过服务端获取，这段逻辑必须运行在[逻辑服务端][sides]上，而非逻辑客户端。

:::tip
Minecraft 内置的战利品表 ID 可在 `BuiltInLootTables` 类中找到。方块战利品表可通过 `BlockBehaviour#getLootTable` 获取，实体战利品表可通过 `EntityType#getDefaultLootTable` 或 `Entity#getLootTable` 获取。
:::

有了战利品表之后，我们来构建参数集。首先创建一个 `LootParams.Builder` 实例：

```java
// Make sure that you are on a server, otherwise the cast will fail.
LootParams.Builder builder = new LootParams.Builder((ServerLevel) level);
```

然后我们可以像这样添加战利品上下文参数：

```java
// Use whatever context parameters and values you need. Vanilla parameters can be found in LootContextParams.
builder.withParameter(LootContextParams.ORIGIN, position);
// This variant can accept null as the value, in which case an existing value for that parameter will be removed.
builder.withOptionalParameter(LootContextParams.ORIGIN, null);
// Add a dynamic drop.
builder.withDynamicDrop(Identifier.fromNamespaceAndPath("examplemod", "example_dynamic_drop"), stackAcceptor -> {
    // some logic here
});
// Set our luck value. Assumes that a player is available. Contexts without a player should use 0 here.
builder.withLuck(player.getLuck());
```

最后，我们可以从构建器创建 `LootParams`，并用它掷取战利品表：

```java
// Specify a loot context param set here if you want.
LootParams params = builder.create(LootContextParamSets.EMPTY);
// Get the loot table.
LootTable table = level.getServer().reloadableRegistries().getLootTable(location);
// Actually roll the loot table.
List<ItemStack> list = table.getRandomItems(params);
// Use this instead if you are rolling the loot table for container contents, e.g. loot chests.
// This method takes care of properly splitting the loot items across the container.
List<ItemStack> containerList = table.fill(container, params, someSeed);
```

:::danger
`LootTable` 还额外暴露了一个名为 `#getRandomItemsRaw` 的方法。与各种 `#getRandomItems` 变体不同，`#getRandomItemsRaw` 方法不会应用[全局战利品修改器][glm]。仅在你清楚自己在做什么时才使用此方法。
:::

## 数据生成 {#datagen}

战利品表可以通过注册一个 `LootTableProvider` 并在其构造函数中提供一列 `LootTableSubProvider` 来[数据生成][datagen]：

```java
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent.Client event) {
    // Call event.createDatapackRegistryObjects(...) first if adding datapack objects

    event.createProvider((output, lookupProvider) -> new LootTableProvider(
        output,
        // A set of required table resource locations. These are later verified to be present.
        // It is generally not recommended for mods to validate existence,
        // therefore we pass in an empty set.
        Set.of(),
        // A list of sub provider entries. See below for what values to use here.
        List.of(...),
        // The registry access
        lookupProvider
    ));
}
```

### `LootTableSubProvider` {#loottablesubproviders}

`LootTableSubProvider` 是实际发生生成的地方。要开始，我们实现 `LootTableSubProvider` 并重写 `#generate`：

```java
public class MyLootTableSubProvider implements LootTableSubProvider {
    // The parameter is provided by the lambda (see below). It can be stored and used to lookup other registry entries.
    public MyLootTableSubProvider(HolderLookup.Provider lookupProvider) {
        // Store the lookupProvider in a field
    }

    @Override
    public void generate(BiConsumer<ResourceKey<LootTable>, LootTable.Builder> consumer) {
        // LootTable.lootTable() returns a loot table builder we can add loot tables to.
        consumer.accept(
                ResourceKey.create(
                    Registries.LOOT_TABLE,
                    Identifier.fromNamespaceAndPath(ExampleMod.MOD_ID, "example_loot_table")
                ),
                LootTable.lootTable()
                // Add a loot table-level loot function. This example uses a number provider (see below).
                .apply(SetItemCountFunction.setCount(ConstantValue.exactly(5)))
                // Add a loot pool.
                .withPool(LootPool.lootPool()
                        // Add a loot pool-level function, similar to above.
                        .apply(...)
                        // Add a loot pool-level condition. This example only rolls the pool if it is raining.
                        .when(WeatherCheck.weather().setRaining(true))
                        // Set the amount of rolls and bonus rolls, respectively.
                        // Both of these methods utilize a number provider.
                        .setRolls(UniformGenerator.between(5, 9))
                        .setBonusRolls(ConstantValue.exactly(1))
                        // Add a loot entry. This example returns an item loot entry. See below for more loot entries.
                        .add(LootItem.lootTableItem(Items.DIRT))
                )
        );
    }
}
```

有了战利品表子提供器之后，我们像这样把它添加到战利品提供器的构造函数中：

```java
new LootTableProvider(output, Set.of(), List.of(
        new SubProviderEntry(
                // A reference to the sub provider's constructor.
                // This is a Function<HolderLookup.Provider, ? extends LootTableSubProvider>.
                MyLootTableSubProvider::new,
                // An associated loot context set. If you're unsure what to use, use empty.
                LootContextParamSets.EMPTY
        ),
        // other sub providers here (if applicable)
    ), lookupProvider
);
```

### `BlockLootSubProvider` {#blocklootsubprovider}

`BlockLootSubProvider` 是一个抽象辅助类，包含许多用于创建常见方块战利品表的辅助方法，例如单物品掉落（`#createSingleItemTable`）、掉落该表所对应的方块本身（`#dropSelf`）、仅精准采集才掉落（`#createSilkTouchOnlyTable`）、台阶类方块的掉落（`#createSlabItemTable`）等等。遗憾的是，为 Mod 使用配置 `BlockLootSubProvider` 涉及更多样板代码：

```java
public class MyBlockLootSubProvider extends BlockLootSubProvider {
    // The constructor can be private if this class is an inner class of your loot table provider.
    // The parameter is provided by the lambda in the LootTableProvider's constructor.
    public MyBlockLootSubProvider(HolderLookup.Provider lookupProvider) {
        // The first parameter is a set of blocks we are creating loot tables for. Instead of hardcoding,
        // we use our block registry and just pass an empty set here.
        // The second parameter is the feature flag set, this will be the default flags
        // unless you are adding custom flags (which is beyond the scope of this article).
        super(Set.of(), FeatureFlags.DEFAULT_FLAGS, lookupProvider);
    }

    // The contents of this Iterable are used for validation.
    // We return an Iterable over our block registry's values here.
    @Override
    protected Iterable<Block> getKnownBlocks() {
        // The contents of our DeferredRegister.
        return MyRegistries.BLOCK_REGISTRY.getEntries()
                .stream()
                // Cast to Block here, otherwise it will be a ? extends Block and Java will complain.
                .map(e -> (Block) e.value())
                .toList();
    }

    // Actually add our loot tables.
    @Override
    protected void generate() {
        // Equivalent to calling add(MyBlocks.EXAMPLE_BLOCK.get(), createSingleItemTable(MyBlocks.EXAMPLE_BLOCK.get()));
        this.dropSelf(MyBlocks.EXAMPLE_BLOCK.get());
        // Add a table with a silk touch only loot table.
        this.add(MyBlocks.EXAMPLE_SILK_TOUCHABLE_BLOCK.get(),
                this.createSilkTouchOnlyTable(MyBlocks.EXAMPLE_SILK_TOUCHABLE_BLOCK.get()));
        // other loot table additions here
    }
}
```

然后我们像添加任何其他子提供器一样，把这个子提供器添加到战利品表提供器的构造函数中：

```java
new LootTableProvider(output, Set.of(), List.of(new SubProviderEntry(
        MyBlockLootTableSubProvider::new,
        LootContextParamSets.BLOCK // it makes sense to use BLOCK here
    )), lookupProvider
);
```

### `EntityLootSubProvider` {#entitylootsubprovider}

与 `BlockLootSubProvider` 类似，`EntityLootSubProvider` 为实体战利品表生成提供了许多辅助方法。同样与 `BlockLootSubProvider` 类似，我们必须提供一个提供器已知实体的 `Stream<EntityType<?>>`（而非之前使用的 `Iterable<Block>`）。总体而言，我们的实现看起来与 `BlockLootSubProvider` 非常相似，只是把所有提到方块的地方换成了实体类型：

```java
public class MyEntityLootSubProvider extends EntityLootSubProvider {
    public MyEntityLootSubProvider(HolderLookup.Provider lookupProvider) {
        // Unlike with blocks, we do not provide a set of known entity types. Vanilla instead uses custom checks here.
        super(FeatureFlags.DEFAULT_FLAGS, lookupProvider);
    }

    // This class uses a Stream instead of an Iterable, so we need to adjust this slightly.
    @Override
    protected Stream<EntityType<?>> getKnownEntityTypes() {
        return MyRegistries.ENTITY_TYPES.getEntries()
                .stream()
                .map(e -> (EntityType<?>) e.value());
    }

    @Override
    protected void generate() {
        this.add(MyEntities.EXAMPLE_ENTITY.get(), LootTable.lootTable());
        // other loot table additions here
    }
}
```

同样，我们随后把这个子提供器添加到战利品表提供器的构造函数中：

```java
new LootTableProvider(output, Set.of(), List.of(new SubProviderEntry(
        MyEntityLootTableSubProvider::new,
        LootContextParamSets.ENTITY
    )), lookupProvider
);
```

[advancement]: ../advancements.md
[binomial]: https://en.wikipedia.org/wiki/Binomial_distribution
[block]: ../../../blocks/index.md
[conditions]: ../conditions.md
[context]: #loot-context
[customentry]: custom.md#custom-loot-entry-types
[customlevelbased]: custom.md#custom-level-based-values
[customnumber]: custom.md#custom-number-providers
[damagesource]: ../damagetypes.md#creating-and-using-damage-sources
[datagen]: ../../index.md#data-generation
[entity]: ../../../entities/index.md
[entry]: #loot-entry
[glm]: glm.md
[lootcondition]: lootconditions
[lootfunction]: lootfunctions
[parameters]: #loot-parameters
[raidherogifts]: ../datamaps/builtin.md#neoforgeraid_hero_gifts
[sides]: ../../../concepts/sides.md
[tags]: ../tags.md

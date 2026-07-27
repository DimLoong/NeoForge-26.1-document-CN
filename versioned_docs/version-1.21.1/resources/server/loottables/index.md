# 战利品表 {#loot-tables}

战利品表（loot table）是用于定义随机战利品掉落的数据文件。对一张战利品表进行「掷取」（roll），会返回一份（可能为空的）物品堆叠列表。该过程的结果取决于（伪）随机性。战利品表位于 `data/<mod_id>/loot_table/<name>.json`。例如，泥土方块使用的战利品表 `minecraft:blocks/dirt` 位于 `data/minecraft/loot_table/blocks/dirt.json`。

Minecraft 在游戏中的多个场景使用战利品表，包括方块掉落、实体掉落、箱子战利品、钓鱼战利品等。战利品表的引用方式取决于具体语境：

- 默认情况下，每个方块都会获得一张关联的战利品表，位于 `<block_namespace>:blocks/<block_name>`。可以通过在方块的 `Properties` 上调用 `#noLootTable` 来禁用它，这样就不会创建战利品表，方块也不会掉落任何东西；这主要用于类空气方块或技术性方块。
- 默认情况下，每个不属于 `MobCategory.MISC` 类别（由 `EntityType#getCategory` 决定）的 `LivingEntity` 子类都会获得一张关联的战利品表，位于 `<entity_namespace>:entities/<entity_name>`。如果你直接继承 `LivingEntity`，可以通过重写 `#getLootTable` 来更改它；如果你继承的是 `Mob` 或其子类，则可以重写 `#getDefaultLootTable`。例如，绵羊借此根据自身羊毛颜色掷取不同的战利品表。
- 结构中的箱子在其方块实体数据里指定所用的战利品表。 Minecraft 将所有箱子战利品表存放在 `minecraft:chests/<chest_name>`；Mod 推荐（但不要求）遵循这一做法。
- 村民在袭击结束后可能向玩家投掷的礼物物品，其战利品表定义在 [`neoforge:raid_hero_gifts` 数据映射][raidherogifts]中。
- 其他战利品表（例如钓鱼战利品表）会在需要时通过 `level.getServer().reloadableRegistries().getLootTable(lootTableId)` 获取。所有原版战利品表位置的列表可在 `BuiltInLootTables` 中找到。

:::warning
一般而言，只应为属于你自己 Mod 的内容创建战利品表。要修改已有的战利品表，应改用[全局战利品修改器（GLM）][glm]。
:::

由于战利品表系统较为复杂，战利品表由若干各司其职的子系统组成。

## 战利品条目 {#loot-entry}

战利品条目（loot entry，或称战利品池条目），在代码中由抽象类 `LootPoolEntryContainer` 表示，是单个的战利品元素。它可以指定要掉落的一个或多个物品。

原版共提供 8 种不同的战利品条目类型。通过共同的 `LootPoolEntryContainer` 父类，它们都具有以下属性：

- `weight`：权重值。默认为 1。用于让某些物品比其他物品更常见的情形。例如，给定两个战利品条目，一个权重为 3，一个权重为 1，那么第一个条目被选中的概率为 75%，第二个为 25%。
- `quality`：品质值。默认为 0。若该值非零，则在掷取战利品表时，它会与幸运值（在[战利品上下文][context]中设置）相乘，再加到权重上。
- `conditions`：应用于该战利品条目的[战利品条件][lootcondition]列表。如果其中一个条件不通过，该条目将被视为不存在。
- `functions`：应用于该战利品条目输出的[战利品函数][lootfunction]列表。

战利品条目通常分为两组：单例（single，共同父类为 `LootPoolSingletonContainer`）和复合（composite，共同父类为 `CompositeEntryBase`），其中复合条目由多个单例组成。 Minecraft 提供以下单例类型：

- `minecraft:empty`：空战利品条目，表示无物品。在代码中通过调用 `EmptyLootItem#emptyItem` 创建。
- `minecraft:item`：单个战利品物品条目，掷取时掉落指定的物品。在代码中通过对目标物品调用 `LootItem#lootTableItem` 创建。
    - 设置堆叠数量、数据组件等，可以通过战利品函数完成。
- `minecraft:tag`：标签条目，掷取时掉落指定标签中的所有物品。根据布尔属性 `expand` 的值有两种变体。若 `expand` 为 true，则为标签中的每个物品生成一个独立条目；否则用一个条目掉落全部物品。通过调用 `TagEntry#tagContents`（对应 `expand=false`）或 `TagEntry#expandTag`（对应 `expand=true`）创建，二者都接受一个物品[标签键][tags]参数。
    - 例如，若 `expand` 为 true 且标签为 `#minecraft:planks`，则为每种木板生成一个条目（即 11 种原版木板对应 11 个条目，外加每种 Mod 木板各一个条目），每个条目都带有指定的权重、品质和函数；而若 `expand` 为 false，则用单个条目掉落全部木板。
- `minecraft:dynamic`：引用动态掉落的战利品条目。动态掉落（dynamic drop）是一套用于向战利品表添加无法事先指定、而是在代码中添加的条目的系统。一个动态掉落条目由一个 id 和一个实际负责添加物品的 `Consumer<ItemStack>` 组成。要添加动态掉落条目，需先指定一个带有目标 id 的 `minecraft:dynamic` 条目，然后在[战利品上下文][context]中添加相应的 consumer。通过 `DynamicLoot#dynamicEntry` 创建。
- `minecraft:loot_table`：掷取另一张战利品表的战利品条目，将该战利品表的结果作为单个条目加入。另一张战利品表既可以通过 id 指定，也可以整体内联。在代码中通过对一个 `ResourceLocation` 参数调用 `NestedLootTable#lootTableReference` 创建，或对一个 `LootTable` 对象参数调用 `NestedLootTable#inlineLootTable` 来创建内联战利品表。

Minecraft 提供以下复合类型：

- `minecraft:group`：包含一个其他战利品条目列表的战利品条目，这些条目按顺序运行。在代码中通过调用 `EntryGroup#list`，或对另一个 `LootPoolSingletonContainer.Builder` 调用 `#append` 创建，二者都接受其他战利品条目构建器。
- `minecraft:sequence`：类似于 `minecraft:group`，但一旦某个子条目失败，该战利品条目就会停止运行，丢弃其后的所有条目。在代码中通过调用 `SequentialEntry#sequential`，或对另一个 `LootPoolSingletonContainer.Builder` 调用 `#then` 创建，二者都接受其他战利品条目构建器。
- `minecraft:alternatives`：可以说是 `minecraft:sequence` 的反面，但它一旦某个子条目成功（而非失败）就停止运行，丢弃其后的所有条目。在代码中通过调用 `AlternativesEntry#alternatives`，或对另一个 `LootPoolSingletonContainer.Builder` 调用 `#otherwise` 创建，二者都接受其他战利品条目构建器。

对于 Mod 开发者，也可以定义[自定义战利品条目类型][customentry]。

## 战利品池 {#loot-pool}

战利品池（loot pool）本质上是一个战利品条目列表。战利品表可以包含多个战利品池，每个战利品池都独立于其他池进行掷取。

战利品池可以包含以下内容：

- `entries`：战利品条目列表。
- `conditions`：应用于该战利品池的[战利品条件][lootcondition]列表。如果其中一个条件不通过，该战利品池的所有条目都不会被掷取。
- `functions`：应用于该战利品池所有战利品条目输出的[战利品函数][lootfunction]列表。
- `rolls` 和 `bonus_rolls`：两个数值提供器（number provider，见下文），共同决定该战利品池被掷取的次数。计算公式为 rolls + bonus_rolls * luck，其中幸运值在[战利品参数][parameters]中设置。
- `name`：战利品池的名称。由 NeoForge 添加。可供 [GLM][glm] 使用。如果未指定，则为该战利品池的哈希码，前缀为 `custom#`。

## 数值提供器 {#number-provider}

数值提供器（number provider）是一种在数据包语境中获取（伪）随机数的方式。它主要由战利品表使用，也用于其他语境，例如世界生成。原版提供以下六种数值提供器：

- `minecraft:constant`：一个常量浮点值，需要时四舍五入为整数。通过 `ConstantValue#exactly` 创建。
- `minecraft:uniform`：均匀分布的随机整数或浮点值，需设置 min 与 max 值。 min 与 max 之间的所有值出现概率相同。通过 `UniformGenerator#between` 创建。
- `minecraft:binomial`：二项分布的随机整数值，需设置 n 与 p 值。关于这些值的含义，参见[二项分布][binomial]了解更多信息。通过 `BinomialDistributionGenerator#binomial` 创建。
- `minecraft:score`：给定一个实体目标、一个记分项名称以及（可选的）一个缩放值，获取该实体目标对应的记分板值，并将其与给定的缩放值相乘（若提供了缩放值）。通过 `ScoreboardValue#fromScoreboard` 创建。
- `minecraft:storage`：命令存储（command storage）中某个给定 nbt 路径上的值。通过 `new StorageValue` 创建。
- `minecraft:enchantment_level`：为每个附魔等级提供数值的提供器。通过 `EnchantmentLevelProvider#forEnchantmentLevel` 创建，需提供一个 `LevelBasedValue`。有效的 `LevelBasedValue` 包括：
    - 只是一个常量值，不指定类型。通过 `LevelBasedValue#constant` 创建。
    - `minecraft:linear`：随附魔等级线性递增的值，外加一个可选的常量基础值。通过 `LevelBasedValue#perLevel` 创建。
    - `minecraft:levels_squared`：将附魔值平方，然后再加上一个可选的基础值。通过 `new LevelBasedValue.LevelsSquared` 创建。
    - `minecraft:fraction`：接受另外两个 `LevelBasedValue`，用它们构造一个分数。通过 `new LevelBasedValue.Fraction` 创建。
    - `minecraft:clamped`：接受另一个 `LevelBasedValue`，以及 min 与 max 值。使用该 `LevelBasedValue` 计算出结果并将其钳制在范围内。通过 `new LevelBasedValue.Clamped` 创建。
    - `minecraft:lookup`：接受一个 `List<Float>` 和一个回退 `LevelBasedValue`。在列表中查找要使用的值（等级 1 对应列表第一个元素，等级 2 对应第二个元素，以此类推），若某个等级没有对应值，则使用回退值。通过 `LevelBasedValue#lookup` 创建。

如有需要，Mod 开发者也可以注册[自定义数值提供器][customnumber]和[自定义等级相关值][customlevelbased]。

## 战利品参数 {#loot-parameters}

战利品参数（loot parameter），在内部称为 `LootContextParam<T>`，是掷取战利品表时提供给它的参数，其中 `T` 为所提供参数的类型，例如 `BlockPos` 或 `Entity`。它们可供[战利品条件][lootcondition]和[战利品函数][lootfunction]使用。例如，`minecraft:killed_by_player` 战利品条件会检查是否存在 `minecraft:player` 参数。

Minecraft 提供以下战利品参数：

- `minecraft:origin`：与战利品表关联的位置，例如战利品箱的位置。通过 `LootContextParams.ORIGIN` 访问。
- `minecraft:tool`：与战利品表关联的物品堆叠，例如用于破坏方块的物品。它不一定是工具。通过 `LootContextParams.TOOL` 访问。
- `minecraft:enchantment_level`：一个附魔等级，供附魔逻辑使用。通过 `LootContextParams.ENCHANTMENT_LEVEL` 访问。
- `minecraft:enchantment_active`：所用物品是否带有某种附魔，例如供精准采集检查使用。通过 `LootContextParams.ENCHANTMENT_ACTIVE` 访问。
- `minecraft:block_state`：与战利品表关联的方块状态，例如被破坏的方块状态。通过 `LootContextParams.BLOCK_STATE` 访问。
- `minecraft:block_entity`：与战利品表关联的方块实体，例如被破坏方块所关联的方块实体。例如潜影盒借此将其物品栏保存到掉落物中。通过 `LootContextParams.BLOCK_ENTITY` 访问。
- `minecraft:explosion_radius`：当前语境中的爆炸半径。主要用于对掉落物应用爆炸衰减。通过 `LootContextParams.EXPLOSION_RADIUS` 访问。
- `minecraft:this_entity`：与战利品表关联的实体，通常为被击杀的实体。通过 `LootContextParams.THIS_ENTITY` 访问。
- `minecraft:damage_source`：与战利品表关联的[伤害来源][damagesource]，通常为击杀该实体的伤害来源。通过 `LootContextParams.DAMAGE_SOURCE` 访问。
- `minecraft:attacking_entity`：与战利品表关联的攻击方实体，通常为该实体的击杀者。通过 `LootContextParams.ATTACKING_ENTITY` 访问。
- `minecraft:direct_attacking_entity`：与战利品表关联的直接攻击方实体。例如，若攻击方实体是骷髅，则直接攻击方实体就是箭。通过 `LootContextParams.DIRECT_ATTACKING_ENTITY` 访问。
- `minecraft:last_damage_player`：与战利品表关联的玩家，通常为最后攻击被击杀实体的玩家，即便该击杀是间接的（例如：玩家轻击了实体，随后实体被尖刺击杀）。例如用于仅玩家击杀才产生的掉落。通过 `LootContextParams.LAST_DAMAGE_PLAYER` 访问。

自定义战利品参数可以通过用目标 id 调用 `new LootContextParam<T>` 创建。由于它们只是资源标识符的包装，因此无需注册。

### 实体目标 {#entity-targets}

实体目标（entity target）是战利品条件和函数中使用的一种类型，在代码中由 `LootContext.EntityTarget` 枚举表示。它们用于指定在条件或函数语境中要查询的实体战利品参数。有效值为：

- `"this"` 或 `LootContext.EntityTarget.THIS`：表示 `"minecraft:this_entity"` 参数。
- `"attacker"` 或 `LootContext.EntityTarget.ATTACKER`：表示 `"minecraft:attacking_entity"` 参数。
- `"direct_attacker"` 或 `LootContext.EntityTarget.DIRECT_ATTACKER`：表示 `"minecraft:direct_attacking_entity"` 参数。
- `"attacking_player"` 或 `LootContext.EntityTarget.ATTACKING_PLAYER`：表示 `"minecraft:last_damage_player"` 参数。

例如，`minecraft:entity_properties` 战利品条件接受一个实体目标，从而允许检查全部四个战利品参数——如果你（作为战利品表作者）有此需要的话。

### 战利品参数集 {#loot-parameter-sets}

战利品参数集（loot parameter set），也称为战利品表类型，在代码中称为 `LootContextParamSet`，是必需与可选战利品参数的集合。尽管名为「集」，它们并不是 `Set`（甚至不是 `Collection`）。确切地说，它们是对两个 `Set<LootContextParam<?>>` 的包装，一个持有必需参数（`#getRequired`），一个持有必需与可选参数（`#getAllowed`）。它们用于验证战利品参数的使用者只使用那些可预期为可用的参数，并在掷取战利品表时验证必需参数是否存在。除此之外，它们也用于进度和附魔逻辑。

原版提供以下战利品参数集（必需参数以**粗体**表示，可选参数以_斜体_表示；代码中的名称是 `LootContextParamSets` 中的常量）：

| ID                               | 代码中的名称           | 指定的战利品参数                                                                                                                                                                                                                                                                                            | 用途                                                     |
|----------------------------------|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| `minecraft:empty`                | `EMPTY`                | 无                                                                                                                                                                                                                                                                                                                  | 回退用途。                                        |
| `minecraft:generic`              | `ALL_PARAMS`           | **`minecraft:origin`**、**`minecraft:tool`**、**`minecraft:block_state`**、**`minecraft:block_entity`**、**`minecraft:explosion_radius`**、**`minecraft:this_entity`**、**`minecraft:damage_source`**、**`minecraft:attacking_entity`**、**`minecraft:direct_attacking_entity`**、**`minecraft:last_damage_player`** | 验证。                                               |
| `minecraft:command`              | `COMMAND`              | **`minecraft:origin`**、_`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | 命令。                                                 |
| `minecraft:selector`             | `SELECTOR`             | **`minecraft:origin`**、_`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | 命令中的实体选择器。                             |
| `minecraft:block`                | `BLOCK`                | **`minecraft:origin`**、**`minecraft:tool`**、**`minecraft:block_state`**、_`minecraft:block_entity`_、_`minecraft:explosion_radius`_、_`minecraft:this_entity`_                                                                                                                                                     | 破坏方块。                                           |
| `minecraft:block_use`            | `BLOCK_USE`            | **`minecraft:origin`**、**`minecraft:block_state`**、**`minecraft:this_entity`**                                                                                                                                                                                                                                     | 无原版用途。                                          |
| `minecraft:hit_block`            | `HIT_BLOCK`            | **`minecraft:origin`**、**`minecraft:enchantment_level`**、**`minecraft:block_state`**、**`minecraft:this_entity`**                                                                                                                                                                                                  | 引雷附魔。                               |
| `minecraft:chest`                | `CHEST`                | **`minecraft:origin`**、_`minecraft:this_entity`_、_`minecraft:attacking_entity`_                                                                                                                                                                                                                                    | 战利品箱及类似容器、战利品箱矿车。 |
| `minecraft:archaeology`          | `ARCHAEOLOGY`          | **`minecraft:origin`**、_`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | 考古。                                              |
| `minecraft:vault`                | `VAULT`                | **`minecraft:origin`**、_`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | 试炼密室宝库奖励。                              |
| `minecraft:entity`               | `ENTITY`               | **`minecraft:origin`**、**`minecraft:this_entity`**、**`minecraft:damage_source`**、_`minecraft:attacking_entity`_、_`minecraft:direct_attacking_entity`_、_`minecraft:last_damage_player`_                                                                                                                          | 实体击杀。                                             |
| `minecraft:shearing`             | `SHEARING`             | **`minecraft:origin`**、_`minecraft:this_entity`_                                                                                                                                                                                                                                                                    | 剪切实体，例如绵羊。                            |
| `minecraft:equipment`            | `EQUIPMENT`            | **`minecraft:origin`**、**`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | 例如僵尸的实体装备。                        |
| `minecraft:gift`                 | `GIFT`                 | **`minecraft:origin`**、**`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | 袭击英雄礼物。                                        |
| `minecraft:barter`               | `PIGLIN_BARTER`        | **`minecraft:this_entity`**                                                                                                                                                                                                                                                                                          | 猪灵以物易物。                                        |
| `minecraft:fishing`              | `FISHING`              | **`minecraft:origin`**、**`minecraft:tool`**、_`minecraft:this_entity`_、_`minecraft:attacking_entity`_                                                                                                                                                                                                              | 钓鱼。                                                  |
| `minecraft:enchanted_item`       | `ENCHANTED_ITEM`       | **`minecraft:tool`**、**`minecraft:enchantment_level`**                                                                                                                                                                                                                                                              | 若干附魔。                                     |
| `minecraft:enchanted_entity`     | `ENCHANTED_ENTITY`     | **`minecraft:origin`**、**`minecraft:enchantment_level`**、**`minecraft:this_entity`**                                                                                                                                                                                                                               | 若干附魔。                                     |
| `minecraft:enchanted_damage`     | `ENCHANTED_DAMAGE`     | **`minecraft:origin`**、**`minecraft:enchantment_level`**、**`minecraft:this_entity`**、**`minecraft:damage_source`**、_`minecraft:attacking_entity`_、_`minecraft:direct_attacking_entity`_                                                                                                                         | 伤害与保护类附魔。                       |
| `minecraft:enchanted_location`   | `ENCHANTED_LOCATION`   | **`minecraft:origin`**、**`minecraft:enchantment_level`**、**`minecraft:enchantment_active`**、**`minecraft:this_entity`**                                                                                                                                                                                           | 冰霜行者与灵魂疾行附魔。                 |
| `minecraft:advancement_entity`   | `ADVANCEMENT_ENTITY`   | **`minecraft:origin`**、**`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | 若干[进度条件][advancement]。              |
| `minecraft:advancement_location` | `ADVANCEMENT_LOCATION` | **`minecraft:origin`**、**`minecraft:tool`**、**`minecraft:block_state`**、**`minecraft:this_entity`**                                                                                                                                                                                                               | 若干[进度触发器][advancement]。              |
| `minecraft:advancement_reward`   | `ADVANCEMENT_REWARD`   | **`minecraft:origin`**、**`minecraft:this_entity`**                                                                                                                                                                                                                                                                  | [进度奖励][advancement]。                       |

### 战利品上下文 {#loot-context}

战利品上下文（loot context）是一个包含掷取战利品表所需情境信息的对象。这些信息包括：

- 掷取该战利品表所在的 `ServerLevel`。通过 `#getLevel` 获取。
- 用于掷取该战利品表的 `RandomSource`。通过 `#getRandom` 获取。
- 战利品参数。使用 `#hasParam` 检查是否存在，使用 `#getParam` 获取单个参数。
- 幸运值，用于计算额外掷取次数和品质值。通常由实体的幸运属性填充。通过 `#getLuck` 获取。
- 动态掉落 consumer。更多信息见[上文][entry]。通过 `#addDynamicDrops` 设置。无对应 getter。

## 战利品表 {#loot-table}

将前述所有元素组合起来，我们最终得到一张战利品表。战利品表 JSON 可以指定以下值：

- `pools`：战利品池列表。
- `neoforge:conditions`：[数据加载条件][conditions]列表。**警告：这些是数据加载条件，不是[战利品条件][lootcondition]！**
- `functions`：应用于该战利品表所有战利品条目输出的[战利品函数][lootfunction]列表。
- `type`：一个战利品参数集，用于验证战利品参数的正确用法。可选；如果不填，将跳过验证。
- `random_sequence`：该战利品表的随机序列，形式为一个资源标识符。随机序列由 `Level` 提供，用于在相同条件下产生一致的战利品表掷取结果。这通常使用战利品表自身的位置。

一张示例战利品表可能具有以下格式：

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

要掷取一张战利品表，我们需要两样东西：战利品表本身，以及一个战利品上下文。

先从获取战利品表本身开始。我们可以使用 `level.getServer().reloadableRegistries().getLootTable(lootTableId)` 获取一张战利品表。由于战利品数据只能通过服务端访问，这段逻辑必须运行在[逻辑服务端][sides]上，而非逻辑客户端。

:::tip
Minecraft 内置的战利品表 ID 可在 `BuiltInLootTables` 类中找到。方块战利品表可以通过 `BlockBehaviour#getLootTable` 获取，实体战利品表可以通过 `EntityType#getDefaultLootTable` 或 `Entity#getLootTable` 获取。
:::

现在我们有了一张战利品表，接下来构建参数集。我们先创建一个 `LootParams.Builder` 实例：

```java
// Make sure that you are on a server, otherwise the cast will fail.
LootParams.Builder builder = new LootParams.Builder((ServerLevel) level);
```

随后我们可以添加战利品上下文参数，如下所示：

```java
// Use whatever context parameters and values you need. 原版 parameters can be found in LootContextParams.
builder.withParameter(LootContextParams.ORIGIN, position);
// This variant can accept null as the value, in which case an existing value for that parameter will be removed.
builder.withOptionalParameter(LootContextParams.ORIGIN, null);
// Add a dynamic drop.
builder.withDynamicDrop(ResourceLocation.fromNamespaceAndPath("examplemod", "example_dynamic_drop"), stack -> {
    // some logic here
});
// Set our luck value. Assumes that a player is available. Contexts without a player should use 0 here.
builder.withLuck(player.getLuck());
```

最后，我们可以从构建器创建 `LootParams`，并用它来掷取战利品表：

```java
// Specify a loot context param set here if you want.
LootParams params = builder.create(LootContextParamSet.EMPTY);
// Get the loot table.
LootTable table = level.getServer().reloadableRegistries().getLootTable(location);
// Actually roll the loot table.
List<ItemStack> list = table.getRandomItems(params);
// Use this instead if you are rolling the loot table for container contents, e.g. loot chests.
// This method takes care of properly splitting the loot items across the container.
List<ItemStack> containerList = table.fill(container, params, someSeed);
```

:::danger
`LootTable` 还额外暴露了一个名为 `#getRandomItemsRaw` 的方法。与各种 `#getRandomItems` 变体不同，`#getRandomItemsRaw` 方法不会应用[全局战利品修改器][glm]。仅在你清楚自己在做什么时才使用该方法。
:::

## 数据生成 {#datagen}

战利品表可以通过注册一个 `LootTableProvider` 并在其构造函数中提供一个 `LootTableSubProvider` 列表来进行[数据生成][datagen]：

```java
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
            event.includeServer(),
            output -> new MyLootTableProvider(
                    output,
                    // A set of required table resource locations. These are later verified to be present.
                    // It is generally not recommended for mods to validate existence,
                    // therefore we pass in an empty set.
                    Set.of(),
                    // A list of sub provider entries. See below for what values to use here.
                    List.of(...)
            )
    );
}
```

### `LootTableSubProvider` {#loottablesubproviders}

`LootTableSubProvider` 是实际发生生成的地方。要开始，我们实现 `LootTableSubProvider` 并重写 `#generate`：

```java
public class MyLootTableSubProvider implements LootTableSubProvider {
    // The parameter is provided by the lambda (see below). It can be stored and used to lookup other registry entries.
    public MyLootTableSubProvider(HolderLookup.Provider lookupProvider) {
        super(lookupProvider);
    }

    @Override
    public void generate(BiConsumer<ResourceKey<LootTable>, LootTable.Builder> consumer) {
        // LootTable.lootTable() returns a loot table builder we can add loot tables to.
        consumer.accept(
                ResourceKey.create(
                    Registries.LOOT_TABLE,
                    ResourceLocation.fromNamespaceAndPath(ExampleMod.MOD_ID, "example_loot_table")
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

有了战利品表子提供器后，我们像下面这样把它添加到战利品提供器的构造函数中：

```java
super(output, Set.of(), List.of(
        new SubProviderEntry(
                // A reference to the sub provider's constructor.
                // This is a Function<HolderLookup.Provider, ? extends LootTableSubProvider>.
                MyLootTableSubProvider::new,
                // An associated loot context set. If you're unsure what to use, use empty.
                LootContextParamSets.EMPTY
        ),
// other sub providers here (if applicable)
));
```

### `BlockLootSubProvider` {#blocklootsubprovider}

`BlockLootSubProvider` 是一个抽象辅助类，包含许多用于创建常见方块战利品表的辅助方法，例如单物品掉落（`#createSingleItemTable`）、掉落该战利品表所对应的方块（`#dropSelf`）、仅精准采集掉落（`#createSilkTouchOnlyTable`）、类台阶方块的掉落（`#createSlabItemTable`）等等。遗憾的是，为 Mod 用途设置一个 `BlockLootSubProvider` 需要更多样板代码：

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
        dropSelf(MyBlocks.EXAMPLE_BLOCK.get());
        // Add a table with a silk touch only loot table.
        add(MyBlocks.EXAMPLE_SILK_TOUCHABLE_BLOCK.get(),
                createSilkTouchOnlyTable(MyBlocks.EXAMPLE_SILK_TOUCHABLE_BLOCK.get()));
        // other loot table additions here
    }
}
```

随后我们像添加其他任何子提供器一样，把该子提供器添加到战利品表提供器的构造函数中：

```java
super(output, Set.of(), List.of(new SubProviderEntry(
        MyBlockLootTableSubProvider::new,
        LootContextParamSets.BLOCK // it makes sense to use BLOCK here
)));
```

### `EntityLootSubProvider` {#entitylootsubprovider}

与 `BlockLootSubProvider` 类似，`EntityLootSubProvider` 提供了许多用于实体战利品表生成的辅助方法。同样与 `BlockLootSubProvider` 类似，我们必须为该提供器提供一个已知实体的 `Stream<EntityType<?>>`（而非之前使用的 `Iterable<Block>`）。总体而言，我们的实现与 `BlockLootSubProvider` 非常相似，只是把所有提到方块的地方都换成了实体类型：

```java
public class MyEntityLootSubProvider extends EntityLootSubProvider {
    public MyEntityLootSubProvider(HolderLookup.Provider lookupProvider) {
        // Unlike with blocks, we do not provide a set of known entity types. 原版 instead uses custom checks here.
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
        add(MyEntities.EXAMPLE_ENTITY.get(), LootTable.lootTable());
        // other loot table additions here
    }
}
```

同样地，我们随后把该子提供器添加到战利品表提供器的构造函数中：

```java
super(output, Set.of(), List.of(new SubProviderEntry(
        MyEntityLootTableSubProvider::new,
        LootContextParamSets.ENTITY
)));
```

[advancement]: ../advancements.md
[binomial]: https://en.wikipedia.org/wiki/Binomial_distribution
[conditions]: ../conditions.md
[context]: #loot-context
[customentry]: custom.md#custom-loot-entry-types
[customlevelbased]: custom.md#custom-level-based-values
[customnumber]: custom.md#custom-number-providers
[damagesource]: ../damagetypes.md#creating-and-using-damage-sources
[datagen]: ../../index.md#data-generation
[entry]: #loot-entry
[glm]: glm.md
[lootcondition]: lootconditions
[lootfunction]: lootfunctions
[parameters]: #loot-parameters
[raidherogifts]: ../datamaps/builtin.md#neoforgeraid_hero_gifts
[sides]: ../../../concepts/sides.md
[tags]: ../tags.md

---
sidebar_position: 4
---
# 工具 {#tools}

工具是主要用途为破坏[方块][block]的[物品][item]。许多 Mod 会添加新的工具套装（例如铜制工具）或新的工具类型（例如锤子）。

## 自定义工具套装 {#custom-tool-sets}

一套工具通常由六件物品组成：一把镐、一把斧、一把锹、一把锄、一把剑和一把矛（剑和矛严格来说并不算传统意义上的工具，但为保持一致性也一并列于此）。所有这些工具都通过以下十四个[数据组件][datacomponents]的组合来实现：

- `DataComponents#MAX_DAMAGE` 和 `#DAMAGE`，用于耐久度
- `#MAX_STACK_SIZE`，用于将堆叠数量设为 `1`
- `#REPAIRABLE`，用于在铁砧中修复工具
- `#ENCHANTABLE`，用于最大[附魔][enchantment]值
- `#ATTRIBUTE_MODIFIERS`，用于攻击伤害和攻击速度
- `#TOOL`，用于挖掘信息
- `#WEAPON`，用于物品受到的损耗以及禁用盾牌
- `#ATTACK_RANGE`，用于挥动武器时的攻击范围
- `#DAMAGE_TYPE`，用于要造成的伤害类型
- `#MINIMUM_ATTACK_CHARGE`，用于使用此武器发动攻击前所需的最少 tick 数
- `#SWING_ANIMATION`，用于挥动武器时播放的动画
- `#PIERCING_WEAPON`，用于对多个实体的穿刺攻击
- `#KINETIC_WEAPON`，用于基于动量、对多个实体的物品使用攻击
- `#USE_EFFECTS`，用于在使用物品时对实体施加一些效果

通常，每件工具都通过 `Item.Properties#tool`、`#sword`、`#spear` 或 tool 的某个委托方法（`pickaxe`、`axe`、`hoe`、`shovel`）来设置。这些通常通过传入工具记录 `ToolMaterial` 来处理。注意，其他一些通常被视作工具的物品，例如剪刀，其常见的挖掘逻辑并不通过数据组件实现。相反，它们直接继承 `Item` 并通过重写相关方法来处理挖掘。交互行为（默认为右键）同样没有数据组件，这意味着锹、斧、锄各自拥有自己的工具类，分别为 `ShovelItem`、`AxeItem` 和 `HoeItem`。

要创建一套标准工具，你必须首先定义一个 `ToolMaterial`。参考数值可在 `ToolMaterial` 中的常量里找到。本示例使用铜制工具，你可以在此使用自己的材料并根据需要调整数值。

```java
// We place copper somewhere between stone and iron.
public static final ToolMaterial COPPER_MATERIAL = new ToolMaterial(
        // The tag that determines what blocks this material cannot break. See below for more information.
        MyBlockTags.INCORRECT_FOR_COPPER_TOOL,
        // Determines the durability of the material.
        // Stone is 131, iron is 250.
        200,
        // Determines the mining speed of the material. Unused by swords.
        // Stone uses 4, iron uses 6.
        5f,
        // Determines the attack damage bonus. Different tools use this differently. For example, swords do (getAttackDamageBonus() + 4) damage.
        // Stone uses 1, iron uses 2, corresponding to 5 and 6 attack damage for swords, respectively; our sword does 5.5 damage now.
        1.5f,
        // Determines the enchantability of the material. This represents how good the enchantments on this tool will be.
        // Gold uses 22, we put copper slightly below that.
        20,
        // The tag that determines what items can repair this material.
        Tags.Items.INGOTS_COPPER
);
```

现在我们有了 `ToolMaterial`，就可以用它来[注册][registering]工具了。所有 `tool` 委托方法都具有相同的三个参数：

```java
// ITEMS is a DeferredRegister.Items
public static final DeferredItem<Item> COPPER_SWORD = ITEMS.registerItem(
    "copper_sword",
    props -> new Item(
        // The item properties.
        props.sword(
            // The material to use.
            COPPER_MATERIAL,
            // The type-specific attack damage bonus. 3 for swords, 1.5 for shovels, 1 for pickaxes, varying for axes and hoes.
            3,
            // The type-specific attack speed modifier. The player has a default attack speed of 4, so to get to the desired
            // value of 1.6f, we use -2.4f. -2.4f for swords, -3f for shovels, -2.8f for pickaxes, varying for axes and hoes.
            -2.4f,
        )
    )
);

public static final DeferredItem<Item> COPPER_AXE = ITEMS.registerItem("copper_axe", props -> new Item(props.axe(...)));
public static final DeferredItem<Item> COPPER_PICKAXE = ITEMS.registerItem("copper_pickaxe", props -> new Item(props.pickaxe(...)));
public static final DeferredItem<Item> COPPER_SHOVEL = ITEMS.registerItem("copper_shovel", props -> new Item(props.shovel(...)));
public static final DeferredItem<Item> COPPER_HOE = ITEMS.registerItem("copper_hoe", props -> new Item(props.hoe(...)));

public static final DeferredItem<Item> COPPER_SPEAR = ITEMS.registerItem(
    "copper_spear",
    props -> new Item(
        props.spear(
            // The material to use.
            COPPER_MATERIAL,
            // The type-specific attack speed modifier. This value is scaled by performing the reciprocal of this value, then
            // subtracting 4.
            0.85f,
            // The damage multiplier applied when using the spear as a kinetic weapon, assuming one of the conditions are met.
            0.82f,
            // The number of seconds that must pass before the spear can be used as a kinetic weapon.
            0.65f,
            // The maximum number of seconds that can pass while using the kinetic weapon to dismount a hit entity.
            4.0f,
            // The minimum speed, in blocks, of the attacker using the kinetic weapon to dismount a hit entity.
            9.0f,
            // The maximum number of seconds that can pass while using the kinetic weapon to knockback a hit entity.
            8.25f,
            // The minimum speed, in blocks, of the attacker using the kinetic weapon to knockack a hit entity.
            5.1f,
            // The maximum number of seconds that can pass while using the kinetic weapon to damage a hit entity.
            12.5f,
            // The minimum speed, in blocks, of the attacker using the kinetic weapon to damage a hit entity. This is relative
            // to the attacked entity's speed.
            4.6f
        )
    )
);
```

:::note
`tool` 接受两个额外参数：表示哪些方块可被挖掘的 `TagKey`，以及格挡者（例如盾牌）在被命中时被禁用的秒数。
:::

### 标签 {#tags}

创建 `ToolMaterial` 时，会为其指定一个方块[标签][tags]，其中包含用此工具破坏时不会掉落任何东西的方块。例如，`minecraft:incorrect_for_stone_tool` 标签包含钻石矿石之类的方块，`minecraft:incorrect_for_iron_tool` 标签包含黑曜石和远古残骸之类的方块。为了更方便地将方块分配到其正确的挖掘等级，还存在一个用于标示需要此工具才能挖掘的方块的标签。例如，`minecraft:needs_iron_tool` 标签包含钻石矿石之类的方块，`minecraft:needs_diamond_tool` 标签包含黑曜石和远古残骸之类的方块。

如果你不介意，可以为你的工具复用某个现有的“incorrect”标签。例如，如果我们希望铜制工具就是更耐用的石制工具，那就传入 `BlockTags#INCORRECT_FOR_STONE_TOOL`。

或者，我们也可以创建自己的标签，如下所示：

```java
// This tag will allow us to add these blocks to the incorrect tags that cannot mine them
public static final TagKey<Block> NEEDS_COPPER_TOOL = TagKey.create(BuiltInRegistries.BLOCK.key(), Identifier.fromNamespaceAndPath(MOD_ID, "needs_copper_tool"));

// This tag will be passed into our material
public static final TagKey<Block> INCORRECT_FOR_COPPER_TOOL = TagKey.create(BuiltInRegistries.BLOCK.key(), Identifier.fromNamespaceAndPath(MOD_ID, "incorrect_for_cooper_tool"));
```

然后，我们填充自己的标签。例如，让我们使铜工具能够挖掘金矿石、金块和红石矿石，但不能挖掘钻石或绿宝石。（红石块本来就可以用石制工具挖掘。）该标签文件位于 `src/main/resources/data/mod_id/tags/block/needs_copper_tool.json`（其中 `mod_id` 是你的 mod id）：

```json5
{
    "values": [
        "minecraft:gold_block",
        "minecraft:raw_gold_block",
        "minecraft:gold_ore",
        "minecraft:deepslate_gold_ore",
        "minecraft:redstone_ore",
        "minecraft:deepslate_redstone_ore"
    ]
}
```

然后，为了得到要传入材料的标签，我们可以设置一个负向约束，涵盖那些对石制工具而言不正确、但又在我们铜工具标签内的工具。该标签文件位于 `src/main/resources/data/mod_id/tags/block/incorrect_for_cooper_tool.json`：

```json5
{
    "values": [
        "#minecraft:incorrect_for_stone_tool"
    ],
    "remove": [
        "#mod_id:needs_copper_tool"
    ]
}
```

最后，我们可以把标签传入材料实例，如上文所示。

如果你想检查某个工具是否能使某个方块状态掉落其方块，调用 `Tool#isCorrectForDrops`。可通过以 `DataComponents#TOOL` 调用 `ItemStack#get` 来获取 `Tool`。

## 自定义工具 {#custom-tools}

自定义工具可以通过 `Item.Properties#component` 向物品的默认组件列表中添加一个 `Tool` [数据组件][datacomponents]（通过 `DataComponents#TOOL`）来创建。

一个 `Tool` 包含一个 `Tool.Rule` 列表、持有工具时的默认挖掘速度（默认为 `1`）以及挖掘一个方块时工具应受到的损耗量（默认为 `1`）。一个 `Tool.Rule` 包含三条信息：一个应用该规则的方块 `HolderSet`、一个可选的挖掘该集合中方块的速度、以及一个可选的布尔值以决定这些方块能否从此工具掉落。如果这些可选值未设置，则会检查其余规则。若所有规则都不匹配，则默认行为是采用默认挖掘速度且方块不可掉落。

:::note
`HolderSet` 可通过 `Registry#getOrThrow` 从 `TagKey` 创建。
:::

创建任何工具或类多功能工具的物品（即将两个或更多工具合为一体的物品，例如把斧和镐合为一件物品）都可以在不使用任何现有 `ToolMaterial` 引用的情况下实现。它可以通过以下各部分的组合来实现：

- 通过 `Item.Properties#component` 设置 `DataComponents#TOOL`，添加一个带有你自己规则的 `Tool`。
- 通过 `Item.Properties#attributes` 为物品添加[属性修饰符][attributemodifier]（例如攻击伤害、攻击速度）。
- 通过 `Item.Properties#durability` 为物品添加耐久度。
- 通过 `Item.Properties#repariable` 允许物品被修复。
- 通过 `Item.Properties#enchantable` 允许物品被附魔。
- 通过 `Item.Properties#component` 设置 `DataComponents#WEAPON`，允许物品作为武器使用并可能禁用格挡者。
- 重写 `IItemExtension#canPerformAction` 以确定物品能执行哪些[`ItemAbility`][itemability]。
- 如果你希望物品在右键时基于 `ItemAbility` 修改方块状态，则调用 `IBlockExtension#getToolModifiedState`。
- 将你的工具加入某些 `minecraft:enchantable/*` `ItemTags`，以便物品能被施加某些附魔。
- 将你的工具加入某些 `minecraft:*_preferred_weapons` 标签，以让生物更倾向于拾取并使用你的武器。

对于盾牌，你可以为副手应用 [`DataComponents#EQUIPPABLE`][equippable] 数据组件，并用 `DataComponents#BLOCKS_ATTACKS` 在激活时减少对手持实体造成的伤害。

## `ItemAbility` {#itemabilitys}

`ItemAbility` 是对物品能做什么、不能做什么的一层抽象。这既包括左键行为，也包括右键行为。NeoForge 在 `ItemAbilities` 类中提供了默认的 `ItemAbility`：

- 斧的右键能力：剥皮（原木）、刮除（氧化的铜）和去蜡（涂蜡的铜）。
- 锹的右键能力：铲平（土径）和熄灭（营火）。
- 剪刀能力：挖掘（破坏方块）、收获（蜂巢）、移除盔甲（披甲的狼）、雕刻（南瓜）、解除（绊线）和修剪（阻止植物生长）。
- 剑横扫、锄耕地、钓鱼竿抛竿、三叉戟投掷、刷子刷除、打火石点燃和望远镜观察等能力。

要创建你自己的 `ItemAbility`，使用 `ItemAbility#get`——它会在需要时创建一个新的 `ItemAbility`。然后，在自定义工具类型中，按需重写 `IItemExtension#canPerformAction`。

要查询某个 `ItemStack` 是否能执行某个 `ItemAbility`，调用 `IItemStackExtension#canPerformAction`。注意，这适用于任何 `Item`，而不仅仅是工具。

[block]: ../blocks/index.md
[datacomponents]: datacomponents.md
[enchantment]: ../resources/server/enchantments/index.md#enchantment-costs-and-levels
[equippable]: armor.md#equippable
[item]: index.md
[itemability]: #itemabilitys
[registering]: ../concepts/registries.md#methods-for-registering
[tags]: ../resources/server/tags.md

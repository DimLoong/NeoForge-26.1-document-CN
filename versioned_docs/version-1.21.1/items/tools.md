---
sidebar_position: 3
---
# 工具与盔甲 {#tools--armor}

工具是[物品][item]，其主要用途是破坏[方块][block]。许多 Mod 会添加新的工具套装（例如铜制工具）或新的工具类型（例如锤子）。

## 自定义工具套装 {#custom-tool-sets}

一套工具通常由五件物品组成：镐、斧、锹、锄和剑。（剑在传统意义上并不算工具，但为保持一致这里也一并列入。）这些物品都有各自对应的类：分别是 `PickaxeItem`、 `AxeItem`、 `ShovelItem`、 `HoeItem` 和 `SwordItem`。工具的类继承结构如下：

```text
Item
- TieredItem
    - DiggerItem
        - AxeItem
        - HoeItem
        - PickaxeItem
        - ShovelItem
    - SwordItem
```

`TieredItem` 是一个包含辅助方法的类，用于处理具有某个 `Tier`（层级，下文详述）的物品。 `DiggerItem` 包含用于处理专门破坏方块的物品的辅助方法。注意，其他一些通常被视为工具的物品（例如剪刀）并不在这个继承结构中。它们直接继承 `Item`，并自行持有破坏逻辑。

要创建一套标准工具，你必须先定义一个 `Tier`。参考数值可查看 Minecraft 的 `Tiers` 枚举。本示例使用铜制工具，你可以在此换用自己的材料，并按需调整数值。

```java
// We place copper somewhere between stone and iron.
public static final Tier COPPER_TIER = new SimpleTier(
        // The tag that determines what blocks this tool cannot break. See below for more information.
        MyBlockTags.INCORRECT_FOR_COPPER_TOOL,
        // Determines the durability of the tier.
        // Stone is 131, iron is 250.
        200,
        // Determines the mining speed of the tier. Unused by swords.
        // Stone uses 4, iron uses 6.
        5f,
        // Determines the attack damage bonus. Different tools use this differently. For example, swords do (getAttackDamageBonus() + 4) damage.
        // Stone uses 1, iron uses 2, corresponding to 5 and 6 attack damage for swords, respectively; our sword does 5.5 damage now.
        1.5f,
        // Determines the enchantability of the tier. This represents how good the enchantments on this tool will be.
        // Gold uses 22, we put copper slightly below that.
        20,
        // Determines the repair ingredient of the tier. Use a supplier for lazy initializing.
        () -> Ingredient.of(Tags.Items.INGOTS_COPPER)
);
```

有了 `Tier` 之后，我们就可以用它来注册工具。所有工具的构造函数都有相同的四个参数。

```java
//ITEMS is a DeferredRegister<Item>
public static final Supplier<SwordItem> COPPER_SWORD = ITEMS.register("copper_sword", () -> new SwordItem(
        // The tier to use.
        COPPER_TIER,
        // The item properties. We don't need to set the durability here because TieredItem handles that for us.
        new Item.Properties().attributes(
            // There are `createAttributes` methods in either the class or subclass of each DiggerItem
            SwordItem.createAttributes(
                // The tier to use.
                COPPER_TIER,
                // The type-specific attack damage bonus. 3 for swords, 1.5 for shovels, 1 for pickaxes, varying for axes and hoes.
                3,
                // The type-specific attack speed modifier. The player has a default attack speed of 4, so to get to the desired
                // value of 1.6f, we use -2.4f. -2.4f for swords, -3f for shovels, -2.8f for pickaxes, varying for axes and hoes.
                -2.4f,
            )
        )
));
public static final Supplier<AxeItem> COPPER_AXE = ITEMS.register("copper_axe", () -> new AxeItem(...));
public static final Supplier<PickaxeItem> COPPER_PICKAXE = ITEMS.register("copper_pickaxe", () -> new PickaxeItem(...));
public static final Supplier<ShovelItem> COPPER_SHOVEL = ITEMS.register("copper_shovel", () -> new ShovelItem(...));
public static final Supplier<HoeItem> COPPER_HOE = ITEMS.register("copper_hoe", () -> new HoeItem(...));
```

### 标签 {#tags}

创建 `Tier` 时，会为它指定一个方块[标签][tags]，其中包含用此工具破坏后不会掉落任何东西的方块。例如，`minecraft:incorrect_for_stone_tool` 标签包含钻石矿石之类的方块，而 `minecraft:incorrect_for_iron_tool` 标签包含黑曜石和远古残骸之类的方块。为了更方便地将方块归入其错误的挖掘等级，还存在一个用于表示需要此工具才能挖掘的方块的标签。例如，`minecraft:needs_iron_tool` 标签包含钻石矿石之类的方块，而 `minecraft:needs_diamond_tool` 标签包含黑曜石和远古残骸之类的方块。

如果你觉得可以接受，也可以直接复用现成的某个 incorrect 标签。例如，如果我们希望铜制工具只是更耐用的石制工具，就可以传入 `BlockTags#INCORRECT_FOR_STONE_TOOL`。

或者，我们也可以创建自己的标签，如下所示：

```java
// This tag will allow us to add these blocks to the incorrect tags that cannot mine them
public static final TagKey<Block> NEEDS_COPPER_TOOL = TagKey.create(BuiltInRegistries.BLOCK.key(), ResourceLocation.fromNamespaceAndPath(MOD_ID, "needs_copper_tool"));

// This tag will be passed into our tier
public static final TagKey<Block> INCORRECT_FOR_COPPER_TOOL = TagKey.create(BuiltInRegistries.BLOCK.key(), ResourceLocation.fromNamespaceAndPath(MOD_ID, "incorrect_for_cooper_tool"));
```

然后，我们填充这个标签。例如，让我们使铜工具能够挖掘金矿石、金块和红石矿石，但不能挖掘钻石或绿宝石。（红石块本来就能用石制工具挖掘。）标签文件位于 `src/main/resources/data/mod_id/tags/block/needs_copper_tool.json`（其中 `mod_id` 是你的 mod id）：

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

接着，为了得到要传入层级的标签，我们可以设置一个否定约束：对于所有对石制工具而言是错误的、但又落在我们铜制工具标签之内的方块进行处理。标签文件位于 `src/main/resources/data/mod_id/tags/block/incorrect_for_cooper_tool.json`：

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

最后，我们就可以像上文那样，将我们的标签传入层级的创建过程。

如果你想检查某个工具是否能让某个方块状态掉落其方块，请调用 `Tool#isCorrectForDrops`。 `Tool` 可以通过以 `DataComponents#TOOL` 调用 `ItemStack#get` 获得。

## 自定义工具 {#custom-tools}

自定义工具可以通过 `Item.Properties#component` 向物品的默认组件列表中添加一个 `Tool` [数据组件][datacomponents]（借助 `DataComponents#TOOL`）来创建。 `DiggerItem` 就是这样一种实现，如上文所述，它接收一个 `Tier` 来构造 `Tool`。 `DiggerItem` 还提供了一个名为 `#createAttributes` 的便捷方法，可供 `Item.Properties#attributes` 使用，用于设置工具经修改后的攻击伤害和攻击速度等属性。

一个 `Tool` 包含一组 `Tool.Rule`、持握工具时的默认挖掘速度（默认为 `1`），以及挖掘方块时工具应承受的损耗量（默认为 `1`）。一条 `Tool.Rule` 包含三部分信息：一个用于套用该规则的方块 `HolderSet`、一个可选的挖掘集合内方块的速度，以及一个可选的布尔值，用于决定这些方块能否从此工具掉落。如果这些可选项未设置，则会检查其他规则。当所有规则都不匹配时的默认行为是使用默认挖掘速度，且方块不会掉落。

:::note
`HolderSet` 可以通过 `Registry#getOrCreateTag` 从 `TagKey` 创建。
:::

创建一个类似多功能工具的物品（即将两种或更多工具合而为一的物品，例如把斧和镐合为一件物品），或任何类工具的物品，都无需继承任何现有的 `TieredItem`。它可以简单地通过组合以下几个部分来实现：

- 通过 `Item.Properties#component` 设置 `DataComponents#TOOL`，添加一个带有你自己规则的 `Tool`。
- 通过 `Item.Properties#attributes` 为物品添加属性（例如攻击伤害、攻击速度）。
- 重写 `IItemExtension#canPerformAction`，以决定该物品能执行哪些 [`ItemAbility`][itemability]。
- 如果你希望物品在右键点击时根据 `ItemAbility` 修改方块状态，则调用 `IBlockExtension#getToolModifiedState`。
- 将你的工具添加到某些 `minecraft:enchantable/*` 标签中，以便你的物品可以被施加特定的附魔。

## `ItemAbility` {#itemabilitys}

`ItemAbility` 是对某个物品能做什么、不能做什么的一层抽象。它同时涵盖左键点击和右键点击的行为。 NeoForge 在 `ItemAbilities` 类中提供了一些默认的 `ItemAbility`：

- 挖掘能力。这些能力存在于上文提到的全部四种 `DiggerItem` 类型，以及剑和剪刀的挖掘。
- 斧的右键点击能力：剥皮（原木）、刮除（氧化的铜）和去蜡（涂蜡的铜）。
- 剪刀能力：收获（蜂巢）、雕刻（南瓜）和拆除（绊线）。
- 用于锹平整（土径）、剑横扫、锄耕地、盾牌格挡和钓鱼竿抛竿的能力。

要创建自己的 `ItemAbility`，请使用 `ItemAbility#get`——如有需要，它会创建一个新的 `ItemAbility`。然后，在自定义的工具类型中，按需重写 `IItemExtension#canPerformAction`。

要查询某个 `ItemStack` 能否执行特定的 `ItemAbility`，请调用 `IItemStackExtension#canPerformAction`。注意，这适用于任何 `Item`，而不仅仅是工具。

## 盔甲 {#armor}

与工具类似，盔甲也使用一套层级系统（尽管是不同的一套）。对工具而言称为 `Tier` 的东西，对盔甲而言称为 `ArmorMaterial`。与上文一样，本示例展示如何添加铜制盔甲；可按需改编。不过，与 `Tier` 不同的是，`ArmorMaterial` 需要被[注册][registered]。原版的数值可查看 `ArmorMaterials` 类。

```java
// ARMOR_MATERIALS is a DeferredRegister<ArmorMaterial>

// We place copper somewhere between chainmail and iron.
public static final Holder<ArmorMaterial> COPPER_ARMOR_MATERIAL =
    ARMOR_MATERIALS.register("copper", () -> new ArmorMaterial(
        // Determines the defense value of this armor material, depending on what armor piece it is.
        Util.make(new EnumMap<>(ArmorItem.Type.class), map -> {
            map.put(ArmorItem.Type.BOOTS, 2);
            map.put(ArmorItem.Type.LEGGINGS, 4);
            map.put(ArmorItem.Type.CHESTPLATE, 6);
            map.put(ArmorItem.Type.HELMET, 2);
            map.put(ArmorItem.Type.BODY, 4);
        }),
        // Determines the enchantability of the tier. This represents how good the enchantments on this armor will be.
        // Gold uses 25, we put copper slightly below that.
        20,
        // Determines the sound played when equipping this armor.
        // This is wrapped with a Holder.
        SoundEvents.ARMOR_EQUIP_GENERIC,
        // Determines the repair item for this armor.
        () -> Ingredient.of(Tags.Items.INGOTS_COPPER),
        // Determines the texture locations of the armor to apply when rendering
        // This can also be specified by overriding 'IItemExtension#getArmorTexture' on your item if the armor texture needs to be more dynamic
        List.of(
            // Creates a new armor texture that will be located at:
            // - 'assets/mod_id/textures/models/armor/copper_layer_1.png' for the outer texture
            // - 'assets/mod_id/textures/models/armor/copper_layer_2.png' for the inner texture (only legs)
            new ArmorMaterial.Layer(
                ResourceLocation.fromNamespaceAndPath(MOD_ID, "copper")
            ),
            // Creates a new armor texture that will be rendered on top of the previous at:
            // - 'assets/mod_id/textures/models/armor/copper_layer_1_overlay.png' for the outer texture
            // - 'assets/mod_id/textures/models/armor/copper_layer_2_overlay.png' for the inner texture (only legs)
            // 'true' means that the armor material is dyeable; however, the item must also be added to the 'minecraft:dyeable' tag
            new ArmorMaterial.Layer(
                ResourceLocation.fromNamespaceAndPath(MOD_ID, "copper"), "_overlay", true
            )
        ),
        // Returns the toughness value of the armor. The toughness value is an additional value included in
        // damage calculation, for more information, refer to the Minecraft Wiki's article on armor mechanics:
        // https://minecraft.wiki/w/Armor#Armor_toughness
        // Only diamond and netherite have values greater than 0 here, so we just return 0.
        0,
        // Returns the knockback resistance value of the armor. While wearing this armor, the player is
        // immune to knockback to some degree. If the player has a total knockback resistance value of 1 or greater
        // from all armor pieces combined, they will not take any knockback at all.
        // Only netherite has values greater than 0 here, so we just return 0.
        0
    ));
```

然后，我们在物品注册中使用这个盔甲材料。

```java
//ITEMS is a DeferredRegister<Item>
public static final Supplier<ArmorItem> COPPER_HELMET = ITEMS.register("copper_helmet", () -> new ArmorItem(
        // The armor material to use.
        COPPER_ARMOR_MATERIAL,
        // The armor type to use.
        ArmorItem.Type.HELMET,
        // The item properties where we set the durability.
        // ArmorItem.Type is an enum of five values: HELMET, CHESTPLATE, LEGGINGS, BOOTS, and BODY.
        // BODY is used for non-player entities like wolves or horses.
        // 原版 armor materials determine this by using a base value and multiplying it with a type-specific constant.
        // The constants are 13 for BOOTS, 15 for LEGGINGS, 16 for CHESTPLATE, 11 for HELMET, and 16 for BODY.
        // If we don't want to use these ratios, we can set the durability normally.
        new Item.Properties().durability(ArmorItem.Type.HELMET.getDurability(15))
));
public static final Supplier<ArmorItem> COPPER_CHESTPLATE = ITEMS.register("copper_chestplate", () -> new ArmorItem(...));
public static final Supplier<ArmorItem> COPPER_LEGGINGS = ITEMS.register("copper_leggings", () -> new ArmorItem(...));
public static final Supplier<ArmorItem> COPPER_BOOTS = ITEMS.register("copper_boots", () -> new ArmorItem(...));
```

在制作盔甲纹理时，最好在原版盔甲纹理的基础上进行绘制，以便看清每个部分对应的位置。

[block]: ../blocks/index.md
[datacomponents]: ./datacomponents.md
[item]: index.md
[itemability]: #itemabilitys
[tags]: ../resources/server/tags.md
[registered]: ../concepts/registries.md#methods-for-registering

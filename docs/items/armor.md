---
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 盔甲 {#armor}

盔甲是主要用途为借助各种抗性与效果保护[`LivingEntity`][livingentity]免受伤害的[物品][item]。许多 Mod 会添加新的盔甲套装（例如铜制盔甲）。

## 自定义盔甲套装 {#custom-armor-sets}

一套用于类人实体的盔甲通常由四件物品组成：护头的头盔、护胸的胸甲、护腿的护腿和护脚的靴子。此外还有专为狼、马和羊驼准备的盔甲，它们被装备到专供动物使用的“身体”盔甲槽位上。所有这些物品一般都通过七个[数据组件][datacomponents]来实现：

- `DataComponents#MAX_DAMAGE` 和 `#DAMAGE`，用于耐久度
- `#MAX_STACK_SIZE`，用于将堆叠数量设为 `1`
- `#REPAIRABLE`，用于在铁砧中修复盔甲件
- `#ENCHANTABLE`，用于最大[附魔][enchantment]值
- `#ATTRIBUTE_MODIFIERS`，用于护甲、护甲韧性和击退抗性
- `#EQUIPPABLE`，用于规定实体如何装备该物品。

通常，每件盔甲都通过 `Item.Properties#humanoidArmor`（用于类人实体）、`wolfArmor`（用于狼）、`horseArmor`（用于马）和 `nautilusArmor`（用于鹦鹉螺）来设置。它们都使用 `ArmorMaterial`，并对类人实体结合 `ArmorType` 来设置组件。参考数值可在 `ArmorMaterials` 中找到。本示例使用一种铜制盔甲材料，你可以按需调整其数值。

```java
// The resource key of the equipment asset used to link
// the `EquipmentClientInfo` JSON discussed below.
// Points to assets/examplemod/equipment/copper.json
public static final ResourceKey<EquipmentAsset> COPPER_ASSET = ResourceKey.create(EquipmentAssets.ROOT_ID, Identifier.fromNamespaceAndPath("examplemod", "copper"));

public static final ArmorMaterial COPPER_ARMOR_MATERIAL = new ArmorMaterial(
    // The durability multiplier of the armor material.
    // ArmorType have different unit durabilities that the multiplier is applied to:
    // - HELMET: 11
    // - CHESTPLATE: 16
    // - LEGGINGS: 15
    // - BOOTS: 13
    // - BODY: 16
    15,
    // Determines the defense value (or the number of half-armors on the bar).
    // Based on ArmorType.
    Util.make(new EnumMap<>(ArmorType.class), map -> {
        map.put(ArmorItem.Type.BOOTS, 2);
        map.put(ArmorItem.Type.LEGGINGS, 4);
        map.put(ArmorItem.Type.CHESTPLATE, 6);
        map.put(ArmorItem.Type.HELMET, 2);
        map.put(ArmorItem.Type.BODY, 4);
    }),
    // Determines the enchantability of the armor. This represents how good the enchantments on this armor will be.
    // Gold uses 25; we put copper slightly below that.
    20,
    // Determines the sound played when equipping this armor.
    // This is wrapped with a Holder.
    SoundEvents.ARMOR_EQUIP_GENERIC,
     // Returns the toughness value of the armor. The toughness value is an additional value included in
    // damage calculation, for more information, refer to the Minecraft Wiki's article on armor mechanics:
    // https://minecraft.wiki/w/Armor#Armor_toughness
    // Only diamond and netherite have values greater than 0 here, so we just return 0.
    0,
    // Returns the knockback resistance value of the armor. While wearing this armor, the player is
    // immune to knockback to some degree. If the player has a total knockback resistance value of 1 or greater
    // from all armor pieces combined, they will not take any knockback at all.
    // Only netherite has values greater than 0 here, so we just return 0.
    0,
    // The tag that determines what items can repair this armor.
    Tags.Items.INGOTS_COPPER,
    // The resource key of the EquipmentClientInfo JSON discussed below.
    COPPER_ASSET
);
```

现在我们有了 `ArmorMaterial`，就可以用它来[注册][registering]盔甲了：

```java
// ITEMS is a DeferredRegister.Items
public static final DeferredItem<Item> COPPER_HELMET = ITEMS.registerItem(
    "copper_helmet",
    props -> new Item(
        props.humanoidArmor(
            // The material to use.
            COPPER_ARMOR_MATERIAL,
            // The type of armor to create.
            ArmorType.HELMET
        )
    )
);

public static final DeferredItem<Item> COPPER_CHESTPLATE =
    ITEMS.registerItem("copper_chestplate", props -> new Item(props.humanoidArmor(...)));
public static final DeferredItem<Item> COPPER_LEGGINGS =
    ITEMS.registerItem("copper_chestplate", props -> new Item(props.humanoidArmor(...)));
public static final DeferredItem<Item> COPPER_BOOTS =
    ITEMS.registerItem("copper_chestplate", props -> new Item(props.humanoidArmor(...)));

public static final DeferredItem<Item> COPPER_WOLF_ARMOR = ITEMS.registerItem(
    "copper_wolf_armor",
    props -> new Item(
        // The material to use.
        props.wolfArmor(COPPER_ARMOR_MATERIAL)
    )
);

public static final DeferredItem<Item> COPPER_HORSE_ARMOR =
    ITEMS.registerItem("copper_horse_armor", props -> new Item(props.horseArmor(...)));

public static final DeferredItem<Item> COPPER_NAUTILUS_ARMOR =
    ITEMS.registerItem("copper_nautilus_armor", props -> new Item(props.nautilusArmor(...)));
```

如果你想从零开始创建盔甲或类盔甲的物品，可以通过以下各部分的组合来实现：

- 通过 `Item.Properties#component` 设置 `DataComponents#EQUIPPABLE`，添加一个带有你自己要求的 `Equippable`。
- 通过 `Item.Properties#attributes` 为物品添加属性（例如护甲、韧性、击退）。
- 通过 `Item.Properties#durability` 为物品添加耐久度。
- 通过 `Item.Properties#repariable` 允许物品被修复。
- 通过 `Item.Properties#enchantable` 允许物品被附魔。
- 将你的盔甲加入某些 `minecraft:enchantable/*` `ItemTags`，以便物品能被施加某些附魔。

### `Equippable` {#equippable}

`Equippable` 是一个数据组件，包含实体如何装备该物品，以及在游戏中如何处理其渲染。这使得任何物品，无论是否被视作“盔甲”，只要拥有此组件即可被装备（例如鞍、羊驼身上的地毯）。每个带有此组件的物品只能装备到单一的 `EquipmentSlot`。

`Equippable` 既可以通过直接调用 record 构造函数创建，也可以通过 `Equippable#builder` 创建（它会为每个字段设置默认值），并在完成后跟上一次 `build`：

```java
// The resource key of the equipment asset used to link
// the `EquipmentClientInfo` JSON discussed below.
// Points to assets/examplemod/equipment/equippable.json
public static final ResourceKey<EquipmentAsset> EXAMPLE_EQUIPABBLE = ResourceKey.create(EquipmentAssets.ROOT_ID, Identifier.fromNamespaceAndPath("examplemod", "equippable"));

// Assume there is some DeferredRegister.Items ITEMS
public static final DeferredItem<Item> EQUIPPABLE = ITEMS.registerSimpleItem(
    "equippable",
    props -> props.component(
        DataComponents.EQUIPPABLE,
        // Sets the slot that this item can be equipped to.
        Equippable.builder(EquipmentSlot.HELMET)
            // Determines the sound played when equipping this item.
            // This is wrapped with a Holder.
            // Defaults to SoundEvents#ARMOR_EQUIP_GENERIC.
            .setEquipSound(SoundEvents.ARMOR_EQUIP_GENERIC)
            // The resource key of the EquipmentClientInfo JSON discussed below.
            // When not set, does not render the equipment.
            .setAsset(ResourceKey.create(EXAMPLE_EQUIPABBLE))
            // The relative location of the texture to overlay on the player screen when wearing (e.g., pumpkin blur).
            // Points to assets/examplemod/textures/equippable.png
            // When not set, does not render an overlay.
            .setCameraOverlay(Identifier.withDefaultNamespace("examplemod", "equippable"))
            // A HolderSet of entity types (direct or tag) that can equip this item.
            // When not set, any entity can equip this item.
            .setAllowedEntities(EntityType.ZOMBIE)
            // Whether the item can be equipped when dispensed from a dispenser.
            // Defaults to true.
            .setDispensable(true),
            // Whether the item can be swapped off the player during a quick equip.
            // Defaults to true.
            .setSwappable(false),
            // Whether the item should be damaged when attacked (for equipment typically).
            // Must also be a damageable item.
            // Defaults to true.
            .setDamageOnHurt(false)
            // Whether the item can be equipped onto another entity on interaction (e.g., right click).
            // Defaults to false.
            .setEquipOnInteract(true)
            // When true, an item with the SHEAR_REMOVE_ARMOR item ability can remove the equipped item.
            // Defaults to false.
            .setCanBeSheared(true)
            // The sound to play when shearing this equipped item.
            // This is wrapped with a holder.
            // Defaults to SoundEvents#SHEARS_SNIP.
            .setShearingSound(SoundEvents.SADDLE_UNEQUIP)
            .build()
    )
);
```

## 装备资产 {#equipment-assets}

现在我们在游戏里有了一些盔甲，但如果尝试穿上它，什么都不会渲染出来，因为我们从未指定过如何渲染这件装备。为此，我们需要在 `Equippable#assetId` 指定的位置创建一个 `EquipmentClientInfo` JSON，该位置相对于[资源包][respack]（`assets` 文件夹）的 `equipment` 文件夹。`EquipmentClientInfo` 指定了每一层渲染时所使用的关联纹理。

`EquipmentClientInfo` 在功能上是一个从 `EquipmentClientInfo.LayerType` 到要应用的 `EquipmentClientInfo.Layer` 列表的映射。

`LayerType` 可以理解为在某个实例中要渲染的一组纹理。例如，`LayerType#HUMANOID` 被 `HumanoidArmorLayer` 用于渲染类人实体的头、胸和脚；`LayerType#WOLF_BODY` 被 `WolfArmorLayer` 用于渲染身体盔甲。如果它们属于同一类型的可装备物品（例如铜制盔甲），则可以合并到一个装备信息 JSON 中。

`LayerType` 映射到某个 `Layer` 列表，并按提供的顺序应用和渲染这些纹理。一个 `Layer` 实际上表示要渲染的单个纹理。第一个参数表示纹理的位置，相对于 `textures/entity/equipment`。

第二个参数是一个 optional，作为 `EquipmentClientInfo.Dyeable` 指示该[纹理是否可被染色][tinting]。`Dyeable` 对象持有一个整数，当其存在时，表示用于给纹理染色的默认 RGB 颜色。如果此 optional 不存在，则使用纯白色。

:::warning
若要为物品应用除未染色颜色之外的染色，该物品必须位于 [`ItemTags#DYEABLE`][tag] 中，并且其 `DataComponents#DYED_COLOR` 组件被设为某个 RGB 值。
:::

第三个参数是一个布尔值，指示在渲染期间应使用所提供的纹理，而非 `Layer` 中定义的纹理。这方面的一个例子是玩家的自定义披风或自定义鞘翅纹理。

让我们为铜制盔甲材料创建一个装备信息。我们还假设每一层都有两个纹理：一个用于实际的盔甲，另一个用于叠加并染色。对于动物盔甲，我们假设有某个可以传入的动态纹理会被使用。

<Tabs>
<TabItem value="json" label="JSON" default>

```json5
// In assets/examplemod/equipment/copper.json
{
    // The layer map
    "layers": {
        // The serialized name of the EquipmentClientInfo.LayerType to apply.
        // For humanoid head, chest, and feet
        "humanoid": [
            // A list of layers to render in the order provided
            {
                // The relative texture of the armor
                // Points to assets/examplemod/textures/entity/equipment/humanoid/copper/outer.png
                "texture": "examplemod:copper/outer"
            },
            {
                // The overlay texture
                // Points to assets/examplemod/textures/entity/equipment/humanoid/copper/outer_overlay.png
                "texture": "examplemod:copper/outer_overlay",
                // When specified, allows the texture to be tinted the color in DataComponents#DYED_COLOR
                // Otherwise, cannot be tinted
                "dyeable": {
                    // An RGB value (always opaque color)
                    // 0x7683DE as decimal
                    // When not specified, set to 0 (meaning transparent or invisible)
                    "color_when_undyed": 7767006
                }
            }
        ],
        // For humanoid legs
        "humanoid_leggings": [
            {
                // Points to assets/examplemod/textures/entity/equipment/humanoid_leggings/copper/inner.png
                "texture": "examplemod:copper/inner"
            },
            {
                // Points to assets/examplemod/textures/entity/equipment/humanoid_leggings/copper/inner_overlay.png
                "texture": "examplemod:copper/inner_overlay",
                "dyeable": {
                    "color_when_undyed": 7767006
                }
            }
        ],
        // For wolf armor
        "wolf_body": [
            {
                // Points to assets/examplemod/textures/entity/equipment/wolf_body/copper/wolf.png
                "texture": "examplemod:copper/wolf",
                // When true, uses the texture passed into the layer renderer instead
                "use_player_texture": true
            }
        ],
        // For horse armor
        "horse_body": [
            {
                // Points to assets/examplemod/textures/entity/equipment/horse_body/copper/horse.png
                "texture": "examplemod:copper/horse",
                "use_player_texture": true
            }
        ],
        // For nautilus armor
        "nautilus_body": [
            {
                // Points to assets/examplemod/textures/entity/equipment/nautilus_body/copper/nautilus.png
                "texture": "examplemod:copper/nautilus",
                "use_player_texture": true
            }
        ]
    }
}
```

</TabItem>

<TabItem value="datagen" label="Datagen">

```java
public class MyEquipmentInfoProvider extends EquipmentAssetProvider {

    public MyEquipmentInfoProvider(PackOutput output) {
        super(output);
    }

    @Override
    protected void registerModels(BiConsumer<ResourceKey<EquipmentAsset>, EquipmentClientInfo> output) {
        output.accept(
            // Must match Equippable#assetId
            COPPER_ASSET,
            EquipmentClientInfo.builder()
                // For humanoid head, chest, and feet
                .addLayers(
                    EquipmentClientInfo.LayerType.HUMANOID,
                    // Base texture
                    new EquipmentClientInfo.Layer(
                        // The relative texture of the armor
                        // Points to assets/examplemod/textures/entity/equipment/humanoid/copper/outer.png
                        Identifier.fromNamespaceAndPath("examplemod", "copper/outer"),
                        Optional.empty(),
                        false
                    ),
                    // Overlay texture
                    new EquipmentClientInfo.Layer(
                        // The overlay texture
                        // Points to assets/examplemod/textures/entity/equipment/humanoid/copper/outer_overlay.png
                        Identifier.fromNamespaceAndPath("examplemod", "copper/outer_overlay"),
                        // An RGB value (always opaque color)
                        // When not specified, set to 0 (meaning transparent or invisible)
                        Optional.of(new EquipmentClientInfo.Dyeable(Optional.of(0x7683DE))),
                        false
                    )
                )
                // For humanoid legs
                .addLayers(
                    EquipmentClientInfo.LayerType.HUMANOID_LEGGINGS,
                    new EquipmentClientInfo.Layer(
                        // Points to assets/examplemod/textures/entity/equipment/humanoid_leggings/copper/inner.png
                        Identifier.fromNamespaceAndPath("examplemod", "copper/inner"),
                        Optional.empty(),
                        false
                    ),
                    new EquipmentClientInfo.Layer(
                        // Points to assets/examplemod/textures/entity/equipment/humanoid_leggings/copper/inner_overlay.png
                        Identifier.fromNamespaceAndPath("examplemod", "copper/inner_overlay"),
                        Optional.of(new EquipmentClientInfo.Dyeable(Optional.of(0x7683DE))),
                        false
                    )
                )
                // For wolf armor
                .addLayers(
                    EquipmentClientInfo.LayerType.WOLF_BODY,
                    // Base texture
                    new EquipmentClientInfo.Layer(
                        // Points to assets/examplemod/textures/entity/equipment/wolf_body/copper/wolf.png
                        Identifier.fromNamespaceAndPath("examplemod", "copper/wolf"),
                        Optional.empty(),
                        // When true, uses the texture passed into the layer renderer instead
                        true
                    )
                )
                // For horse armor
                .addLayers(
                    EquipmentClientInfo.LayerType.HORSE_BODY,
                    // Base texture
                    new EquipmentClientInfo.Layer(
                        // Points to assets/examplemod/textures/entity/equipment/horse_body/copper/horse.png
                        Identifier.fromNamespaceAndPath("examplemod", "copper/horse"),
                        Optional.empty(),
                        true
                    )
                )
                // For nautilus armor
                .addLayers(
                    EquipmentClientInfo.LayerType.NAUTILUS_BODY,
                    // Base texture
                    new EquipmentClientInfo.Layer(
                        // Points to assets/examplemod/textures/entity/equipment/nautilus_body/copper/nautilus.png
                        Identifier.fromNamespaceAndPath("examplemod", "copper/nautilus"),
                        Optional.empty(),
                        true
                    )
                )
                .build()
        );
    }
}

@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createProvider(MyEquipmentInfoProvider::new);
}
```

</TabItem>
</Tabs>

## 装备渲染 {#equipment-rendering}

装备信息通过 `EquipmentLayerRenderer` 在 `EntityRenderer` 或其某个 `RenderLayer` 的渲染函数中进行渲染。`EquipmentLayerRenderer` 作为渲染上下文的一部分，通过 `EntityRendererProvider.Context#getEquipmentRenderer` 获取。如果需要 `EquipmentClientInfo`，它们也可通过 `EntityRendererProvider.Context#getEquipmentAssets` 获取。

默认情况下，以下各层渲染其关联的 `EquipmentClientInfo.LayerType`：

| `LayerType`             | `RenderLayer`          | 使用者                                                          |
|:-----------------------:|:----------------------:|:---------------------------------------------------------------|
| `HUMANOID`              | `HumanoidArmorLayer`   | 玩家、类人生物（例如僵尸、骷髅）、盔甲架                        |
| `HUMANOID_LEGGINGS`     | `HumanoidArmorLayer`   | 玩家、类人生物（例如僵尸、骷髅）、盔甲架                        |
| `HUMANOID_BABY`         | `HumanoidArmorLayer`   | 玩家、幼年类人生物（例如幼年僵尸）                              |
| `WINGS`                 | `WingsLayer`           | 玩家、类人生物（例如僵尸、骷髅）、盔甲架                        |
| `WOLF_BODY`             | `WolfArmorLayer`       | 狼                                                             |
| `HORSE_BODY`            | `HorseArmorLayer`      | 马                                                             |
| `LLAMA_BODY`            | `LlamaDecorLayer`      | 羊驼、行商羊驼                                                 |
| `PIG_SADDLE`            | `SimpleEquipmentLayer` | 猪                                                             |
| `STRIDER_SADDLE`        | `SimpleEquipmentLayer` | 炽足兽                                                         |
| `CAMEL_SADDLE`          | `SimpleEquipmentLayer` | 骆驼                                                           |
| `CAMEL_HUSK_SADDLE`     | `SimpleEquipmentLayer` | 骆驼壳                                                         |
| `HORSE_SADDLE`          | `SimpleEquipmentLayer` | 马                                                             |
| `DONKEY_SADDLE`         | `SimpleEquipmentLayer` | 驴                                                             |
| `MULE_SADDLE`           | `SimpleEquipmentLayer` | 骡                                                             |
| `ZOMBIE_HORSE_SADDLE`   | `SimpleEquipmentLayer` | 僵尸马                                                         |
| `SKELETON_HORSE_SADDLE` | `SimpleEquipmentLayer` | 骷髅马                                                         |
| `HAPPY_GHAST_BODY`      | `SimpleEquipmentLayer` | 快乐恶魂                                                       |
| `NAUTILUS_SADDLE`       | `SimpleEquipmentLayer` | 鹦鹉螺                                                         |
| `NAUTILUS_BODY`         | `SimpleEquipmentLayer` | 鹦鹉螺                                                         |

`EquipmentLayerRenderer` 只有一个用于提交装备层进行渲染的方法：`renderLayers`。

```java
// In some render method where EquipmentLayerRenderer equipmentLayerRenderer is available
this.equipmentLayerRenderer.renderLayers(
    // The layer type to render
    EquipmentClientInfo.LayerType.HUMANOID,
    // The resource key representing the EquipmentClientInfo JSON
    // This would be set in the `EQUIPPABLE` data component via `assetId`
    stack.get(DataComponents.EQUIPPABLE).assetId().orElseThrow(),
    // The model to apply the equipment info to
    // These are usually separate models from the entity model
    // and are separate ModelLayers linking to a LayerDefinition
    model,
    // The item stack representing the item being rendered as a model
    // This is only used to get the dyeable, foil, and armor trim information
    stack,
    // The pose stack used to render the model in the correct location
    poseStack,
    // The collector to submit the model data to
    collector,
    // The packed light coordinates
    lightCoords,
    // An absolute path of the texture to render when use_player_texture is true for one of the layer if not null
    // Represents an absolute location within the assets folder
    Identifier.fromNamespaceAndPath("examplemod", "textures/other_texture.png"),
    // The color of the model outline
    // Only used if the outline color is not 0 and the `RenderType` has or is an outline type
    outlineColor,
    // The starting order priority to submit the layers and trims, ticking up with each model submitted
    // By default, this is 1
    order
);
```

[item]: index.md
[datacomponents]: datacomponents.md
[enchantment]: ../resources/server/enchantments/index.md#enchantment-costs-and-levels
[livingentity]: ../entities/livingentity.md
[registering]: ../concepts/registries.md#methods-for-registering
[rendering]: #equipment-rendering
[respack]: ../resources/index.md#assets
[tag]: ../resources/server/tags.md
[tinting]: ../resources/client/models/index.md#tinting

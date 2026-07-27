import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 内置附魔效果组件 {#built-in-enchantment-effect-components}

原版 Minecraft 提供了众多不同类型的附魔效果组件，供[附魔][enchantment]定义使用。本文将逐一介绍它们，包括其用法与代码内定义。

## 数值效果组件 {#value-effect-components}

_另见 Minecraft Wiki 上的 [Value Effect Components]_

数值效果组件用于那些会改变游戏中某个数值的附魔，由类 `EnchantmentValueEffect` 实现。如果某个数值被不止一个数值效果组件改变（例如被多个附魔改变），则它们的效果都会生效。

数值效果组件可以设置为对其给定的数值使用以下任意一种运算：
- `minecraft:set`：覆盖给定的基于等级的值。
- `minecraft:add`：将指定的基于等级的值加到原值上。
- `minecraft:multiply`：将指定的基于等级的系数与原值相乘。
- `minecraft:remove_binomial`：使用二项分布对给定的（基于等级的）几率进行抽样。若命中，则从值中减去 1。注意许多值实际上是标志位，在 1 时完全开启，在 0 时完全关闭。
- `minecraft:all_of`：接受一个由其他数值效果组成的列表，并按所述顺序应用它们。

锋利（Sharpness）附魔使用数值效果组件 `minecraft:damage` 来实现其效果，如下所示：

<Tabs>
<TabItem value="sharpness.json" label="JSON">

```json5
"effects": {
    // The type of this effect component is "minecraft:damage".
    // This means that the effect will modify weapon damage.
    // See below for a list of more effect component types.
    "minecraft:damage": [
        {
            // A value effect that should be applied.
            // In this case, since there's only one, this value effect is just named "effect".
            "effect": {
                // The type of value effect to use. In this case, it is "minecraft:add", so the value (given below) will be added 
                // to the weapon damage value.
                "type": "minecraft:add",

                // The value block. In this case, the value is a LevelBasedValue that starts at 1 and increases by 0.5 every enchantment level.
                "value": {
                    "type": "minecraft:linear",
                    "base": 1.0,
                    "per_level_above_first": 0.5
                }
            }
        }
    ]
}
```

</TabItem>
<TabItem value="sharpness.datagen" label="Datagen">

```java
// Passed into 'effects' in an Enchantment during data generation
// See the Data Generation section of the Enchantments entry to learn more
DataComponentMap.builder().set(
    // Selects the "minecraft:damage" component.
    EnchantmentEffectComponents.DAMAGE,

    // Constructs a list of one conditional AddValue without any requirements.
    List.of(new ConditionalEffect<>(
        new AddValue(LevelBasedValue.perLevel(1.0F, 0.5F)),
        Optional.empty()))
).build()
```

</TabItem>
</Tabs>

`value` 块内的对象是一个 [LevelBasedValue]，它可用于让数值效果组件的效果强度随等级变化。

`EnchantmentValueEffect#process` 方法可用于根据所提供的数值运算来调整数值，如下所示：

```java
// `valueEffect` is an EnchantmentValueEffect instance.
// `enchantLevel` is an integer representing the level of the enchantment
float baseValue = 1.0;
float modifiedValue = valueEffect.process(enchantLevel, server.random, baseValue);
```

### 原版附魔数值效果组件类型 {#vanilla-enchantment-value-effect-component-types}

#### 定义为 `DataComponentType<EnchantmentValueEffect>` {#defined-as-datacomponenttypeenchantmentvalueeffect}

- `minecraft:crossbow_charge_time`：修改这把弩的蓄力时间（以秒计）。由快速装填（Quick Charge）使用。
- `minecraft:trident_spin_attack_strength`：修改三叉戟旋转攻击的“强度”（见 `TridentItem#releaseUsing`）。由激流（Riptide）使用。

#### 定义为 `DataComponentType<List<ConditionalEffect<EnchantmentValueEffect>>>` {#defined-as-datacomponenttypelistconditionaleffectenchantmentvalueeffect}

护甲相关：
- `minecraft:armor_effectiveness`：决定护甲对这件武器的有效程度，范围从 0（无防护）到 1（正常防护）。由破甲（Breach）使用。
- `minecraft:damage_protection`：每“点”减伤可将持有此物品时受到的伤害减少 4%，最多减少 80%。由爆炸保护、摔落缓冲、火焰保护、保护和弹射物保护使用。

攻击相关：
- `minecraft:damage`：修改使用这件武器时的攻击伤害。由锋利、穿刺、节肢杀手、力量和亡灵杀手使用。
- `minecraft:smash_damage_per_fallen_block`：为重锤按下落的每个方块增加伤害。由致密（Density）使用。
- `minecraft:knockback`：修改持有这件武器时造成的击退量，以游戏单位计。由击退和冲击使用。
- `minecraft:mob_experience`：修改击杀生物所获得的经验量。未使用。

耐久相关：
- `minecraft:item_damage`：修改物品受到的耐久损耗。低于 1 的值作为物品受损的几率。由耐久（Unbreaking）使用。
- `minecraft:repair_with_xp`：使物品能够利用获得的经验修复自身，并决定其修复效率。由经验修补（Mending）使用。

弹射物相关：
- `minecraft:ammo_use`：修改发射弓或弩时消耗的弹药量。该值会被钳制为整数，因此低于 1 的值将导致消耗 0 弹药。由无限（Infinity）使用。
- `minecraft:projectile_piercing`：修改这件武器发射的弹射物所能穿透的实体数量。由穿透（Piercing）使用。
- `minecraft:projectile_count`：修改射出这把弓时生成的弹射物数量。由多重射击（Multishot）使用。
- `minecraft:projectile_spread`：修改弹射物相对于发射方向的最大散布角度（以度计）。由多重射击（Multishot）使用。
- `minecraft:trident_return_acceleration`：使三叉戟返回其拥有者，并修改返回过程中施加于三叉戟的加速度。由忠诚（Loyalty）使用。

其他：
- `minecraft:block_experience`：修改破坏方块所获得的经验量。由精准采集（Silk Touch）使用。
- `minecraft:fishing_time_reduction`：将使用这根钓竿钓鱼时浮漂下沉所需的时间减少给定的秒数。由诱饵（Lure）使用。
- `minecraft:fishing_luck_bonus`：修改钓鱼战利品表中使用的[幸运][luck]值。由海之眷顾（Luck of the Sea）使用。

#### 定义为 `DataComponentType<List<TargetedConditionalEffect<EnchantmentValueEffect>>>` {#defined-as-datacomponenttypelisttargetedconditionaleffectenchantmentvalueeffect}

- `minecraft:equipment_drops`：修改被这件武器击杀的实体掉落装备的几率。由抢夺（Looting）使用。

## 基于位置的效果组件 {#location-based-effect-components}

_另见 Minecraft Wiki 上的 [Location Based Effect Components]_

基于位置的效果组件是实现了 `EnchantmentLocationBasedEffect` 的组件。这些组件定义了需要知道附魔持有者在世界中所处位置才能执行的动作。它们通过两个主要方法运作：`EnchantmentEntityEffect#onChangedBlock`，在附魔物品被装备时以及持有者改变其 `BlockPos` 时调用；以及 `onDeactivate`，在附魔物品被移除时调用。

下面这个示例使用 `minecraft:attributes` 基于位置的效果组件类型来改变持有者的实体大小：

<Tabs>
<TabItem value="attribute.json" label="JSON">

```json5
// The type is "minecraft:attributes" (described below).
// In a nutshell, this applies an attribute modifier.
"minecraft:attributes": [
    {
        // This "amount" block is a LevelBasedValue.
        "amount": {
            "type": "minecraft:linear",
            "base": 1,
            "per_level_above_first": 1
        },

        // Which attribute to modify. In this case, modifies "minecraft:scale"
        "attribute": "minecraft:generic.scale",
        // The unique identifier for this attribute modifier. Should not overlap with others, but doesn't need to be registered.
        "id": "examplemod:enchantment.size_change",
        // What operation to use on the attribute. Can be "add_value", "add_multiplied_base", or "add_multiplied_total".
        "operation": "add_value"
    }
],
```

</TabItem>
<TabItem value="attribute.datagen" label="Datagen">

```java
// Passed into the effects of an Enchantment during data generation
DataComponentMap.builder().set(
    // Specifies the "minecraft:attributes" component type.
    EnchantmentEffectComponents.ATTRIBUTES,

    // This component takes a list of these EnchantmentAttributeEffect objects.
    List.of(new EnchantmentAttributeEffect(
        ResourceLocation.fromNamespaceAndPath("examplemod", "enchantment.size_change"),
        Attributes.SCALE,
        LevelBasedValue.perLevel(1F, 1F),
        AttributeModifier.Operation.ADD_VALUE
    ))
).build()
```


</TabItem>
</Tabs>

原版添加了以下基于位置的事件：

- `minecraft:all_of`：按顺序运行一个实体效果列表。
- `minecraft:apply_mob_effect`：对受影响的生物施加一个[状态效果][mob effect]。
- `minecraft:attribute`：对附魔持有者施加一个[属性修饰符][attribute modifier]。
- `minecraft:damage_entity`：对受影响的实体造成伤害。在攻击情境下，这会与攻击伤害叠加。
- `minecraft:damage_item`：损耗此物品的耐久度。
- `minecraft:explode`：召唤一次爆炸。
- `minecraft:ignite`：使实体着火。
- `minecraft:play_sound`：播放指定的声音。
- `minecraft:replace_block`：替换给定偏移处的方块。
- `minecraft:replace_disk`：替换一片圆盘状的方块。
- `minecraft:run_function`：运行指定的[数据包函数][datapack function]。
- `minecraft:set_block_properies`：修改指定方块的方块状态属性。
- `minecraft:spawn_particles`：生成一个粒子。
- `minecraft:summon_entity`：召唤一个实体。

### 原版基于位置的效果组件类型 {#vanilla-location-based-effect-component-types}

#### 定义为 `DataComponentType<List<ConditionalEffect<EnchantmentLocationBasedEffect>>>` {#defined-as-datacomponenttypelistconditionaleffectenchantmentlocationbasedeffect}

- `minecraft:location_changed`：当持有者的方块位置发生变化以及此物品被装备时，运行一个基于位置的效果。由冰霜行者和灵魂疾行使用。

#### 定义为 `DataComponentType<List<EnchantmentAttributeEffect>>` {#defined-as-datacomponenttypelistenchantmentattributeeffect}

- `minecraft:attributes`：对持有者施加一个属性修饰符，并在附魔物品不再被装备时将其移除。

## 实体效果组件 {#entity-effect-components}

_另见 Minecraft Wiki 上的 [Entity Effect Components]。_

实体效果组件是实现了 `EnchantmentEntityEffect` 的组件，它是 `EnchantmentLocationBasedEffect` 的一个子类型。它们重写 `EnchantmentLocationBasedEffect#onChangedBlock` 以改为运行 `EnchantmentEntityEffect#apply`；此外，这个 `apply` 方法还会根据组件的具体类型在代码库的其他地方被直接调用。这使得效果无需等待持有者的方块位置变化即可发生。

所有类型的基于位置的效果组件也都是有效的实体效果组件类型，唯一的例外是 `minecraft:attribute`，它只被注册为基于位置的效果组件。

下面是一个此类组件的 JSON 定义示例，取自火焰附加（Fire Aspect）附魔：

<Tabs>
<TabItem value="fire.json" label="JSON">

```json5
// This component's type is "minecraft:post_attack" (see below).
"minecraft:post_attack": [
    {
        // Decides whether the "victim" of the attack, the "attacker", or the "damaging entity" (the projectile if there is one, attacker if not) recieves the effect.
        "affected": "victim",
        
        // Decides which enchantment entity effect to apply.
        "effect": {
            // The type of this effect is "minecraft:ignite".
            "type": "minecraft:ignite",
            // "minecraft:ignite" requires a LevelBasedValue as a duration for how long the entity will be ignited.
            "duration": {
                "type": "minecraft:linear",
                "base": 4.0,
                "per_level_above_first": 4.0
            }
        },

        // Decides who (the "victim", "attacker", or "damaging entity") must have the enchantment for it to take effect.
        "enchanted": "attacker",

        // An optional predicate which controls whether the effect applies.
        "requirements": {
            "condition": "minecraft:damage_source_properties",
            "predicate": {
                "is_direct": true
            }
        }
    }
]
```

</TabItem>
<TabItem value="fire.datagen" label="Datagen">

```java
// Passed into the effects of an Enchantment during data generation
DataComponentMap.builder().set(
    // Specifies the "minecraft:post_attack" component type.
    EnchantmentEffectComponents.POST_ATTACK,

    // Defines the data for this component. In this case, a list of one TargetedConditionalEffect.
    List.of(
        new TargetedConditionalEffect<>(

            // Determines the "enchanted" field.
            EnchantmentTarget.ATTACKER,

            // Determines the "affected" field.
            EnchantmentTarget.VICTIM,

            // The enchantment entity effect.
            new Ignite(LevelBasedValue.perLevel(4.0F, 4.0F)),

            // The "requirements" clause. 
            // In this case, the only optional part activated is the isDirect boolean flag.
            Optional.of(
                new DamageSourceCondition(
                    Optional.of(
                        new DamageSourcePredicate(
                            List.of(),
                            Optional.empty(),
                            Optional.empty(),
                            Optional.of(true)
                        )
                    )
                )
            )
        )
    )
).build()
```

</TabItem>
</Tabs>

这里的实体效果组件是 `minecraft:post_attack`。它的效果是 `minecraft:ignite`，由 `Ignite` record 实现。该 record 对 `EnchantmentEntityEffect#apply` 的实现会使目标实体着火。

### 原版附魔实体效果组件类型 {#vanilla-enchantment-entity-effect-component-types}

#### 定义为 `DataComponentType<List<ConditionalEffect<EnchantmentEntityEffect>>>` {#defined-as-datacomponenttypelistconditionaleffectenchantmententityeffect}

- `minecraft:hit_block`：当一个实体（例如弹射物）击中方块时运行一个实体效果。由引雷（Channeling）使用。
- `minecraft:tick`：每 tick 运行一个实体效果。由灵魂疾行（Soul Speed）使用。
- `minecraft:projectile_spawned`：在弓或弩生成弹射物实体后运行一个实体效果。由火矢（Flame）使用。

#### 定义为 `DataComponentType<List<TargetedConditionalEffect<EnchantmentEntityEffect>>>` {#defined-as-datacomponenttypelisttargetedconditionaleffectenchantmententityeffect}

- `minecraft:post_attack`：在攻击对实体造成伤害后运行一个实体效果。由节肢杀手、引雷、火焰附加、荆棘和风爆使用。

关于以上各项的更多细节，请查看[相关的 Minecraft Wiki 页面][relevant minecraft wiki page]。

## 其他原版附魔组件类型 {#other-vanilla-enchantment-component-types}

#### 定义为 `DataComponentType<List<ConditionalEffect<DamageImmunity>>>` {#defined-as-datacomponenttypelistconditionaleffectdamageimmunity}

- `minecraft:damage_immunity`：对指定的伤害类型施加免疫。由冰霜行者（Frost Walker）使用。

#### 定义为 `DataComponentType<Unit>` {#defined-as-datacomponenttypeunit}

- `minecraft:prevent_equipment_drop`：防止玩家在死亡时掉落此物品。由消失诅咒（Curse of Vanishing）使用。
- `minecraft:prevent_armor_change`：防止此物品从护甲槽位中被卸下。由绑定诅咒（Curse of Binding）使用。

#### 定义为 `DataComponentType<List<CrossbowItem.ChargingSounds>>` {#defined-as-datacomponenttypelistcrossbowitemchargingsounds}

- `minecraft:crossbow_charge_sounds`：决定为弩蓄力时发出的声音事件。每一个条目代表该附魔的一个等级。

#### 定义为 `DataComponentType<List<Holder<SoundEvent>>>` {#defined-as-datacomponenttypelistholdersoundevent}

- `minecraft:trident_sound`：决定使用三叉戟时发出的声音事件。每一个条目代表该附魔的一个等级。

[enchantment]: index.md
[Value Effect Components]: https://minecraft.wiki/w/Enchantment_definition#Components_with_value_effects
[Entity Effect Components]: https://minecraft.wiki/w/Enchantment_definition#Components_with_entity_effects
[Location Based Effect Components]: https://minecraft.wiki/w/Enchantment_definition#location_changed
[text component]: /docs/resources/client/i18n.md
[LevelBasedValue]: /docs/resources/server/loottables/#number-provider
[Attribute Effect Component]: https://minecraft.wiki/w/Enchantment_definition#Attribute_effects
[datapack function]: https://minecraft.wiki/w/Function_(Java_Edition)
[luck]: https://minecraft.wiki/w/Luck
[mob effect]: /docs/items/mobeffects/
[attribute modifier]: https://minecraft.wiki/w/Attribute#Modifiers
[relevant minecraft wiki page]: https://minecraft.wiki/w/Enchantment_definition#Components_with_entity_effects
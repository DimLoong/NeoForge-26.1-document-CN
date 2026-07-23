---
sidebar_position: 4
---
# 属性 {#attributes}

属性（Attribute）是[生物实体][livingentity]的特殊字段，决定最大生命值、速度或护甲等基本属性。所有属性都以 double 值存储，并自动同步。原版提供了范围广泛的默认属性，你也可以添加自己的属性。

由于历史遗留实现，并非所有属性都对所有实体生效。例如，飞行速度会被恶魂忽略，而跳跃力度只影响马，不影响玩家。

## 内置属性 {#built-in-attributes}

### Minecraft {#minecraft}

以下属性位于 `minecraft` 命名空间中，它们在代码中的值可以在 `Attributes` 类中找到。

| 名称                             | 代码中                           | 取值范围       | 默认值        | 用途                                                                                                                                                                 |
|----------------------------------|----------------------------------|----------------|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `armor`                          | `ARMOR`                          | `[0,30]`       | 0             | 实体的护甲值。值为 1 表示快捷栏上方的半个胸甲图标。                                                                            |
| `armor_toughness`                | `ARMOR_TOUGHNESS`                | `[0,20]`       | 0             | 实体的护甲韧性值。更多信息见 [Minecraft Wiki][wiki] 上的 [Armor Toughness][toughness]。                                         |
| `attack_damage`                  | `ATTACK_DAMAGE`                  | `[0,2048]`     | 2             | 实体在不使用武器或类似物品时造成的基础攻击伤害。                                                                        |
| `attack_knockback`               | `ATTACK_KNOCKBACK`               | `[0,5]`        | 0             | 实体造成的额外击退。击退另有一个基础强度，不由此属性表示。                                                |
| `attack_speed`                   | `ATTACK_SPEED`                   | `[0,1024]`     | 4             | 实体的攻击冷却。数值越高冷却越长，将其设为 0 实际上会重新启用 1.9 之前的战斗方式。                                        |
| `block_break_speed`              | `BLOCK_BREAK_SPEED`              | `[0,1024]`     | 1             | 实体挖掘方块的速度，作为乘性修饰值。更多信息见[挖掘速度][miningspeed]。                                              |
| `block_interaction_range`        | `BLOCK_INTERACTION_RANGE`        | `[0,64]`       | 4.5           | 实体能与方块交互的交互范围，以方块为单位。                                                                        |
| `burning_time`                   | `BURNING_TIME`                   | `[0,1024]`     | 1             | 实体被点燃后燃烧时长的乘数。                                                                          |
| `camera_distance`                | `CAMERA_DISTANCE`                | `[0,32]`       | 4             | 处于第三人称（包括旁观或骑乘另一实体）时，摄像机与实体的距离。                                                        |
| `explosion_knockback_resistance` | `EXPLOSION_KNOCKBACK_RESISTANCE` | `[0,1]`        | 0             | 实体的爆炸击退抗性。这是一个百分比值，即 0 表示无抗性，0.5 表示半抗性，1 表示完全抗性。              |
| `entity_interaction_range`       | `ENTITY_INTERACTION_RANGE`       | `[0,64]`       | 3             | 实体能与其他实体交互的交互范围，以方块为单位。                                                                                |
| `fall_damage_multiplier`         | `FALL_DAMAGE_MULTIPLIER`         | `[0,100]`      | 1             | 实体所受摔落伤害的乘数。                                                                                                                     |
| `flying_speed`                   | `FLYING_SPEED`                   | `[0,1024]`     | 0.4           | 飞行速度的乘数。它并非被所有飞行实体使用，例如会被恶魂忽略。                                                          |
| `follow_range`                   | `FOLLOW_RANGE`                   | `[0,2048]`     | 32            | 实体会锁定/跟随玩家的距离，以方块为单位。                                                                                                 |
| `gravity`                        | `GRAVITY`                        | `[1,1]`        | 0.08          | 实体所受的重力，以方块每 tick 平方为单位。                                                                                                  |
| `jump_strength`                  | `JUMP_STRENGTH`                  | `[0,32]`       | 0.42          | 实体的跳跃力度。数值越高跳得越高。                                                                                                   |
| `knockback_resistance`           | `KNOCKBACK_RESISTANCE`           | `[0,1]`        | 0             | 实体的击退抗性。这是一个百分比值，即 0 表示无抗性，0.5 表示半抗性，1 表示完全抗性。                        |
| `luck`                           | `LUCK`                           | `[-1024,1024]` | 0             | 实体的幸运值。它在掷取[战利品表][loottables]时使用，用于给予额外掷取次数，或以其他方式修改所得物品的品质。               |
| `max_absorption`                 | `MAX_ABSORPTION`                 | `[0,2048]`     | 0             | 实体的最大伤害吸收（黄心）。值为 1 表示半颗心。                                                                    |
| `max_health`                     | `MAX_HEALTH`                     | `[1,1024]`     | 20            | 实体的最大生命值。值为 1 表示半颗心。                                                                                        |
| `mining_efficiency`              | `MINING_EFFICIENCY`              | `[0,1024]`     | 0             | 实体挖掘方块的速度，作为加性修饰值，仅在所用工具正确时生效。更多信息见[挖掘速度][miningspeed]。                 |
| `movement_efficiency`            | `MOVEMENT_EFFICIENCY`            | `[0,1]`        | 0             | 当实体走在有减速效果的方块（如灵魂沙）上时，对其应用的线性插值移动速度加成。                              |
| `movement_speed`                 | `MOVEMENT_SPEED`                 | `[0,1024]`     | 0.7           | 实体的移动速度。数值越高越快。                                                                                                          |
| `oxygen_bonus`                   | `OXYGEN_BONUS`                   | `[0,1024]`     | 0             | 实体的氧气加成。数值越高，实体开始溺水所需的时间越长。                                                             |
| `safe_fall_distance`             | `SAFE_FALL_DISTANCE`             | `[-1024,1024]` | 3             | 实体的安全摔落距离，即在此距离内不会受到摔落伤害。                                                                    |
| `scale`                          | `SCALE`                          | `[0.0625,16]`  | 1             | 实体渲染时的缩放比例。                                                                                                            |
| `sneaking_speed`                 | `SNEAKING_SPEED`                 | `[0,1]`        | 0.3           | 实体潜行时对其应用的移动速度乘数。                                                                                |
| `spawn_reinforcements`           | `SPAWN_REINFORCEMENTS_CHANCE`    | `[0,1]`        | 0             | 僵尸生成其他僵尸的几率。这仅在困难难度下相关，因为僵尸增援不会在普通及以下难度出现。         |
| `step_height`                    | `STEP_HEIGHT`                    | `[0,10]`       | 0.6           | 实体的跨越高度，以方块为单位。如果为 1，玩家就能像走上台阶一样走上 1 格高的台沿。                                                   |
| `submerged_mining_speed`         | `SUBMERGED_MINING_SPEED`         | `[0,20]`       | 0.2           | 实体挖掘方块的速度，作为乘性修饰值，仅在实体处于水下时生效。更多信息见[挖掘速度][miningspeed]。            |
| `sweeping_damage_ratio`          | `SWEEPING_DAMAGE_RATIO`          | `[0,1]`        | 0             | 横扫攻击造成的伤害量，以主攻击伤害的百分比表示。这是一个百分比值，即 0 表示无伤害，0.5 表示半伤害，1 表示完全伤害。 |
| `tempt_range`                    | `TEMPT_RANGE`                    | `[0,2048]`     | 10            | 实体能被物品吸引的范围。主要用于被动动物，例如牛或猪。                                                              |
| `water_movement_efficiency`      | `WATER_MOVEMENT_EFFICIENCY`      | `[0,1]`        | 0             | 实体处于水下时应用的移动速度乘数。                                                                            |
| `waypoint_transmit_range`        | `WAYPOINT_TRANSMIT_RANGE`        | `[0,60000000]` | 0             | 实体能向某个路径点追踪器发送自身位置的范围。 |
| `waypoint_receive_range`         | `WAYPOINT_RECEIVE_RANGE`         | `[0,60000000]` | 0             | 实体能接收另一个发送器的范围。                    |

:::warning
一些属性上限是 Mojang 相对随意设定的。护甲尤其明显，它被限制在 30。NeoForge 不会改动这些上限，不过有一些 Mod 可以更改它们。
:::

### NeoForge {#neoforge}

以下属性位于 `neoforge` 命名空间中，它们在代码中的值可以在 `NeoForgeMod` 类中找到。

| 名称               | 代码中             | 取值范围   | 默认值        | 用途                                                                                                                                                |
|--------------------|--------------------|------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `creative_flight`  | `CREATIVE_FLIGHT`  | `[0,1]`    | 0             | 决定实体的创造模式飞行是启用（\> 0）还是禁用（\<\= 0）。                                                            |
| `nametag_distance` | `NAMETAG_DISTANCE` | `[0,32]`   | 32            | 实体名称标签的可见距离，以方块为单位。                                                                        |
| `swim_speed`       | `SWIM_SPEED`       | `[0,1024]` | 1             | 实体处于水下时应用的移动速度乘数。它独立于 `minecraft:water_movement_efficiency` 生效。 |

## 默认属性 {#default-attributes}

在创建 `LivingEntity` 时，必须为其注册一组默认属性。当实体被[生成][spawning]时，它的默认属性会被设置到它身上。默认属性在 [`EntityAttributeCreationEvent`][event] 中注册，如下所示：

```java
@SubscribeEvent // on the mod event bus
public static void createDefaultAttributes(EntityAttributeCreationEvent event) {
    event.put(
        // Your entity type.
        MY_ENTITY.get(),
        // An AttributeSupplier. This is typically created by calling LivingEntity#createLivingAttributes,
        // setting your values on it, and calling #build. You can also create the AttributeSupplier from scratch
        // if you want, see the source of LivingEntity#createLivingAttributes for an example.
        LivingEntity.createLivingAttributes()
            // Add an attribute with its default value.
            .add(Attributes.MAX_HEALTH)
            // Add an attribute with a non-default value.
            .add(Attributes.MAX_HEALTH, 50)
            // Build the AttributeSupplier.
            .build()
    );
}
```

:::tip
一些类拥有 `LivingEntity#createLivingAttributes` 的专门版本。例如，`Monster` 类就有一个名为 `Monster#createMonsterAttributes` 的方法可供替代使用。
:::

在某些情况下，例如在制作[你自己的属性][custom]时，需要向已有实体的 `AttributeSupplier` 添加属性。这通过 `EntityAttributeModificationEvent` 完成，如下所示：

```java
@SubscribeEvent // on the mod event bus
public static void modifyDefaultAttributes(EntityAttributeModificationEvent event) {
    event.add(
        // The EntityType to add the attribute for.
        EntityType.VILLAGER,
        // The Holder<Attribute> to add to the EntityType. Can also be a custom attribute.
        Attributes.ARMOR,
        // The attribute value to add.
        // Can be omitted, if so, the attribute's default value will be used instead.
        10.0
    );
    // We can also check if a given EntityType already has a given attribute.
    // In this example, if villagers don't have the armor attribute already, we add it.
    if (!event.has(EntityType.VILLAGER, Attributes.ARMOR)) {
        event.add(...);
    }
}
```

请注意，与其他一些注册表不同，存在自定义属性并不会阻止原版客户端连接到 NeoForge 服务端。如果原版客户端连接进来，它只会收到 `minecraft` 命名空间中的属性。

## 查询属性 {#querying-attributes}

属性值以 `AttributeMap` 的形式存储在实体上，它本质上是一个 `Map<Attribute, AttributeInstance>`。属性实例（attribute instance）之于属性，就好比物品堆叠之于物品，即：属性是已注册的单例，而属性实例是绑定到某个具体实体的具体属性对象。

实体的 `AttributeMap` 可以通过调用 `LivingEntity#getAttributes` 获取。随后你可以像下面这样查询该 map：

```java
// Get the attribute map.
AttributeMap attributes = livingEntity.getAttributes();
// Get an attribute instance. This may be null if the entity does not have the attribute.
AttributeInstance instance = attributes.getInstance(Attributes.ARMOR);
// Get the value for an attribute. Will fallback to the default for the entity if needed.
double value = attributes.getValue(Attributes.ARMOR);
// Of course, we can also check if an attribute is present to begin with.
if (attributes.hasAttribute(Attributes.ARMOR)) { ... }

// Alternatively, LivingEntity also offers shortcuts:
AttributeInstance instance = livingEntity.getAttribute(Attributes.ARMOR);
double value = livingEntity.getAttributeValue(Attributes.ARMOR);
```

:::info
处理属性时，你几乎总是使用 `Holder<Attribute>` 而非 `Attribute`。这也是为什么在使用自定义属性时（见下文），我们会显式存储 `Holder<Attribute>`。
:::

## 属性修饰符 {#attribute-modifiers}

与查询相比，更改属性值就没那么简单了。这主要是因为同一时间可能需要对某个属性做多处更改。

设想这样的场景：你是一名玩家，攻击伤害属性为 1。你挥舞一把额外造成 6 点攻击伤害的钻石剑，于是总攻击伤害为 7。接着你喝下一瓶力量药水，添加了一个伤害乘数。然后你又装备了某种饰品，添加了另一个乘数。

为了避免计算错误，并更好地传达属性值是如何被修改的，Minecraft 引入了属性修饰符系统。在该系统中，每个属性都有一个**基础值**，它通常来自我们前面讨论过的默认属性。随后我们可以添加任意数量的**属性修饰符**，这些修饰符又可以被单独移除，而无需担心如何正确地应用各种运算。

首先，我们来创建一个属性修饰符：

```java
// The name of the modifier. This is later used to query the modifier from the attribute map
// and as such must be (semantically) unique.
Identifier id = Identifier.fromNamespaceAndPath("yourmodid", "my_modifier");
// The modifier itself.
AttributeModifier modifier = new AttributeModifier(
    // The name we defined earlier.
    id,
    // The amount by which we modify the attribute value.
    2.0,
    // The operation used to apply the modifier. Possible values are:
    // - AttributeModifier.Operation.ADD_VALUE: Adds the value to the total attribute value.
    // - AttributeModifier.Operation.ADD_MULTIPLIED_BASE: Multiplies the value with the attribute base value
    //   and adds it to the total attribute value.
    // - AttributeModifier.Operation.ADD_MULTIPLIED_TOTAL: Multiplies the value with the total attribute value,
    //   i.e. the attribute base value with all previous modifications already performed,
    //   and adds it to the total attribute value.
    AttributeModifier.Operation.ADD_VALUE
);
```

现在，要应用这个修饰符，我们有两个选择：将其作为临时修饰符添加，或作为永久修饰符添加。永久修饰符会保存到磁盘，而临时修饰符不会。永久修饰符的用例是永久性属性加成之类的东西（例如某种护甲或生命技能），而临时修饰符主要用于[装备][equipment]、[状态效果][mobeffect]以及其他依赖玩家当前状态的修饰符。

```java
AttributeMap attributes = livingEntity.getAttributes();
// Add a transient modifier. If a modifier with the same id is already present, this will throw an exception.
attributes.getInstance(Attributes.ARMOR).addTransientModifier(modifier);
// Add a transient modifier. If a modifier with the same id is already present, it is removed first.
attributes.getInstance(Attributes.ARMOR).addOrUpdateTransientModifier(modifier);
// Add a permanent modifier. If a modifier with the same id is already present, this will throw an exception.
attributes.getInstance(Attributes.ARMOR).addPermanentModifier(modifier);
// Add a permanent modifier. If a modifier with the same id is already present, it is removed first.
attributes.getInstance(Attributes.ARMOR).addOrReplacePermanentModifier(modifier);
```

这些修饰符也可以再次被移除：

```java
// Remove by modifier object.
attributes.getInstance(Attributes.ARMOR).removeModifier(modifier);
// Remove by modifier id.
attributes.getInstance(Attributes.ARMOR).removeModifier(id);
// Remove all modifiers for an attribute.
attributes.getInstance(Attributes.ARMOR).removeModifiers();
```

最后，我们还可以查询属性 map 是否含有具备某个 ID 的修饰符，也可以分别查询基础值和修饰符的值，如下所示：

```java
// Check for the modifier being present.
if (attributes.getInstance(Attributes.ARMOR).hasModifier(id)) { ... }
// Get the base armor attribute value.
double baseValue = attributes.getBaseValue(Attributes.ARMOR);
// Get the value of a certain modifier.
double modifierValue = attributes.getModifierValue(Attributes.ARMOR, id);
```

## 自定义属性 {#custom-attributes}

如有需要，你也可以添加自己的属性。与许多其他系统一样，属性是一个[注册表][registry]，你可以向其注册自己的对象。首先，像下面这样创建一个 `DeferredRegister<Attribute>`：

```java
public static final DeferredRegister<Attribute> ATTRIBUTES = DeferredRegister.create(
    BuiltInRegistries.ATTRIBUTE, "yourmodid");
```

对于属性本身，你有三个类可供选择：

- `RangedAttribute`：多数属性使用的类，它为属性定义了上下界以及一个默认值。
- `PercentageAttribute`：与 `RangedAttribute` 类似，但以百分比而非 float 值显示。NeoForge 新增。
- `BooleanAttribute`：一个只有语义上的真（\> 0）与假（\<\= 0）的属性。它内部仍使用 double。NeoForge 新增。

以 `RangedAttribute` 为例（另外两个用法类似），注册一个属性会是这样：

```java
public static final Holder<Attribute> MY_ATTRIBUTE = ATTRIBUTES.register("my_attribute", () -> new RangedAttribute(
    // The translation key to use.
    "attributes.yourmodid.my_attribute",
    // The default value.
    0,
    // Min and max values.
    -10000,
    10000
));
```

就是这样！只是别忘了把你的 `DeferredRegister` 注册到 mod 总线上，然后就大功告成了。

:::info
这里我们使用 `Holder<Attribute>`，而不像许多其他已注册对象那样使用 `Supplier<RangedAttribute>`，因为这会让与实体打交道容易得多（大多数实体方法都期望接收 `Holder<Attribute>`）。

如果出于某种原因，你需要一个 `Supplier<RangedAttribute>`（或 `Attribute` 任何其他子类的 supplier），那么应当使用 `DeferredHolder<Attribute, RangedAttribute>` 作为类型。

同样的规则也适用于 `Attribute` 的任何其他子类，即我们通常使用 `Holder<Attribute>` 而非 `Supplier<PercentageAttribute>` 或 `Supplier<BooleanAttribute>`。
:::

[custom]: #custom-attributes
[equipment]: ../inventories/container.md#containers-on-entitys
[event]: ../concepts/events.md
[livingentity]: livingentity.md
[loottables]: ../resources/server/loottables/index.md
[miningspeed]: ../blocks/index.md#mining-speed
[mobeffect]: ../items/mobeffects.md
[registry]: ../concepts/registries.md
[spawning]: index.md#spawning-entities
[toughness]: https://minecraft.wiki/w/Armor#Armor_toughness
[wiki]: https://minecraft.wiki

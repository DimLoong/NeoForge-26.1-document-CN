---
sidebar_position: 6
---
# 状态效果与药水 {#mob-effects--potions}

状态效果，有时被称为药水效果，在代码中称为 `MobEffect`，是每 tick 都会影响[`LivingEntity`][livingentity]的效果。本文讲解如何使用它们、效果与药水之间有何区别，以及如何添加你自己的效果。

## 术语 {#terminology}

- `MobEffect` 每 tick 都会影响一个实体。和[方块][block]或[物品][item]一样，`MobEffect` 是注册对象，这意味着它们必须被[注册][registration]，且是单例。
    - **瞬时状态效果**是一种特殊的状态效果，被设计为仅应用一 tick。原版有两个瞬时效果：瞬间治疗和瞬间伤害。
- `MobEffectInstance` 是 `MobEffect` 的一个实例，带有设定的持续时间、增益等级（amplifier）和一些其他属性（见下文）。`MobEffectInstance` 之于 `MobEffect`，正如 [`ItemStack`][itemstack] 之于 `Item`。
- `Potion` 是一组 `MobEffectInstance` 的集合。原版主要将药水用于四种药水物品（下文详述），但它们可以随意应用到任何物品上。物品是否使用以及如何使用设置在其上的药水，则取决于该物品本身。
- **药水物品**是指意在设置有药水的物品。这是一个非正式的术语，原版的 `PotionItem` 类与此无关（它指的是“普通”的药水物品）。Minecraft 目前有四种药水物品：药水、喷溅药水、滞留药水和药箭；不过 Mod 可能会添加更多。

## `MobEffect` {#mobeffects}

要创建你自己的 `MobEffect`，继承 `MobEffect` 类：

```java
public class MyMobEffect extends MobEffect {
    public MyMobEffect(MobEffectCategory category, int color) {
        super(category, color);
    }
    
    @Override
    public boolean applyEffectTick(ServerLevel level, LivingEntity entity, int amplifier) {
        // Apply your effect logic here.

        // If this returns false when shouldApplyEffectTickThisTick returns true, the effect will immediately be removed
        return true;
    }
    
    // Whether the effect should apply this tick. Used e.g. by the Regeneration effect that only applies
    // once every x ticks, depending on the tick count and amplifier.
    @Override
    public boolean shouldApplyEffectTickThisTick(int tickCount, int amplifier) {
        return tickCount % 2 == 0; // replace this with whatever check you want
    }
    
    // Utility method that is called when the effect is first added to the entity.
    // This does not get called again until all instances of this effect have been removed from the entity.
    @Override
    public void onEffectAdded(LivingEntity entity, int amplifier) {
        super.onEffectAdded(entity, amplifier);
    }

    // Utility method that is called when the effect is added to the entity.
    // This gets called every time this effect is added to the entity.
    @Override
    public void onEffectStarted(LivingEntity entity, int amplifier) {
    }
}
```

和所有注册对象一样，`MobEffect` 必须被[注册][registration]，如下所示：

```java
// MOB_EFFECTS is a DeferredRegister<MobEffect>
public static final Holder<MobEffect> MY_MOB_EFFECT = MOB_EFFECTS.register("my_mob_effect", () -> new MyMobEffect(
        //Can be either BENEFICIAL, NEUTRAL or HARMFUL. Used to determine the potion tooltip color of this effect.
        MobEffectCategory.BENEFICIAL,
        //The color of the effect particles in RGB format.
        0xffffff
));
```

`MobEffect` 类还提供了默认功能，用于向受影响的实体添加[属性修饰符][attributemodifier]，并在效果到期或通过其他方式被移除时移除这些修饰符。例如，迅捷效果会为移动速度添加一个属性修饰符。效果属性修饰符的添加方式如下：

```java
public static final Holder<MobEffect> MY_MOB_EFFECT = MOB_EFFECTS.register("my_mob_effect", () -> new MyMobEffect(...)
        .addAttributeModifier(Attributes.ATTACK_DAMAGE, Identifier.fromNamespaceAndPath("examplemod", "effect.strength"), 2.0, AttributeModifier.Operation.ADD_VALUE)
);
```

### `InstantenousMobEffect` {#instantenousmobeffect}

如果你想创建一个瞬时效果，可以使用辅助类 `InstantenousMobEffect` 来替代常规的 `MobEffect` 类，如下所示：

```java
public class MyMobEffect extends InstantenousMobEffect {
    public MyMobEffect(MobEffectCategory category, int color) {
        super(category, color);
    }

    @Override
    public void applyEffectTick(ServerLevel level, LivingEntity entity, int amplifier) {
        // Apply your effect logic here.
    }
}
```

然后，像平常一样[注册][registration]你的效果。

### 事件 {#events}

许多效果的逻辑是在其他地方应用的。例如，飘浮效果是在生物实体的移动处理器中应用的。对于模组的 `MobEffect`，在[事件处理器][events]中应用它们通常是合理的。NeoForge 也提供了一些与效果相关的事件：

- `MobEffectEvent.Applicable` 在游戏检查某个 `MobEffectInstance` 是否可应用于某个实体时触发。此事件可用于拒绝或强制将效果实例添加到目标。
- `MobEffectEvent.Added` 在 `MobEffectInstance` 被添加到目标时触发。此事件包含关于目标上可能已存在的先前 `MobEffectInstance` 的信息。
- `MobEffectEvent.Expired` 在 `MobEffectInstance` 到期（即计时器归零）时触发。
- `MobEffectEvent.Remove` 在效果通过到期之外的方式（例如喝奶或通过命令）从实体上被移除时触发。

## `MobEffectInstance` {#mobeffectinstances}

`MobEffectInstance` 简单来说就是一个应用到实体上的效果。创建 `MobEffectInstance` 通过调用构造函数完成：

```java
MobEffectInstance instance = new MobEffectInstance(
        // The mob effect to use.
        MobEffects.REGENERATION,
        // The duration to use, in ticks. Defaults to 0 if not specified.
        500,
        // The amplifier to use. This is the "strength" of the effect, i.e. Strength I, Strength II, etc.
        // Must be between 0 and 255 (inclusive). Defaults to 0 if not specified.
        0,
        // Whether the effect is an "ambient" effect, meaning it is being applied by an ambient source,
        // of which Minecraft currently has the beacon and the conduit. Defaults to false if not specified.
        false,
        // Whether the effect is visible in the inventory. Defaults to true if not specified.
        true,
        // Whether an effect icon is visible in the top right corner. Defaults to true if not specified.
        true
);
```

有几个构造函数重载可用，它们分别省略最后 1 到 5 个参数。

:::info
`MobEffectInstance` 是可变的。如果你需要一个副本，调用 `new MobEffectInstance(oldInstance)`。
:::

### 使用 `MobEffectInstance` {#using-mobeffectinstances}

可以像这样把一个 `MobEffectInstance` 添加到 `LivingEntity`：

```java
MobEffectInstance instance = new MobEffectInstance(...);
livingEntity.addEffect(instance);
```

同样地，`MobEffectInstance` 也可以从 `LivingEntity` 上移除。由于 `MobEffectInstance` 会覆盖实体上同一 `MobEffect` 的既有 `MobEffectInstance`，因此每个 `MobEffect` 和每个实体只可能存在一个 `MobEffectInstance`。因此，移除时指定 `MobEffect` 即可：

```java
livingEntity.removeEffect(MobEffects.REGENERATION);
```

:::info
`MobEffect` 只能应用于 `LivingEntity` 或其子类，即玩家和生物。诸如物品或投掷的雪球之类的东西无法受到 `MobEffect` 的影响。
:::

## `Potion` {#potions}

`Potion` 通过以你想让药水拥有的 `MobEffectInstance` 调用 `Potion` 的构造函数来创建。例如：

```java
//POTIONS is a DeferredRegister<Potion>
public static final Holder<Potion> MY_POTION = POTIONS.register("my_potion", registryName -> new Potion(
    // The suffix applied to the potion
    registryName.getPath(),
    // The effects used by the potion
    new MobEffectInstance(MY_MOB_EFFECT, 3600)
));
```

药水的名称是构造函数的第一个参数。它被用作翻译键的后缀；例如，原版中的长效和强效药水变体就用它来使自己与其基础变体拥有相同的名称。

`new Potion` 的 `MobEffectInstance` 参数是一个可变参数。这意味着你可以向药水添加任意数量的效果。这也意味着可以创建空药水，即不含任何效果的药水。只需调用 `new Potion()` 即可！（顺便一提，原版就是这样添加 `awkward` 药水的。）

`PotionContents` 类提供了各种与药水物品相关的辅助方法。药水物品通过 `DataComponent#POTION_CONTENTS` 存储其 `PotionContents`。

### 酿造 {#brewing}

现在你的药水已经添加好了，药水物品也可用于你的药水。然而，在生存模式中还没有办法获得你的药水，那就来改变这一点吧！

药水传统上是在酿造台中制作的。遗憾的是，Mojang 并未为酿造配方提供[数据包][datapack]支持，所以我们不得不有点老派地通过代码，借助 `RegisterBrewingRecipesEvent` 事件来添加配方。做法如下：

```java
@SubscribeEvent // on the game event bus
public static void registerBrewingRecipes(RegisterBrewingRecipesEvent event) {
    // Gets the builder to add recipes to
    PotionBrewing.Builder builder = event.getBuilder();

    // Will add brewing recipes for all container potions (e.g. potion, splash potion, lingering potion)
    builder.addMix(
        // The initial potion to apply to
        Potions.AWKWARD,
        // The brewing ingredient. This is the item at the top of the brewing stand.
        Items.FEATHER,
        // The resulting potion
        MY_POTION
    );
}
```

[attributemodifier]: ../entities/attributes.md#attribute-modifiers
[block]: ../blocks/index.md
[commonsetup]: ../concepts/events.md#event-buses
[datapack]: ../resources/index.md#data
[events]: ../concepts/events.md
[item]: index.md
[itemstack]: index.md#itemstacks
[livingentity]: ../entities/livingentity.md
[registration]: ../concepts/registries.md#methods-for-registering
[uuidgen]: https://www.uuidgenerator.net/version4

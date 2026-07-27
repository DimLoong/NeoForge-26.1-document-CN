---
sidebar_position: 4
---
# 状态效果与药水 {#mob-effects--potions}

状态效果有时也称为药水效果，在代码中以 `MobEffect` 表示，它是每一 tick 都会对实体产生作用的效果。本文将讲解如何使用状态效果、效果与药水之间的区别，以及如何添加你自己的效果。

## 术语 {#terminology}

- `MobEffect` 每一 tick 都会作用于实体。与[方块][block]或[物品][item]一样，`MobEffect` 也是注册对象，这意味着它们必须被[注册][registration]，并且是单例。
    - **瞬时状态效果（instant mob effect）**是一种特殊的状态效果，设计上只作用一 tick。原版有两个瞬时效果：瞬间治疗和瞬间伤害。
- `MobEffectInstance` 是 `MobEffect` 的一个实例，带有持续时间、增益等级以及若干其他属性（见下文）。 `MobEffectInstance` 之于 `MobEffect`，正如 [`ItemStack`][itemstack] 之于 `Item`。
- `Potion` 是一组 `MobEffectInstance` 的集合。原版主要将药水用于四种药水物品（下文详述），但也可以随意将其应用到任意物品上。物品是否使用以及如何使用设置在其上的药水，完全取决于物品自身。
- **药水物品（potion item）**是指用来承载药水的物品。这是一个非正式的说法，原版的 `PotionItem` 类与此无关（它指的是“普通”的药水物品）。 Minecraft 目前有四种药水物品：药水、喷溅药水、滞留药水和药箭；不过 Mod 可以添加更多。

## `MobEffect` {#mobeffects}

要创建自己的 `MobEffect`，请继承 `MobEffect` 类：

```java
public class MyMobEffect extends MobEffect {
    public MyMobEffect(MobEffectCategory category, int color) {
        super(category, color);
    }
    
    @Override
    public boolean applyEffectTick(LivingEntity entity, int amplifier) {
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

和所有注册对象一样，`MobEffect` 必须被注册，如下所示：

```java
//MOB_EFFECTS is a DeferredRegister<MobEffect>
public static final Holder<MyMobEffect> MY_MOB_EFFECT = MOB_EFFECTS.register("my_mob_effect", () -> new MyMobEffect(
        //Can be either BENEFICIAL, NEUTRAL or HARMFUL. Used to determine the potion tooltip color of this effect.
        MobEffectCategory.BENEFICIAL,
        //The color of the effect particles.
        0xffffff
));
```

`MobEffect` 类还提供了为受影响实体添加属性修饰符的默认功能。例如，速度效果会为移动速度添加一个属性修饰符。效果的属性修饰符按如下方式添加：

```java
public static final Holder<MyMobEffect> MY_MOB_EFFECT = MOB_EFFECTS.register("my_mob_effect", () -> new MyMobEffect(...)
        .addAttributeModifier(Attributes.ATTACK_DAMAGE, ResourceLocation.fromNamespaceAndPath("examplemod", "effect.strength"), 2.0, AttributeModifier.Operation.ADD_VALUE)
);
```

### `InstantenousMobEffect` {#instantenousmobeffect}

如果你想创建一个瞬时效果，可以使用辅助类 `InstantenousMobEffect` 来代替常规的 `MobEffect` 类，如下所示：

```java
public class MyMobEffect extends InstantenousMobEffect {
    public MyMobEffect(MobEffectCategory category, int color) {
        super(category, color);
    }

    @Override
    public void applyEffectTick(LivingEntity entity, int amplifier) {
        // Apply your effect logic here.
    }
}
```

然后，像平常一样注册你的效果即可。

### 事件 {#events}

许多效果的逻辑是在别的地方实现的。例如，飘浮效果是在生物实体的移动处理器中应用的。对于 Mod 添加的 `MobEffect`，通常在[事件处理器][events]中应用它们是合理的做法。 NeoForge 也提供了一些与效果相关的事件：

- `MobEffectEvent.Applicable` 在游戏检查某个 `MobEffectInstance` 能否被应用到实体时触发。此事件可用于阻止或强制向目标添加该效果实例。
- `MobEffectEvent.Added` 在 `MobEffectInstance` 被添加到目标时触发。此事件包含目标身上此前可能已存在的 `MobEffectInstance` 的信息。
- `MobEffectEvent.Expired` 在 `MobEffectInstance` 过期（即计时归零）时触发。
- `MobEffectEvent.Remove` 在效果通过过期之外的方式被移除时触发，例如喝牛奶或通过命令移除。

## `MobEffectInstance` {#mobeffectinstances}

简单来说，`MobEffectInstance` 就是应用到实体上的一个效果。创建 `MobEffectInstance` 是通过调用其构造函数完成的：

```java
MobEffectInstance instance = new MobEffectInstance(
        // The mob effect to use.
        MobEffects.REGENERATION,
        // The duration to use, in ticks. Defaults to 0 if not specified.
        500,
        // The amplifier to use. This is the "strength" of the effect, i.e. Strength I, Strength II, etc;
        // starting at 0. Defaults to 0 if not specified.
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

构造函数有多个重载，分别可省略最后 1 到 5 个参数。

:::info
`MobEffectInstance` 是可变的。如果你需要一份副本，请调用 `new MobEffectInstance(oldInstance)`。
:::

### 使用 `MobEffectInstance` {#using-mobeffectinstances}

可以像这样将 `MobEffectInstance` 添加到实体上：

```java
MobEffectInstance instance = new MobEffectInstance(...);
entity.addEffect(instance);
```

同样，也可以从实体上移除 `MobEffectInstance`。由于一个 `MobEffectInstance` 会覆盖实体身上同一 `MobEffect` 已有的 `MobEffectInstance`，因此每个 `MobEffect` 在每个实体上只可能存在一个 `MobEffectInstance`。正因如此，移除时只需指定 `MobEffect` 即可：

```java
entity.removeEffect(MobEffects.REGENERATION);
```

:::info
`MobEffect` 只能应用于 `LivingEntity` 或其子类，即玩家和生物。像物品或投出的雪球之类的对象无法受到 `MobEffect` 的影响。
:::

## `Potion` {#potions}

`Potion` 是通过调用 `Potion` 的构造函数并传入你希望药水拥有的 `MobEffectInstance` 来创建的。例如：

```java
//POTIONS is a DeferredRegister<Potion>
public static final Supplier<Potion> MY_POTION = POTIONS.register("my_potion", () -> new Potion(new MobEffectInstance(MY_MOB_EFFECT, 3600)));
```

注意，`new Potion` 的参数是一个可变参数。这意味着你可以为药水添加任意数量的效果。这也意味着可以创建空药水，即不含任何效果的药水。只需调用 `new Potion()` 就完成了！（顺便一提，原版就是这样添加 `awkward`（粗制）药水的。）

药水的名称可以作为构造函数的第一个参数传入。它用于翻译；例如，原版中长效和强效的药水变体就借此与其基础变体共用相同的名称。名称不是必需的；如果省略，名称将从注册表中查询。

`PotionContents` 类提供了各种与药水物品相关的辅助方法。药水物品通过 `DataComponent#POTION_CONTENTS` 存储其 `PotionContents`。

### 酿造 {#brewing}

现在你的药水已经添加好了，对应的药水物品也可用了。然而，目前还没有办法在生存模式中获得你的药水，接下来我们就来解决这个问题！

药水传统上是在酿造台中制作的。遗憾的是，Mojang 并未为酿造配方提供[数据包][datapack]支持，所以我们只能稍微用一点老办法，通过 `RegisterBrewingRecipesEvent` 事件在代码中添加配方。做法如下：

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

[block]: ../blocks/index.md
[commonsetup]: ../concepts/events.md#event-buses
[datapack]: ../resources/index.md#data
[events]: ../concepts/events.md
[item]: index.md
[itemstack]: index.md#itemstacks
[registration]: ../concepts/registries.md
[uuidgen]: https://www.uuidgenerator.net/version4

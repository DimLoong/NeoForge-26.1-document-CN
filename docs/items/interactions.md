---
sidebar_position: 1
---
# 交互 {#interactions}

本页旨在让玩家左键点击、右键点击或中键点击各种事物这一相当复杂而令人困惑的过程变得更易理解，同时厘清在何处、为何应使用何种结果。

## `HitResult` {#hitresults}

为了确定玩家当前正看着什么，Minecraft 使用 `HitResult`。`HitResult` 在某种程度上等同于其他游戏引擎中的射线投射结果，其中最值得注意的是它包含一个 `#getLocation` 方法。

命中结果可以是三种类型之一，由 `HitResult.Type` 枚举表示：`BLOCK`、`ENTITY` 或 `MISS`。类型为 `BLOCK` 的 `HitResult` 可强制转换为 `BlockHitResult`，而类型为 `ENTITY` 的 `HitResult` 可强制转换为 `EntityHitResult`；这两种类型都提供了关于被命中的[方块][block]或[实体][entity]的额外上下文。如果类型是 `MISS`，则表示既没有命中方块也没有命中实体，此时不应转换为任何一个子类。

在[物理客户端][physicalside]上的每一帧，`Minecraft` 类都会更新并将当前所注视的 `HitResult` 存储在 `hitResult` 字段中。随后可通过 `Minecraft.getInstance().hitResult` 访问该字段。

## 左键点击物品 {#left-clicking-an-item}

- 检查你主手中的 [`ItemStack`][itemstack] 所需的所有[特性标志][featureflag]是否均已启用。如果此检查失败，流程结束。
- 如果 `Player#cannotAttackWithItem`（它会检查攻击延迟和 `DataComponents#MINIMUM_ATTACK_CHARGE`）返回 false，流程结束。
- 以左键鼠标按钮和主手触发 `InputEvent.InteractionKeyMappingTriggered`。如果该[事件][event]被[取消][cancel]，流程结束。
- 根据你正看着什么（使用 `Minecraft` 中的 [`HitResult`][hitresult]），会发生不同的事情：
    - 如果你手持一件带有某个 `DataComponents#PIERCING_WEAPON` 的物品：
        - 仅服务端：调用 `PiercingWeapon#attack`。
            - 使用 `ProjectileUtil#getHitEntitiesAlong` 获取所有满足以下条件的实体：
                - 处于攻击者的交互范围与物品的攻击范围（`DataComponents#ATTACK_RANGE`）之内。
                - 非无敌，且能被抛射物命中。
                - 不是同一载具的乘客。
            - 对每个实体调用 `LivingEntity#stabAttack`，若目标被成功造成伤害、击退或使其下座，则返回 true：
                - 伤害来源从 `ItemStack#getDamageSource` 获取。
                - 调用 [`Entity#hurtServer`][hurt]。
                - 如果该穿刺武器造成击退，则调用 `LivingEntity#causeExtraKnockback`。
                - 如果该穿刺武器在命中时使目标下座且目标是乘客，则调用 `Entity#stopRiding`。
                - 如果目标是 `LivingEntity`，则调用 `ItemStack#hurtEnemy`。
                - 如果目标被成功造成伤害，则应用 `EnchantmentHelper#doPostAttackEffects`。
                - 如果目标被成功造成伤害、击退或使其下座，则：
                    - 以目标实体调用 `LivingEntity#setLastHurtMob`。
                    - 调用 `LivingEntity#playAttackSound`。
        - 调用 `LivingEntity#onAttack`。
        - 调用 `LivingEntity#lungerForwardMaybe`。这会通过 `EnchantmentHelper#doLungeEffects` 应用突刺效果。
        - 仅服务端：如果 `LivingEntity#stabAttack` 至少对一个目标返回 true，则调用 `PiercingWeapon#makeHitSound`。
        - 仅服务端：调用 `PiercingWeapon#makeSound`。
        - 调用 `LivingEntity#swing`。
    - 如果你正看着一个处于触及范围内的[实体][entity]：
        - 触发 `AttackEntityEvent`。如果该事件被取消，流程结束。
        - 调用 `IItemExtension#onLeftClickEntity`。如果它返回 true，流程结束。
        - 对目标调用 `Entity#isAttackable`。如果它返回 false，流程结束。
        - 对目标调用 `Entity#skipAttackInteraction`。如果它返回 true，流程结束。
        - 如果目标在 `minecraft:redirectable_projectile` 标签中（默认包括火球和风弹）且是 `Projectile` 的实例，则目标被偏转，流程结束。
        - 实体基础伤害（`minecraft:attack_damage` [属性][attribute]的值）和附魔加成伤害分别计算为两个独立的浮点数。如果两者都为 0，流程结束。
            - 注意，这不包括来自主手物品的[属性修饰符][attributemodifier]，它们会在该检查之后才被加上。
        - 来自主手物品的 `minecraft:attack_damage` 属性修饰符被加到基础伤害上。
        - 触发 `CriticalHitEvent`。如果该事件的 `#isCriticalHit` 方法返回 true，则基础伤害乘以该事件 `#getDamageMultiplier` 方法返回的值——若[一系列条件][critical]通过则默认为 1.5，否则为 1.0，但可被该事件修改。
        - 附魔加成伤害被加到基础伤害上，得出最终伤害值。
        - 触发 `SweepAttackEvent`。如果该事件的 `isSweeping` 方法返回 true，则玩家将执行横扫攻击。默认情况下，这会检查攻击冷却是否 > 90%、该攻击不是暴击、玩家在地面上且移动速度不快于其 `minecraft:movement_speed` 属性值。
        - 调用 [`Entity#hurtOrSimulate`][hurt]。如果它返回 false，流程结束。
        - 如果目标是 `LivingEntity` 的实例，且攻击强度大于 90%、玩家正在疾跑、并且经附魔修改后的 `minecraft:attack_knockback` 属性值大于 0，则调用 `LivingEntity#knockback`。
            - 在该方法内部，触发 `LivingKnockBackEvent`。如果该事件被取消，则不施加任何击退。
        - 玩家基于 `SweepAttackEvent#isSweeping` 对附近的 `LivingEntity` 执行横扫攻击。
            - 在该方法内部，如果实体处于玩家触及范围内且 `Entity#hurtServer` 返回 true，则再次调用 `LivingEntity#knockback`，这又会再次触发 `LivingKnockBackEvent`。
        - 调用 `Item#hurtEnemy`。它可用于攻击后效果。例如，重锤会在此处（如适用）将玩家向上弹回空中。
        - 调用 `Item#postHurtEnemy`。耐久度损耗在此处施加。
            - 如果耐久度归零，使堆叠变为 `ItemStack#EMPTY`，则触发 `PlayerDestroyItemEvent`。
    - 如果你正看着一个处于触及范围内的[方块][block]：
        - 启动[方块破坏子流程][blockbreak]。
    - 否则：
        - 触发 `PlayerInteractEvent.LeftClickEmpty`。

## 右键点击物品 {#right-clicking-an-item}

在右键点击流程中，会调用若干返回两种结果类型之一（见下文）的方法。这些方法大多在返回明确的成功或明确的失败时取消流程。为了便于阅读，从现在起，这种“明确的成功或明确的失败”将被称为“决定性结果”。

- 以右键鼠标按钮和主手触发 `InputEvent.InteractionKeyMappingTriggered`。如果该[事件][event]被[取消][cancel]，流程结束。
- 检查若干条件，例如你不处于旁观模式，或你主手中的 [`ItemStack`][itemstack] 所需的所有[特性标志][featureflag]均已启用。如果其中至少一项检查失败，流程结束。
- 根据你正看着什么（使用 `Minecraft` 中的 [`HitResult`][hitresult]），会发生不同的事情：
    - 如果你正看着一个处于触及范围内、且不在世界边界之外的[实体][entity]：
        - 触发 `PlayerInteractEvent.EntityInteractSpecific`。如果该事件被取消，流程结束。
        - **对你正看着的实体**调用 `Entity#interactAt`。如果它返回决定性结果，流程结束。
            - 如果你想为自己的实体添加行为，重写此方法。如果你想为原版实体添加行为，使用该事件。
        - 如果该实体打开了某个界面（例如村民交易 GUI 或矿车箱子 GUI），流程结束。
        - 触发 `PlayerInteractEvent.EntityInteract`。如果该事件被取消，流程结束。
        - **对你正看着的实体**调用 `Entity#interact`。如果它返回决定性结果，流程结束。
            - 如果你想为自己的实体添加行为，重写此方法。如果你想为原版实体添加行为，使用该事件。
            - 对于 [`Mob`][livingentity]，`Entity#interact` 的重写会处理诸如拴绳，以及当你主手中的 `ItemStack` 是刷怪蛋时生成幼崽等事务，然后把生物专属的处理委托给 `Mob#mobInteract`。`Entity#interact` 的结果规则在此同样适用。
        - 如果你正看着的实体是 `LivingEntity`，则对你主手中的 `ItemStack` 调用 `Item#interactLivingEntity`。如果它返回决定性结果，流程结束。
    - 如果你正看着一个处于触及范围内、且不在世界边界之外的[方块][block]：
        - 触发 `PlayerInteractEvent.RightClickBlock`。如果该事件被取消，流程结束。你也可以在此事件中专门只拒绝方块用途或物品用途。
        - 调用 `IItemExtension#onItemUseFirst`。如果它返回决定性结果，流程结束。
        - 如果 `IItemExtension#doesSneakBypassUse` 返回 false 且该事件未拒绝方块用途，则触发 `UseItemOnBlockEvent`。如果该事件被取消，则使用其取消结果。否则，调用 `BlockBehaviour#useItemOn`。如果它返回决定性结果，流程结束。
        - 如果该 `InteractionResult` 是 `TryEmptyHandInteraction` 的实例（例如 `TRY_WITH_EMPTY_HAND`）且执行手是主手，则调用 `BlockBehaviour#useWithoutItem`。如果它返回决定性结果，流程结束。
        - 如果该事件未拒绝物品用途，则调用 `Item#useOn`。如果它返回决定性结果，流程结束。
     - 否则：
        - 触发 `PlayerInteractEvent.RightClickEmpty`。
- 触发 `PlayerInteractEvent.RightClickItem`。如果该事件被取消，流程结束。
- 调用 `Item#use`。
    - 如果该 `InteractionResult` 是 `Success` 的实例（例如 `SUCCESS`），则 `ItemStack` 被更改为 `Success#heldItemTransformedTo`。
- 如果当前堆叠与原始堆叠不匹配且新堆叠为空，则触发 `PlayerDestroyItemEvent`。
- 上述过程会再运行一次，这次使用副手而非主手。

### `InteractionResult` {#interactionresult}

`InteractionResult` 是一个密封接口，表示某个物品或空手与某个对象（例如实体、方块等）之间某次交互的结果。该接口划分为四个 record，共有六种潜在的默认状态。

首先是 `InteractionResult.Success`，表示该操作应被视为成功，从而结束流程。成功状态有两个参数：`SwingSource`，指示实体是否应在相应的[逻辑端][side]挥动手臂；以及 `InteractionResult.ItemContext`，它保存了此次交互是否由手持物品引起，以及手持物品在使用后转变成了什么。挥手来源由某个默认状态决定：`InteractionResult#SUCCESS` 表示客户端挥手，`InteractionResult#SUCCESS_SERVER` 表示服务端挥手，`InteractionResult#CONSUME` 表示不挥手。若 `ItemStack` 发生了变化，则通过 `Success#heldItemTransformedTo` 设置物品上下文；若手持物品与对象之间并无交互，则用 `withoutItem`。默认设置为存在物品交互但没有发生转变。

```java
// In some method that returns an interaction result

// Item in hand will turn into an apple
return InteractionResult.SUCCESS.heldItemTransformedTo(new ItemStack(Items.APPLE));
```

:::note
`SUCCESS` 和 `SUCCESS_SERVER` 一般绝不应在同一个方法中使用。如果客户端有足够的信息来判断何时挥手，则应始终使用 `SUCCESS`。否则，如果它依赖客户端上不存在的服务端信息，则应使用 `SUCCESS_SERVER`。
:::

其次是 `InteractionResult.Fail`，由 `InteractionResult#FAIL` 实现，表示该操作应被视为失败，不允许再发生进一步的交互。流程将结束。它可以在任何地方使用，但在 `Item#useOn` 和 `Item#use` 之外应谨慎使用。在许多情况下，使用 `InteractionResult#PASS` 更为合理。

最后是 `InteractionResult.Pass` 和 `InteractionResult.TryWithEmptyHandInteraction`，分别由 `InteractionResult#PASS` 和 `InteractionResult#TRY_WITH_EMPTY_HAND` 实现。这些 record 表示某个操作既不应被视为成功也不应被视为失败，流程应继续进行。`PASS` 是所有 `InteractionResult` 方法的默认行为，唯有 `BlockBehaviour#useItemOn` 例外，它返回 `TRY_WITH_EMPTY_HAND`。更具体地说，如果 `BlockBehaviour#useItemOn` 返回除 `TRY_WITH_EMPTY_HAND` 之外的任何值，则无论物品是否在主手中，都不会调用 `BlockBehaviour#useWithoutItem`。

有些方法具有特殊行为或要求，将在下面的章节中说明。

#### `Item#useOn` {#itemuseon}

如果你希望该操作被视为成功，但又不想让手臂挥动或授予一个 `ITEM_USED` 统计点，请使用 `InteractionResult#CONSUME` 并调用 `#withoutItem`。

```java
// In Item#useOn
return InteractionResult.CONSUME.withoutItem();
```

#### `Item#use` {#itemuse}

这是唯一一处会使用来自 `Success` 变体（`SUCCESS`、`SUCCESS_SERVER`、`CONSUME`）的已转变 `ItemStack` 的场合。由 `Success#heldItemTransformedTo` 设置的结果 `ItemStack`，会在其发生变化时替换发起使用时所用的 `ItemStack`。

`Item#use` 的默认实现：当物品可食用（具有 `DataComponents#CONSUMABLE`）且玩家可以吃下该物品（因为他们处于饥饿状态，或因为该物品总是可食用）时返回 `InteractionResult#CONSUME`；当物品可食用（具有 `DataComponents#CONSUMABLE`）但玩家无法吃下该物品时返回 `InteractionResult#FAIL`。如果物品可装备（具有 `DataComponents#EQUIPPABLE`），则在切换时返回 `InteractionResult#SUCCESS`，且手持物品被替换为切换来的物品（通过 `heldItemTransformedTo`）；如果盔甲上的附魔具有 `EnchantmentEffectComponents#PREVENT_ARMOR_CHANGE` 组件，则返回 `InteractionResult#FAIL`。如果物品可以格挡攻击（具有 `DataComponents#BLOCKS_ATTACKS`），则在返回 `InteractionResult#CONSUME` 之前会调用 `Item#startUsingItem`。否则返回 `InteractionResult#PASS`。

在此处考虑主手时返回 `InteractionResult#FAIL`，将阻止副手行为运行。如果你希望副手行为运行（通常你会希望如此），则应改为返回 `InteractionResult#PASS`。

## 中键点击 {#middle-clicking}

- 如果 `Minecraft.getInstance().hitResult` 中的 [`HitResult`][hitresult] 为 null 或类型为 `MISS`，流程结束。
- 以左键鼠标按钮和主手触发 `InputEvent.InteractionKeyMappingTriggered`。如果该[事件][event]被[取消][cancel]，流程结束。
- 根据你正看着什么（使用 `Minecraft.getInstance().hitResult` 中的 `HitResult`），会发生不同的事情：
    - 如果你正看着一个处于触及范围内的[实体][entity]：
        - 如果 `Entity#isPickable` 返回 false，流程结束。
        - 如果 `Player#isWithinEntityInteractionRange` 返回 false，流程结束。
        - 调用 `Entity#getPickResult`。如果存在与所得 `ItemStack` 匹配的快捷栏槽位，则将该槽位设为激活。否则，如果玩家处于创造模式，则将所得 `ItemStack` 加入玩家物品栏。
            - 默认情况下，此方法转发至 `Entity#getPickResult`，Mod 开发者可重写它。
    - 如果你正看着一个处于触及范围内的[方块][block]：
        - 如果 `Player#isWithinBlockInteractionRange` 返回 false，流程结束。
        - 调用 `IBlockExtension#getCloneItemStack`（它默认委托给 `BlockBehaviour#getCloneItemStack`），其返回值成为“选中的” `ItemStack`。
            - 默认情况下，这会返回 `Block` 的 `Item` 表示。
        - 如果按住了 Control 键、玩家处于创造模式、且目标方块拥有一个[`BlockEntity`][blockentity]：
            - `BlockEntity` 的数据从 `BlockEntity#saveCustomOnly` 获取
                - 作为后处理步骤，调用 `BlockEntity#removeComponentsFromTag`。
            - `BlockEntity` 的数据通过 `DataComponents#BLOCK_ENTITY_DATA` 被加入“选中的” `ItemStack`。
        - 如果存在与“选中的” `ItemStack` 匹配的快捷栏槽位，则将该槽位设为激活。否则，如果玩家处于创造模式，则将“选中的” `ItemStack` 加入玩家物品栏。

[attribute]: ../entities/attributes.md
[attributemodifier]: ../entities/attributes.md#attribute-modifiers
[block]: ../blocks/index.md
[blockbreak]: ../blocks/index.md#breaking-a-block
[blockentity]: ../blockentities/index.md
[cancel]: ../concepts/events.md#cancellable-events
[critical]: https://minecraft.wiki/w/Damage#Critical_hit
[effect]: mobeffects.md
[entity]: ../entities/index.md
[event]: ../concepts/events.md
[featureflag]: ../advanced/featureflags.md
[hitresult]: #hitresults
[hurt]: ../entities/index.md#damaging-entities
[itemstack]: index.md#itemstacks
[itemuseon]: #itemuseon
[livingentity]: ../entities/livingentity.md
[physicalside]: ../concepts/sides.md#the-physical-side
[side]: ../concepts/sides.md#the-logical-side

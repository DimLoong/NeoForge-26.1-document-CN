---
sidebar_position: 1
---
# 交互流水线 {#the-interaction-pipeline}

本页旨在把玩家右键点击某物这一相当复杂且令人困惑的过程讲清楚，同时说明在什么地方该用什么结果、以及为什么。

## 当我右键点击时会发生什么？ {#what-happens-when-i-right-click}

当你在世界中的任意位置右键点击时，会发生一系列事情，具体取决于你当前正看着什么，以及你手中拿着哪些 `ItemStack`。届时会调用一系列方法，它们都返回两种结果类型之一（见下文）。这些方法中的大多数，只要返回明确的成功或明确的失败，就会取消流水线。为了便于阅读，下文将这种“明确的成功或明确的失败”称为“确定性结果”。

- 以鼠标右键和主手触发 `InputEvent.InteractionKeyMappingTriggered`。如果该事件被取消，流水线结束。
- 检查若干前提条件，例如你没有处于旁观者模式、你主手中 `ItemStack` 所需的所有特性标志均已启用。如果其中至少有一项检查失败，流水线结束。
- 根据你正看着什么，会发生不同的情况：
    - 如果你正看着一个在你触及范围内且未越过世界边界的实体：
        - 触发 `PlayerInteractEvent.EntityInteractSpecific`。如果该事件被取消，流水线结束。
        - 在**你正看着的那个实体上**调用 `Entity#interactAt`。如果它返回确定性结果，流水线结束。
            - 如果你想为自己的实体添加行为，重写此方法。如果你想为原版实体添加行为，使用该事件。
        - 如果该实体打开了某个界面（例如村民交易 GUI 或运输矿车 GUI），流水线结束。
        - 触发 `PlayerInteractEvent.EntityInteract`。如果该事件被取消，流水线结束。
        - 在**你正看着的那个实体上**调用 `Entity#interact`。如果它返回确定性结果，流水线结束。
            - 如果你想为自己的实体添加行为，重写此方法。如果你想为原版实体添加行为，使用该事件。
            - 对于 `Mob`，`Entity#interact` 的重写会处理诸如拴绳、以及在你主手中的 `ItemStack` 是刷怪蛋时生成幼崽等操作，随后将生物专属的处理交给 `Mob#mobInteract`。 `Entity#interact` 的结果规则在这里同样适用。
        - 如果你正看着的实体是 `LivingEntity`，则在你主手中的 `ItemStack` 上调用 `Item#interactLivingEntity`。如果它返回确定性结果，流水线结束。
    - 如果你正看着一个在你触及范围内且未越过世界边界的方块：
        - 触发 `PlayerInteractEvent.RightClickBlock`。如果该事件被取消，流水线结束。你也可以在该事件中专门只拒绝方块使用或只拒绝物品使用。
        - 调用 `IItemExtension#onItemUseFirst`。如果它返回确定性结果，流水线结束。
        - 如果玩家没有潜行，且该事件没有拒绝方块使用，则触发 `UseItemOnBlockEvent`。如果该事件被取消，则使用取消时的结果。否则，调用 `Block#useItemOn`。如果它返回确定性结果，流水线结束。
        - 如果 `ItemInteractionResult` 为 `PASS_TO_DEFAULT_BLOCK_INTERACTION` 且执行操作的手是主手，则调用 `Block#useWithoutItem`。如果它返回确定性结果，流水线结束。
        - 如果该事件没有拒绝物品使用，则调用 `Item#useOn`。如果它返回确定性结果，流水线结束。
- 调用 `Item#use`。如果它返回确定性结果，流水线结束。
- 上述过程会再运行一次，这一次用副手代替主手。

## 结果类型 {#result-types}

结果共有三种不同类型：`InteractionResult`、 `ItemInteractionResult` 和 `InteractionResultHolder<T>`。大多数情况下使用 `InteractionResult`，只有 `Item#use` 使用 `InteractionResultHolder<ItemStack>`，而只有 `BlockBehaviour#useItemOn` 和 `CauldronInteraction#interact` 使用 `ItemInteractionResult`。

`InteractionResult` 是一个由五个值组成的枚举：`SUCCESS`、 `CONSUME`、 `CONSUME_PARTIAL`、 `PASS` 和 `FAIL`。此外还提供了 `InteractionResult#sidedSuccess` 方法，它在服务端返回 `SUCCESS`，在客户端返回 `CONSUME`。

`InteractionResultHolder<T>` 是对 `InteractionResult` 的封装，为 `T` 添加了额外的上下文。 `T` 可以是任何类型，但在 99.99% 的情况下它都是 `ItemStack`。 `InteractionResultHolder<T>` 为各枚举值提供了封装方法（`#success`、 `#consume`、 `#pass` 和 `#fail`），以及 `#sidedSuccess`，后者在服务端调用 `#success`，在客户端调用 `#consume`。

`ItemInteractionResult` 是与 `InteractionResult` 平行的一套结果，专用于物品被用于方块的场景。它是一个由六个值组成的枚举：`SUCCESS`、 `CONSUME`、 `CONSUME_PARTIAL`、 `PASS_TO_DEFAULT_BLOCK_INTERACTION`、 `SKIP_DEFAULT_BLOCK_INTERACTION` 和 `FAIL`。每个 `ItemInteractionResult` 都可以通过 `#result` 映射到一个 `InteractionResult`；`PASS_TO_DEFAULT_BLOCK_INTERACTION` 和 `SKIP_DEFAULT_BLOCK_INTERACTION` 都表示 `InteractionResult#PASS`。类似地，`ItemInteractionResult` 也有 `#sidedSucess`。

一般来说，各个值的含义如下：

- 如果操作应被视为成功，且你希望手臂挥动，就应当使用 `InteractionResult#sidedSuccess`（或在需要时使用 `InteractionResultHolder#sidedSuccess` / `ItemInteractionResult#sidedSucess`）。流水线将结束。
- 如果操作应被视为成功，且你希望手臂挥动，但只在一端挥动，就应当使用 `InteractionResult#SUCCESS`（或在需要时使用 `InteractionResultHolder#success` / `ItemInteractionResult#SUCCESS`）。只有当你出于某种原因想在另一逻辑端返回不同的值时，才使用它。流水线将结束。
- 如果操作应被视为成功，但你不希望手臂挥动，就应当使用 `InteractionResult#CONSUME`（或在需要时使用 `InteractionResultHolder#consume` / `ItemInteractionResult#CONSUME`）。流水线将结束。
- `InteractionResult#CONSUME_PARTIAL` 与 `InteractionResult#CONSUME` 基本相同，唯一的区别在于它在 [`Item#useOn`][itemuseon] 中的用法。
    - `ItemInteractionResult#CONSUME_PARTIAL` 在 `BlockBehaviour#useItemOn` 中的用法与之类似。
- 如果物品功能应被视为失败、且不应再执行进一步的交互，就应当使用 `InteractionResult.FAIL`（或在需要时使用 `InteractionResultHolder#fail` / `ItemInteractionResult#FAIL`）。流水线将结束。它可以在任何地方使用，但在 `Item#useOn` 和 `Item#use` 之外应谨慎使用。在许多情况下，使用 `InteractionResult.PASS` 更合理。
- 如果操作既不应被视为成功也不应被视为失败，就应当使用 `InteractionResult.PASS`（或在需要时使用 `InteractionResultHolder#pass`）。流水线将继续。这是默认行为（除非另有说明）。
    - `ItemInteractionResult#PASS_TO_DEFAULT_BLOCK_INTERACTION` 允许对主手调用 `BlockBehaviour#useWithoutItem`，而 `#SKIP_DEFAULT_BLOCK_INTERACTION` 则完全阻止该方法执行。 `#PASS_TO_DEFAULT_BLOCK_INTERACTION` 是默认行为（除非另有说明）。

有些方法有特殊的行为或要求，将在下面各章节中说明。

## `IItemExtension#onItemUseFirst` {#iitemextensiononitemusefirst}

`InteractionResult#sidedSuccess` 和 `InteractionResult.CONSUME` 在这里不起作用。这里只应使用 `InteractionResult.SUCCESS`、 `InteractionResult.FAIL` 或 `InteractionResult.PASS`。

## `Item#useOn` {#itemuseon}

如果你希望操作被视为成功，但不希望手臂挥动、也不希望授予 `ITEM_USED` 统计点数，使用 `InteractionResult.CONSUME_PARTIAL`。

## `Item#use` {#itemuse}

这是唯一一处返回类型为 `InteractionResultHolder<ItemStack>` 的情况。如果 `InteractionResultHolder<ItemStack>` 中得到的 `ItemStack` 发生了变化，它将替换掉发起本次使用时所用的那个 `ItemStack`。

`Item#use` 的默认实现在以下情况分别返回不同结果：当物品可食用且玩家能够食用该物品时（因为玩家处于饥饿状态，或因为该物品始终可食用），返回 `InteractionResultHolder#consume`；当物品可食用但玩家无法食用该物品时，返回 `InteractionResultHolder#fail`；当物品不可食用时，返回 `InteractionResultHolder#pass`。

在处理主手时于此返回 `InteractionResultHolder#fail`，会阻止副手行为运行。如果你希望副手行为运行（通常你会希望如此），那就改为返回 `InteractionResultHolder#pass`。

[itemuseon]: #itemuseon

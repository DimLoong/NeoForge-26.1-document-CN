# 菜单 {#menus}

菜单（Menu）是图形用户界面（GUI）的后端实现之一，负责处理与某个数据持有对象交互所涉及的逻辑。菜单本身并不持有数据，它只是一个视图，允许用户间接修改内部数据持有对象的状态。因此，数据持有对象不应与任何菜单直接耦合，而应把数据引用传入，供菜单调用和修改。

## `MenuType` {#menutype}

菜单是动态创建和移除的，因此它们并不是注册对象。为此，需要另外注册一个工厂对象，用来方便地创建并引用菜单的*类型*。对菜单而言，这个工厂对象就是 `MenuType`。

`MenuType` 必须[注册][registered]。

### `MenuSupplier` {#menusupplier}

创建 `MenuType` 时，需向其构造器传入一个 `MenuSupplier` 和一个 `FeatureFlagSet`。 `MenuSupplier` 表示这样一个函数：它接收容器的 id 以及查看该菜单的玩家的物品栏，并返回一个新创建的 [`AbstractContainerMenu`][acm]。

```java
// For some DeferredRegister<MenuType<?>> REGISTER
public static final Supplier<MenuType<MyMenu>> MY_MENU = REGISTER.register("my_menu", () -> new MenuType(MyMenu::new, FeatureFlags.DEFAULT_FLAGS));

// In MyMenu, an AbstractContainerMenu subclass
public MyMenu(int containerId, Inventory playerInv) {
    super(MY_MENU.get(), containerId);
    // ...
}
```

:::note
容器标识符对于每个玩家是唯一的。这意味着即使两名玩家查看的是同一个数据持有对象，同一个容器 id 在这两名玩家上也会代表两个不同的菜单。
:::

`MenuSupplier` 通常负责在客户端创建菜单，并使用虚拟（dummy）数据引用来存储服务端数据持有对象同步过来的信息、以及与之交互。

### `IContainerFactory` {#icontainerfactory}

如果客户端还需要额外信息（例如数据持有对象在世界中的位置），可以改用子接口 `IContainerFactory`。除了容器 id 和玩家物品栏之外，它还额外提供一个 `RegistryFriendlyByteBuf`，可用于存储从服务端发送来的额外信息。通过 `IMenuTypeExtension#create`，即可用 `IContainerFactory` 创建 `MenuType`。

```java
// For some DeferredRegister<MenuType<?>> REGISTER
public static final Supplier<MenuType<MyMenuExtra>> MY_MENU_EXTRA = REGISTER.register("my_menu_extra", () -> IMenuTypeExtension.create(MyMenu::new));

// In MyMenuExtra, an AbstractContainerMenu subclass
public MyMenuExtra(int containerId, Inventory playerInv, FriendlyByteBuf extraData) {
    super(MY_MENU_EXTRA.get(), containerId);
    // Store extra data from buffer
    // ...
}
```

## `AbstractContainerMenu` {#abstractcontainermenu}

所有菜单都继承自 `AbstractContainerMenu`。菜单接收两个参数：[`MenuType`][mt]，代表菜单自身的类型；以及容器 id，代表该菜单对当前访问者而言的唯一标识符。

:::caution
一名玩家同时最多只能打开 100 个不同的菜单。
:::

每个菜单应包含两个构造器：一个用于在服务端初始化菜单，另一个用于在客户端初始化菜单。用于在客户端初始化菜单的那个构造器，就是提供给 `MenuType` 的构造器。服务端菜单构造器中包含的任何字段，都应在客户端菜单构造器中有一个默认值。

```java
// Client menu constructor
public MyMenu(int containerId, Inventory playerInventory) { // optional FriendlyByteBuf parameter if reading data from server
    this(containerId, playerInventory, /* Any default parameters here */);
}

// Server menu constructor
public MyMenu(int containerId, Inventory playerInventory, /* Any additional parameters here. */) {
    // ...
}
```

每个菜单实现都必须实现两个方法：`#stillValid` 和 [`#quickMoveStack`][qms]。

### `#stillValid` 与 `ContainerLevelAccess` {#stillvalid-and-containerlevelaccess}

`#stillValid` 用于判断菜单是否应对某个玩家保持打开状态。它通常委托给静态方法 `#stillValid`，后者接收一个 `ContainerLevelAccess`、玩家，以及该菜单所依附的 `Block`。客户端菜单在该方法中必须始终返回 `true`，而静态方法 `#stillValid` 默认就是如此。该实现会检查玩家是否处在数据存储对象所在位置的八格范围之内。

`ContainerLevelAccess` 在一个封闭的作用域内提供当前的世界（Level）和方块位置。在服务端构造菜单时，可以调用 `ContainerLevelAccess#create` 创建一个新的访问器。客户端菜单构造器可以传入 `ContainerLevelAccess#NULL`，它什么也不做。

```java
// Client menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory) {
    this(containerId, playerInventory, ContainerLevelAccess.NULL);
}

// Server menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory, ContainerLevelAccess access) {
    // ...
}

// Assume this menu is attached to Supplier<Block> MY_BLOCK
@Override
public boolean stillValid(Player player) {
    return AbstractContainerMenu.stillValid(this.access, player, MY_BLOCK.get());
}
```

### 数据同步 {#data-synchronization}

有些数据需要同时存在于服务端和客户端，才能展示给玩家。为此，菜单实现了一层基本的数据同步机制：每当当前数据与上一次同步到客户端的数据不一致时便进行同步。对于玩家，这种检查每 tick 进行一次。

Minecraft 默认支持两种数据同步方式：通过 `Slot` 同步的 `ItemStack`，以及通过 `DataSlot` 同步的整数。 `Slot` 和 `DataSlot` 都是视图，它们持有对数据存储的引用；只要操作合法，玩家便可以在界面中修改这些数据。可以在构造器中通过 `#addSlot` 和 `#addDataSlot` 将它们添加到菜单里。

:::note
由于 `Slot` 所使用的 `Container` 已被 NeoForge 弃用，转而推荐使用 [`IItemHandler` capability][cap]，因此后续讲解将围绕该 Capability 的变体 `SlotItemHandler` 展开。
:::

`SlotItemHandler` 包含四个参数：代表这些堆叠所在物品栏的 `IItemHandler`、该槽位具体所代表的那个堆叠的索引，以及该槽位左上角相对于 `AbstractContainerScreen#leftPos` 和 `#topPos` 在界面上渲染的 x、 y 坐标。客户端菜单构造器应始终提供一个大小相同的空物品栏实例。

大多数情况下，会先添加菜单本身包含的所有槽位，接着是玩家物品栏，最后以玩家的快捷栏（hotbar）收尾。要从菜单中访问某个具体的 `Slot`，必须根据槽位添加的顺序计算其索引。

`DataSlot` 是一个抽象类，应实现一个 getter 和一个 setter，用来引用数据存储对象中所存的数据。客户端菜单构造器应始终通过 `DataSlot#standalone` 提供一个新实例。

这些对象，连同槽位，都应在每次初始化新菜单时重新创建。

:::note
虽然 `DataSlot` 存储的是一个整数，但由于它在网络上发送该值的方式，其实际取值被限制在 **short** 的范围内（-32768 到 32767）。整数中高 16 位会被忽略。

NeoForge 对该数据包做了修补，从而向客户端提供完整的整数。
:::

```java
// Assume we have an inventory from a data object of size 5
// Assume we have a DataSlot constructed on each initialization of the server menu

// Client menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory) {
    this(containerId, playerInventory, new ItemStackHandler(5), DataSlot.standalone());
}

// Server menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory, IItemHandler dataInventory, DataSlot dataSingle) {
    // Check if the data inventory size is some fixed value
    // Then, add slots for data inventory
    this.addSlot(new SlotItemHandler(dataInventory, /*...*/));

    // Add slots for player inventory
    this.addSlot(new Slot(playerInventory, /*...*/));

    // Add data slots for handled integers
    this.addDataSlot(dataSingle);

    // ...
}
```

#### `ContainerData` {#containerdata}

如果需要向客户端同步多个整数，可以改用 `ContainerData` 来引用这些整数。该接口的作用相当于一次索引查找：每个索引代表一个不同的整数。如果通过 `#addDataSlots` 将 `ContainerData` 添加到菜单中，`ContainerData` 也可以在数据对象自身内部构造。该方法会按接口所指定的数据数量创建相应数量的新 `DataSlot`。客户端菜单构造器应始终通过 `SimpleContainerData` 提供一个新实例。

```java
// Assume we have a ContainerData of size 3

// Client menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory) {
    this(containerId, playerInventory, new SimpleContainerData(3));
}

// Server menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory, ContainerData dataMultiple) {
    // Check if the ContainerData size is some fixed value
    checkContainerDataCount(dataMultiple, 3);

    // Add data slots for handled integers
    this.addDataSlots(dataMultiple);

    // ...
}
```

#### `#quickMoveStack` {#quickmovestack}

`#quickMoveStack` 是任何菜单都必须实现的第二个方法。每当一个堆叠被 shift 单击（即快速移动）出其当前槽位时，就会调用该方法，直到堆叠被完全移出其原先的槽位，或再无其他可容纳该堆叠的位置为止。该方法返回被快速移动槽位中堆叠的一份副本。

堆叠通常通过 `#moveItemStackTo` 在槽位之间移动，该方法会把堆叠移入第一个可用的槽位。它接收要移动的堆叠、尝试移入的首个槽位索引（含）、末个槽位索引（不含），以及是从头到尾检查槽位（当为 `false` 时）还是从尾到头检查（当为 `true` 时）。

在 Minecraft 的各种实现中，该方法的逻辑相当一致：

```java
// Assume we have a data inventory of size 5
// The inventory has 4 inputs (index 1 - 4) which outputs to a result slot (index 0)
// We also have the 27 player inventory slots and the 9 hotbar slots
// As such, the actual slots are indexed like so:
//   - Data Inventory: Result (0), Inputs (1 - 4)
//   - Player Inventory (5 - 31)
//   - Player Hotbar (32 - 40)
@Override
public ItemStack quickMoveStack(Player player, int quickMovedSlotIndex) {
    // The quick moved slot stack
    ItemStack quickMovedStack = ItemStack.EMPTY;
    // The quick moved slot
    Slot quickMovedSlot = this.slots.get(quickMovedSlotIndex) 
  
    // If the slot is in the valid range and the slot is not empty
    if (quickMovedSlot != null && quickMovedSlot.hasItem()) {
        // Get the raw stack to move
        ItemStack rawStack = quickMovedSlot.getItem(); 
        // Set the slot stack to a copy of the raw stack
        quickMovedStack = rawStack.copy();

        /*
        The following quick move logic can be simplified to if in data inventory,
        try to move to player inventory/hotbar and vice versa for containers
        that cannot transform data (e.g. chests).
        */

        // If the quick move was performed on the data inventory result slot
        if (quickMovedSlotIndex == 0) {
            // Try to move the result slot into the player inventory/hotbar
            if (!this.moveItemStackTo(rawStack, 5, 41, true)) {
                // If cannot move, no longer quick move
                return ItemStack.EMPTY;
            }

            // Perform logic on result slot quick move
            slot.onQuickCraft(rawStack, quickMovedStack);
        }
        // Else if the quick move was performed on the player inventory or hotbar slot
        else if (quickMovedSlotIndex >= 5 && quickMovedSlotIndex < 41) {
            // Try to move the inventory/hotbar slot into the data inventory input slots
            if (!this.moveItemStackTo(rawStack, 1, 5, false)) {
                // If cannot move and in player inventory slot, try to move to hotbar
                if (quickMovedSlotIndex < 32) {
                    if (!this.moveItemStackTo(rawStack, 32, 41, false)) {
                        // If cannot move, no longer quick move
                        return ItemStack.EMPTY;
                    }
                }
                // Else try to move hotbar into player inventory slot
                else if (!this.moveItemStackTo(rawStack, 5, 32, false)) {
                    // If cannot move, no longer quick move
                    return ItemStack.EMPTY;
                }
            }
        }
        // Else if the quick move was performed on the data inventory input slots, try to move to player inventory/hotbar
        else if (!this.moveItemStackTo(rawStack, 5, 41, false)) {
            // If cannot move, no longer quick move
            return ItemStack.EMPTY;
        }

        if (rawStack.isEmpty()) {
            // If the raw stack has completely moved out of the slot, set the slot to the empty stack
            quickMovedSlot.set(ItemStack.EMPTY);
        } else {
            // Otherwise, notify the slot that that the stack count has changed
            quickMovedSlot.setChanged();
        }

        // Execute logic on what to do post move with the remaining stack
        // This can be removed if there are no `Slot` subtypes that override `onTake`
        quickMovedSlot.onTake(player, rawStack);
    }

    return quickMovedStack; // Return the slot stack
}
```

## 打开菜单 {#opening-a-menu}

一旦菜单类型已注册、菜单本身已完成、并且已附加了[界面][screen]，玩家便可打开这个菜单。可以在逻辑服务端上调用 `IPlayerExtension#openMenu` 来打开菜单。该方法接收服务端侧菜单的 `MenuProvider`，如果需要向客户端同步额外数据，还可以选择性地传入一个 `Consumer<RegistryFriendlyByteBuf>`。

:::note
只有当菜单类型是通过 [`IContainerFactory`][icf] 创建时，才应使用带 `Consumer<RegistryFriendlyByteBuf>` 参数的 `IPlayerExtension#openMenu`。
:::

#### `MenuProvider` {#menuprovider}

`MenuProvider` 是一个接口，包含两个方法：`#createMenu`，用于创建菜单的服务端实例；以及 `#getDisplayName`，返回一个包含菜单标题的组件，传递给[界面][screen]。 `#createMenu` 方法包含三个参数：菜单的容器 id、打开菜单的玩家的物品栏，以及打开菜单的玩家。

可以通过 `SimpleMenuProvider` 轻松创建 `MenuProvider`，它接收一个用于创建服务端菜单的方法引用以及菜单的标题。

```java
// In some implementation with access to the Player on the logical server (e.g. ServerPlayer instance)
// Assume we have ServerPlayer serverPlayer
serverPlayer.openMenu(new SimpleMenuProvider(
    (containerId, playerInventory, player) -> new MyMenu(containerId, playerInventory),
    Component.translatable("menu.title.examplemod.mymenu")
));
```

### 常见实现方式 {#common-implementations}

菜单通常在玩家发生某种交互时打开（例如右键点击方块或实体时）。

#### 方块实现 {#block-implementation}

方块通常通过重写 `BlockBehaviour#useWithoutItem` 来实现菜单。如果处于[逻辑客户端][side]，则该[交互][interaction]返回 `InteractionResult#SUCCESS`；否则，它会打开菜单并返回 `InteractionResult#CONSUME`。

`MenuProvider` 应通过重写 `BlockBehaviour#getMenuProvider` 来实现。原版方法会借此在旁观者模式下查看菜单。

```java
// In some Block subclass
@Override
public MenuProvider getMenuProvider(BlockState state, Level level, BlockPos pos) {
    return new SimpleMenuProvider(/* ... */);
}

@Override
public InteractionResult useWithoutItem(BlockState state, Level level, BlockPos pos, Player player, BlockHitResult result) {
    if (!level.isClientSide && player instanceof ServerPlayer serverPlayer) {
        serverPlayer.openMenu(state.getMenuProvider(level, pos));
    }
    return InteractionResult.sidedSuccess(level.isClientSide);
}
```

:::note
这只是实现该逻辑最简单的方式，并非唯一方式。如果你希望方块仅在满足某些条件时才打开菜单，那么需要事先向客户端同步一些数据，以便在条件不满足时返回 `InteractionResult#PASS` 或 `#FAIL`。
:::

#### 生物实现 {#mob-implementation}

生物（Mob）通常通过重写 `Mob#mobInteract` 来实现菜单。做法与方块实现类似，唯一区别在于：`Mob` 本身应实现 `MenuProvider`，以支持旁观者模式下的查看。

```java
public class MyMob extends Mob implements MenuProvider {
    // ...

    @Override
    public InteractionResult mobInteract(Player player, InteractionHand hand) {
        if (!this.level.isClientSide && player instanceof ServerPlayer serverPlayer) {
            serverPlayer.openMenu(this);
        }
        return InteractionResult.sidedSuccess(this.level.isClientSide);
    }
}
```

:::note
同样地，这只是实现该逻辑最简单的方式，并非唯一方式。
:::

[registered]: ../concepts/registries.md#methods-for-registering
[acm]: #abstractcontainermenu
[mt]: #menutype
[qms]: #quickmovestack
[cap]: ../inventories/capabilities.md#neoforge-provided-capabilities
[screen]: ./screens.md
[icf]: #icontainerfactory
[side]: ../concepts/sides.md#the-logical-side
[interaction]: ../items/interactionpipeline.md

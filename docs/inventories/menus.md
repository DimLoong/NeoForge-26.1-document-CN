---
sidebar_position: 2
---
# Menus {#menus}

菜单（Menu）是图形用户界面（GUI）的一类后端；它们处理与某个所表示的数据持有者进行交互时的逻辑。菜单本身并不是数据持有者，而是一种视图，让用户能够间接修改内部数据持有者的状态。因此，数据持有者不应与任何菜单直接耦合，而应把数据引用传入，供菜单调用和修改。

## `MenuType` {#menutype}

菜单是动态创建和移除的，因此它们不是注册对象。为此，注册的是另一个工厂对象，以便轻松创建和引用菜单的*类型*。对菜单而言，这些工厂对象就是 `MenuType`。

`MenuType` 必须[被注册][registered]。

### `MenuSupplier` {#menusupplier}

`MenuType` 通过向其构造器传入一个 `MenuSupplier` 和一个 `FeatureFlagSet` 来创建。`MenuSupplier` 表示这样一个函数：它接收容器的 id 和查看该菜单的玩家的物品栏，并返回一个新创建的 [`AbstractContainerMenu`][acm]。

```java
// For some DeferredRegister<MenuType<?>> REGISTER
public static final Supplier<MenuType<MyMenu>> MY_MENU = REGISTER.register("my_menu", () -> new MenuType<>(MyMenu::new, FeatureFlags.DEFAULT_FLAGS));

// In MyMenu, an AbstractContainerMenu subclass
public MyMenu(int containerId, Inventory playerInv) {
    super(MY_MENU.get(), containerId);
    // ...
}
```

:::note
容器标识符对每个玩家而言是唯一的。这意味着即便两个不同的玩家在查看同一个数据持有者，相同的容器 id 在这两个玩家身上也代表两个不同的菜单。
:::

`MenuSupplier` 通常负责在客户端创建一个菜单，并使用一些虚拟（dummy）数据引用来存储和交互来自服务端数据持有者的同步信息。

### `IContainerFactory` {#icontainerfactory}

如果客户端需要额外信息（例如数据持有者在世界中的位置），则可以改用子类型 `IContainerFactory`。除了容器 id 和玩家物品栏之外，它还提供一个 `RegistryFriendlyByteBuf`，可用于存储从服务端发送来的额外信息。可以通过 `IMenuTypeExtension#create` 使用 `IContainerFactory` 来创建 `MenuType`。

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

所有菜单都继承自 `AbstractContainerMenu`。菜单接收两个参数：[`MenuType`][mt]，表示菜单本身的类型；以及容器 id，表示该菜单对当前访问者而言的唯一标识符。

:::note
菜单标识符在 0-99 之间循环，每当玩家打开一个菜单时递增。
:::

每个菜单都应包含两个构造器：一个用于在服务端初始化菜单，一个用于在客户端初始化菜单。用于在客户端初始化菜单的那个，就是提供给 `MenuType` 的那个构造器。服务端菜单构造器中包含的任何字段，都应在客户端菜单构造器中有某个默认值。

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

:::note
如果菜单中不需要显示额外数据，那么只需一个构造器即可。
:::

每个菜单实现都必须实现两个方法：`#stillValid` 和 [`#quickMoveStack`][qms]。

### `#stillValid` 与 `ContainerLevelAccess` {#stillvalid-and-containerlevelaccess}

`#stillValid` 决定菜单是否应对给定玩家保持打开。它通常委托给静态的 `#stillValid`，后者接收一个 `ContainerLevelAccess`、玩家以及该菜单所依附的 `Block`。客户端菜单必须始终为此方法返回 `true`，静态的 `#stillValid` 默认就是如此。该实现会检查玩家是否处在数据存储对象所在位置的八个方块范围内。

`ContainerLevelAccess` 在一个封闭的作用域内提供当前的 level 和方块位置。在服务端构造菜单时，可以通过调用 `ContainerLevelAccess#create` 创建一个新的访问对象。客户端菜单构造器可以传入 `ContainerLevelAccess#NULL`，它什么也不做。

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

有些数据需要同时存在于服务端和客户端，以便展示给玩家。为此，菜单实现了一层基础的数据同步：每当当前数据与上一次同步到客户端的数据不一致时便进行同步。对玩家而言，这一检查每刻进行一次。

Minecraft 默认支持两种形式的数据同步：通过 `Slot` 同步 [`ItemStack`][itemstack]，以及通过 `DataSlot` 同步整数。`Slot` 和 `DataSlot` 都是视图，它们持有对数据存储的引用，玩家可在界面中修改这些数据存储（前提是该操作有效）。每一种数据同步方式都会为服务端菜单构造器增加一个参数，而客户端则会创建一个虚拟实例，用于写入从服务端发送来的数据。

#### `DataSlot` {#dataslot}

`DataSlot` 是一个抽象类，应实现一个 getter 和一个 setter 来引用存储在数据存储对象中的数据。客户端菜单构造器应始终通过 `DataSlot#standalone` 提供一个新实例。随后可以使用 `#addDataSlot` 把该数据槽位添加到菜单中。

这些数据槽位以及普通槽位，都应在每次初始化新菜单时重新创建。

:::note
尽管 `DataSlot` 存储的是一个整数，但由于它通过网络发送数值的方式，它实际上被限制为一个 **short**（-32768 到 32767）。整数的高 16 位会被忽略。

NeoForge 对该网络包进行了修补，以便向客户端提供完整的整数。
:::

```java
// Assume we have a DataSlot constructed on each initialization of the server menu

// Client menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory) {
    this(
        containerId, playerInventory,
        // Pass in a dummy slot to hold the server-synced values
        DataSlot.standalone()
    );
}

// Server menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory, DataSlot dataSingle) {
    // Add data slots for handled integers
    this.addDataSlot(dataSingle);

    // ...
}
```

#### `ContainerData` {#containerdata}

如果需要向客户端同步多个整数，可以改用 `ContainerData` 来引用这些整数。该接口的作用类似于索引查找，即每个索引代表一个不同的整数。如果通过 `#addDataSlots` 把 `ContainerData` 添加到菜单中，那么也可以在数据对象本身内部构造 `ContainerData`。该方法会为接口所指定数量的数据各创建一个新的 `DataSlot`。客户端菜单构造器应始终通过 `SimpleContainerData` 提供一个新实例。

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

#### `Slot` {#slot}

`Slot` 表示对物品栏中某个 [`ItemStack`][itemstack] 的引用。每个 `Slot` 至少有四个参数：这些堆叠所在的物品栏、该槽位所具体代表的堆叠的索引，以及该槽位左上角在界面上相对于 `AbstractContainerScreen#leftPos` 和 `#topPos` 进行渲染的 x、y 位置。任何额外的参数通常为该槽位处理独特行为提供上下文，例如只接收被视为燃料的物品，或阻止物品被取出。

服务端菜单构造器应接收物品栏实例或其视图。而客户端菜单构造器则应始终提供一个相同大小的空物品栏实例，用于写入服务端数据。随后可以使用 `#addSlot` 把所需的槽位或其某个子类型添加到菜单中。

对于 [`Container`][container]，客户端菜单通常会传入一个 `SimpleContainer`，并使用普通的 `Slot` 添加。对于 [`ResourceHandler<ItemResource>` Capability][cap]，客户端菜单通常会传入一个 `ItemStacksResourceHandler`，并使用 `ResourceHandlerSlot` 添加。

在大多数情况下，先添加菜单本身包含的各槽位，然后是玩家的物品栏，最后以玩家的快捷栏收尾。要从菜单中访问任何单个 `Slot`，必须根据各槽位的添加顺序来计算其索引。

```java
// Assume we have an inventory from a data object of size 10

// Client menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory) {
    this(containerId, playerInventory, new ItemStacksResourceHandler(10));
}

// Server menu constructor
public MyMenuAccess(int containerId, Inventory playerInventory, StacksResourceHandler<ItemStack, ItemResource> dataInventory) {
    // Check if the data inventory size is some fixed value
    int dataSize = dataInventory.getSlots();
    if (dataSize < 10) {
        throw new IllegalArgumentException("Container size " + dataSize + " is smaller than expected " + 5);
    }

    // Then, add slots for data inventory
    // If you are using a subtype of slot, make sure any data
    // used on the server is also available on the client.

    // Create the inventory by looping through the positions and
    // adding the slots.

    // Two rows
    for (int j = 0; j < 2; j++) {
        // Five columns
        for (int i = 0; i < 5; i++) {
            // Add for each slot in the data inventory
            this.addSlot(new ResourceHandlerSlot(
                // The inventory
                dataInventory,
                // The index modifier to mutate the stored resources
                dataInventory::set,
                // The index of the data inventory this slot represents:
                // rowIndex * columnCount + columnIndex
                j * 5 + i,
                // The x position relative to leftPos
                // Vanilla slots are 18 units by default
                // startX + columnIndex * slotRenderWidth
                44 + i * 18,
                // The y position relative to topPos
                // Vanilla slots are 18 units by default
                // startY + rowIndex * slotRenderHeight
                20 + j * 18
            ))
        }
    }

    // Add slots for player inventory (all 27 + 9 hotbar slots)
    // If you want to customize the 9x3 + 9 grid to something else,
    // loop through like above
    this.addStandardInventorySlots(
        playerInventory,
        // The starting x position relative to leftPos
        8,
        // The starting y position relative to topPos
        84
    );

    // ...
}
```

#### `#quickMoveStack` {#quickmovestack}

`#quickMoveStack` 是任何菜单都必须实现的第二个方法。每当某个堆叠被 shift 点击（即快速移动）出其当前槽位时，就会调用该方法，直到该堆叠被完全移出其原先的槽位，或者已无处可放为止。该方法返回被快速移动的槽位中堆叠的一份副本。

堆叠通常使用 `#moveItemStackTo` 在槽位之间移动，它会把堆叠移动到第一个可用的槽位中。它接收要移动的堆叠、尝试移入的第一个槽位索引（含）、最后一个槽位索引（不含），以及是从首到尾检查槽位（`false` 时）还是从尾到首检查（`true` 时）。

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
    Slot quickMovedSlot = this.slots.get(quickMovedSlotIndex);
  
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
            quickMovedSlot.onQuickCraft(rawStack, quickMovedStack);
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
            quickMovedSlot.setByPlayer(ItemStack.EMPTY);
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

一旦菜单类型已注册、菜单本身已完成，并且已经附加了[界面][screen]，玩家便可以打开这个菜单。菜单可以通过在逻辑服务端上调用 `IPlayerExtension#openMenu` 来打开。该方法接收服务端菜单的 `MenuProvider`，如果需要向客户端同步额外数据，还可以可选地接收一个 `Consumer<RegistryFriendlyByteBuf>`。

:::note
只有当菜单类型是使用 [`IContainerFactory`][icf] 创建时，才应使用带 `Consumer<RegistryFriendlyByteBuf>` 参数的 `IPlayerExtension#openMenu`。
:::

#### `MenuProvider` {#menuprovider}

`MenuProvider` 是一个接口，包含两个方法：`#createMenu`，用于创建菜单的服务端实例；`#getDisplayName`，返回一个包含菜单标题的 component，以传递给[界面][screen]。`#createMenu` 方法包含三个参数：菜单的容器 id、打开该菜单的玩家的物品栏，以及打开该菜单的玩家。

可以使用 `SimpleMenuProvider` 轻松创建 `MenuProvider`，它接收一个用于创建服务端菜单的方法引用以及菜单的标题。

```java
// In some implementation with access to the Player on the logical server (e.g. ServerPlayer instance)
// Assume we have ServerPlayer serverPlayer
serverPlayer.openMenu(new SimpleMenuProvider(
    (containerId, playerInventory, player) -> new MyMenu(containerId, playerInventory, /* server parameters */),
    Component.translatable("menu.title.examplemod.mymenu")
));
```

### 常见实现 {#common-implementations}

菜单通常在玩家进行某种交互时打开（例如当方块或实体被右键点击时）。

#### 方块实现 {#block-implementation}

方块通常通过重写 `BlockBehaviour#useWithoutItem` 来实现菜单，并为该[交互][interaction]返回 `InteractionResult#SUCCESS`。

`MenuProvider` 应通过重写 `BlockBehaviour#getMenuProvider` 来实现。原版方法用它在旁观模式下查看菜单。

```java
// In some Block subclass
@Override
public MenuProvider getMenuProvider(BlockState state, Level level, BlockPos pos) {
    return new SimpleMenuProvider(/* ... */);
}

@Override
public InteractionResult useWithoutItem(BlockState state, Level level, BlockPos pos, Player player, BlockHitResult result) {
    if (!level.isClientSide() && player instanceof ServerPlayer serverPlayer) {
        serverPlayer.openMenu(state.getMenuProvider(level, pos));
    }

    return InteractionResult.SUCCESS;
}
```

:::note
这是实现该逻辑最简单的方式，但并非唯一方式。如果你想让方块仅在满足特定条件时才打开菜单，那么需要事先向客户端同步一些数据，以便在条件不满足时返回 `InteractionResult#PASS` 或 `#FAIL`。
:::

#### 怪物实现 {#mob-implementation}

怪物通常通过重写 `Mob#mobInteract` 来实现菜单。其做法与方块实现类似，唯一的区别是 `Mob` 自身应实现 `MenuProvider`，以支持旁观模式下的查看。

```java
public class MyMob extends Mob implements MenuProvider {
    // ...

    @Override
    public InteractionResult mobInteract(Player player, InteractionHand hand) {
        if (!this.level.isClientSide() && player instanceof ServerPlayer serverPlayer) {
            serverPlayer.openMenu(this);
        }

        return InteractionResult.SUCCESS;
    }
}
```

:::note
再说一次，这是实现该逻辑最简单的方式，但并非唯一方式。
:::

[registered]: ../concepts/registries.md#methods-for-registering
[acm]: #abstractcontainermenu
[mt]: #menutype
[qms]: #quickmovestack
[cap]: capabilities.md#neoforge-provided-capabilities
[container]: container.md
[screen]: ../rendering/screens.md
[icf]: #icontainerfactory
[side]: ../concepts/sides.md#the-logical-side
[interaction]: ../items/interactions.md#right-clicking-an-item
[itemstack]: ../items/index.md#itemstacks

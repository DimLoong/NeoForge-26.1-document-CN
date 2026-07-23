---
sidebar_position: 0
---
# Containers {#containers}

[方块实体（BlockEntity）][blockentity]的一个常见用途是存储某类物品。Minecraft 中一些最基础的[方块][block]，如熔炉或箱子，正是为此使用了方块实体。为了在某个对象上存储物品，Minecraft 使用 `Container`。

`Container` 接口定义了诸如 `#getItem`、`#setItem` 和 `#removeItem` 等方法，可用于查询和更新容器。由于它是接口，本身并不真正持有底层列表或其他数据结构，这一点由实现方决定。

正因如此，`Container` 不仅可以在方块实体上实现，也可以在任何其他类上实现。典型的例子包括实体的物品栏，以及常见的模组[物品][item]（如背包）。

:::warning
NeoForge 在许多场合提供了 `ItemStacksResourceHandler` 类作为 `Container` 的替代品。只要可能，就应优先使用它而非 `Container`，因为它能与其他 `Container`/`ItemStacksResourceHandler` 更清晰地交互。

本文之所以存在，主要是为了在阅读原版代码时供参考，或者当你在多个加载器上开发 Mod 时使用。只要可能，请在你自己的代码中始终使用 `ItemStacksResourceHandler`！关于它的文档仍在编写中。
:::

## 基础的 Container 实现 {#basic-container-implementation}

只要你满足了所规定的方法（与 Java 中任何其他接口一样），Container 可以用任何你喜欢的方式实现。不过，通常会使用一个固定长度的 `NonNullList<ItemStack>` 作为底层结构。单槽位容器也可以直接改用一个 `ItemStack` 字段。

例如，一个大小为 27 个槽位（一个箱子）的基础 `Container` 实现可能如下所示：

```java
public class MyContainer implements Container {
    private final NonNullList<ItemStack> items = NonNullList.withSize(
            // The size of the list, i.e. the amount of slots in our container.
            27,
            // The default value to be used in place of where you'd use null in normal lists.
            ItemStack.EMPTY
    );

    // The amount of slots in our container.
    @Override
    public int getContainerSize() {
        return 27;
    }

    // Whether the container is considered empty.
    @Override
    public boolean isEmpty() {
        return this.items.stream().allMatch(ItemStack::isEmpty);
    }

    // Return the item stack in the specified slot.
    @Override
    public ItemStack getItem(int slot) {
        return this.items.get(slot);
    }

    // Remove the specified amount of items from the given slot, returning the stack that was just removed.
    // We defer to ContainerHelper here, which does this as expected for us.
    // However, we must call #setChanged manually.
    @Override
    public ItemStack removeItem(int slot, int amount) {
        ItemStack stack = ContainerHelper.removeItem(this.items, slot, amount);
        this.setChanged();
        return stack;
    }

    // Remove all items from the specified slot, returning the stack that was just removed.
    // We again defer to ContainerHelper here, and we again have to call #setChanged manually.
    @Override
    public ItemStack removeItemNoUpdate(int slot) {
        ItemStack stack = ContainerHelper.takeItem(this.items, slot);
        this.setChanged();
        return stack;
    }

    // Set the given item stack in the given slot. Limit to the max stack size of the container first.
    @Override
    public void setItem(int slot, ItemStack stack) {
        stack.limitSize(this.getMaxStackSize(stack));
        this.items.set(slot, stack);
        this.setChanged();
    }

    // Call this when changes are done to the container, i.e. when item stacks are added, modified, or removed.
    // For example, you could call BlockEntity#setChanged here.
    @Override
    public void setChanged() {

    }

    // Whether the container is considered "still valid" for the given player. For example, chests and
    // similar blocks check if the player is still within a given distance of the block here.
    @Override
    public boolean stillValid(Player player) {
        return true;
    }

    // Clear the internal storage, setting all slots to empty again.
    @Override
    public void clearContent() {
        items.clear();
        this.setChanged();
    }
}
```

### `SimpleContainer` {#simplecontainer}

`SimpleContainer` 类是容器的一个基础实现，并额外加入了一些便利功能。如果你需要一个没有任何特殊要求的容器实现，就可以使用它。

### `BaseContainerBlockEntity` {#basecontainerblockentity}

`BaseContainerBlockEntity` 类是 Minecraft 中许多重要方块实体的基类，例如箱子及类箱子方块、各类熔炉、漏斗、发射器、投掷器、酿造台等。

除了 `Container` 之外，它还实现了 `MenuProvider` 和 `Nameable` 接口：

- `Nameable` 定义了若干与设置（自定义）名称相关的方法，除了许多方块实体外，`Entity` 等类也实现了它。它使用了 [`Component` 系统][component]。
- 而 `MenuProvider` 则定义了 `#createMenu` 方法，允许从容器构造出一个 [`AbstractContainerMenu`][menu]。这意味着，如果你想要一个不带关联 GUI 的容器（例如唱片机），使用这个类就不合适了。

`BaseContainerBlockEntity` 通过 `#getItems` 和 `#setItems` 两个方法，把我们通常会对 `NonNullList<ItemStack>` 发起的所有调用都封装了起来，大幅减少了需要编写的样板代码。`BaseContainerBlockEntity` 的一个示例实现可能如下所示：

```java
public class MyBlockEntity extends BaseContainerBlockEntity {
    // The container size. This can of course be any value you want.
    public static final int SIZE = 9;
    // Our item stack list. This is not final due to #setItems existing.
    private NonNullList<ItemStack> items = NonNullList.withSize(SIZE, ItemStack.EMPTY);

    // The constructor, like before.
    public MyBlockEntity(BlockPos pos, BlockState blockState) {
        super(MY_BLOCK_ENTITY.get(), pos, blockState);
    }

    // The container size, like before.
    @Override
    public int getContainerSize() {
        return SIZE;
    }

    // The getter for our item stack list.
    @Override
    protected NonNullList<ItemStack> getItems() {
        return items;
    }

    // The setter for our item stack list.
    @Override
    protected void setItems(NonNullList<ItemStack> items) {
        this.items = items;
    }

    // The display name of the menu. Don't forget to add a translation!
    @Override
    protected Component getDefaultName() {
        return Component.translatable("container.examplemod.myblockentity");
    }

    // The menu to create from this container. See below for what to return here.
    @Override
    protected AbstractContainerMenu createMenu(int containerId, Inventory inventory) {
        return null;
    }
}
```

请记住，这个类同时是一个 `BlockEntity` 和一个 `Container`。这意味着你可以把该类用作方块实体的父类，从而得到一个自带已实现容器的、可正常工作的方块实体。

:::note
实现了 `Container` 的 `BlockEntity` 默认会处理其内容物的掉落。如果你选择不实现 `Container`，那么你需要自行处理[移除逻辑][beremove]。
:::

### `WorldlyContainer` {#worldlycontainer}

`WorldlyContainer` 是 `Container` 的子接口，允许按 `Direction`（方向）访问给定 `Container` 的槽位。它主要面向那些只向特定面暴露部分容器内容的方块实体。例如，一台机器从某一面输出、从其他所有面接收输入（或反之），就可以使用它。该接口的一个简单实现可能如下所示：

```java
// See BaseContainerBlockEntity methods above. You can of course extend BlockEntity directly
// and implement Container yourself if needed.
public class MyBlockEntity extends BaseContainerBlockEntity implements WorldlyContainer {
    // other stuff here
    
    // Assume that slot 0 is our output and slots 1-8 are our inputs.
    // Further assume that we output to the top and take inputs from all other sides.
    private static final int[] OUTPUTS = new int[]{0};
    private static final int[] INPUTS = new int[]{1, 2, 3, 4, 5, 6, 7, 8};

    // Return an array of exposed slot indices based on the passed Direction.
    @Override
    public int[] getSlotsForFace(Direction side) {
        return side == Direction.UP ? OUTPUTS : INPUTS;
    }

    // Whether items can be placed through the given side at the given slot.
    // For our example, we return true only if we're not inputing from above and are in the index range [1, 8].
    @Override
    public boolean canPlaceItemThroughFace(int index, ItemStack itemStack, @Nullable Direction direction) {
        return direction != Direction.UP && index > 0 && index < 9;
    }

    // Whether items can be taken from the given side and the given slot.
    // For our example, we return true only if we're pulling from above and from slot index 0.
    @Override
    public boolean canTakeItemThroughFace(int index, ItemStack stack, Direction direction) {
        return direction == Direction.UP && index == 0;
    }
}
```

## 使用 Container {#using-containers}

现在我们已经创建了容器，接下来就来使用它们！

由于 `Container` 与 `BlockEntity` 之间有相当多的重叠，检索容器的最佳方式是（在可能的情况下）把方块实体强制转换为 `Container`：

```java
if (blockEntity instanceof Container container) {
    // do something with the container
}
```

随后就可以对该容器使用我们前面提到的方法，例如：

```java
// Get the first item in the container.
ItemStack stack = container.getItem(0);

// Set the first item in the container to dirt.
container.setItem(0, new ItemStack(Items.DIRT));

// Removes a quantity of (up to) 16 from the third slot.
container.removeItem(2, 16);
```

:::warning
如果尝试访问超出容器大小的槽位，容器可能会抛出异常。也可能返回 `ItemStack.EMPTY`，例如 `SimpleContainer` 就是这样。
:::

### `ContainerUser` {#containerusers}

能够访问容器的生物实体会实现 `ContainerUser`。每个用户都定义了自己是否打开了某个容器，以及该实体与容器交互的最大方块距离。当容器对象被交互时（例如右键点击箱子），`Container` 会以该 `ContainerUser` 为参数调用 `startOpen`；当容器对象被关闭时（例如离开箱子菜单），则调用 `stopOpen`。

这些方法通常通过 `ContainerOpenersCounter` 来跟踪打开该容器的生物实体数量，后者被用于某些实体 AI 和渲染。

## `ItemStack` 上的 `Container` {#containers-on-itemstacks}

到目前为止，我们主要讨论了 `BlockEntity` 上的 `Container`。不过，它们也可以借助 `minecraft:container` [数据组件][datacomponent]应用到 [`ItemStack`][itemstack] 上：

```java
// We use SimpleContainer as the superclass here so we don't have to reimplement the item handling logic ourselves.
// Due to implementation details of SimpleContainer, this may lead to race conditions if multiple parties
// can access the container at the same time, so we're just going to assume our mod doesn't allow that.
// You may of course use a different implementation of Container (or implement Container yourself) if needed.
public class MyBackpackContainer extends SimpleContainer {
    // The item stack this container is for. Passed into and set in the constructor.
    private final ItemStack stack;
    
    public MyBackpackContainer(ItemStack stack) {
        // We call super with our desired container size.
        super(27);
        // Setting the stack field.
        this.stack = stack;
        // We load the container contents from the data component (if present), which is represented
        // by the ItemContainerContents class. If absent, we use ItemContainerContents.EMPTY.
        ItemContainerContents contents = stack.getOrDefault(DataComponents.CONTAINER, ItemContainerContents.EMPTY);
        // Copy the data component contents into our item stack list.
        contents.copyInto(this.getItems());
    }

    // When the contents are changed, we save the data component on the stack.
    @Override
    public void setChanged() {
        super.setChanged();
        this.stack.set(DataComponents.CONTAINER, ItemContainerContents.fromItems(this.getItems()));
    }
}
```

大功告成，你已经创建了一个以物品为载体的容器！调用 `new MyBackpackContainer(stack)` 即可为某个菜单或其他用途创建一个容器。

:::warning
请注意，直接与 `Container` 打交道的菜单在修改其 `ItemStack` 时必须调用 `#copy()`，否则数据组件的不可变性约定就会被破坏。为此，NeoForge 为你提供了 `StackCopySlot` 类。
:::

## `Entity` 上的 `Container` {#containers-on-entitys}

[`Entity`][entity] 上的 `Container` 较为棘手：无法普适地判定一个实体是否拥有容器。这完全取决于你处理的是哪个实体，因此可能需要大量的特殊处理。

如果你要自己创建实体，那么没有什么能阻止你直接在它上面实现 `Container`，不过请注意你将无法使用 `SimpleContainer` 之类的父类（因为父类已是 `Entity`）。

### `Mob` 上的 `Container` {#containers-on-mobs}

`Mob` 并不实现 `Container`，但它们（除其他接口外）实现了 `EquipmentUser` 接口。该接口定义了 `#setItemSlot(EquipmentSlot, ItemStack)`、`#getItemBySlot(EquipmentSlot)` 和 `#setDropChance(EquipmentSlot, float)` 等方法。虽然从代码上看它与 `Container` 无关，但其功能相当类似：我们将槽位（这里是装备槽位）与 `ItemStack` 关联起来。

与 `Container` 最显著的区别在于，这里没有类似列表的顺序（尽管 `Mob` 在后台使用 `NonNullList<ItemStack>`）。访问不通过槽位索引进行，而是通过七个 `EquipmentSlot` 枚举值：`MAINHAND`、`OFFHAND`、`FEET`、`LEGS`、`CHEST`、`HEAD` 和 `BODY`（其中 `BODY` 用于马铠和狗的护甲）。

与怪物的“槽位”交互的示例大致如下：

```java
// Get the item stack in the HEAD (helmet) slot.
ItemStack helmet = mob.getItemBySlot(EquipmentSlot.HEAD);

// Put bedrock into the mob's FEET (boots) slot.
mob.setItemSlot(EquipmentSlot.FEET, new ItemStack(Items.BEDROCK));

// Enable that bedrock to always drop if the mob is killed.
mob.setDropChance(EquipmentSlot.FEET, 1f);
```

### `InventoryCarrier` {#inventorycarrier}

`InventoryCarrier` 是由某些生物实体（如村民）实现的接口。它声明了一个 `#getInventory` 方法，返回一个 `SimpleContainer`。该接口供那些需要真正物品栏、而不只是 `EquipmentUser` 所提供装备槽位的非玩家实体使用。

### `Player` 上的 `Container`（玩家物品栏） {#containers-on-players-player-inventory}

玩家的物品栏通过 `Inventory` 类实现，该类既实现了 `Container`，也实现了前文提到的 `Nameable` 接口。这个 `Inventory` 实例随后作为 `Player` 上一个名为 `inventory` 的字段存储，可通过 `Player#getInventory` 访问。该物品栏可以像任何其他容器一样进行交互。

物品栏内容存储在两处：

- `NonNullList<ItemStack> items` 列表涵盖 36 个主物品栏槽位，包括九个快捷栏槽位（索引 0-8）。
- `EntityEquipment equipment` 映射存储 `EquipmentSlot` 堆叠：护甲槽位（`FEET`、`LEGS`、`CHEST`、`HEAD`）、`OFFHAND`、`BODY` 和 `SADDLE`，按此顺序排列。  

在遍历物品栏内容时，推荐先遍历 `items`，再借助 `Inventory#EQUIPMENT_SLOT_MAPPING` 获取索引来遍历 `equipment`。

[beremove]: ../blockentities/index.md#removing-block-entities
[block]: ../blocks/index.md
[blockentity]: ../blockentities/index.md
[component]: ../resources/client/i18n.md#components
[datacomponent]: ../items/datacomponents.md
[entity]: ../entities/index.md
[item]: ../items/index.md
[itemstack]: ../items/index.md#itemstacks
[menu]: menus.md

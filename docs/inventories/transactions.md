# Transactions {#transactions}

事务（Transaction）是 NeoForged 新增的一套系统，用于管理不同物品栏之间转移内容物时的通信。每一次转移都通过三个基本概念来管理：被转移的 `Resource`、代表物品栏的 `ResourceHandler`，以及负责促成通信的 `Transaction`。

## 资源（Resource） {#resources}

`Resource` 表示被事务操作的底层对象。每个 `Resource` 都应是不可变的，它只包含所使用对象的种类，而不包含被转移对象的数量。例如，“五个苹果换一颗绿宝石”这笔交易包含的 `Resource` 是“苹果”和“绿宝石”，而不是“五个苹果”和“一颗绿宝石”。

因此，每个 `Resource` 都具有以下三个特性：

* **不可变性**：`Resource` 对象中存储的任何内容都应保持不变。
* **与数量无关**：`Resource` 不包含任何关于某个对象有多少个的信息。
* **相等性**：无论 `Resource` 如何构造，只要它们表示同一个对象，它们就必须相等。

NeoForge 为[物品][items]（通过 `ItemResource`）和流体（通过 `FluidResource`）提供了资源，其表示方式是把对象及其独有的[数据组件][datacomponent]一并表示出来。

```java
// Create the resource from its backing object
ItemResource item = ItemResource.of(Items.EMERALD);

ItemStack stack = new ItemStack(Items.APPLE);
stack.set(DataComponents.CUSTOM_NAME, Component.literal("Apple?"));
ItemResource itemWithComponents = ItemResource.of(stack);

FluidResource fluid = FluidResource.of(Fluids.WATER);
```

我们也可以像这样创建自己的 `Resource`：

```java
// Let's assume we are trying to represent the following object:
public class ExampleObject {
    public static final ExampleObject EMPTY = new ExampleObject(-1, 0, Map.of());

    public static final Codec<ExampleObject> CODEC = RecordCodecBuilder.of(instance ->
        instance.group(
            ExtraCodecs.NON_NEGATIVE_INT.fieldOf("id").forGetter(ExampleObject::id),
            ExtraCodecs.NON_NEGATIVE_INT.optionalFieldOf("count", 1).forGetter(ExampleObject::count),
            Codec.unboundedMap(Codec.STRING, Codec.BOOL).optionalFieldOf("flags", Map::of).forGetter(ExampleObject::flags)
        ).apply(instance, ExampleObject::new)
    );

    private final int id;
    private final Map<String, Boolean> flags;
    private int count;

    public ExampleObject(int id, int count, Map<String, Boolean> flags) {
        // ...
    }

    public int id() {
        return this.id;
    }

    public int count() {
        return this.count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public Map<String, Boolean> flags() {
        return this.flags;
    }
}

// Create our resource.
public final class ExampleResource implements Resource {

    private final ExampleObject object;

    public ExampleResource(ExampleObject object) {
        // Enforce immutability and ignore count.
        this.object = new ExampleObject(
            object.id(), 1, ImmutableMap.copyOf(object.flags())
        );
    }

    public int id() {
        return this.object.id();
    }

    public Map<String, Boolean> flags() {
        return this.object.flags();
    }

    // Defines when the backing object is considered empty.
    // This is the only method that `Resource` defines.
    @Override
    public boolean isEmpty() {
        return this.object.id() == -1;
    }

    // Equality for classes is defined by implementing `hashCode`
    // and `equals`. Records already do this for you.
    @Override
    public int hashCode() {
        // Since our backing object is not unique by itself, we
        // extract the components that make it unique and construct
        // the hash.
        return Objects.hash(this.object.id(), this.object.flags());
    }

    @Override
    public boolean equals(Object obj) {
        // Check identity equality.
        if (this == obj) return true;
        // Check if same class.
        if (obj == null || this.getClass() != obj.getClass()) return false;
        // Check the individual components of the resource.
        ExampleResource other = (ExampleResource) obj;
        return this.object.id() == other.object.id()
            && this.object.flags().equals(other.object.flags());
    }

    // Just an ease of convenience to more easily understand what
    // the resource is representing.
    @Override
    public String toString() {
        return Integer.toString(this.object.id()) + "[" 
            + this.object.flags().size() + "]";
    }
}
```

:::note
虽然 `Resource` 可以用于基本类型，但并非严格必需（例如能量就没有 `Resource`，因为它由一个 `long` 支撑）。不过，这样做需要你自行重新实现部分资源行为，因为下文所述的[处理器系统][handler]要求使用 `Resource`。
:::

## 资源处理器（Resource Handler） {#resource-handlers}

`ResourceHandler<T>` 表示事务中作为底层的物品栏，其中 `T` 是支撑该对象的 `Resource` 的类型。每个处理器都通过一个索引将其关联到相应的内容物（例如索引 `0` 映射到第一个槽位，索引 `1` 映射到第二个，以此类推）。对每个索引，你都可以检查某个 `Resource` 能否被容纳在该位置（`isValid`），或者该位置已经存储了什么 `Resource`（`getResource`）。你还可以检查该位置能存储多少个 `Resource`（`getCapacityAsLong` / `getCapacityAsInt`），以及该位置已存储了多少个某种 `Resource`（`getAmountAsLong` / `getAmountAsInt`）。处理器可访问的索引数量就是它的 `size`（大小）。

为了修改底层物品栏的内容物，`ResourceHandler` 提供了两个方法：`insert` 用于放入 `Resource`，`extract` 用于取出 `Resource`。`insert` 和 `extract` 接收三个参数：被操作的 `Resource`、要放入/取出的数量（`int`），以及表示执行该操作的[事务][transaction]的 `TransactionContext`，返回实际放入/取出的数量。这两个方法都会寻找第一个可用于放入/取出内容物的索引。如果处理器只应对某个特定索引进行操作，那么 `insert` 和 `extract` 都提供了一个重载，接收要放入/取出 `Resource` 的 `int` 索引。

```java
// For some ResourceHandler<ItemResource> handler

// Get the resource stored in the handler.
ItemResource item = handler.getResource(0);
int count = handler.getAmountAsInt(0);

// Get information about the handler itself.
int handlerSize = handler.size();
int indexCapacity = handler.getCapacityAsInt(0);
boolean canAcceptApples = handler.isValid(0, ItemResource.of(Items.APPLE));
```

根据底层物品栏的不同，`ResourceHandler` 有许多不同的类型。有些处理器包裹现有的原版物品栏（例如面向 [`Container`][container] 的 `VanillaContainerWrapper`、面向[玩家 `Inventory`][playerinv] 的 `PlayerInventoryWrapper`、面向[生物实体][livingentity]装备槽位的 `LivingEntityEquipmentWrapper`）。

```java
// Wrapping around an existing container.
Container container = new SimpleContainer(5);
ResourceHandler<ItemResource> containerWrapper = VanillaContainerWrapper.of(container);

// Wrapping around a `Player` player inventory.
ResourceHandler<ItemResource> playerInv = PlayerInventoryWrapper.of(player);

// Wrapping around a specific equipment slot for some LivingEntity entity.
ResourceHandler<ItemResource> head = LivingEntityEquipmentWrapper.of(entity, EquipmentSlot.HEAD);
```

另一些处理器本身就是物品栏，为那些想利用这套系统而又不想做太多实现工作的人提供了便利（例如面向 [`ItemStack`][itemstack] 列表的 `ItemStacksResourceHandler`、面向 `FluidStack` 列表的 `FluidStacksResourceHandler`）。

```java
// Creating an `ItemStack` storage.
ItemStacksResourceHandler itemStorage = new ItemStacksResourceHandler(5);

// Creating a `FluidStack` storage.
FluidStacksResourceHandler fluidStorage = new FluidStacksResourceHandler(
    // The size of the handler
    5,
    // The maximum capacity of every index
    1000
);
```

:::note
如果你打算把某个 `StacksResourceHandler` 用作物品栏，强烈建议重写 `onContentsChanged`，以处理任何磁盘写入或网络同步。

```java
// Example for block entities
public class ExampleBlockEntity extends BlockEntity {

    private final ItemStacksResourceHandler storage = new ItemStacksResourceHandler(5) {
        @Override
        protected void onContentsChanged(int index, ItemStack previousContents) {
            // Schedule the block entity for saving
            BlockEntity.this.setChanged();
        }
    };

    // ...
}
```

:::

我们也可以像这样创建自己的 `ResourceHandler`：

```java
public class ExampleResourceHandler implements ResourceHandler<ExampleResource> {

    private ExampleObject object;

    public ExampleResourceHandler(ExampleObject object) {
        this.object = object;
    }
    
    @Override
    public int size() {
        // The size of the handler.
        return 1;
    }

    @Override
    public ExampleResource getResource(int index) {
        // Gets the resource at the desired index.

        // Check the bounds.
        Objects.checkIndex(index, this.size());
        // Then get the resource.
        return new ExampleResource(this.object);
    }

    @Override
    public long getAmountAsLong(int index) {
        // Gets the amount from the content.
        Objects.checkIndex(index, this.size());
        return this.object.count();
    }

    @Override
    public long getCapacityAsLong(int index, ExampleResource resource) {
        // The capacity at a given index for the stored resource.
        Objects.checkIndex(index, this.size());
        return Integer.MAX_VALUE;
    }

    @Override
    public boolean isValid(int index, ExampleResource resource) {
        // Whether the resource can be set at the index, regardless of its
        // current contents.
        Objects.checkIndex(index, this.size());
        // Make sure the resource isn't empty.
        TransferPreconditions.checkNonEmpty(resource);
        return true;
    }

    @Override
    public int insert(int index, ExampleResource resource, int amount, TransactionContext transaction) {
        // Inserts the resource into the given index, returning the amount put in.

        // Validate arguments.
        Objects.checkIndex(index, size());
        TransferPreconditions.checkNonEmptyNonNegative(resource, amount);

        // Check whether the resource can be inserted from this location.
        ExampleObject current = this.object;
        if (current.count() == 0 || (current.id() == resource.id() && current.flags().equals(resource.flags()) && this.isValid(index, resource))) {
            // Compute the amount to insert.
            int insertedAmount = Math.min(amount, this.getCapacityAsInt(index, resource) - current.count());

            if (insertedAmount > 0) {
                // Update the content.
                if (current.count() == 0) {
                    this.object = new ExampleObject(
                        resource.id(), insertedAmount, new HashMap<>(resource.flags())
                    );
                } else {
                    this.object.setCount(current.count() + insertedAmount);
                }

                // Return the amount inserted.
                return insertedAmount;
            }
        }

        // If not matching, insert nothing.
        return 0;
    }

    @Override
    public int extract(int index, ExampleResource resource, int amount, TransactionContext transaction) {
        // Extracts the contents from the given index, returning the amount taken out.

        // Validate arguments.
        Objects.checkIndex(index, size());
        TransferPreconditions.checkNonEmptyNonNegative(resource, amount);

        // Check whether the resource can be extracted from this location.
        ExampleObject current = this.object;
        if (current.id() == resource.id() && current.flags().equals(resource.flags())) {
            // Compute the amount to extract.
            int extracted = Math.min(current.count(), amount);

            if (extracted > 0) {
                // Update the content.
                this.object.setCount(current.count() - extracted);

                // Return the amount extracted.
                return extracted;
            }
        }

        // If not matching, extract nothing.
        return 0;
    }
}
```

或者为 `StacksResourceHandler`：

```java
public class ExampleStacksResourceHandler extends StacksResourceHandler<ExampleObject, ExampleResource> {

    public ExampleStacksResourceHandler(int size) {
        super(size, ExampleObject.EMPTY, ExampleObject.CODEC);
    }

    public ExampleStacksResourceHandler(NonNullList<ExampleObject> objects) {
        super(objects, ExampleObject.EMPTY, ExampleObject.CODEC);
    }

    @Override
    public ExampleResource getResourceFrom(ExampleObject object) {
        // Constructs the resource from the content.
        return new ExampleResource(object);
    }

    @Override
    public int getAmountFrom(ExampleObject object) {
        // Gets the amount from the content.
        return object.count();
    }

    @Override
    protected ExampleObject getStackFrom(ExampleResource resource, int amount) {
        // Create the content from its resource.
        return new ExampleObject(resource.id(), amount, new HashMap<>(resource.flags()));
    }

    @Override
    protected int getCapacity(int index, ExampleResource resource) {
        // The capacity at a given index for the stored resource.
        return Integer.MAX_VALUE;
    }

    @Override
    protected ExampleObject copyOf(ExampleObject object) {
        // Constructs a copy of the content.
        return new ExampleObject(object.id(), object.count(), new HashMap<>(object.flags()));
    }

    @Override
    public boolean matches(ExampleObject object, ExampleResource resource) {
        // Check if an object matches the stored resource.
        return object.id() == resource.id() && object.flags().equals(resource.flags());
    }
}
```

:::tip
NeoForge 还提供了一个 `ResourceStacksResourceHandler`，它以 `ResourceStack` 作为存储内容，适用于那些 `Resource` 实现本身就是物品栏内实际对象的情形。
:::

### 能量处理器 {#energy-handler}

`EnergyHandler` 是 `ResourceHandler` 的一个精简版本，只包含一个存储 `long` 的索引。因此，它只检查能存储多少单位（`getCapacityAsLong` / `getCapacityAsInt`）以及已存储多少单位（`getAmountAsLong` / `getAmountAsInt`）。此外，由于只有一个索引，`insert` 和 `extract` 不再接收索引参数，也不再需要 `Resource`，因为其底层对象是一个基本类型。

与 `ResourceHandler` 一样，`EnergyHandler` 也有不同类型，取决于你的用例。最常见的是 `SimpleEnergyHandler`，它提供了一个基础实现，并带有对 insert / extract 的限制。

```java
// Create an energy handler.
EnergyHandler energy = new SimpleEnergyHandler(1000);
```

### 物品访问（Item Access） {#item-access}

`ItemAccess` 同样是 `ResourceHandler` 的一个精简版本，提供对某个特定存储位置中单个物品的访问。它通常用于[物品 Capability][capabilities] 中，以修改该 Capability 所依附的物品。因此，它只提供当前物品的资源（`getResource`）和数量（`getAmount`）。此外，由于只有一个索引，`insert` 和 `extract` 不再接收索引参数。不过，由于物品也可以存储数据，`ItemAccess` 提供了一种方式，可通过 `getCapability` 借助 [Capability][capabilities] 访问所存储的数据，前提是它是一个带有 `ItemAccess` 上下文的 `ItemCapability`。

与 `ResourceHandler` 一样，`ItemAccess` 也有不同类型，取决于用例。最常见的两种是 `PlayerItemAccess`（包裹玩家物品栏中的某个特定槽位）和 `HandlerItemAccess`（包裹某个 `ResourceHandler` 中的某个特定索引）。

```java
// Create an item access for some location.
// Assume we have some `Player` player.
ItemAccess access = ItemAccess.forPlayerInteraction(player, InteractionHand.MAIN_HAND);

// Get the data about the referenced item
ItemResource item = access.getResource();
int count = access.getAmount();

// Gets the item capability on the stack.
// For example, if the item is a fluid container:
ResourceHandler<FluidResource> fluidContainer = access.getCapability(Capabilities.Fluid.ITEM);
```

## 在处理器之间转移 {#transferring-between-handlers}

`Transaction` 促成 `Resource` 在 `ResourceHandler` 之间的转移。在这里，资源从各自的 `ResourceHandler` 中被 `insert`（放入）和 `extract`（取出）。一次转移只有在完成放入和取出、并且调用了 `Transaction#commit` 之后，才被视为有效或完整。

`Transaction` 是 `AutoCloseable` 的，这意味着发起事务的标准方式是通过 try-with-resources 块，配合 `Transaction#openRoot` 使用：

```java
// Let's assume we have two `ResourceHandler<ItemResource>`s apples, emeralds.

// Open the transaction.
try (Transaction tx = Transaction.openRoot()) {
    // Insert and extract from resource handlers.
    ItemResource appleResource = ItemResource.of(Items.APPLE);
    ItemResource emeraldResource = ItemResource.of(Items.EMERALD);

    int numOfApples = apples.extract(appleResource, 5, tx);
    int numOfEmeralds = emeralds.extract(emeraldResource, 1, tx);

    // Perform any validation necessary.
    if (numOfApples == 5 && numOfEmeralds == 1) {
        numOfEmeralds = apples.insert(emeraldResource, numOfEmeralds, tx);
        numOfApples = emeralds.insert(appleResource, numOfApples, tx);

        if (numOfApples == 5 && numOfEmeralds == 1) {
            // Mark the transaction as complete.
            tx.commit();
        }
    }
}
```

:::tip

`ResourceHandlerUtil` 提供了许多有用的方法，用于检查某个 `ResourceHandler` 的当前状态，或在处理器之间进行转移。例如，上面绿宝石换苹果的交易本可以简化成这样：

```java
// Let's assume we have two `ResourceHandler<ItemResource>`s apples, emeralds.

// Open the transaction.
try (Transaction tx = Transaction.openRoot()) {
    // Insert and extract from resource handlers.
    ItemResource appleResource = ItemResource.of(Items.APPLE);
    ItemResource emeraldResource = ItemResource.of(Items.EMERALD);

    int applesMoved = ResourceHandlerUtil.moveStacking(
        // Moving from apples -> emeralds.
        apples, emeralds,
        // Checks what resource(s) to move.
        appleResource::equals,
        // The number of the resource to move.
        5,
        // The transaction context.
        tx
    );
    int emeraldsMoved = ResourceHandlerUtil.moveStacking(
        emeralds, apples, emeraldResource::equals, 1, tx
    );;

    // Perform any validation necessary.
    if (applesMoved == 5 && emeraldsMoved == 1) {
        // Mark the transaction as complete.
        tx.commit();
    }
}
```

:::

如果同一时刻发生多笔事务，`Transaction` 也可以通过 `Transation#open` 在其内部嵌套 `Transaction`。

```java
// Open the transaction.
try (Transaction tx = Transaction.openRoot()) {
    // Transaction A
    try (Transaction atx = Transaction.open(tx)) {
        // Insert and extract from resource handlers.

        // ...

        // Mark as complete.
        atx.commit();
    }

    // Transaction B
    try (Transaction btx = Transaction.open(tx)) {
        // Insert and extract from resource handlers.

        // ...

        // Maybe this one was invalid, so don't mark as complete.
    }

    // Mark the root transaction as successful such that the successful
    // inner transactions are completed.
    tx.commit();
}
```

### 拍摄快照 {#taking-snapshots}

单凭其自身，`Transaction#commit` 什么也不做。因此，无论转移是否成功，所执行的放入和取出都是永久性的。而我们想要的是：对于任何 `Transaction`，转移只有在被 `commit` 时才真正发生；否则，转移应被撤销。

这正是 `SnapshotJournal<T>` 的用武之地。顾名思义，它可以在修改处理器内容之前，为处理器的当前状态拍摄一份 `T` 类型的“快照”。随后，如果事务成功，它可以释放该快照；如果失败，它可以把处理器还原到之前的状态。每个 `SnapshotJournal` 至少必须实现两个方法：`createSnapshot`（真正创建保存的状态）和 `revertToSnapshot`（把处理器还原到指定状态）。如果因处理器的变化而需要通知或更新任何底层对象，那么该 journal 还可以重写 `onRootCommit` 来处理这些变化。

所有 NeoForge 的 `ResourceHandler` 实现都以某种方式使用了 `SnapshotJournal`，要么直接在处理器本身上使用，要么作为其中的一个字段。只有在编写全新的 `ResourceHandler` 时，才需要实现 `SnapshotJournal`。

```java
// We can use the stored object as the snapshot value since we only ever
// need to keep track of one index.
public class ExampleResourceHandler extends SnapshotJournal<ExampleObject> implements ResourceHandler<ExampleResource> {

    private ExampleObject object;

    public ExampleResourceHandler(ExampleObject object) {
        // ...
    }
    
    // ...

    @Override
    protected ExampleObject createSnapshot() {
        // Create a snapshot of the object.
        // This should be immutable.
        ExampleObject original = this.object;
        this.object = new ExampleObject(
            original.id(), original.count(), ImmutableMap.copyOf(original.flags())
        );
        return original;
    }

    @Override
    protected void revertToSnapshot(ExampleObject snapshot) {
        // Reverts the state of the handler to the snapshot.
        this.object = snapshot;
    }

    // We need to update the insert and extract methods to make snapshots before
    // every modification.

    @Override
    public int insert(int index, ExampleResource resource, int amount, TransactionContext transaction) {
        // Inserts the resource into the given index, returning the amount put in.

        // Validate arguments.
        Objects.checkIndex(index, size());
        TransferPreconditions.checkNonEmptyNonNegative(resource, amount);

        // Check whether the resource can be inserted from this location.
        ExampleObject current = this.object;
        if (current.count() == 0 || (current.id() == resource.id() && current.flags().equals(resource.flags()) && this.isValid(index, resource))) {
            // Compute the amount to insert.
            int insertedAmount = Math.min(amount, this.getCapacityAsInt(index, resource) - current.count());

            if (insertedAmount > 0) {
                // Snapshot the handler before modifying the contents.
                this.updateSnapshots(transaction);

                // Update the content.
                if (current.count() == 0) {
                    this.object = new ExampleObject(
                        resource.id(), insertedAmount, new HashMap<>(resource.flags())
                    );
                } else {
                    this.object.setCount(current.count() + insertedAmount);
                }

                // Return the amount inserted.
                return insertedAmount;
            }
        }

        // If not matching, insert nothing.
        return 0;
    }

    @Override
    public int extract(int index, ExampleResource resource, int amount, TransactionContext transaction) {
        // Extracts the contents from the given index, returning the amount taken out.

        // Validate arguments.
        Objects.checkIndex(index, size());
        TransferPreconditions.checkNonEmptyNonNegative(resource, amount);

        // Check whether the resource can be extracted from this location.
        ExampleObject current = this.object;
        if (current.id() == resource.id() && current.flags().equals(resource.flags())) {
            // Compute the amount to extract.
            int extracted = Math.min(current.count(), amount);

            if (extracted > 0) {
                // Snapshot the handler before modifying the contents.
                this.updateSnapshots(transaction);

                // Update the content.
                this.object.setCount(current.count() - extracted);

                // Return the amount extracted.
                return extracted;
            }
        }

        // If not matching, extract nothing.
        return 0;
    }
}
```

这样一来，我们的事务现在也能正确处理物品栏的状态了：

```java
// Let's assume we have two `ResourceHandler<ExampleResource>`s exampleA, exampleB.

// Open the transaction.
try (Transaction tx = Transaction.openRoot()) {
    // Insert and extract from resource handlers
    ExampleResource resource = new ExampleResource(new ExampleObject(0, 1, Map.of()));

    // Try to extract and insert the desired resource
    if (exampleA.extract(resource, 1, tx) == 1 && exampleB.insert(resource, 1, tx) == 1) {
        // If successful, commit the transaction to make the change permanent.
        tx.commit();
    }

    // Otherwise, the transaction is aborted and the two handlers will revert their
    // contents to before the transaction occurred.
}
```

[capabilities]: capabilities.md
[container]: container.md
[datacomponent]: ../items/datacomponents.md
[handler]: #resource-handlers
[items]: ../items/index.md
[itemstack]: ../items/index.md#itemstacks
[livingentity]: ../entities/livingentity.md
[playerinv]: container.md#containers-on-players-player-inventory
[transaction]: #transferring-between-handlers

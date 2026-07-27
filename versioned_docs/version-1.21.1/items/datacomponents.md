---
sidebar_position: 2
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 数据组件 {#data-components}

数据组件（data component）是存储在一个 map 中的键值对，用于在 `ItemStack` 上保存数据。每一项数据（例如烟花爆炸效果或工具信息）都以真实对象的形式存储在物品堆叠上，使得这些值可以直接访问和操作，而无需从通用的编码实例（例如 `CompoundTag`、 `JsonElement`）中动态转换出来。

## `DataComponentType` {#datacomponenttype}

每个数据组件都关联着一个 `DataComponentType<T>`，其中 `T` 是组件值的类型。 `DataComponentType` 相当于一个键，用于引用所存储的组件值，同时（在需要时）携带若干 Codec 来处理向磁盘和网络的读写。

现有组件的完整列表可以在 `DataComponents` 中找到。

### 创建自定义数据组件 {#creating-custom-data-components}

与 `DataComponentType` 关联的组件值必须实现 `hashCode` 和 `equals`，并且在存储时应当被视为**不可变的**。

:::note
使用 record 可以非常方便地实现组件值。 record 的字段是不可变的，并且会自动实现 `hashCode` 和 `equals`。
:::

```java
// A record example
public record ExampleRecord(int value1, boolean value2) {}

// A class example
public class ExampleClass {

    private final int value1;
    // Can be mutable, but care needs to be taken when using
    private boolean value2;

    public ExampleClass(int value1, boolean value2) {
        this.value1 = value1;
        this.value2 = value2;
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.value1, this.value2);
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        } else {
            return obj instanceof ExampleClass ex
                && this.value1 == ex.value1
                && this.value2 == ex.value2;
        }
    }
}
```

标准的 `DataComponentType` 可以通过 `DataComponentType#builder` 创建，并使用 `DataComponentType.Builder#build` 构建。构建器包含三项设置：`persistent`、 `networkSynchronized`、 `cacheEncoding`。

`persistent` 指定用于向磁盘读写组件值的 [`Codec`][codec]。 `networkSynchronized` 指定用于跨网络读写组件的 `StreamCodec`。如果未指定 `networkSynchronized`，则会将 `persistent` 提供的 `Codec` 包装后用作 [`StreamCodec`][streamcodec]。

:::warning
构建器中必须提供 `persistent` 或 `networkSynchronized` 之一；否则将抛出 `NullPointerException`。如果不需要跨网络发送任何数据，则将 `networkSynchronized` 设为 `StreamCodec#unit`，并提供默认的组件值。
:::

`cacheEncoding` 会缓存 `Codec` 的编码结果，这样只要组件值没有变化，后续的编码就会使用缓存值。仅当预期组件值极少或永不变化时才应使用该设置。

`DataComponentType` 是注册表对象，必须[注册][registered]。

<Tabs defaultValue="latest">
<TabItem value="latest" label="Latest">

```java
// Using ExampleRecord(int, boolean)
// Only one Codec and/or StreamCodec should be used below
// Multiple are provided for an example

// Basic codec
public static final Codec<ExampleRecord> BASIC_CODEC = RecordCodecBuilder.create(instance ->
    instance.group(
        Codec.INT.fieldOf("value1").forGetter(ExampleRecord::value1),
        Codec.BOOL.fieldOf("value2").forGetter(ExampleRecord::value2)
    ).apply(instance, ExampleRecord::new)
);
public static final StreamCodec<ByteBuf, ExampleRecord> BASIC_STREAM_CODEC = StreamCodec.composite(
    ByteBufCodecs.INT, ExampleRecord::value1,
    ByteBufCodecs.BOOL, ExampleRecord::value2,
    ExampleRecord::new
);

// Unit stream codec if nothing should be sent across the network
public static final StreamCodec<ByteBuf, ExampleRecord> UNIT_STREAM_CODEC = StreamCodec.unit(new ExampleRecord(0, false));


// In another class
// The specialized DeferredRegister.DataComponents simplifies data component registration and avoids some generic inference issues with the `DataComponentType.Builder` within a `Supplier`
public static final DeferredRegister.DataComponents REGISTRAR = DeferredRegister.createDataComponents(Registries.DATA_COMPONENT_TYPE, "examplemod");

public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> BASIC_EXAMPLE = REGISTRAR.registerComponentType(
    "basic",
    builder -> builder
        // The codec to read/write the data to disk
        .persistent(BASIC_CODEC)
        // The codec to read/write the data across the network
        .networkSynchronized(BASIC_STREAM_CODEC)
);

/// Component will not be saved to disk
public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> TRANSIENT_EXAMPLE = REGISTRAR.registerComponentType(
    "transient",
    builder -> builder.networkSynchronized(BASIC_STREAM_CODEC)
);

// No data will be synced across the network
public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> NO_NETWORK_EXAMPLE = REGISTRAR.registerComponentType(
   "no_network",
   builder -> builder
        .persistent(BASIC_CODEC)
        // Note we use a unit stream codec here
        .networkSynchronized(UNIT_STREAM_CODEC)
);
```

</TabItem>
<TabItem value="21.1.48" label="[21.0.0, 21.1.48]">

```java
// Using ExampleRecord(int, boolean)
// Only one Codec and/or StreamCodec should be used below
// Multiple are provided for an example

// Basic codec
public static final Codec<ExampleRecord> BASIC_CODEC = RecordCodecBuilder.create(instance ->
    instance.group(
        Codec.INT.fieldOf("value1").forGetter(ExampleRecord::value1),
        Codec.BOOL.fieldOf("value2").forGetter(ExampleRecord::value2)
    ).apply(instance, ExampleRecord::new)
);
public static final StreamCodec<ByteBuf, ExampleRecord> BASIC_STREAM_CODEC = StreamCodec.composite(
    ByteBufCodecs.INT, ExampleRecord::value1,
    ByteBufCodecs.BOOL, ExampleRecord::value2,
    ExampleRecord::new
);

// Unit stream codec if nothing should be sent across the network
public static final StreamCodec<ByteBuf, ExampleRecord> UNIT_STREAM_CODEC = StreamCodec.unit(new ExampleRecord(0, false));


// In another class
// The specialized DeferredRegister.DataComponents simplifies data component registration and avoids some generic inference issues with the `DataComponentType.Builder` within a `Supplier`
public static final DeferredRegister.DataComponents REGISTRAR = DeferredRegister.createDataComponents("examplemod");

public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> BASIC_EXAMPLE = REGISTRAR.registerComponentType(
    "basic",
    builder -> builder
        // The codec to read/write the data to disk
        .persistent(BASIC_CODEC)
        // The codec to read/write the data across the network
        .networkSynchronized(BASIC_STREAM_CODEC)
);

/// Component will not be saved to disk
public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> TRANSIENT_EXAMPLE = REGISTRAR.registerComponentType(
    "transient",
    builder -> builder.networkSynchronized(BASIC_STREAM_CODEC)
);

// No data will be synced across the network
public static final DeferredHolder<DataComponentType<?>, DataComponentType<ExampleRecord>> NO_NETWORK_EXAMPLE = REGISTRAR.registerComponentType(
   "no_network",
   builder -> builder
        .persistent(BASIC_CODEC)
        // Note we use a unit stream codec here
        .networkSynchronized(UNIT_STREAM_CODEC)
);
```
</TabItem>
</Tabs>

## 组件 Map {#the-component-map}

所有数据组件都存储在一个 `DataComponentMap` 中，以 `DataComponentType` 作为键、以对象作为值。 `DataComponentMap` 的行为类似于一个只读的 `Map`。因此，它提供了根据 `DataComponentType` 来 `#get` 某个条目的方法，或在该条目不存在时提供默认值的方法（通过 `#getOrDefault`）。

```java
// For some DataComponentMap map

// Will get dye color if component is present
// Otherwise null
@Nullable
DyeColor color = map.get(DataComponents.BASE_COLOR);
```

### `PatchedDataComponentMap` {#patcheddatacomponentmap}

由于默认的 `DataComponentMap` 只提供基于读取的操作方法，基于写入的操作则由其子类 `PatchedDataComponentMap` 支持。这包括 `#set` 某个组件的值，或将其彻底 `#remove`。

`PatchedDataComponentMap` 使用一个原型（prototype）和一个补丁 map（patch map）来存储改动。原型是一个 `DataComponentMap`，包含该 map 应当拥有的默认组件及其值。补丁 map 则是从 `DataComponentType` 到 `Optional` 值的映射，记录对默认组件所做的改动。

```java
// For some PatchedDataComponentMap map

// Sets the base color to white
map.set(DataComponents.BASE_COLOR, DyeColor.WHITE);

// Removes the base color by
// - Removing the patch if no default is provided
// - Setting an empty optional if there is a default
map.remove(DataComponents.BASE_COLOR);
```

:::danger
原型和补丁 map 都参与 `PatchedDataComponentMap` 的哈希码计算。因此，map 中的任何组件值都应被视为**不可变的**。在修改某个数据组件的值之后，务必调用 `#set` 或下文讨论的其相关方法之一。
:::

## 组件 Holder {#the-component-holder}

所有能够持有数据组件的实例都实现了 `DataComponentHolder`。 `DataComponentHolder` 实际上是对 `DataComponentMap` 中只读方法的委托。

```java
// For some ItemStack stack

// Delegates to 'DataComponentMap#get'
@Nullable
DyeColor color = stack.get(DataComponents.BASE_COLOR);
```

### `MutableDataComponentHolder` {#mutabledatacomponentholder}

`MutableDataComponentHolder` 是 NeoForge 提供的接口，用于支持对组件 map 的基于写入的方法。原版 和 NeoForge 中的所有实现都使用 `PatchedDataComponentMap` 存储数据组件，因此 `#set` 和 `#remove` 方法也有同名的委托方法。

此外，`MutableDataComponentHolder` 还提供了一个 `#update` 方法，它负责获取组件值（若未设置则取所提供的默认值）、对该值进行操作、再将其设置回 map。操作符可以是 `UnaryOperator`（接收组件值并返回组件值），也可以是 `BiFunction`（接收组件值和另一个对象并返回组件值）。

```java
// For some ItemStack stack

FireworkExplosion explosion = stack.get(DataComponents.FIREWORK_EXPLOSION);

// Modifying the component value
explosion = explosion.withFadeColors(new IntArrayList(new int[] {1, 2, 3}));

// Since we modified the component value, 'set' should be called afterward
stack.set(DataComponents.FIREWORK_EXPLOSION, explosion);

// Update the component value (calls 'set' internally)
stack.update(
    DataComponents.FIREWORK_EXPLOSION,
    // Default value if no component value is present
    FireworkExplosion.DEFAULT,
    // Return a new FireworkExplosion to set
    explosion -> explosion.withFadeColors(new IntArrayList(new int[] {4, 5, 6}))
);

stack.update(
    DataComponents.FIREWORK_EXPLOSION,
    // Default value if no component value is present
    FireworkExplosion.DEFAULT,
    // An object that is supplied to the function
    new IntArrayList(new int[] {7, 8, 9}),
    // Return a new FireworkExplosion to set
    FireworkExplosion::withFadeColors
);
```

## 为物品添加默认数据组件 {#adding-default-data-components-to-items}

虽然数据组件存储在 `ItemStack` 上，但可以在 `Item` 上设置一组默认组件，在构造 `ItemStack` 时作为原型传递给它。可以通过 `Item.Properties#component` 为 `Item` 添加组件。

```java
// For some DeferredRegister.Items REGISTRAR
public static final Item COMPONENT_EXAMPLE = REGISTRAR.register("component",
    // register is used over other overloads as the DataComponentType has not been registered yet
    () -> new Item(
        new Item.Properties()
        .component(BASIC_EXAMPLE.value(), new ExampleRecord(24, true))
    )
);
```

如果要为属于 原版 或其他 mod 的现有物品添加数据组件，则应在[**mod 事件总线**][modbus]上监听 `ModifyDefaultComponentsEvent`。该事件提供了 `modify` 和 `modifyMatching` 方法，允许针对相关物品修改其 `DataComponentPatch.Builder`。构建器可以 `#set` 组件，也可以 `#remove` 现有组件。

```java
@SubscribeEvent // on the mod event bus
public static void modifyComponents(ModifyDefaultComponentsEvent event) {
    // Sets the component on melon seeds
    event.modify(Items.MELON_SEEDS, builder ->
        builder.set(BASIC_EXAMPLE.value(), new ExampleRecord(10, false))
    );

    // Removes the component for any items that have a crafting item
    event.modifyMatching(
        item -> item.hasCraftingRemainingItem(),
        builder -> builder.remove(DataComponents.BUCKET_ENTITY_DATA)
    );
}
```

## 使用自定义组件 Holder {#using-custom-component-holders}

要创建自定义的数据组件 holder，该 holder 对象只需实现 `MutableDataComponentHolder` 并实现其中缺失的方法即可。 holder 对象必须包含一个表示 `PatchedDataComponentMap` 的字段，以便实现相关方法。

```java
public class ExampleHolder implements MutableDataComponentHolder {

    private int data;
    private final PatchedDataComponentMap components;

    // Overloads can be provided to supply the map itself
    public ExampleHolder() {
        this.data = 0;
        this.components = new PatchedDataComponentMap(DataComponentMap.EMPTY);
    }

    @Override
    public DataComponentMap getComponents() {
        return this.components;
    }

    @Nullable
    @Override
    public <T> T set(DataComponentType<? super T> componentType, @Nullable T value) {
        return this.components.set(componentType, value);
    }

    @Nullable
    @Override
    public <T> T remove(DataComponentType<? extends T> componentType) {
        return this.components.remove(componentType);
    }

    @Override
    public void applyComponents(DataComponentPatch patch) {
        this.components.applyPatch(patch);
    }

    @Override
    public void applyComponents(DataComponentMap components) {
        this.components.setAll(p_330402_);
    }

    // Other methods
}
```

### `DataComponentPatch` 与 Codec {#datacomponentpatch-and-codecs}

要将组件持久化到磁盘或通过网络发送信息，holder 可以发送整个 `DataComponentMap`。然而，这通常是对信息的浪费，因为在数据发送到的目标位置上，所有默认值本就已经存在。因此，我们改用 `DataComponentPatch` 来发送相关数据。 `DataComponentPatch` 只包含组件 map 的补丁信息，不含任何默认值。这些补丁随后会在接收方位置应用到原型上。

`DataComponentPatch` 可以通过 `#patch` 从 `PatchedDataComponentMap` 创建。同样地，给定原型 `DataComponentMap` 和一个 `DataComponentPatch`，`PatchedDataComponentMap#fromPatch` 可以构造出一个 `PatchedDataComponentMap`。

```java
public class ExampleHolder implements MutableDataComponentHolder {

    public static final Codec<ExampleHolder> CODEC = RecordCodecBuilder.create(instance ->
        instance.group(
            Codec.INT.fieldOf("data").forGetter(ExampleHolder::getData),
            DataCopmonentPatch.CODEC.optionalFieldOf("components", DataComponentPatch.EMPTY).forGetter(holder -> holder.components.asPatch())
        ).apply(instance, ExampleHolder::new)
    );

    public static final StreamCodec<RegistryFriendlyByteBuf, ExampleHolder> STREAM_CODEC = StreamCodec.composite(
        ByteBufCodecs.INT, ExampleHolder::getData,
        DataComponentPatch.STREAM_CODEC, holder -> holder.components.asPatch(),
        ExampleHolder::new
    );

    // ...

    public ExampleHolder(int data, DataComponentPatch patch) {
        this.data = data;
        this.components = PatchedDataComponentMap.fromPatch(
            // The prototype map to apply to
            DataComponentMap.EMPTY,
            // The associated patches
            patch
        );
    }

    // ...
}
```

[跨网络同步 holder 数据][network]以及向磁盘读写数据都必须手动完成。

[registered]: ../concepts/registries.md
[codec]: ../datastorage/codecs.md
[modbus]: ../concepts/events.md#event-buses
[network]: ../networking/payload.md
[streamcodec]: ../networking/streamcodecs.md

---
sidebar_position: 2
---

# 数据组件 {#data-components}

数据组件是映射中的键值对，用于在某个注册对象的 `Holder` 上存储数据。每一条数据，例如烟花爆炸或工具，都作为真实对象存储在 holder 上，从而使这些值可见、可操作，而无需动态地把某个通用的编码实例（例如 `CompoundTag`、`JsonElement`）转换回来。

## `DataComponentType` {#datacomponenttype}

每个数据组件都有一个关联的 `DataComponentType<T>`，其中 `T` 是组件值的类型。`DataComponentType` 表示一个用于引用所存组件值的键，并在需要时附带一些用于处理磁盘和网络读写的 codec。

现有组件的列表可在 `DataComponents` 中找到。

### 创建自定义数据组件 {#creating-custom-data-components}

与 `DataComponentType` 关联的组件值必须实现 `hashCode` 和 `equals`，并且在存储时应被视为**不可变的**。

:::note
使用 record 可以非常轻松地实现组件值。record 的字段是不可变的，并且会实现 `hashCode` 和 `equals`。
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

标准的 `DataComponentType` 可通过 `DataComponentType#builder` 创建，并用 `DataComponentType.Builder#build` 构建。该构建器包含四项设置：`persistent`、`networkSynchronized`、`cacheEncoding` 和 `ignoreSwapAnimation`。

`persistent` 指定用于向磁盘读写组件值的 [`Codec`][codec]。`networkSynchronized` 指定用于跨网络读写组件的 `StreamCodec`。如果未指定 `networkSynchronized`，则 `persistent` 中提供的 `Codec` 会被包装并用作 [`StreamCodec`][streamcodec]。

:::warning
构建器中必须提供 `persistent` 或 `networkSynchronized` 二者之一；否则将抛出 `NullPointerException`。如果不应通过网络发送任何数据，则将 `networkSynchronized` 设为 `StreamCodec#unit`，并提供默认的组件值。
:::

`cacheEncoding` 会缓存 `Codec` 的编码结果，从而在组件值未发生变化时，后续的编码都使用缓存值。仅当预期组件值极少或永不改变时才应使用它。

`ignoreSwapAnimation` 会在物品带有此组件时取消切换动画。如果不设置此项，动画仍可能根据客户端物品属性而被取消。

`DataComponentType` 是注册对象，必须被[注册][registered]。

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

public static final Supplier<DataComponentType<ExampleRecord>> BASIC_EXAMPLE = REGISTRAR.registerComponentType(
    "basic",
    builder -> builder
        // The codec to read/write the data to disk
        .persistent(BASIC_CODEC)
        // The codec to read/write the data across the network
        .networkSynchronized(BASIC_STREAM_CODEC)
);

/// Component will not be saved to disk
public static final Supplier<DataComponentType<ExampleRecord>> TRANSIENT_EXAMPLE = REGISTRAR.registerComponentType(
    "transient",
    builder -> builder.networkSynchronized(BASIC_STREAM_CODEC)
);

// No data will be synced across the network
public static final Supplier<DataComponentType<ExampleRecord>> NO_NETWORK_EXAMPLE = REGISTRAR.registerComponentType(
   "no_network",
   builder -> builder
        .persistent(BASIC_CODEC)
        // Note we use a unit stream codec here
        .networkSynchronized(UNIT_STREAM_CODEC)
);
```

## 组件映射 {#the-component-map}

所有数据组件都存储在一个 `DataComponentMap` 中，以 `DataComponentType` 作为键、以对象作为值。`DataComponentMap` 的功能类似于只读的 `Map`。因此，它提供了在给定 `DataComponentType` 时 `#get` 一个条目的方法，或在条目不存在时提供默认值（通过 `#getOrDefault`）。

对于一个注册对象，可通过 `Holder#components` 获取其 `DataComponentMap`。

```java
// For some Item item

// Will get dye color if component is present
// Otherwise null
@Nullable
DyeColor color = item.builtInRegistryHolder().components().get(DataComponents.BASE_COLOR);
```

### `PatchedDataComponentMap` {#patcheddatacomponentmap}

由于默认的 `DataComponentMap` 只提供基于读取的操作方法，基于写入的操作则由子类 `PatchedDataComponentMap` 支持。这包括 `#set` 组件的值或将其彻底 `#remove`。

`PatchedDataComponentMap` 使用一个原型（prototype）和一个补丁映射（patch map）来存储更改。原型是一个 `DataComponentMap`，包含该映射应当拥有的默认组件及其值。补丁映射是一个从 `DataComponentType` 到 `Optional` 值的映射，其中包含对默认组件所做的更改。

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
原型和补丁映射都属于 `PatchedDataComponentMap` 哈希码的一部分。因此，映射中的任何组件值都应被视为**不可变的**。在修改某个数据组件的值之后，务必调用 `#set` 或下文讨论的其某个引用方法。
:::

## 组件获取器 {#the-component-getter}

所有能够提供数据组件的实例通常都会实现 `DataComponentGetter`。`DataComponentGetter` 实际上负责获取某个数据类型的组件值，可能是通过一个后备映射，也可能是即时创建该值。

## 组件持有者 {#the-component-holder}

所有引用后备数据组件映射的实例都会实现 `DataComponentHolder`，它继承自 `DataComponentGetter`。`DataComponentHolder` 实际上是 `DataComponentMap` 中只读方法的委托。

```java
// For some DataComponentHolder holder

// Delegates to 'DataComponentMap#get'
@Nullable
DyeColor color = holder.get(DataComponents.BASE_COLOR);
```

### `MutableDataComponentHolder` {#mutabledatacomponentholder}

`MutableDataComponentHolder` 是 NeoForge 提供的一个接口，用于支持对组件映射的基于写入的方法。Vanilla 和 NeoForge 中的所有实现都使用 `PatchedDataComponentMap` 来存储数据组件，因此 `#set` 和 `#remove` 方法也有同名的委托。

此外，`MutableDataComponentHolder` 还提供了一个 `#update` 方法，它负责获取组件值（若未设置则获取提供的默认值），对该值进行操作，然后将其重新设置回映射中。操作符可以是一个 `UnaryOperator`（接收组件值并返回组件值），也可以是一个 `BiFunction`（接收组件值和另一个对象并返回组件值）。

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

尽管可变的数据组件存储在 `ItemStack` 上，但可以通过 `Item` 设置一份默认组件映射，它会被存储在 `Holder<Item>` 上，并在构造时最终作为原型传递给 `ItemStack`。可通过 `Item.Properties#component` 向 `Item` 添加一个组件。对于依赖动态生成数据的组件，例如[数据包注册表对象][datapackregistry]，则应改用 `Item.Properties#delayedComponent`，在给定注册表的 `HolderLookup.Provider` 时构造该值。

```java
// For some DeferredRegister.Items REGISTRAR
public static final Item COMPONENT_EXAMPLE = REGISTRAR.register("component",
    // register is used over other overloads as the DataComponentType has not been registered yet
    registryName -> new Item(
        new Item.Properties()
        .setId(ResourceKey.create(Registries.ITEM, registryName))
        // Passes in the direct component value.
        .component(BASIC_EXAMPLE.get(), new ExampleRecord(24, true))
        // Passes in a component factory, taking in the registry context and returning the value.
        .delayedComponent(DataComponents.DAMAGE_RESISTANT, context -> new DamageResistant(context.getOrThrow(DamageTypeTags.IS_EXPLOSION)))
    )
);
```

如果要把数据组件添加到属于 Vanilla 或其他 Mod 的某个已有物品上，则应在[**模组事件总线**][modbus]上监听 `ModifyDefaultComponentsEvent`。该事件提供了 `modify` 和 `modifyMatching` 方法，允许针对相关物品修改 `DataComponentPatch.Builder`。该构建器可以 `#set` 已有组件，包括将其 `#set` 为 null——这实际上会移除它们。

```java
@SubscribeEvent // on the mod event bus
public static void modifyComponents(ModifyDefaultComponentsEvent event) {
    // Sets the component on melon seeds
    event.modify(Items.MELON_SEEDS, builder ->
        builder.set(BASIC_EXAMPLE.get(), new ExampleRecord(10, false))
    );

    // Removes the component for any items that have a crafting remainder
    event.modifyMatching(
        (item, components) -> item.getCraftingRemainder() != null,
        builder -> builder.set(DataComponents.BUCKET_ENTITY_DATA, null)
    );
}
```

## 使用自定义组件持有者 {#using-custom-component-holders}

要创建一个自定义数据组件持有者，该持有者对象只需实现 `MutableDataComponentHolder` 并实现其缺失的方法即可。该持有者对象必须包含一个表示 `PatchedDataComponentMap` 的字段，以实现相关方法。

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
        this.components.setAll(components);
    }

    // Other methods
}
```

### `DataComponentPatch` 与 Codec {#datacomponentpatch-and-codecs}

要把组件持久化到磁盘或跨网络发送信息，持有者可以发送整个 `DataComponentMap`。然而，这通常是一种信息浪费，因为在数据被发送到的目标位置，所有默认值都已经存在了。因此，我们改用 `DataComponentPatch` 来发送相关数据。`DataComponentPatch` 只包含组件映射的补丁信息，而不含任何默认值。随后，这些补丁会在接收方的位置被应用到原型上。

可通过 `#patch` 从 `PatchedDataComponentMap` 创建出一个 `DataComponentPatch`。同样地，`PatchedDataComponentMap#fromPatch` 可在给定原型 `DataComponentMap` 和一个 `DataComponentPatch` 时，构造出一个 `PatchedDataComponentMap`。

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

[跨网络同步持有者数据][network]以及向磁盘读写数据都必须手动完成。

[datapackregistry]: ../concepts/registries.md#datapack-registries
[registered]: ../concepts/registries.md
[codec]: ../datastorage/codecs.md
[modbus]: ../concepts/events.md#event-buses
[network]: ../networking/payload.md
[streamcodec]: ../networking/streamcodecs.md

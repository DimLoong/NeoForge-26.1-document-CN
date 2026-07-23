---
sidebar_position: 1
---
# 注册表 {#registries}

注册是这样一个过程：把一个 Mod 的对象（例如[物品][item]、[方块][block]、实体等）拿出来，并使其为游戏所知。注册事物很重要，因为如果不注册，游戏根本不会知道这些对象的存在，从而导致无法解释的行为和崩溃。

简单来说，注册表就是对一个映射（map）的包装，该映射把注册名（下文详述）映射到已注册的对象，后者常被称为注册项。注册名在同一个注册表内必须唯一，但同一个注册名可以出现在多个注册表中。最常见的例子就是方块（在 `BLOCKS` 注册表中）拥有一个同名的物品形态（在 `ITEMS` 注册表中）。

每个已注册的对象都有一个唯一的名称，称为它的注册名。该名称以 [`Identifier`][identifier] 表示。例如，泥土方块的注册名是 `minecraft:dirt`，僵尸的注册名是 `minecraft:zombie`。带 Mod 的对象当然不会使用 `minecraft` 命名空间，而会改用它们的 mod id。

## 原版 vs. 带 Mod {#vanilla-vs-modded}

为了理解 NeoForge 注册系统中做出的一些设计决策，我们先看看 Minecraft 是如何做的。我们将以方块注册表为例，因为大多数其他注册表的工作方式都相同。

注册表一般注册的是[单例][singleton]。这意味着所有注册项都恰好存在一次。例如，你在游戏中看到的所有石头方块实际上都是同一个石头方块，只是被显示了很多次。如果你需要石头方块，可以通过引用那个已注册的方块实例来获取它。

Minecraft 在 `Blocks` 类中注册所有方块。通过 `register` 方法会调用 `Registry#register()`，其第一个参数是位于 `BuiltInRegistries.BLOCK` 的方块注册表。在所有方块注册完毕后，Minecraft 会基于方块列表执行各种检查，例如验证所有方块都已加载模型的自检。

这一切之所以能够运作，主要原因在于 `Blocks` 会被 Minecraft 足够早地类加载。Mod 不会被 Minecraft 自动类加载，因此需要一些变通手段。

## 注册方式 {#methods-for-registering}

NeoForge 提供了两种注册对象的方式：`DeferredRegister` 类，以及 `RegisterEvent`。注意前者是对后者的包装，且为防止出错而推荐使用。

### `DeferredRegister` {#deferredregister}

我们首先创建 `DeferredRegister`：

```java
public static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(
        // The registry we want to use.
        // Minecraft's registries can be found in BuiltInRegistries, NeoForge's registries can be found in NeoForgeRegistries.
        // Mods may also add their own registries, refer to the individual mod's documentation or source code for where to find them.
        BuiltInRegistries.BLOCK,
        // Our mod id.
        ExampleMod.MOD_ID
);
```

然后，我们可以使用以下方法之一，把注册项添加为静态 final 字段（关于在 `new Block()` 中要添加哪些参数，参见[方块相关文章][block]）：

```java
public static final DeferredHolder<Block, Block> EXAMPLE_BLOCK_1 = BLOCKS.register(
        // Our registry name.
        "example_block",
        // A supplier of the object we want to register.
        () -> new Block(...)
);

public static final DeferredHolder<Block, SlabBlock> EXAMPLE_BLOCK_2 = BLOCKS.register(
        // Our registry name.
        "example_block",
        // A function creating the object we want to register
        // given its registry name as a Identifier.
        registryName -> new SlabBlock(...)
);
```

`DeferredHolder<R, T extends R>` 类持有我们的对象。类型参数 `R` 是我们所注册到的注册表的类型（在我们的例子中是 `Block`）。类型参数 `T` 是我们的 supplier 的类型。由于在第一个示例中我们直接注册了一个 `Block`，我们把 `Block` 作为第二个参数提供。如果我们要注册的是 `Block` 某个子类的对象，例如 `SlabBlock`（如第二个示例所示），我们就会在这里改为提供 `SlabBlock`。

`DeferredHolder<R, T extends R>` 是 `Supplier<T>` 的子类。要在需要时获取我们已注册的对象，可以调用 `DeferredHolder#get()`。`DeferredHolder` 继承自 `Supplier` 这一事实，也允许我们把 `Supplier` 用作字段的类型。这样一来，上面的代码块就变成如下形式：

```java
public static final Supplier<Block> EXAMPLE_BLOCK_1 = BLOCKS.register(
        // Our registry name.
        "example_block",
        // A supplier of the object we want to register.
        () -> new Block(...)
);

public static final Supplier<SlabBlock> EXAMPLE_BLOCK_2 = BLOCKS.register(
        // Our registry name.
        "example_block",
        // A function creating the object we want to register
        // given its registry name as a Identifier.
        registryName -> new SlabBlock(...)
);
```

:::note
请注意，有少数地方明确要求 `Holder` 或 `DeferredHolder`，而不会接受任意的 `Supplier`。如果你需要这两者之一，最好按需把你的 `Supplier` 类型改回 `Holder` 或 `DeferredHolder`。
:::

最后，由于整个系统都是对注册事件的包装，我们需要告诉 `DeferredRegister` 按需将自身附加到注册事件上：

```java
//This is our mod constructor
public ExampleMod(IEventBus modBus) {
    //highlight-next-line
    ExampleBlocksClass.BLOCKS.register(modBus);
    //Other stuff here
}
```

:::info
针对方块、物品和数据组件，`DeferredRegister` 有一些提供了辅助方法的专用变体：分别是 [`DeferredRegister.Blocks`][defregblocks]、[`DeferredRegister.Items`][defregitems]、[`DeferredRegister.DataComponents`][defregcomp] 和 [`DeferredRegister.Entities`][defregentity]。
:::

### `RegisterEvent` {#registerevent}

`RegisterEvent` 是注册对象的第二种方式。这个[事件][event]会为每个注册表触发一次，其时机在 Mod 构造函数之后（因为 `DeferredRegister` 正是在那里注册其内部事件处理器的），并在加载配置之前。`RegisterEvent` 在 Mod 事件总线上触发。

```java
@SubscribeEvent // on the mod event bus
public static void register(RegisterEvent event) {
    event.register(
            // This is the registry key of the registry.
            // Get these from BuiltInRegistries for vanilla registries,
            // or from NeoForgeRegistries.Keys for NeoForge registries.
            BuiltInRegistries.BLOCK,
            // Register your objects here.
            registry -> {
                registry.register(Identifier.fromNamespaceAndPath(MODID, "example_block_1"), new Block(...));
                registry.register(Identifier.fromNamespaceAndPath(MODID, "example_block_2"), new Block(...));
                registry.register(Identifier.fromNamespaceAndPath(MODID, "example_block_3"), new Block(...));
            }
    );
}
```

## 查询注册表 {#querying-registries}

有时，你会遇到想要根据给定 id 获取某个已注册对象的情形。或者，你想获取某个已注册对象的 id。由于注册表本质上是从 id（`Identifier`）到不同对象的映射，即一个可反查的映射，因此以下两种操作都可行：

```java
BuiltInRegistries.BLOCK.getValue(Identifier.fromNamespaceAndPath("minecraft", "dirt")); // returns the dirt block
BuiltInRegistries.BLOCK.getKey(Blocks.DIRT); // returns the resource location "minecraft:dirt"

// Assume that ExampleBlocksClass.EXAMPLE_BLOCK.get() is a Supplier<Block> with the id "yourmodid:example_block"
BuiltInRegistries.BLOCK.getValue(Identifier.fromNamespaceAndPath("yourmodid", "example_block")); // returns the example block
BuiltInRegistries.BLOCK.getKey(ExampleBlocksClass.EXAMPLE_BLOCK.get()); // returns the resource location "yourmodid:example_block"
```

如果你只是想检查某个对象是否存在，这也是可行的，不过只能通过键来进行：

```java
BuiltInRegistries.BLOCK.containsKey(Identifier.fromNamespaceAndPath("minecraft", "dirt")); // true
BuiltInRegistries.BLOCK.containsKey(Identifier.fromNamespaceAndPath("create", "brass_ingot")); // true only if Create is installed
```

正如最后一个示例所示，这对任意 mod id 都适用，因此是检查另一个 Mod 中某个物品是否存在的绝佳方式。

最后，我们还可以遍历一个注册表中的所有条目，既可以遍历键，也可以遍历条目（条目使用 Java 的 `Map.Entry` 类型）：

```java
for (Identifier id : BuiltInRegistries.BLOCK.keySet()) {
    // ...
}
for (Map.Entry<ResourceKey<Block>, Block> entry : BuiltInRegistries.BLOCK.entrySet()) {
    // ...
}
```

:::note
查询操作始终使用原版的 `Registry`，而非 `DeferredRegister`。这是因为 `DeferredRegister` 仅仅是注册用的工具。
:::

:::danger
查询操作只有在注册完成之后才能安全使用。**在注册仍在进行时，切勿查询注册表！**
:::

## 自定义注册表 {#custom-registries}

自定义注册表让你能够指定一些额外的系统，供你 Mod 的附属 Mod 接入。例如，如果你的 Mod 要添加法术（spell），你可以把法术做成一个注册表，从而允许其他 Mod 向你的 Mod 添加法术，而你无需再做任何其他事情。它还能让你自动完成某些工作，例如同步条目。

我们先从创建[注册表键][resourcekey]和注册表本身开始：

```java
// We use spells as an example for the registry here, without any details about what a spell actually is (as it doesn't matter).
// Of course, all mentions of spells can and should be replaced with whatever your registry actually is.
public static final ResourceKey<Registry<Spell>> SPELL_REGISTRY_KEY = ResourceKey.createRegistryKey(Identifier.fromNamespaceAndPath("yourmodid", "spells"));
public static final Registry<YourRegistryContents> SPELL_REGISTRY = new RegistryBuilder<>(SPELL_REGISTRY_KEY)
        // If you want to enable integer id syncing, for networking.
        // These should only be used in networking contexts, for example in packets or purely networking-related NBT data.
        .sync(true)
        // The default key. Similar to minecraft:air for blocks. This is optional.
        .defaultKey(Identifier.fromNamespaceAndPath("yourmodid", "empty"))
        // Effectively limits the max count. Generally discouraged, but may make sense in settings such as networking.
        .maxId(256)
        // Build the registry.
        .create();
```

然后，通过在 `NewRegistryEvent` 中把注册表注册到根注册表，来告诉游戏该注册表的存在：

```java
@SubscribeEvent // on the mod event bus
public static void registerRegistries(NewRegistryEvent event) {
    event.register(SPELL_REGISTRY);
}
```

现在，你可以像对待其他任何注册表一样，通过 `DeferredRegister` 和 `RegisterEvent` 注册新的注册表内容：

```java
public static final DeferredRegister<Spell> SPELLS = DeferredRegister.create(SPELL_REGISTRY, "yourmodid");
public static final Supplier<Spell> EXAMPLE_SPELL = SPELLS.register("example_spell", () -> new Spell(...));

// Alternatively:
@SubscribeEvent // on the mod event bus
public static void register(RegisterEvent event) {
    event.register(SPELL_REGISTRY_KEY, registry -> {
        registry.register(Identifier.fromNamespaceAndPath("yourmodid", "example_spell"), () -> new Spell(...));
    });
}
```

## 数据包注册表 {#datapack-registries}

数据包注册表（也称为动态注册表，或根据其主要用途称为世界生成注册表）是一种特殊的注册表，它在世界加载时从[数据包][datapack] JSON 中加载数据（其名由此而来），而不是在游戏启动时加载。默认的数据包注册表最值得注意的包括大多数世界生成注册表，此外还有其他少数几个。

数据包注册表允许在 JSON 文件中指定其内容。这意味着无需任何代码（除非你不想自己手写 JSON 文件，那就需要[数据生成][datagen]）。每个数据包注册表都关联着一个 [`Codec`][codec]，用于序列化，且每个注册表的 id 决定了它的数据包路径：

- Minecraft 的数据包注册表使用格式 `data/yourmodid/registrypath`（例如 `data/yourmodid/worldgen/biome`，其中 `worldgen/biome` 是注册表路径）。
- 所有其他数据包注册表（NeoForge 的或带 Mod 的）使用格式 `data/yourmodid/registrynamespace/registrypath`（例如 `data/yourmodid/neoforge/biome_modifier`，其中 `neoforge` 是注册表命名空间，`biome_modifier` 是注册表路径）。

数据包注册表可以从 `RegistryAccess` 获取。这个 `RegistryAccess` 可以在服务端通过调用 `ServerLevel#registryAccess()` 获取，或在客户端通过 `Minecraft.getInstance().getConnection()#registryAccess()` 获取（后者只有在你确实已连接到某个世界时才有效，否则该连接会为 null）。这些调用的结果随后就可以像其他任何注册表一样，用于获取特定元素或遍历其内容。

### 自定义数据包注册表 {#custom-datapack-registries}

自定义数据包注册表不需要构造一个 `Registry`。相反，它们只需要一个注册表键和至少一个用于（反）序列化其内容的 [`Codec`][codec]。沿用前面的法术示例，把我们的法术注册表注册为数据包注册表看起来大致如下：

```java
public static final ResourceKey<Registry<Spell>> SPELL_REGISTRY_KEY = ResourceKey.createRegistryKey(Identifier.fromNamespaceAndPath("yourmodid", "spells"));

@SubscribeEvent // on the mod event bus
public static void registerDatapackRegistries(DataPackRegistryEvent.NewRegistry event) {
    event.dataPackRegistry(
            // The registry key.
            SPELL_REGISTRY_KEY,
            // The codec of the registry contents.
            Spell.CODEC,
            // The network codec of the registry contents. Often identical to the normal codec.
            // May be a reduced variant of the normal codec that omits data that is not needed on the client.
            // May be null. If null, registry entries will not be synced to the client at all.
            // May be omitted, which is functionally identical to passing null (a method overload
            // with two parameters is called that passes null to the normal three parameter method).
            Spell.CODEC,
            // A consumer which configures the constructed registry via the RegistryBuilder.
            // May be omitted, which is functionally identical to passing builder -> {}.
            builder -> builder.maxId(256)
    );
}
```

### 数据包注册表的数据生成 {#data-generation-for-datapack-registries}

由于手写所有 JSON 文件既繁琐又容易出错，NeoForge 提供了一个[数据提供器][datagenindex]来为你生成 JSON 文件。这对内置的以及你自己的数据包注册表都适用。

首先，我们创建一个 `RegistrySetBuilder` 并向其添加条目（一个 `RegistrySetBuilder` 可以为多个注册表持有条目）：

```java
new RegistrySetBuilder()
    .add(Registries.CONFIGURED_FEATURE, bootstrap -> {
        // Register configured features through the bootstrap context (see below)
    })
    .add(Registries.PLACED_FEATURE, bootstrap -> {
        // Register placed features through the bootstrap context (see below)
    });
```

`bootstrap` 这个 lambda 参数正是我们实际用来注册对象的东西。它的类型是 `BootstrapContext`。要注册一个对象，我们在它上面调用 `#register`，如下所示：

```java
// The resource key of our object.
public static final ResourceKey<ConfiguredFeature<?, ?>> EXAMPLE_CONFIGURED_FEATURE = ResourceKey.create(
    Registries.CONFIGURED_FEATURE,
    Identifier.fromNamespaceAndPath(MOD_ID, "example_configured_feature")
);

new RegistrySetBuilder()
    .add(Registries.CONFIGURED_FEATURE, bootstrap -> {
        bootstrap.register(
            // The resource key of our configured feature.
            EXAMPLE_CONFIGURED_FEATURE,
            // The actual configured feature.
            new ConfiguredFeature<>(Feature.ORE, new OreConfiguration(...))
        );
    })
    .add(Registries.PLACED_FEATURE, bootstrap -> {
        // ...
    });
```

`BootstrapContext` 在需要时也可用于从另一个注册表查找条目：

```java
public static final ResourceKey<ConfiguredFeature<?, ?>> EXAMPLE_CONFIGURED_FEATURE = ResourceKey.create(
    Registries.CONFIGURED_FEATURE,
    Identifier.fromNamespaceAndPath(MOD_ID, "example_configured_feature")
);
public static final ResourceKey<PlacedFeature> EXAMPLE_PLACED_FEATURE = ResourceKey.create(
    Registries.PLACED_FEATURE,
    Identifier.fromNamespaceAndPath(MOD_ID, "example_placed_feature")
);

new RegistrySetBuilder()
    .add(Registries.CONFIGURED_FEATURE, bootstrap -> {
        bootstrap.register(EXAMPLE_CONFIGURED_FEATURE, ...);
    })
    .add(Registries.PLACED_FEATURE, bootstrap -> {
        HolderGetter<ConfiguredFeature<?, ?>> otherRegistry = bootstrap.lookup(Registries.CONFIGURED_FEATURE);
        bootstrap.register(EXAMPLE_PLACED_FEATURE, new PlacedFeature(
            otherRegistry.getOrThrow(EXAMPLE_CONFIGURED_FEATURE), // Get the configured feature
            List.of() // No-op when placement happens - replace with whatever your placement parameters are
        ));
    });
```

最后，我们在一个实际的数据提供器中使用我们的 `RegistrySetBuilder`，并把该数据提供器注册到事件上：

```java
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent.Client event) {
    // Adds the generated registry objects to the current lookup provider for use
    // in other datagen.
    event.createDatapackRegistryObjects(
        // Our registry set builder to generate the data from.
        new RegistrySetBuilder().add(...),
        // (Optional) A biconsumer that takes in any conditions to load the object
        // associated with the resource key
        conditions -> {
            conditions.accept(resourceKey, condition);
        },
        // (Optional) A set of mod ids we are generating the entries for
        // By default, supplies the mod id of the current mod container.
        Set.of("yourmodid")
    );

    // You can use the lookup provider with your generated entries by either calling one
    // of the `#create*` methods or grabbing the actual lookup via `#getLookupProvider`
    // ...
}
```

[block]: ../blocks/index.md
[blockentity]: ../blockentities/index.md
[codec]: ../datastorage/codecs.md
[datagen]: #data-generation-for-datapack-registries
[datagenindex]: ../resources/index.md#data-generation
[datapack]: ../resources/index.md#data
[defregblocks]: ../blocks/index.md#deferredregisterblocks-helpers
[defregcomp]: ../items/datacomponents.md#creating-custom-data-components
[defregentity]: ../entities/index.md#entitytype
[defregitems]: ../items/index.md#deferredregisteritems
[event]: events.md
[item]: ../items/index.md
[identifier]: ../misc/identifier.md
[resourcekey]: ../misc/identifier.md#resourcekeys
[singleton]: https://en.wikipedia.org/wiki/Singleton_pattern

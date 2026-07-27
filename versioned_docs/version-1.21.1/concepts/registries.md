---
sidebar_position: 1
---
# 注册表 {#registries}

注册是获取 Mod 的对象（例如[物品][item]、[方块][block]、实体等）并让游戏知道它们的过程。注册事物很重要，因为如果不注册，游戏将根本不知道这些对象，这将导致无法解释的行为和崩溃。

简而言之，注册表是一个映射的包装器，它将注册表名称（读取）映射到已注册的对象（通常称为注册表项）。注册表名称在同一注册表中必须是唯一的，但相同的注册表名称可以出现在多个注册表中。最常见的示例是具有相同注册表名称（在 `ITEMS` 注册表中）的物品表单的方块（在 `BLOCKS` 注册表中）。

每个注册的对象都有一个唯一的名称，称为其注册表名称。该名称表示为 [`ResourceLocation`][resloc]。例如，污垢方块的注册表名称为 `minecraft:dirt`，僵尸方块的注册表名称为 `minecraft:zombie`。修改后的对象当然不会使用 `minecraft` 命名空间；将使用他们的 mod id。

## 原版 vs. Modded {#vanilla-vs-modded}

为了了解 NeoForge 注册表系统中做出的一些设计决策，我们首先看看 Minecraft 是如何做到这一点的。我们将使用方块注册表作为示例，因为大多数其他注册表的工作方式相同。

注册中心通常注册[单例][singleton]。这意味着所有注册表项只存在一次。例如，你在整个游戏中看到的所有石方块实际上都是同一个石方块，显示了多次。如果需要石方块，可以通过引用注册的方块实例来获取。

Minecraft 将所有方块注册为 `Blocks` 类。通过 `register` 方法，调用 `Registry#register()`，其中 `BuiltInRegistries.BLOCK` 处的方块注册表是第一个参数。注册所有方块后，Minecraft 会根据方块列表执行各种检查，例如验证所有方块是否已加载模型的自检。

所有这些工作的主要原因是 `Blocks` 很早就被 Minecraft 类加载了。 Minecraft 不会自动加载 Mod，因此需要解决方法。

## 注册方法 {#methods-for-registering}

NeoForge 提供了两种注册对象的方法：`DeferredRegister` 类和 `RegisterEvent`。请注意，前者是后者的包装，建议使用前者以防止错误。

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

然后，我们可以将注册表项添加为静态最终字段（请参阅[有关方块的文章][block]，了解要在 `new Block()` 中添加哪些参数）：

```java
public static final DeferredHolder<Block, Block> EXAMPLE_BLOCK = BLOCKS.register(
        "example_block", // Our registry name.
        () -> new Block(...) // A supplier of the object we want to register.
);
```

类 `DeferredHolder<R, T extends R>` 保存我们的对象。类型参数 `R` 是我们要注册的注册表的类型（在我们的例子中为 `Block`）。类型参数 `T` 是我们供应商的类型。由于我们在本例中直接注册了 `Block`，因此我们提供 `Block` 作为第二个参数。如果我们要注册 `Block` 子类的对象，例如 `SlabBlock`，我们将在此处提供 `SlabBlock`。

`DeferredHolder<R, T extends R>` 是 `Supplier<T>` 的子类。为了在需要时获取我们注册的对象，我们可以调用 `DeferredHolder#get()`。 `DeferredHolder` 扩展了 `Supplier` 的事实也允许我们使用 `Supplier` 作为字段的类型。这样，上面的代码方块就变成了下面这样：

```java
public static final Supplier<Block> EXAMPLE_BLOCK = BLOCKS.register(
        "example_block", // Our registry name.
        () -> new Block(...) // A supplier of the object we want to register.
);
```

请注意，有些地方明确要求 `Holder` 或 `DeferredHolder`，而不仅仅接受任何 `Supplier`。如果你需要这两者中的任何一个，最好根据需要将 `Supplier` 的类型更改回 `Holder` 或 `DeferredHolder`。

最后，由于整个系统是注册表事件的包装器，因此我们需要告诉 `DeferredRegister` 根据需要将自身附加到注册表事件：

```java
//This is our mod constructor
public ExampleMod(IEventBus modBus) {
    //highlight-next-line
    ExampleBlocksClass.BLOCKS.register(modBus);
    //Other stuff here
}
```

:::info
`DeferredRegister` 有专门的变体，用于提供帮助方法的方块和物品，分别称为 [`DeferredRegister.Blocks`][defregblocks] 和 [`DeferredRegister.Items`][defregitems]。
:::

### `RegisterEvent` {#registerevent}

`RegisterEvent` 是注册对象的第二种方式。在 mod 构造函数之后（因为 `DeferredRegister` 注册其内部事件处理器的地方）和加载配置之前，每个注册表都会触发此 [事件][event]。 `RegisterEvent` 在 mod 事件总线上触发。

```java
@SubscribeEvent // on the mod event bus
public static void register(RegisterEvent event) {
    event.register(
            // This is the registry key of the registry.
            // Get these from BuiltInRegistries for 原版 registries,
            // or from NeoForgeRegistries.Keys for NeoForge registries.
            BuiltInRegistries.BLOCK,
            // Register your objects here.
            registry -> {
                registry.register(ResourceLocation.fromNamespaceAndPath(MODID, "example_block_1"), new Block(...));
                registry.register(ResourceLocation.fromNamespaceAndPath(MODID, "example_block_2"), new Block(...));
                registry.register(ResourceLocation.fromNamespaceAndPath(MODID, "example_block_3"), new Block(...));
            }
    );
}
```

## 查询注册表 {#querying-registries}

有时，你会发现自己想要通过给定的 id 获取已注册的对象。或者，你想获取某个已注册对象的 id。由于注册表基本上是 ids (`ResourceLocation`s) 到不同对象的映射，即可逆映射，因此这两个操作都有效：

```java
BuiltInRegistries.BLOCK.get(ResourceLocation.fromNamespaceAndPath("minecraft", "dirt")); // returns the dirt block
BuiltInRegistries.BLOCK.getKey(Blocks.DIRT); // returns the resource location "minecraft:dirt"

// Assume that ExampleBlocksClass.EXAMPLE_BLOCK.get() is a Supplier<Block> with the id "yourmodid:example_block"
BuiltInRegistries.BLOCK.get(ResourceLocation.fromNamespaceAndPath("yourmodid", "example_block")); // returns the example block
BuiltInRegistries.BLOCK.getKey(ExampleBlocksClass.EXAMPLE_BLOCK.get()); // returns the resource location "yourmodid:example_block"
```

如果你只想检查对象是否存在，这也是可能的，尽管只能使用键：

```java
BuiltInRegistries.BLOCK.containsKey(ResourceLocation.fromNamespaceAndPath("minecraft", "dirt")); // true
BuiltInRegistries.BLOCK.containsKey(ResourceLocation.fromNamespaceAndPath("create", "brass_ingot")); // true only if Create is installed
```

正如最后一个示例所示，这对于任何 mod id 都是可能的，因此是检查另一个 mod 中的某个物品是否存在的完美方法。

最后，我们还可以迭代注册表中的所有条目，无论是键还是条目（条目使用 Java`Map.Entry` 类型）：

```java
for (ResourceLocation id : BuiltInRegistries.BLOCK.keySet()) {
    // ...
}
for (Map.Entry<ResourceKey<Block>, Block> entry : BuiltInRegistries.BLOCK.entrySet()) {
    // ...
}
```

:::note
查询操作始终使用普通 `Registry`，而不是 `DeferredRegister`。这是因为 `DeferredRegister` 只是注册实用程序。
:::

:::danger
查询操作只有在注册完成后才能安全使用。 **注册仍在进行时请勿查询注册表！**
:::

## 自定义注册表 {#custom-registries}

自定义注册表允许你指定你的 mod 的插件 mod 可能想要插入的其他系统。例如，如果你的 mod 要添加法术，你可以将法术作为注册表，从而允许其他 mod 向你的 mod 添加法术，而无需执行任何其他操作。它还允许你执行一些操作，例如自动同步条目。

让我们首先创建[注册表项][resourcekey] 和注册表本身：

```java
// We use spells as an example for the registry here, without any details about what a spell actually is (as it doesn't matter).
// Of course, all mentions of spells can and should be replaced with whatever your registry actually is.
public static final ResourceKey<Registry<Spell>> SPELL_REGISTRY_KEY = ResourceKey.createRegistryKey(ResourceLocation.fromNamespaceAndPath("yourmodid", "spells"));
public static final Registry<YourRegistryContents> SPELL_REGISTRY = new RegistryBuilder<>(SPELL_REGISTRY_KEY)
        // If you want to enable integer id syncing, for networking.
        // These should only be used in networking contexts, for example in packets or purely networking-related NBT data.
        .sync(true)
        // The default key. Similar to minecraft:air for blocks. This is optional.
        .defaultKey(ResourceLocation.fromNamespaceAndPath("yourmodid", "empty"))
        // Effectively limits the max count. Generally discouraged, but may make sense in settings such as networking.
        .maxId(256)
        // Build the registry.
        .create();
```

然后，通过将它们注册到 `NewRegistryEvent` 中的根注册表来告诉游戏注册表存在：

```java
@SubscribeEvent // on the mod event bus
public static void registerRegistries(NewRegistryEvent event) {
    event.register(SPELL_REGISTRY);
}
```

你现在可以像使用任何其他注册表一样通过 `DeferredRegister` 和 `RegisterEvent` 注册新的注册表内容：

```java
public static final DeferredRegister<Spell> SPELLS = DeferredRegister.create("yourmodid", SPELL_REGISTRY);
public static final Supplier<Spell> EXAMPLE_SPELL = SPELLS.register("example_spell", () -> new Spell(...));

// Alternatively:
@SubscribeEvent // on the mod event bus
public static void register(RegisterEvent event) {
    event.register(SPELL_REGISTRY_KEY, registry -> {
        registry.register(ResourceLocation.fromNamespaceAndPath("yourmodid", "example_spell"), () -> new Spell(...));
    });
}
```

## 数据包注册表 {#datapack-registries}

数据包注册表（也称为动态注册表，或者在其主要用例之后称为 worldgen 注册表）是一种特殊的注册表，它在世界加载时从 [datapack][datapack] JSON（因此得名）加载数据，而不是在游戏启动时加载它们。默认数据包注册表最值得注意的是包括大多数 worldgen 注册表以及其他一些注册表。

Datapack 注册表允许在 JSON 文件中指定其内容。这意味着不需要任何代码（如果你不想自己编写 JSON 文件，则 [datagen][datagen] 除外）。每个数据包注册表都有一个与之关联的 [`Codec`][codec]，用于序列化，每个注册表的 id 决定其数据包路径：

- Minecraft 的数据包注册表使用 `data/yourmodid/registrypath` 格式（例如 `data/yourmodid/worldgen/biome`，其中 `worldgen/biome` 是注册表路径）。
- 所有其他数据包注册表（NeoForge 或 modded）均使用 `data/yourmodid/registrynamespace/registrypath` 格式（例如 `data/yourmodid/neoforge/biome_modifier`，其中 `neoforge` 是注册表命名空间，`biome_modifier` 是注册表路径）。

数据包注册表可以从 `RegistryAccess` 获取。如果在服务器上，可以通过调用 `RegistryAccess` 来检索，如果在客户端上，可以通过调用 `Minecraft.getInstance().getConnection()#registryAccess()` 来检索（后者​​仅在你实际连接到世界时才有效，否则连接将为空）。然后，可以像任何其他注册表一样使用这些调用的结果来获取特定元素，或迭代内容。

### 自定义数据包注册表 {#custom-datapack-registries}

自定义数据包注册表不需要构建 `Registry`。相反，他们只需要一个注册表项和至少一个 [`Codec`][codec] 来（反）序列化其内容。重申之前的咒语示例，将我们的咒语注册表注册为数据包注册表，如下所示：

```java
public static final ResourceKey<Registry<Spell>> SPELL_REGISTRY_KEY = ResourceKey.createRegistryKey(ResourceLocation.fromNamespaceAndPath("yourmodid", "spells"));

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
            Spell.CODEC
    );
}
```

### Datapack 注册表的数据生成 {#data-generation-for-datapack-registries}

由于手动编写所有 JSON 文件既繁琐又容易出错，NeoForge 提供了一个[数据提供者][datagenindex]来为你生成 JSON 文件。这适用于内置数据包注册表和你自己的数据包注册表。

首先，我们创建一个 `RegistrySetBuilder` 并向其中添加我们的条目（一个 `RegistrySetBuilder` 可以保存多个注册表的条目）：

```java
new RegistrySetBuilder()
    .add(Registries.CONFIGURED_FEATURE, bootstrap -> {
    // Register configured features through the bootstrap context (see below)
    })
    .add(Registries.PLACED_FEATURE, bootstrap -> {
    // Register placed features through the bootstrap context (see below)
    });
```

`bootstrap`lambda 参数是我们实际用来注册对象的参数。其模型为 `BootstrapContext`。要注册一个对象，我们对其调用 `#register`，如下所示：

```java
// The resource key of our object.
public static final ResourceKey<ConfiguredFeature<?, ?>> EXAMPLE_CONFIGURED_FEATURE = ResourceKey.create(
    Registries.CONFIGURED_FEATURE,
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "example_configured_feature")
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

如果需要，`BootstrapContext` 还可以用于从另一个注册表查找条目：

```java
public static final ResourceKey<ConfiguredFeature<?, ?>> EXAMPLE_CONFIGURED_FEATURE = ResourceKey.create(
    Registries.CONFIGURED_FEATURE,
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "example_configured_feature")
);
public static final ResourceKey<PlacedFeature> EXAMPLE_PLACED_FEATURE = ResourceKey.create(
    Registries.PLACED_FEATURE,
    ResourceLocation.fromNamespaceAndPath(MOD_ID, "example_placed_feature")
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

最后，我们在实际的数据提供程序中使用 `RegistrySetBuilder`，并将该数据提供程序注册到事件：

```java
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent event) {
    event.getGenerator().addProvider(
        // Only run datapack generation when server data is being generated
        event.includeServer(),
        // Create the provider
        output -> new DatapackBuiltinEntriesProvider(
            output,
            event.getLookupProvider(),
            // Our registry set builder to generate the data from.
            new RegistrySetBuilder().add(...),
            // A set of mod ids we are generating. Usually only your own mod id.
            Set.of("yourmodid")
        )
    );
}
```

[block]: ../blocks/index.md
[blockentity]: ../blockentities/index.md
[codec]: ../datastorage/codecs.md
[datagen]: #data-generation-for-datapack-registries
[datagenindex]: ../resources/index.md#data-generation
[datapack]: ../resources/index.md#data
[defregblocks]: ../blocks/index.md#deferredregisterblocks-helpers
[defregitems]: ../items/index.md#deferredregisteritems
[event]: ./events.md
[item]: ../items/index.md
[resloc]: ../misc/resourcelocation.md
[resourcekey]: ../misc/resourcelocation.md#resourcekeys
[singleton]: https://en.wikipedia.org/wiki/Singleton_pattern

# 伤害类型与伤害来源 {#damage-types--damage-sources}

伤害类型（damage type）表示对实体施加的是哪种伤害——物理伤害、火焰伤害、溺水伤害、魔法伤害、虚空伤害等。区分伤害类型用于各种免疫（例如烈焰人不受火焰伤害）、附魔（例如爆炸保护只防护爆炸伤害）以及许多其他使用场景。

可以说，伤害类型是伤害来源（damage source）的模板。换句话说，伤害来源可以看作伤害类型的一个实例。伤害类型在代码中以 [`ResourceKey`][rk] 的形式存在，但其全部属性都定义在数据包中。而伤害来源则由游戏根据数据包文件中的值按需创建。它们可以持有额外的上下文，例如攻击方实体。

## 创建伤害类型 {#creating-damage-types}

首先，你需要创建你自己的 `DamageType`。 `DamageType` 是一种[数据包注册表][dr]，因此新的 `DamageType` 不在代码中注册，而是在对应文件被添加时自动注册。然而，我们仍然需要为代码提供某个入口点来获取伤害来源。我们通过指定一个[资源键][rk]来做到这一点：

```java
public static final ResourceKey<DamageType> EXAMPLE_DAMAGE =
        ResourceKey.create(Registries.DAMAGE_TYPE, ResourceLocation.fromNamespaceAndPath(ExampleMod.MOD_ID, "example"));
```

现在我们可以从代码中引用它了，接下来让我们在数据文件中指定一些属性。我们的数据文件位于 `data/examplemod/damage_type/example.json`（把 `examplemod` 和 `example` 替换为你的 mod id 和资源位置的名称），内容如下：

```json5
{
    // The death message id of the damage type. The full death message translation key will be
    // "death.examplemod.example" (with swapped-out mod ids and names).
    "message_id": "example",
    // Whether this damage type's damage amount scales with difficulty or not. Valid 原版 values are:
    // - "never": The damage value remains the same on any difficulty. Common for player-caused damage types.
    // - "when_caused_by_living_non_player": The damage value is scaled if the entity is caused by a
    //   living entity of some sort, including indirectly (e.g. an arrow shot by a skeleton), that is not a player.
    // - "always": The damage value is always scaled. Commonly used by explosion-like damage.
    "scaling": "when_caused_by_living_non_player",
    // The amount of exhaustion caused by receiving this kind of damage.
    "exhaustion": 0.1,
    // The damage effects (currently only sound effects) that are applied when receiving this kind of damage. Optional.
    // Valid 原版 values are "hurt" (default), "thorns", "drowning", "burning", "poking", and "freezing".
    "effects": "hurt",
    // The death message type. Determines how the death message is built. Optional.
    // Valid 原版 values are "default" (default), "fall_variants", and "intentional_game_design".
    "death_message_type": "default"
}
```

:::tip
`scaling`、 `effects` 和 `death_message_type` 字段在内部分别由枚举 `DamageScaling`、 `DamageEffects` 和 `DeathMessageType` 控制。如有需要，这些枚举可以被[扩展][extenum]以添加自定义值。
:::

同样的格式也用于原版的伤害类型，包开发者可以在需要时更改这些值。
 
## 创建与使用伤害来源 {#creating-and-using-damage-sources}

`DamageSource` 通常在 `Entity#hurt` 被调用时即时创建。请注意，由于伤害类型是一种[数据包注册表][dr]，你需要一个 `RegistryAccess` 来查询它们，可通过 `Level#registryAccess` 获取。要创建一个 `DamageSource`，请调用 `DamageSource` 构造函数，最多带四个参数：

```java
DamageSource damageSource = new DamageSource(
        // The damage type holder to use. Query from the registry. This is the only required parameter.
        registryAccess.registryOrThrow(Registries.DAMAGE_TYPE).getHolderOrThrow(EXAMPLE_DAMAGE),
        // The direct entity. For example, if a skeleton shot you, the skeleton would be the causing entity
        // (= the parameter above), and the arrow would be the direct entity (= this parameter). Similar to
        // the causing entity, this isn't always applicable and therefore nullable. Optional, defaults to null.
        null,
        // The entity causing the damage. This isn't always applicable (e.g. when falling out of the world)
        // and may therefore be null. Optional, defaults to null.
        null,
        // The damage source position. This is rarely used, one example would be intentional game design
        // (= nether beds exploding). Nullable and optional, defaulting to null.
        null
);
```

:::warning
`DamageSources#source` 是对 `new DamageSource` 的包装，它会交换第二和第三个参数（直接实体和致害实体）。请确保你把正确的值提供给了正确的参数。
:::

如果 `DamageSource` 完全没有任何实体或位置上下文，那么把它们缓存到一个字段中是合理的。对于确实带有实体或位置上下文的 `DamageSource`，通常会添加辅助方法，例如：

```java
public static DamageSource exampleDamage(Entity causer) {
    return new DamageSource(
            causer.level().registryAccess().registryOrThrow(Registries.DAMAGE_TYPE).getHolderOrThrow(EXAMPLE_DAMAGE),
            causer);
}
```

:::tip
原版的 `DamageSource` 工厂方法可以在 `DamageSources` 中找到，而原版的 `DamageType` 资源键可以在 `DamageTypes` 中找到。
:::

伤害来源最首要的使用场景是 `Entity#hurt`。每当一个实体受到伤害时，都会调用此方法。要用我们自己的伤害类型伤害一个实体，我们只需自己调用 `Entity#hurt`：

```java
// The second parameter is the amount of damage, in half hearts.
entity.hurt(exampleDamage(player), 10);
```

其他与伤害类型相关的行为，例如无敌检查，通常通过伤害类型[标签][tags]来运行。这些标签由 Minecraft 和 NeoForge 共同添加，分别可以在 `DamageTypeTags` 和 `Tags.DamageTypes` 下找到。

## 数据生成 {#datagen}

_更多信息，请参阅[数据包注册表的数据生成][drdatagen]。_

伤害类型 JSON 文件可以进行[数据生成][datagen]。由于伤害类型是一种数据包注册表，我们向 `GatherDataEvent` 添加一个 `DatapackBuiltinEntriesProvider`，并把我们的伤害类型放入 `RegistrySetBuilder`：

```java
// In your datagen class
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent event) {
    CompletableFuture<HolderLookup.Provider> lookupProvider = event.getLookupProvider();
    event.getGenerator().addProvider(
            event.includeServer(),
            output -> new DatapackBuiltinEntriesProvider(output, lookupProvider, new RegistrySetBuilder()
                    // Add a datapack builtin entry provider for damage types. If this lambda becomes longer,
                    // this should probably be extracted into a separate method for the sake of readability.
                    .add(Registries.DAMAGE_TYPE, bootstrap -> {
                        // Use new DamageType() to create an in-code representation of a damage type.
                        // The parameters map to the values of the JSON file, in the order seen above.
                        // All parameters except for the message id and the exhaustion value are optional.
                        bootstrap.register(EXAMPLE_DAMAGE, new DamageType(EXAMPLE_DAMAGE.location(),
                                DamageScaling.WHEN_CAUSED_BY_LIVING_NON_PLAYER,
                                0.1f,
                                DamageEffects.HURT,
                                DeathMessageType.DEFAULT))
                    })
                    // Add datapack providers for other datapack entries, if applicable.
                    .add(...),
                    Set.of(ExampleMod.MOD_ID)
            )
    );
}
```

[datagen]: ../index.md#data-generation
[dr]: ../../concepts/registries.md#datapack-registries
[drdatagen]: ../../concepts/registries.md#data-generation-for-datapack-registries
[extenum]: ../../advanced/extensibleenums.md
[rk]: ../../misc/resourcelocation.md#resourcekeys
[tags]: tags.md

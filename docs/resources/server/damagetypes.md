# 伤害类型与伤害来源 {#damage-types--damage-sources}

伤害类型（damage type）表示施加给[实体][entity]的是哪种伤害——物理伤害、火焰伤害、溺水伤害、魔法伤害、虚空伤害等等。区分伤害类型可用于各种免疫（例如烈焰人不受火焰伤害）、附魔（例如爆炸保护只防护爆炸伤害）以及更多用例。

可以说，伤害类型是伤害来源的模板。换言之，伤害来源可以看作伤害类型的一个实例。伤害类型在代码中以 [`ResourceKey`][rk] 的形式存在，但其所有属性都定义在数据包中。而伤害来源则由游戏根据数据包文件中的值按需创建，它们可以持有额外的上下文，例如发起攻击的实体。

## 创建伤害类型 {#creating-damage-types}

首先，你需要创建自己的 `DamageType`。`DamageType` 是一个[数据包注册表][dr]，因此新的 `DamageType` 不在代码中注册，而是在添加对应文件时自动注册。不过，我们仍需为代码提供某个入口以便从中获取伤害来源。为此我们指定一个[资源键][rk]：

```java
public static final ResourceKey<DamageType> EXAMPLE_DAMAGE =
        ResourceKey.create(Registries.DAMAGE_TYPE, Identifier.fromNamespaceAndPath(ExampleMod.MOD_ID, "example"));
```

既然现在能从代码中引用它了，我们就在数据文件中指定一些属性。我们的数据文件位于 `data/examplemod/damage_type/example.json`（将 `examplemod` 和 `example` 替换为 mod id 和资源位置的名称），内容如下：

```json5
{
    // The death message id of the damage type. The full death message translation key will be
    // "death.attack.examplemod.example" (with swapped-out mod id and name).
    "message_id": "examplemod.example",
    // Whether this damage type's damage amount scales with difficulty or not. Valid vanilla values are:
    // - "never": The damage value remains the same on any difficulty. Common for player-caused damage types.
    // - "when_caused_by_living_non_player": The damage value is scaled if the entity is caused by a
    //   living entity of some sort, including indirectly (e.g. an arrow shot by a skeleton), that is not a player.
    // - "always": The damage value is always scaled. Commonly used by explosion-like damage.
    "scaling": "when_caused_by_living_non_player",
    // The amount of exhaustion caused by receiving this kind of damage.
    "exhaustion": 0.1,
    // The damage effects (currently only sound effects) that are applied when receiving this kind of damage. Optional.
    // Valid vanilla values are "hurt" (default), "thorns", "drowning", "burning", "poking", and "freezing".
    "effects": "hurt",
    // The death message type. Determines how the death message is built. Optional.
    // Valid vanilla values are "default" (default), "fall_variants", and "intentional_game_design".
    "death_message_type": "default"
}
```

:::tip
`scaling`、`effects` 和 `death_message_type` 字段在内部分别由枚举 `DamageScaling`、`DamageEffects` 和 `DeathMessageType` 控制。若有需要，这些枚举可以[扩展][extenum]以添加自定义值。
:::

原版的伤害类型也使用相同的格式，包开发者可以在需要时更改这些值。
 
## 创建与使用伤害来源 {#creating-and-using-damage-sources}

`DamageSource` 通常在调用 [`Entity#hurt`][entityhurt] 时即时创建。请注意，由于伤害类型是[数据包注册表][dr]，你需要一个 `RegistryAccess` 来查询它们，它可通过 `Level#registryAccess` 获取。要创建一个 `DamageSource`，调用 `DamageSource` 构造器，最多可传入四个参数：

```java
DamageSource damageSource = new DamageSource(
        // The damage type holder to use. Query from the registry. This is the only required parameter.
        registryAccess.lookupOrThrow(Registries.DAMAGE_TYPE).getOrThrow(EXAMPLE_DAMAGE),
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
`DamageSources#source` 是对 `new DamageSource` 的一个包装，它会交换第二个和第三个参数（直接实体和肇事实体）。请确保你将正确的值传给了正确的参数。
:::

如果 `DamageSource` 完全没有实体或位置上下文，那么把它们缓存在字段中是合理的。对于确实带有实体或位置上下文的 `DamageSource`，通常会添加辅助方法，如下所示：

```java
public static DamageSource exampleDamage(Entity causer) {
    return new DamageSource(
            causer.level().registryAccess().lookupOrThrow(Registries.DAMAGE_TYPE).getOrThrow(EXAMPLE_DAMAGE),
            causer);
}
```

:::tip
原版的 `DamageSource` 工厂可在 `DamageSources` 中找到，原版的 `DamageType` 资源键可在 `DamageTypes` 中找到。实体还有 `Entity#damageSources` 方法，它是获取 `DamageSources` 实例的便捷取值方法。
:::

伤害来源最主要的用例是 `Entity#hurt`。每当一个实体受到伤害时都会调用该方法。要用我们自己的伤害类型伤害一个实体，只需自行调用 `Entity#hurt`：

```java
// The second parameter is the amount of damage, in half hearts.
entity.hurt(exampleDamage(player), 10);
```

其他与伤害类型相关的行为，例如无敌检测，通常通过伤害类型[标签][tags]来运行。这些标签由 Minecraft 和 NeoForge 分别添加，可在 `DamageTypeTags` 和 `Tags.DamageTypes` 中找到。

## 数据生成 {#datagen}

_更多信息，请参阅[数据包注册表的数据生成][drdatagen]。_

伤害类型 JSON 文件可以进行[数据生成][datagen]。由于伤害类型是数据包注册表，我们通过 `GatherDataEvent#createDatapackRegistryObjects` 添加一个 `DatapackBuiltinEntriesProvider`，并把我们的伤害类型放入 `RegistrySetBuilder`：

```java
// In your datagen class
@SubscribeEvent // on the mod event bus
public static void onGatherData(GatherDataEvent.Client event) {
    event.createDatapackRegistryObjects(new RegistrySetBuilder()
        // Add a datapack builtin entry provider for damage types. If this lambda becomes longer,
        // this should probably be extracted into a separate method for the sake of readability.
        .add(Registries.DAMAGE_TYPE, bootstrap -> {
            // Use new DamageType() to create an in-code representation of a damage type.
            // The parameters map to the values of the JSON file, in the order seen above.
            // All parameters except for the message id and the exhaustion value are optional.
            bootstrap.register(EXAMPLE_DAMAGE, new DamageType(EXAMPLE_DAMAGE.identifier(),
                DamageScaling.WHEN_CAUSED_BY_LIVING_NON_PLAYER,
                0.1f,
                DamageEffects.HURT,
                DeathMessageType.DEFAULT)
            )
        })
        // Add datapack providers for other datapack entries, if applicable.
        .add(...)
    );

    // ...
}
```

[datagen]: ../index.md#data-generation
[dr]: ../../concepts/registries.md#datapack-registries
[drdatagen]: ../../concepts/registries.md#data-generation-for-datapack-registries
[entity]: ../../entities/index.md
[entityhurt]: ../../entities/index.md#damaging-entities
[extenum]: ../../advanced/extensibleenums.md
[rk]: ../../misc/identifier.md#resourcekeys
[tags]: tags.md

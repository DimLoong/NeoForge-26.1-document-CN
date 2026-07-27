# 数据加载条件 {#data-load-conditions}

有时，我们希望在另一个 mod 存在时、或在任意 mod 添加了另一种矿石等情况下，才启用或禁用某些功能。针对这些使用场景，NeoForge 添加了数据加载条件（data load conditions）。它们最初被称为配方条件，因为配方是这套系统最初的使用场景，但此后它已被扩展到其他系统。这也是为什么某些内置条件仅限于物品。

大多数 JSON 文件都可以在根级别选择性地声明一个 `neoforge:conditions` 块，它会在数据文件实际被加载之前进行求值。当且仅当所有条件都通过时，加载才会继续，否则该数据文件将被忽略。（此规则的例外是[战利品表][loottable]，它会被替换为一个空的战利品表。）

```json5
{
    "neoforge:conditions": [
        {
            // Condition 1
        },
        {
            // Condition 2
        },
        // ...
    ],
    // The rest of the data file
}
```

例如，如果我们只想在 id 为 `examplemod` 的 mod 存在时才加载文件，那么我们的文件大致如下：

```json5
{
    // highlight-start
    "neoforge:conditions": [
        {
            "type": "neoforge:mod_loaded",
            "modid": "examplemod"
        }
    ],
    // highlight-end
    "type": "minecraft:crafting_shaped",
    // ...
}
```

:::note
大多数原版文件已被修补，通过 `ConditionalCodec` 包装器来使用条件。然而，并非所有系统都能使用条件，尤其是那些不使用 [Codec][codec] 的系统。要确定某个数据文件是否可以使用条件，请检查其背后的 codec 定义。
:::

## 内置条件 {#built-in-conditions}

### `neoforge:true` 和 `neoforge:false` {#neoforgetrue-and-neoforgefalse}

它们不包含任何数据，并返回预期的值。

```json5
{
    // Will always return true (or false for "neoforge:false")
    "type": "neoforge:true"
}
```

:::tip
使用 `neoforge:false` 条件可以非常干净利落地禁用任意数据文件。只需在所需位置放置一个包含以下内容的文件：

```json5
{"neoforge:conditions":[{"type":"neoforge:false"}]}
```

以这种方式禁用文件**不会**造成日志刷屏。
:::

### `neoforge:not` {#neoforgenot}

此条件接受另一个条件并对其取反。

```json5
{
    // Inverts the result of the stored condition
    "type": "neoforge:not",
    "value": {
        // Another condition
    }
}
```

### `neoforge:and` 和 `neoforge:or` {#neoforgeand-and-neoforgeor}

这些条件接受被操作的一个或多个条件，并应用预期的逻辑。所接受条件的数量没有限制。

```json5
{
    // ANDs the stored conditions together (or ORs for "neoforge:or")
    "type": "neoforge:and",
    "values": [
        {
            // First condition
        },
        {
            // Second condition
        }
    ]
}
```

### `neoforge:mod_loaded` {#neoforgemod_loaded}

如果给定 mod id 的 mod 已加载，此条件返回 true，否则返回 false。

```json5
{
    "type": "neoforge:mod_loaded",
    // Returns true if "examplemod" is loaded
    "modid": "examplemod"
}
```

### `neoforge:item_exists` {#neoforgeitem_exists}

如果给定注册名的物品已被注册，此条件返回 true，否则返回 false。

```json5
{
    "type": "neoforge:item_exists",
    // Returns true if "examplemod:example_item" has been registered
    "item": "examplemod:example_item"
}
```

### `neoforge:tag_empty` {#neoforgetag_empty}

如果给定的物品[标签][tag]为空，此条件返回 true，否则返回 false。

```json5
{
    "type": "neoforge:tag_empty",
    // Returns true if "examplemod:example_tag" is an empty item tag
    "tag": "examplemod:example_tag"
}
```

## 创建自定义条件 {#creating-custom-conditions}

要创建自定义条件，可以实现 `ICondition` 及其 `#test(IContext)` 方法，并为其创建一个[映射 codec][codec]。 `#test` 中的 `IContext` 参数可以访问游戏状态的某些部分。目前，它只允许你从注册表中查询标签。某些带条件的对象可能会比标签更早加载，在这种情况下上下文将是 `IContext.EMPTY`，完全不包含任何标签信息。

例如，假设我们想重新实现 `tag_empty` 条件，但针对的是实体类型标签而非物品标签，那么我们的条件大致如下：

```java
// This class is basically a boiled-down copy of TagEmptyCondition, adjusted for entity types instead of items.
public record EntityTagEmptyCondition(TagKey<EntityType<?>> tag) implements ICondition {
    public static final MapCodec<EntityTagEmptyCondition> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            ResourceLocation.CODEC.xmap(rl -> TagKey.create(Registries.ENTITY_TYPES, rl), TagKey::location).fieldOf("tag").forGetter(EntityTagEmptyCondition::tag)
    ).apply(inst, EntityTagEmptyCondition::new));

    @Override
    public boolean test(ICondition.IContext context) {
        return context.getTag(this.tag()).isEmpty();
    }

    @Override
    public MapCodec<? extends ICondition> codec() {
        return CODEC;
    }
}
```

条件本身是一个 codec 的注册表。因此，我们需要像下面这样[注册][register]我们的 codec：

```java
public static final DeferredRegister<MapCodec<? extends ICondition>> CONDITION_CODECS =
        DeferredRegister.create(NeoForgeRegistries.Keys.CONDITION_CODECS, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<EntityTagEmptyCondition>> ENTITY_TAG_EMPTY =
        CONDITION_CODECS.register("entity_tag_empty", () -> EntityTagEmptyCondition.CODEC);
```

然后，我们就可以在某个数据文件中使用我们的条件了（假设我们在 `examplemod` 命名空间下注册了该条件）：

```json5
{
    "neoforge:conditions": [
        {
            "type": "examplemod:entity_tag_empty",
            "tag": "minecraft:zombies"
        }
    ],
    // The rest of the data file
}
```

## 数据生成 {#datagen}

虽然任何数据包 JSON 文件都可以使用加载条件，但只有少数[数据提供器][datagen]经过修改，能够生成它们。这些包括：

- [`RecipeProvider`][recipeprovider]（通过 `RecipeOutput#withConditions`），包括配方进度
- `JsonCodecProvider` 及其子类 `SpriteSourceProvider`
- [`DataMapProvider`][datamapprovider]
- [`GlobalLootModifierProvider`][glmprovider]

至于条件本身，`IConditionBuilder` 接口为每种内置条件类型提供了静态辅助方法，返回对应的 `ICondition`。

[codec]: ../../datastorage/codecs
[datagen]: ../index.md#data-generation
[datamapprovider]: datamaps/index.md#data-generation
[glmprovider]: loottables/glm.md#datagen
[loottable]: loottables/index.md
[recipeprovider]: recipes/index.md#data-generation
[register]: ../../concepts/registries
[tag]: tags.md

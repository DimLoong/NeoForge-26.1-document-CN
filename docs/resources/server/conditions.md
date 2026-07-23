# 数据加载条件 {#data-load-conditions}

有时，你会希望在存在另一个 Mod、或某个 Mod 添加了另一种矿石等情况下，启用或禁用某些功能。针对这些用例，NeoForge 添加了数据加载条件（data load conditions）。它们最初被称为配方条件（recipe conditions），因为配方是该系统的最初用例，但此后已扩展到其他系统。这也是为什么某些内置条件仅限于物品。

大多数 JSON 文件都可以在其根部选择性地声明一个 `neoforge:conditions` 块，它会在数据文件真正被加载之前进行求值。当且仅当所有条件都通过时，加载才会继续，否则该数据文件将被忽略。（此规则的例外是[战利品表][loottable]，它们会被替换为一个空的战利品表。）

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

:::note
如果要加载的值不是一个映射／对象，则它存储在 `neoforge:value` 中：

```json5
{
    "neoforge:conditions": [ /* ...*/ ],
    "neoforge:value": 2 // The value to load
}
```
:::

例如，若我们只想在存在 id 为 `examplemod` 的 Mod 时才加载文件，我们的文件大致如下：

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
大多数原版文件已被修补，改用 `ConditionalCodec` 包装器来支持条件。然而，并非所有系统都能使用条件，尤其是那些不使用 [Codec][codec] 的系统。要弄清楚某个数据文件能否使用条件，请检查其背后的 codec 定义。
:::

## 内置条件 {#built-in-conditions}

### `neoforge:always` 与 `neoforge:never` {#neoforgealways-and-neoforgenever}

它们不含任何数据，并返回预期的值。

```json5
{
    // Will always return true (or false for "neoforge:never")
    "type": "neoforge:always"
}
```

:::tip
使用 `neoforge:never` 条件可以非常干净地禁用任何数据文件。只需在所需位置放置一个内容如下的文件：

```json5
{"neoforge:conditions":[{"type":"neoforge:never"}]}
```

以这种方式禁用文件**不会**造成日志刷屏。
:::

### `neoforge:not` {#neoforgenot}

该条件接受另一个条件并将其取反。

```json5
{
    // Inverts the result of the stored condition
    "type": "neoforge:not",
    "value": {
        // Another condition
    }
}
```

### `neoforge:and` 与 `neoforge:or` {#neoforgeand-and-neoforgeor}

这些条件接受被操作的条件并施加预期的逻辑。所接受的条件数量没有限制。

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

若给定 mod id 的 Mod 已加载，该条件返回 true，否则返回 false。

```json5
{
    "type": "neoforge:mod_loaded",
    // Returns true if "examplemod" is loaded
    "modid": "examplemod"
}
```

### `neoforge:registered` {#neoforgeregistered}

若某个特定注册表中已注册了给定注册名的对象，该条件返回 true，否则返回 false。

```json5
{
    "type": "neoforge:registered",
    // The registry to check the value for
    // Defaults to `minecraft:item`
    "registry": "minecraft:item",
    // Returns true if "examplemod:example_item" has been registered
    "value": "examplemod:example_item"
}
```

### `neoforge:tag_empty` {#neoforgetag_empty}

若给定的注册表[标签][tag]为空，该条件返回 true，否则返回 false。

```json5
{
    "type": "neoforge:tag_empty",
    // The registry to check the tag for
    // Defaults to `minecraft:item`
    "registry": "minecraft:item",
    // Returns true if "examplemod:example_tag" is an empty tag
    "tag": "examplemod:example_tag"
}
```

### `neoforge:feature_flags_enabled` {#neoforgefeature_flags_enabled}

若所提供的[特性标志][flags]已启用，该条件返回 true，否则返回 false。

```json5
{
    "type": "neoforge:feature_flags_enabled",
    // Returns true if the "examplemod:example_feature" is enabled
    "flags": [
        "examplemod:example_feature"
    ]
}
```

## 创建自定义条件 {#creating-custom-conditions}

自定义条件可以通过实现 `ICondition` 及其 `#test(IContext)` 方法，并为其创建一个[映射 codec][codec] 来创建。`#test` 中的 `IContext` 参数可以访问游戏状态的某些部分。目前，它只允许你从注册表中查询标签。某些带条件的对象可能比标签更早加载，这种情况下上下文将是 `IContext.EMPTY`，完全不包含任何标签信息。

例如，假设我们想实现一个 `xor` 条件，那么我们的条件大致如下：

```java
public record XorCondition(ICondition first, ICondition second) implements ICondition {
    public static final MapCodec<XorCondition> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            ICondition.CODEC.fieldOf("first").forGetter(XorCondition::first),
            ICondition.CODEC.fieldOf("second").forGetter(XorCondition::second)
    ).apply(inst, XorCondition::new));

    @Override
    public boolean test(ICondition.IContext context) {
        return this.first.test(context) ^ this.second.test(context);
    }

    @Override
    public MapCodec<? extends ICondition> codec() {
        return CODEC;
    }
}
```

条件是一个 codec 的注册表。因此，我们需要[注册][register]我们的 codec，如下所示：

```java
public static final DeferredRegister<MapCodec<? extends ICondition>> CONDITION_CODECS =
        DeferredRegister.create(NeoForgeRegistries.Keys.CONDITION_CODECS, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<XorCondition>> XOR =
        CONDITION_CODECS.register("xor", () -> XorCondition.CODEC);
```

然后，我们就可以在某个数据文件中使用我们的条件（假设我们在 `examplemod` 命名空间下注册了该条件）：

```json5
{
    "neoforge:conditions": [
        {
            "type": "examplemod:xor",
            "first": {
                // Either this condition is true
                "type": "..."
            },
            "second": {
                // Or this condition, not both!
                "type": "..."
            }
        }
    ],
    // The rest of the data file
}
```

## 数据生成 {#datagen}

虽然任何数据包 JSON 文件都可以使用加载条件，但只有少数[数据提供器][datagen]被修改为能够生成它们。这些包括：

- [`RecipeProvider`][recipeprovider]（通过 `RecipeOutput#withConditions`），包括配方进度
- `JsonCodecProvider` 及其子类 `SpriteSourceProvider`
- [`DataMapProvider`][datamapprovider]
- [`GlobalLootModifierProvider`][glmprovider]
- [`DatapackBuiltinEntriesProvider`][datapackentries]（通过 `Map<ResourceKey<?>, List<ICondition>>` 参数）

对于条件本身，`NeoForgeConditions` 类为每种内置条件类型提供了静态辅助方法，它们会返回对应的 `ICondition`。

[codec]: ../../datastorage/codecs
[datagen]: ../index.md#data-generation
[datamapprovider]: datamaps/index.md#data-generation
[datapackentries]: ../../concepts/registries.md#data-generation-for-datapack-registries
[flags]: ../../advanced/featureflags.md
[glmprovider]: loottables/glm.md#datagen
[loottable]: loottables/index.md
[recipeprovider]: recipes/index.md#data-generation
[register]: ../../concepts/registries
[tag]: tags.md

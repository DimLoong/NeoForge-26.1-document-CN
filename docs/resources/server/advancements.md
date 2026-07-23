# 进度 {#advancements}

进度（Advancement）是玩家可以完成的任务，类似任务系统。进度根据进度条件（criteria）授予，并可在完成时执行相应行为。

要新增一个进度，可在你命名空间的 `advancement` 子文件夹中创建一个 JSON 文件。例如，若要为 mod id 为 `examplemod` 的 Mod 添加一个名为 `example_name` 的进度，它将位于 `data/examplemod/advancement/example_name.json`。进度的 ID 相对于 `advancement` 目录，因此在本例中它是 `examplemod:example_name`。名称可任意选择，游戏会自动识别该进度。只有当你想添加新的条件、或从代码中触发某个条件时，才需要 Java 代码（见下文）。

## 规格说明 {#specification}

一个进度 JSON 文件可以包含以下条目：

- `parent`：该进度的父进度 ID。循环引用会被检测到并导致加载失败。可选；若缺省，该进度将被视为根进度。根进度是未设置父级的进度，它们是各自[进度树][tree]的根。
- `display`：一个对象，包含若干用于在进度 GUI 中显示该进度的属性。可选；若缺省，该进度将不可见，但仍可被触发。
    - `icon`：一个[物品堆叠的 JSON 表示][itemstackjson]。
    - `title`：用作进度标题的[文本组件][text]。
    - `description`：用作进度描述的[文本组件][text]。
    - `frame`：进度的边框类型。接受 `challenge`、`goal` 和 `task`。可选，默认为 `task`。
    - `background`：用于进度树背景的纹理。它相对于 `textures` 目录，即不应包含 `textures/` 文件夹前缀。可选，默认为缺失纹理。仅对根进度生效。
    - `show_toast`：完成时是否在右上角显示一条弹窗提示（toast）。可选，默认为 true。
    - `announce_to_chat`：是否在聊天栏中公告进度完成。可选，默认为 true。
    - `hidden`：在完成之前，是否在进度 GUI 中隐藏该进度及其所有子进度。对根进度本身无效，但仍会隐藏其所有子进度。可选，默认为 false。
- `criteria`：该进度应追踪的条件映射。每个条件由其映射键标识。Minecraft 添加的条件触发器列表可在 `CriteriaTriggers` 类中找到，其 JSON 规格可在 [Minecraft Wiki][triggers] 上找到。关于实现你自己的条件或从代码中触发条件，请见下文。
- `requirements`：一个由列表组成的列表，用于确定需要哪些条件。这是一组 OR 列表，它们之间以 AND 相连，换言之，每个子列表都必须至少有一个条件匹配。可选，默认为所有条件都必需。
- `rewards`：一个对象，表示完成该进度时授予的奖励。可选，该对象的所有值也都可选。
    - `experience`：授予玩家的经验值数量。
    - `recipes`：要解锁的[配方][recipe] ID 列表。
    - `loot`：要掷取并交给玩家的[战利品表][loottable]列表。
    - `function`：要运行的[函数][function]。若你想运行多个函数，请创建一个运行其他所有函数的包装函数。
- `sends_telemetry_event`：决定完成该进度时是否收集遥测数据。仅当处于 `minecraft` 命名空间时才实际生效。可选，默认为 false。
- `neoforge:conditions`：NeoForge 新增。一个[条件][conditions]列表，进度必须通过这些条件才会被加载。可选。

### 进度树 {#advancement-trees}

进度文件可以按目录分组，这会告诉游戏创建多个进度选项卡。一个进度选项卡可以包含一个或多个进度树，取决于根进度的数量。空的进度选项卡会被自动隐藏。

:::tip
Minecraft 每个选项卡始终只有一个根进度，并且总是将根进度命名为 `root`。建议遵循这一做法。
:::

## 条件触发器 {#criteria-triggers}

要解锁一个进度，必须满足其指定的条件。条件通过触发器（trigger）来追踪，当相关动作发生时由代码执行触发器（例如 `player_killed_entity` 触发器在玩家击杀指定[实体][entity]时执行）。每当一个进度被加载进游戏，其定义的条件都会被读取并作为监听器添加到触发器上。当一个触发器被执行时，所有为对应条件注册了监听器的进度都会被重新检查是否完成。若进度完成，监听器将被移除。

自定义条件触发器由两部分组成：触发器，通过在代码中调用 `#trigger` 激活；以及实例（instance），用于定义触发器应在何种条件下授予该条件。触发器继承 `SimpleCriterionTrigger<T>`，而实例实现 `SimpleCriterionTrigger.SimpleInstance`。泛型值 `T` 表示触发器实例的类型。

### `SimpleCriterionTrigger.SimpleInstance` {#simplecriteriontriggersimpleinstance}

`SimpleCriterionTrigger.SimpleInstance` 表示定义在 `criteria` 对象中的单个条件。触发器实例负责持有已定义的条件，并返回输入是否匹配该条件。

条件通常通过构造器传入。`SimpleCriterionTrigger.SimpleInstance` 接口只要求一个方法 `#player`，它以 `Optional<ContextAwarePredicate>` 的形式返回玩家必须满足的条件。若子类是一个带有该类型 `player` 参数的 record（如下所示），则自动生成的 `#player` 方法即可满足要求。

```java
public record ExampleTriggerInstance(Optional<ContextAwarePredicate> player/*, other parameters here*/)
        implements SimpleCriterionTrigger.SimpleInstance {}
```

通常，触发器实例会有静态辅助方法，用于从实例的参数构造出完整的 `Criterion<T>` 对象。这使得这些实例在数据生成期间易于创建，但它们是可选的。

```java
// In this example, EXAMPLE_TRIGGER is a DeferredHolder<CriterionTrigger<?>, ExampleTrigger>.
// See below for how to register triggers.
public static Criterion<ExampleTriggerInstance> instance(ContextAwarePredicate player, ItemPredicate item) {
    return EXAMPLE_TRIGGER.get().createCriterion(new ExampleTriggerInstance(Optional.of(player), item));
}
```

最后，应添加一个方法，它接收当前的数据状态并返回用户是否满足了必要条件。玩家的条件已通过 `SimpleCriterionTrigger#trigger(ServerPlayer, Predicate)` 检查。大多数触发器实例将此方法命名为 `#matches`。

```java
// Let's assume we have an additional ItemPredicate parameter. This can be whatever you need.
// For example, this could also be a Predicate<LivingEntity>.
public record ExampleTriggerInstance(Optional<ContextAwarePredicate> player, ItemPredicate predicate)
        implements SimpleCriterionTrigger.SimpleInstance {
    // This method is unique for each instance and is as such not overridden.
    // The parameter may be whatever you need to properly match, for example, this could also be a LivingEntity.
    // If you need no context other than the player, this may also take no parameters at all.
    public boolean matches(ItemStack stack) {
        // Since ItemPredicate matches a stack, we use a stack as the input here.
        return this.predicate.test(stack);
    }
}
```

### `SimpleCriterionTrigger` {#simplecriteriontrigger}

`SimpleCriterionTrigger<T>` 实现有两个用途：提供一个用于检查触发器实例并在成功时运行所附监听器的方法；以及指定一个用于序列化触发器实例（`T`）的 [Codec][codec]。

首先，我们要添加一个方法，它接收我们所需的输入并调用 `SimpleCriterionTrigger#trigger` 来正确处理对所有监听器的检查。大多数触发器实例也将此方法命名为 `#trigger`。复用上文的示例触发器实例，我们的触发器大致如下：

```java
public class ExampleCriterionTrigger extends SimpleCriterionTrigger<ExampleTriggerInstance> {
    // This method is unique for each trigger and is as such not a method to override
    public void trigger(ServerPlayer player, ItemStack stack) {
        this.trigger(player,
                // The condition checker method within the SimpleCriterionTrigger.SimpleInstance subclass
                triggerInstance -> triggerInstance.matches(stack)
        );
    }
}
```

触发器必须注册到 `Registries.TRIGGER_TYPE` [注册表][registration]：

```java
public static final DeferredRegister<CriterionTrigger<?>> TRIGGER_TYPES =
        DeferredRegister.create(Registries.TRIGGER_TYPE, ExampleMod.MOD_ID);

public static final Supplier<ExampleCriterionTrigger> EXAMPLE_TRIGGER =
        TRIGGER_TYPES.register("example", ExampleCriterionTrigger::new);
```

然后，触发器必须通过重写 `#codec` 来定义一个用于序列化和反序列化触发器实例的 [Codec][codec]。该 codec 通常作为常量创建在实例实现内部。

```java
public record ExampleTriggerInstance(Optional<ContextAwarePredicate> player/*, other parameters here*/)
        implements SimpleCriterionTrigger.SimpleInstance {
    public static final Codec<ExampleTriggerInstance> CODEC = ...;

    // ...
}

public class ExampleTrigger extends SimpleCriterionTrigger<ExampleTriggerInstance> {
    @Override
    public Codec<ExampleTriggerInstance> codec() {
        return ExampleTriggerInstance.CODEC;
    }

    // ...
}
```

对于前面那个带有 `ContextAwarePredicate` 和 `ItemPredicate` 的 record 示例，其 codec 可以是：

```java
public static final Codec<ExampleTriggerInstace> CODEC = RecordCodecBuilder.create(instance -> instance.group(
        EntityPredicate.ADVANCEMENT_CODEC.optionalFieldOf("player").forGetter(ExampleTriggerInstance::player),
        ItemPredicate.CODEC.fieldOf("item").forGetter(ExampleTriggerInstance::item)
).apply(instance, ExampleTriggerInstance::new));
```

### 调用条件触发器 {#calling-criterion-triggers}

每当被检查的动作被执行时，就应调用由我们的 `SimpleCriterionTrigger` 子类定义的 `#trigger` 方法。当然，你也可以调用原版触发器，它们位于 `CriteriaTriggers` 中。

```java
// In some piece of code where the action is being performed
// Again, EXAMPLE_TRIGGER is a supplier for the registered instance of the custom criterion trigger
public void performExampleAction(ServerPlayer player, additionalContextParametersHere) {
    // Run code to perform action here
    EXAMPLE_TRIGGER.get().trigger(player, additionalContextParametersHere);
}
```

## 数据生成 {#data-generation}

进度可以使用 `AdvancementProvider` 进行[数据生成][datagen]。`AdvancementProvider` 接受一个 `AdvancementSubProvider` 列表，实际的进度由它们使用 `Advancement.Builder` 生成。

首先，在某个 `GatherDataEvent` 中创建一个 `AdvancementProvider` 实例：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    // Call event.createDatapackRegistryObjects(...) first if adding datapack objects

    event.createProvider((output, lookupProvider) -> new AdvancementProvider(
        output, lookupProvider,
        // Add generators here
        List.of(...)
    ));

     // Other providers
}
```

下一步是用我们的生成器填充这个列表。为此，我们既可以将生成器实现为类，也可以实现为 lambda，然后把它们各自的实例添加到构造器参数中当前为空的列表里。

```java
// Class example
public class MyAdvancementGenerator implements AdvancementSubProvider {

    @Override
    public void generate(HolderLookup.Provider registries, Consumer<AdvancementHolder> saver) {
        // Generate your advancements here.
    }
}

// Method Example
public class ExampleClass {

    // Matches the parameters provided by AdvancementSubProvider#generate
    public static void generateExampleAdvancements(HolderLookup.Provider registries, Consumer<AdvancementHolder> saver) {
        // Generate your advancements here.
    }
}

// In one of the `GatherDataEvent`s
event.createProvider((output, lookupProvider) -> new AdvancementProvider(
    output, lookupProvider,
    // Add generators here
    List.of(
        // Add an instance of our generator to the list parameter. This can be done as many times as you want.
        // Having multiple generators is purely for organization, all functionality can be achieved with a single generator.
        new MyAdvancementGenerator(),
        ExampleClass::generateExampleAdvancements
    )
));
```

要生成一个进度，你需要使用 `Advancement.Builder`：

```java
// All methods follow the builder pattern, meaning that chaining is possible and encouraged.
// For better readability of the explanations, chaining will not be done here.

// Create an advancement builder using the static #advancement() method.
// Using #advancement() automatically enables telemetry events. If you do not want this,
// #recipeAdvancement() can be used instead, there are no other functional differences.
Advancement.Builder builder = Advancement.Builder.advancement();

// Sets the parent of the advancement. You can use another advancement you have already generated,
// or create a placeholder advancement using the static AdvancementSubProvider#createPlaceholder method.
builder.parent(AdvancementSubProvider.createPlaceholder("minecraft:story/root"));

// Sets the display properties of the advancement. This can either be a DisplayInfo object,
// or pass in the values directly. If values are passed in directly, a DisplayInfo object will be created for you.
builder.display(
        // The advancement icon. Can be an ItemStackTemplate or an ItemLike.
        new ItemStackTemplate(Items.GRASS_BLOCK),
        // The advancement title and description. Don't forget to add translations for these!
        Component.translatable("advancements.examplemod.example_advancement.title"),
        Component.translatable("advancements.examplemod.example_advancement.description"),
        // The background texture. Use null if you don't want a background texture (for non-root advancements).
        null,
        // The frame type. Valid values are AdvancementType.TASK, CHALLENGE, or GOAL.
        AdvancementType.GOAL,
        // Whether to show the advancement toast or not.
        true,
        // Whether to announce the advancement into chat or not.
        true,
        // Whether the advancement should be hidden or not.
        false
);

// An advancement reward builder. Can be created with any of the four reward types, and further rewards
// can be added using the methods prefixed with add. This can also be built beforehand,
// and the resulting AdvancementRewards can then be reused across multiple advancement builders.
builder.rewards(
    // Alternatively, use addExperience() to add to an existing builder.
    AdvancementRewards.Builder.experience(100)
    // Alternatively, use loot() to create a new builder.
    .addLootTable(ResourceKey.create(Registries.LOOT_TABLE, Identifier.fromNamespaceAndPath("minecraft", "chests/igloo")))
    // Alternatively, use recipe() to create a new builder.
    .addRecipe(ResourceKey.create(Registries.RECIPE, Identifier.fromNamespaceAndPath("minecraft", "iron_ingot")))
    // Alternatively, use function() to create a new builder.
    .runs(Identifier.fromNamespaceAndPath("examplemod", "example_function"))
);

// Adds a criterion with the given name to the advancement. Use the corresponding trigger instance's static method.
builder.addCriterion("pickup_dirt", InventoryChangeTrigger.TriggerInstance.hasItems(Items.DIRT));

// Adds a requirements handler. Minecraft natively provides allOf() and anyOf(), more complex requirements
// must be implemented manually. Only has an effect with two or more criteria.
builder.requirements(AdvancementRequirements.allOf(List.of("pickup_dirt")));

// Save the advancement to disk, using the given resource location. This returns an AdvancementHolder,
// which may be stored in a variable and used as a parent by other advancement builders.
builder.save(saver, Identifier.fromNamespaceAndPath("examplemod", "example_advancement"));
```

[codec]: ../../datastorage/codecs.md
[conditions]: conditions.md
[datagen]: ../index.md#data-generation
[entity]: ../../entities/index.md
[function]: https://minecraft.wiki/w/Function_(Java_Edition)
[itemstackjson]: ../../items/index.md#json-representation
[loottable]: loottables/index.md
[recipe]: recipes/index.md
[registration]: ../../concepts/registries.md#methods-for-registering
[root]: #root-advancements
[text]: ../client/i18n.md#components
[tree]: #advancement-trees
[triggers]: https://minecraft.wiki/w/Advancement/JSON_format#List_of_triggers

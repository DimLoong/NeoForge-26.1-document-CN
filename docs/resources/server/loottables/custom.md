# 自定义战利品对象 {#custom-loot-objects}

由于战利品表系统较为复杂，其背后有若干[注册表][registries]在发挥作用，Mod 开发者都可以利用它们来添加更多行为。

所有与战利品表相关的注册表都遵循类似的模式。要添加一个新的注册项，你通常需要继承某个类或实现某个接口来承载你的功能。然后，你为序列化定义一个 [Codec][codec]，并像往常一样使用 `DeferredRegister` 把该 Codec 注册到对应的注册表。这与大多数注册表（例如方块/方块状态、物品/物品堆叠）所采用的“一个基础对象，多个实例”思路一致。

## 自定义战利品项 {#custom-loot-entries}

要创建自定义战利品项，需继承 `LootPoolEntryContainer` 或其两个直接子类之一：`LootPoolSingletonContainer` 或 `CompositeEntryBase`。为便于举例，我们想创建一个返回某个[实体][entity]掉落物的战利品项——这纯粹是为了举例，实际中直接引用另一张战利品表会更理想。我们先来创建战利品项类：

```java
// We extend LootPoolSingletonContainer since we have a "finite" set of drops.
// Some of this code is adapted from NestedLootTable.
public class EntityLootEntry extends LootPoolSingletonContainer {
    public static final MapCodec<EntityLootEntry> CODEC = RecordCodecBuilder.mapCodec(inst ->
        // Add our own fields.
        inst.group(
                        // A value referencing an entity type id.
                        BuiltInRegistries.ENTITY_TYPE.holderByNameCodec().fieldOf("entity").forGetter(e -> e.entity)
                )
                // Add common fields: weight, display, conditions, and functions.
                .and(singletonFields(inst))
                .apply(inst, EntityLootEntry::new)
    );

    // A Holder for the entity type we want to roll the other table for.
    private final Holder<EntityType<?>> entity;

    // It is common practice to have a private constructor and have a static factory method.
    // This is because weight, quality, conditions, and functions are supplied by a lambda below.
    private EntityLootEntry(Holder<EntityType<?>> entity, int weight, int quality, List<LootItemCondition> conditions, List<LootItemFunction> functions) {
        // Pass lambda-provided parameters to super.
        super(weight, quality, conditions, functions);
        // Set our values.
        this.entity = entity;
    }

    // Static builder method, accepting our custom parameters and combining them with a lambda that supplies the values common to all entries.
    public static LootPoolSingletonContainer.Builder<?> entityLoot(Holder<EntityType<?>> entity) {
        // Use the static simpleBuilder() method defined in LootPoolSingletonContainer.
        return simpleBuilder((weight, quality, conditions, functions) -> new EntityLootEntry(entity, weight, quality, conditions, functions));
    }

    // This is where the magic happens. To add an item stack, we generally call #accept on the consumer.
    // However, in this case, we let #getRandomItems do that for us.
    @Override
    public void createItemStack(Consumer<ItemStack> consumer, LootContext context) {
        // Get the entity's loot table. If it doesn't exist, an empty loot table will be returned, so null-checking is not necessary.
        LootTable table = context.getLevel().reloadableRegistries().getLootTable(entity.value().getDefaultLootTable());
        // Use the raw version here, because vanilla does it too. :P
        // #getRandomItemsRaw calls consumer#accept for us on the results of the roll.
        table.getRandomItemsRaw(context, consumer);
    }

    // Tells the entry what to use for serialization.
    @Override
    public MapCodec<EntityLootEntry> codec() {
        return CODEC;
    }
}
```

随后我们在[注册][registries]中使用这个映射 Codec：

```java
public static final DeferredRegister<MapCodec<? extends LootPoolEntryContainer>> LOOT_POOL_ENTRY_TYPES =
        DeferredRegister.create(Registries.LOOT_POOL_ENTRY_TYPE, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<EntityLootEntry>> ENTITY_LOOT =
        LOOT_POOL_ENTRY_TYPES.register("entity_loot", () -> EntityLootEntry.CODEC);
```

## 自定义数值提供器 {#custom-number-providers}

要创建自定义数值提供器，需实现 `NumberProvider` 接口。为便于举例，假设我们想创建一个将所提供数字变号的数值提供器：

```java
// We accept another number provider as our base.
public record InvertedSignProvider(NumberProvider base) implements NumberProvider {
    public static final MapCodec<InvertedSignProvider> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            NumberProviders.CODEC.fieldOf("base").forGetter(InvertedSignProvider::base)
    ).apply(inst, InvertedSignProvider::new));

    // Return a float value. Use the context and the record parameters as needed.
    @Override
    public float getFloat(LootContext context) {
        return -this.base.getFloat(context);
    }

    // Return an int value. Use the context and the record parameters as needed.
    // Overriding this is optional, the default implementation will round the result of #getFloat.
    @Override
    public int getInt(LootContext context) {
        return -this.base.getInt(context);
    }

    // Return a set of the loot context params used by this provider. See below for more information.
    // Since we have a base value, we just defer to the base.
    @Override
    public Set<ContextKey<?>> getReferencedContextParams() {
        return this.base.getReferencedContextParams();
    }

    // Tells the provider what to use for serialization.
    @Override
    public MapCodec<InvertedSignProvider> codec() {
        return CODEC;
    }
}
```

和自定义战利品项一样，我们随后在[注册][registries]中使用这个 Codec：

```java
public static final DeferredRegister<MapCodec<? extends NumberProvider>> LOOT_NUMBER_PROVIDER_TYPES =
        DeferredRegister.create(Registries.LOOT_NUMBER_PROVIDER_TYPE, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<? extends NumberProvider>> INVERTED_SIGN =
        LOOT_NUMBER_PROVIDER_TYPES.register("inverted_sign", () -> InvertedSignProvider.CODEC);
```

## 自定义基于等级的值 {#custom-level-based-values}

自定义 `LevelBasedValue` 可以通过在一个 record 中实现 `LevelBasedValue` 接口来创建。同样为便于举例，假设我们想将另一个 `LevelBasedValue` 的输出取反：

```java
public record InvertedSignLevelBasedValue(LevelBasedValue base) implements LevelBaseValue {
    public static final MapCodec<InvertedLevelBasedValue> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            LevelBasedValue.CODEC.fieldOf("base").forGetter(InvertedLevelBasedValue::base)
    ).apply(inst, InvertedLevelBasedValue::new));

    // Perform our operation.
    @Override
    public float calculate(int level) {
        return -this.base.calculate(level);
    }

    // Tells the value what to use for serialization.
    @Override
    public MapCodec<InvertedLevelBasedValue> codec() {
        return CODEC;
    }
}
```

同样，我们随后在[注册][registries]中使用这个 Codec：

```java
public static final DeferredRegister<MapCodec<? extends LevelBasedValue>> LEVEL_BASED_VALUES =
        DeferredRegister.create(Registries.ENCHANTMENT_LEVEL_BASED_VALUE_TYPE, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<InvertedSignLevelBasedValue>> INVERTED_SIGN =
        LEVEL_BASED_VALUES.register("inverted_sign", () -> InvertedSignLevelBasedValue.CODEC);
```

## 自定义战利品条件 {#custom-loot-conditions}

要开始，我们创建一个实现 `LootItemCondition` 的战利品物品条件类。为便于举例，假设我们只想在击杀该生物的玩家拥有一定经验等级时让该条件通过：

```java
public record HasXpLevelCondition(int level) implements LootItemCondition {
    // Add the context we need for this condition. In our case, this will be the xp level the player must have.
    public static final MapCodec<HasXpLevelCondition> CODEC = RecordCodecBuilder.mapCodec(inst -> inst.group(
            Codec.INT.fieldOf("level").forGetter(HasXpLevelCondition::level)
    ).apply(inst, HasXpLevelCondition::new));
    
    // Evaluates the condition here. Get the required loot context parameters from the provided LootContext.
    // In our case, we want the KILLER_ENTITY to have at least our required level.
    @Override
    public boolean test(LootContext context) {
        @Nullable
        Entity entity = context.getOptionalParameter(LootContextParams.KILLER_ENTITY);
        return entity instanceof Player player && player.experienceLevel >= level; 
    }
    
    // Tell the game what parameters we expect from the loot context. Used in validation.
    @Override
    public Set<ContextKey<?>> getReferencedContextParams() {
        return ImmutableSet.of(LootContextParams.KILLER_ENTITY);
    }

    // Tells the condition what to use for serialization.
    @Override
    public MapCodec<HasXpLevelCondition> codec() {
        return CODEC;
    }
}
```

我们可以把映射 Codec [注册][registries]到注册表：

```java
public static final DeferredRegister<MapCodec<? extends LootItemCondition>> LOOT_CONDITION_TYPES =
        DeferredRegister.create(Registries.LOOT_CONDITION_TYPE, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<HasXpLevelCondition>> MIN_XP_LEVEL =
        LOOT_CONDITION_TYPES.register("min_xp_level", () -> HasXpLevelCondition.CODEC);
```

## 自定义战利品函数 {#custom-loot-functions}

要开始，我们创建自己的类来继承 `LootItemFunction`。`LootItemFunction` 继承 `BiFunction<ItemStack, LootContext, ItemStack>`，所以我们要做的就是利用现有的物品堆叠和战利品上下文返回一个新的、被修改过的物品堆叠。不过，几乎所有战利品函数都不直接继承 `LootItemFunction`，而是继承 `LootItemConditionalFunction`。该类内置了为函数应用战利品条件的功能——只有当战利品条件满足时函数才会被应用。为便于举例，我们给物品应用一个具有指定等级的随机附魔：

```java
// Code adapted from vanilla's EnchantRandomlyFunction class.
// LootItemConditionalFunction is an abstract class, not an interface, so we cannot use a record here.
public class RandomEnchantmentWithLevelFunction extends LootItemConditionalFunction {
    // Our context: an optional list of enchantments, and a level.
    private final Optional<HolderSet<Enchantment>> enchantments;
    private final int level;
    // Our codec.
    public static final MapCodec<RandomEnchantmentWithLevelFunction> CODEC =
            // #commonFields adds the conditions field.
            RecordCodecBuilder.mapCodec(inst -> commonFields(inst).and(inst.group(
                    RegistryCodecs.homogeneousList(Registries.ENCHANTMENT).optionalFieldOf("enchantments").forGetter(e -> e.enchantments),
                    Codec.INT.fieldOf("level").forGetter(e -> e.level)
            ).apply(inst, RandomEnchantmentWithLevelFunction::new));
    
    public RandomEnchantmentWithLevelFunction(List<LootItemCondition> conditions, Optional<HolderSet<Enchantment>> enchantments, int level) {
        super(conditions);
        this.enchantments = enchantments;
        this.level = level;
    }
    
    // Run our enchantment application logic. Most of this is copied from EnchantRandomlyFunction#run.
    @Override
    public ItemStack run(ItemStack stack, LootContext context) {
        RandomSource random = context.getRandom();
        List<Holder<Enchantment>> stream = this.enchantments
                .map(HolderSet::stream)
                .orElseGet(() -> context.getLevel().registryAccess().lookupOrThrow(Registries.ENCHANTMENT).listElements().map(Function.identity()))
                .filter(e -> e.value().canEnchant(stack))
                .toList();
        Optional<Holder<Enchantment>> optional = Util.getRandomSafe(list, random);
        if (optional.isEmpty()) {
            LOGGER.warn("Couldn't find a compatible enchantment for {}", stack);
        } else {
            Holder<Enchantment> enchantment = optional.get();
            if (stack.is(Items.BOOK)) {
                stack = new ItemStack(Items.ENCHANTED_BOOK);
            }
            stack.enchant(enchantment, Mth.nextInt(random, enchantment.value().getMinLevel(), enchantment.value().getMaxLevel()));
        }
        return stack;
    }

    // Tells the function what to use for serialization.
    @Override
    public MapCodec<RandomEnchantmentWithLevelFunction> codec() {
        return CODEC;
    }
}
```

随后我们可以把映射 Codec [注册][registries]到注册表：

```java
public static final DeferredRegister<MapCodec<? extends LootItemFunction>> LOOT_FUNCTION_TYPES =
        DeferredRegister.create(Registries.LOOT_FUNCTION_TYPE, ExampleMod.MOD_ID);

public static final Supplier<MapCodec<RandomEnchantmentWithLevelFunction>> RANDOM_ENCHANTMENT_WITH_LEVEL =
        LOOT_FUNCTION_TYPES.register("random_enchantment_with_level", () -> RandomEnchantmentWithLevelFunction.CODEC);
```

[codec]: ../../../datastorage/codecs.md
[entity]: ../../../entities/index.md
[registries]: ../../../concepts/registries.md#methods-for-registering

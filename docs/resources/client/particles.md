# 粒子 {#particles}

粒子是常见的视觉效果，通常通过其关联的粒子类型来生成。它们既可以在客户端也可以在服务端生成[（端）][side]，但由于本质上主要是视觉效果，关键部分只存在于物理端（以及逻辑端）的客户端。

本文介绍粒子类型和粒子描述的构建与使用。有关渲染方面更具体的信息，参见配套的[客户端粒子][clientparticle]一文。

## 注册 `ParticleType` {#registering-particletypes}

粒子使用 `ParticleType` 进行注册。它的工作方式与 `EntityType` 或 `BlockEntityType` 类似：存在一个 `Particle` 类——每个生成的粒子都是该类的一个实例——然后还有一个 `ParticleType` 类，持有一些通用信息，用于注册。`ParticleType` 是一种[注册表][registry]，这意味着我们要像所有其他注册对象一样，使用 `DeferredRegister` 来注册它们：

```java
public class MyParticleTypes {
    // Assuming that your mod id is examplemod
    public static final DeferredRegister<ParticleType<?>> PARTICLE_TYPES =
        DeferredRegister.create(BuiltInRegistries.PARTICLE_TYPE, "examplemod");
    
    // The easiest way to add new particle types is reusing vanilla's SimpleParticleType.
    // Implementing a custom ParticleType is also possible, see below.
    public static final Supplier<SimpleParticleType> MY_QUAD_PARTICLE = PARTICLE_TYPES.register(
        // The name of the particle type.
        "my_quad_particle",
        // The supplier. The boolean parameter denotes whether setting the Particles option in the
        // video settings to Minimal will affect this particle type or not; this is false for
        // most vanilla particles, but true for e.g. explosions, campfire smoke, or squid ink.
        () -> new SimpleParticleType(false)
    );
}
```

:::info
只有当你需要在服务端处理粒子时，才需要 `ParticleType`。客户端也可以直接使用 `Particle`。
:::

## 自定义 `ParticleType` {#custom-particletypes}

虽然大多数情况下 `SimpleParticleType` 就足够了，但有时需要在服务端为粒子附加额外数据。这时就需要一个自定义 `ParticleType` 以及关联的自定义 `ParticleOptions`。我们先从 `ParticleOptions` 开始，因为信息实际上是存储在它里面的：

```java
public class MyParticleOptions implements ParticleOptions {
    
    // A map codec defining additional information for the particle, used e.g. in commands.
    // Since there is no information in our type, use a unit map codec;
    // this corresponds to using an empty string in a command.
    public static final MapCodec<MyParticleOptions> CODEC = MapCodec.unit(new MyParticleOptions());

    // Read and write information to the network buffer.
    public static final StreamCodec<ByteBuf, MyParticleOptions> STREAM_CODEC = StreamCodec.unit(new MyParticleOptions());

    // Does not need any parameters, but may define any fields necessary for the particle to work.
    public MyParticleOptions() {}

    @Override
    public ParticleType<?> getType() {
        // Return the registered particle type
    }
}
```

然后我们在自定义 `ParticleType` 中使用这个 `ParticleOptions` 实现……

```java
public class MyParticleType extends ParticleType<MyParticleOptions> {
    // The boolean parameter again determines whether to limit particles at lower particle settings.
    // See implementation of the MyParticleTypes class near the top of the article for more information.
    public MyParticleType(boolean overrideLimiter) {
        // Pass the deserializer to super.
        super(overrideLimiter);
    }

    @Override
    public MapCodec<MyParticleOptions> codec() {
        return MyParticleOptions.CODEC;
    }

    @Override
    public StreamCodec<? super RegistryFriendlyByteBuf, MyParticleOptions> streamCodec() {
        return MyParticleOptions.STREAM_CODEC;
    }
}
```

……并在[注册][registry]时引用它：

```java
public static final Supplier<MyParticleType> MY_CUSTOM_PARTICLE = PARTICLE_TYPES.register(
    "my_custom_particle",
    () -> new MyParticleType(false)
);
```

随后将注册的粒子传入 `ParticleOptions#getType`：

```java
public class MyParticleOptions implements ParticleOptions {
    
    // ...

    @Override
    public ParticleType<?> getType() {
        return MY_CUSTOM_PARTICLE.get();
    }
}
```

## 粒子描述 {#particle-descriptions}

粒子描述是位于 `assets/<namespace>/particles` 目录下的 JSON 文件。粒子描述与其关联的[粒子类型][particletype]同名，由一组相对于 `assets/<namespace>/textures/particles` 的纹理列表组成。

一个粒子描述看起来大致如下：

```json5
{
    // A list of textures that will be played in order. Will loop if necessary.
    // Texture locations are relative to the textures/particle folder.
    "textures": [
        // Points to `assets/examplemod/textures/particle/my_particle_0.png`
        "examplemod:my_particle_0",
        "examplemod:my_particle_1",
        "examplemod:my_particle_2",
        "examplemod:my_particle_3"
    ]
}
```

在资源重载期间，`ParticleResources` 会加载所有粒子描述，并将纹理拼接到 `TextureAtlas#LOCATION_PARTICLES` 图集中。然后，为每个描述创建一个 `SpriteSet`，其中包含指定的 `TextureAtlasSprite` 列表。

### 使用描述 {#using-the-description}

要让[粒子][particle]能够使用其描述，`ParticleType` 必须借助[客户端][side]的 [mod 总线][modbus][事件][event] `RegisterParticleProvidersEvent`，与一个接收 `SpriteSet` 的 [`ParticleProvider`][provider] 关联起来：

```java
public class MyParticleProvider implements ParticleProvider<SimpleParticleType> {

    private final SpriteSet spriteSet;

    // Take in the sprite set provided by the `ParticleResources`.
    public MyParticleProvider(SpriteSet spriteSet) {
        this.spriteSet = spriteSet;
    }

    // ...
}

// In some client-only event handler

@SubscribeEvent // on the mod event bus only on the physical client
public static void registerParticleProviders(RegisterParticleProvidersEvent event) {
    // #registerSpriteSet MUST be used when dealing with particle descriptions.
    event.registerSpriteSet(MyParticleTypes.MY_PARTICLE.get(), MyParticleProvider::new);
}
```

:::warning
如果为某个粒子类型创建了粒子描述，却没有通过 `RegisterParticleProvidersEvent#registerSpriteSet` 关联对应的 `ParticleProvider`，那么日志中将会记录一条 'Redundant texture list' 消息。
:::

### 数据生成 {#datagen}

粒子定义文件也可以通过继承 `ParticleDescriptionProvider` 并重写 `#addDescriptions()` 方法来[数据生成][datagen]：

```java
public class MyParticleDescriptionProvider extends ParticleDescriptionProvider {
    // Get the parameters from `GatherDataEvent.Client`.
    public MyParticleDescriptionProvider(PackOutput output) {
        super(output);
    }

    // Assumes that all the referenced particles actually exists. Replace "examplemod" with your mod id.
    @Override
    protected void addDescriptions() {
        // Adds a single sprite particle definition with the file at
        // assets/examplemod/textures/particle/my_single_particle.png.
        spriteSet(MyParticleTypes.MY_SINGLE_PARTICLE.get(), Identifier.fromNamespaceAndPath("examplemod", "my_single_particle"));
        // Adds a multi sprite particle definition, with a vararg parameter. Alternatively accepts an iterable.
        spriteSet(MyParticleTypes.MY_MULTI_PARTICLE.get(),
            Identifier.fromNamespaceAndPath("examplemod", "my_multi_particle_0"),
            Identifier.fromNamespaceAndPath("examplemod", "my_multi_particle_1"),
            Identifier.fromNamespaceAndPath("examplemod", "my_multi_particle_2")
        );
        // Alternative for the above, appends "_<index>" to the base name given, for the given amount of textures.
        spriteSet(MyParticleTypes.MY_ALT_MULTI_PARTICLE.get(),
            // The base name.
            Identifier.fromNamespaceAndPath("examplemod", "my_multi_particle"),
            // The number of textures.
            3,
            // Whether to reverse the list, i.e. start at the last element instead of the first.
            false
        );
    }
}
```

别忘了把提供器添加到 `GatherDataEvent.Client`：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createProvider(MyParticleDescriptionProvider::new);
}
```

## 生成粒子 {#spawning-particles}

正如前文所述，服务端只知道 [`ParticleType`][particletype] 和 [`ParticleOption`][options]，而客户端则直接使用由 `ParticleProvider` 提供的 `Particle`，这些 `ParticleProvider` 又与某个 `ParticleType` 关联。因此，生成粒子的方式会因你所处的端而大不相同。

- **通用代码**：调用 `Level#addParticle` 或 `Level#addAlwaysVisibleParticle`。这是创建对所有人可见的粒子的首选方式。
- **客户端代码**：使用通用代码的方式。或者，用你选择的粒子类创建一个 `new Particle()`，并对该粒子调用 `Minecraft.getInstance().particleEngine#add(Particle)`。注意，以这种方式添加的粒子只会为该客户端显示，因此其他玩家看不到它。
- **服务端代码**：调用 `ServerLevel#sendParticles`。原版中 `/particle` 命令即用此方式。

[clientparticle]: ../../rendering/particles.md
[datagen]: ../index.md#data-generation
[event]: ../../concepts/events.md
[modbus]: ../../concepts/events.md#event-buses
[options]: #custom-particletypes
[particle]: ../../rendering/particles.md
[particletype]: #registering-particletypes
[provider]: ../../rendering/particles.md#particleprovider
[side]: ../../concepts/sides.md

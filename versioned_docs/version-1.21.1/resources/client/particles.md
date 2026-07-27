# 粒子 {#particles}

粒子是一种 2D 效果，能为游戏增色并增强沉浸感。它们可以在客户端和服务[端][side]生成，但由于本质上主要是视觉效果，其关键部分只存在于物理（以及逻辑）客户端。

## 注册粒子 {#registering-particles}

### `ParticleType` {#particletype}

粒子通过 `ParticleType` 注册。它们的工作方式类似于 `EntityType` 或 `BlockEntityType`：有一个 `Particle` 类——每个生成的粒子都是该类的一个实例——然后有一个 `ParticleType` 类，持有一些用于注册的公共信息。 `ParticleType` 是一个[注册表][registry]，这意味着我们要像所有其他注册对象一样，使用 `DeferredRegister` 来注册它们：

```java
public class MyParticleTypes {
    // Assuming that your mod id is examplemod
    public static final DeferredRegister<ParticleType<?>> PARTICLE_TYPES =
        DeferredRegister.create(BuiltInRegistries.PARTICLE_TYPE, "examplemod");
    
    // The easiest way to add new particle types is reusing 原版's SimpleParticleType.
    // Implementing a custom ParticleType is also possible, see below.
    public static final DeferredHolder<ParticleType<?>, SimpleParticleType> MY_PARTICLE = PARTICLE_TYPES.register(
        // The name of the particle type.
        "my_particle",
        // The supplier. The boolean parameter denotes whether setting the Particles option in the
        // video settings to Minimal will affect this particle type or not; this is false for
        // most 原版 particles, but true for e.g. explosions, campfire smoke, or squid ink.
        () -> new SimpleParticleType(false)
    );
}
```

:::info
只有当你需要在服务端处理粒子时，才需要 `ParticleType`。客户端也可以直接使用 `Particle`。
:::

### `Particle` {#particle}

`Particle` 是随后被生成到世界中并显示给玩家的东西。虽然你可以扩展 `Particle` 并自己实现各种功能，但在许多情况下，更好的做法是改为扩展 `TextureSheetParticle`，因为该类提供了诸如动画和缩放之类的辅助功能，还会为你完成实际渲染（如果直接扩展 `Particle`，这些都得你自己实现）。

`Particle` 的大多数属性由 `gravity`、 `lifetime`、 `hasPhysics`、 `friction` 等字段控制。真正值得你自己实现的方法只有两个，即 `tick` 和 `move`，它们的作用都与你所预期的完全一致。因此，自定义粒子类往往很短，例如只由一个构造函数组成，该构造函数设置一些字段，其余交给父类处理。一个基础实现大致如下：

```java
public class MyParticle extends TextureSheetParticle {
    private final SpriteSet spriteSet;
    
    // First four parameters are self-explanatory. The SpriteSet parameter is provided by the
    // ParticleProvider, see below. You may also add additional parameters as needed, e.g. xSpeed/ySpeed/zSpeed.
    public MyParticle(ClientLevel level, double x, double y, double z, SpriteSet spriteSet) {
        super(level, x, y, z);
        this.spriteSet = spriteSet;
        this.gravity = 0; // Our particle floats in midair now, because why not.

        // We set the initial sprite here since ticking is not guaranteed to set the sprite
        // before the render method is called.
        this.setSpriteFromAge(spriteSet);
    }
    
    @Override
    public void tick() {
        // Set the sprite for the current particle age, i.e. advance the animation.
        this.setSpriteFromAge(spriteSet);
        // Let super handle further movement. You may replace this with your own movement if needed.
        // You may also override move() if you only want to modify the built-in movement.
        super.tick();
    }
}
```

### `ParticleProvider` {#particleprovider}

接下来，粒子类型必须注册一个 `ParticleProvider`。 `ParticleProvider` 是一个仅存在于客户端的类，负责通过 `createParticle` 方法实际创建我们的 `Particle`。虽然这里可以写更复杂的代码，但许多粒子提供器都像下面这样简单：

```java
// The generic type of ParticleProvider must match the type of the particle type this provider is for.
public class MyParticleProvider implements ParticleProvider<SimpleParticleType> {
    // A set of particle sprites.
    private final SpriteSet spriteSet;
    
    // The registration function passes a SpriteSet, so we accept that and store it for further use.
    public MyParticleProvider(SpriteSet spriteSet) {
        this.spriteSet = spriteSet;
    }
    
    // This is where the magic happens. We return a new particle each time this method is called!
    // The type of the first parameter matches the generic type passed to the super interface.
    @Override
    public Particle createParticle(SimpleParticleType type, ClientLevel level,
            double x, double y, double z, double xSpeed, double ySpeed, double zSpeed) {
        // We don't use the type and speed, and pass in everything else. You may of course use them if needed.
        return new MyParticle(level, x, y, z, spriteSet);
    }
}
```

你的粒子提供器随后必须在[客户端][side]的[Mod 总线][modbus][事件][event] `RegisterParticleProvidersEvent` 中与粒子类型关联起来：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerParticleProviders(RegisterParticleProvidersEvent event) {
    // There are multiple ways to register providers, all differing in the functional type they provide in the
    // second parameter. For example, #registerSpriteSet represents a Function<SpriteSet, ParticleProvider<?>>:
    event.registerSpriteSet(MyParticleTypes.MY_PARTICLE.get(), MyParticleProvider::new);
    // Other methods include #registerSprite, which is essentially a Supplier<TextureSheetParticle>,
    // and #registerSpecial, which maps to a Supplier<Particle>. See the source code of the event for further info.
}
```

### 粒子描述 {#particle-descriptions}

最后，我们必须把粒子类型与一个纹理关联起来。类似于物品与物品模型关联的方式，我们把粒子类型与所谓的粒子描述关联起来。粒子描述是位于 `assets/<namespace>/particles` 目录中的一个 JSON 文件，其名称与粒子类型相同（例如上面例子中的 `my_particle.json`）。粒子定义 JSON 的格式如下：

```json5
{
    // A list of textures that will be played in order. Will loop if necessary.
    // Texture locations are relative to the textures/particle folder.
    "textures": [
        "examplemod:my_particle_0",
        "examplemod:my_particle_1",
        "examplemod:my_particle_2",
        "examplemod:my_particle_3"
    ]
}
```

当使用一个接受 `SpriteSet` 的粒子时——即通过 `registerSpriteSet` 或 `registerSprite` 注册粒子提供器时——就需要粒子定义。对于通过 `#registerSpecial` 注册的粒子提供器，则**禁止**提供粒子定义。

:::danger
如果精灵集粒子工厂与粒子定义文件的列表不匹配——即某个粒子描述没有对应的粒子工厂，或反之——将会抛出异常！
:::

:::note
虽然粒子描述必须以特定方式注册提供器，但只有当 `ParticleRenderType`（通过 `Particle#getRenderType` 设置）使用 `TextureAtlas#LOCATION_PARTICLES` 作为着色器纹理时，它们才会被用到。在原版渲染类型中，这些是 `PARTICLE_SHEET_OPAQUE`、 `PARTICLE_SHEET_TRANSLUCENT` 和 `PARTICLE_SHEET_LIT`。
:::

### 数据生成 {#datagen}

粒子定义文件也可以通过扩展 `ParticleDescriptionProvider` 并覆盖 `#addDescriptions()` 方法来[数据生成][datagen]：

```java
public class MyParticleDescriptionProvider extends ParticleDescriptionProvider {
    // Get the parameters from GatherDataEvent.
    public AMParticleDefinitionsProvider(PackOutput output, ExistingFileHelper existingFileHelper) {
        super(output, existingFileHelper);
    }

    // Assumes that all the referenced particles actually exists. Replace "examplemod" with your mod id.
    @Override
    protected void addDescriptions() {
        // Adds a single sprite particle definition with the file at
        // assets/examplemod/textures/particle/my_single_particle.png.
        sprite(MyParticleTypes.MY_SINGLE_PARTICLE.get(), ResourceLocation.fromNamespaceAndPath("examplemod", "my_single_particle"));
        // Adds a multi sprite particle definition, with a vararg parameter. Alternatively accepts a list.
        spriteSet(MyParticleTypes.MY_MULTI_PARTICLE.get(),
            ResourceLocation.fromNamespaceAndPath("examplemod", "my_multi_particle_0"),
            ResourceLocation.fromNamespaceAndPath("examplemod", "my_multi_particle_1"),
            ResourceLocation.fromNamespaceAndPath("examplemod", "my_multi_particle_2")
        );
        // Alternative for the above, appends "_<index>" to the base name given, for the given amount of textures.
        spriteSet(MyParticleTypes.MY_ALT_MULTI_PARTICLE.get(),
            // The base name.
            ResourceLocation.fromNamespaceAndPath("examplemod", "my_multi_particle"),
            // The amount of textures.
            3,
            // Whether to reverse the list, i.e. start at the last element instead of the first.
            false
        );
    }
}
```

别忘了把提供器添加到 `GatherDataEvent`：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();

    // other providers here
    generator.addProvider(
        event.includeClient(),
        new MyParticleDescriptionProvider(output, existingFileHelper)
    );
}
```

### 自定义 `ParticleType` {#custom-particletypes}

虽然在大多数情况下 `SimpleParticleType` 就足够了，但有时需要在服务端向粒子附加额外数据。这时就需要一个自定义的 `ParticleType` 以及一个关联的自定义 `ParticleOptions`。我们先从 `ParticleOptions` 开始，因为信息实际存储在这里：

```java
public class MyParticleOptions implements ParticleOptions {
    
    // Read and write information, typically for use in commands
    // Since there is no information in this type, this will be an empty string
    public static final MapCodec<MyParticleOptions> CODEC = MapCodec.unit(new MyParticleOptions());

    // Read and write information to the network buffer.
    public static final StreamCodec<ByteBuf, MyParticleOptions> STREAM_CODEC = StreamCodec.unit(new MyParticleOptions());

    // Does not need any parameters, but may define any fields necessary for the particle to work.
    public MyParticleOptions() {}
}
```

然后我们在自定义的 `ParticleType` 中使用这个 `ParticleOptions` 实现……

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

……并在注册时引用它：

```java
public static final Supplier<MyParticleType> MY_CUSTOM_PARTICLE = PARTICLE_TYPES.register(
    "my_custom_particle",
    () -> new MyParticleType(false)
);
```

## 生成粒子 {#spawning-particles}

正如前面所提到的，服务端只知道 `ParticleType` 和 `ParticleOption`，而客户端直接使用由 `ParticleProvider`（与 `ParticleType` 关联）提供的 `Particle`。因此，生成粒子的方式会因你所处的端而大不相同。

- **公共代码**：调用 `Level#addParticle` 或 `Level#addAlwaysVisibleParticle`。这是创建对所有人可见的粒子的首选方式。
- **客户端代码**：使用公共代码的方式。或者，用你所选的粒子类 `new Particle()`，并以该粒子调用 `Minecraft.getInstance().particleEngine#add(Particle)`。注意以这种方式添加的粒子只会为该客户端显示，因此对其他玩家不可见。
- **服务端代码**：调用 `ServerLevel#sendParticles`。原版在 `/particle` 命令中使用此方式。

[datagen]: ../index.md#data-generation
[event]: ../../concepts/events.md
[modbus]: ../../concepts/events.md#event-buses
[registry]: ../../concepts/registries.md
[side]: ../../concepts/sides.md

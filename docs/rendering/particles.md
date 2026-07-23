# 客户端粒子 {#client-particles}

粒子是用于润色游戏、增强沉浸感的视觉效果。由于其本质上主要是视觉性的，关键部分只存在于物理（以及逻辑）客户[端][side]。

本文涵盖粒子中与渲染相关的方面。有关粒子类型（通常用于生成粒子）和粒子描述（可指定粒子的精灵图）的更多信息，请参阅配套的[粒子类型][particletype]一文。

## `Particle` 类 {#the-particle-class}

`Particle` 定义了在世界中生成并展示给玩家的对象的客户端表示。大多数属性和基础物理由 `gravity`、`lifetime`、`hasPhysics`、`friction` 等字段控制。通常只有两个方法会被重写，即 `tick` 和 `move`，二者的作用正如其名。因此，大多数自定义粒子往往很短，仅包含一个用于设置所需字段的构造函数，偶尔在这两个方法中加以重写。

构造粒子最常见的两种方式：一是继承 `SingleQuadParticle` 的某个实现（例如 `SimpleAnimatedParticle`），它会将一张始终朝向摄像机的纹理绘制（blit）到屏幕上；二是直接继承 `Particle`，从而完整掌控提交渲染的各项[功能][features]。

## 单个四边形 {#a-single-quad}

继承 `SingleQuadParticle` 的粒子会用某张图集精灵将单个四边形绘制到屏幕上。该类提供了许多辅助方法，从设置粒子大小（通过 `quadSize` 字段或 `scale` 方法），到为纹理着色（通过 `setColor` 和 `setAlpha`）。不过，关于四边形粒子最重要的两件事是：用作纹理的 `TextureAtlasSprite`，以及该精灵通过 `SingleQuadParticle.Layer` 从何处获取并如何渲染。

首先，`TextureAtlasSprite` 会传入构造函数，既可以是它本身，更常见的则是代表粒子整个生命周期纹理的 `SpriteSet`。初始时，精灵被赋给受保护的 `sprite` 字段，但可以在 `tick` 期间分别通过调用 `setSprite` 或 `setSpriteFromAge` 来更新。

:::tip
如果在粒子构造函数中更新了 `age` 或 `lifetime` 字段，应当调用 `setSpriteFromAge` 以显示相应的纹理。
:::

随后，在[功能提交过程][features]中，`SingleQuadParticle.Layer` 决定使用哪张图集，以及用于将四边形绘制到屏幕的管线。原版默认提供六种层：

| 层                    | 纹理图集      | 用途                                                   |
|:--------------------:|:-------------:|:-------------------------------------------------------|
| `OPAQUE_TERRAIN`     | 方块          | 使用不透明方块纹理的粒子                                |
| `TRANSLUCENT_TERRAIN`| 方块          | 使用带透明度方块纹理的粒子                              |
| `OPAQUE_ITEMS`       | 物品          | 使用不透明物品纹理的粒子                                |
| `TRANSLUCENT_ITEMS`  | 物品          | 使用带透明度物品纹理的粒子                              |
| `OPAQUE`             | 粒子          | 不透明的粒子                                            |
| `TRANSLUCENT`        | 粒子          | 带透明度的粒子                                          |

为方便起见，如果使用其中某个原版层，可以调用 `SingleQuadParticle.Layer#bySprite` 并传入纹理，以确定你的粒子应归属哪个层。

自定义层可以通过调用构造函数轻松创建。

```java
public class MyQuadParticle extends SingleQuadParticle {

    public static final SingleQuadParticle.Layer EXAMPLE_LAYER = new SingleQuadParticle.Layer(
        // Whether the particle will have textures that are not fully opaque.
        true,
        // The texture atlas used to get the sprite from.
        // This should match `TextureAtlasSprite#atlasLocation`.
        TextureAtlas.LOCATION_PARTICLES,
        // The render pipeline used to draw the particle.
        // Custom render pipelines should be based from `RenderPipelines#PARTICLE_SNIPPET`
        // to specify the available uniforms and samplers.
        RenderPipelines.WEATHER_DEPTH_WRITE
    );

    private final SpriteSet spriteSet;

    // First four parameters are self-explanatory.
    // The sprite set or atlas sprite are typically given through the provider, see below.
    // Additional parameters can be added as needed, e.g., xSpeed/ySpeed/zSpeed.
    public MyQuadParticle(ClientLevel level, double x, double y, double z, SpriteSet spriteSet) {
        // Initial sprite set in constructor
        super(level, x, y, z, spriteSet.first());
        this.spriteSet = spriteSet;
        this.gravity = 0; // Our particle floats in midair now, because why not.
    }

    @Override
    public void tick() {
        // Let super handle movement.
        // You may replace this with your own movement if needed.
        // You may also override move() if you only want to modify the built-in movement.
        super.tick();

        // Set the sprite for the current particle age, i.e. advance the animation.
        this.setSpriteFromAge(this.spriteSet);
    }

    @Override
    protected abstract SingleQuadParticle.Layer getLayer() {
        // Sets the layer used to get and submit the texture.
        return EXAMPLE_LAYER;
    }
}
```

:::warning
`SingleQuadParticle.Layer` 使用 `TextureAtlas#LOCATION_PARTICLES` 的粒子必须具有关联的[粒子描述][description]。否则，粒子所需的纹理不会被添加到图集中。
:::

## 粒子组与渲染状态 {#particle-groups-and-render-states}

如果某个粒子需要比四边形更复杂的东西，那么它就需要自己的 `ParticleGroup<P>`，其中 `P` 是 `Particle` 的类型。`ParticleGroup` 负责对一组指定的 `Particle` 进行 tick，并在 `Particle#isAlive` 返回 false 时将其移除。每个组最多可排入 16,384 个粒子，满了之后会逐出最早的粒子。

```java
// Let's assume we have the following particle class
public class ComplexParticle extends Particle {

    // You are not required to use these fields or store these values.
    // It is up to you to determine what you wish to render and get the
    // appropriate data.
    private final Model.Simple model;
    private final SpriteId sprite;

    public ComplexParticle(ClientLevel level, double x, double y, double z) {
        super(level, x, y, z);
        this.model = StandingSignRenderer.createSignModel(
            Minecraft.getInstance().getEntityModels(), WoodType.OAK, PlainSignBlock.Attachment.GROUND
        );
        this.sprite = Sheets.getSignSprite(WoodType.OAK);
    }

    public Model.Simple model() {
        return this.model;
    }

    public SpriteId sprite() {
        return this.sprite;
    }
}

// We can create a basic particle group like so
public class ComplexParticleGroup extends ParticleGroup<ComplexParticle> {

    public ComplexParticleGroup(ParticleEngine engine) {
        super(engine);
    }

    // ...
}
```

一旦 `Particle` 被添加到 `ParticleGroup`，它会在[功能提交][features]期间通过 `ParticleGroup#extractRenderState` 被提取为一个 `ParticleGroupRenderState`。`ParticleGroupRenderState` 兼具两种角色：既是一个包含所提取粒子的渲染状态，又是一个用于提交粒子元素以供渲染的处理器（通过 `#submit`）。

```java
// The particle group render state
public record ComplexParticleRenderState(List<ComplexParticleRenderState.Entry> entries) implements ParticleGroupRenderState {

    // Each entry represents a particle in the group
    public record Entry(Model.Simple model, SpriteId sprite, PoseStack pose) {}

    @Override
    public void submit(SubmitNodeCollector collector, CameraRenderState camera) {
        // Submit the particle elements to render
        for (ComplexParticleRenderState.Entry entry : this.entries) {
            collector.submitModel(...);
        }
    }
}

// And in the group...
public class ComplexParticleGroup extends ParticleGroup<ComplexParticle> {

    // ...

    @Override
    public ParticleGroupRenderState extractRenderState(Frustum frustum, Camera camera, float partialTickTime) {
        // Extract the render state from the particles
        List<ComplexParticleRenderState.Entry> entries = new ArrayList<>();

        for (ComplexParticle particle : this.particles) {
            PoseStack pose = new PoseStack();
            pose.pushPose();
            pose.mulPose(camera.rotation());
            entries.add(new ComplexParticleRenderState.Entry(particle.model(), particle.sprite(), pose));
        }

        return new ComplexParticleRenderState(entries);
    }
}
```

单凭自身，`Particle` 并不知道自己属于哪个 `ParticleGroup`，`ParticleEngine` 也不知道该组的存在。这些都通过 `ParticleRenderType`（组的唯一标识符）联系在一起。`ParticleRenderType` 通过[客户端][side][mod 总线][modbus][事件][event] `RegisterParticleGroupsEvent` 与 `ParticleGroup` 关联。随后，`Particle` 可以通过将 `Particle#getGroup` 设为所创建的类型来使用该组。

```java
// Create the render type
// The string passed in should be a stringified `Identifier`
public static final ParticleRenderType COMPLEX = new ParticleRenderType("examplemod:complex");

@SubscribeEvent // on the mod event bus only on the physical client
public static void registerParticleProviders(RegisterParticleGroupsEvent event) {
    // Link the render type to the particle group
    event.register(COMPLEX, ComplexParticleGroup::new);
}

public class ComplexParticle extends Particle {

    // ...

    @Override
    public ParticleRenderType getGroup() {
        // Tell the particle to render using the particle group
        return COMPLEX;
    }
}
```

## `ParticleProvider` {#particleprovider}

为某个粒子类型创建了粒子之后，还必须通过 `ParticleProvider` 将粒子类型关联起来。`ParticleProvider` 是一个仅客户端的类，负责通过 `createParticle` 实际从 `ParticleEngine` 创建我们的 `Particle`。虽然这里可以包含更精细的代码，但许多粒子提供器都简单如下：

```java
// The generic type of ParticleProvider must match the type of the particle type this provider is for.
public class MyQuadParticleProvider implements ParticleProvider<SimpleParticleType> {

    // A set of particle sprites.
    private final SpriteSet spriteSet;

    // The registration function passes a SpriteSet, so we accept that and store it for further use.
    // If your particle does not require a SpriteSet, this constructor can be omitted.
    public MyParticleProvider(SpriteSet spriteSet) {
        this.spriteSet = spriteSet;
    }

    // This is where the magic happens. We return a new particle each time this method is called!
    // The type of the first parameter matches the generic type passed to the super interface.
    @Override
    @Nullable
    public Particle createParticle(SimpleParticleType particleType, ClientLevel level, double x, double y, double z, double xd, double yd, double zd, RandomSource random
    ) {
        // We don't use the type, speed deltas, or engine random.
        return new MyQuadParticle(level, x, y, z, this.spriteSet);
    }
}
```

随后，必须在[客户端][side][mod 总线][modbus][事件][event] `RegisterParticleProvidersEvent` 中把你的粒子提供器与粒子类型关联起来：

```java
@SubscribeEvent // on the mod event bus only on the physical client
public static void registerParticleProviders(RegisterParticleProvidersEvent event) {
    // There are multiple ways to register providers, all differing in the functional type they provide in the
    // second parameter. For example, #registerSpriteSet represents a Function<SpriteSet, ParticleProvider<?>>:
    event.registerSpriteSet(MyParticleTypes.MY_QUAD_PARTICLE.get(), MyQuadParticleProvider::new);

    // #registerSpecial, on the other hand, maps to a ParticleProvider<?>.
    // This should be used if the sprite is not obtained from the particle description.
}
```

:::warning
如果使用了 `registerSpriteSet`，那么粒子类型还必须具有关联的[粒子描述][description]。否则将抛出异常，提示“Failed to load description”。
:::

[description]: ../resources/client/particles.md
[event]: ../concepts/events.md
[features]: feature.md
[modbus]: ../concepts/events.md#event-buses
[particletype]: ../resources/client/particles.md
[registry]: ../concepts/registries.md#methods-for-registering
[side]: ../concepts/sides.md

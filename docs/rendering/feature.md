---
sidebar_position: 1
---
# 功能 {#features}

渲染功能定义了一组未烘焙进世界几何体的对象，例如实体、文本和粒子。这些对象通常具有动态位置，因此像下落中的方块、手持的方块和物品也归入此类。功能渲染器的目的，正是为了更好地批处理并排序绘制到屏幕上的这些对象。功能渲染器分为两个阶段：提交阶段，收集所有功能；以及渲染阶段，渲染收集到的功能。

## 提交功能 {#submitting-features}

功能提交通常由负责这些对象的底层子系统处理：[实体交由 `EntityRenderer`][entities]、[方块实体交由 `BlockEntityRenderer`][blockentities]、[粒子交由 `ParticleGroupRenderState`][particles] 等。每个子系统都提供各自的 `submit` 方法，通常接收该对象的某种通用渲染状态。所需的元素随后通过 `SubmitNodeCollector` 提交，并存入 `SubmitNodeCollection` 树状映射中以供渲染。

下列方法通过该收集器提供，按其最终渲染的顺序排列：

| 方法                        | 描述                                                                                        |
|:--------------------------:|:-----------------------------------------------------------------------------------------------------------|
| `submitShadow`             | 按指定半径、位置和不透明度生成的若干黑色椭圆。                                                |
| `submitNameTag`            | 文本，按透明度排序。                                                                          |
| `submitText`               | 文本。                                                                                        |
| `submitFlame`              | 应用在实体上的火焰覆盖层。                                                                    |
| `submitLeash`              | 一个 24 段的平面。                                                                            |
| `submitModel`              | 带渲染状态的 `Model`，按透明度排序。                                                          |
| `submitModelPart`          | `ModelPart`。                                                                                 |
| `submitMovingBlock`        | 一组带动态光照的 `BlockStateModelPart`。                                                      |
| `submitBlockModel`         | 一个带烘焙光照的 `BlockStateModel`。                                                          |
| `submitBreakingBlockModel` | 叠加在 `BlockStateModel` 之上的方块破碎覆盖层。                                               |
| `submitItem`               | 一个已解构的 `ItemStackRenderState`。                                                         |
| `submitCustomGeometry`     | 一个任意方法，用于定义上传到给定 `RenderType` 缓冲区的顶点。                                  |
| `submitParticleGroup`      | 一个用于缓存并写入一批粒子四边形的渲染器。                                                    |

NeoForge 还添加了 `submitMultiLayerBlockModel`，用于提交一组 `BlockStateModelPart`，并完整支持逐四边形的渲染类型，而不是将所有四边形塞进单一的类型层。

:::warning
提交给收集器的每个元素在方法被调用后都应视为不可变。像 `PoseStack` 这样的元素会在此时被拍下快照，以防止后续任何改动。
:::

从技术上讲，上面列出的所有方法都属于父接口 `OrderedSubmitNodeCollector`。这是因为收集器可以将功能分组到若干“order”中，每个 order 代表渲染器的一次绘制通道。默认情况下，所有功能都在 order 0 上渲染，也就是说它们会按照下文定义的渲染顺序绘制。编号较小的 order 会先渲染，编号较大的 order 则在之后渲染。`SubmitNodeCollector#order` 可用于指定元素绘制的 order：

```java
// Assume we have some SubmitNodeCollector collector

// This will be rendered on order 0.
collector.submitModel(...);

// This will be rendered before the model.
collector.order(-1).submitBlockModel(...);

// This will be rendered after the model.
collector.order(1).submitParticleGroup(...);
```

## 渲染功能 {#rendering-features}

功能渲染由 `FeatureRenderDispatcher` 通过 `renderAllFeatures` 处理，它会渲染 `SubmitNodeStorage` 中所持有的 `SubmitNodeCollection` 树状映射内已提交的对象。该分发器包含一个渲染器类的列表，每个渲染器负责渲染某一类已提交的对象。这一顺序分为两个阶段：渲染实心功能，以及渲染透明几何体。

对于实心功能，在给定的“order”内，功能按以下顺序渲染：

- 模型
- 模型部件
- 实体火焰覆盖层
- 拴绳
- 物品
- 移动中的方块
- 方块模型
- NeoForge 的多层方块模型
- 自定义几何体
- 粒子

对于透明功能，在给定的“order”内，功能按以下顺序渲染：

- 阴影
- 模型
- 模型部件
- 名称标签
- 文本
- 物品
- 移动中的方块
- 方块模型
- NeoForge 的多层方块模型
- 自定义几何体

透明粒子会在所有透明功能渲染完毕后，作为独立的一趟通道渲染。

功能渲染完成后，`SubmitNodeStorage` 会被清空以备下次使用。功能渲染器每帧可能被多次调用，因为它不仅用于世界，还用于手持物品和[画中画 GUI 渲染器][gui]。请注意，在那些情况下，`renderAllFeatures` 之后会跟一个 `MultiBufferSource.BufferSource#endBatch` 调用，用于构建网格并将其绘制到缓冲区。

[blockentities]: ../blockentities/ber.md#blockentityrenderer
[entities]: ../entities/renderer.md#entity-renderers
[gui]: screens.md#picture-in-picture
[particles]: #TODO

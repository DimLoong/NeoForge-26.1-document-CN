---
sidebar_position: 1
---
# 渲染元素 {#features}

渲染元素是指未烘焙到世界几何体中的一类对象，例如实体、文本和粒子。这些对象的位置通常会动态变化，因此下落中的方块以及被拿在手中的方块和物品也属于渲染元素。渲染元素系统负责对这些待绘制对象进行批处理，并安排其绘制顺序。整个过程分为两个阶段：提交阶段收集所有渲染元素，渲染阶段再将收集到的元素绘制到屏幕上。

## 提交渲染元素 {#submitting-features}

渲染元素通常由相应的底层子系统提交，例如：[实体由 `EntityRenderer` 负责][entities]，[方块实体由 `BlockEntityRenderer` 负责][blockentities]，[粒子由 `ParticleGroupRenderState` 负责][particles]。这些子系统各自提供 `submit` 方法，通常接收对应对象的通用渲染状态。该方法通过 `SubmitNodeCollector` 提交所需元素，并将其存入 `SubmitNodeCollection` 的树形映射中，供渲染阶段使用。

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
| `submitItem`               | 一个拆解后的 `ItemStackRenderState`。                                                         |
| `submitCustomGeometry`     | 一个自定义方法，用于定义上传到指定 `RenderType` 缓冲区的顶点。                                |
| `submitParticleGroup`      | 一个用于缓存并写入一批粒子四边形的渲染器。                                                    |

NeoForge 还添加了 `submitMultiLayerBlockModel`，用于提交一组 `BlockStateModelPart`，并完整支持逐四边形的渲染类型，而不是将所有四边形塞进单一的类型层。

:::warning
提交给收集器的每个元素在方法被调用后都应视为不可变。像 `PoseStack` 这样的元素会在此时被拍下快照，以防止后续任何改动。
:::

从技术上讲，上述方法都定义在父接口 `OrderedSubmitNodeCollector` 中。收集器可以将渲染元素划分到不同的顺序层（order），每一层代表渲染器的一次绘制通道。所有元素默认位于顺序层 0，并按照下文给出的渲染顺序绘制。编号较小的顺序层先绘制，编号较大的后绘制。可通过 `SubmitNodeCollector#order` 指定元素所在的顺序层：

```java
// Assume we have some SubmitNodeCollector collector

// This will be rendered on order 0.
collector.submitModel(...);

// This will be rendered before the model.
collector.order(-1).submitBlockModel(...);

// This will be rendered after the model.
collector.order(1).submitParticleGroup(...);
```

## 绘制渲染元素 {#rendering-features}

渲染阶段由 `FeatureRenderDispatcher#renderAllFeatures` 处理。它会读取 `SubmitNodeStorage` 所持有的 `SubmitNodeCollection` 树形映射，并绘制其中已提交的对象。该分发器维护一组渲染器类，每个类负责一种已提交对象。绘制分为两个阶段：先绘制不透明渲染元素，再绘制透明几何体。

在同一个顺序层中，不透明渲染元素按以下顺序绘制：

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

在同一个顺序层中，透明渲染元素按以下顺序绘制：

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

所有透明渲染元素绘制完毕后，透明粒子会在单独的通道中绘制。

渲染元素绘制完成后，`SubmitNodeStorage` 会被清空以备下次使用。该渲染系统不仅用于世界，还用于手持物品和[画中画 GUI 渲染器][gui]，因此每帧可能调用多次。在后两种情况下，调用 `renderAllFeatures` 后还会调用 `MultiBufferSource.BufferSource#endBatch`，以构建网格并将其绘制到缓冲区。

[blockentities]: ../blockentities/ber.md
[entities]: ../entities/renderer.md
[gui]: screens.md#picture-in-picture
[particles]: particles.md#particle-groups-and-render-states

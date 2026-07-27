---
title: Forge Changes
---
# Minecraft 1.19.4 -> 1.20 Forge Mod 迁移导读 {#minecraft-1194---120-forge-mod-migration-primer}

本文概览性、非详尽地介绍如何使用 Forge 将你的 Mod 从 1.19.4 迁移到 1.20。所有给出的名称均使用官方的 mojang 映射。

本导读采用 [Creative Commons Attribution 4.0 International](http://creativecommons.org/licenses/by/4.0/) 许可证授权，欢迎将其用作参考，并保留链接，以便其他读者也能阅读本导读。

如有任何错误或遗漏的信息，请在本仓库提交 issue，或在 Neoforged Discord 服务器中 ping @ChampionAsh5357。

## 原版改动 {#vanilla-changes}

原版改动列于[此处](./index.md)。

## 创造模式物品栏（Creative Tab）注册表 {#creative-tab-registry}

新的物品栏页签可以使用其中一个 register 方法注册，而向现有页签添加内容则通过 Mod 事件总线上的 `BuildCreativeModeTabContentsEvent` 完成。对于新的页签，Forge 补丁提供了通过 `CreativeModeTab$Builder#withTabsBefore` 与 `#withTabsAfter` 对页签排序的能力。

```java
// Registered on the MOD event bus
// Assume we have RegistryObject<Item> and RegistryObject<Block> called ITEM and BLOCK
@SubscribeEvent
public void buildContents(BuildCreativeModeTabContentsEvent event) {
    // Add to ingredients tab
    if (event.getTabKey() == CreativeModeTabs.INGREDIENTS) {
        event.accept(ITEM);
        event.accept(BLOCK); // Takes in an ItemLike, assumes block has registered item
    }
}
```

## Forge 配置：移除资源包缓存 {#forge-config-resource-pack-caching-removal}

所有与资源包缓存相关的条目已从 Forge 通用配置中移除。原版现在默认处理这一点。

## 移除 Forge Capability 类 {#forge-capability-class-removals}

原本持有 Forge capability 的 `Capability*` 已被移除。所有调用应改为委托给 `ForgeCapabilities`。

## Forge 网络消息消费者 {#forge-network-message-consumers}

在 Forge 网络的消息构建器中，处理消息逻辑的 `#consumer` 已被移除。现在它被拆分为 `#consumerNetworkThread` 与 `#consumerMainThread`。这两个方法决定逻辑应直接在网络线程上处理，还是委托给消费者本身。

`#consumerMainThread` 会为你处理网络包，因此它只接受一个 `BiConsumer`。

```java
public void mainThreadMessage(MSG message, Supplier<NetworkEvent.Context> ctx) { /**/ }
```

`#consumerNetworkThread` 可以接受一个 `BiConsumer` 或 `ToBooleanBiFunction`，取决于你想通过 `#setPacketHandled` 处理网络包，还是通过返回语句处理。

```java
public void networkThreadMessageC(MSG message, Supplier<NetworkEvent.Context> ctx) {
    // ...
    ctx.get().setPacketHandled(true);
}

public boolean networkThreadMessageF(MSG message, Supplier<NetworkEvent.Context> ctx) {
    // ...
    return true;
}
```

## 移除虚拟条目（Dummy Entries） {#removal-of-dummy-entries}

由 Forge 注册表处理的 Forge 虚拟条目已被完全移除。

## 新标签 {#new-tags}

* 物品标签 `forge:tools/swords` -> `minecraft:swords`
* 物品标签 `forge:tools/axes` -> `minecraft:axes`
* 物品标签 `forge:tools/pickaxes` -> `minecraft:pickaxes`
* 物品标签 `forge:tools/shovels` -> `minecraft:shovels`
* 物品标签 `forge:tools/hoes` -> `minecraft:hoes`

## 小型改动与重命名 {#minor-changes-and-renames}

* `net.minecraftforge.event.entity.player.PlayerEvent$BreakSpeed#getPos` -> `#getPosition`，现在接受一个 `Optional<BlockPos>`
* `net.minecraftforge.client.event.RenderLevelLastEvent` -> `RenderLevelStageEvent`
    * 这两个事件之间没有直接的对应关系。你需要选择最适合你逻辑的阶段。
* `net.miencraftforge.common.world.ModifiableBiomeInfo$BiomeInfo$Builder#getEffects` -> `#getSpecialEffects`
* `net.miencraftforge.client.extensions.IForgeTransformation#push` -> `IForgePoseStack#pushTransformation`
* `net.minecraftforge.client.event.RegisterParticleProvidersEvent#register` -> 分别为 `#registerSpecial`、 `#registerSprite`、 `#registerSpriteSet`
* `net.minecraftforge.common.extensions.IForgePlayer#getAttackRange` -> `#getEntityReach`
    * `ForgeMod#REACH_DISTANCE` -> `#BLOCK_REACH`
* `net.minecraftforge.common.extensions.IForgePlayer#getReachDistance` -> `#getBlockReach`
    * `ForgeMod#ATTACK_RANGE` -> `#ENTITY_REACH`
* `net.minecraftforge.common.extensions.IForgePlayer#canHit` 和 `#canInteractWith` -> `#canReach`
* `net.minecraftforge.event.entity.living.LivingSetAttackTargetEvent` -> `LivingChangeTargetEvent`
* `net.minecraftforge.client.model.generators.BlockModelBuilder#rootTransform` -> `#rootTransforms`
    * 所有根变换逻辑已移至 `ModelBuilder` 与 `TransformationHelper`
* `net.minecraftforge.common.extensions.IForgeItem#onUsingTick` -> `Item#onUseTick`
* `net.minecraftforge.event.level.SaplingGrowTreeEvent` -> `BlockGrowFeatureEvent`
* `net.minecraftforge.client.model.IQuadTransformer#empty`、 `#applying` 和 `#applyingLightmap` 已移至 `QuadTransformers`
* `net.minecraftforge.client.gui.ScreenUtils` 已全部移至 `GuiGraphics` 上的扩展方法
    * `#drawTexturedModalRect` 和 `#drawGradientRect` 已分别被 `#blit` 与 `#fillGradient` 取代

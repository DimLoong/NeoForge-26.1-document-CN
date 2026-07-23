---
sidebar_position: 1
---

# 资源元数据 {#resource-metadata}

`.mcmeta` 扩展名的文件可以为游戏中的任意资产或数据对象保存 JSON 元数据。它们最常用于定义资源包的信息以及纹理的应用方式；不过，只要在文件名末尾添加 `.mcmeta`，就可以用于任何文件（例如，`apple.png` 的资源元数据是 `apple.png.mcmeta`）。

:::note
虽然数据包中的 JSON 对象也可以拥有资源元数据，但它不会被使用，因为这类元数据本可以放在 JSON 文件自身之内。
:::

## 元数据小节 {#metadata-sections}

JSON 元数据对象被拆分为若干小节（section），其中键代表小节类型，值是该小节的数据。在代码库中，这称为 `MetadataSectionType`，它接收 `String` 键以及用于序列化该值的 [`Codec`][codec]。

原版与 NeoForge 目前提供以下元数据小节：

| 小节                             | 类                                                            | 位于                    | 用途                                                          |
|:--------------------------------:|:-------------------------------------------------------------:|:-----------------------:|:--------------------------------------------------------------|
| `pack`                           | `PackMetadataSection`                                         | `pack.mcmeta`           | [资源包信息][pack]                                            |
| `features`                       | `FeatureFlagsMetadataSection`                                 | `pack.mcmeta`           | [启用实验性特性][features]                                    |
| `filter`                         | `ResourceFilterSection`                                       | `pack.mcmeta`           | 过滤在此包之后应用的各包中的文件                              |
| `overlays` / `neoforge:overlays` | `OverlayMetadataSection` / `GeneratingOverlayMetadataSection` | `pack.mcmeta`           | 在给定条件下叠加于主包之上的子包                              |
| `language`                       | `LanguageMetadataSection`                                     | `pack.mcmeta`           | 附加语言，仅用于资源包                                        |
| `animation`                      | `AnimationMetadataSection`                                    | `.png.mcmeta`（纹理）   | [动态图集纹理][animation]                                    |
| `gui`                            | `GuiMetadataSection`                                          | `.png.mcmeta`（纹理）   | [GUI 精灵纹理][texture]                                       |
| `texture`                        | `TextureMetadataSection`                                      | `.png.mcmeta`（纹理）   | [纹理][texture]                                               |
| `villager`                       | `VillagerMetadataSection`                                     | `.png.mcmeta`（纹理）   | 村民帽子可见性                                               |

:::note
主 Mod 的 `pack.mcmeta` 不需要 `PackMetadataSection`，因为 NeoForge 会合成生成它。不过，对于任何通过 [`AddPackFindersEvent` Mod 总线事件][events]添加的捆绑资源包而言，它是必需的。
:::

要获取元数据小节内的数据，需要访问从 `ResourceManager` 获得的该文件的 `Resource`，调用 `Resource#metadata` 得到 `ResourceMetadata`，随后用 `MetadataSectionType` 调用 `ResourceMetadata#getSection`。

```java
// For some `ResourceManager` resourceManager

// Get the metadata for the topmost resource
Optional<AnimationMetadataSection> waterStillMetadata = resourceManager.getResource(
    // Identifier must specify exact path to the backing resource resource.
    Identifier.fromNamespaceAndPath("minecraft", "textures/block/water_still.png")
).flatMap(resource -> {
    try {
        // Get the metadata for the resource if present, otherwise an empty optional.
        return resource.metadata().getSection(AnimationMetadataSection.TYPE);
    } catch (IOException e) {
        // If an exception is thrown trying to read the metadata file.
        return Optional.empty();
    }
});

// Get the metadata of every resource for the identifier
List<AnimationMetadataSection> waterStillsMetadata = resourceManager.getResourceStack(
    // Identifier must specify exact path to the backing resource resource.
    Identifier.fromNamespaceAndPath("minecraft", "textures/block/water_still.png")
).map(resource -> {
    try {
        // Get the metadata for the resource if present, otherwise an empty optional.
        return resource.metadata().getSection(AnimationMetadataSection.TYPE);
    } catch (IOException e) {
        // If an exception is thrown trying to read the metadata file.
        return Optional.empty();
    }
}).filter(Optional::isPresent).map(Optional::get);
```

客户端 `ResourceManager` 可通过 `Minecraft#getResourceManager` 获取。而服务端不会在 `MinecraftServer#reloadResources` 之外暴露 `ResourceManager`。要使用它，唯一的途径是作为 `PreparableReloadListener` 的一部分。

### 自定义小节 {#custom-sections}

一个自定义元数据小节只需要：创建对象、用于序列化和反序列化该对象的 `Codec`，以及用于从 `mcmeta` 读取的 `MetadataSectionType`。

```java
public record ExampleMetadataSection(String value) {
    public static final Codec<ExampleMetadataSection> CODEC = Codec.STRING.xmap(ExampleMetadataSection::new, ExampleMetadataSection::value);

    public static final MetadataSectionType<ExampleMetadataSection> TYPE = new MetadataSectionType<>(
        // The key for the section in the .mcmeta, should be prefixed with your mod id.
        "examplemod:example_section",
        // The codec to serialize and deserialize the section data.
        CODEC
    );
}
```

这样，该元数据小节就可以添加到某个对象的 `.mcmeta` 中：

```json5
// In 'assets/examplemod/textures/block/example_block.png.mcmeta'
{
    "examplemod:example_section": "Hello world!"
}
```

之后就可以像任何其他元数据小节一样，使用该类型获取它。

## 数据生成 {#data-generation}

原版通过 `PackMetadataGenerator` 为 `pack.mcmeta` 提供数据生成。任何其他文件的元数据都需要一个自定义 `DataProvider`。

### `PackMetadataGenerator` {#packmetadatagenerator}

`PackMetadataGenerator` 用于为 Mod 或其捆绑子包生成 `pack.mcmeta`。元数据小节通过 `add` 方法添加，该方法接收 `MetadataSectionType` 及其值。`PackMetadataGenerator` 还提供 `forFeaturePack`，用于生成带有 `PackMetadataSection`、以及可选的 `FeatureFlagsMetadataSection` 的 `pack.mcmeta`：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createProvider(PackMetadataGenerator::new)
        // Can chain multiple `add` calls.
        .add(
            // The metadata section to add.
            LanguageMetadataSection.TYPE,
            // The value of the metadata section.
            Map.of(
                "hello_world",
                new LanguageInfo(
                    "Programmer's Land",
                    "Hello world!",
                    false
                )
            )
        );
}
```

### 其他资源元数据 {#other-resource-metadata}

其他文件上的资源元数据需要一个自定义 `DataProvider`：

```java
public class ResourceMetadataProvider implements DataProvider {

    private final PackOutput output;
    private final Map<Path, ResourceMetadata> metadata;

    public ResourceMetadataProvider(PackOutput output) {
        this.output = output;
        this.metadata = new HashMap<>();
    }

    protected void add() {
        // Add metadata here.
        this.textureMetadata(Identifier.fromNamespaceAndPath(
            "examplemod", "block/example_texture"
        ))
            // Can chain multiple `add` calls.
            .add(
                // The metadata section to add.
                TextureMetadataSection.TYPE
                // The value of the metadata section.
                new TextureMetadataSection(
                    true, TextureMetadataSection.DEFAULT_CLAMP, MipmapStrategy.AUTO, TextureMetadataSection.DEFAULT_ALPHA_CUTOFF_BIAS
                )
            ).add(
                ExampleMetadataSection.TYPE,
                new ExampleMetadataSection("Hello world!")
            );
    }

    protected ResourceMetadata textureMetadata(Identifier resource) {
        return this.metadata(
            PackOutput.Target.RESOURCE_PACK,
            "textures",
            resource.withSuffix(".png")
        );
    }

    protected ResourceMetadata metadata(PackOutput.Target type, String directory, Identifier resource) {
        return this.metadata.computeIfAbsent(
            this.output.createPathProvider(type, directory).file(resource, "mcmeta"),
            p -> new ResourceMetadata()
        );
    }

    @Override
    public CompletableFuture<?> run(CachedOutput cache) {
        Executor executor = Util.backgroundExecutor().forName("serializeMetadata");
        return CompletableFuture.allOf(
            this.metadata.entrySet().stream().map(entry -> CompletableFuture.runAsync(() -> {
                    JsonObject result = new JsonObject();
                    entry.getValue().sections().forEach((type, data) -> result.add(type, data.get()));
                    return result;
                }, executor).thenComposeAsync(json -> DataProvider.saveStable(cache, json, entry.getKey()), executor)
            ).toArray(CompletableFuture[]::new)
        );
    }

    @Override
    public final String getName() {
        return "Resource Metadata";
    }

    public record ResourceMetadata(Map<String, Supplier<JsonElement>> sections) {

        public ResourceMetadata() {
            this(new HashMap<>());
        }

        public <T> ResourceMetadata add(MetadataSectionType<T> type, T value) {
            this.sections.put(type.name(), () -> type.codec().encodeStart(JsonOps.INSTANCE, value).getOrThrow(IllegalArgumentException::new).getAsJsonObject());
            return this;
        }
    }
}
```

随后即可将其添加到 `GatherDataEvent`：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent.Client event) {
    event.createProvider(ResourceMetadataProvider::new);
}
```

[animation]: client/textures.md#animated-textures
[codec]: ../datastorage/codecs.md
[events]: ../concepts/events.md
[features]: ../advanced/featureflags.md#feature-packs
[pack]: index.md#packmcmeta
[texture]: client/textures.md#texture-metadata

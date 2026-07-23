# 纹理 {#textures}

Minecraft 中的所有纹理都是 PNG 文件，位于某个命名空间的 `textures` 文件夹内。JPG、GIF 及其他图片格式不受支持。指向纹理的 [identifier][identifiers] 路径通常相对于 `textures` 文件夹，因此举例来说，标识符 `examplemod:block/example_block` 指向的纹理文件位于 `assets/examplemod/textures/block/example_block.png`。

纹理的尺寸通常应为 2 的幂，例如 16x16 或 32x32。与旧版本不同，现代 Minecraft 原生支持大于 16x16 的方块和物品纹理尺寸。对于那些尺寸不是 2 的幂、且反正由你自行渲染的纹理（例如 GUI 背景），请新建一个尺寸为下一个可用的 2 的幂（通常是 256x256）的空文件，把你的纹理放在该文件的左上角，其余部分留空。绘制纹理的实际尺寸随后可在使用该纹理的代码中设置。

## 纹理元数据 {#texture-metadata}

纹理元数据可以在一个与纹理同名、但额外带有 `.mcmeta` 后缀的文件中指定。例如，位于 `textures/block/example.png` 的动画纹理需要一个配套的 `textures/block/example.png.mcmeta` 文件。`.mcmeta` 文件的格式如下（全部可选）：

```json5
{
    // Metadata for a general texture
    "texture": {
        // Whether the texture will be blurred if needed. Defaults to false.
        // Currently specified by the codec, but unused otherwise both in the files and in code.
        "blur": true,
        // Whether the texture will be clamped if needed. Defaults to false.
        // Currently specified by the codec, but unused otherwise both in the files and in code.
        "clamp": true,
        // Sets the strategy used when generating mipmaps (lower resolutions of textures used at
        // a distance).
        // Can either be:
        // - `mean`: The default that averages the color between four pixels.
        // - `cutout`: 'mean', except that all levels are generated from the original texture
        // rather than the close mipmap, with alpha value snapped to 0 or 1 using a threshold
        // of 0.2.
        // - `strict_cutout`: 'cutout', except the alpha value snaps using a threshold of 0.6.
        // - `dark_cutout`: 'mean', except that the surrounding pixels are only included in the
        // average if their alpha is not 0.
        "mipmap_strategy": "mean",
        // Offsets the cutoff alpha when determining whether a pixel should be made either fully
        // opaque or transparent for mipmaps. For example, setting to 0.3 with the 'cutout' strategy
        // changes the alpha value snap to 0.2 + 0.3 = 0.5.
        "alpha_cutoff_bias": 0.3
    },

    // Metadata for a texture used as a gui sprite
    "gui": {
        // Specifies how the texture will be scaled if needed. Can be one of these three:
        "scaling": {
            "type": "stretch" // default
        },
        "scaling": {
            "type": "tile",
            "width": 16,
            "height": 16
        },
        "scaling": {
            // Like "tile", but allows specifying the border offsets.
            "type": "nine_slice",
            "width": 16,
            "height": 16,
            // May also be a single int that is used as the value for all four sides.
            "border": {
                "left": 0,
                "top": 0,
                "right": 0,
                "bottom": 0
            },
            // When true the center part of the texture will be applied like
            // the stretch type instead of a nine slice tiling.
            "stretch_inner": true
        }
    },

    // Metadata for an animated texture
    // See below
    "animation": {}
}
```

## 动画纹理 {#animated-textures}

Minecraft 原生支持方块和物品的动画纹理。动画纹理由一个纹理文件构成，其中不同的动画阶段依次上下排列（例如，一个含 8 个阶段的 16x16 动画纹理会以一个 16x128 的 PNG 文件来表示）。

要真正实现动画，而不是被显示为一张变形的纹理，纹理元数据中必须包含一个 `animation` 对象。该子对象可以为空，但也可以包含以下可选条目：

```json5
{
    "animation": {
        // A custom order in which the frames are played. If omitted, the frames are played top to bottom.
        "frames": [1, 0],
        // How long one frame stays before switching to the next animation stage, in frames. Defaults to 1.
        "frametime": 5,
        // Whether to interpolate between animation stages. Defaults to false.
        "interpolate": true,
        // Width and height of one animation stage. If omitted, uses the texture width for both of these.
        "width": 12,
        "height": 12
    }
}
```

[identifiers]: ../../misc/identifier.md

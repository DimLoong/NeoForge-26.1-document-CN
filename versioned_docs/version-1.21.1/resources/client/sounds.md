# 声音 {#sounds}

声音虽然并非任何功能所必需，却能让 Mod 感觉更细腻、更有生命力。 Minecraft 提供了多种注册和播放声音的方式，本文将逐一介绍。

## 术语 {#terminology}

Minecraft 的声音引擎用一系列术语来指代不同的东西：

- **声音事件（Sound event）**：声音事件是代码中的一个触发点，用于告诉声音引擎播放某个特定的声音。 `SoundEvent` 也是你注册到游戏中的对象。
- **声音类别（Sound category）**或**声音来源（sound source）**：声音类别是对声音的粗略分组，可以逐组单独开关。声音选项 GUI 中的各个滑块就代表这些类别：`master`、 `block`、 `player` 等。在代码中，它们位于 `SoundSource` 枚举里。
- **声音定义（Sound definition）**：将一个声音事件映射到一个或多个声音对象的映射，外加一些可选的元数据。声音定义位于某个命名空间的 [`sounds.json` 文件][soundsjson]中。
- **声音对象（Sound object）**：一个 JSON 对象，由声音文件的位置以及一些可选的元数据组成。
- **声音文件（Sound file）**：磁盘上的声音文件。 Minecraft 仅支持 `.ogg` 声音文件。

:::danger
由于 OpenAL（Minecraft 的音频库）的实现方式，若要让你的声音具备衰减效果——即随着玩家与声源之间距离的变化而变得更轻或更响——你的声音文件必须是单声道（单通道）。立体声（多通道）声音文件不会受到衰减处理，且始终在玩家所在位置播放，因此非常适合环境音和背景音乐。另见 [MC-146721][bug]。
:::

## 创建 `SoundEvent` {#creating-soundevents}

`SoundEvent` 是[注册对象][registration]，也就是说它们必须通过 `DeferredRegister` 注册到游戏中，并且是单例：

```java
public class MySoundsClass {
    // Assuming that your mod id is examplemod
    public static final DeferredRegister<SoundEvent> SOUND_EVENTS =
            DeferredRegister.create(BuiltInRegistries.SOUND_EVENT, "examplemod");
    
    // All 原版 sounds use variable range events.
    public static final DeferredHolder<SoundEvent, SoundEvent> MY_SOUND = SOUND_EVENTS.register(
            "my_sound", // must match the resource location on the next line
            () -> SoundEvent.createVariableRangeEvent(ResourceLocation.fromNamespaceAndPath("examplemod", "my_sound"))
    );
    
    // There is a currently unused method to register fixed range (= non-attenuating) events as well:
    public static final DeferredHolder<SoundEvent, SoundEvent> MY_FIXED_SOUND = SOUND_EVENTS.register("my_fixed_sound",
            // 16 is the default range of sounds. Be aware that due to OpenAL limitations,
            // values above 16 have no effect and will be capped to 16.
            () -> SoundEvent.createFixedRangeEvent(ResourceLocation.fromNamespaceAndPath("examplemod", "my_fixed_sound"), 16)
    );
}
```

当然，别忘了在[Mod 构造函数][modctor]中把你的注册表添加到[Mod 事件总线][modbus]上：

```java
public ExampleMod(IEventBus modBus) {
    MySoundsClass.SOUND_EVENTS.register(modBus);
    // other things here
}
```

大功告成，你就有了一个声音事件！

## `sounds.json` {#soundsjson}

_另见：[Minecraft Wiki][mcwiki] 上的 [sounds.json][mcwikisounds]_

现在，为了把你的声音事件与实际的声音文件关联起来，我们需要创建声音定义。一个命名空间的所有声音定义都存放在一个名为 `sounds.json` 的文件（也称为声音定义文件）中，直接位于该命名空间的根目录下。每条声音定义都是从声音事件 id（例如 `my_sound`）到一个 JSON 声音对象的映射。注意声音事件 id 不指定命名空间，因为命名空间已经由声音定义文件所在的命名空间决定了。一个示例 `sounds.json` 大致如下：

```json5
{
    // Sound definition for the sound event "examplemod:my_sound"
    "my_sound": {
        // List of sound objects. If this contains more than one element, an element will be chosen randomly.
        "sounds": [
            // Only name is required, all other properties are optional.
            {
                // Location of the sound file, relative to the namespace's sounds folder.
                // This example references a sound at assets/examplemod/sounds/sound_1.ogg.
                "name": "examplemod:sound_1",
                // May be "sound" or "event". "sound" causes the name to refer to a sound file.
                // "event" causes the name to refer to another sound event. Defaults to "sound".
                "type": "sound",
                // The volume this sound will be played at. Must be between 0.0 and 1.0 (default).
                "volume": 0.8,
                // The pitch value the sound will be played at.
                // Must be between 0.0 and 2.0. Defaults to 1.0.
                "pitch": 1.1,
                // Weight of this sound when choosing a sound from the sounds list. Defaults to 1.
                "weight": 3,
                // If true, the sound will be streamed from the file instead of loaded all at once.
                // Recommended for sound files that are more than a few seconds long. Defaults to false.
                "stream": true,
                // Manual override for the attenuation distance. Defaults to 16. Ignored by fixed range sound events.
                "attenuation_distance": 8,
                // If true, the sound will be loaded into memory on pack load, instead of when the sound is played.
                // 原版 uses this for underwater ambience sounds. Defaults to false.
                "preload": true
            },
            // Shortcut for { "name": "examplemod:sound_2" }
            "examplemod:sound_2"
        ]
    },
    "my_fixed_sound": {
        // Optional. If true, replaces sounds from other resource packs instead of adding to them.
        // See the Merging chapter below for more information.
        "replace": true,
        // The translation key of the subtitle displayed when this sound event is triggered.
        "subtitle": "examplemod.my_fixed_sound",
        "sounds": [
            "examplemod:sound_1",
            "examplemod:sound_2"
        ]
    }
}
```

### 合并 {#merging}

与大多数其他资源文件不同，`sounds.json` 不会覆盖排在其下方的资源包中的值。相反，它们会被合并到一起，然后作为一个合并后的 `sounds.json` 文件来解读。设想有两个不同的资源包 RP1 和 RP2 各自的 `sounds.json` 文件中定义了声音 `sound_1`、 `sound_2`、 `sound_3` 和 `sound_4`，其中 RP2 排在 RP1 下方：

RP1 中的 `sounds.json`：

```json5
{
    "sound_1": {
        "sounds": [
            "sound_1"
        ]
    },
    "sound_2": {
        "replace": true,
        "sounds": [
            "sound_2"
        ]
    },
    "sound_3": {
        "sounds": [
            "sound_3"
        ]
    },
    "sound_4": {
        "replace": true,
        "sounds": [
            "sound_4"
        ]
    }
}
```

RP2 中的 `sounds.json`：

```json5
{
    "sound_1": {
        "sounds": [
            "sound_5"
        ]
    },
    "sound_2": {
        "sounds": [
            "sound_6"
        ]
    },
    "sound_3": {
        "replace": true,
        "sounds": [
            "sound_7"
        ]
    },
    "sound_4": {
        "replace": true,
        "sounds": [
            "sound_8"
        ]
    }
}
```

游戏随后用于加载声音的合并后的 `sounds.json` 文件大致如下（仅存在于内存中，这个文件永远不会被写入任何地方）：

```json5
{
    "sound_1": {
        // replace false and false: add from lower pack, then from upper pack
        "sounds": [
            "sound_5",
            "sound_1"
        ]
    },
    "sound_2": {
        // replace true in upper pack and false in lower pack: add from upper pack only
        "sounds": [
            "sound_2"
        ]
    },
    "sound_3": {
        // replace false in upper pack and true in lower pack: add from lower pack, then from upper pack
        // Would still discard values from a third resource pack sitting below RP2
        "sounds": [
            "sound_7",
            "sound_3"
        ]
    },
    "sound_4": {
        // replace true and true: add from upper pack only
        "sounds": [
            "sound_8"
        ]
    }
}
```

## 播放声音 {#playing-sounds}

Minecraft 提供了多种播放声音的方法，有时不太清楚该用哪一种。所有方法都接受一个 `SoundEvent`，它既可以是你自己的，也可以是原版的（原版声音事件位于 `SoundEvents` 类中）。在以下方法说明中，客户端和服务端分别指[逻辑客户端和逻辑服务端][sides]。

### `Level` {#level}

- `playSeededSound(Player player, double x, double y, double z, Holder<SoundEvent> soundEvent, SoundSource soundSource, float volume, float pitch, long seed)`
    - 客户端行为：如果传入的玩家是本地玩家，则在给定位置向该玩家播放声音事件，否则不执行任何操作。
    - 服务端行为：向除传入的玩家之外的所有玩家发送一个数据包，指示客户端在给定位置向玩家播放声音事件。
    - 用法：在由客户端发起、且会在两端运行的代码中调用。服务端不向发起方玩家播放，可避免向其重复播放两次声音事件。或者，在由服务端发起的代码中（例如[方块实体][be]）以 `null` 玩家调用，从而向所有人播放声音。
- `playSound(Player player, double x, double y, double z, SoundEvent soundEvent, SoundSource soundSource, float volume, float pitch)`
    - 转发到 `playSeededSound`，选取一个随机种子，并把 `SoundEvent` 包装在 holder 中。
- `playSound(Player player, BlockPos pos, SoundEvent soundEvent, SoundSource soundSource, float volume, float pitch)`
    - 转发到上一个方法，其中 `x`、 `y` 和 `z` 分别取 `pos.getX() + 0.5`、 `pos.getY() + 0.5` 和 `pos.getZ() + 0.5` 的值。
- `playLocalSound(double x, double y, double z, SoundEvent soundEvent, SoundSource soundSource, float volume, float pitch, boolean distanceDelay)`
    - 客户端行为：在给定位置向玩家播放声音。不向服务端发送任何内容。如果 `distanceDelay` 为 `true`，则根据与玩家的距离对声音进行延迟。
    - 服务端行为：不执行任何操作。
    - 用法：在从服务端发送的自定义数据包中调用。原版将其用于雷声。

### `ClientLevel` {#clientlevel}

- `playLocalSound(BlockPos pos, SoundEvent soundEvent, SoundSource soundSource, float volume, float pitch, boolean distanceDelay)`
    - 转发到 `Level#playLocalSound`，其中 `x`、 `y` 和 `z` 分别取 `pos.getX() + 0.5`、 `pos.getY() + 0.5` 和 `pos.getZ() + 0.5` 的值。

### `Entity` {#entity}

- `playSound(SoundEvent soundEvent, float volume, float pitch)`
    - 转发到 `Level#playSound`，以 `null` 作为玩家，以 `Entity#getSoundSource` 作为声音来源，以实体的位置作为 x/y/z，其余参数按传入值使用。

### `Player` {#player}

- `playSound(SoundEvent soundEvent, float volume, float pitch)`（覆盖 `Entity` 中的方法）
    - 转发到 `Level#playSound`，以 `this` 作为玩家，以 `SoundSource.PLAYER` 作为声音来源，以玩家的位置作为 x/y/z，其余参数按传入值使用。因此，其客户端/服务端行为与 `Level#playSound` 一致：
        - 客户端行为：在给定位置向客户端玩家播放声音事件。
        - 服务端行为：向给定位置附近的所有人播放声音事件，但不包括调用该方法所针对的玩家。

## 数据生成 {#datagen}

声音文件本身当然无法[数据生成][datagen]，但 `sounds.json` 文件可以。为此，我们扩展 `SoundDefinitionsProvider` 并覆盖 `registerSounds()` 方法：

```java
public class MySoundDefinitionsProvider extends SoundDefinitionsProvider {
    // Parameters can be obtained from GatherDataEvent.
    public MySoundDefinitionsProvider(PackOutput output, ExistingFileHelper existingFileHelper) {
        // Use your actual mod id instead of "examplemod".
        super(output, "examplemod", existingFileHelper);
    }

    @Override
    public void registerSounds() {
        // Accepts a Supplier<SoundEvent>, a SoundEvent, or a ResourceLocation as the first parameter.
        add(MySoundsClass.MY_SOUND, SoundDefinition.definition()
            // Add sound objects to the sound definition. Parameter is a vararg.
            .with(
                // Accepts either a string or a ResourceLocation as the first parameter.
                // The second parameter can be either SOUND or EVENT, and can be omitted if the former.
                sound("examplemod:sound_1", SoundDefinition.SoundType.SOUND)
                    // Sets the volume. Also has a double counterpart.
                    .volume(0.8f)
                    // Sets the pitch. Also has a double counterpart.
                    .pitch(1.2f)
                    // Sets the weight.
                    .weight(2)
                    // Sets the attenuation distance.
                    .attenuationDistance(8)
                    // Enables streaming.
                    // Also has a parameterless overload that defers to stream(true).
                    .stream(true)
                    // Enables preloading.
                    // Also has a parameterless overload that defers to preload(true).
                    .preload(true),
                // The shortest we can get.
                sound("examplemod:sound_2")
            )
            // Sets the subtitle.
            .subtitle("sound.examplemod.sound_1")
            // Enables replacing.
            .replace(true)
        );
    }
}
```

与每个数据提供器一样，别忘了把提供器注册到事件上：

```java
@SubscribeEvent // on the mod event bus
public static void gatherData(GatherDataEvent event) {
    DataGenerator generator = event.getGenerator();
    PackOutput output = generator.getPackOutput();
    ExistingFileHelper existingFileHelper = event.getExistingFileHelper();

    // other providers here
    generator.addProvider(
        event.includeClient(),
        new MySoundDefinitionsProvider(output, existingFileHelper)
    );
}
```

[bug]: https://bugs.mojang.com/browse/MC-146721
[datagen]: ../index.md#data-generation
[mcwiki]: https://minecraft.wiki
[mcwikisounds]: https://minecraft.wiki/w/Sounds.json
[modbus]: ../../concepts/events.md#event-buses
[modctor]: ../../gettingstarted/modfiles.md#javafml-and-mod
[registration]: ../../concepts/registries.md
[sides]: ../../concepts/sides.md#the-logical-side
[soundsjson]: #soundsjson

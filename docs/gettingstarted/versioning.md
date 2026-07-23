# 版本 {#versioning}

本文将拆解 Minecraft 与 NeoForge 中版本机制的运作方式，并对 Mod 的版本管理给出一些建议。

## Minecraft {#minecraft}

Minecraft 的版本方案多年来几经变化。

从 1.0 到 1.21.11 的版本遵循受 [semver][semver] 启发的格式 `major.minor.<patch>`，为简洁起见通常省略补丁版本号。这类版本的例子有 1.21 和 1.21.11。

26.1 及以上版本遵循受 [calver][calver] 启发的格式 `year.release.<patch>`，为简洁起见通常省略补丁版本号。这类版本的例子有 26.1 和 26.1.1。

### 早期发布时代 {#the-early-release-era}

在游戏正式发布之前，版本方案经常变动，出现过诸如 `a1.1`（Alpha 1.1）、`b1.7.3`（Beta 1.7.3），乃至完全不遵循任何清晰版本方案的 `infdev` 版本。

### 大版本更新时代 {#the-major-update-era}

当游戏以 Minecraft 1.0 正式发布时，它采用了一种新的版本方案：用 `1` 作为主版本号，用第二个数字表示（通常为一年一次的）大版本更新，用第三个数字表示小版本和补丁。例如，Minecraft 1.20.2 的主版本号为 1，次版本号为 20，补丁版本号为 2。这一格式从 2011 年一直沿用到 2026 年，即从 Minecraft 1.0 问世到 2026 年初的 26.1 更新为止。在 Minecraft 开始发布 drop（游戏投放）之前，这一格式一直运转良好；而 drop 作为小型更新只会递增补丁版本号，导致 1.21 更新持续了将近两年。

#### 快照 {#snapshots}

1.21.11 及以下版本的快照偏离了标准版本方案。它们被标记为 `YYwWWa`，其中 `YY` 代表年份的后两位数字（例如 `23`），`WW` 代表该年的周次（例如 `01`）。因此举例来说，快照 `23w01a` 就是 2023 年第一周发布的快照。

`a` 后缀用于同一周内发布两个快照的情形（此时第二个快照会被命名为类似 `23w01b` 的名称）。Mojang 过去偶尔这样用过。这种替代后缀也用于诸如 `20w14infinite` 这样的快照，那是 [2020 年愚人节的无限维度玩笑][infinite]。

#### 预发布版与候选发布版 {#pre-releases-and-release-candidates}

当一个快照周期接近完成时，Mojang 会开始发布所谓的预发布版（pre-release）。预发布版被认为是某个版本功能已完备的版本，只专注于修复 Bug。它们使用所针对版本的 semver 记法，并加上 `-preX` 后缀。因此举例来说，1.20.2 的第一个预发布版名为 `1.20.2-pre1`。预发布版可以有、且通常有多个，会相应地以 `-pre2`、`-pre3` 等作为后缀。

类似地，当预发布周期完成后，Mojang 会发布候选发布版 1（在版本号后加 `-rc1` 后缀，例如 `1.20.2-rc1`）。Mojang 的目标是拥有一个候选发布版，若不再出现 Bug 便可将其发布。然而，如果出现了意料之外的 Bug，也可能会有 `-rc2`、`-rc3` 等版本，与预发布版类似。

### 游戏投放时代 {#the-game-drop-era}

由于决定从“全年带补丁的年度大版本更新”转向“每季度一次的游戏投放”，Mojang 决定将 Minecraft 的版本机制更改为一种新格式 `year.release.<patch>`。举例来说，26.1 将是采用这一新版本机制的首个发布版，代表 2026 年的第一次投放。如果需要发布热修复，则会是 26.1.1；而 2026 年的第二次投放将是 26.2。

#### 快照、预发布版与候选发布版 {#snapshots-pre-releases-and-release-candidates}

在开发下一个更新期间，Mojang 会发布称为快照的早期版本。快照会快速改变游戏的各个方面，且相当不稳定，但可以很好地了解下一个更新的成形情况。26.1 及以上版本的快照使用所针对版本的 calver 记法，并加上 `-snapshot-X` 后缀。例如 26.1-snapshot-1 是即将到来的 26.1 更新的第一个快照，后续快照标记为 `snapshot-2` 或 `snapshot-3`。

当一个快照周期接近完成时，Mojang 会开始发布所谓的预发布版。预发布版被认为是某个版本功能已完备的版本，只专注于修复 Bug。类似地，这些版本以 `-pre-X` 为后缀。因此举例来说，26.1 的第一个预发布版名为 `26.1-pre-1`。预发布版可以有、且通常有多个，会相应地以 `-pre-2`、`-pre-3` 等作为后缀。

类似地，当预发布周期完成后，Mojang 会发布候选发布版 1（在版本号后加 `-rc1` 后缀，例如 `26.1-rc-1`）。Mojang 的目标是拥有一个候选发布版，若不再出现 Bug 便可将其发布。然而，如果出现了意料之外的 Bug，也可能会有 `-rc-2`、`-rc-3` 等版本，与预发布版类似。

## NeoForge {#neoforge}

NeoForge 使用一套改良的 semver 系统：主版本号是 Minecraft 的次版本号，次版本号是 Minecraft 的补丁版本号，补丁版本号则是 NeoForge “真正的”版本号。因此举例来说，NeoForge 20.2.59 是针对 Minecraft 1.20.2 的第 60 个版本（我们从 0 开始计数）。以 `1` 为前缀的版本省略了 `1`，因为当时认为这一位不会改变。当事实证明并非如此后，NeoForge 的版本机制被改为包含完整的 Minecraft 版本号，并在需要时用 `0` 占据补丁号的位置。例如，NeoForge 26.1.0.5-beta 是针对 Minecraft 26.1 的第 6 个版本。

NeoForge 中也有少数地方使用 [Maven 版本范围][mvr]，例如 [`neoforge.mods.toml`][neoforgemodstoml] 文件中的 Minecraft 和 NeoForge 版本范围。它们大体上与 semver 兼容，但并不完全兼容（例如，它不考虑 `pre` 标签）。

## Mod {#mods}

不存在绝对最佳的版本系统。不同的开发风格、项目规模等都会影响使用何种版本系统的决定。有时，版本系统还可以组合使用。本节尝试对一些常用的版本系统作一概览，并配以现实中的例子。

通常，一个 Mod 的文件名形如 `modid-<version>.jar`。因此，如果我们的 mod id 是 `examplemod`，版本是 `1.2.3`，那么我们的 Mod 文件将命名为 `examplemod-1.2.3.jar`。

:::note
版本系统是建议，而非严格强制的规则。尤其是在何时更改（“bump”，即递增）版本以及以何种方式更改这一点上更是如此。如果你想使用不同的版本系统，没人会阻止你。
:::

### 语义化版本 {#semantic-versioning}

语义化版本（“semver”）由三部分组成：`major.minor.patch`。当对代码库进行重大更改时递增主版本号，这通常与重大新特性和 Bug 修复相关联。当引入小特性时递增次版本号，而当某次更新只包含 Bug 修复时递增补丁号。

人们普遍认同：任何 `0.x.x` 版本都是开发版本，而在首个（完整）发布时，版本应递增到 `1.0.0`。

“次版本对应特性、补丁对应 Bug 修复”这一规则在实践中常被无视。一个流行的例子就是 Minecraft 本身，它通过次版本号发布重大特性，通过补丁号发布小特性，并在快照中修复 Bug（见上文）。

根据 Mod 更新的频繁程度，这些数字可大可小。例如，[Supplementaries][supplementaries] 的版本为 `2.6.31`（撰写本文时）。三位数甚至四位数的数字（尤其是在 `patch` 位上）完全是可能的。

### “精简版”与“扩展版”Semver {#reduced-and-expanded-semver}

有时，semver 只带两个数字。这是一种“精简版”semver，或称“2 段式”semver。它们的版本号只有 `major.minor` 方案。这常被那些只添加少量简单对象、因而很少需要更新（除 Minecraft 版本更新外）的小型 Mod 使用，它们往往永远停留在 `1.0` 版本。

“扩展版”semver，或称“4 段式”semver，有四个数字（即类似 `1.0.0.0`）。视 Mod 而定，其格式可以是 `major.api.minor.patch`、`major.minor.patch.hotfix`，或者完全不同的其他形式——并没有标准的做法。

对于 `major.api.minor.patch`，`major` 版本与 `api` 版本是解耦的。这意味着 `major`（特性）位和 `api` 位可以独立递增。这常被那些向其他 Mod 开发者暴露 API 的 Mod 使用。例如，[Mekanism][mekanism] 目前的版本是 10.4.5.19（撰写本文时）。

对于 `major.minor.patch.hotfix`，补丁级别被拆分为两部分。这是 [Create][create] Mod 采用的方式，它目前的版本是 0.5.1f（撰写本文时）。注意 Create 用一个字母而非第四个数字来表示 hotfix，以便与常规 semver 保持兼容。

:::info
精简版 semver、扩展版 semver、2 段式 semver 和 4 段式 semver 都不是任何官方术语或标准化格式。
:::

### Alpha、Beta、Release {#alpha-beta-release}

与 Minecraft 本身一样，Mod 开发常采用软件工程中经典的 `alpha`/`beta`/`release` 阶段，其中 `alpha` 表示不稳定/实验性版本（有时也称为 `experimental` 或 `snapshot`），`beta` 表示半稳定版本，`release` 表示稳定版本（有时用 `stable` 代替 `release`）。

一些 Mod 用它们的主版本号来表示 Minecraft 版本的跃升。[JEI][jei] 就是一个例子，它对 Minecraft 1.19.2 使用 `13.x.x.x`，对 1.19.4 使用 `14.x.x.x`，对 1.20.1 使用 `15.x.x.x`（没有针对 1.19.3 和 1.20.0 的版本）。另一些则把标签附加到 Mod 名称上，例如 [Minecolonies][minecolonies] Mod，它在撰写本文时的版本是 `1.1.328-BETA`。

### 包含 Minecraft 版本 {#including-the-minecraft-version}

在文件名中包含 Mod 所针对的 Minecraft 版本是很常见的做法。这让终端用户能更容易地弄清某个 Mod 是针对哪个 Minecraft 版本的。常见的放置位置是在 Mod 版本之前或之后，其中前者比后者更为普遍。例如，针对 1.20.2 的 JEI 版本 `16.0.0.28`（撰写本文时的最新版本）会变成 `jei-1.20.2-16.0.0.28` 或 `jei-16.0.0.28-1.20.2`。

### 包含 Mod 加载器 {#including-the-mod-loader}

你或许知道，NeoForge 并不是唯一的 Mod 加载器，许多 Mod 开发者会在多个平台上开发。因此，需要一种方式来区分同一 Mod、同一版本但针对不同 Mod 加载器的两个文件。

通常，这是通过在名称中的某处包含 Mod 加载器来实现的。`jei-neoforge-1.20.2-16.0.0.28`、`jei-1.20.2-neoforge-16.0.0.28` 或 `jei-1.20.2-16.0.0.28-neoforge` 都是有效的做法。对于其他 Mod 加载器，`neoforge` 这一部分会被替换为 `forge`、`fabric`、`quilt`，或你可能在 NeoForge 之外同时开发所针对的其他 Mod 加载器。

### 关于 Maven 的说明 {#a-note-on-maven}

Maven 是用于依赖托管的系统，它使用的版本系统在一些细节上与 semver 不同（不过总体的 `major.minor.patch` 模式保持一致）。相关的 [Maven 版本范围（MVR）][mvr] 系统在 NeoForge 的一些地方被使用（见[上文][neoforge]）。在选择你的版本方案时，应确保它与 MVR 兼容，否则其他 Mod 将无法依赖你 Mod 的特定版本！

[create]: https://www.curseforge.com/minecraft/mc-mods/create
[infinite]: https://minecraft.wiki/w/Java_Edition_20w14∞
[jei]: https://www.curseforge.com/minecraft/mc-mods/jei
[mekanism]: https://www.curseforge.com/minecraft/mc-mods/mekanism
[minecolonies]: https://www.curseforge.com/minecraft/mc-mods/minecolonies
[minecraft]: #minecraft
[neoforgemodstoml]: modfiles.md#neoforgemodstoml
[mvr]: https://maven.apache.org/enforcer/enforcer-rules/versionRanges.html
[mvr]: https://maven.apache.org/ref/3.9.9/maven-artifact/apidocs/org/apache/maven/artifact/versioning/ComparableVersion.html
[neoforge]: #neoforge
[pre]: #pre-releases
[rc]: #release-candidates
[semver]: https://semver.org/
[calver]: https://calver.org/
[supplementaries]: https://www.curseforge.com/minecraft/mc-mods/supplementaries

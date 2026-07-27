# 版本号 {#versioning}

本文将拆解 Minecraft 和 NeoForge 中版本号的工作方式，并对 Mod 的版本号给出一些建议。

## 我的世界 {#minecraft}

Minecraft 使用[语义化版本][semver]。语义化版本，简称 "semver"，采用 `major.minor.patch` 的格式。例如，Minecraft 1.20.2 的主版本号为 1，次版本号为 20，修订版本号为 2。

自 2011 年 Minecraft 1.0 推出以来，Minecraft 一直以 `1` 作为主版本号。在此之前，版本号方案频繁变动，出现过诸如 `a1.1`（Alpha 1.1）、 `b1.7.3`（Beta 1.7.3），甚至完全不遵循清晰版本号方案的 `infdev` 版本。由于 `1` 这个主版本号已经维持了十多年，再加上关于 Minecraft 2 的内部梗，人们普遍认为它几乎不可能再改变。

### 快照 {#snapshots}

快照偏离了标准的 semver 方案。它们的标记形式为 `YYwWWa`，其中 `YY` 表示年份的后两位（例如 `23`），`WW` 表示该年的周数（例如 `01`）。举例来说，快照 `23w01a` 就是 2023 年第一周发布的快照。

`a` 后缀用于同一周内发布两个快照的情形（此时第二个快照会被命名为类似 `23w01b` 的形式）。 Mojang 过去偶尔这样用过。这个后缀位也被用于像 `20w14infinite` 这样的快照，也就是 [2020 年无限维度愚人节玩笑][infinite]。

### 预发布版与候选发布版 {#pre-releases-and-release-candidates}

当一个快照周期接近尾声时，Mojang 会开始发布所谓的预发布版（pre-release）。预发布版被认为在功能上已经完整，只专注于修复 Bug。它们采用对应版本的 semver 记法，并以 `-preX` 作为后缀。例如，1.20.2 的第一个预发布版名为 `1.20.2-pre1`。预发布版可以有、通常也确实有多个，会相应地以 `-pre2`、 `-pre3` 等后缀标记。

同样地，当预发布周期结束时，Mojang 会发布候选发布版 1（Release Candidate 1，以 `-rc1` 作为版本后缀，例如 `1.20.2-rc1`）。 Mojang 的目标是只做一个候选发布版，如果没有更多 Bug 出现就直接发布它。不过，如果出现了意料之外的 Bug，也可能会有 `-rc2`、 `-rc3` 等版本，与预发布版类似。

## NeoForge {#neoforge}

NeoForge 使用一套改编过的 semver 系统：主版本号是 Minecraft 的次版本号，次版本号是 Minecraft 的修订版本号，而修订版本号才是 NeoForge “真正的”版本号。例如，NeoForge 20.2.59 就是针对 Minecraft 1.20.2 的第 60 个版本（我们从 0 开始计数）。开头的 `1` 被省略，因为它几乎不可能改变，原因参见[上文][minecraft]。

NeoForge 中也有少数地方使用 [Maven 版本范围][mvr]，例如 [`neoforge.mods.toml`][neoforgemodstoml] 文件中的 Minecraft 和 NeoForge 版本范围。这些范围大体上与 semver 兼容，但并非完全兼容（例如它不考虑 `pre` 标记）。

## 模型 {#mods}

并不存在一种绝对最优的版本号系统。不同的开发风格、项目规模等都会影响该选用哪种版本号系统的决定。有时，版本号系统也可以组合使用。本节尝试概览一些常用的版本号系统，并配以现实中的例子。

通常，一个 Mod 的文件名形如 `modid-<version>.jar`。所以如果我们的 mod id 是 `examplemod`，版本是 `1.2.3`，那么我们的 Mod 文件就会命名为 `examplemod-1.2.3.jar`。

:::note
版本号系统只是建议，而非严格强制的规则。这一点在“何时”以及“以何种方式”变更（“提升”，bump）版本号上尤为明显。如果你想使用不同的版本号系统，没人会阻止你。
:::

### 语义化版本 {#semantic-versioning}

语义化版本（"semver"）由三部分组成：`major.minor.patch`。当代码库发生重大改动时提升主版本号，这通常与重大新功能和 Bug 修复相关联。当引入次要功能时提升次版本号，而当一次更新只包含 Bug 修复时提升修订版本号。

人们普遍认为，任何 `0.x.x` 版本都属于开发版本，而在首个（完整）发布时，版本号应当提升到 `1.0.0`。

“次版本号用于功能、修订版本号用于 Bug 修复”这条规则在实践中常被无视。一个典型例子就是 Minecraft 本身，它通过次版本号推出重大功能，通过修订版本号推出次要功能，并在快照中修复 Bug（见上文）。

视一个 Mod 更新的频繁程度，这些数字可大可小。例如，[Supplementaries][supplementaries]（撰写本文时）的版本是 `2.6.31`。三位甚至四位的数字，尤其是在 `patch` 位上，是完全有可能出现的。

### “精简版”与“扩展版” Semver {#reduced-and-expanded-semver}

有时，semver 只用两个数字，这算是一种“精简版” semver，或“两段式” semver。它们的版本号只有 `major.minor` 方案。这常见于那些只添加少量简单对象、因而很少需要更新（除了 Minecraft 版本更新之外）的小型 Mod，它们往往永远停留在 `1.0` 版本。

“扩展版” semver，或“四段式” semver，有四个数字（例如 `1.0.0.0`）。视 Mod 而定，其格式可以是 `major.api.minor.patch`，也可以是 `major.minor.patch.hotfix`，或是完全不同的其他形式——并没有标准做法。

对于 `major.api.minor.patch`，`major` 版本与 `api` 版本是解耦的。这意味着 `major`（功能）位和 `api` 位可以各自独立提升。这常见于那些向其他 Mod 开发者暴露 API 的 Mod。例如，[Mekanism][mekanism]（撰写本文时）的版本为 10.4.5.19。

对于 `major.minor.patch.hotfix`，修订层级被拆成了两部分。[Create][create] Mod 采用的就是这种方式，它（撰写本文时）的版本为 0.5.1f。请注意，Create 用一个字母而非第四个数字来表示 hotfix，以便与常规 semver 保持兼容。

:::info
精简版 semver、扩展版 semver、两段式 semver 和四段式 semver 都不是任何意义上的官方术语或标准化格式。
:::

### Alpha、 Beta、发布 {#alpha-beta-release}

和 Minecraft 本身一样，Mod 开发常常沿用软件工程中经典的 `alpha`/`beta`/`release` 阶段划分：`alpha` 表示不稳定/试验性版本（有时也称 `experimental` 或 `snapshot`），`beta` 表示半稳定版本，`release` 表示稳定版本（有时用 `stable` 代替 `release`）。

一些 Mod 用它们的主版本号来表示 Minecraft 版本的跃升。一个例子是 [JEI][jei]，它对 Minecraft 1.19.2 使用 `13.x.x.x`，对 1.19.4 使用 `14.x.x.x`，对 1.20.1 使用 `15.x.x.x`（没有针对 1.19.3 和 1.20.0 的版本）。另一些则把标记附加到 Mod 名称上，例如 [Minecolonies][minecolonies] Mod，它（撰写本文时）的版本为 `1.1.328-BETA`。

### 包含 Minecraft 版本 {#including-the-minecraft-version}

在文件名中包含 Mod 所针对的 Minecraft 版本是很常见的做法。这让最终用户能够更容易地弄清一个 Mod 是给哪个 Minecraft 版本用的。常见的位置是放在 Mod 版本之前或之后，其中放在前面的做法比放在后面更为普遍。例如，针对 1.20.2 的 JEI 版本 `16.0.0.28`（撰写本文时的最新版）会写成 `jei-1.20.2-16.0.0.28` 或 `jei-16.0.0.28-1.20.2`。

### 包含 Mod 加载器 {#including-the-mod-loader}

你大概知道，NeoForge 并不是唯一的 Mod 加载器，许多 Mod 开发者会在多个平台上开发。因此，需要一种方式来区分同一 Mod、同一版本、但面向不同 Mod 加载器的两个文件。

通常，这是通过把 Mod 加载器写在名称的某处来实现的。 `jei-neoforge-1.20.2-16.0.0.28`、 `jei-1.20.2-neoforge-16.0.0.28` 或 `jei-1.20.2-16.0.0.28-neoforge` 都是有效的写法。对于其他 Mod 加载器，`neoforge` 这部分会替换为 `forge`、 `fabric`、 `quilt`，或你在 NeoForge 之外可能同时开发的其他 Mod 加载器。

### 关于 Maven 的说明 {#a-note-on-maven}

Maven，即用于托管依赖的系统，采用的版本号系统在一些细节上与 semver 有所不同（尽管总体的 `major.minor.patch` 模式保持不变）。与之相关的 [Maven 版本范围（MVR）][mvr] 系统在 NeoForge 的一些地方被使用（见[上文][neoforge]）。在选择你的版本号方案时，你应当确保它与 MVR 兼容，否则其他 Mod 将无法依赖你 Mod 的特定版本！

[create]: https://www.curseforge.com/minecraft/mc-mods/create
[infinite]: https://minecraft.wiki/w/Java_Edition_20w14∞
[jei]: https://www.curseforge.com/minecraft/mc-mods/jei
[mekanism]: https://www.curseforge.com/minecraft/mc-mods/mekanism
[minecolonies]: https://www.curseforge.com/minecraft/mc-mods/minecolonies
[minecraft]: #minecraft
[neoforgemodstoml]: modfiles.md#neoforgemodstoml
[mvr]: https://maven.apache.org/enforcer/enforcer-rules/versionRanges.html
[mvr]: https://maven.apache.org/ref/3.5.2/maven-artifact/apidocs/org/apache/maven/artifact/versioning/ComparableVersion.html
[neoforge]: #neoforge
[pre]: #pre-releases
[rc]: #release-candidates
[semver]: https://semver.org/
[supplementaries]: https://www.curseforge.com/minecraft/mc-mods/supplementaries

import Card from "../theme/Card.tsx";
import indexillu from "../../static/img/index illu 0.png"
import cardillu1 from "../../static/img/index illu 1.png"
import cardillu2 from "../../static/img/index illu 2.png"
import cardillu3 from "../../static/img/index illu 3.png"
import cardillu4 from "../../static/img/index illu 4.png"
import cardillu5 from "../../static/img/index illu 5.png"

<div class="index-container">
<div class="index-wrapper">
# NeoForged 文档 [非官方翻译版本]

:::info[非官方翻译]

本文档为社区维护的非官方中文翻译，可能存在翻译错误或版本滞后。请以[官方英文文档](https://docs.neoforged.net/docs/gettingstarted/)为准。

:::

这是 [NeoForged] 的官方文档的**非官方翻译**，NeoForged 是 Minecraft 的 Mod 开发 API。

本文档仅面向 NeoForged，**并非 Java 教程**。

如果你想为文档做贡献，请阅读[参与文档贡献][contributing]。

</div>
 <img class="index-wrapper-img" src={indexillu} alt="" />

</div>

<div style={{height:"100px",width:"100%"}}></div>

# 开始第一步！

<div class="container">
    <div class="row">
        <div class="col category">
            <Card
                title="NeoForge 文档"
                body="学习如何使用 NeoForge 创建你的第一个 Mod，并探索它提供的丰富 API。"
                link="/docs/gettingstarted/"
                linkTitle="开始阅读"
                main
                img={cardillu1}
            />
        </div>
    </div>
    <div class="row">
        <div class="col category">
            <Card
                title="工具链特性"
                body="了解 NeoForged 通过其 Gradle 插件提供的各项特性。"
                link="/toolchain/docs/"
                linkTitle="了解更多"
                img={cardillu2}
            />
        </div>
        <div class="col category">
            <Card
                title="版本导读"
                body="了解 Minecraft 各版本之间的变化，以及如何相应地更新你的 Mod。"
                link="/primer/docs/"
                linkTitle="阅读更多"
                img={cardillu3}
            />
        </div>
    </div>
    <div class="row">
        <div class="col category">
            <Card
                title="用户指南"
                body="了解如何在客户端或服务端环境中安装和使用 NeoForge。"
                link="/user/docs/"
                linkTitle="开始阅读"
                img={cardillu4}
            />
        </div>
        <div class="col category">
            <Card
                title="整合包开发"
                body="了解如何使用 NeoForge Mod 创建和调试整合包。"
                link="/modpack/docs/"
                linkTitle="开始阅读"
                img={cardillu5}
            />
        </div>
    </div>
</div>

[NeoForged]: https://neoforged.net
[contributing]: ./contributing

import Link from "@docusaurus/Link";
import {
    useActivePluginAndVersion,
    useDoc
} from "@docusaurus/plugin-content-docs/client";
import Breadcrumbs from "@theme-original/DocBreadcrumbs";
import Admonition from "@theme/Admonition";

const NOTICE_TARGETS: Record<string, { docId: string; versionLabel?: string }> =
    {
        default: { docId: "gettingstarted/index", versionLabel: "26.1" },
        toolchain: { docId: "docs/index" },
        user: { docId: "docs/index" },
        modpack: { docId: "docs/index" }
    };

function TranslationNotice() {
    return (
        <Admonition type="info" title="非官方翻译">
            <p>
                本文档为社区维护的非官方中文翻译，可能存在翻译错误或版本滞后。
                请以
                <Link to="https://docs.neoforged.net/docs/gettingstarted/">
                    官方英文文档
                </Link>
                为准。
            </p>
        </Admonition>
    );
}

export default function DocBreadcrumbsWrapper(props) {
    const { metadata } = useDoc();
    const active = useActivePluginAndVersion({ failfast: false });
    const pluginId = active?.activePlugin?.pluginId;
    const versionLabel = active?.activeVersion?.label;

    const target = pluginId ? NOTICE_TARGETS[pluginId] : undefined;
    const shouldShowNotice =
        !!target &&
        metadata.id === target.docId &&
        (!target.versionLabel || versionLabel === target.versionLabel);

    return (
        <>
            {shouldShowNotice && <TranslationNotice />}
            <Breadcrumbs {...props} />
        </>
    );
}

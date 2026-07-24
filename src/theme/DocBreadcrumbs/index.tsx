import Link from "@docusaurus/Link";
import { useDoc, useDocsVersion } from "@docusaurus/plugin-content-docs/client";
import Breadcrumbs from "@theme-original/DocBreadcrumbs";
import Admonition from "@theme/Admonition";

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
    const version = useDocsVersion();

    const shouldShowNotice =
        version?.label === "26.1" && metadata.id === "gettingstarted/index";

    return (
        <>
            {shouldShowNotice && <TranslationNotice />}
            <Breadcrumbs {...props} />
        </>
    );
}

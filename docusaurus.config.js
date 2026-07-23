// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion
const {themes} = require('prism-react-renderer');
const lightTheme = themes.oneLight;
const darkTheme = themes.vsDark;

// Section metadata

const contentPlugins = [];
const navbarItems = [];
const footerItems = [];

function createContentDocs(id, label) {
  contentPlugins.push([
    "@docusaurus/plugin-content-docs",
    {
      id: id,
      path: id,
      routeBasePath: id,
      sidebarPath: require.resolve(`./sidebar/${id}.js`),
    },
  ]);

  navbarItems.push({
    type: "docSidebar",
    sidebarId: `${id}Sidebar`,
    position: "left",
    docsPluginId: id,
    label: label,
  });

  footerItems.push({
    to: `/${id}/docs/`,
    label: label
  });
}

createContentDocs("toolchain", "工具链特性");
createContentDocs("primer", "版本导读");
createContentDocs("user", "用户指南");
createContentDocs("modpack", "整合包开发");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "NeoForged 文档",
  tagline: "更好的 Mod 加载器",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://docs.neoforged.net",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "neoforged", // Usually your GitHub org/user name.
  projectName: "documentation", // Usually your repo name.

  onBrokenLinks: "throw", // Yay multi versioned-docs sites

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  // 默认语言设为简体中文：默认语言的内容仍在 docs/ 等常规目录，无需 i18n/ 子目录，
  // 同时会自动加载 Docusaurus 内置的中文界面翻译（上一页/下一页、提示框标签、搜索等）。
  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          lastVersion: "current",
          includeCurrentVersion: true,
          versions: require("./version_labels.json"),
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  plugins: contentPlugins,

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: "dark",
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },

      // Replace with your project's social card
      //image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: "首页",
        logo: {
          alt: "NeoForged Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "mainSidebar",
            position: "left",
            label: "NeoForge 文档",
          }
        ]
        .concat(navbarItems)
        .concat([
          {
            // 自定义“继续阅读”入口，见 src/theme/NavbarItem/ComponentTypes
            type: "custom-continueReading",
            position: "right",
          },
          {
            type: "docsVersionDropdown",
            position: "right",
          },
          {
            href: "https://github.com/neoforged/documentation",
            label: "GitHub",
            position: "right",
          },
        ]),
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "文档",
            items: [
              {
                to: "/docs/gettingstarted/",
                label: "NeoForge 文档",
              },
            ]
            .concat(footerItems)
            .concat([
              {
                to: "/contributing",
                label: "参与文档贡献"
              }
            ]),
          },
          {
            title: "相关链接",
            items: [
              {
                label: "Discord",
                href: "https://discord.neoforged.net/",
              },
              {
                label: "官方网站",
                href: "https://neoforged.net/",
              },
              {
                label: "GitHub 源仓库",
                href: "https://github.com/neoforged/documentation",
              },
            ],
          },
        ],
        copyright: `
        <p>本站非 Minecraft 官方网站，未获 Mojang 或 Microsoft 批准，亦与其无关联。</p>
        <p>本地中文阅读版，仅供个人学习。原文档 Copyright © ${new Date().getFullYear()}，基于 MIT 许可证，使用 Docusaurus 构建。</p>
        `,
      },
      prism: {
        theme: lightTheme,
        darkTheme: darkTheme,
        additionalLanguages: ["java", "gradle", "toml", "groovy", "kotlin", "javascript", "json", "json5", "properties"],
      },
      algolia: {
        // The application ID provided by Algolia
        appId: '05RJFT798Z',
  
        // Public API key: it is safe to commit it
        apiKey: 'b198aa85c7f2ee9364d105ef0be4d81a',
  
        indexName: 'neoforged'
      },
    }),

    markdown: {
      mermaid: true,
      hooks: {
          onBrokenMarkdownLinks: "throw"
      }
    },

    themes: ['@docusaurus/theme-mermaid']
};

module.exports = config;

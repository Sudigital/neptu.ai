import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Neptu",
  description: "Ancient Balinese Wuku Calendar meets Web3 on Solana",

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
    ["link", { rel: "canonical", href: "https://docs.neptu.sudigital.com" }],
    ["meta", { property: "og:type", content: "website" }],
    [
      "meta",
      { property: "og:url", content: "https://docs.neptu.sudigital.com" },
    ],
    [
      "meta",
      { property: "og:title", content: "Neptu - Ancient Wisdom, On-Chain" },
    ],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Transform the Balinese Wuku calendar into your personal oracle on Solana",
      },
    ],
    [
      "meta",
      {
        property: "og:image",
        content: "https://neptu.sudigital.com/og-image.png",
      },
    ],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:site", content: "@sudiarth" }],
  ],

  // For custom domain deployment
  cleanUrls: true,

  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Neptu",

    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/" },
      { text: "Agent", link: "/agent/skill" },
      { text: "Tokenomics", link: "/tokenomics" },
      { text: "App", link: "https://neptu.sudigital.com" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [{ text: "Introduction", link: "/guide/" }],
        },
      ],
      "/agent/": [
        {
          text: "AI Agent",
          items: [
            { text: "Skills", link: "/agent/skill" },
            { text: "Trend Detection", link: "/agent/trend-detection" },
          ],
        },
      ],
    },

    search: {
      provider: "local",
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/Sudigital/neptu.ai" },
      { icon: "twitter", link: "https://twitter.com/sudiarth" },
    ],

    footer: {
      message: "🌴 Ancient Balinese Wisdom meets Web3 on Solana",
      copyright:
        "Copyright © 2026 Neptu - Ancient Balinese Wisdom meets Web3 | <a href='https://neptu.sudigital.com'>Launch App</a>",
    },
  },
});

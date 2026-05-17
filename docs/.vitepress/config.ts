import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "ReactX",
  description: "Transparent reactive state management for React",
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Get Started", link: "/get-started" },
    ],

    sidebar: [
      {
        items: [
          { text: "Get Started", link: "/get-started" },
          { text: "Hello World", link: "/hello-world" },
          { text: "Mental Model", link: "/mental-model" },
        ],
      },
      {
        text: "Guides",
        items: [
          { text: "State", link: "/state" },
          { text: "Services", link: "/services" },
          { text: "Components", link: "/components" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/christianalfoni/reactx" },
    ],
  },
});

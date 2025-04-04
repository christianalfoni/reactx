import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Mobx Reactive",
  description: "Mobx Reimagined",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
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
        text: "Patterns",
        items: [
          { text: "Constructor", link: "/constructor" },
          { text: "Runtime API Examples", link: "/api-examples" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});

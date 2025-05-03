import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Mobx Lite",
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
          { text: "Reimagined", link: "/reimagined" },
        ],
      },
      {
        text: "Guides",
        items: [
          {
            text: "Creating state",
            link: "/creating-state",
          },
          { text: "Data queries", link: "/data-queries" },
          { text: "Data mutations", link: "/data-mutations" },
          { text: "Subscriptions", link: "/subscriptions" },
          {
            text: "Explicit states",
            link: "/explicit-states",
          },
          { text: "Multiple UX", link: "/multiple-ux" },
          {
            text: "Environment dependencies",
            link: "/environment-dependencies",
          },
        ],
      },
      {
        text: "API",
        items: [
          { text: "reactive", link: "/api/reactive" },
          { text: "query", link: "/api/query" },
          { text: "mutation", link: "/api/mutation" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});

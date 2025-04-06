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
          { text: "Functions VS Classes", link: "/functions-vs-classes" },
        ],
      },
      {
        text: "Guides",
        items: [
          {
            text: "Creating state",
            link: "/creating-state",
          },
          {
            text: "Protected state",
            link: "/protected-state",
          },
          {
            text: "Nested state",
            link: "/nested-state",
          },
          {
            text: "Explicit states",
            link: "/explicit-states",
          },

          { text: "Data queries", link: "/data-queries" },
          { text: "Data mutations", link: "/data-mutations" },
          { text: "Multiple UX", link: "/multiple-ux" },
          {
            text: "Environment dependencies",
            link: "/environment-dependencies",
          },
          { text: "Subscriptions", link: "/subscriptions" },
        ],
      },
      {
        text: "Api",
        items: [
          {
            text: "reactive",
            link: "/api/reactive",
          },
          {
            text: "reactive.readonly",
            link: "/api/reactive.readonly",
          },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});

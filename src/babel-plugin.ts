import observingComponentsPlugin from "babel-plugin-observing-components";

export default function plugin({ exclude }: { exclude?: string[] } = {}) {
  return observingComponentsPlugin({ importPath: "mobx-lite", exclude });
}

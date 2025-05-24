export default function plugin({ exclude }: { exclude?: string[] } = {}) {
  return [
    "swc-plugin-observing-components",
    { import_path: "reactx", exclude },
  ];
}

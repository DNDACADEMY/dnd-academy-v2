// vite.config.mts
import { resolve } from "path";
import { defineConfig } from "file:///Users/levit/Documents/dnd-academy-v2/packages/core/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/levit/Documents/dnd-academy-v2/packages/core/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/levit/Documents/dnd-academy-v2/packages/core";
var vite_config_default = defineConfig({
  plugins: [
    dts({
      include: ["./src"],
      outDir: "dist",
      insertTypesEntry: true
    })
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__vite_injected_original_dirname, "src/index.ts")
      },
      formats: ["es", "cjs"],
      name: "@dnd-academy/core",
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "mjs" : "js"}`
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2xldml0L0RvY3VtZW50cy9kbmQtYWNhZGVteS12Mi9wYWNrYWdlcy9jb3JlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbGV2aXQvRG9jdW1lbnRzL2RuZC1hY2FkZW15LXYyL3BhY2thZ2VzL2NvcmUvdml0ZS5jb25maWcubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9sZXZpdC9Eb2N1bWVudHMvZG5kLWFjYWRlbXktdjIvcGFja2FnZXMvY29yZS92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgZHRzKHtcbiAgICAgIGluY2x1ZGU6IFsnLi9zcmMnXSxcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgaW5zZXJ0VHlwZXNFbnRyeTogdHJ1ZSxcbiAgICB9KSxcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiB7XG4gICAgICAgIGluZGV4OiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9pbmRleC50cycpLFxuICAgICAgfSxcbiAgICAgIGZvcm1hdHM6IFsnZXMnLCAnY2pzJ10sXG4gICAgICBuYW1lOiAnQGRuZC1hY2FkZW15L2NvcmUnLFxuICAgICAgZmlsZU5hbWU6IChmb3JtYXQsIGVudHJ5TmFtZSkgPT4gYCR7ZW50cnlOYW1lfS4ke2Zvcm1hdCA9PT0gJ2VzJyA/ICdtanMnIDogJ2pzJ31gLFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlUsU0FBUyxlQUFlO0FBRXJXLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUhoQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsTUFDRixTQUFTLENBQUMsT0FBTztBQUFBLE1BQ2pCLFFBQVE7QUFBQSxNQUNSLGtCQUFrQjtBQUFBLElBQ3BCLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUEsTUFDSCxPQUFPO0FBQUEsUUFDTCxPQUFPLFFBQVEsa0NBQVcsY0FBYztBQUFBLE1BQzFDO0FBQUEsTUFDQSxTQUFTLENBQUMsTUFBTSxLQUFLO0FBQUEsTUFDckIsTUFBTTtBQUFBLE1BQ04sVUFBVSxDQUFDLFFBQVEsY0FBYyxHQUFHLFNBQVMsSUFBSSxXQUFXLE9BQU8sUUFBUSxJQUFJO0FBQUEsSUFDakY7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K

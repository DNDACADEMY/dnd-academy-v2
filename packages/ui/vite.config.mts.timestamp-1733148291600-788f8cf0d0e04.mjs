// vite.config.mts
import { resolve } from "path";
import react from "file:///Users/levit/Documents/dnd-academy-v2/node_modules/@vitejs/plugin-react/dist/index.mjs";
import preserveDirectives from "file:///Users/levit/Documents/dnd-academy-v2/node_modules/rollup-preserve-directives/dist/es/index.mjs";
import { defineConfig } from "file:///Users/levit/Documents/dnd-academy-v2/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/levit/Documents/dnd-academy-v2/node_modules/vite-plugin-dts/dist/index.mjs";
import svgr from "file:///Users/levit/Documents/dnd-academy-v2/node_modules/vite-plugin-svgr/dist/index.js";
var __vite_injected_original_dirname = "/Users/levit/Documents/dnd-academy-v2/packages/ui";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    dts({
      include: ["./src"],
      outDir: "dist",
      insertTypesEntry: true
    }),
    svgr()
  ],
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".scss"],
    alias: {
      "@": resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    lib: {
      entry: {
        index: resolve(__vite_injected_original_dirname, "src/index.ts"),
        server: resolve(__vite_injected_original_dirname, "src/server.ts"),
        client: resolve(__vite_injected_original_dirname, "src/client.ts")
      },
      formats: ["es", "cjs"],
      name: "@dnd-academy/ui",
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "mjs" : "js"}`
    },
    rollupOptions: {
      plugins: [preserveDirectives()],
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM"
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) {
            return "assets/[name].[ext]";
          }
          if (assetInfo.name === "style.css") {
            return "style.css";
          }
          return assetInfo.name;
        }
      }
    }
  },
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
      generateScopedName: "[name]__[local]___[hash:base64:5]"
    },
    preprocessorOptions: {
      scss: {
        additionalData: '@import "./src/styles/main.scss";'
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2xldml0L0RvY3VtZW50cy9kbmQtYWNhZGVteS12Mi9wYWNrYWdlcy91aVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2xldml0L0RvY3VtZW50cy9kbmQtYWNhZGVteS12Mi9wYWNrYWdlcy91aS92aXRlLmNvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2xldml0L0RvY3VtZW50cy9kbmQtYWNhZGVteS12Mi9wYWNrYWdlcy91aS92aXRlLmNvbmZpZy5tdHNcIjsvKiBlc2xpbnQtZGlzYWJsZSBpbXBvcnQvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXMgKi9cbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcblxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBwcmVzZXJ2ZURpcmVjdGl2ZXMgZnJvbSAncm9sbHVwLXByZXNlcnZlLWRpcmVjdGl2ZXMnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cyc7XG5pbXBvcnQgc3ZnciBmcm9tICd2aXRlLXBsdWdpbi1zdmdyJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgZHRzKHtcbiAgICAgIGluY2x1ZGU6IFsnLi9zcmMnXSxcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgaW5zZXJ0VHlwZXNFbnRyeTogdHJ1ZSxcbiAgICB9KSxcbiAgICBzdmdyKCksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBleHRlbnNpb25zOiBbJy5tanMnLCAnLmpzJywgJy50cycsICcuanN4JywgJy50c3gnLCAnLmpzb24nLCAnLnNjc3MnXSxcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiB7XG4gICAgICAgIGluZGV4OiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9pbmRleC50cycpLFxuICAgICAgICBzZXJ2ZXI6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3NlcnZlci50cycpLFxuICAgICAgICBjbGllbnQ6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2NsaWVudC50cycpLFxuICAgICAgfSxcbiAgICAgIGZvcm1hdHM6IFsnZXMnLCAnY2pzJ10sXG4gICAgICBuYW1lOiAnQGRuZC1hY2FkZW15L3VpJyxcbiAgICAgIGZpbGVOYW1lOiAoZm9ybWF0LCBlbnRyeU5hbWUpID0+IGAke2VudHJ5TmFtZX0uJHtmb3JtYXQgPT09ICdlcycgPyAnbWpzJyA6ICdqcyd9YCxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIHBsdWdpbnM6IFtwcmVzZXJ2ZURpcmVjdGl2ZXMoKV0sXG4gICAgICBleHRlcm5hbDogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgcmVhY3Q6ICdSZWFjdCcsXG4gICAgICAgICAgJ3JlYWN0LWRvbSc6ICdSZWFjdERPTScsXG4gICAgICAgIH0sXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAoYXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgaWYgKCFhc3NldEluZm8ubmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuICdhc3NldHMvW25hbWVdLltleHRdJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYXNzZXRJbmZvLm5hbWUgPT09ICdzdHlsZS5jc3MnKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3N0eWxlLmNzcyc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGFzc2V0SW5mby5uYW1lO1xuICAgICAgICB9LFxuICAgICAgfSxcblxuICAgIH0sXG4gIH0sXG4gIGNzczoge1xuICAgIG1vZHVsZXM6IHtcbiAgICAgIGxvY2Fsc0NvbnZlbnRpb246ICdjYW1lbENhc2VPbmx5JyxcbiAgICAgIGdlbmVyYXRlU2NvcGVkTmFtZTogJ1tuYW1lXV9fW2xvY2FsXV9fX1toYXNoOmJhc2U2NDo1XScsXG4gICAgfSxcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBzY3NzOiB7XG4gICAgICAgIGFkZGl0aW9uYWxEYXRhOiAnQGltcG9ydCBcIi4vc3JjL3N0eWxlcy9tYWluLnNjc3NcIjsnLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxlQUFlO0FBRXhCLE9BQU8sV0FBVztBQUNsQixPQUFPLHdCQUF3QjtBQUMvQixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFNBQVM7QUFDaEIsT0FBTyxVQUFVO0FBUGpCLElBQU0sbUNBQW1DO0FBU3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLElBQUk7QUFBQSxNQUNGLFNBQVMsQ0FBQyxPQUFPO0FBQUEsTUFDakIsUUFBUTtBQUFBLE1BQ1Isa0JBQWtCO0FBQUEsSUFDcEIsQ0FBQztBQUFBLElBQ0QsS0FBSztBQUFBLEVBQ1A7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLFlBQVksQ0FBQyxRQUFRLE9BQU8sT0FBTyxRQUFRLFFBQVEsU0FBUyxPQUFPO0FBQUEsSUFDbkUsT0FBTztBQUFBLE1BQ0wsS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUNqQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQSxNQUNILE9BQU87QUFBQSxRQUNMLE9BQU8sUUFBUSxrQ0FBVyxjQUFjO0FBQUEsUUFDeEMsUUFBUSxRQUFRLGtDQUFXLGVBQWU7QUFBQSxRQUMxQyxRQUFRLFFBQVEsa0NBQVcsZUFBZTtBQUFBLE1BQzVDO0FBQUEsTUFDQSxTQUFTLENBQUMsTUFBTSxLQUFLO0FBQUEsTUFDckIsTUFBTTtBQUFBLE1BQ04sVUFBVSxDQUFDLFFBQVEsY0FBYyxHQUFHLFNBQVMsSUFBSSxXQUFXLE9BQU8sUUFBUSxJQUFJO0FBQUEsSUFDakY7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztBQUFBLE1BQzlCLFVBQVUsQ0FBQyxTQUFTLFdBQVc7QUFBQSxNQUMvQixRQUFRO0FBQUEsUUFDTixTQUFTO0FBQUEsVUFDUCxPQUFPO0FBQUEsVUFDUCxhQUFhO0FBQUEsUUFDZjtBQUFBLFFBQ0EsZ0JBQWdCLENBQUMsY0FBYztBQUM3QixjQUFJLENBQUMsVUFBVSxNQUFNO0FBQ25CLG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksVUFBVSxTQUFTLGFBQWE7QUFDbEMsbUJBQU87QUFBQSxVQUNUO0FBRUEsaUJBQU8sVUFBVTtBQUFBLFFBQ25CO0FBQUEsTUFDRjtBQUFBLElBRUY7QUFBQSxFQUNGO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSCxTQUFTO0FBQUEsTUFDUCxrQkFBa0I7QUFBQSxNQUNsQixvQkFBb0I7QUFBQSxJQUN0QjtBQUFBLElBQ0EscUJBQXFCO0FBQUEsTUFDbkIsTUFBTTtBQUFBLFFBQ0osZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

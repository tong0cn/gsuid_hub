import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// 读取 package.json 获取版本号
const packageJsonPath = path.resolve(__dirname, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : "/app/",
  define: {
    PACKAGE_VERSION: JSON.stringify(packageJson.version),
  },
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // 开发模式下：前端独立运行，代理 /api 到后端
      // 生产模式（后端挂载）：前端通过后端的 /app 路径访问
      "/api": {
        target: "http://localhost:8765",
        changeOrigin: true,
      },
      "/ws": {
        target: "http://localhost:8765",
        ws: true,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // 自定义插件：构建完成后生成 version.json
    {
      name: "generate-version-json",
      closeBundle() {
        // 读取 package.json 获取版本号
        const packageJsonPath = path.resolve(__dirname, "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        
        const versionInfo = {
          version: packageJson.version || "0.0.0",
          buildTime: new Date().toISOString(),
          mode: mode,
        };
        
        // 写入 version.json 到 dist 目录
        const distPath = path.resolve(__dirname, "dist");
        fs.writeFileSync(
          path.join(distPath, "version.json"),
          JSON.stringify(versionInfo, null, 2),
          "utf-8"
        );
        console.log(`[generate-version-json] Generated version.json:`, versionInfo);
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
}));

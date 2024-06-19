import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/migrate.ts"],
  format: ["cjs", "esm"],
  sourcemap: true,
  clean: true,
  dts: true,
});

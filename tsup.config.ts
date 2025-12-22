import { builtinModules } from "node:module"
import { defineConfig } from "tsup"
import { aliasesPlugin } from "./scripts/aliasesPlugin.ts"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  dts: true,
  splitting: false,
  bundle: true,
  external: [
    "commander",
    ...builtinModules,
    ...builtinModules.map(t => `node:${t}`)
  ],
  async esbuildOptions(options) {
    options.alias = await aliasesPlugin()
  }
})

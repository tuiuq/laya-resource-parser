import { Command } from "commander";
import { join } from "node:path";
import { version } from "../package.json";
import type { Options } from "./types";
import { ResourceManager } from "./laya/ResourceManager";

async function main() {
  const program = new Command();

  program
    .name("laya-resource-parser")
    .alias("lr")
    .version(version, "-V, --version")

  program
    .option(
      "-b, --base <path>",
      "Base path for resource parsing",
      join(process.cwd(), "src")
    )
    .requiredOption(
      "-r, --remote <url>",
      "Remote URL for resource parsing",
      (value: string) => {
        if (!value.trim()) {
          throw new Error("remote URL cannot be empty");
        }

        try {
          const url = new URL(value);
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new Error("remote URL must be a valid HTTP or HTTPS URL");
          }

          return value;
        } catch {
          throw new Error("remote URL must be a valid HTTP or HTTPS URL");
        }
      }
    )
    .action(async (options: Options) => {
      const resource = new ResourceManager(options.base, options.remote)
      await resource.parse()
    })

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error("An error: ", error)
  process.exit(1)
})

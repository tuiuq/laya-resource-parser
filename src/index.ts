import { Command } from "commander"
import { version } from "../package.json"
import { baseOption, remoteOption } from "./options";
import { resolveParseOptions } from "./resolve";

async function main() {
  const program = new Command();

  program
    .name("laya-resource-parser")
    .alias("lr")
    .version(version, "-V, --version")

  program
    .addOption(baseOption)
    .addOption(remoteOption)
    .action((rawOptions) => {
      const options = resolveParseOptions(rawOptions);
      console.log(options);
    })

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error("An error: ", error)
  process.exit(1)
})

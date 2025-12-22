import { Command } from "commander"
import { version } from "../package.json"

async function main() {
  const program = new Command();

  program
    .name("laya-resource-parser")
    .alias("lr")
    .version(version, "-V, --version")

  program
    .action(() => {
      console.log("Hello")
    })

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error("An error: ", error)
  process.exit(1)
})

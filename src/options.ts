import { Option } from "commander";

export const baseOption = new Option(
  "-b, --base <path>",
  "Base path for resource parsing"
);

export const remoteOption = new Option(
  "-r, --remote <url>",
  "Remote URL for resource parsing"
).argParser((value: string) => {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error();
    }

    return value;
  } catch {
    throw new Error("remote URL must be a valid HTTP or HTTPS URL");
  }
});

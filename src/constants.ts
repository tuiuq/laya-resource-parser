import { join } from "node:path";

export const ROOT = join(process.cwd(), "src");
export const PKG_MAP_PATH = join(ROOT, "pkg-map.json")
export const BUNDLE_PATH = join(ROOT, "bundle.json")
export const CONCURRENCY = 5;
export const TOP_LEVEL_HIERARCHY_EXTENSIONS = [
  ".ls",
  ".lh"
];
export const PARSABLE_HIERARCHY_EXTENSIONS = [
  ".ls",
  ".lh",
  ".lmat",
  ".ltc"
];
export const IGNORED_HIERARCHY_SUFFIXES = [
  ".ltcb.ls",
  ".lanit.ls"
]
export const FILE_PATH_PATTERN = /^[\w./-\s-]*\.[A-Za-z0-9]{2,5}(\.[A-Za-z0-9]{2,5})?$/i;
export const FILECONFIG_PATH = join(ROOT, "fileconfig.json")

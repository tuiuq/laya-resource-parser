export type TraversePath = Array<string | number>;

export interface WalkFileOptions {
  root?: string;
  filter?: (relPath: string) => boolean | Promise<boolean>;
  ignoreDir?: (dirName: string, absPath: string) => boolean;
}

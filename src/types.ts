export interface Options {
  base: string;
  remote: string;
}

export interface IFileConfig {
  [key: string]: [
    string, string[]
  ]
}

export interface IPkgMap {
  [key: string]: string[];
}

export interface IBundleItem {
  name: string;
  zipUrl: string;
  prefix: string;
  selectGlob?: string;
}

export type IBundle = Array<IBundleItem>;

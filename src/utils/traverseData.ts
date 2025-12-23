import type { TraversePath } from "./types";

/**
 * Traverse data recursively and call callback function for each string value.
 * @param {unknown} data - Data to traverse.
 * @param {(path: TraversePath, key: string, value: string) => Promise<void>} callback - Callback function to call for each string value.
 * @param {{filter: (path: TraversePath, key: string, value: string) => Promise<boolean>}} options - Options for filtering and traversing.
 * @param {TraversePath} path - Current path in the data structure.
 * @returns Promise<void>
 */
export async function traverseData(
  data: unknown,
  callback: (
    path: TraversePath,
    key: string,
    value: string
  ) => Promise<void> | void,
  options?: {
    filter?: (
      path: TraversePath,
      key: string,
      value: string
    ) => boolean;
  },
  path: TraversePath = []
): Promise<void> {
  if (
    data === null ||
    data === undefined
  ) {
    return;
  }

  if (typeof data === "string") {
    if (!options?.filter?.(path, "", data)) {
      await callback(path, "", data);
    }
    return;
  }

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      await traverseData(
        data[i],
        callback,
        options,
        path.concat(i)
      )
    }
    return;
  }

  if (typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      const nextPath = path.concat(key);

      if (options?.filter?.(nextPath, key, value)) {
        continue;
      }

      if (typeof value === "string") {
        await callback(nextPath, key, value);
      } else {
        await traverseData(
          value,
          callback,
          options,
          nextPath
        )
      }
    }
  }
}

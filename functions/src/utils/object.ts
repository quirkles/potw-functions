export function deepMerge<
    T extends Record<string, unknown>,
    U extends Record<string, unknown>,
>(target: T, source: U): T & U {
  const output: Record<string, unknown> = {...target};
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = output[key];
      if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
        output[key] = targetValue.concat(sourceValue);
      } else if (isObject(sourceValue) && isObject(targetValue)) {
        output[key] = deepMerge(targetValue, sourceValue);
      } else {
        output[key] = sourceValue;
      }
    }
  }
  return output as T & U;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function getValue<T, K extends keyof T>(key: K): (obj: T) => T[K] {
  return (obj) => obj[key];
}

export function flattenObject<T extends Record<string, unknown>>(
  obj: T,
): Record<string, string | number> {
  const flattened: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (isObject(value)) {
        const nested = flattenObject(value as Record<string, unknown>);
        for (const nestedKey in nested) {
          if (Object.prototype.hasOwnProperty.call(nested, nestedKey)) {
            flattened[`${key}.${nestedKey}`] = nested[nestedKey];
          }
        }
      } else {
        flattened[key] = value;
      }
    }
  }
  return flattened as Record<string, string | number>;
}

export default function keyMirror<T extends readonly string[]>(
  keys: T,
): { [K in T[number]]: K } {
  return keys.reduce(
    (acc: { [K in T[number]]: K }, key: string) => {
      acc[key as T[number]] = key;
      return acc;
    },
      {} as { [K in T[number]]: K },
  );
}

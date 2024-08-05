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

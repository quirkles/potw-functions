export type Nullish = null | undefined | void | never;
export type OrPromise<T> = T | Promise<T>
export type Maybe<T> = T | Nullish
export type ObjectFromList<T extends ReadonlyArray<string>, V = string | string[] | undefined> = {
    [K in (T extends ReadonlyArray<infer U> ? U : never)]: V
}

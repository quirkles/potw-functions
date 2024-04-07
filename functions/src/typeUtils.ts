export type Nullish = null | undefined | void | never;
export type OrPromise<T> = T | Promise<T>
export type Maybe<T> = T | Nullish


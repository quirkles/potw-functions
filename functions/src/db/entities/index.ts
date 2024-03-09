import {User} from "./User";

export const Entities = {
  "User": User,
} as const;

export type Entity = typeof Entities[keyof typeof Entities];

export type EntityName = keyof typeof Entities;

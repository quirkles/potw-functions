//  Define the list of permissions.

const APP_PERMISSIONS = {
  IS_SUPER_ADMIN: 1 << 0,
} as const;

type AppPermissions = typeof APP_PERMISSIONS[keyof typeof APP_PERMISSIONS];

const GAME_PERMISSIONS = {
  IS_GAME_ADMIN: 1 << 1,
};

type GamePermissions = typeof GAME_PERMISSIONS[keyof typeof GAME_PERMISSIONS];

export function combinePermissions(...permissions: AppPermissions[] | GamePermissions[]): number
export function combinePermissions(permissions: AppPermissions[] | GamePermissions[]): number
export function combinePermissions(
  ...args: AppPermissions[] | GamePermissions[] | [AppPermissions[]] | [GamePermissions[]]
): number {
  return args.flat().reduce((acc, permission) => acc | permission, 0);
}

export function addPermission(permissions: number, permission: AppPermissions | GamePermissions): number {
  return permissions | permission;
}

export function togglePermission(permissions: number, permission: AppPermissions | GamePermissions): number {
  return permissions ^ permission;
}

export function removePermission(permissions: number, permission: AppPermissions | GamePermissions): number {
  return permissions & ~permission;
}

export function hasPermission(permissions: number, permission: AppPermissions | GamePermissions): boolean {
  return (permissions & permission) === permission;
}

export function hasAnyPermission(
  permissions: number,
  ...permissionsToCheck: AppPermissions[] | GamePermissions[]
): boolean {
  return permissionsToCheck.some((permission) => hasPermission(permissions, permission));
}

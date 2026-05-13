export type Feature =
    | 'dashboard'
    | 'courses'
    | 'manuals'
    | 'trainers'
    | 'tests'
    | 'users'
    | 'departments'
    | 'roles'
    | 'achievements'
    | 'courseTests';

type RolePermissions = Feature[] | '*';

// ID: [доступные инструменты]
export const ROLE_PERMISSIONS: Record<number, RolePermissions> = {
    6: ['dashboard', 'courses'],                                    // Стажёр
    5: ['dashboard', 'courses', 'manuals', 'trainers', 'tests'],    // следующая роль
    1: '*',                                                         // Администратор
};

export function hasFeature(roleId: number | null | undefined, feature: Feature): boolean {
    if (!roleId) return false;
    const perms = ROLE_PERMISSIONS[roleId];
    if (!perms) return false;
    if (perms === '*') return true;
    return perms.includes(feature);
}
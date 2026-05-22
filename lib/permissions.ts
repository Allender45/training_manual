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
    | 'sidebarAdminMenu'
    | 'sidebarMentorMenu'
    | 'usersTableCreateButton'
    | 'usersTableFilters'
    | 'usersTableRole'
    | 'usersTableMentor'
    | 'coursesTableButtons'
    | 'editUser'
    | 'courseTests';

type RolePermissions = Feature[] | '*';

// ID: [доступные инструменты]
export const ROLE_PERMISSIONS: Record<number, RolePermissions> = {
    6: ['dashboard', 'courses'],                                    // Стажёр
    5: ['dashboard', 'courses', 'manuals', 'trainers', 'tests'],    // следующая роль
    4: ['sidebarMentorMenu'],    // Наставник
    2: ['sidebarMentorMenu', 'usersTableCreateButton', 'usersTableFilters', 'coursesTableButtons', 'editUser'],    // Админ
    1: '*',                                                         // СуперПользователь
};

export function hasFeature(roleId: number | null | undefined, feature: Feature): boolean {
    if (!roleId) return false;
    const perms = ROLE_PERMISSIONS[roleId];
    if (!perms) return false;
    if (perms === '*') return true;
    return perms.includes(feature);
}
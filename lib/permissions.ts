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
    | 'studentWidgets'
    | 'mentorWidgets'
    | 'sidebarAdminMenu'
    | 'sidebarAdminMenuRoles'
    | 'sidebarMentorMenu'
    | 'sidebarStudentMenu'
    | 'sidebarHrMenu'
    | 'usersTableCreateButton'
    | 'usersTableFilters'
    | 'usersTableRole'
    | 'usersTableMentor'
    | 'coursesTableButtons'
    | 'usersTableEditUserButton'
    | 'usersTableDellUserButton'
    | 'usersTableDetailUserButton'
    | 'adaptationTableAddButtons'
    | 'coursesTableAddButtons'
    | 'manualsTableAddButtons'
    | 'trainingsTableAddButtons'
    | 'testsTableAddButtons'
    | 'editUser'
    | 'functionalAddButton'
    | 'functionalEditButton'
    | 'profileRoleChange'
    | 'courseTests';

type RolePermissions = Feature[] | '*';

// ID: [доступные инструменты]
export const ROLE_PERMISSIONS: Record<number, RolePermissions> = {
    6: [
        'dashboard',
        'courses',
        'sidebarStudentMenu',
        'studentWidgets',
    ],   // Стажёр
    4: [
        'sidebarMentorMenu',
        'usersTableDetailUserButton',
        'usersTableFilters',
        'adaptationTableAddButtons',
        'mentorWidgets',
        'profileRoleChange',
    ],    // Наставник
    3: [
        'sidebarHrMenu',
        'usersTableDetailUserButton',
        'usersTableFilters',
        'editUser',
        'usersTableCreateButton',
        'coursesTableButtons',
        'coursesTableAddButtons',
        'usersTableEditUserButton',
        'usersTableDellUserButton',
        'profileRoleChange'
    ],    // Кадровик
    2: [
        'sidebarMentorMenu',
        'sidebarAdminMenu',
        'usersTableCreateButton',
        'usersTableFilters',
        'coursesTableButtons',
        'editUser',
        'usersTableDellUserButton',
        'usersTableEditUserButton',
        'functionalAddButton',
        'profileRoleChange',
        'functionalEditButton'
    ],    // Админ
    1: '*',  // СуперПользователь
};

export function hasFeature(roleId: number | null | undefined, feature: Feature): boolean {
    if (!roleId) return false;
    const perms = ROLE_PERMISSIONS[roleId];
    if (!perms) return false;
    if (perms === '*') return true;
    return perms.includes(feature);
}
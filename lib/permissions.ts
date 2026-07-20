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
    | 'sidebarTeachersMenu'
    | 'sidebarStudentsTable'
    | 'sidebarAdaptationPlans'
    | 'sidebarHrTable'
    | 'usersTableCreateButton'
    | 'usersTableFilters'
    | 'usersTableRole'
    | 'usersTableMentor'
    | 'coursesTableButtons'
    | 'usersTableEditUserButton'
    | 'usersTableDellUserButton'
    | 'usersTableDetailUserButton'
    | 'userProfileAddAchievementsButton'
    | 'adaptationTableAddButtons'
    | 'coursesTableAddButtons'
    | 'manualsTableAddButtons'
    | 'trainingsTableAddButtons'
    | 'testsTableAddButtons'
    | 'editUser'
    | 'functionalAddButton'
    | 'functionalEditButton'
    | 'profileRoleChange'
    | 'profilePassChange'
    | 'profileActiveStatusChange'
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
        'usersTableDetailUserButton',
        'usersTableFilters',
        'userProfileAddAchievementsButton',
        'adaptationTableAddButtons',
        'mentorWidgets',
        'profilePassChange',
        'profileActiveStatusChange',
        'sidebarStudentsTable',
        'sidebarAdaptationPlans',
    ],    // Наставник
    3: [
        'sidebarHrMenu',
        'sidebarTeachersMenu',
        'sidebarHrTable',
        'sidebarStudentsTable',
        'usersTableDetailUserButton',
        'usersTableFilters',
        'userProfileAddAchievementsButton',
        'editUser',
        'usersTableCreateButton',
        'coursesTableButtons',
        'coursesTableAddButtons',
        'usersTableEditUserButton',
        'usersTableDellUserButton',
        'profilePassChange',
        'profileActiveStatusChange',
    ],    // Кадровик
    2: [
        'sidebarMentorMenu',
        'sidebarTeachersMenu',
        'sidebarAdminMenu',
        'sidebarHrTable',
        'sidebarStudentsTable',
        'usersTableCreateButton',
        'usersTableFilters',
        'userProfileAddAchievementsButton',
        'coursesTableButtons',
        'editUser',
        'usersTableDellUserButton',
        'usersTableEditUserButton',
        'functionalAddButton',
        'profileRoleChange',
        'profilePassChange',
        'profileActiveStatusChange',
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
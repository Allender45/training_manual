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
    | 'studentRatingWidget'
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
    | 'achievementsTableAddButtons'
    | 'functionalTableAddButtons'
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
    | 'courseTests'
    | 'checklistsManage'
    | 'sidebarServeysTable'
    | 'checklistTriggersManage'
    | 'sidebarEventsMenu'
    | 'eventsTableAddButtons'
    | 'sidebarVacanciesMenu'
    | 'vacanciesTableAddButtons'
    | 'sidebarNewsMenu'
    | 'newsTableManage';


type RolePermissions = Feature[] | '*';

// ID: [доступные инструменты]
export const ROLE_PERMISSIONS: Record<number, RolePermissions> = {
    6: [
        'dashboard',
        'courses',
        'sidebarStudentMenu',
        'studentWidgets',
        'studentRatingWidget',
    ],   // Стажёр
    4: [
        'editUser',
        'usersTableFilters',
        'usersTableCreateButton',
        'usersTableEditUserButton',
        'userProfileAddAchievementsButton',
        'adaptationTableAddButtons',
        'mentorWidgets',
        'profilePassChange',
        'profileActiveStatusChange',
        'sidebarStudentsTable',
        'sidebarAdaptationPlans',
        'sidebarServeysTable',
    ],    // Наставник
    3: [
        'sidebarHrMenu',
        'sidebarTeachersMenu',
        'sidebarHrTable',
        'sidebarStudentsTable',
        'usersTableEditUserButton',
        'usersTableFilters',
        'userProfileAddAchievementsButton',
        'editUser',
        'usersTableCreateButton',
        'coursesTableButtons',
        'coursesTableAddButtons',
        'usersTableDellUserButton',
        'profilePassChange',
        'profileActiveStatusChange',
        'sidebarAdminMenu',
        'manualsTableAddButtons',
        'coursesTableAddButtons',
        'trainingsTableAddButtons',
        'testsTableAddButtons',
        'adaptationTableAddButtons',
        'achievementsTableAddButtons',
        'functionalTableAddButtons',
        'checklistTriggersManage',
        'checklistsManage',
        'sidebarServeysTable',
        'sidebarEventsMenu',
        'eventsTableAddButtons',
        'sidebarVacanciesMenu',
        'vacanciesTableAddButtons',
        'sidebarNewsMenu',
        'newsTableManage',
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
        'functionalEditButton',
        'checklistTriggersManage',
        'checklistsManage',
        'sidebarServeysTable',
        'sidebarEventsMenu',
        'eventsTableAddButtons',
        'sidebarVacanciesMenu',
        'vacanciesTableAddButtons',
        'sidebarNewsMenu',
        'newsTableManage',
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
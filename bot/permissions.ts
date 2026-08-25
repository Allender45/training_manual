import { AppUser } from './middlewares/resolveUser';

const ADMIN_ROLE_IDS = [1, 2, 3]; // Кадровик, СуперПользователь, Админ — те же роли, что и в lib/permissions.ts портала

export function isAdmin(user: AppUser | null): boolean {
    return !!user && ADMIN_ROLE_IDS.includes(user.role_id);
}
import { useUserStore } from '@/store/userStore';
import { hasFeature, Feature } from '@/lib/permissions';

export function useAccess(feature: Feature): boolean {
    const user = useUserStore(s => s.user);
    return hasFeature(user?.role_id, feature);
}

export function useAnyAccess(features: Feature[]): boolean {
    const user = useUserStore(s => s.user);
    return features.some(f => hasFeature(user?.role_id, f));
}
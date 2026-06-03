import { useNotificationsStore } from '@/store';

export function useNotify() {
    return useNotificationsStore(s => s.push);
}
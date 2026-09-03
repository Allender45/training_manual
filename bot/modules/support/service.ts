import { SUPPORT_API_URL, SUPPORT_BOT_API_KEY } from '../../config';

export interface SupportRequestInput {
    description: string;
    contactPhone: string;
    workplaceNumber: string;
    lastName: string;
    firstName: string;
    middleName: string;
    phone: string;
    telegramChatId: number;
    userId: number | null;
}

export async function sendSupportRequest(input: SupportRequestInput): Promise<void> {
    if (!SUPPORT_API_URL) {
        console.warn('[support] SUPPORT_API_URL не задан, заявка не отправлена:', input);
        return;
    }

    const response = await fetch(SUPPORT_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': SUPPORT_BOT_API_KEY,
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error(`Эндпоинт техподдержки ответил статусом ${response.status}`);
    }
}
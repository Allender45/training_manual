import { NextRequest, NextResponse } from 'next/server';
import { requireFeature } from '@/lib/apiAuth';
import { runTriggerEngine } from '@/lib/triggerEngine';

export async function POST(req: NextRequest) {
    const auth = await requireFeature(req, 'checklistTriggersManage');
    if (auth instanceof NextResponse) return auth;

    try {
        const result = await runTriggerEngine();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[POST /api/triggerEngine/run]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
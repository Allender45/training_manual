import { NextRequest, NextResponse } from 'next/server';
import { unsignSession } from '@/lib/session';

const API_KEY   = process.env.YANDEX_API_KEY!;
const FOLDER_ID = process.env.YANDEX_FOLDER_ID!;

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { form, transcript } = await req.json();



    const prompt = `Ты руководишь разнорабочими. Сравни то, что в транскрипции и то, что написал стажёр.
Транскрипция звонка:
"""
${transcript}
"""

Заявка стажёра:
Характер работ: ${form.workDescription || 'не указано'}

Верни ответ строго в JSON без markdown-обёртки:
{
  "passed": true - если результат удовлетворительный, false - если неудовлетворительный,
  "strong_points": ["..."],
  "weak_points": ["..."],
  "recommendations": ["..."]
}`;

    const llmRes = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
        method: 'POST',
        headers: {
            Authorization: `Api-Key ${API_KEY}`,
            'Content-Type': 'application/json',
            'x-folder-id': FOLDER_ID,
        },
        body: JSON.stringify({
            modelUri: `gpt://${FOLDER_ID}/yandexgpt-lite`,
            completionOptions: { stream: false, temperature: 0.5, maxTokens: '2000' },
            messages: [{ role: 'user', text: prompt }],
        }),
    });

    const llmData = await llmRes.json();
    const rawText: string = llmData?.result?.alternatives?.[0]?.message?.text ?? '{}';

    const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();

    let parsed: { passed?: boolean; strong_points?: string[]; weak_points?: string[]; recommendations?: string[]; answers?: string[] } = {};
    try { parsed = JSON.parse(cleaned); } catch { parsed = {}; }

    return NextResponse.json({
        passed:          parsed.passed          ?? false,
        strong_points:   parsed.strong_points   ?? [],
        weak_points:     parsed.weak_points     ?? [],
        recommendations: parsed.recommendations ?? [],
        answers: parsed.answers ?? [],
    });
}
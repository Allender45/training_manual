import { NextRequest, NextResponse } from 'next/server';
import { unsignSession } from '@/lib/session';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const API_KEY    = process.env.YANDEX_API_KEY!;
const FOLDER_ID  = process.env.YANDEX_FOLDER_ID!;
const S3_BUCKET  = process.env.YANDEX_S3_BUCKET!;
const S3_ACCESS  = process.env.YANDEX_S3_ACCESS_KEY!;
const S3_SECRET  = process.env.YANDEX_S3_SECRET_KEY!;

const s3 = new S3Client({
    region: 'ru-central1',
    endpoint: 'https://storage.yandexcloud.net',
    credentials: { accessKeyId: S3_ACCESS, secretAccessKey: S3_SECRET },
});

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean) ?? [];
    if (!ids.length) return NextResponse.json({ analyses: {} });

    const result = await pool.query(
        'SELECT * FROM call_analyses WHERE recording_id = ANY($1)',
        [ids]
    );

    const map: Record<string, any> = {};
    for (const row of result.rows) map[row.recording_id] = row;

    return NextResponse.json({ analyses: map });
}

async function pollOperation(operationId: string): Promise<string> {
    for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const res = await fetch(`https://operation.api.cloud.yandex.net/operations/${operationId}`, {
            headers: { Authorization: `Api-Key ${API_KEY}` },
        });
        const data = await res.json();
        if (data.done) {
            console.log('STT DONE, full response:', JSON.stringify(data, null, 2));
            const chunks: any[] = data.response?.chunks ?? [];
            const text = chunks
                .flatMap((c: any) => c.alternatives?.[0]?.text ?? '')
                .join(' ')
                .trim();
            if (!text) throw new Error('EMPTY_CHUNKS:' + JSON.stringify(data.response));
            return text;
        }
        if (data.error) throw new Error(data.error.message);
    }
    throw new Error('Превышено время ожидания транскрипции');
}

export async function POST(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { id, url } = await req.json();
    if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 });

    const cached = await pool.query('SELECT * FROM call_analyses WHERE recording_id = $1', [id]);
    if (cached.rows[0]) return NextResponse.json({ analysis: cached.rows[0] });

    let audioUrl: string;

    if (url) {
        const audioRes = await fetch(url);
        if (!audioRes.ok) return NextResponse.json({ error: 'Не удалось скачать запись' }, { status: 422 });

        const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
        const s3Key = `calls/${id}.mp3`;

        await s3.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            Body: audioBuffer,
            ContentType: 'audio/mpeg',
        }));

        audioUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }),
            { expiresIn: 3600 }
        );
    } else {
        const filePath = path.join(process.cwd(), 'public', 'records', path.basename(id));
        if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });

        const fileBuffer = fs.readFileSync(filePath);
        const s3Key = `calls/${path.basename(id)}`;

        await s3.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            Body: fileBuffer,
            ContentType: 'MP3',
        }));

        audioUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }),
            { expiresIn: 3600 }
        );
    }

    const sttRes = await fetch(
        'https://transcribe.api.cloud.yandex.net/speech/stt/v2/longRunningRecognize',
        {
            method: 'POST',
            headers: { Authorization: `Api-Key ${API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                config: { specification: { languageCode: 'ru-RU', audioEncoding: 'MP3' } },
                audio: { uri: audioUrl },
            }),
        }
    );
    const sttData = await sttRes.json();
    if (!sttData.id) return NextResponse.json({ error: 'Ошибка запуска транскрипции', sttData }, { status: 422 });

    let transcript: string;
    try {
        transcript = await pollOperation(sttData.id);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 422 });
    }

    if (!transcript) return NextResponse.json({ error: 'Транскрипт пустой' }, { status: 422 });

    const prompt = `Ты — опытный тренер по продажам. Проанализируй транскрипцию звонка менеджера с клиентом.

Транскрипция:
"""
${transcript}
"""

Верни ответ строго в JSON без markdown-обёртки:
{
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

    let parsed: { strong_points?: string[]; weak_points?: string[]; recommendations?: string[] } = {};
    try { parsed = JSON.parse(cleaned); } catch { parsed = {}; }

    const analysis = {
        recording_id:    id,
        transcript,
        strong_points:   parsed.strong_points   ?? [],
        weak_points:     parsed.weak_points     ?? [],
        recommendations: parsed.recommendations ?? [],
    };

    await pool.query(
        `INSERT INTO call_analyses (recording_id, transcript, strong_points, weak_points, recommendations)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (recording_id) DO UPDATE
             SET transcript=$2, strong_points=$3, weak_points=$4, recommendations=$5`,
        [id, transcript,
            JSON.stringify(analysis.strong_points),
            JSON.stringify(analysis.weak_points),
            JSON.stringify(analysis.recommendations)]
    );

    return NextResponse.json({ analysis });
}
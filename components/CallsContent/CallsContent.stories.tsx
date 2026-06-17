import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import CallsContent from './CallsContent';

const meta: Meta<typeof CallsContent> = {
    title: 'Components/CallsContent',
    component: CallsContent,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CallsContent>;

const FILENAMES = [
    '1778645276.241636-2026-05-13-04_08-79064787930-.mp3',
    '1778836252.287219-2026-05-15-09_11-+79218258043-s.mp3',
    '1779002188.311757-2026-05-17-07_16-+79125142675-s.mp3',
    '1779096114.329349-2026-05-18-09_22-+79066674807-s.mp3',
    '1779277031.369608-2026-05-20-11_37-79092545519-.mp3',
];

const mockAnalysis = (filename: string) => ({
    recording_id: filename,
    transcript: 'Добрый день! Меня зовут Алексей, я звоню из компании... [транскрипция звонка]',
    strong_points: ['Вежливое приветствие', 'Чёткое представление компании', 'Выявление потребностей'],
    weak_points: ['Не предложил дополнительные услуги', 'Затянутое завершение звонка'],
    recommendations: ['Использовать технику SPIN при выявлении потребностей', 'Сократить паузы при работе с возражениями'],
});

function makeFetch(analysesMap: Record<string, object>) {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/api/calls/analyze') && (!init?.method || init.method === 'GET')) {
            return new Response(JSON.stringify({ analyses: analysesMap }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        if (url.includes('/api/calls/analyze') && init?.method === 'POST') {
            const body = JSON.parse(init.body as string);
            return new Response(JSON.stringify({ analysis: mockAnalysis(body.id) }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
}

export const NoAnalyses: Story = {
    beforeEach() { global.fetch = makeFetch({}) as typeof fetch; },
};

export const WithAnalyses: Story = {
    beforeEach() {
        global.fetch = makeFetch({
            [FILENAMES[0]]: mockAnalysis(FILENAMES[0]),
            [FILENAMES[2]]: mockAnalysis(FILENAMES[2]),
        }) as typeof fetch;
    },
};

export const WithRealData: Story = {
    beforeEach() {
        const original = global.fetch;
        global.fetch = async (input, init) => {
            try { return await original(input, init); }
            catch { return new Response(JSON.stringify({ analyses: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
        };
    },
};
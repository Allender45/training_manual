'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useUserStore } from '@/store';
import Avatar from '@/components/Avatar/Avatar';

export interface CallCardResult {
    success: boolean;
    comment: string;
    elapsed: number;
}

export interface CallCardTrainerProps {
    onComplete?: (result: CallCardResult) => void;
}

export default function CallCardTrainer({ onComplete }: CallCardTrainerProps) {
    const { user } = useUserStore();
    const [elapsed, setElapsed] = useState(0);
    const [step1Done, setStep1Done] = useState(false);
    const [comment, setComment] = useState('');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('/records/trainers/ansvering_call.mp3');
        return () => {
            audioRef.current?.pause();
            audioRef.current = null;
        };
    }, []);

    function handleStep1Click() {
        setStep1Done(true);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
        }
    }

    const renderTime = useMemo(() =>
            new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        , []);

    useEffect(() => {
        const timer = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    function formatElapsed(sec: number) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    const canSubmit = step1Done && comment.trim().length > 0;

    function handleSubmit() {
        if (!canSubmit) return;
        onComplete?.({ success: true, comment: comment.trim(), elapsed });
    }

    return (
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 shadow-sm">

            {/* Шаг 1 — клик по иконке */}
            <div
                onClick={handleStep1Click}
                onKeyDown={e => e.key === 'Enter' && handleStep1Click()}
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition
                    ${step1Done
                    ? 'bg-green-100 text-green-600 ring-2 ring-green-400'
                    : 'bg-gray-100 text-green-500 hover:bg-gray-200'}`}
                title="Входящий пропущенный звонок"
                role="button"
                tabIndex={0}
                aria-label="Инициировать исходящий вызов"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19"
                     fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
                    <path d="M12.2 1.8v4.8H17M17.8 1l-5.6 5.6M17 13.74v2.4a1.6 1.6 0 01-1.74 1.6 15.83 15.83 0 01-6.9-2.46 15.6 15.6 0 01-4.8-4.8A15.83 15.83 0 011.1 3.54 1.6 1.6 0 012.69 1.8h2.4c.8 0 1.49.58 1.6 1.38.1.76.29 1.52.56 2.24a1.6 1.6 0 01-.36 1.7l-1.02 1c1.14 2.01 2.8 3.67 4.8 4.8l1.02-1a1.6 1.6 0 011.69-.37c.72.27 1.48.46 2.24.56.8.12 1.4.81 1.38 1.63z" />
                </svg>
            </div>

            {/* Клиент */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900 cursor-pointer">+7 963 004-05-55</p>
                    <a href="https://wa.me/+79630040555" title="Связаться по WhatsApp"
                       target="_blank" rel="noreferrer" className="text-green-500 hover:text-green-600 text-sm">
                        <i className="fab fa-whatsapp" />
                    </a>
                    <a href="https://t.me/+79630040555" title="Связаться по Telegram"
                       target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600 text-sm">
                        <i className="fab fa-telegram" />
                    </a>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Новый клиент</p>
            </div>

            {/* Менеджер и город */}
            <div className="flex flex-col text-sm flex-shrink-0">
                <div className="flex items-center gap-1.5">
                    <Avatar size="xs" fallback={user?.first_name?.trim()?.[0] ?? ''}
                            color="bg-blue-600 text-white" className="font-bold flex-shrink-0"/>
                    <span className="text-gray-800 font-medium text-sm">{user?.first_name} {user?.last_name}</span>
                </div>
                <span className="text-xs text-gray-500 font-normal mt-0.5">Курган (+2ч)</span>
            </div>

            {/* Таймер */}
            <div className="text-sm flex-shrink-0 whitespace-nowrap">
                {formatElapsed(elapsed)}
            </div>

            {/* Шаг 2 — комментарий */}
            <div className="flex-shrink-0">
                <div className={`flex border-2 items-center gap-1.5 px-2 py-1.5 rounded-lg transition
                    ${comment.trim() ? 'border-green-400' : 'border-red-500'}`}>
                    <input
                        className="text-gray-700 text-xs outline-none bg-transparent"
                        placeholder="Пиши комментарий, ставь цену"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    />
                </div>
            </div>

            {/* Управление */}
            <div className="flex items-center gap-1 flex-shrink-0">

                {/* Шаг 3 — кнопка завершения */}
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`p-1.5 rounded-lg transition
                        ${canSubmit
                        ? 'text-green-600 hover:bg-green-50 cursor-pointer'
                        : 'text-gray-300 cursor-not-allowed'}`}
                    title="Составить заявку"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="18" viewBox="0 0 19 18" fill="currentColor">
                        <path stroke="none" transform="translate(-9 -9)"
                              d="M25.364 17.244a.818.818 0 0 1 1.636 0v.761a9 9 0 1 1-5.337-8.225.818.818 0 1 1-.666 1.494 7.364 7.364 0 1 0 4.367 6.73v-.76zm-7.277 1.24l8.503-8.421a.832.832 0 0 1 1.168 0 .813.813 0 0 1 0 1.157l-9.087 9a.832.832 0 0 1-1.168 0l-2.478-2.455a.813.813 0 0 1 0-1.157.832.832 0 0 1 1.168 0l1.894 1.876z" />
                    </svg>
                </button>

                <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition" title="В спам!">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                        <g fill="none" fillRule="evenodd" transform="translate(1 1)">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6"
                                  d="M4.688 0h6.624L16 4.688v6.624L11.312 16H4.688L0 11.312V4.688zM8 4.8V8" />
                            <circle cx="8" cy="11.2" r="1" fill="currentColor" fillRule="nonzero" />
                        </g>
                    </svg>
                </button>

                <strong className="text-xs font-bold text-gray-700 px-1">{renderTime}</strong>

                <button className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition" title="Создать задачу">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        <line x1="12" y1="11" x2="12" y2="17" />
                        <line x1="9" y1="14" x2="15" y2="14" />
                    </svg>
                </button>
            </div>

        </div>
    );
}
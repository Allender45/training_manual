'use client';

import { useRef, useState } from 'react';
import { Mic, Square, Trash2, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

type VoiceTextAnswerProps = {
    value: string;
    audioUrl: string | null;
    onChange: (text: string) => void;
    onAudioChange: (url: string | null) => void;
    disabled?: boolean;
};

export default function VoiceTextAnswer({ value, audioUrl, onChange, onAudioChange, disabled }: VoiceTextAnswerProps) {
    const speech = useSpeechRecognition();
    const [recording, setRecording] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    async function startRecording() {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];
            recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                await uploadAudio(blob);
            };
            recorderRef.current = recorder;
            recorder.start();
            setRecording(true);

            if (speech.supported) {
                speech.start(text => onChange(value ? `${value} ${text}` : text));
            }
        } catch {
            setError('Нет доступа к микрофону');
        }
    }

    function stopRecording() {
        recorderRef.current?.stop();
        speech.stop();
        setRecording(false);
    }

    async function uploadAudio(blob: Blob) {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', new File([blob], `voice_${Date.now()}.webm`, { type: blob.type }));
            const res = await fetch('/api/surveys/audio', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? 'Ошибка загрузки аудио'); return; }
            onAudioChange(data.url);
        } catch {
            setError('Ошибка соединения с сервером');
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="relative">
                <textarea
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-12 text-sm text-gray-800
                               focus:outline-none focus:ring-2 focus:ring-[#41A141]/30 focus:border-[#41A141]
                               disabled:bg-gray-50 min-h-[80px] resize-y"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="Ответ (можно надиктовать голосом)"
                    disabled={disabled}
                />
                {!disabled && (
                    <button
                        type="button"
                        onClick={recording ? stopRecording : startRecording}
                        disabled={uploading}
                        title={recording ? 'Остановить запись' : 'Надиктовать голосом'}
                        className={`absolute right-2 top-2 p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            recording
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {uploading ? <Loader2 size={16} className="animate-spin" />
                            : recording ? <Square size={16} />
                                : <Mic size={16} />}
                    </button>
                )}
            </div>

            {recording && (
                <p className="text-xs text-red-500">
                    Идёт запись{speech.supported ? ' — текст появится автоматически' : ' (распознавание недоступно в этом браузере)'}
                </p>
            )}

            {(error || speech.error) && (
                <p className="text-xs text-red-500">{error ?? speech.error}</p>
            )}

            {audioUrl && (
                <div className="flex items-center gap-2">
                    <audio controls src={audioUrl} className="h-8 flex-1 min-w-0" />
                    {!disabled && (
                        <button type="button" onClick={() => onAudioChange(null)}
                                title="Удалить запись"
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
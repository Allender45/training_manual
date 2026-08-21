'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type SpeechRecognitionResultItem = { transcript: string };
type SpeechRecognitionResult = { isFinal: boolean; 0: SpeechRecognitionResultItem };
type SpeechRecognitionEventLike = {
    resultIndex: number;
    results: { length: number; [index: number]: SpeechRecognitionResult };
};
type SpeechRecognitionLike = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
};

function createRecognition(): SpeechRecognitionLike | null {
    if (typeof window === 'undefined') return null;
    const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    return Ctor ? new Ctor() : null;
}

type UseSpeechRecognition = {
    supported: boolean;
    listening: boolean;
    error: string | null;
    start: (onText: (text: string) => void) => void;
    stop: () => void;
};

export function useSpeechRecognition(): UseSpeechRecognition {
    const [supported, setSupported] = useState(false);
    const [listening, setListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const onTextRef = useRef<(text: string) => void>(() => {});

    useEffect(() => {
        const recognition = createRecognition();
        if (!recognition) return;

        recognition.lang = 'ru-RU';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            let text = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) text += event.results[i][0].transcript;
            }
            if (text.trim()) onTextRef.current(text.trim());
        };

        recognition.onerror = (event) => {
            setError(
                event.error === 'not-allowed' ? 'Нет доступа к микрофону'
                    : event.error === 'no-speech' ? 'Речь не распознана — попробуйте ещё раз'
                        : 'Ошибка распознавания речи'
            );
            setListening(false);
        };

        recognition.onend = () => setListening(false);

        recognitionRef.current = recognition;
        setSupported(true);

        return () => {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            recognition.stop();
        };
    }, []);

    const start = useCallback((onText: (text: string) => void) => {
        const recognition = recognitionRef.current;
        if (!recognition || listening) return;
        onTextRef.current = onText;
        setError(null);
        try {
            recognition.start();
            setListening(true);
        } catch {
            // повторный start() во время работы бросает исключение — игнорируем
        }
    }, [listening]);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    return { supported, listening, error, start, stop };
}
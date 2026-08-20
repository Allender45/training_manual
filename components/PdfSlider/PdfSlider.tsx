'use client';

import dynamic from 'next/dynamic';

const PdfSliderClient = dynamic(() => import('@/components/PdfSliderClient/PdfSliderClient'), {
    ssr: false,
    loading: () => <div className="py-16 text-center text-sm text-gray-400">Загрузка презентации...</div>,
});

type PdfSliderProps = {
    src: string;
};

export default function PdfSlider(props: PdfSliderProps) {
    return <PdfSliderClient {...props} />;
}
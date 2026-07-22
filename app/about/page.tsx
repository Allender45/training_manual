'use client';

import {useState} from 'react';
import {
    Phone, Mail, Send, MessageCircle,
    ShieldCheck, Clock, Truck, Award,
    ChevronLeft, ChevronRight, Play, FileText,
} from 'lucide-react';

const ADVANTAGES = [
    {
        icon: ShieldCheck,
        title: 'Фиксированная стоимость',
        description: 'Вы всегда знаете, сколько заплатите, без скрытых платежей и поэтажных доплат.',
    },
    {
        icon: Clock,
        title: 'Приедем точно в срок',
        description: 'Ценим ваше время и гарантируем прибытие в оговоренные сроки.',
    },
    {
        icon: Truck,
        title: 'Работаем КРУГЛОСУТОЧНО',
        description: 'Вы можете нанять грузчиков в удобное для вас время, в том числе в праздничные и выходные дни.',
    },
    {
        icon: Award,
        title: 'Надёжные исполнители',
        description: 'Грузчики и разнорабочие имеют большой опыт и знают все нюансы работы любой масштабности и сложности.',
    },
];

const TABS = ['Аудиоотзывы', 'Видеоотзывы', 'Отзывы', 'Социальные сети'];

const TESTIMONIALS = [
    {name: 'Ирина (Квартирный переезд)', quote: 'С вашей компанией приятно работать, спасибо вам большое!'},
    {name: 'Людмила (Офисный переезд)', quote: 'Быстро управились, ничего не повредили. Рекомендую!'},
    {name: 'Андрей (Погрузка стройматериалов)', quote: 'Ребята приехали точно в срок, всё аккуратно и быстро.'},
];

const LETTERS = [
    {title: 'Благодарственное письмо', company: 'ООО «СтройФинанс»'},
    {title: 'Благодарственное письмо', company: 'ГК «ТрансКом»'},
];

export default function AboutPage() {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [activeSlide, setActiveSlide] = useState(0);

    return (
        <div className="min-h-screen bg-white">
            {/* Верхняя плашка */}
            <header className="border-b">
                <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
                    <a href="/about" className="flex items-center gap-2">
                        <img src="/raz_logo.png" alt="РАЗ! ГРУЗЧИКИ" className="h-10 object-contain"/>
                    </a>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <Phone size={16} className="text-[#fbb914]"/>
                            <div>
                                <div className="font-semibold text-gray-800">+7 (000) 000-00-00</div>
                                <div className="text-xs text-gray-400">Физическим лицам</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone size={16} className="text-[#fbb914]"/>
                            <div>
                                <div className="font-semibold text-gray-800">+7 (000) 000-00-00</div>
                                <div className="text-xs text-gray-400">Юридическим лицам</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail size={16} className="text-[#fbb914]"/>
                            <div>
                                <div className="font-semibold text-gray-800">info@raz-gruzchiki.ru</div>
                                <div className="text-xs text-gray-400">Работаем круглосуточно и без выходных</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-400">
                        <Send size={18} className="cursor-pointer hover:text-[#fbb914]"/>
                        <MessageCircle size={18} className="cursor-pointer hover:text-[#fbb914]"/>
                    </div>
                </div>
            </header>

            <main>
                {/* Хиро / преимущества */}
                <section className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center min-h-[320px]">
                        <Truck size={72} className="text-gray-300"/>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">Наши преимущества:</h1>
                        <div className="space-y-6">
                            {ADVANTAGES.map(({icon: Icon, title, description}) => (
                                <div key={title} className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#fff6e0] flex items-center justify-center shrink-0">
                                        <Icon size={22} className="text-[#fbb914]"/>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 uppercase text-sm mb-1">{title}</h3>
                                        <p className="text-sm text-gray-500">{description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Отзывы */}
                <section className="bg-gray-50 py-12">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Клиенты о нас</h2>

                        <div className="flex flex-wrap justify-center gap-3 mb-8">
                            {TABS.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        activeTab === tab
                                            ? 'bg-[#fbb914] text-white'
                                            : 'bg-white text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setActiveSlide(i => Math.max(0, i - 1))}
                                disabled={activeSlide === 0}
                                className="p-2 rounded-full bg-white shadow-sm disabled:opacity-40 shrink-0"
                            >
                                <ChevronLeft size={18}/>
                            </button>

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {TESTIMONIALS.slice(activeSlide, activeSlide + 3).map(t => (
                                    <div key={t.name} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#fff6e0] flex items-center justify-center shrink-0">
                                                <Play size={16} className="text-[#fbb914]"/>
                                            </div>
                                            <span className="font-medium text-gray-800 text-sm">{t.name}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">{t.quote}</p>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setActiveSlide(i => Math.min(TESTIMONIALS.length - 3, i + 1))}
                                disabled={activeSlide >= TESTIMONIALS.length - 3}
                                className="p-2 rounded-full bg-white shadow-sm disabled:opacity-40 shrink-0"
                            >
                                <ChevronRight size={18}/>
                            </button>
                        </div>

                        <div className="flex justify-center gap-2 mt-6">
                            {TESTIMONIALS.map((_, i) => (
                                <span
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${i === activeSlide ? 'bg-[#fbb914]' : 'bg-gray-300'}`}
                                />
                            ))}
                        </div>

                        <div className="flex justify-center mt-8">
                            <button className="bg-[#fbb914] text-white font-medium px-6 py-3 rounded-xl hover:bg-[#e2a610] transition-colors">
                                Оставить отзыв
                            </button>
                        </div>
                    </div>
                </section>

                {/* Благодарственные письма */}
                <section className="max-w-6xl mx-auto px-4 py-12">
                    <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Благодарственные письма</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {LETTERS.map(l => (
                            <div key={l.company} className="bg-gray-50 rounded-2xl border p-8 flex flex-col items-center gap-3 min-h-[280px] justify-center">
                                <FileText size={40} className="text-gray-300"/>
                                <div className="text-center">
                                    <div className="font-semibold text-gray-700">{l.title}</div>
                                    <div className="text-sm text-gray-400">{l.company}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
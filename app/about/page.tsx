'use client';

import {useState, useEffect} from 'react';
import {Phone, Menu, X, MapPin, Users, Star, Clock, Shield, Smile, Briefcase} from 'lucide-react';

const NAV_ITEMS = [
    {label: 'О нас', href: '#about'},
    {label: 'Преимущества', href: '#benefits'},
    {label: 'Корпоративная жизнь', href: '#corporate'},
    {label: 'Контакты', href: '#contacts'},
];

const ADVANTAGES = [
    {
        icon: Shield,
        title: 'Официальное трудоустройство',
        description: 'Работаем по Трудовому кодексу РФ. Белая зарплата, отпуск, больничный.',
    },
    {
        icon: Star,
        title: 'Стабильная зарплата',
        description: 'Еженедельные выплаты, прозрачная система начисления без задержек.',
    },
    {
        icon: Clock,
        title: 'Удобный график',
        description: 'Гибкое расписание, подходящее для совмещения с учёбой и другими делами.',
    },
    {
        icon: Users,
        title: 'Дружный коллектив',
        description: 'Молодая и активная команда, корпоративные мероприятия, поддержка на старте.',
    },
    {
        icon: Smile,
        title: 'Карьерный рост',
        description: 'Мы растим лидеров внутри компании. Начни с линейной позиции — вырасти до руководителя.',
    },
    {
        icon: MapPin,
        title: 'Работа в вашем городе',
        description: 'Присутствуем в Тюмени и Кургане. Нет необходимости переезжать.',
    },
];

const CORPORATE_ITEMS = [
    {emoji: '🎉', title: 'Корпоративы', desc: 'Регулярные совместные мероприятия и праздники'},
    {emoji: '🏆', title: 'Конкурсы', desc: 'Соревнования и награждения лучших сотрудников'},
    {emoji: '📚', title: 'Обучение', desc: 'Тренинги, семинары и внутренние курсы'},
    {emoji: '🤝', title: 'Наставничество', desc: 'Система наставников для быстрой адаптации'},
];

const CITIES = ['Тюмень', 'Курган'];

export default function AboutPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [form, setForm] = useState({name: '', phone: '', city: ''});
    const [sent, setSent] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        setSent(true);
    }

    function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 60;
        window.scrollTo({ top, behavior: 'smooth' });
        setMenuOpen(false);
    }

    return (
        <div className="min-h-screen bg-white">
            {/* ── Header / Nav ── */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 bg-[#f3f7f8] transition-shadow ${
                    scrolled ? 'shadow-md' : ''
                }`}
            >
                <div className="max-w-6xl mx-auto px-4 h-15 flex items-center justify-between">
                    <a href="#" className="flex items-center">
                        <img src="/raz_logo.png" alt="Раз!Грузчики" className="h-30 object-contain"/>
                    </a>

                    <nav className="hidden md:flex items-center gap-8">
                        {NAV_ITEMS.map(item => (
                            <a
                                key={item.label}
                                href={item.href}
                                onClick={(e) => handleNavClick(e, item.href)}
                                className="text-sm font-semibold text-gray-700 hover:text-[#d1a600] transition-colors"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    <button
                        className="md:hidden p-2 text-gray-700"
                        onClick={() => setMenuOpen(v => !v)}
                        aria-label="Меню"
                    >
                        {menuOpen ? <X size={24}/> : <Menu size={24}/>}
                    </button>
                </div>

                {menuOpen && (
                    <div className="md:hidden bg-[#f3f7f8] border-t border-gray-200 px-4 py-3 flex flex-col gap-3">
                        {NAV_ITEMS.map(item => (
                            <a
                                key={item.label}
                                href={item.href}
                                onClick={(e) => handleNavClick(e, item.href)}
                                className="text-sm font-semibold text-gray-700 hover:text-[#d1a600]"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>
                )}
            </header>

            <main className="pt-[60px]">
                {/* ── Hero / О нас ── */}
                <section id="about" className="bg-[#f3f7f8] py-16 md:py-24">
                    <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div>
                            <p className="text-[#d1a600] font-semibold text-sm uppercase tracking-wider mb-3">
                                Группа компаний
                            </p>
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-6">
                                Раз!<span className="text-[#fbb914]">Грузчики</span>
                            </h1>
                            <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                Федеральная сеть грузовых услуг, работающая с 2015 года. Мы предоставляем
                                профессиональных грузчиков и разнорабочих для частных клиентов и бизнеса.
                                Официальное трудоустройство, стабильная зарплата, дружный коллектив.
                            </p>
                            <div className="grid grid-cols-3 gap-8">
                                {[
                                    {value: '2016', label: 'год основания'},
                                    {value: '242', label: 'города'},
                                    {value: '13', label: 'Филиалов в РФ и РК'},
                                    {value: '704 064', label: 'Грузчиков в системе'},
                                    {value: '362 263', label: 'Заказов в год'},
                                    {value: '12 572', label: 'Клиентов в месяц'},
                                ].map(stat => (
                                    <div key={stat.label}>
                                        <div className="text-3xl font-bold text-[#fbb914]">{stat.value}</div>
                                        <div className="text-sm text-gray-500">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <div
                                className="w-full rounded-2xl flex items-center justify-center overflow-hidden">
                                <img src="/about/1.webp" alt="" className="rounded-2xl object-contain"/>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── О нас ── */}
                <section className="bg-white py-16">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">
                            О нас
                        </h2>
                        <p className="text-gray-600 text-lg text-center mb-10 px-20">
                            Мы начали свой путь в 2016 году со скромного офисного кабинета 12 кв.м. У нас было несколько
                            сломанных ноутбуков и дикое желание развиваться. Прошли годы, мы открыли филиалы в
                            близлежащих регионах, далее стали работать во всех крупных городах России, подключили
                            дополнительные направления по строительной спецтехнике и квалифицированному персоналу,
                            запустили работу в Казахстане и сейчас нам становится тесно в текущих 900 кв.м. Мы не
                            планируем останавливаться на достигнутом и идем вперед. Поэтому наши двери всегда открыты
                            для амбициозных и уверенных в себе!
                        </p>
                    </div>
                </section>

                {/* ── Факты ── */}
                <section className="bg-white py-16">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-10">Факты</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[
                                {
                                    img: '/about/2.webp',
                                    value: '295 920₽',
                                    desc: 'Рекордная зарплата менеджера за октябрь 2024',
                                },
                                {
                                    img: '/about/3.webp',
                                    value: '74 000₽',
                                    desc: 'Средняя заработная плата менеджера',
                                },
                                {
                                    img: '/about/4.webp',
                                    value: '150 Менеджеров',
                                    desc: 'Работает прямо сейчас',
                                },
                                {
                                    img: '/about/5.webp',
                                    value: 'через 35 минут',
                                    desc: 'после приема заявки грузчики приступят к работе в любом городе России и Казахстана',
                                },
                            ].map(card => (
                                <div className="relative bg-[#f3f7f8] rounded-2xl overflow-hidden">
                                    <div className="aspect-[4/3] overflow-hidden">
                                        <img src={card.img} alt="" className="w-full h-full object-cover"/>
                                    </div>
                                    <div className="p-4">
                                        <div className="text-xl font-bold text-gray-800 mb-1">{card.value}</div>
                                        <div className="text-sm text-gray-500 leading-relaxed">{card.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Плюсы ── */}
                <section id='benefits' className="bg-white py-16">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-10">Плюсы работы</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[
                                {n: 1, img: '/about/6.webp', desc: 'Работа с комфортом (современный офис с отличным оборудованием)'},
                                {n: 2, img: '/about/7.webp', desc: 'Молодая компания без бюрократии'},
                                {n: 3, img: '/about/8.webp', desc: 'Достойная оплата (даже без опыта)'},
                                {n: 4, img: '/about/9.webp', desc: 'Оплачиваемое обучение / подъёмные выплаты для начинающих менеджеров'},
                                {n: 5, img: '/about/10.webp', desc: 'Корпоративная связь'},
                                {n: 6, img: '/about/11.webp', desc: 'Работа с входящим потоком клиентов (никаких холодных звонков)'},
                                {n: 7, img: '/about/12.webp', desc: 'Понятное и доступное обучение'},
                                {n: 8, img: '/about/13.webp', desc: 'Высокий уровень автоматизации работы'},
                                {n: 9, img: '/about/14.webp', desc: 'Отсутствие разъездов и командировок'},
                            ].map(card => (
                                <div key={card.n} className="relative bg-[#f3f7f8] rounded-2xl overflow-hidden">
                                    <div className="absolute top-3 left-3 w-7 h-7 bg-[#fbb914] rounded-full flex items-center justify-center text-white text-xs font-bold z-10">
                                        {card.n}
                                    </div>
                                    <div className="aspect-[16/9] overflow-hidden">
                                        <img src={card.img} alt="" className="w-full h-full object-cover"/>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm text-gray-700 leading-relaxed">{card.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Преимущества ── */}
                <section className="bg-white py-16">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">
                            Почему стоит работать у нас?
                        </h2>
                        <p className="text-gray-500 text-center mb-10">
                            Мы создаём условия для комфортной и продуктивной работы
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {ADVANTAGES.map(({icon: Icon, title, description}) => (
                                <div
                                    key={title}
                                    className="flex gap-4 p-5 rounded-2xl bg-[#f3f7f8] hover:shadow-sm transition-shadow"
                                >
                                    <div
                                        className="w-11 h-11 rounded-full bg-[#fff6e0] flex items-center justify-center shrink-0">
                                        <Icon size={20} className="text-[#fbb914]"/>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-1 text-sm">{title}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Корпоративная жизнь ── */}
                <section id="corporate" className="bg-[#f3f7f8] py-16">
                    <div className="max-w-6xl mx-auto px-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">
                            Корпоративная жизнь
                        </h2>
                        <p className="text-gray-500 text-center mb-10">
                            Работа — это не только задачи, но и живое общение
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                            {CORPORATE_ITEMS.map(item => (
                                <div
                                    key={item.title}
                                    className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="text-4xl mb-3">{item.emoji}</div>
                                    <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['/about/16.jpg', '/about/19.webp', '/about/17.png', '/about/18.webp'].map(i => (
                                <div
                                    key={i}
                                    className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs"
                                >
                                    <img src={i} alt="" className="w-full h-full object-cover rounded-xl"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Контакты + форма ── */}
                <section id="contacts" className="bg-white py-16">
                    <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="bg-[#f3f7f8] rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Оставить заявку</h2>
                            {sent ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3">✅</div>
                                    <p className="font-semibold text-gray-800">Заявка отправлена!</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Мы свяжемся с вами в ближайшее время.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Введите ваше имя
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={e => setForm(f => ({...f, name: e.target.value}))}
                                            className="w-full border border-[#afaba4] rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fbb914]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Введите ваш телефон
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={form.phone}
                                            onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                                            className="w-full border border-[#afaba4] rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#fbb914]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-2">
                                            В каком городе вы хотели бы работать?
                                        </label>
                                        <div className="flex gap-6">
                                            {CITIES.map(c => (
                                                <label key={c} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="city"
                                                        value={c}
                                                        required
                                                        checked={form.city === c}
                                                        onChange={() => setForm(f => ({...f, city: c}))}
                                                        className="accent-[#fbb914]"
                                                    />
                                                    <span className="text-sm text-gray-700">{c}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-[#ffd433] hover:bg-[#fbb914] text-gray-900 font-semibold py-3 rounded-lg transition-colors text-sm cursor-pointer"
                                    >
                                        Отправить заявку
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="flex flex-col justify-center gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Контакты</h2>
                                <p className="text-gray-500">
                                    Или свяжитесь с нами напрямую — мы всегда рады ответить на вопросы.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full bg-[#fff6e0] flex items-center justify-center shrink-0">
                                        <Phone size={18} className="text-[#fbb914]"/>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800">8 (963) 008-45-32</div>
                                        <div className="text-sm text-gray-500">
                                            Руководитель HR отдела — Анастасия
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full bg-[#fff6e0] flex items-center justify-center shrink-0">
                                        <MapPin size={18} className="text-[#fbb914]"/>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800">Тюмень и Курган</div>
                                        <div className="text-sm text-gray-500">Работаем в обоих городах</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full bg-[#fff6e0] flex items-center justify-center shrink-0">
                                        <Briefcase size={18} className="text-[#fbb914]"/>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800">Круглосуточно</div>
                                        <div className="text-sm text-gray-500">Принимаем заявки без выходных</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className="bg-[#f3f7f8]">
                <div className="max-w-6xl mx-auto px-4">
                    <img src="/raz_logo.png" alt="Раз!Грузчики" className="h-30 object-contain"/>
                </div>
            </footer>
        </div>
    );
}
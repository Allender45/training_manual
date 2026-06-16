'use client';

import Image from "next/image";
import {Header, Sidebar} from "@/containers";
import {useState} from "react";

export default function CallsRequests() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} mobileMenuOpen={mobileMenuOpen}
                        setMobileMenuOpen={setMobileMenuOpen}/>
                <main className="bg-white rounded-2xl shadow-sm p-6 m-6">
                    <h1 className={'text-2xl font-bold mb-4 text-center'}>Рейтинг</h1>

                    <Image
                        src="/functionalImages/rating1.png"
                        alt="АТС"
                        width={800}
                        height={600}
                    />

                    <p className={'pb-4'}>Ваша зарплата состоит из двух основных частей: фиксированного оклада и процента от продаж.
                        Фиксированный оклад — это стабильная часть дохода, которая выплачивается ежемесячно.
                        Кроме того, у вас есть гарантия минимального процента от продаж — это дополнительная сумма,
                        которая начисляется даже в том случае, если вы не выполнили план по KPI. Она обеспечивает
                        стабильный доход на старте.
                    </p>

                    <p>В первые три месяца работы действует особое условие: минимальный гарантированный процент от
                        продаж составляет 14 %.</p>
                    <p className={'pb-4'}>Это значит, что независимо от результатов вы получите как минимум 14 % сверх оклада. Это сделано
                        для того, чтобы вы могли спокойно адаптироваться, изучить процессы и начать наращивать
                        показатели без лишнего стресса».</p>

                    <div className={'text-center pb-4'}>
                        <p>Общая касса : ≥ 200 000 в месяц.</p>
                        <p>Выполнено от обращений : ≥ 22%</p>
                        <p>Касса от новых ≥ 100 000 в месяц.</p>
                    </div>

                    <p>Чтобы увеличить процент от продаж, нужно выполнить ключевые показатели эффективности, или KPI, за каждый выполненый показатель тебе к минимальному проценту добовляется 4%</p>
                    <p>«При полном выполнении KPI ваш процент от продаж может вырасти до 22 %. Точная цифра зависит от конкретных результатов и политики компании в текущем периоде.</p>
                    <p>Таким образом, ваша итоговая зарплата = оклад + процент от продаж (от 10 % до 22 %, в зависимости от выполнения KPI)».</p>
                </main>
            </div>
        </div>
    );
}
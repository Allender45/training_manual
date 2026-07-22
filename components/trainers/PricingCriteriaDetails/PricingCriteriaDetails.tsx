export default function PricingCriteriaDetails() {
    return (
        <details className="rounded-xl border border-gray-200 overflow-hidden">
            <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-50 transition-colors [list-style:none] flex items-center justify-between">
                <span>📋 Критерии изменения цены</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 transition-transform details-open:rotate-180"><polyline points="6 9 12 15 18 9"/></svg>
            </summary>
            <div className="px-4 pb-4 pt-2 text-sm text-gray-600 flex flex-col gap-4 border-t border-gray-100 max-h-[300px] overflow-y-auto">
                <div>
                    <p className="font-semibold text-gray-700 mb-2">Критерии для поднятия цены грузчиков:</p>
                    <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                        <li>Стройматериалы (от 20 кг/ед): +75 ₽/час к стартовой цене</li>
                        <li>Подъём по лестнице выше 3 этажа: +75 ₽/час к стартовой цене</li>
                        <li>Подъём по лестнице выше 6 этажа: +150 ₽/час к стартовой цене</li>
                        <li>Грязная работа: +75 ₽/час к стартовой цене</li>
                        <li>Сборка/разборка: +75–150 ₽ в зависимости от сложности (либо сдельная оплата)</li>
                        <li>Вечернее время после 19:00: +75 ₽/час к стартовой цене</li>
                        <li>Такелажные работы: +75–150 ₽/час в зависимости от сложности (либо сдельная оплата)</li>
                        <li>Работа за пределами черты города: +75 ₽/час к стартовой цене</li>
                        <li>Если время работы не превысит 15 минут: −75 ₽ от стартовой цены</li>
                        <li>Работа на полный день: −75–150 ₽ от стартовой цены</li>
                    </ol>
                </div>
                <div>
                    <p className="font-semibold text-gray-700 mb-2">Критерии для поднятия цены на услуги транспорта (газели):</p>
                    <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                        <li>Вечернее время после 18:00: +100–200 ₽/час</li>
                        <li>Погодные условия, мешающие работе транспорта (снегопад, град, ливни, сильная жара): +100–200 ₽/час</li>
                        <li>Заезды на дополнительные точки: +100 ₽ за адрес</li>
                        <li>Удалённость адресов друг от друга (с правого берега на левый и т.д.): +100–200 ₽/час</li>
                        <li>Выезд за город: 50 ₽/км (оплачивается только в одну сторону)</li>
                        <li>Газель без грузчиков по городу: продаём на 200–300 ₽ выше стоимости ЦРМ</li>
                    </ol>
                </div>
            </div>
        </details>
    );
}

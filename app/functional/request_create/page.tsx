'use client';

import Image from "next/image";
import {Header, Sidebar} from "@/containers";
import {useState} from "react";

export default function RequestCreate() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} mobileMenuOpen={mobileMenuOpen}
                        setMobileMenuOpen={setMobileMenuOpen}/>
                <main className="bg-white rounded-2xl shadow-sm p-6 m-6">
                    <h1 className={'text-2xl font-bold mb-4 text-center'}>ПРИЁМ И СОСТАВЛЕНИЕ ЗАЯВКИ.</h1>

                    <p>При составлении заявки, в первую очередь вбиваем название города и номер телефона, с которого обращается заказчик. </p>

                    <Image
                        src="/functionalImages/createRequest1.png"
                        alt="АТС"
                        width={800}
                        height={600}
                    />

                    <p>Подробно описываем работы, которые необходимо произвести.</p>
                    <p>Указываем время проведения работ.</p>

                    <Image
                        src="/functionalImages/createRequest2.png"
                        alt="АТС"
                        width={800}
                        height={600}
                    />

                    <p>Указываем вид оплаты (нал/на карту/безнал), цену за час и количество человек, необходимых для проведения работ.</p>

                    <Image
                        src="/functionalImages/createRequest3.png"
                        alt="АТС"
                        width={800}
                        height={600}
                    />

                    <p>Записываем ПОДРОБНЫЙ адрес. Если не уверены, что название улицы написано правильно (послышался непонятный адрес или плохая связь) – то «спрашиваем» название улицы на YANDEX или GOOGLE.</p>
                    <p>Если заказчику требуются услуги автомобиля, оформляем заявку с указанием второго адреса. СОХРАНЯЕМ.</p>

                    <Image
                        src="/functionalImages/createRequest4.png"
                        alt="АТС"
                        width={800}
                        height={600}
                    />

                    <p className={'mt-4'}>Также в программе есть история последних поездок машин. Тут можно посмотреть актуальные цены, по которым водители работают по конкретному городу</p>
                </main>
            </div>
        </div>
    );
}
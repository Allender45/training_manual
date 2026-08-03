import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import AchievementToast from '@/components/AchievementToast/AchievementToast';

const inter = Inter({
    variable: "--font-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Портал стажировки чемпионов",
    description: "Создан с любовью и усердие, под принуждением )",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${inter.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                {children}
                <AchievementToast/>
            </body>
        </html>
    );
}

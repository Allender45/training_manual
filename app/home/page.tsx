'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import {Users, BookOpen, DollarSign, ChevronRight, Star, TrendingUp, CalendarDays} from 'lucide-react';
import {Header, Sidebar} from '@/containers';
import {StatCard} from "@/components";

const instructors = [
    { initials: 'AB', color: 'bg-blue-600', name: 'Sofnio', email: 'info@softnio.com', reviews: 25 },
    { initials: 'AL', color: 'bg-cyan-500', name: 'Ashley Lawson', email: 'ashley@softnio.com', reviews: 22 },
    { initials: 'JM', color: 'bg-green-500', name: 'Jane Montgomery', email: 'jane84@example.com', reviews: 19 },
    { initials: 'LH', color: 'bg-gray-500', name: 'Larry Henry', email: 'larry108@example.com', reviews: 24 },
    { initials: 'LH', color: 'bg-gray-500', name: 'Larry Henry', email: 'larry108@example.com', reviews: 24 },
];

const categories = [
    { initials: 'DM', color: 'bg-blue-600', name: 'Digital Marketing', courses: '16+ Courses' },
    { initials: 'WD', color: 'bg-cyan-500', name: 'Web Development', courses: '16+ Courses' },
    { initials: 'UX', color: 'bg-green-500', name: 'UI/UX Design', courses: '16+ Courses' },
    { initials: 'GD', color: 'bg-gray-500', name: 'Graphic Design', courses: '16+ Courses' },
];

type AdaptationInfo = {
    id: number;
    started_at: string;
    plan_name: string | null;
    plan_calls: number | null;
    plan_conversion: number | null;
    plan_revenue_new: number | null;
    plan_revenue_total: number | null;
};

function fmtDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function addMonths(dateStr: string, months: number): Date {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d;
}

export default function HomePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const { user, fetchUser } = useUserStore();
    const [adaptation, setAdaptation] = useState<AdaptationInfo | null>(null);

    useEffect(() => {
        fetchUser(() => router.push('/login'));
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        fetch(`/api/adaptations/${user.id}`)
            .then(r => r.json())
            .then(d => setAdaptation(d.adaptation))
    }, [user?.id]);

    const endDate = adaptation ? addMonths(adaptation.started_at, 3) : null;

    const daysLeft = endDate
        ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86_400_000))
        : 0;

    return (
        <div className="flex min-h-screen bg-gray-100">

            <Sidebar
                sidebarOpen={sidebarOpen}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />

            {/* Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <Header
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                />

                {/* Main Content */}
                <main className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
                        <h3 className="text-xl font-semibold text-gray-800">Dashboard</h3>
                    </div>

                    <div className="flex flex-wrap gap-5">

                        {/* Stats Cards */}
                        <div className="w-full lg:w-56 space-y-4 flex-shrink-0">
                            {([
                                { label: 'Total Students', value: '10,689', icon: Users, color: 'bg-purple-100 text-purple-600' },
                                { label: 'Total Courses', value: '405', icon: BookOpen, color: 'bg-red-100 text-red-500' },
                                { label: 'Overall Revenue', value: '₹64,364', icon: DollarSign, color: 'bg-green-100 text-green-600' },
                            ] as const).map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="bg-white rounded-xl shadow-sm p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-500">{label}</p>
                                            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                This month{' '}
                                                <span className="text-green-500 font-medium inline-flex items-center gap-0.5">
                                                    <TrendingUp size={11} /> 8.5%
                                                </span>
                                            </p>
                                        </div>
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                                            <Icon size={20} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {adaptation && (
                            <StatCard
                                label={`Стажировка с ${fmtDate(adaptation.started_at)}`}
                                value={`${daysLeft} дней`}
                                sub={`Дата окончания — ${fmtDate(endDate!)}`}
                                icon={CalendarDays}
                                color="bg-blue-100 text-blue-600"
                            />
                        )}

                        {/* Traffic Sources */}
                        <div className="flex-1 min-w-[280px]">
                            <div className="bg-white rounded-xl shadow-sm p-4 h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="font-semibold text-gray-800">Traffic Sources</h5>
                                    <select className="text-sm text-gray-400 outline-none bg-transparent border-0">
                                        <option>30 days</option>
                                        <option>15 days</option>
                                    </select>
                                </div>
                                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300 text-sm">
                                    Chart placeholder
                                </div>
                                <table className="w-full mt-4 text-sm">
                                    <tbody>
                                        {[
                                            { label: 'Organic Search', value: '4,305' },
                                            { label: 'Referrals', value: '482' },
                                            { label: 'Social Media', value: '859' },
                                        ].map(({ label, value }) => (
                                            <tr key={label}>
                                                <td className="py-1 text-gray-500">{label}</td>
                                                <td className="py-1 font-medium text-gray-800">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Instructors */}
                        <div className="w-full lg:w-72 flex-shrink-0">
                            <div className="bg-white rounded-xl shadow-sm">
                                <div className="flex justify-between items-center px-4 py-3 border-b">
                                    <h5 className="font-semibold text-gray-800">Top Instructors</h5>
                                    <a href="#" className="text-sm text-gray-400 hover:text-gray-600">View All</a>
                                </div>
                                <ul className="divide-y">
                                    {instructors.map((inst, i) => (
                                        <li key={i} className="flex items-center gap-3 px-4 py-3">
                                            <div className={`w-9 h-9 rounded-full ${inst.color} text-white flex items-center justify-center text-sm font-medium flex-shrink-0`}>
                                                {inst.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{inst.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{inst.email}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="flex text-yellow-400">
                                                    {Array.from({ length: 5 }).map((_, j) => (
                                                        <Star key={j} size={12} fill="currentColor" />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-gray-400">{inst.reviews} Reviews</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Conversions Chart */}
                        <div className="w-full lg:flex-1 min-w-[280px]">
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="font-semibold text-gray-800">Conversions</h5>
                                    <select className="text-sm text-gray-400 outline-none bg-transparent border-0">
                                        <option>30 days</option>
                                        <option>15 days</option>
                                    </select>
                                </div>
                                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300 text-sm">
                                    Bar chart placeholder
                                </div>
                            </div>
                        </div>

                        {/* Top Categories */}
                        <div className="w-full lg:w-72 flex-shrink-0">
                            <div className="bg-white rounded-xl shadow-sm">
                                <div className="flex justify-between items-center px-4 py-3 border-b">
                                    <h5 className="font-semibold text-gray-800">Top Categories</h5>
                                    <a href="#" className="text-sm text-gray-400 hover:text-gray-600">View All</a>
                                </div>
                                <ul className="divide-y">
                                    {categories.map((cat, i) => (
                                        <li key={i} className="flex items-center gap-3 px-4 py-3">
                                            <div className={`w-9 h-9 rounded-full ${cat.color} text-white flex items-center justify-center text-sm font-medium flex-shrink-0`}>
                                                {cat.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                                                <p className="text-xs text-gray-400">{cat.courses}</p>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                    </div>
                </main>

            </div>
        </div>
    );
}

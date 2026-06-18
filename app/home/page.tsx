'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useUserStore} from '@/store';
import {Star, CalendarDays} from 'lucide-react';
import {Header, Sidebar} from '@/containers';
import {StatCard, MentorChart, InternStatsWidget, InternProgressWidget} from "@/components";
import {hasFeature} from "@/lib/permissions";

const instructors = [
    {initials: 'AB', color: 'bg-blue-600', name: 'Sofnio', email: 'info@softnio.com', reviews: 25},
    {initials: 'AL', color: 'bg-cyan-500', name: 'Ashley Lawson', email: 'ashley@softnio.com', reviews: 22},
    {initials: 'JM', color: 'bg-green-500', name: 'Jane Montgomery', email: 'jane84@example.com', reviews: 19},
    {initials: 'LH', color: 'bg-gray-500', name: 'Larry Henry', email: 'larry108@example.com', reviews: 24},
    {initials: 'LH', color: 'bg-gray-500', name: 'Larry Henry', email: 'larry108@example.com', reviews: 24},
];

const categories = [
    {initials: 'DM', color: 'bg-blue-600', name: 'Digital Marketing', courses: '16+ Courses'},
    {initials: 'WD', color: 'bg-cyan-500', name: 'Web Development', courses: '16+ Courses'},
    {initials: 'UX', color: 'bg-green-500', name: 'UI/UX Design', courses: '16+ Courses'},
    {initials: 'GD', color: 'bg-gray-500', name: 'Graphic Design', courses: '16+ Courses'},
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
    return new Date(date).toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric'});
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
    const {user, fetchUser} = useUserStore();
    const [adaptation, setAdaptation] = useState<AdaptationInfo | null>(null);
    const rid = user?.role_id ?? null;

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

                        {hasFeature(rid, 'mentorWidgets') &&
                            <>
                                <div className="w-full lg:w-56 flex-shrink-0">
                                    <InternStatsWidget/>
                                </div>

                                <div className="w-full lg:w-72 flex-shrink-0">
                                    <InternProgressWidget/>
                                </div>

                                <div className="w-full">
                                    <MentorChart/>
                                </div>
                            </>
                        }

                        {adaptation && (
                            <StatCard
                                label={`Стажировка с ${fmtDate(adaptation.started_at)}`}
                                value={`${daysLeft} дней`}
                                sub={`Дата окончания — ${fmtDate(endDate!)}`}
                                icon={CalendarDays}
                                color="bg-blue-100 text-blue-600"
                            />
                        )}
                    </div>
                </main>

            </div>
        </div>
    );
}

import React from 'react';
import { LucideIcon } from 'lucide-react';

type StatCardProps = {
    label: string;
    value: string;
    sub?: string;
    subClass?: string;
    bgColor?: string;
    icon: LucideIcon;
    color: string;
};

export default function StatCard({ label, value, sub, icon: Icon, color, subClass, bgColor='bg-white' }: StatCardProps) {
    return (
        <div className={`${bgColor} rounded-xl shadow-sm p-4 w-full sm:w-56`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                    {sub && <p className={`text-xs text-gray-400 mt-1 ${subClass}`}>{sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
}
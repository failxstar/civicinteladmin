'use client';

import { StatsCards } from '@/components/Dashboard/StatsCards';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';
import { DepartmentWorkload } from '@/components/Dashboard/DepartmentWorkload';

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-gray-500 mt-1">
                    Real-time analytics and system overview
                </p>
            </div>

            {/* Stats Cards */}
            <StatsCards />

            {/* Charts and Activity */}
            <div className="grid gap-6 md:grid-cols-2">
                <DepartmentWorkload />
                <RecentActivity />
            </div>
        </div>
    );
}

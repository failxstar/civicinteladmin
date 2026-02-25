'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, Report } from '@/services/api';
import {
    Building2,
    Users,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    BarChart3,
    Activity
} from 'lucide-react';

interface DepartmentStats {
    name: string;
    type: string;
    totalReports: number;
    pending: number;
    submitted: number;
    resolved: number;
    avgResponseTime: string;
    color: string;
}

export default function DepartmentsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [departments, setDepartments] = useState<DepartmentStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        const data = await apiService.getReports();
        setReports(data);
        calculateDepartmentStats(data);
        setLoading(false);
    };

    const calculateDepartmentStats = (allReports: Report[]) => {
        const deptMap = new Map<string, DepartmentStats>();

        // Department configurations
        const deptConfig: Record<string, { name: string; color: string }> = {
            road: { name: 'Roads & Infrastructure', color: 'bg-blue-500' },
            garbage: { name: 'Waste Management', color: 'bg-green-500' },
            water: { name: 'Water & Sanitation', color: 'bg-cyan-500' },
            streetlight: { name: 'Public Lighting', color: 'bg-yellow-500' },
            drainage: { name: 'Drainage & Sewage', color: 'bg-purple-500' },
            other: { name: 'General Services', color: 'bg-gray-500' },
        };

        // Initialize departments
        Object.entries(deptConfig).forEach(([type, config]) => {
            deptMap.set(type, {
                name: config.name,
                type: type,
                totalReports: 0,
                pending: 0,
                submitted: 0,
                resolved: 0,
                avgResponseTime: '0h',
                color: config.color,
            });
        });

        // Calculate stats
        allReports.forEach(report => {
            const type = report.type || 'other';
            const dept = deptMap.get(type);

            if (dept) {
                dept.totalReports++;
                if (report.status === 'pending') dept.pending++;
                if (report.status === 'submitted') dept.submitted++;
                if (report.status === 'resolved') dept.resolved++;
            }
        });

        setDepartments(Array.from(deptMap.values()).filter(d => d.totalReports > 0));
    };

    const getStatusPercentage = (count: number, total: number) => {
        return total > 0 ? Math.round((count / total) * 100) : 0;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading departments...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold mb-2">Departments</h1>
                <p className="text-gray-600">Monitor department workloads and performance</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Departments</p>
                            <p className="text-2xl font-bold mt-1">{departments.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Reports</p>
                            <p className="text-2xl font-bold mt-1">{reports.length}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Items</p>
                            <p className="text-2xl font-bold mt-1">
                                {reports.filter(r => r.status === 'pending').length}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Resolved</p>
                            <p className="text-2xl font-bold mt-1">
                                {reports.filter(r => r.status === 'resolved').length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Department Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                    <div key={dept.name} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Header with color accent */}
                        <div className={`${dept.color} h-2`}></div>

                        <div className="p-6">
                            {/* Department Name & Icon */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900">{dept.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {dept.totalReports} total reports
                                    </p>
                                </div>
                                <div className={`p-2 ${dept.color} bg-opacity-10 rounded-lg`}>
                                    <Activity className={`w-5 h-5 ${dept.color.replace('bg-', 'text-')}`} />
                                </div>
                            </div>

                            {/* Status Breakdown */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <span className="text-gray-600">Pending</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{dept.pending}</span>
                                        <span className="text-gray-400">
                                            ({getStatusPercentage(dept.pending, dept.totalReports)}%)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-gray-600">In Progress</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{dept.submitted}</span>
                                        <span className="text-gray-400">
                                            ({getStatusPercentage(dept.submitted, dept.totalReports)}%)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-gray-600">Resolved</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{dept.resolved}</span>
                                        <span className="text-gray-400">
                                            ({getStatusPercentage(dept.resolved, dept.totalReports)}%)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                    <span>Completion Rate</span>
                                    <span className="font-medium">
                                        {getStatusPercentage(dept.resolved, dept.totalReports)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${getStatusPercentage(dept.resolved, dept.totalReports)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => router.push(`/reports?department=${dept.type}`)}
                                className="w-full mt-4 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {departments.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Departments</h3>
                    <p className="text-gray-500">
                        Departments will appear here once reports are submitted
                    </p>
                </div>
            )}
        </div>
    );
}

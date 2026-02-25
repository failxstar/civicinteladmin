'use client';

import { useEffect, useState } from 'react';
import { apiService, Report } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

export function RecentActivity() {
    const [reports, setReports] = useState<Report[]>([]);

    useEffect(() => {
        const loadReports = async () => {
            const recent = await apiService.getRecentReports(5);
            setReports(recent);
        };

        loadReports();

        // Poll for updates every 5 seconds
        const interval = setInterval(loadReports, 5000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved':
                return 'bg-green-500';
            case 'submitted':
                return 'bg-blue-500';
            default:
                return 'bg-yellow-500';
        }
    };

    const formatTime = (date: Date | string) => {
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return formatDistanceToNow(dateObj, { addSuffix: true });
        } catch {
            return 'recently';
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-1">Recent Reports</h3>
            <p className="text-sm text-gray-500 mb-6">
                Latest submissions from citizens
            </p>

            <div className="space-y-4">
                {reports.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                        No reports yet. Submit a report from the citizen app to see it here!
                    </p>
                ) : (
                    reports.map((report) => (
                        <div
                            key={report.id}
                            className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0"
                        >
                            <div className={`mt-1 w-2 h-2 rounded-full ${getStatusColor(report.status)}`} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                    {report.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {report.ward} • {report.type}
                                </p>
                            </div>
                            <span className="text-xs text-gray-400">{formatTime(report.timestamp)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

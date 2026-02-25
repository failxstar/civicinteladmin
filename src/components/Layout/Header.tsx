'use client';

import { useState, useEffect } from 'react';
import { Bell, User, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';

export function Header() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        const reports = await apiService.getReports();
        // Get the 5 most recent reports
        const recentReports = reports
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5)
            .map(report => ({
                id: report.id,
                title: `New ${report.type} report`,
                description: report.title,
                status: report.status,
                time: new Date(report.timestamp).toLocaleTimeString(),
                date: new Date(report.timestamp).toLocaleDateString(),
            }));
        setNotifications(recentReports);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'resolved':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'submitted':
                return <Clock className="w-4 h-4 text-blue-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
            {/* Search bar placeholder */}
            <div className="flex-1 max-w-lg">
                <input
                    type="search"
                    placeholder="Search reports..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Bell className="w-5 h-5 text-gray-600" />
                        {notifications.length > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-900">Notifications</h3>
                                <button
                                    onClick={() => setShowNotifications(false)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                {getStatusIcon(notif.status)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {notif.description}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {notif.date} at {notif.time}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-3 text-center border-t border-gray-200">
                                    <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-700" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Admin</span>
                </button>
            </div>
        </header>
    );
}

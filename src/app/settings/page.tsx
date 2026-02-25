'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import {
    User,
    Bell,
    Shield,
    Database,
    Palette,
    Building2,
    Mail,
    Phone,
    MapPin,
    Save,
    Download,
    Upload,
    Trash2,
    Check
} from 'lucide-react';

const STORAGE_KEYS = {
    PROFILE: 'civicintel_admin_profile',
    NOTIFICATIONS: 'civicintel_admin_notifications',
    SYSTEM: 'civicintel_admin_system',
};

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [saved, setSaved] = useState(false);

    // Profile settings
    const [profile, setProfile] = useState({
        name: 'Admin User',
        email: 'admin@civicintel.gov.in',
        phone: '+91 98765 43210',
        role: 'System Administrator',
        organization: 'CivicIntel Municipal Corporation',
        location: 'Siliguri, West Bengal'
    });

    // Notification settings
    const [notifications, setNotifications] = useState({
        emailReports: true,
        emailWeekly: true,
        pushNewReport: true,
        pushStatusChange: true,
        pushHighPriority: true,
        smsAlerts: false
    });

    // System settings
    const [system, setSystem] = useState({
        autoRefresh: true,
        refreshInterval: '5',
        defaultView: 'dashboard',
        reportsPerPage: '20',
        theme: 'light'
    });

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
        const savedNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        const savedSystem = localStorage.getItem(STORAGE_KEYS.SYSTEM);

        if (savedProfile) setProfile(JSON.parse(savedProfile));
        if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
        if (savedSystem) setSystem(JSON.parse(savedSystem));
    }, []);

    const handleSave = () => {
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        localStorage.setItem(STORAGE_KEYS.SYSTEM, JSON.stringify(system));

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleExportData = async () => {
        try {
            const reports = await apiService.getReports();

            // Convert to CSV
            const headers = ['ID', 'Title', 'Type', 'Status', 'Priority', 'District', 'Ward', 'Street', 'Timestamp'];
            const csvData = [
                headers.join(','),
                ...reports.map(r => [
                    r.id,
                    `"${r.title}"`,
                    r.type,
                    r.status,
                    r.priority || 'N/A',
                    r.district,
                    r.ward,
                    `"${r.street}"`,
                    new Date(r.timestamp).toISOString()
                ].join(','))
            ].join('\n');

            // Download CSV
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `civicintel-reports-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Failed to export data: ' + error);
        }
    };

    const handleImportData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    alert('CSV imported successfully! (Processing not yet implemented)');
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const handleClearCache = () => {
        if (confirm('Clear all cached data? This will reset all settings.')) {
            localStorage.clear();
            alert('Cache cleared! Reload the page to reset settings.');
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'system', label: 'System', icon: Shield },
        { id: 'data', label: 'Data', icon: Database },
        { id: 'appearance', label: 'Appearance', icon: Palette },
    ];

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Settings</h1>
                <p className="text-gray-600">Manage your preferences and system configuration</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                                        ? 'bg-green-50 text-green-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Role
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.role}
                                                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Mail className="w-4 h-4 inline mr-1" />
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Phone className="w-4 h-4 inline mr-1" />
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Building2 className="w-4 h-4 inline mr-1" />
                                                Organization
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.organization}
                                                onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <MapPin className="w-4 h-4 inline mr-1" />
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.location}
                                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>

                                    <div className="space-y-4">
                                        <div className="border-b border-gray-200 pb-4">
                                            <h3 className="font-medium text-gray-900 mb-3">Email Notifications</h3>
                                            <div className="space-y-3">
                                                <label className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">New Report Alerts</div>
                                                        <div className="text-sm text-gray-500">Get notified when new reports are submitted</div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.emailReports}
                                                        onChange={(e) => setNotifications({ ...notifications, emailReports: e.target.checked })}
                                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                    />
                                                </label>
                                                <label className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">Weekly Summary</div>
                                                        <div className="text-sm text-gray-500">Receive weekly statistics and insights</div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.emailWeekly}
                                                        onChange={(e) => setNotifications({ ...notifications, emailWeekly: e.target.checked })}
                                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="border-b border-gray-200 pb-4">
                                            <h3 className="font-medium text-gray-900 mb-3">Push Notifications</h3>
                                            <div className="space-y-3">
                                                <label className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">New Reports</div>
                                                        <div className="text-sm text-gray-500">Browser notifications for new reports</div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.pushNewReport}
                                                        onChange={(e) => setNotifications({ ...notifications, pushNewReport: e.target.checked })}
                                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                    />
                                                </label>
                                                <label className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">Status Changes</div>
                                                        <div className="text-sm text-gray-500">Updates when report status changes</div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.pushStatusChange}
                                                        onChange={(e) => setNotifications({ ...notifications, pushStatusChange: e.target.checked })}
                                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                    />
                                                </label>
                                                <label className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">High Priority Alerts</div>
                                                        <div className="text-sm text-gray-500">Urgent notifications for critical reports</div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications.pushHighPriority}
                                                        onChange={(e) => setNotifications({ ...notifications, pushHighPriority: e.target.checked })}
                                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-medium text-gray-900 mb-3">SMS Alerts</h3>
                                            <label className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">Emergency Alerts</div>
                                                    <div className="text-sm text-gray-500">SMS for critical incidents only</div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.smsAlerts}
                                                    onChange={(e) => setNotifications({ ...notifications, smsAlerts: e.target.checked })}
                                                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* System Tab */}
                        {activeTab === 'system' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold mb-4">System Settings</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="flex items-center justify-between mb-2">
                                                <div>
                                                    <div className="font-medium">Auto Refresh</div>
                                                    <div className="text-sm text-gray-500">Automatically update data</div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={system.autoRefresh}
                                                    onChange={(e) => setSystem({ ...system, autoRefresh: e.target.checked })}
                                                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                />
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Refresh Interval (seconds)
                                            </label>
                                            <select
                                                value={system.refreshInterval}
                                                onChange={(e) => setSystem({ ...system, refreshInterval: e.target.value })}
                                                disabled={!system.autoRefresh}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                                            >
                                                <option value="5">5 seconds</option>
                                                <option value="10">10 seconds</option>
                                                <option value="30">30 seconds</option>
                                                <option value="60">1 minute</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Default View
                                            </label>
                                            <select
                                                value={system.defaultView}
                                                onChange={(e) => setSystem({ ...system, defaultView: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            >
                                                <option value="dashboard">Dashboard</option>
                                                <option value="reports">Reports</option>
                                                <option value="departments">Departments</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Reports Per Page
                                            </label>
                                            <select
                                                value={system.reportsPerPage}
                                                onChange={(e) => setSystem({ ...system, reportsPerPage: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            >
                                                <option value="10">10</option>
                                                <option value="20">20</option>
                                                <option value="50">50</option>
                                                <option value="100">100</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Data Tab */}
                        {activeTab === 'data' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold mb-4">Data Management</h2>

                                    <div className="space-y-4">
                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium mb-1">Export Data</h3>
                                                    <p className="text-sm text-gray-500">Download all reports and statistics</p>
                                                </div>
                                                <button
                                                    onClick={handleExportData}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Export CSV
                                                </button>
                                            </div>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium mb-1">Import Data</h3>
                                                    <p className="text-sm text-gray-500">Upload reports from CSV file</p>
                                                </div>
                                                <button
                                                    onClick={handleImportData}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Import
                                                </button>
                                            </div>
                                        </div>

                                        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium text-red-900 mb-1">Clear Cache</h3>
                                                    <p className="text-sm text-red-700">Remove all cached data from browser</p>
                                                </div>
                                                <button
                                                    onClick={handleClearCache}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold mb-4">Appearance</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Theme
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    onClick={() => setSystem({ ...system, theme: 'light' })}
                                                    className={`p-4 border-2 rounded-lg ${system.theme === 'light'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="w-full h-12 bg-white border border-gray-300 rounded mb-2"></div>
                                                    <div className="text-sm font-medium">Light</div>
                                                </button>
                                                <button
                                                    onClick={() => setSystem({ ...system, theme: 'dark' })}
                                                    className={`p-4 border-2 rounded-lg ${system.theme === 'dark'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="w-full h-12 bg-gray-800 border border-gray-700 rounded mb-2"></div>
                                                    <div className="text-sm font-medium">Dark</div>
                                                </button>
                                                <button
                                                    onClick={() => setSystem({ ...system, theme: 'auto' })}
                                                    className={`p-4 border-2 rounded-lg ${system.theme === 'auto'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="w-full h-12 bg-gradient-to-r from-white to-gray-800 border border-gray-300 rounded mb-2"></div>
                                                    <div className="text-sm font-medium">Auto</div>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-900">
                                                <strong>Note:</strong> Theme customization will be available in a future update.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                            {saved && (
                                <div className="flex items-center gap-2 text-green-600">
                                    <Check className="w-5 h-5" />
                                    <span className="font-medium">Settings saved successfully!</span>
                                </div>
                            )}
                            <button
                                onClick={handleSave}
                                className="ml-auto flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                            >
                                <Save className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

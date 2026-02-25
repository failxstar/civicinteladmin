'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiService, Report } from '@/services/api';
import {
    Search,
    Filter,
    Download,
    Eye,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    MapPin,
    Calendar,
    User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ReportsPage() {
    const searchParams = useSearchParams();
    const [reports, setReports] = useState<Report[]>([]);
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [updating, setUpdating] = useState(false);

    // Read department from URL on mount
    useEffect(() => {
        const dept = searchParams.get('department');
        if (dept) {
            setDepartmentFilter(dept);
        }
    }, [searchParams]);

    // Load reports
    useEffect(() => {
        loadReports();
        const interval = setInterval(loadReports, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadReports = async () => {
        const data = await apiService.getReports();
        setReports(data);
        setLoading(false);
    };

    // Filter reports
    useEffect(() => {
        let filtered = reports;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.ward.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Department filter
        if (departmentFilter !== 'all') {
            filtered = filtered.filter(r => r.type === departmentFilter);
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        // Priority filter
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(r => r.priority === priorityFilter);
        }

        setFilteredReports(filtered);
    }, [reports, searchTerm, departmentFilter, statusFilter, priorityFilter]);

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            submitted: 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800',
        };
        return styles[status as keyof typeof styles] || styles.pending;
    };

    const getPriorityBadge = (priority?: string) => {
        if (!priority) return 'bg-gray-100 text-gray-800';
        const styles = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-orange-100 text-orange-800',
            high: 'bg-red-100 text-red-800',
        };
        return styles[priority as keyof typeof styles] || styles.low;
    };

    const formatDate = (date: Date | string) => {
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return formatDistanceToNow(dateObj, { addSuffix: true });
        } catch {
            return 'recently';
        }
    };

    const toggleSelection = (id: string) => {
        if (selectedReports.includes(id)) {
            setSelectedReports(selectedReports.filter(rid => rid !== id));
        } else {
            setSelectedReports([...selectedReports, id]);
        }
    };

    const selectAll = () => {
        if (selectedReports.length === filteredReports.length) {
            setSelectedReports([]);
        } else {
            setSelectedReports(filteredReports.map(r => r.id));
        }
    };

    const updateReportStatus = async (reportId: string, status: string) => {
        setUpdating(true);
        try {
            const response = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                await loadReports();
                setSelectedReport(null);
                alert(`Report status updated to ${status}!`);
            } else {
                alert('Failed to update report status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating report status');
        } finally {
            setUpdating(false);
        }
    };

    const deleteReport = async (reportId: string) => {
        if (!confirm('Are you sure you want to delete this report?')) return;

        setUpdating(true);
        try {
            const response = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadReports();
                setSelectedReport(null);
                alert('Report deleted successfully!');
            } else {
                alert('Failed to delete report');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Error deleting report');
        } finally {
            setUpdating(false);
        }
    };

    const bulkUpdateStatus = async (status: string) => {
        if (selectedReports.length === 0) return;

        setUpdating(true);
        try {
            await Promise.all(
                selectedReports.map(id =>
                    fetch(`http://localhost:5000/api/reports/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status }),
                    })
                )
            );
            await loadReports();
            setSelectedReports([]);
            alert(`${selectedReports.length} reports updated to ${status}!`);
        } catch (error) {
            console.error('Error bulk updating:', error);
            alert('Error updating reports');
        } finally {
            setUpdating(false);
        }
    };

    const bulkDelete = async () => {
        if (selectedReports.length === 0) return;
        if (!confirm(`Delete ${selectedReports.length} reports?`)) return;

        setUpdating(true);
        try {
            await Promise.all(
                selectedReports.map(id =>
                    fetch(`http://localhost:5000/api/reports/${id}`, {
                        method: 'DELETE',
                    })
                )
            );
            await loadReports();
            setSelectedReports([]);
            alert('Reports deleted successfully!');
        } catch (error) {
            console.error('Error bulk deleting:', error);
            alert('Error deleting reports');
        } finally {
            setUpdating(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Title', 'Type', 'Ward', 'Status', 'Priority', 'Created At'];
        const csv = [
            headers.join(','),
            ...filteredReports.map(r => [
                r.id,
                `"${r.title}"`,
                r.type,
                r.ward,
                r.status,
                r.priority || 'N/A',
                new Date(r.timestamp).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading reports...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold mb-2">Reports Management</h1>
                <p className="text-gray-600">View, filter, and manage all citizen reports</p>
            </div>

            {/* Filters & Actions Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                {/* Search */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Filter by:</span>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="submitted">Submitted</option>
                        <option value="resolved">Resolved</option>
                    </select>

                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Departments</option>
                        <option value="road">Roads & Infrastructure</option>
                        <option value="garbage">Waste Management</option>
                        <option value="water">Water & Sanitation</option>
                        <option value="streetlight">Public Lighting</option>
                        <option value="drainage">Drainage & Sewage</option>
                        <option value="other">General Services</option>
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>

                    <div className="text-sm text-gray-600 ml-auto">
                        Showing {filteredReports.length} of {reports.length} reports
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedReports.length > 0 && (
                    <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-sm text-blue-900">{selectedReports.length} selected</span>
                        <button
                            onClick={() => bulkUpdateStatus('resolved')}
                            disabled={updating}
                            className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                        >
                            Mark as Resolved
                        </button>
                        <button
                            onClick={() => bulkUpdateStatus('submitted')}
                            disabled={updating}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                        >
                            Mark as Submitted
                        </button>
                        <button
                            onClick={bulkDelete}
                            disabled={updating}
                            className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                            Delete Selected
                        </button>
                    </div>
                )}
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="w-12 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                                    onChange={selectAll}
                                    className="rounded border-gray-300"
                                />
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Report</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Type</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Location</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Priority</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Created</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredReports.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                                    No reports found. Try adjusting your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredReports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedReports.includes(report.id)}
                                            onChange={() => toggleSelection(report.id)}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{report.title}</div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{report.description}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-700">{report.type}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm">
                                            <div className="text-gray-900">{report.ward}</div>
                                            <div className="text-gray-500">{report.district}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(report.priority)}`}>
                                            {report.priority || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-700">{formatDate(report.timestamp)}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedReport(report)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => updateReportStatus(report.id, report.status === 'resolved' ? 'submitted' : 'resolved')}
                                                disabled={updating}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                                title={report.status === 'resolved' ? 'Mark as Submitted' : 'Mark as Resolved'}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteReport(report.id)}
                                                disabled={updating}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold">Report Details</h2>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Image */}
                            {selectedReport.imageUrl && (
                                <img
                                    src={selectedReport.imageUrl}
                                    alt={selectedReport.title}
                                    className="w-full h-64 object-cover rounded-lg"
                                />
                            )}

                            {/* Title & Description */}
                            <div>
                                <h3 className="font-semibold text-lg mb-1">{selectedReport.title}</h3>
                                <p className="text-gray-600">{selectedReport.description}</p>
                            </div>

                            {/* Status & Priority */}
                            <div className="flex gap-4">
                                <div>
                                    <span className="text-sm text-gray-500">Status:</span>
                                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedReport.status)}`}>
                                        {selectedReport.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Priority:</span>
                                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(selectedReport.priority)}`}>
                                        {selectedReport.priority || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Location Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-500">Ward</div>
                                    <div className="font-medium">{selectedReport.ward}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">District</div>
                                    <div className="font-medium">{selectedReport.district}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Type</div>
                                    <div className="font-medium">{selectedReport.type}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Created</div>
                                    <div className="font-medium">{formatDate(selectedReport.timestamp)}</div>
                                </div>
                            </div>

                            {/* AI Tag */}
                            {selectedReport.aiTag && (
                                <div>
                                    <div className="text-sm text-gray-500">AI Classification</div>
                                    <div className="font-medium">{selectedReport.aiTag} ({(selectedReport.aiConfidence || 0) * 100}% confidence)</div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                                    disabled={updating || selectedReport.status === 'resolved'}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updating ? 'Updating...' : 'Mark as Resolved'}
                                </button>
                                <button
                                    onClick={() => updateReportStatus(selectedReport.id, 'submitted')}
                                    disabled={updating || selectedReport.status === 'submitted'}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updating ? 'Updating...' : 'Mark as Submitted'}
                                </button>
                                <button
                                    onClick={() => deleteReport(selectedReport.id)}
                                    disabled={updating}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updating ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

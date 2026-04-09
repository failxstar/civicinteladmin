/**
 * API Service for Admin Portal
 * Connects to backend API server for shared data
 */

export interface Report {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    district: string;
    ward: string;
    street: string;
    type: string;
    status: 'pending' | 'submitted' | 'resolved';
    priority?: 'low' | 'medium' | 'high';
    upvotes: number;
    timestamp: Date | string;
    coordinates: {
        lat: number;
        lng: number;
    };
    aiTag?: string;
    aiConfidence?: number;
    comments: any[];
    hasUserUpvoted?: boolean;
    isTamperDetected?: boolean;
    media?: any[];
    distance?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://civicintelbackend.vercel.app';

class ApiService {
    /**
     * Get all reports from backend API
     */
    async getReports(): Promise<Report[]> {
        try {
            const response = await fetch(`${API_URL}/api/reports`);
            if (!response.ok) throw new Error('Failed to fetch reports');

            const reports = await response.json();
            return reports.map((r: any) => ({
                ...r,
                timestamp: new Date(r.timestamp),
            }));
        } catch (error) {
            console.error('[ApiService] Error loading reports:', error);
            return [];
        }
    }

    /**
     * Get reports statistics
     */
    async getStats() {
        try {
            const response = await fetch(`${API_URL}/api/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');

            return await response.json();
        } catch (error) {
            console.error('[ApiService] Error loading stats:', error);
            return {
                total: 0,
                pending: 0,
                inProgress: 0,
                resolved: 0,
                highPriority: 0,
                todayCount: 0,
                avgResolutionTime: 18,
            };
        }
    }

    /**
     * Get department distribution
     */
    async getDepartmentDistribution() {
        const reports = await this.getReports();
        const distribution: Record<string, number> = {};

        reports.forEach(r => {
            const dept = this.getDepartmentName(r.type);
            distribution[dept] = (distribution[dept] || 0) + 1;
        });

        return Object.entries(distribution)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Get recent reports
     */
    async getRecentReports(limit: number = 5): Promise<Report[]> {
        const reports = await this.getReports();
        return reports
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }

    /**
     * Update report status on backend
     */
    async updateReport(reportId: string, updates: Partial<Report>): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/api/reports/${reportId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            return response.ok;
        } catch (error) {
            console.error('[ApiService] Error updating report:', error);
            return false;
        }
    }

    /**
     * Delete report from backend
     */
    async deleteReport(reportId: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/api/reports/${reportId}`, {
                method: 'DELETE',
            });
            return response.ok;
        } catch (error) {
            console.error('[ApiService] Error deleting report:', error);
            return false;
        }
    }

    /**
     * Map report type to department name
     */
    getDepartmentName(type: string): string {
        const mapping: Record<string, string> = {
            'road': 'Roads & Infrastructure',
            'garbage': 'Waste Management',
            'water': 'Water & Sanitation',
            'streetlight': 'Public Lighting',
            'drainage': 'Drainage & Sewage',
            'other': 'General Services'
        };
        return mapping[type] || 'Other';
    }

    /**
     * Get department color
     */
    getDepartmentColor(name: string): string {
        const colors: Record<string, string> = {
            'Roads & Infrastructure': 'bg-blue-600',
            'Water & Sanitation': 'bg-cyan-600',
            'Waste Management': 'bg-green-600',
            'Public Lighting': 'bg-yellow-600',
            'Drainage & Sewage': 'bg-teal-600',
            'General Services': 'bg-gray-600',
        };
        return colors[name] || 'bg-gray-600';
    }
}

export const apiService = new ApiService();

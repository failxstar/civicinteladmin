'use client';

import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';

interface Department {
    name: string;
    count: number;
    color: string;
}

export function DepartmentWorkload() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            const distribution = await apiService.getDepartmentDistribution();
            const depts = distribution.map(d => ({
                ...d,
                color: apiService.getDepartmentColor(d.name)
            }));
            setDepartments(depts);
            setTotal(depts.reduce((sum, d) => sum + d.count, 0));
        };

        loadData();

        // Poll for updates every 5 seconds  
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-1">Department Workload</h3>
            <p className="text-sm text-gray-500 mb-6">
                Report distribution across departments
            </p>

            <div className="space-y-4">
                {departments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                        No reports yet. Submit a report from the citizen app to see distribution!
                    </p>
                ) : (
                    departments.map((dept) => {
                        const percentage = total > 0 ? ((dept.count / total) * 100).toFixed(1) : '0';
                        return (
                            <div key={dept.name}>
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="font-medium text-gray-700">{dept.name}</span>
                                    <span className="text-gray-500">
                                        {dept.count} ({percentage}%)
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${dept.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

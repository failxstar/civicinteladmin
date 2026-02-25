'use client';

import { useEffect, useState } from 'react';
import {
    BarChart3,
    Clock,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';
import { apiService } from '@/services/api';

interface Stats {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    highPriority: number;
    todayCount: number;
    avgResolutionTime: number;
}

export function StatsCards() {
    const [stats, setStats] = useState<Stats>({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        highPriority: 0,
        todayCount: 0,
        avgResolutionTime: 18
    });

    useEffect(() => {
        const loadStats = async () => {
            const data = await apiService.getStats();
            setStats(data);
        };

        loadStats();

        // Poll for updates every 5 seconds
        const interval = setInterval(loadStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const resolvedPercentage = stats.total > 0
        ? ((stats.resolved / stats.total) * 100).toFixed(1)
        : '0';

    const cards = [
        {
            label: 'Total Reports',
            value: stats.total,
            icon: BarChart3,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            description: `+${stats.todayCount} today`
        },
        {
            label: 'Pending',
            value: stats.pending,
            icon: Clock,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            description: 'Awaiting review'
        },
        {
            label: 'High Priority',
            value: stats.highPriority,
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            description: 'Needs attention'
        },
        {
            label: 'Resolved',
            value: stats.resolved,
            icon: CheckCircle2,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            description: `${resolvedPercentage}% resolution rate`
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="bg-white rounded-lg border border-gray-200 p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-600">
                            {card.label}
                        </span>
                        <div className={`${card.bgColor} p-2 rounded-lg`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                    </div>
                    <div className={`text-3xl font-bold ${card.color} mb-1`}>
                        {card.value}
                    </div>
                    <p className="text-sm text-gray-500">{card.description}</p>
                </div>
            ))}
        </div>
    );
}

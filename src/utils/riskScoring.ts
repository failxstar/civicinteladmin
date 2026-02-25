/**
 * Risk Scoring Algorithm for Civic Issues
 * Implements intelligent risk assessment based on multiple factors
 */

import { Report } from '../App';
import { Coordinates, calculateDistance, findNearestInfrastructure } from '../utils/geoUtils';
import { Infrastructure, infrastructureService } from '../services/infrastructureService';

export interface RiskAssessment {
    score: number; // 0-100, normalized risk score
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: {
        severityScore: number;
        densityScore: number;
        proximityScore: number;
    };
    nearestInfrastructure?: {
        name: string;
        type: string;
        distance: number;
    };
    color: string; // Hex color for visualization
}

/**
 * Calculate risk score for a single report
 * Formula: Risk Score = (severity × 0.5) + (issue density × 0.3) + (proximity weight × 0.2)
 */
export function calculateRiskScore(
    report: Report,
    nearbyReports: Report[],
    district: string,
    radiusMeters: number = 500
): RiskAssessment {
    // 1. Severity Score (0-100)
    // Normalize report severity (1-10) to 0-100 scale
    const severityScore = (report.severity / 10) * 100;

    // 2. Density Score (0-100)
    // Count nearby reports within radius
    const nearbyCount = nearbyReports.filter((r) => {
        if (r.id === report.id) return false;
        const distance = calculateDistance(report.coordinates, r.coordinates);
        return distance <= radiusMeters;
    }).length;

    // Normalize density (assume max 20 reports in 500m radius for normalization)
    const densityScore = Math.min((nearbyCount / 20) * 100, 100);

    // 3. Proximity Score (0-100)
    // Get critical infrastructure for the district
    const criticalInfrastructure = infrastructureService.getCriticalInfrastructure(district);

    const nearest = findNearestInfrastructure(
        report.coordinates,
        criticalInfrastructure
    );

    let proximityScore = 0;
    let nearestInfo: RiskAssessment['nearestInfrastructure'];

    if (nearest) {
        const { distance, infrastructure } = nearest;
        nearestInfo = {
            name: infrastructure.name,
            type: infrastructure.type,
            distance: Math.round(distance),
        };

        // Proximity scoring:
        // < 500m: 100 (Critical)
        // 500m - 1000m: 60-100 (High to Critical)
        // 1km - 2km: 30-60 (Medium to High)
        // > 2km: 0-30 (Low to Medium)
        if (distance <= 500) {
            proximityScore = 100;
        } else if (distance <= 1000) {
            proximityScore = 60 + ((1000 - distance) / 500) * 40;
        } else if (distance <= 2000) {
            proximityScore = 30 + ((2000 - distance) / 1000) * 30;
        } else {
            proximityScore = Math.max(0, 30 - ((distance - 2000) / 1000) * 10);
        }
    }

    // Calculate final weighted score
    const finalScore =
        severityScore * 0.5 +
        densityScore * 0.3 +
        proximityScore * 0.2;

    // Determine risk level
    let level: RiskAssessment['level'];
    let color: string;

    if (finalScore >= 75) {
        level = 'critical';
        color = '#dc2626'; // red-600
    } else if (finalScore >= 50) {
        level = 'high';
        color = '#ea580c'; // orange-600
    } else if (finalScore >= 25) {
        level = 'medium';
        color = '#eab308'; // yellow-500
    } else {
        level = 'low';
        color = '#22c55e'; // green-500
    }

    return {
        score: Math.round(finalScore),
        level,
        factors: {
            severityScore: Math.round(severityScore),
            densityScore: Math.round(densityScore),
            proximityScore: Math.round(proximityScore),
        },
        nearestInfrastructure: nearestInfo,
        color,
    };
}

/**
 * Calculate risk assessments for all reports
 */
export function calculateBatchRiskScores(
    reports: Report[],
    district: string
): Map<string, RiskAssessment> {
    const riskMap = new Map<string, RiskAssessment>();

    reports.forEach((report) => {
        const risk = calculateRiskScore(report, reports, district);
        riskMap.set(report.id, risk);
    });

    return riskMap;
}

/**
 * Prepare heatmap data from reports
 * Returns array of [lat, lng, intensity] for leaflet.heat
 */
export function prepareHeatmapData(
    reports: Report[],
    riskAssessments: Map<string, RiskAssessment>
): Array<[number, number, number]> {
    return reports.map((report) => {
        const risk = riskAssessments.get(report.id);
        const intensity = risk ? risk.score / 100 : report.severity / 10;

        return [report.coordinates.lat, report.coordinates.lng, intensity];
    });
}

/**
 * Get color for a given risk score (for gradients)
 */
export function getRiskColor(score: number): string {
    if (score >= 75) return '#dc2626'; // critical - red
    if (score >= 50) return '#ea580c'; // high - orange
    if (score >= 25) return '#eab308'; // medium - yellow
    return '#22c55e'; // low - green
}

/**
 * Calculate area risk (for zones/wards)
 * Returns average risk score for a geographic area
 */
export function calculateAreaRisk(
    reports: Report[],
    center: Coordinates,
    radiusMeters: number,
    riskAssessments: Map<string, RiskAssessment>
): {
    averageRisk: number;
    count: number;
    level: RiskAssessment['level'];
} {
    const reportsInArea = reports.filter((report) => {
        const distance = calculateDistance(center, report.coordinates);
        return distance <= radiusMeters;
    });

    if (reportsInArea.length === 0) {
        return { averageRisk: 0, count: 0, level: 'low' };
    }

    const totalRisk = reportsInArea.reduce((sum, report) => {
        const risk = riskAssessments.get(report.id);
        return sum + (risk?.score || 0);
    }, 0);

    const averageRisk = totalRisk / reportsInArea.length;

    let level: RiskAssessment['level'];
    if (averageRisk >= 75) level = 'critical';
    else if (averageRisk >= 50) level = 'high';
    else if (averageRisk >= 25) level = 'medium';
    else level = 'low';

    return {
        averageRisk: Math.round(averageRisk),
        count: reportsInArea.length,
        level,
    };
}

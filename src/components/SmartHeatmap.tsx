/**
 * Smart Heatmap with Risk Intelligence
 * Integrates with existing LeafletMapScreen to add heatmap visualization
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Import leaflet.heat plugin
import '../lib/leaflet-heat.js';
import { ArrowUp, Eye, X, Layers, MapPin, Activity, Navigation } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { updateUserLocationMarker, removeUserLocationMarker } from './UserLocationMarker';
import './UserLocationMarker.css';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { Report, User } from '../App';
import { translations } from './translations';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getDistrictCenter, generateRandomCoordinates } from '../utils/mapConfig';
import { calculateBatchRiskScores, prepareHeatmapData, RiskAssessment } from '../utils/riskScoring';
import { infrastructureService, Infrastructure } from '../services/infrastructureService';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SmartHeatmapProps {
    reports: Report[];
    user: User;
    onReportSelect: (report: Report) => void;
    onUpvote: (reportId: string) => void;
}

type FilterType = 'all' | 'road' | 'garbage' | 'water' | 'streetlight' | 'drainage' | 'unresolved';

export function SmartHeatmap({ reports, user, onReportSelect, onUpvote }: SmartHeatmapProps) {
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
    const [selectedPin, setSelectedPin] = useState<Report | null>(null);
    const [reportCoordinates, setReportCoordinates] = useState<Map<string, [number, number]>>(new Map());
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showPins, setShowPins] = useState(true);
    const [showInfrastructure, setShowInfrastructure] = useState(false);
    const [showLiveLocation, setShowLiveLocation] = useState(true);

    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const heatLayerRef = useRef<any>(null);
    const infrastructureMarkersRef = useRef<L.Marker[]>([]);

    // Live GPS tracking
    const { position, error: gpsError, loading: gpsLoading } = useGeolocation({
        enableHighAccuracy: true,
        watch: true,
    });

    const t = translations[user.language];

    const filterOptions: { value: FilterType; label: string; color: string }[] = [
        { value: 'all', label: t.allReports, color: 'bg-gray-500' },
        { value: 'road', label: t.road, color: 'bg-red-500' },
        { value: 'garbage', label: t.garbage, color: 'bg-orange-500' },
        { value: 'water', label: t.water, color: 'bg-blue-500' },
        { value: 'streetlight', label: t.streetlight, color: 'bg-yellow-500' },
        { value: 'drainage', label: 'Drainage', color: 'bg-cyan-500' },
        { value: 'unresolved', label: t.unresolved, color: 'bg-red-600' }
    ];

    const getStatusColor = (status: Report['status']) => {
        switch (status) {
            case 'pending': return '#ef4444';
            case 'submitted': return '#f59e0b';
            case 'resolved': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status: Report['status']) => {
        switch (status) {
            case 'pending': return t.statusPending;
            case 'submitted': return t.statusInProgress;
            case 'resolved': return t.statusResolved;
            default: return status;
        }
    };

    const filteredReports = useMemo(() => {
        return reports
            .filter(report => report.district === user.district)
            .filter(report => {
                if (selectedFilter === 'all') return true;
                if (selectedFilter === 'unresolved') return report.status !== 'resolved';
                return report.type.toLowerCase() === selectedFilter;
            });
    }, [reports, user.district, selectedFilter]);

    // Calculate risk scores (memoized for performance)
    const riskAssessments = useMemo(() => {
        return calculateBatchRiskScores(filteredReports, user.district || 'Unknown');
    }, [filteredReports, user.district]);

    // Prepare heatmap data (memoized)
    const heatmapData = useMemo(() => {
        return prepareHeatmapData(filteredReports, riskAssessments);
    }, [filteredReports, riskAssessments]);

    // Get infrastructure data
    const infrastructure = useMemo(() => {
        return infrastructureService.getInfrastructure(user.district || 'Unknown');
    }, [user.district]);

    const formatTimeAgo = (timestamp: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) {
            return `${diffMins} ${t.minutesAgo}`;
        } else if (diffHours < 24) {
            return `${diffHours} ${t.hoursAgo}`;
        } else {
            return `${diffDays} ${t.daysAgo}`;
        }
    };

    // Generate stable coordinates for reports
    useEffect(() => {
        const districtCenter = user.district ? getDistrictCenter(user.district) : [0, 0];
        const newCoordinates = new Map<string, [number, number]>();

        const districtReports = reports.filter(report => report.district === user.district);

        districtReports.forEach((report) => {
            // Use actual report coordinates if available, otherwise use district center with small offset
            if (report.coordinates && report.coordinates.lat && report.coordinates.lng) {
                // Use the ACTUAL coordinates from the report (real GPS location)
                const coords: [number, number] = [
                    report.coordinates.lng,
                    report.coordinates.lat
                ];
                newCoordinates.set(report.id, coords);
            } else if (!reportCoordinates.has(report.id)) {
                // Fallback: If coordinates don't exist, generate new ones with a small offset from district center
                const randomOffset = () => (Math.random() - 0.5) * 0.01;
                const centerLng = Array.isArray(districtCenter) && districtCenter.length === 2 ? districtCenter[0] : 0;
                const centerLat = Array.isArray(districtCenter) && districtCenter.length === 2 ? districtCenter[1] : 0;
                const coords: [number, number] = [
                    centerLng + randomOffset(),
                    centerLat + randomOffset()
                ];
                newCoordinates.set(report.id, coords);
            } else {
                // Otherwise, use existing stable coordinates
                newCoordinates.set(report.id, reportCoordinates.get(report.id)!);
            }
        });

        setReportCoordinates(newCoordinates);
    }, [reports, user.district]); // FIXED: Removed reportCoordinates to prevent infinite loop

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current) return;

        const districtCenter = user.district ? getDistrictCenter(user.district) : [0, 0];

        leafletMapRef.current = L.map(mapRef.current, {
            zoomControl: true,
            attributionControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            dragging: true,
            touchZoom: true
        }).setView([districtCenter[1], districtCenter[0]], 13);

        leafletMapRef.current.zoomControl.setPosition('topright');

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMapRef.current);

        // Force map to resize after initialization
        setTimeout(() => {
            if (leafletMapRef.current) {
                leafletMapRef.current.invalidateSize();
            }
        }, 100);

        return () => {
            if (leafletMapRef.current) {
                removeUserLocationMarker(leafletMapRef.current);
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, [user.district]);

    // Update heatmap layer
    useEffect(() => {
        if (!leafletMapRef.current || reportCoordinates.size === 0) return;

        // Remove existing heatmap layer
        if (heatLayerRef.current) {
            leafletMapRef.current.removeLayer(heatLayerRef.current);
            heatLayerRef.current = null;
        }

        // Add new heatmap layer if enabled
        if (showHeatmap && heatmapData.length > 0) {
            // @ts-ignore - leaflet.heat plugin
            heatLayerRef.current = L.heatLayer(heatmapData, {
                radius: 35,
                blur: 25,
                maxZoom: 17,
                max: 1.0,
                gradient: {
                    0.0: '#22c55e',  // green (low risk)
                    0.25: '#eab308', // yellow (medium risk)
                    0.5: '#ea580c',  // orange (high risk)
                    0.75: '#dc2626', // red (critical risk)
                    1.0: '#991b1b'   // dark red (extreme)
                }
            }).addTo(leafletMapRef.current);
        }
    }, [heatmapData, showHeatmap, reportCoordinates]);

    // Update markers
    useEffect(() => {
        if (!leafletMapRef.current || reportCoordinates.size === 0) return;

        // Clear existing markers
        markersRef.current.forEach(marker => {
            leafletMapRef.current?.removeLayer(marker);
        });
        markersRef.current = [];

        if (!showPins) return;

        // Add new markers for filtered reports
        filteredReports.forEach((report) => {
            const coordinates = reportCoordinates.get(report.id);
            if (!coordinates) return;

            const risk = riskAssessments.get(report.id);
            const riskColor = risk?.color || getStatusColor(report.status);

            const customIcon = L.divIcon({
                className: 'custom-risk-marker',
                html: `
          <div style="
            background-color: ${riskColor};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            position: relative;
          ">
            ${risk?.score || report.severity}
            ${report.priority === 'high' ? `
              <div style="
                position: absolute;
                top: -3px;
                right: -3px;
                width: 12px;
                height: 12px;
                background: #dc2626;
                border-radius: 50%;
                border: 2px solid white;
                animation: pulse 2s infinite;
              "></div>
            ` : ''}
          </div>
        `,
                iconSize: [36, 36],
                iconAnchor: [18, 36]
            });

            const marker = L.marker([coordinates[1], coordinates[0]], { icon: customIcon })
                .addTo(leafletMapRef.current!);

            const popupContent = `
        <div style="min-width: 280px; max-width: 320px; font-family: system-ui;">
          <div style="margin-bottom: 10px;">
            <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #1f2937;">
              ${report.title}
            </h3>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              ${formatTimeAgo(report.timestamp)}
            </p>
          </div>
          
          <p style="margin: 8px 0; font-size: 13px; color: #4b5563;">
            📍 ${report.ward} • ${report.street}
          </p>
          
          <div style="margin: 12px 0; padding: 12px; background: ${riskColor}10; border-radius: 8px; border-left: 3px solid ${riskColor};">
            <div style="font-size: 12px; font-weight: 600; color: ${riskColor}; margin-bottom: 4px;">
              🎯 Risk Score: ${risk?.score || 'N/A'}/100 (${risk?.level.toUpperCase() || 'Unknown'})
            </div>
            ${risk?.nearestInfrastructure ? `
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                📌 ${risk.nearestInfrastructure.distance}m from ${risk.nearestInfrastructure.name}
              </div>
            ` : ''}
          </div>
          
          <p style="margin: 8px 0; font-size: 13px; color: #1f2937; line-height: 1.5;">
            ${report.description}
          </p>
          
          <div style="margin: 12px 0; display: flex; gap: 6px; flex-wrap: wrap;">
            <span style="
              background: ${getStatusColor(report.status)};
              color: white;
              padding: 4px 10px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            ">
              ${getStatusText(report.status)}
            </span>
            <span style="
              background: #f3f4f6;
              color: #374151;
              padding: 4px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 500;
            ">
              ${report.aiTag} ${report.aiConfidence}%
            </span>
            <span style="
              background: #eff6ff;
              color: #1e40af;
              padding: 4px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 500;
            ">
              ⬆ ${report.upvotes} upvotes
            </span>
          </div>
          
          <button 
            onclick="window.selectReportFromMap('${report.id}')" 
            style="
              width: 100%;
              background: #3b82f6;
              color: white;
              border: none;
              padding: 10px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              margin-top: 8px;
              transition: background-color 0.2s;
            "
            onmouseover="this.style.backgroundColor='#2563eb'"
            onmouseout="this.style.backgroundColor='#3b82f6'"
          >
            👁 View Full Details
          </button>
        </div>
      `;

            marker.bindPopup(popupContent, {
                maxWidth: 320,
                className: 'custom-popup'
            });

            marker.on('click', (e) => {
                e.originalEvent?.stopPropagation();
                setSelectedPin(report);
            });

            marker.on('popupclose', () => {
                setTimeout(() => {
                    if (selectedPin?.id === report.id) {
                        setSelectedPin(null);
                    }
                }, 100);
            });

            markersRef.current.push(marker);
        });

        (window as any).selectReportFromMap = (reportId: string) => {
            const report = filteredReports.find(r => r.id === reportId);
            if (report) {
                setSelectedPin(report);
                leafletMapRef.current?.closePopup();
            }
        };

    }, [filteredReports, reportCoordinates, showPins, riskAssessments, selectedPin, t]);

    // Update infrastructure markers
    useEffect(() => {
        if (!leafletMapRef.current) return;

        // Clear existing infrastructure markers
        infrastructureMarkersRef.current.forEach(marker => {
            leafletMapRef.current?.removeLayer(marker);
        });
        infrastructureMarkersRef.current = [];

        if (!showInfrastructure) return;

        // Add infrastructure markers
        infrastructure.forEach((item) => {
            const iconConfig = {
                hospital: { emoji: '🏥', color: '#dc2626' },
                school: { emoji: '🏫', color: '#2563eb' },
                college: { emoji: '🎓', color: '#7c3aed' },
                emergency_service: { emoji: '🚨', color: '#ea580c' },
                government_building: { emoji: '🏛️', color: '#059669' },
            };

            const config = iconConfig[item.type];

            const icon = L.divIcon({
                className: 'infrastructure-marker',
                html: `
          <div style="
            background-color: ${config.color};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          ">
            ${config.emoji}
          </div>
        `,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const marker = L.marker([item.coordinates.lat, item.coordinates.lng], { icon })
                .addTo(leafletMapRef.current!);

            marker.bindPopup(`
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
            ${config.emoji} ${item.name}
          </h4>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">
            Type: ${item.type.replace('_', ' ')}
          </p>
          ${item.operatingHours ? `
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              Hours: ${item.operatingHours}
            </p>
          ` : ''}
        </div>
      `);

            infrastructureMarkersRef.current.push(marker);
        });
    }, [infrastructure, showInfrastructure]);

    // Update live user location marker
    useEffect(() => {
        if (!leafletMapRef.current || !showLiveLocation || !position) return;

        updateUserLocationMarker({
            map: leafletMapRef.current,
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            heading: position.heading,
            showAccuracy: true,
        });
    }, [position, showLiveLocation]);

    const riskStats = useMemo(() => {
        const stats = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
        };

        filteredReports.forEach(report => {
            const risk = riskAssessments.get(report.id);
            if (risk) {
                stats[risk.level]++;
            }
        });

        return stats;
    }, [filteredReports, riskAssessments]);

    return (
        <div className="flex flex-col bg-background relative" style={{ height: 'calc(100vh - 5rem)' }}>
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 flex-shrink-0">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Smart Heatmap Intelligence
                        </h1>
                        <Badge variant="secondary" className="text-xs">
                            Risk-Based Analysis
                        </Badge>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                        {filterOptions.map((option) => (
                            <Button
                                key={option.value}
                                variant={selectedFilter === option.value ? "default" : "outline"}
                                size="sm"
                                className="whitespace-nowrap"
                                onClick={() => setSelectedFilter(option.value)}
                            >
                                <div className={`w-2 h-2 rounded-full ${option.color} mr-2`}></div>
                                {option.label}
                            </Button>
                        ))}
                    </div>

                    {/* Map Controls */}
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant={showHeatmap ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            className="text-xs"
                        >
                            <Layers className="w-3 h-3 mr-1" />
                            Heatmap
                        </Button>
                        <Button
                            variant={showPins ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowPins(!showPins)}
                            className="text-xs"
                        >
                            <MapPin className="w-3 h-3 mr-1" />
                            Pins
                        </Button>
                        <Button
                            variant={showInfrastructure ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowInfrastructure(!showInfrastructure)}
                            className="text-xs"
                        >
                            🏥 Infrastructure
                        </Button>
                        <Button
                            variant={showLiveLocation ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowLiveLocation(!showLiveLocation)}
                            className="text-xs"
                        >
                            <Navigation className="w-3 h-3 mr-1" />
                            Live Location {gpsLoading && '⏳'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative flex-1 z-10">
                <div
                    ref={mapRef}
                    className="w-full h-full relative z-10"
                    style={{ minHeight: '400px' }}
                />

                {/* District Info & Risk Stats */}
                <div className="absolute top-4 left-4 z-20 space-y-2">
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                        <div className="text-xs font-semibold text-gray-600">📍 {user.district}</div>
                        <div className="text-sm font-bold">{filteredReports.length} reports</div>
                    </div>

                    {/* Risk Distribution */}
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-xs space-y-1">
                        <div className="font-semibold text-gray-700 mb-1">Risk Distribution</div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: '#dc2626' }}></span>
                            <span>Critical: {riskStats.critical}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: '#ea580c' }}></span>
                            <span>High: {riskStats.high}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: '#eab308' }}></span>
                            <span>Medium: {riskStats.medium}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }}></span>
                            <span>Low: {riskStats.low}</span>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg text-xs z-20">
                    <div className="font-semibold mb-2">Heatmap Legend</div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ background: '#22c55e' }}></div>
                            <span>Low Risk</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ background: '#eab308' }}></div>
                            <span>Medium</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ background: '#ea580c' }}></div>
                            <span>High</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ background: '#dc2626' }}></div>
                            <span>Critical</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Popup for Selected Pin */}
            <AnimatePresence>
                {selectedPin && (
                    <motion.div
                        className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white border-t border-gray-200 rounded-t-lg shadow-lg z-[10000]"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 500 }}
                    >
                        <div className="h-[60vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-left">{selectedPin.title}</h3>
                                <button
                                    onClick={() => setSelectedPin(null)}
                                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="aspect-video relative rounded-lg overflow-hidden">
                                    <ImageWithFallback
                                        src={selectedPin.imageUrl}
                                        alt={selectedPin.title}
                                        className="relative w-full h-[420px] overflow-hidden rounded-xl"
                                    />
                                </div>

                                {/* Risk Info */}
                                {riskAssessments.get(selectedPin.id) && (
                                    <div
                                        className="p-3 rounded-lg border-l-4"
                                        style={{
                                            backgroundColor: `${riskAssessments.get(selectedPin.id)!.color}15`,
                                            borderColor: riskAssessments.get(selectedPin.id)!.color
                                        }}
                                    >
                                        <div className="text-sm font-bold mb-1">
                                            Risk Score: {riskAssessments.get(selectedPin.id)!.score}/100
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            Level: {riskAssessments.get(selectedPin.id)!.level.toUpperCase()}
                                        </div>
                                        {riskAssessments.get(selectedPin.id)!.nearestInfrastructure && (
                                            <div className="text-xs text-gray-600 mt-1">
                                                📌 {riskAssessments.get(selectedPin.id)!.nearestInfrastructure!.distance}m from{' '}
                                                {riskAssessments.get(selectedPin.id)!.nearestInfrastructure!.name}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge className={`text-xs ${selectedPin.status === 'pending' ? 'bg-red-100 text-red-800' :
                                            selectedPin.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {getStatusText(selectedPin.status)}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatTimeAgo(selectedPin.timestamp)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-2">
                                        {selectedPin.ward} • {selectedPin.street} • {selectedPin.distance}km
                                    </p>

                                    <Badge variant="secondary" className="text-xs mb-3">
                                        {selectedPin.aiTag} — {selectedPin.aiConfidence}% {t.confidence}
                                    </Badge>

                                    <p className="text-sm mb-4">{selectedPin.description}</p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => onReportSelect(selectedPin)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        {t.viewDetails}
                                    </Button>

                                    <motion.button
                                        className={`flex items-center gap-2 px-4 py-2 rounded text-sm ${selectedPin.hasUserUpvoted
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary text-secondary-foreground'
                                            }`}
                                        onClick={() => onUpvote(selectedPin.id)}
                                        whileTap={{ scale: 1.05 }}
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                        {selectedPin.upvotes}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

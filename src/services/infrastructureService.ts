/**
 * Infrastructure Service
 * Manages critical infrastructure data for risk assessment
 * Data source: OpenStreetMap (simulated for now, can be replaced with API)
 */

import { Coordinates } from '../utils/geoUtils';

export interface Infrastructure {
    id: string;
    name: string;
    type: 'hospital' | 'school' | 'college' | 'emergency_service' | 'government_building';
    coordinates: Coordinates;
    capacity?: number;
    operatingHours?: string;
}

/**
 * Critical Infrastructure Database for Siliguri District
 * In production, this would be fetched from OpenStreetMap Overpass API or Google Places API
 */
const siliGuriInfrastructure: Infrastructure[] = [
    // Hospitals
    {
        id: 'h1',
        name: 'North Bengal Medical College & Hospital',
        type: 'hospital',
        coordinates: { lat: 26.7135, lng: 88.3969 },
        operatingHours: '24/7',
    },
    {
        id: 'h2',
        name: 'Siliguri District Hospital',
        type: 'hospital',
        coordinates: { lat: 26.7205, lng: 88.3912 },
        operatingHours: '24/7',
    },
    {
        id: 'h3',
        name: 'Desun Hospital Siliguri',
        type: 'hospital',
        coordinates: { lat: 26.7289, lng: 88.4015 },
        operatingHours: '24/7',
    },
    {
        id: 'h4',
        name: 'Neotia Getwel Healthcare Centre',
        type: 'hospital',
        coordinates: { lat: 26.7185, lng: 88.4105 },
        operatingHours: '24/7',
    },

    // Schools
    {
        id: 's1',
        name: 'Kendriya Vidyalaya Siliguri',
        type: 'school',
        coordinates: { lat: 26.7268, lng: 88.4112 },
        operatingHours: '8am-4pm',
    },
    {
        id: 's2',
        name: 'Holy Cross School',
        type: 'school',
        coordinates: { lat: 26.7165, lng: 88.4025 },
        operatingHours: '8am-3pm',
    },
    {
        id: 's3',
        name: 'Carmel School',
        type: 'school',
        coordinates: { lat: 26.7215, lng: 88.3985 },
        operatingHours: '8am-3pm',
    },
    {
        id: 's4',
        name: 'St. Josephs School',
        type: 'school',
        coordinates: { lat: 26.7301, lng: 88.3890 },
        operatingHours: '8am-3pm',
    },
    {
        id: 's5',
        name: 'Delhi Public School Siliguri',
        type: 'school',
        coordinates: { lat: 26.7345, lng: 88.4078 },
        operatingHours: '8am-3pm',
    },

    // Colleges
    {
        id: 'c1',
        name: 'University of North Bengal',
        type: 'college',
        coordinates: { lat: 26.7081, lng: 88.3685 },
        operatingHours: '9am-5pm',
    },
    {
        id: 'c2',
        name: 'Siliguri College',
        type: 'college',
        coordinates: { lat: 26.7245, lng: 88.3925 },
        operatingHours: '9am-5pm',
    },
    {
        id: 'c3',
        name: 'Surya Sen Mahavidyalaya',
        type: 'college',
        coordinates: { lat: 26.7189, lng: 88.3865 },
        operatingHours: '9am-5pm',
    },

    // Emergency Services
    {
        id: 'e1',
        name: 'Fire Station - Pradhan Nagar',
        type: 'emergency_service',
        coordinates: { lat: 26.7412, lng: 88.4135 },
        operatingHours: '24/7',
    },
    {
        id: 'e2',
        name: 'Fire Station - Hakimpara',
        type: 'emergency_service',
        coordinates: { lat: 26.7185, lng: 88.3795 },
        operatingHours: '24/7',
    },
    {
        id: 'e3',
        name: 'Police Station - Bhaktinagar',
        type: 'emergency_service',
        coordinates: { lat: 26.7235, lng: 88.4015 },
        operatingHours: '24/7',
    },
    {
        id: 'e4',
        name: 'Police Station - Pradhan Nagar',
        type: 'emergency_service',
        coordinates: { lat: 26.7385, lng: 88.4105 },
        operatingHours: '24/7',
    },

    // Government Buildings
    {
        id: 'g1',
        name: 'Siliguri Municipal Corporation',
        type: 'government_building',
        coordinates: { lat: 26.7215, lng: 88.3895 },
        operatingHours: '10am-5pm',
    },
    {
        id: 'g2',
        name: 'District Magistrate Office',
        type: 'government_building',
        coordinates: { lat: 26.7265, lng: 88.3955 },
        operatingHours: '10am-5pm',
    },
    {
        id: 'g3',
        name: 'Uttarkanya Office Complex',
        type: 'government_building',
        coordinates: { lat: 26.7198, lng: 88.3925 },
        operatingHours: '10am-5pm',
    },
];

class InfrastructureService {
    private infrastructure: Map<string, Infrastructure[]> = new Map();

    constructor() {
        // Initialize with Siliguri data
        this.infrastructure.set('Siliguri', siliGuriInfrastructure);
    }

    /**
     * Get all infrastructure for a district
     */
    getInfrastructure(district: string): Infrastructure[] {
        return this.infrastructure.get(district) || [];
    }

    /**
     * Get infrastructure by type
     */
    getInfrastructureByType(
        district: string,
        type: Infrastructure['type']
    ): Infrastructure[] {
        const all = this.getInfrastructure(district);
        return all.filter((item) => item.type === type);
    }

    /**
     * Get all critical infrastructure (hospitals, schools, emergency services)
     */
    getCriticalInfrastructure(district: string): Infrastructure[] {
        const all = this.getInfrastructure(district);
        return all.filter(
            (item) =>
                item.type === 'hospital' ||
                item.type === 'school' ||
                item.type === 'emergency_service'
        );
    }

    /**
     * Add infrastructure (for future dynamic data loading from APIs)
     */
    addInfrastructure(district: string, infrastructure: Infrastructure): void {
        const existing = this.infrastructure.get(district) || [];
        existing.push(infrastructure);
        this.infrastructure.set(district, existing);
    }

    /**
     * Load infrastructure from OpenStreetMap Overpass API
     * This is a placeholder for future implementation
     */
    async loadFromOpenStreetMap(district: string, bounds: {
        south: number;
        west: number;
        north: number;
        east: number;
    }): Promise<Infrastructure[]> {
        // TODO: Implement Overpass API query
        // Example query structure:
        // [out:json];
        // (
        //   node["amenity"="hospital"](south,west,north,east);
        //   node["amenity"="school"](south,west,north,east);
        //   node["amenity"="college"](south,west,north,east);
        // );
        // out;

        console.log('OpenStreetMap API integration not yet implemented');
        return this.getInfrastructure(district);
    }

    /**
     * Load infrastructure from Google Places API
     * This is a placeholder for future implementation
     */
    async loadFromGooglePlaces(
        center: Coordinates,
        radiusMeters: number,
        types: string[]
    ): Promise<Infrastructure[]> {
        // TODO: Implement Google Places API integration
        // Requires API key and proper configuration

        console.log('Google Places API integration not yet implemented');
        return [];
    }
}

// Export singleton instance
export const infrastructureService = new InfrastructureService();

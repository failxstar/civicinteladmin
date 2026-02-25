/**
 * Map Configuration
 * FULLY DYNAMIC - NO HARDCODED LOCATIONS
 * All location data should come from user GPS coordinates
 */

/**
 * Get district center coordinates
 * DEPRECATED: This function is kept for backward compatibility only
 * NEW CODE SHOULD USE GPS COORDINATES DIRECTLY
 * 
 * @param district - District name (ignored in new implementation)
 * @returns World center coordinates [0, 0] as fallback - NEVER SILIGURI
 */
export const getDistrictCenter = (district: string): [number, number] => {
  console.warn('[mapConfig] getDistrictCenter is deprecated. Use GPS coordinates instead.');
  console.warn(`[mapConfig] Attempted to get center for district: "${district}"`);

  // REMOVED: All hardcoded Siliguri and district centers
  // Return world view center as fallback - map should zoom to actual report locations
  return [0, 0];  // World view (lng, lat)
};

/**
 * Generate random coordinates around a center point
 * Used for visual separation of nearby reports
 */
export const generateRandomCoordinates = (
  center: [number, number],
  count: number,
  radiusKm: number = 5
): [number, number][] => {
  const coordinates: [number, number][] = [];
  const [centerLng, centerLat] = center;

  for (let i = 0; i < count; i++) {
    // Convert radius from kilometers to degrees (rough approximation)
    const radiusDeg = radiusKm / 111; // 1 degree ≈ 111 km

    // Generate random angle and distance
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDeg;

    // Calculate new coordinates
    const lng = centerLng + (distance * Math.cos(angle));
    const lat = centerLat + (distance * Math.sin(angle));

    coordinates.push([lng, lat]);
  }

  return coordinates;
};

export const createMarkerElement = (report: any) => {
  const el = document.createElement('div');
  el.className = 'custom-marker';
  el.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    position: relative;
    transition: transform 0.2s ease;
  `;

  // Set background color based on report status
  const statusColors = {
    pending: '#ef4444',    // red
    submitted: '#f59e0b',  // yellow/orange
    resolved: '#10b981'    // green
  };

  el.style.backgroundColor = statusColors[report.status as keyof typeof statusColors] || '#6b7280';

  // Add priority indicator
  if (report.priority === 'high') {
    const priorityIndicator = document.createElement('div');
    priorityIndicator.style.cssText = `
      position: absolute;
      top: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background-color: #dc2626;
      border-radius: 50%;
      border: 2px solid white;
      animation: pulse 2s infinite;
    `;
    el.appendChild(priorityIndicator);
  }

  // Add icon
  const icon = document.createElement('div');
  icon.innerHTML = '📍';
  icon.style.cssText = `
    font-size: 16px;
    color: white;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
  `;
  el.appendChild(icon);

  // Add hover effect
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)';
  });

  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
  });

  return el;
};
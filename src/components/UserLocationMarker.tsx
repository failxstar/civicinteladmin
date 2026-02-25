/**
 * UserLocationMarker Component
 * Displays the user's live location on the map with a pulsing animation
 */

import React, { useEffect } from 'react';
import L from 'leaflet';
import './UserLocationMarker.css';

export interface UserLocationMarkerProps {
    map: L.Map;
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number | null;
    showAccuracy?: boolean;
}

let userMarker: L.Marker | null = null;
let accuracyCircle: L.Circle | null = null;

export function createUserLocationMarker({
    map,
    latitude,
    longitude,
    accuracy = 50,
    heading = null,
    showAccuracy = true,
}: UserLocationMarkerProps): void {
    // Remove existing marker and accuracy circle
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }
    if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
        accuracyCircle = null;
    }

    // Create accuracy circle if enabled
    if (showAccuracy) {
        accuracyCircle = L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 1,
        }).addTo(map);
    }

    // Create custom icon for user location
    const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
      <div class="user-location-pulse">
        <div class="user-location-dot ${heading !== null ? 'has-heading' : ''}" 
             style="${heading !== null ? `transform: rotate(${heading}deg)` : ''}">
          ${heading !== null ? '<div class="heading-indicator"></div>' : ''}
        </div>
      </div>
    `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });

    // Create marker
    userMarker = L.marker([latitude, longitude], {
        icon: userIcon,
        zIndexOffset: 1000, // Make sure it's on top
    }).addTo(map);

    // Add popup with location info
    const accuracyText = accuracy < 1000
        ? `${Math.round(accuracy)}m accuracy`
        : `${(accuracy / 1000).toFixed(1)}km accuracy`;

    userMarker.bindPopup(`
    <div style="text-align: center; font-family: system-ui;">
      <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
        📍 You are here
      </div>
      <div style="font-size: 12px; color: #6b7280;">
        ${accuracyText}
      </div>
      ${heading !== null ? `
        <div style="font-size: 11px; color: #3b82f6; margin-top: 4px;">
          Heading: ${Math.round(heading)}°
        </div>
      ` : ''}
    </div>
  `);
}

/**
 * Update user location marker position (for smooth tracking)
 */
export function updateUserLocationMarker({
    map,
    latitude,
    longitude,
    accuracy = 50,
    heading = null,
    showAccuracy = true,
}: UserLocationMarkerProps): void {
    if (!userMarker) {
        // Create marker if it doesn't exist
        createUserLocationMarker({ map, latitude, longitude, accuracy, heading, showAccuracy });
        return;
    }

    // Smoothly update position
    const newLatLng = L.latLng(latitude, longitude);
    userMarker.setLatLng(newLatLng);

    // Update accuracy circle
    if (showAccuracy) {
        if (accuracyCircle) {
            accuracyCircle.setLatLng(newLatLng);
            accuracyCircle.setRadius(accuracy);
        } else {
            accuracyCircle = L.circle([latitude, longitude], {
                radius: accuracy,
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 1,
            }).addTo(map);
        }
    } else if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
        accuracyCircle = null;
    }

    // Update heading if available
    if (heading !== null && userMarker) {
        const element = userMarker.getElement();
        if (element) {
            const dot = element.querySelector('.user-location-dot') as HTMLElement;
            if (dot) {
                dot.style.transform = `rotate(${heading}deg)`;
                dot.classList.add('has-heading');
            }
        }
    }
}

/**
 * Remove user location marker
 */
export function removeUserLocationMarker(map: L.Map): void {
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }
    if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
        accuracyCircle = null;
    }
}

/**
 * Get current user marker (for external access)
 */
export function getUserLocationMarker(): L.Marker | null {
    return userMarker;
}

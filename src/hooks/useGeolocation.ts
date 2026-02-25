/**
 * useGeolocation Hook
 * Provides real-time GPS tracking using watchPosition API
 * Includes error handling, permission management, and performance optimization
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeolocationCoordinates {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
    timestamp: number;
}

export interface GeolocationError {
    code: number;
    message: string;
    type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
}

export interface UseGeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    watch?: boolean; // If true, use watchPosition. If false, use getCurrentPosition
}

export interface UseGeolocationReturn {
    position: GeolocationCoordinates | null;
    error: GeolocationError | null;
    loading: boolean;
    permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
    refresh: () => void;
    startWatching: () => void;
    stopWatching: () => void;
    isWatching: boolean;
}

const DEFAULT_OPTIONS: UseGeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000, // 10 seconds
    maximumAge: 0, // Don't use cached position
    watch: true,
};

export function useGeolocation(
    options: UseGeolocationOptions = DEFAULT_OPTIONS
): UseGeolocationReturn {
    const [position, setPosition] = useState<GeolocationCoordinates | null>(null);
    const [error, setError] = useState<GeolocationError | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    const [isWatching, setIsWatching] = useState<boolean>(options.watch ?? true);

    const watchIdRef = useRef<number | null>(null);

    // Merge default options with user options
    const geolocationOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
    };

    // Check permission status
    useEffect(() => {
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');

                // Listen for permission changes
                result.addEventListener('change', () => {
                    setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
                });
            }).catch(() => {
                setPermissionStatus('unknown');
            });
        }
    }, []);

    // Success callback
    const onSuccess = useCallback((pos: globalThis.GeolocationPosition) => {
        const newPosition: GeolocationCoordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
        };

        setPosition(newPosition);
        setError(null);
        setLoading(false);
    }, []);

    // Error callback
    const onError = useCallback((err: GeolocationPositionError) => {
        let errorType: GeolocationError['type'];
        let message: string;

        switch (err.code) {
            case err.PERMISSION_DENIED:
                errorType = 'PERMISSION_DENIED';
                message = 'Location permission denied. Please enable location access in your browser settings.';
                setPermissionStatus('denied');
                break;
            case err.POSITION_UNAVAILABLE:
                errorType = 'POSITION_UNAVAILABLE';
                message = 'Location information is unavailable. Please check your GPS settings.';
                break;
            case err.TIMEOUT:
                errorType = 'TIMEOUT';
                message = 'Location request timed out. Please try again.';
                break;
            default:
                errorType = 'UNKNOWN';
                message = 'An unknown error occurred while getting your location.';
        }

        const geolocationError: GeolocationError = {
            code: err.code,
            message,
            type: errorType,
        };

        setError(geolocationError);
        setLoading(false);
    }, []);

    // Start watching position
    const startWatching = useCallback(() => {
        if (!navigator.geolocation) {
            setError({
                code: 0,
                message: 'Geolocation is not supported by your browser.',
                type: 'UNKNOWN',
            });
            setLoading(false);
            return;
        }

        setLoading(true);
        setIsWatching(true);

        // Stop any existing watch
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        // Start watching position
        watchIdRef.current = navigator.geolocation.watchPosition(
            onSuccess,
            onError,
            {
                enableHighAccuracy: geolocationOptions.enableHighAccuracy,
                timeout: geolocationOptions.timeout,
                maximumAge: geolocationOptions.maximumAge,
            }
        );
    }, [onSuccess, onError, geolocationOptions]);

    // Stop watching position
    const stopWatching = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setIsWatching(false);
        }
    }, []);

    // Refresh position (one-time getCurrentPosition)
    const refresh = useCallback(() => {
        if (!navigator.geolocation) {
            setError({
                code: 0,
                message: 'Geolocation is not supported by your browser.',
                type: 'UNKNOWN',
            });
            setLoading(false);
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            onSuccess,
            onError,
            {
                enableHighAccuracy: geolocationOptions.enableHighAccuracy,
                timeout: geolocationOptions.timeout,
                maximumAge: geolocationOptions.maximumAge,
            }
        );
    }, [onSuccess, onError, geolocationOptions]);

    // Auto-start watching if watch option is true
    useEffect(() => {
        if (geolocationOptions.watch) {
            startWatching();
        } else {
            refresh();
        }

        // Cleanup on unmount
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []); // Empty array - only run once on mount

    return {
        position,
        error,
        loading,
        permissionStatus,
        refresh,
        startWatching,
        stopWatching,
        isWatching,
    };
}

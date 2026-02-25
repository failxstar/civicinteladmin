// Leaflet Heat plugin type definitions
// This extends the Leaflet library with the heatLayer method

import * as L from 'leaflet';

declare module 'leaflet' {
    function heatLayer(
        latLngs: Array<[number, number, number]>,
        options?: HeatLayerOptions
    ): HeatLayer;

    interface HeatLayerOptions {
        minOpacity?: number;
        maxZoom?: number;
        max?: number;
        radius?: number;
        blur?: number;
        gradient?: { [key: number]: string };
    }

    interface HeatLayer extends Layer {
        setLatLngs(latLngs: Array<[number, number, number]>): this;
        addLatLng(latLng: [number, number, number]): this;
        setOptions(options: HeatLayerOptions): this;
        redraw(): this;
    }
}

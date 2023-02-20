import "@amap/amap-jsapi-types";

export interface TrackLine {
    positions: AMap.LngLat[],
    heights: number[],

    extraInfo: {
        type: string,
        size: string,
    }
}

export interface Device {
    id: string,
    type: string,
    position: AMap.LngLat,

    extraInfo: {
        name: string,
        functional: boolean,
    }
}

export interface DeviceClickedHandler {
    (event: any, device: Device): void;
}

export interface CylinderZone {
    id: string,
    type: string,
    position: AMap.LngLat,
    radiusInMeter: number,
    heightInMeter: number,
}

export interface CuboidZone {
    id: string,
    type: string,
    position: AMap.LngLat,
    lengthInMeter: number,
    widthInMeter: number,
    heightInMeter: number,
    rotation: number,
}

export interface Airplane {
    position: AMap.LngLat,
    height: number,
    scale: number,
    rotateX: number | null,
    rotateY: number | null,
    rotateZ: number | null,

    extraInfo: {
        name: string,
    }
}

export interface Staff {
    id: string,
    position: AMap.LngLat,

    extraInfo: {
        name: string,
    }
}
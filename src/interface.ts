import "@amap/amap-jsapi-types";

export interface TrackLine {
    positions: AMap.LngLat[],
    heightsInMeter: number[],

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

export interface Zone {
    id: string,
    type: string,
}

export interface CylinderZone extends Zone {
    position: AMap.LngLat,
    radiusInMeter: number,
    heightInMeter: number,
}

export interface CuboidZone extends Zone {
    positions: [AMap.LngLat, AMap.LngLat, AMap.LngLat, AMap.LngLat],
    heightInMeter: number,
}

export interface Airplane {
    position: AMap.LngLat,
    heightInMeter: number,
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
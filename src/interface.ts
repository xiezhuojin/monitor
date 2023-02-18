import "@amap/amap-jsapi-types";

export interface TrackLine {
    positions: AMap.LngLat[],
    heights: number[],

    extraInfo: {
        size: string,
        danger: string,
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
    path: AMap.LngLat[][],
    height: number,
    color: string,
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
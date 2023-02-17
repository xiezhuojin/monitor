import "@amap/amap-jsapi-types";

export interface TrackLine {
    positions: AMap.LngLat[],
    heights: number[],
    extra_info: {
        size: string,
        danger: string,
    }
}

export interface Device {
    id: string,
    type: string,
    position: AMap.LngLat,
    extra_info: {
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

export interface Staff {
    id: string,
    position: AMap.LngLat,
    extra_info: {
        name: string,
    }
}
import "@amap/amap-jsapi-types";

export interface Device {
    id: string,
    name: string,
    type: string,
    position: AMap.LngLat,
    functional: boolean,
}

export interface TrackPoint {
    id: number,
    position: AMap.LngLat,
    altitude: number,
    trackAt: EpochTimeStamp,
}

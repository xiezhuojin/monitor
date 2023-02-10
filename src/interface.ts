import "@amap/amap-jsapi-types";

export interface Device {
    id: string,
    position: AMap.LngLat,
    functional: boolean,
}

export interface Horn extends Device {}
export interface Radar extends Device {}
export interface Camera extends Device {}

export interface TrackPoint {
    id: number,
    position: AMap.LngLat,
    altitude: number,
    trackAt: EpochTimeStamp,
}

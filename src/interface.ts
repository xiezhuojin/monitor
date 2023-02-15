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
    extra_info: {
        size: string,
        danger: string,
    }
}

export interface TrackLine {
    trackPoints: TrackPoint[],
    marker: AMap.LabelMarker,
    head: AMap.Object3D.RoundPoints,
    line: AMap.Object3D.MeshLine,
}

export interface Zone {
    id: string,
    type: string,
    path: AMap.LngLat[][],
    height: number,
    color: string,
}
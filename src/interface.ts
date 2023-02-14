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

export interface TrackLine {
    trackPoints: TrackPoint[],
    marker: AMap.LabelMarker,
    head: AMap.Object3D.RoundPoints,
    line: AMap.Object3D.MeshLine,
}

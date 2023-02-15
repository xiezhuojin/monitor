import "@amap/amap-jsapi-types";
import { CurveInterpolator } from "curve-interpolator"

export function interpolate_path_and_height(path: AMap.LngLat[], height: number[]): [AMap.LngLat[], number[]] {

    let pointSize = Math.min(path.length, height.length);
    let segmentsFactor = 20;
    let segments = pointSize * segmentsFactor;
    let points = [];
    for (let i = 0; i < pointSize; ++i) {
        points.push([path[i].lng, path[i].lat, height[i]]);
    }
    let interpolator = new CurveInterpolator(points, { tension: 0.3 });
    let interpolatedPoints = interpolator.getPoints(segments);
    let newPath = interpolatedPoints.map(((p) => { return new AMap.LngLat(p[0], p[1]) }));
    let newHeight = interpolatedPoints.map((p) => { return p[2] });
    return [newPath, newHeight];
}
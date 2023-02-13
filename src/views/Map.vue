<template>
    <div id="container"></div>
</template>

<script lang="ts">
import "@amap/amap-jsapi-types";
import AMapLoader from "@amap/amap-jsapi-loader"
import { shallowRef } from "@vue/reactivity"
import type { ShallowRef } from "@vue/reactivity"

import type { Horn, Camera, Radar, TrackPoint } from "@/interface"

import hornUp from "@/assets/icons/horn/up.png"
import hornDown from "@/assets/icons/horn/down.png"
import cameraUp from "@/assets/icons/camera/up.png"
import cameraDown from "@/assets/icons/camera/down.png"
import radarUp from "@/assets/icons/radar/up.png"
import radarDown from "@/assets/icons/radar/down.png"

export default {
    props: {
        apiKey: {
            type: String,
            required: true,
        },
    },

    setup() {
        let map: AMap.Map | ShallowRef<null> = shallowRef(null);

        let horns: Map<string, AMap.Marker> = new Map();
        let cameras: Map<string, AMap.Marker> = new Map();
        let radars: Map<string, AMap.Marker> = new Map();

        let tracksLayer: AMap.Object3DLayer | null = null;
        let trackLines: Map<number, [AMap.Object3D.RoundPoints, Map<number, AMap.Object3D.Line>]> = new Map();

        return {
            map,

            horns,
            cameras,
            radars,

            tracksLayer,
            trackLines,
            trackClearIntervalID: 0,
        }
    },

    methods: {
        initMap() {
            AMapLoader.load({
                key: this.apiKey,
                version: "1.4.15",
                plugins: ["AMap.ControlBar", "Map3D"],
            }).then((AMap) => {
                this.tracksLayer = new AMap.Object3DLayer();
                this.map = new AMap.Map("container", {
                    viewMode: "3D",
                    showLabel: false,
                    layers: [
                        new AMap.TileLayer.Satellite(),
                        new AMap.Buildings(),
                        this.tracksLayer,
                    ]
                });
                (this.map as any).addControl(new AMap.ControlBar({
                    showZoomBar: false,
                    position: {
                        right: "10px",
                        bottom: "-80px",
                    },
                }))
            }).catch(e => {
                console.log(e);
                throw e;
            })
        },

        isReady(): boolean {
            return typeof AMap == "object";
        },

        setCenter(center: AMap.LngLat) {
            ((this.map as any) as AMap.Map).setCenter(center);
        },
        setZoom(zoom: number) {
            ((this.map as any) as AMap.Map).setZoom(zoom);
        },
        setZooms(zooms: [number, number]) {
            ((this.map as any) as AMap.Map).setZooms(zooms);
        },
        setPitch(pitch: number) {
            ((this.map as any) as AMap.Map).setPitch(pitch);
        },
        setLimitBounds(LimitBounds: AMap.Bounds) {
            ((this.map as any) as AMap.Map).setLimitBounds(LimitBounds);
        },

        addHornMarker(horn: Horn) {
            if (horn.id in this.horns.keys()) {
                return;
            }
            let icon = horn.functional ? hornUp : hornDown;
            let marker = new AMap.Marker({
                position: horn.position,
                icon,
            });
            ((this.map as any) as AMap.Map).add(marker);
            this.horns.set(horn.id, marker);
        },
        updateHornMarker(horn: Horn) {
            let marker = this.horns.get(horn.id);
            marker?.setPosition([horn.position.lng, horn.position.lat]);
            let icon = horn.functional ? hornUp : hornDown;
            marker?.setIcon(icon);
        },

        addCameraMarker(camera: Camera) {
            if (camera.id in this.cameras.keys()) {
                return;
            }
            let icon = camera.functional ? cameraUp : cameraDown;
            let marker = new AMap.Marker({
                position: camera.position,
                icon,
            });
            ((this.map as any) as AMap.Map).add(marker);
            this.cameras.set(camera.id, marker);
        },
        updateCameraMarker(camera: Camera) {
            let marker = this.cameras.get(camera.id);
            marker?.setPosition([camera.position.lng, camera.position.lat]);
            let icon = camera.functional ? cameraUp : cameraDown;
            marker?.setIcon(icon);
        },

        addRadarMarker(radar: Radar) {
            if (radar.id in this.radars.keys()) {
                return;
            }
            let icon = radar.functional ? radarUp : radarDown;
            let marker = new AMap.Marker({
                position: radar.position,
                icon,
            });
            ((this.map as any) as AMap.Map).add(marker);
            this.radars.set(radar.id, marker);
        },
        updateRadarMarker(radar: Radar) {
            let marker = this.horns.get(radar.id);
            marker?.setPosition([radar.position.lng, radar.position.lat]);
            let icon = radar.functional ? radarUp : radarDown;
            marker?.setIcon(icon);
        },

        showHornMarkers() {
            this.horns.forEach((m) => m.show());
        },
        hideHornMarkers() {
            this.horns.forEach((m) => m.hide());
        },
        showCameraMarkers() {
            this.cameras.forEach((m) => m.show());
        },
        hideCameraMarkers() {
            this.cameras.forEach((m) => m.hide());
        },
        showRadarMarkers() {
            this.radars.forEach((m) => m.show());
        },
        hideRadarMarkers() {
            this.radars.forEach((m) => m.hide());
        },

        updateTracks(trackPoints: TrackPoint[]) {
            trackPoints.forEach((trackPoint) => {
                let coord = (this.map as any).lngLatToGeodeticCoord(trackPoint.position);
                if (!(this.trackLines.has(trackPoint.id))) {
                    let head = new AMap.Object3D.RoundPoints();
                    head.geometry.vertexColors.push(1, 0, 0, 0.6);
                    head.geometry.pointSizes.push(5);
                    head.geometry.vertices.push(coord.x, coord.y, -trackPoint.altitude);
                    this.tracksLayer.add(head);
                    let line = new AMap.Object3D.Line();
                    line.geometry.vertices.push(coord.x, coord.y, -trackPoint.altitude);
                    line.geometry.vertices.push(coord.x, coord.y, -trackPoint.altitude);
                    line.geometry.vertexColors.push(1, 0, 0, 0.6);
                    line.geometry.vertexColors.push(1, 0, 0, 0.6);
                    this.tracksLayer.add(line);
                    let lines = new Map();
                    lines.set(trackPoint.trackAt * 1000, line);
                    this.trackLines.set(trackPoint.id, [head, lines]);
                } else {
                    let item = this.trackLines.get(trackPoint.id);
                    let head = item?.[0];
                    head.geometry.vertices.length = 0;
                    head.geometry.vertices.push(coord.x, coord.y, -trackPoint.altitude);
                    head.needUpdate = true;
                    head.reDraw();
                    let lines = item?.[1];
                    let trackAts = Array.from(lines.keys());
                    let lastLine = lines?.get(trackAts[trackAts.length - 1]);
                    let lastLineX = lastLine.geometry.vertices[lastLine.geometry.vertices.length - 3];
                    let lastLineY = lastLine.geometry.vertices[lastLine.geometry.vertices.length - 2];
                    let lastLineZ = lastLine.geometry.vertices[lastLine.geometry.vertices.length - 1];
                    let line = new AMap.Object3D.Line();
                    line.geometry.vertexColors.push(1, 0, 0, 0.6);
                    line.geometry.vertices.push(lastLineX, lastLineY, lastLineZ);
                    line.geometry.vertices.push(coord.x, coord.y, -trackPoint.altitude);
                    line.geometry.vertexColors.push(1, 0, 0, 0.6);
                    line.geometry.vertexColors.push(1, 0, 0, 0.6);
                    this.tracksLayer.add(line);
                    lines?.set(trackPoint.trackAt * 1000, line);
                }
            })
        },
        clearObsoletedTrack(timeout: number) {
            let trackLinesToDeleteIDs = [];
            let now = new Date().getTime();
            for (let [id, [_, lines]] of this.trackLines) {
                let lineToDeleteIDs = [];
                for (let [trackAt, _] of lines) {
                    console.log(now, trackAt);
                    if (now - trackAt > timeout) {
                        lineToDeleteIDs.push(trackAt);
                    }
                }
                for (let lineToDeleteID of lineToDeleteIDs) {
                    this.tracksLayer.remove(lines.get(lineToDeleteID));
                    lines.delete(lineToDeleteID);
                }
                if (lines.size == 0) {
                    trackLinesToDeleteIDs.push(id);
                }
            }
            for (let trackLinesToDeleteID of trackLinesToDeleteIDs) {
                let head = this.trackLines.get(trackLinesToDeleteID)?.[0];
                this.tracksLayer.remove(head);
                this.trackLines.delete(trackLinesToDeleteID);
            }
            this.updateTracks([]);
        },
        setTrackClearInterval(timeout: number) {
            if (this.trackClearIntervalID != 0) {
                clearInterval(this.trackClearIntervalID);
            }
            this.trackClearIntervalID = setInterval(this.clearObsoletedTrack, 1000, timeout);
        },
    },

    mounted() {
        this.initMap();
    },

    unmounted() {
        if (this.trackClearIntervalID != 0) {
            clearInterval(this.trackClearIntervalID);
        }
    },

}
</script>

<style scope>
#container {
    height: 100vh;
}

.amap-logo {
    opacity: 0;
}

.amap-copyright {
    opacity: 0;
}
</style>

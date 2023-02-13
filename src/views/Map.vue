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
        let trackLines: Map<number, TrackPoint[]> = new Map();

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
            trackPoints.forEach((tp) => {
                if (!(this.trackLines.has(tp.id))) {
                    this.trackLines.set(tp.id, []);
                }
                this.trackLines.get(tp.id)?.push(tp);
            })
            this.tracksLayer.clear();
            this.trackLines.forEach((trackPoints) => {
                let head = new AMap.Object3D.RoundPoints();
                let lastTrackPoint = trackPoints[trackPoints.length - 1];
                let center = (this.map as any).lngLatToGeodeticCoord(lastTrackPoint.position);
                head.geometry.vertices.push(center.x, center.y, lastTrackPoint.altitude);
                head.geometry.pointSizes.push(5);
                head.geometry.vertexColors.push(1, 0, 0, 0.5);
                this.tracksLayer.add(head);
                let line = new AMap.Object3D.MeshLine({
                    path: trackPoints.map((trackPoint) => trackPoint.position),
                    height: trackPoints.map((trackPoint) => trackPoint.altitude),
                    width: 1,
                    color: "#ffff00",
                })
                this.tracksLayer.add(line);
            })
        },
        clearObsoletedTrack(timeout: number) {
            let newTrackLines = new Map();
            let now = new Date().getTime();
            this.trackLines.forEach((trackPoints, _) => {
                let filterTrackPoints = trackPoints.filter((trackPoint) => {
                    return now - trackPoint.trackAt * 1000 <= timeout;
                })
                if (filterTrackPoints.length > 0) {
                    newTrackLines.set(_, filterTrackPoints);
                }
            });
            this.trackLines = newTrackLines;
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

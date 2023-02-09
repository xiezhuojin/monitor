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
import { assert } from "@vue/compiler-core";

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
        let trackHeads: AMap.Object3D.Points | null = null;
        let trackLines: Map<number, [AMap.Object3D.MeshLine, TrackPoint[]]> = new Map();

        return {
            map,

            horns,
            cameras,
            radars,

            tracksLayer,
            trackHeads,
            trackLines,
            trackClearIntervalID: 0,
        }
    },

    methods: {
        initMap() {
            AMapLoader.load({
                key: this.apiKey,
                version: "2.0",
                plugins: ["AMap.ControlBar"]
            }).then((AMap) => {
                this.map = new AMap.Map("container", {
                    viewMode: "3D",
                    showLabel: false,
                });
                (this.map as any).addControl(new AMap.ControlBar({
                    position: {
                        right: "10px",
                        bottom: "10px"
                    }
                }))
                this.tracksLayer = new AMap.Object3DLayer();
                this.trackHeads = new AMap.Object3D.Points();
                ((this.map as any) as AMap.Map).add(this.tracksLayer);
            }).catch(e => {
                console.log(e);
                throw e;
            })
        },

        setCenter(center: AMap.LngLat) {
            assert(this.map != null);
            ((this.map as any) as AMap.Map).setCenter(center);
        },
        setZoom(zoom: number) {
            assert(this.map != null);
            ((this.map as any) as AMap.Map).setZoom(zoom);
        },
        setZooms(zooms: [number, number]) {
            assert(this.map != null);
            ((this.map as any) as AMap.Map).setZooms(zooms);
        },
        setPitch(pitch: number) {
            assert(this.map != null);
            ((this.map as any) as AMap.Map).setPitch(pitch);
        },
        updateLimitBounds(LimitBounds: AMap.Bounds) {
            assert(this.map != null);
            ((this.map as any) as AMap.Map).setLimitBounds(LimitBounds);
        },

        addHornMarker(horn: Horn) {
            assert(this.map != null);
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
            assert(this.map != null);
            let marker = this.horns.get(horn.id);
            marker?.setPosition([horn.position.lng, horn.position.lat]);
            let icon = horn.functional ? hornUp : hornDown;
            marker?.setIcon(icon);
        },

        addCameraMarker(camera: Camera) {
            assert(this.map != null);
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
            assert(this.map != null);
            let marker = this.cameras.get(camera.id);
            marker?.setPosition([camera.position.lng, camera.position.lat]);
            let icon = camera.functional ? cameraUp : cameraDown;
            marker?.setIcon(icon);
        },

        addRadarMarker(radar: Radar) {
            assert(this.map != null);
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
            assert(this.map != null);
            let marker = this.horns.get(radar.id);
            marker?.setPosition([radar.position.lng, radar.position.lat]);
            let icon = radar.functional ? radarUp : radarDown;
            marker?.setIcon(icon);
        },

        showHorns() {
            assert(this.map != null);
            this.horns.forEach((m) => m.show());
        },
        hideHorns() {
            assert(this.map != null);
            this.horns.forEach((m) => m.hide());
        },
        showCameras() {
            assert(this.map != null);
            this.cameras.forEach((m) => m.show());
        },
        hideCameras() {
            assert(this.map != null);
            this.cameras.forEach((m) => m.hide());
        },
        showRadars() {
            assert(this.map != null);
            this.radars.forEach((m) => m.show());
        },
        hideRadars() {
            assert(this.map != null);
            this.radars.forEach((m) => m.hide());
        },

        updateTracks(trackPoints: TrackPoint[]) {
            assert(this.map != null);
            trackPoints.forEach((tp) => {
                if (!(tp.id in this.trackLines.keys())) {
                    let line = new AMap.Object3D.MeshLine();
                    this.trackLines.set(tp.id, [line, []]);
                    this.tracksLayer.add(line);
                }
                this.trackLines.get(tp.id)?.[1].push(tp);
                let item = this.trackLines.get(tp.id);
                let path = item?.[1].map((tp) => tp.position);
                let height = item?.[1].map((tp) => tp.altitude)
                item?.[0].setPath(path);
                item?.[0].setHeight(height);
            })
            let vertices = Array.from(this.trackLines.values())
                .map((items) => {
                    if (items[1].length == 0) {
                        return null;
                    }
                    let tp = items[1].slice(-1)[0];
                    return [tp.position.lng, tp.position.lat, tp.altitude];
                })
                .filter((item) => item == null);
            this.trackHeads.vertices = vertices;
            this.tracksLayer.reDraw()
        },
        clearObsoletedTrack(timeout: number) {
            let now = new Date().getTime();
            this.trackLines.forEach((items) => {
                items[1] = items[1].filter((tp) => now - tp.trackAt <= timeout);
            })
            this.trackLines = new Map(Array.from(this.trackLines)
                .filter(([key, value]) => value[1].length > 0)
                .map(([k, v]) => [k, v]));
            this.updateTracks([]);
        },
        setTrackClearInterval(timeout: number) {
            if (this.trackClearIntervalID != 0) {
                clearInterval(this.trackClearIntervalID);
            }
            this.trackClearIntervalID = setInterval(this.clearObsoletedTrack, timeout);
        },
    },

    mounted() {
        (window as any)["map"] = this;
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

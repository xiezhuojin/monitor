<template>
    <div id="container"></div>
</template>

<script lang="ts">
import "@amap/amap-jsapi-types";
import AMapLoader from "@amap/amap-jsapi-loader"
import { shallowRef } from "@vue/reactivity"
import type { ShallowRef } from "@vue/reactivity"

import type { Device, TrackPoint } from "@/interface"

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

        let devices: Map<DeviceType, Map<string, AMap.Marker>> = new Map();

        let tracksLayer: AMap.Object3DLayer | null = null;
        let trackLines: Map<number, [TrackPoint[], AMap.Object3D.RoundPoints, AMap.Object3D.MeshLine]> = new Map();

        return {
            map,

            devices,

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

        getDeviceMarkerIcon(device: Device): string | undefined {
            switch (device.type) {
                case "horn":
                    return device.functional? hornUp: hornDown;
                case "camera":
                    return device.functional? cameraUp: cameraDown;
                case "radar":
                    return device.functional? radarUp: radarDown;
            }
        },
        getDeviceMarkerLabelContent(device: Device): string {
            return device.name;
        },

        addDevice(device: Device) {
            if (!(device.type in this.devices)) {
                this.devices.set(device.type, new Map());
            }
            if (device.id in (this.devices.get(device.type) as any).keys()) {
                return;
            }
            let icon = this.getDeviceMarkerIcon(device);
            let labelContent = this.getDeviceMarkerLabelContent(device);
            let marker = new AMap.Marker({
                position: device.position,
                icon,
                label: {
                    content: labelContent,
                    direction: "top",
                    offset: new AMap.Pixel(0,-5),
                }
            });
            ((this.map as any) as AMap.Map).add(marker);
            AMap.event.addListener(marker, "click", () => {
                console.log("clicked");
            });
            this.devices.get(device.type)?.set(device.id, marker);
        },
        updateDevice(device: Device) {
            let marker = this.devices.get(device.type)?.get(device.id);
            marker?.setPosition([device.position.lng, device.position.lat]);
            let icon = this.getDeviceMarkerIcon(device);
            let labelContent = this.getDeviceMarkerLabelContent(device);
            marker?.setIcon(icon);
            marker?.setLabel({
                content: labelContent,
                direction: "top",
                offset: new AMap.Pixel(0,-5),
            })
        },

        showDevicesByType(type: string) {
            let devices = this.devices.get(type);
            if (devices) {
                for (let marker of devices.values()) {
                    marker.show();
                }
            }
        },
        hideDevicesByType(type: string) {
            let devices = this.devices.get(type);
            if (devices) {
                for (let marker of devices.values()) {
                    marker.hide();
                }
            }
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
                    let line = new AMap.Object3D.MeshLine({
                        path: [trackPoint.position,],
                        height: [trackPoint.altitude,],
                        width: 1,
                        color: "#ffff00",
                    });
                    this.tracksLayer.add(line);
                    this.trackLines.set(trackPoint.id, [[trackPoint,], head, line]);
                } else {
                    let item = this.trackLines.get(trackPoint.id);
                    let lineTrackLines = item?.[0];
                    lineTrackLines?.push(trackPoint);
                    let head = item?.[1];
                    head.geometry.vertices.length = 0;
                    head.geometry.vertices.push(coord.x, coord.y, -trackPoint.altitude);
                    head.needUpdate = true;
                    head.reDraw();
                    let line = item?.[2];
                    let path = lineTrackLines?.map((trackPoint) => { return trackPoint.position });
                    let height = lineTrackLines?.map((trackPoint) => { return trackPoint.altitude });
                    line.setPath(path);
                    line.setHeight(height);
                }
            })
        },
        clearObsoletedTrack(timeout: number) {
            let now = new Date().getTime();
            for (let item of this.trackLines.values()) {
                item[0] = item[0].filter((trackPoint) => {
                    return now - trackPoint.trackAt * 1000 <= timeout;
                })
            }
            let toDeleteTrackLineIDs = [];
            for (let [id, item] of this.trackLines) {
                if (item[0].length == 0) {
                    toDeleteTrackLineIDs.push(id);
                }
            }
            for (let toDeleteTrackLineID of toDeleteTrackLineIDs) {
                let item = this.trackLines.get(toDeleteTrackLineID);
                let head = item?.[1];
                this.tracksLayer.remove(head);
                let line = item?.[2];
                this.tracksLayer.remove(line);
                this.trackLines.delete(toDeleteTrackLineID);
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

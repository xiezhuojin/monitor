<template>
    <div id="container"></div>
</template>

<script lang="ts">
import "@amap/amap-jsapi-types";
import AMapLoader from "@amap/amap-jsapi-loader"
import { shallowRef } from "@vue/reactivity"
import type { ShallowRef } from "@vue/reactivity"

import type { Device, TrackPoint, TrackLine } from "@/interface"
import { getDeviceMarkerIcon } from "@/utils/marker"

export default {
    props: {
        apiKey: {
            type: String,
            required: true,
        },
    },

    setup() {
        let map: AMap.Map | ShallowRef<null> = shallowRef(null);

        let devices: Map<string, Map<string, AMap.Marker>> = new Map();

        let track3DLayer: AMap.Object3DLayer | null = null;
        let trackLines: Map<number, TrackLine> = new Map();

        return {
            map,

            devices,

            track3DLayer,
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
                this.track3DLayer = new AMap.Object3DLayer();
                this.map = new AMap.Map("container", {
                    viewMode: "3D",
                    showLabel: false,
                    layers: [
                        new AMap.TileLayer.Satellite(),
                        new AMap.Buildings(),
                        this.track3DLayer,
                    ]
                });
                (this.map as any).addControl(new AMap.ControlBar({
                    showZoomBar: false,
                    position: {
                        right: "10px",
                        bottom: "-80px",
                    },
                }));
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

        addDevice(device: Device) {
            if (!(device.type in this.devices)) {
                this.devices.set(device.type, new Map());
            }
            if (device.id in (this.devices.get(device.type) as any).keys()) {
                return;
            }
            let icon = getDeviceMarkerIcon(device);
            let marker = new AMap.Marker({
                position: device.position,
                icon,
                label: {
                    content: device.name,
                    direction: "top",
                    offset: new AMap.Pixel(0,-5),
                }
            });
            ((this.map as any) as AMap.Map).add(marker);
            AMap.event.addListener(marker, "click", () => {
                this.deviceClickedHandler(device);
            });
            this.devices.get(device.type)?.set(device.id, marker);
        },
        updateDevice(device: Device) {
            let marker = this.devices.get(device.type)?.get(device.id);
            marker?.setPosition([device.position.lng, device.position.lat]);
            let icon = getDeviceMarkerIcon(device);
            marker?.setIcon(icon);
            marker?.setLabel({
                content: device.name,
                direction: "top",
                offset: new AMap.Pixel(0,-5),
            })
        },

        setDeviceVisibilityByType(type: string, visibility: boolean) {
            let devices = this.devices.get(type);
            if (devices) {
                for (let marker of devices.values()) {
                    visibility? marker.show(): marker.hide();
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
                    this.track3DLayer.add(head);
                    let line = new AMap.Object3D.MeshLine({
                        path: [trackPoint.position,],
                        height: [trackPoint.altitude,],
                        width: 1,
                        color: "#ffff00",
                    });
                    this.track3DLayer.add(line);
                    this.trackLines.set(trackPoint.id, {
                        trackPoints: [trackPoint,],
                        head,
                        line
                    });
                } else {
                    let trackLine = this.trackLines.get(trackPoint.id);
                    let trackPoints = trackLine?.trackPoints;
                    trackLine?.trackPoints?.push(trackPoint);
                    let head = trackLine?.head;
                    head.geometry.vertices.length = 0;
                    head.geometry.vertices.push(coord.x, coord.y, -trackPoint.altitude);
                    head.needUpdate = true;
                    head.reDraw();
                    let line = trackLine?.line;
                    let path = trackPoints?.map((trackPoint) => { return trackPoint.position });
                    let height = trackPoints?.map((trackPoint) => { return trackPoint.altitude });
                    line.setPath(path);
                    line.setHeight(height);
                }
            })
        },
        clearObsoletedTrack(timeout: number) {
            let now = new Date().getTime();
            for (let trackLine of this.trackLines.values()) {
                trackLine.trackPoints = trackLine.trackPoints.filter((trackPoint) => {
                    return now - trackPoint.trackAt * 1000 <= timeout;
                })
            }
            let toDeleteTrackLineIDs = [];
            for (let [id, trackLine] of this.trackLines) {
                if (trackLine.trackPoints.length == 0) {
                    toDeleteTrackLineIDs.push(id);
                }
            }
            for (let toDeleteTrackLineID of toDeleteTrackLineIDs) {
                let trackLine = this.trackLines.get(toDeleteTrackLineID);
                this.track3DLayer.remove(trackLine?.head);
                this.track3DLayer.remove(trackLine?.line);
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

        deviceClickedHandler(device: Device) {
            
        }
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

.amap-marker-label {
    background: #f0f0f0;
    color: #3c3c3c;
    opacity: 0.8;
    border: none;
    border-radius: 25%;
}

.amap-icon img {
    background-color: #f0f0f0;
    padding: 4px;
    opacity: 0.8;
    border-radius: 25%;
}
</style>

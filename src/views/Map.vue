<template>
    <div id="container"></div>
</template>

<script lang="ts">
import type { PropType } from "vue"
import "@amap/amap-jsapi-types";
import AMapLoader from "@amap/amap-jsapi-loader"
import { shallowRef } from "@vue/reactivity"

import type { Position, Horn, Camera, Radar } from "@/interface"
import { WorkStatus } from "@/interface"

import hornUp from "@/assets/icons/horn/up.png"
import hornDown from "@/assets/icons/horn/down.png"
import cameraUp from "@/assets/icons/camera/up.png"
import cameraDown from "@/assets/icons/camera/down.png"
import radarUp from "@/assets/icons/radar/up.png"
import radarDown from "@/assets/icons/radar/down.png"

export default {
    setup() {
        const map: any = shallowRef(null);
        // let hornGroup = new AMap.OverlayGroup();
        // let cameraGroup = new AMap.OverlayGroup();
        // let radarGroup = new AMap.OverlayGroup();

        return {
            map,
            // hornGroup,
            // cameraGroup,
            // radarGroup,
        }
    },

    props: {
        apiKey: {
            type: String,
            required: true,
        },
        zoom: {
            type: Number,
            required: true,
        },
        center: {
            type: Object as PropType<Position>,
            required: true,
        },
        pitch: {
            type: Number,
        },
        limitBounds: {
            type: Array<Position>,
        },

        show_horns: {
            type: Boolean,
            required: true,
        },
        show_cameras: {
            type: Boolean,
            required: true,
        },
        show_radars: {
            type: Boolean,
            required: true,
        },
        horns: {
            type: Array<Horn>,
        },
        cameras: {
            type: Array<Camera>,
        },
        radars: {
            type: Array<Radar>,
        },
    },

    watch: {
        zoom(newZoom, oldZoom) {
            this.updateZoom(newZoom);
        },
        center(newCenter, oldCenter) {
            this.updateCenter(newCenter);
        },
        pitch(newPitch, oldPitch) {
            this.updatePitch(newPitch);
        },
        limitBounds(newLimitBounds, oldLimitBounds) {
            this.updateLimitBounds(newLimitBounds);
        },

        show_horns(new_show, old_show) {
            this.updateShowHorns(new_show);
        },
        show_cameras(new_show, old_show) {
            this.updateShowCameras(new_show);
        },
        show_radars(new_show, old_show) {
            this.updateShowRadars(new_show);
        },
        // horns(newHorns, oldHorns) {
        //     this.updateHorns(newHorns);
        // },
        // cameras(newCameras, oldCamera) {
        //     this.updateCameras(newCameras);
        // },
        // radars(newRadars, oldRadars) {
        //     this.updateRadars(newRadars);
        // }
    },

    methods: {
        init() {
            AMapLoader.load({
                key: this.apiKey,
                version: "2.0",
                plugins: ["AMap.ControlBar"]
            }).then((AMap) => {
                this.map = new AMap.Map("container", {
                    viewMode: "3D",
                    showLabel: false,
                });
                this.map.addControl(new AMap.ControlBar({
                    position: {
                        right: "10px",
                        bottom: "10px"
                    }
                }))
                this.map.add(this.hornGroup);
                this.map.add(this.cameraGroup);
                this.map.add(this.radarGroup);
            }).catch(e => {
                console.log(e);
            })
        },

        updateCenter(center: Position) {
            this.map.setCenter([center.lng, center.lat]);
        },
        updateZoom(zoom: Number) {
            this.map.setZoom(zoom);
        },
        updatePitch(pitch: Number) {
            this.map.setPitch(pitch);
        },
        updateLimitBounds(LimitBounds: Array<Position>) {
            this.map.setLimitBounds(LimitBounds);
        },

        updateShowHorns(show: Boolean) {
            if (show) {
                this.map.show(this.hornGroup);
            } else {
                this.map.hide(this.hornGroup);
            }
        },
        updateShowCameras(show: Boolean) {
            if (show) {
                this.map.show(this.cameraGroup);
            } else {
                this.map.hide(this.cameraGroup);
            }
        },
        updateShowRadars(show: Boolean) {
            if (show) {
                this.map.show(this.radarGroup);
            } else {
                this.map.hide(this.radarGroup);
            }
        },
        updateHorns(horns: Array<Horn>) {
            let overlayToAdd = horns.length - this.hornGroup.getOverlays().length;
            for (let i = 0; i < overlayToAdd; ++i) {
                this.hornGroup.addOverlay(new AMap.Marker());
            }
            let overlays = this.hornGroup.getOverlays();
            for (let [horn, marker] of Array.from(horns, (horn, i) => [horn, overlays[i]])) {
                let image = horn.workStatus == WorkStatus.Functional? hornUp: hornDown;
                marker.setPosition([horn.position.lng, horn.position.lat]);
                marker.setIcon(new AMap.Icon({image}));
            }
            
        },
        updateCameras(cameras: Array<Camera>) {
            let overlayToAdd = cameras.length - this.cameraGroup.getOverlays().length;
            for (let i = 0; i < overlayToAdd; ++i) {
                this.cameraGroup.addOverlay(new AMap.Marker());
            }
            let overlays = this.cameraGroup.getOverlays();
            for (let [camera, marker] of Array.from(cameras, (horn, i) => [horn, overlays[i]])) {
                let image = camera.workStatus == WorkStatus.Functional? cameraUp: cameraDown;
                marker.setPosition([camera.position.lng, camera.position.lat]);
                marker.setIcon(new AMap.Icon({image}));
            }
        },
        updateRadars(radars: Array<Radar>) {
            let overlayToAdd = radars.length - this.radarGroup.getOverlays().length;
            for (let i = 0; i < overlayToAdd; ++i) {
                this.radarGroup.addOverlay(new AMap.Marker());
            }
            let overlays = this.radarGroup.getOverlays();
            for (let [radar, marker] of Array.from(radars, (horn, i) => [horn, overlays[i]])) {
                let image = radar.workStatus == WorkStatus.Functional? radarUp: radarDown;
                marker.setPosition([radar.position.lng, radar.position.lat]);
                marker.setIcon(new AMap.Icon({image}));
            }
        },
    },

    mounted() {
        this.init();
    }
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

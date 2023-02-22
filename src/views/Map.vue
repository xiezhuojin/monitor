<template>
    <div id="container">
        <div id="map"></div>
    </div>
</template>

<script lang="ts">
import { shallowRef } from "@vue/reactivity"
import type { ShallowRef } from "@vue/reactivity"
import type { PropType } from "vue"
import AMapLoader from "@amap/amap-jsapi-loader"

import "@amap/amap-jsapi-types";

import { TrackLines, Devices, Zones, Airplanes, Staffs } from "@/class";
import type { DeviceClickedHandler } from "@/interface";

export default {
    props: {
        apiKey: {
            type: String,
            required: true,
        },
        deviceClickedHandler: {
            type: Function as PropType<DeviceClickedHandler>,
            required: true,
        }
    },

    setup() {
        let isMapReady = false;

        let map: AMap.Map | ShallowRef<null> = shallowRef(null);
        let trackLines: TrackLines | null = null;
        let devices: Devices | null = null;
        let zones: Zones | null = null;
        let staffs: Staffs | null = null;
        let airplanes: Airplanes | null = null;

        return {
            isMapReady,

            map,
            trackLines,
            devices,
            zones,
            staffs,
            airplanes,
        }
    },

    methods: {
        initMap() {
            AMapLoader.load({
                key: this.apiKey,
                version: "1.4.15",
                plugins: ["AMap.ControlBar", "Map3D", "AMap.GltfLoader"],
            }).then((AMap) => {
                this.map = new AMap.Map("map", {
                    viewMode: "3D",
                    showLabel: false,
                    layers: [
                        new AMap.TileLayer.Satellite(),
                        new AMap.Buildings({ heightFactor: 1 }),
                    ]
                });
                (this.map as any).addControl(new AMap.ControlBar({
                    showZoomBar: false,
                    position: {
                        right: "22%",
                        bottom: "70%",
                    },
                }));

                let coord_1 = (this.map as any).lngLatToGeodeticCoord(new AMap.LngLat(0, 0));
                let coord_2 = (this.map as any).lngLatToGeodeticCoord(new AMap.LngLat(0, 0.00001));
                let mapProportion = Math.sqrt(
                    Math.pow((coord_2.x - coord_1.x), 2) + Math.pow((coord_2.y - coord_1.y), 2)
                ) / 1.05;

                (this.trackLines as any) = new TrackLines(this.map as any, mapProportion);
                (this.devices as any) = new Devices(this.map as any, this.deviceClickedHandler);
                (this.zones as any) = new Zones(this.map as any, mapProportion);
                (this.staffs as any) = new Staffs(this.map as any);
                (this.airplanes as any) = new Airplanes(this.map as any, mapProportion);

                this.isMapReady = true;
            }).catch(e => {
                console.log(e);
                throw e;
            })
        },

        isReady() {
            return this.isReady;
        }
    },

    mounted() {
        this.initMap();
    },

}
</script>

<style scope>
#container {
    height: 100vh;
}

#map {
    height: 100%;
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

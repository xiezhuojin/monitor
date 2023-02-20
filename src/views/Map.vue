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

// import airplaneGltf from "@/assets/models/airplane/airplane.gltf?url";
const airplaneGltf = "https://a.amap.com/jsapi_demos/static/gltf/Duck.gltf"

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
        let map: AMap.Map | ShallowRef<null> = shallowRef(null);
        let trackLines: TrackLines | null = null;
        let devices: Devices | null = null;
        let zones: Zones | null = null;
        let staffs: Staffs | null = null;
        let airplanes: Airplanes | null = null;

        let isMapReady = false;
        let isAirplaneModelReady = false;

        return {
            isMapReady,
            isAirplaneModelReady,

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
                        right: "16px",
                        bottom: "-80px",
                    },
                }));
                (this.trackLines as any) = new TrackLines(this.map as any);
                (this.devices as any) = new Devices(this.map as any, this.deviceClickedHandler);
                (this.zones as any) = new Zones(this.map as any);
                (this.staffs as any) = new Staffs(this.map as any);
                (this.airplanes as any) = new Airplanes((this.map as any));
                let gltfLoader = new AMap.GltfLoader();
                gltfLoader.load(airplaneGltf, (airplaneModel: any) => {
                    (this.airplanes as any).setAirplaneModel(airplaneModel);
                    this.isAirplaneModelReady = true;
                });
                this.isMapReady = true;
            }).catch(e => {
                console.log(e);
                throw e;
            })
        },

        isReady() {
            return this.isMapReady && this.isAirplaneModelReady;
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

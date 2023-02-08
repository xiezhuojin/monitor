<template>
    <div id="container"></div>
</template>

<script>
import AMapLoader from "@amap/amap-jsapi-loader"
import { shallowRef } from '@vue/reactivity'

export default {
    setup() {
        const map = shallowRef(null);
        const mapController = shallowRef(null);
        return {
            map,
            mapController,
        }
    },

    props: {
        apiKey: String,

        zoom: Number,
        center: Array,
    },

    watch: {
        zoom(new_zoom) {
            this.updateZoom(new_zoom);
        },
        center(new_center) {
            this.updateCenter(new_center);
        }
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
                    zoom: this.zoom,
                    center: this.center,
                });
                this.map.addControl(new AMap.ControlBar({
                    position: {
                        right: "10px",
                        bottom: "10px"
                    }
                }))
            }).catch(e => {
                console.log(e);
            })
        },

        updateCenter(center) {
            this.map.setCenter(center);
        },
        updateZoom(zoom) {
            this.map.setZoom(zoom);
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

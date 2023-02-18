<template>
  <MapView ref="map" :apiKey="'09def6871055e70fc8177a8282634716'" :deviceClickedHandler="deviceClickedHandler">
  </MapView>
</template>

<script lang="ts">
import MapView from "./views/Map.vue"

import type { Device } from "./interface";

export default ({
  components: {
    MapView,
  },

  methods: {
    start() {
      const channel = new WebSocket("ws://localhost:9000");
      channel.addEventListener("message", (event) => {
        eval(event.data);
      })
    },

    deviceClickedHandler(event: any, device: Device) {
      console.log("clicked");
    }
  },

  mounted() {
    (window as any).app = this;
    let checkIsReadyIntervalID = setInterval(() => {
      if ((this.$refs as any).map.isReady()) {
        clearInterval(checkIsReadyIntervalID);
        this.start();
      }
    }, 1000);
  },

})
</script>

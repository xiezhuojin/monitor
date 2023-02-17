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
    isReady(): boolean {
      for (const _ in this.$refs) {
        if (!(this.$refs as any)[_].isReady) {
          return false;
        }
      }
      return true;
    },

    start() {
      const channel = new WebSocket("ws://localhost:9000");
      channel.addEventListener("message", (event) => {
        eval(event.data);
      })
    },

    deviceClickedHandler(event: any, device: Device) {
      console.log(device.extra_info.name);
    }
  },

  mounted() {
    (window as any).app = this;
    let checkIsReadyIntervalID = setInterval(() => {
      if (this.isReady()) {
        clearInterval(checkIsReadyIntervalID);
        this.start();
      }
    }, 1000);
  },

})
</script>

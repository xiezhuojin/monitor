<template>
  <MapView ref="map" :apiKey="'09def6871055e70fc8177a8282634716'">
  </MapView>
</template>

<script lang="ts">
import MapView from "./views/Map.vue"

export default ({
  components: {
    MapView,
  },

  methods: {
    isReady(): boolean {
      for (const _ in this.$refs) {
        if (!(this.$refs as any)[_].isReady()) {
          return false;
        }
      }
      return true;
    },

    start() {
      const channel = new WebSocket("ws://localhost:9000");
      channel.addEventListener("message", (event) => {
        this.handleEvent(event.data);
      })
    },
    handleEvent(command: string) {
      eval(command);
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

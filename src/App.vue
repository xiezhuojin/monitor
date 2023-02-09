<template>
  <MapView :apiKey="'09def6871055e70fc8177a8282634716'">
  </MapView>
</template>

<script lang="ts">
import MapView from "./views/Map.vue"

export default ({
  components: {
    MapView,
  },
})
</script>

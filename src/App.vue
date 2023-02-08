<template>
  <MapView :apiKey="'09def6871055e70fc8177a8282634716'" :zoom="17" :center="[113.306646, 23.383148]">
  </MapView>
</template>

<script>
import MapView from "./views/Map.vue"

export default ({
  components: {
    MapView,
  },
})
</script>

<template>
  <MapView :apiKey="'09def6871055e70fc8177a8282634716'" :zoom="14.5" :center="{ lng: 113.306646, lat: 23.383148 }"
    :horns="[{id: '123', position: {lng: 113.306646, lat: 23.383148}, functional: true}]">
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

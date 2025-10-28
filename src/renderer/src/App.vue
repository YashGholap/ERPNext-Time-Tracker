<script setup>
import { onMounted } from 'vue'
import SplashScreen from './components/pages/SplashScreen.vue'
import { isLoading, hideLoader } from './stores/loader'

// Show splash for 2 seconds on startup
onMounted(() => {
  setTimeout(() => hideLoader(), 3000)
})
</script>

<template>
  <!-- Splash Screen (shows during welcome and any global loading) -->
  <SplashScreen :visible="isLoading" />

  <!-- Main App (hidden while splash/loading active) -->
  <RouterView v-show="!isLoading" />
</template>

<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 flex items-center justify-center bg-white/70 backdrop-blur-lg z-[9999]"
    >
      <img
        src="../../assets/Track-Time-logo.png"
        alt="App Logo"
        class="w-24 h-24 animate-fade-scale"
      />
    </div>
  </transition>
</template>

<script setup>
defineProps({
  visible: Boolean,
})
</script>

<style scoped>
/* Fade in/out for the whole splash */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Subtle scale + fade for the logo */
@keyframes fadeScale {
  0% {
    opacity: 0;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-scale {
  animation: fadeScale 1.2s ease forwards;
}
</style>

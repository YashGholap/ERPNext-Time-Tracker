<script setup>
defineProps({
    variant: { type: String, default: 'primary' },
})
</script>
<template>
    <button
    :class="[
      'px-4 py-2 rounded-lg font-medium transition text-sm',
      variant === 'primary' ? 'bg-blue-500 text-white hover:bg-blue-600' : '',
      variant === 'outline' ? 'border border-gray-300 text-gray-700 hover:bg-gray-100' : '',
    ]"
  >
    <slot />
  </button>
</template>
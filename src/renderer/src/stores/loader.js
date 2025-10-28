// src/stores/loader.js
import { ref } from 'vue'

export const isLoading = ref(true)

export function showLoader() {
  isLoading.value = true
}

export function hideLoader() {
  isLoading.value = false
}

<script setup>
import { ref, onMounted } from 'vue'
import { Clock } from 'lucide-vue-next'
import { useRouter } from "vue-router"

const serverUrl = ref('')
const apiKey = ref('')
const apiSecret = ref('')
const loading = ref(false)
const error = ref(null)
const success = ref(null)

const router = useRouter()

// Load saved credentials
onMounted(async () => {
  const creds = await window.api.getCredentials()
  if (creds) {
    serverUrl.value = creds.serverUrl
    apiKey.value = creds.apiKey
    apiSecret.value = creds.apiSecret
  }
})

const saveSettings = async () => {
  error.value = null
  success.value = null

  if (!serverUrl.value || !apiKey.value || !apiSecret.value) {
    error.value = 'All fields are required'
    return
  }

  loading.value = true
  try {
    await window.api.saveCredentials(serverUrl.value, apiKey.value, apiSecret.value)
    success.value = '✅ Settings saved'
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message || 'Failed to save settings'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
    <div class="w-full max-w-md space-y-6">
      <!-- Title -->
      <div class="text-center">
        <Clock class="w-12 h-12 text-black mx-auto mb-3" />
        <h1 class="text-3xl font-bold text-gray-900">Time-Tracker Settings</h1>
      </div>

      <!-- Subtitle -->
      <div class="text-center">
        <p class="text-lg text-gray-900 mt-2 mb-2">Let's setup</p>
      </div>

      <!-- Card -->
      <div class="bg-white shadow rounded-2xl p-8 space-y-5">
        <input 
          v-model="serverUrl" 
          type="text" 
          placeholder="ERPNext Server URL" 
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
        />
        <input 
          v-model="apiKey" 
          type="text" 
          placeholder="API Key" 
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
        />
        <input 
          v-model="apiSecret" 
          type="text" 
          placeholder="API Secret" 
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black"
        />

        <!-- Messages -->
        <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
        <p v-if="success" class="text-green-500 text-sm text-center">{{ success }}</p>

        <!-- Save Button -->
        <button 
          @click="saveSettings" 
          :disabled="loading" 
          class="w-full bg-black text-white py-2 rounded-md font-medium hover:bg-gray-800 transition disabled:opacity-50"
        >
          {{ loading ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>
    </div>
  </div>
</template>

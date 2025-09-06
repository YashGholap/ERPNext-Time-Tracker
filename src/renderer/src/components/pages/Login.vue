<script setup>
import { ref } from "vue"
import { Clock } from "lucide-vue-next"

const serverUrl = ref("")
const username = ref("")
const password = ref("")
const loading = ref(false)
const error = ref(null)

const doLogin = async () => {
  error.value = null
    if (!serverUrl.value.trim() || !username.value.trim() || !password.value.trim()) {
    error.value = "Please fill in all fields (Server URL, Username, Password)."
    return
  }
  loading.value = true
  try {
    const res = await window.api.login(serverUrl.value, username.value, password.value)
    if (res.success) {
      alert("✅ Login successful")
      console.log("✅ Login successful, sid:", res.sid)
      // TODO: navigate to dashboard
    } else {
      error.value = res.error || "Login failed"
    }
  } catch (err) {
    error.value = err.message || "Something went wrong"
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
        <h1 class="text-3xl font-bold text-gray-900">Welcome to Time-Tracker!</h1>
      </div>

      <!-- Subtitle -->
      <div class="text-center">
        <p class="text-lg text-gray-900 mt-2 mb-2">Let's Setup</p>
      </div>

      <!-- Card -->
      <div class="bg-white shadow rounded-2xl p-8">
        <form class="space-y-5" @submit.prevent="doLogin">
          <!-- ERPNext Server URL -->
          <div>
            <label class="block text-sm font-medium text-gray-700">ERPNext Server URL</label>
            <input
              v-model="serverUrl"
              type="text"
              placeholder="https://your-server.com"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black sm:text-sm"
            />
          </div>

          <!-- Username -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Username</label>
            <input
              v-model="username"
              type="text"
              placeholder="jane@example.com"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black sm:text-sm"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black sm:text-sm"
            />
          </div>

          <!-- Error -->
          <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>

          <!-- Login Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-black text-white py-2 rounded-md font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {{ loading ? "Logging in..." : "Login" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

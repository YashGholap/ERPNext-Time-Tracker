<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { UserRoundCog } from 'lucide-vue-next'

const router = useRouter()
const userName = ref('User') // default value while loading

const goToSettings = () => {
  router.push('/settings')
}

// Fetch saved user info and logged-in username from Frappe
onMounted(async () => {
  try {
    // Call your Electron main process API
    const data = await window.api.fetchAPI('/api/method/frappe.auth.get_logged_user')

    // `data.message` contains the logged-in username
    userName.value = data.message || 'User'
    console.log('Logged-in user:', userName.value)
  } catch (err) {
    console.error('Failed to fetch logged-in user:', err)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 font-sans">
    <!-- Header with Settings Icon -->
    <div class="flex justify-between items-center p-4 bg-white shadow">
      <h1 class="text-xl font-bold">Welcome, {{ userName }}</h1>
      <UserRoundCog class="w-6 h-6 cursor-pointer" @click="goToSettings" />
    </div>

    <!-- Main Dashboard Content -->
    <div class="p-6">
      <!-- Example dashboard content -->
      <p class="text-gray-700">Your tracked time will appear here...</p>
    </div>
  </div>
</template>

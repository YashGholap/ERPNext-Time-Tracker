<script setup>
import { Clock } from "lucide-vue-next"

</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
    <div class="w-full max-w-md space-y-6">
      <!-- Title -->
      <div class="text-center">
        <Clock class="w-12 h-12 text-black mx-auto mb-3" />
        <h1 class="text-3xl font-bold text-gray-900">Welcome to Time-Tracker!</h1>
      </div>

      <!-- Card -->
      <div class="text-center">
          <p class="text-lg text-gray-900 mt-2 mb-2">Let's Setup</p>
      </div>
      <div class="bg-white shadow rounded-2xl p-8">
        <form class="space-y-5">
          <!-- ERPNext Server URL -->
          <div>
            <label class="block text-sm font-medium text-gray-700">ERPNext Server URL</label>
            <input
              type="text"
              placeholder="https://your-server.com"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black sm:text-sm"
            />
          </div>

          <!-- Username -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              placeholder="jane@example.com"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black sm:text-sm"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:ring-black sm:text-sm"
            />
          </div>

          <!-- Login Button -->
          <button
            type="submit"
            class="w-full bg-black text-white py-2 rounded-md font-medium hover:bg-gray-800 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

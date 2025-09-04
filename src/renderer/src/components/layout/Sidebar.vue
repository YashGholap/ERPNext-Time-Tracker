<script setup>
import { Home, Settings, Clock } from "lucide-vue-next"

const items = [
  { icon: Home, label: "Home" },
  { icon: Clock, label: "Tracker" },
  { icon: Settings, label: "Settings" },
]
</script>

<template>
  <aside class="w-64 h-screen bg-gray-50 border-r flex flex-col">
    <div class="p-4 text-lg font-bold text-blue-500">Time Tracker</div>
    <nav class="flex-1">
      <ul>
        <li v-for="item in items" :key="item.label">
          <button
            class="flex items-center w-full gap-3 px-4 py-2 text-gray-700 hover:bg-gray-200"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<template>
  <div class="p-8 flex flex-col items-center justify-center min-h-screen">
    <h1 class="text-2xl font-bold mb-6">Time Tracker</h1>

    <!-- Activity Input -->
    <div class="mb-6 w-80">
      <label class="block mb-2 font-medium">Activity Name</label>
      <input
        v-model="activityName"
        type="text"
        :disabled="isTracking"
        class="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-200"
        placeholder="Enter activity name"
      />
    </div>

    <!-- Timer Display -->
    <div
      class="text-5xl font-mono mb-2"
      :class="isOnBreak ? 'text-yellow-500' : 'text-black'"
    >
      {{ formattedTime }}
    </div>
    <div v-if="isOnBreak" class="mb-6 text-yellow-600 font-semibold">
      ☕ On Break
    </div>

    <!-- Buttons -->
    <div class="flex gap-6 mb-10">
      <button
        @click="toggleTracking"
        :disabled="!activityName || (!isTracking && elapsedSeconds > 0)"
        class="px-6 py-3 rounded bg-black text-white shadow flex items-center gap-2 hover:bg-gray-800 transition disabled:opacity-50"
      >
        <component :is="isTracking ? Square : Play" class="w-5 h-5" />
        <span>{{ isTracking ? "Stop" : "Start" }}</span>
      </button>

      <button
        @click="toggleBreak"
        :disabled="!isTracking"
        class="px-6 py-3 rounded bg-black text-white shadow flex items-center gap-2 hover:bg-gray-800 transition disabled:opacity-50"
      >
        <Coffee class="w-5 h-5" />
        <span>{{ isOnBreak ? "End Break" : "Break" }}</span>
      </button>

      <button
        @click="resetTimer"
        :disabled="isTracking || elapsedSeconds === 0"
        class="px-6 py-3 rounded bg-black text-white shadow flex items-center gap-2 hover:bg-gray-800 transition disabled:opacity-50"
      >
        <RotateCcw class="w-5 h-5" />
        <span>Reset</span>
      </button>
    </div>

    <!-- Recent Screenshots -->
    <div class="w-full max-w-3xl flex flex-col items-center" v-if="screenshots.length">
      <h2 class="text-xl font-semibold mb-4">Recent Screenshots</h2>
      <div class="grid grid-cols-3 gap-4">
        <div
          v-for="(screenshot, index) in screenshots"
          :key="index"
          class="border rounded shadow p-2 cursor-pointer"
          @click="openModal(screenshot.filePath)"
        >
          <img
            :src="screenshot.thumbnail"
            alt="Screenshot"
            class="w-full h-32 object-cover rounded"
          />
        </div>
      </div>
    </div>

    <!-- Modal for full screenshot -->
    <div
      v-if="modalVisible"
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <img
        :src="modalImage"
        class="max-h-[90vh] max-w-[90vw] rounded shadow-lg object-contain"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { Play, Square, Coffee, RotateCcw } from "lucide-vue-next";

const activityName = ref("");
const isTracking = ref(false);
const isOnBreak = ref(false);
const elapsedSeconds = ref(0);
const interval = ref(null);
const screenshots = ref([]);
let screenshotTimeout = null;

// Modal
const modalVisible = ref(false);
const modalImage = ref(null);

const formattedTime = computed(() => {
  const minutes = String(Math.floor(elapsedSeconds.value / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds.value % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
});

function toggleTracking() {
  if (isTracking.value) stopTimer();
  else startTimer();
}

function startTimer() {
  isTracking.value = true;
  interval.value = setInterval(() => {
    if (!isOnBreak.value) elapsedSeconds.value++;
  }, 1000);
  scheduleNextScreenshot();
  loadScreenshots();
}

function stopTimer() {
  isTracking.value = false;
  clearInterval(interval.value);
  clearTimeout(screenshotTimeout);
}

function toggleBreak() {
  if (isTracking.value) {
    isOnBreak.value = !isOnBreak.value;
    if (!isOnBreak.value) scheduleNextScreenshot();
    else clearTimeout(screenshotTimeout);
  }
}

function resetTimer() {
  if (!isTracking.value) {
    clearInterval(interval.value);
    clearTimeout(screenshotTimeout);
    elapsedSeconds.value = 0;
    isOnBreak.value = false;
  }
}

// Screenshot functions
async function takeScreenshot() {
  try {
    const fileData = await window.api.takeScreenshot();
    if (fileData) {
      await loadScreenshots();
    }
  } catch (err) {
    console.error("Screenshot failed:", err);
  }
}

async function loadScreenshots() {
  try {
    const files = await window.api.getScreenshots();
    screenshots.value = files; // array of { thumbnail, filePath }
  } catch (err) {
    console.error("Failed to load screenshots:", err);
  }
}

function openModal(fullImageDataUrl) {
  modalImage.value = fullImageDataUrl; // full-size base64 image
  modalVisible.value = true;
}

function closeModal() {
  modalVisible.value = false;
  modalImage.value = null;
}

// Schedule next screenshot randomly between 8-12 minutes
function scheduleNextScreenshot() {
  if (!isTracking.value || isOnBreak.value) return;

  const min = 8 * 60 * 1000;
  const max = 12 * 60 * 1000;
  const randomDelay = Math.floor(Math.random() * (max - min + 1)) + min;

  screenshotTimeout = setTimeout(async () => {
    if (isTracking.value && !isOnBreak.value) {
      await takeScreenshot();
      scheduleNextScreenshot();
    }
  }, randomDelay);
}
</script>

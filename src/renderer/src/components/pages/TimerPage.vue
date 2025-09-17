<template>
  <div class="min-h-screen p-6 bg-white">
    <!-- Header with Back button -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <button
          @click="onBack"
          class="flex items-center gap-2 px-3 py-2 rounded bg-black text-white hover:bg-gray-800 transition"
        >
          <ChevronLeft class="w-4 h-4" />
          Back
        </button>
      </div>

      <h1 class="text-2xl font-bold">Time Tracker</h1>

      <div style="width: 86px;"></div>
    </div>

    <div class="p-8 flex flex-col items-center">
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
            class="border rounded shadow p-2 cursor-pointer hover:scale-105 transition"
            @click="openModal(screenshot.fullData)"
          >
            <img
              :src="screenshot.thumbnail"
              alt="Screenshot"
              class="w-full h-32 object-cover rounded"
            />
          </div>
        </div>
      </div>

      <!-- Modal for full screenshot with zoom + pan controls -->
      <div v-if="modalVisible" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black bg-opacity-80" @click="closeModal"></div>

        <div
          class="relative z-10 bg-transparent p-4 rounded max-w-[96vw] max-h-[96vh] flex flex-col items-center"
          @pointerdown.capture="onPointerDown"
          @pointermove.capture="onPointerMove"
          @pointerup.capture="onPointerUp"
          @pointercancel.capture="onPointerUp"
          @wheel.prevent="onWheelZoom"
        >
          <div class="mb-2 flex items-center gap-2">
            <button @click.stop="zoomOut" class="px-3 py-1 bg-white text-black rounded shadow">−</button>
            <button @click.stop="zoomIn" class="px-3 py-1 bg-white text-black rounded shadow">+</button>
            <button @click.stop="fitToScreen" class="px-3 py-1 bg-white text-black rounded shadow">Fit</button>
            <button @click.stop="resetView" class="px-3 py-1 bg-white text-black rounded shadow">Reset</button>
            <div class="ml-3 text-white select-none">Zoom: {{ Math.round(zoom * 100) }}%</div>
            <button @click.stop="closeModal" class="ml-4 px-3 py-1 bg-red-600 text-white rounded shadow">Close</button>
          </div>

          <div
            ref="viewport"
            class="relative bg-black flex items-center justify-center overflow-hidden rounded"
            :style="{ width: viewportWidth + 'px', height: viewportHeight + 'px' }"
          >
            <img
              ref="modalImg"
              v-if="modalImage"
              :src="modalImage"
              alt="Full screenshot"
              class="select-none"
              :style="imgStyle"
              draggable="false"
              @dragstart.prevent
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { Play, Square, Coffee, RotateCcw, ChevronLeft } from "lucide-vue-next";

const router = useRouter();

// state
const activityName = ref("");
const lastStartedActivity = ref("");
const isTracking = ref(false);
const isOnBreak = ref(false);
const elapsedSeconds = ref(0);
const screenshots = ref([]);
let screenshotTimeout = null;
const interval = ref(null);

// modal
const modalVisible = ref(false);
const modalImage = ref(null);
const zoom = ref(1);
const offset = ref({ x: 0, y: 0 });
const dragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const offsetStart = ref({ x: 0, y: 0 });
const viewport = ref(null);
const modalImg = ref(null);
const viewportWidth = ref(Math.min(window.innerWidth * 0.9, 1400));
const viewportHeight = ref(Math.min(window.innerHeight * 0.9, 900));

const formattedTime = computed(() => {
  const minutes = String(Math.floor(elapsedSeconds.value / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds.value % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
});

// ------------ Navigation ------------
function onBack() {
  if (isTracking.value) {
    const confirmed = window.confirm("Timer is running — stop and go back?");
    if (!confirmed) return;
    stopTimer();
  }
  router.push("/dashboard");
}

// ------------ Timer controls ------------
function toggleTracking() {
  if (isTracking.value) stopTimer();
  else startTimer();
}

async function startTimer() {
  // If starting for a new activity => update lastStartedActivity (clearing happened on Dashboard)
  try {
    const isNewActivity = (activityName.value.trim() !== lastStartedActivity.value.trim());
    if (isNewActivity) {
      lastStartedActivity.value = activityName.value.trim();
      // UI and folder already cleared by Dashboard before navigation, and Timer's onMounted clears as well
      // so we don't take an immediate screenshot — scheduled screenshots will run after random delay
    }
  } catch (err) {
    console.error("Error while preparing new activity:", err);
  }

  isTracking.value = true;
  interval.value = setInterval(() => {
    if (!isOnBreak.value) elapsedSeconds.value++;
  }, 1000);

  scheduleNextScreenshot();
}

function stopTimer() {
  isTracking.value = false;
  clearInterval(interval.value);
  clearTimeout(screenshotTimeout);
}

function toggleBreak() {
  if (!isTracking.value) return;
  isOnBreak.value = !isOnBreak.value;
  if (!isOnBreak.value) scheduleNextScreenshot();
  else clearTimeout(screenshotTimeout);
}

function resetTimer() {
  if (isTracking.value) return;
  clearInterval(interval.value);
  clearTimeout(screenshotTimeout);
  elapsedSeconds.value = 0;
  isOnBreak.value = false;
}

// ------------ Screenshot functions ------------
async function takeScreenshot() {
  try {
    await window.api.takeScreenshot();
    await loadScreenshots();
  } catch (err) {
    console.error("Screenshot failed:", err);
  }
}

async function loadScreenshots() {
  try {
    const files = await window.api.getScreenshots();
    screenshots.value = files || [];
  } catch (err) {
    console.error("Failed to load screenshots:", err);
  }
}

// schedule random 8-12 minutes
function scheduleNextScreenshot() {
  if (!isTracking.value || isOnBreak.value) return;
  const min = 1 * 60 * 1000;
  const max = 2 * 60 * 1000;
  const randomDelay = Math.floor(Math.random() * (max - min + 1)) + min;
  screenshotTimeout = setTimeout(async () => {
    if (isTracking.value && !isOnBreak.value) {
      await takeScreenshot();
      scheduleNextScreenshot();
    }
  }, randomDelay);
}

// ------------ Modal + zoom/pan ------------
function openModal(fullBase64) {
  modalImage.value = fullBase64;
  zoom.value = 1;
  offset.value = { x: 0, y: 0 };
  modalVisible.value = true;
  viewportWidth.value = Math.min(window.innerWidth * 0.9, 1400);
  viewportHeight.value = Math.min(window.innerHeight * 0.9, 900);
}
function closeModal() {
  modalVisible.value = false;
  modalImage.value = null;
  zoom.value = 1;
  offset.value = { x: 0, y: 0 };
}
function zoomIn() { setZoom(zoom.value * 1.2); }
function zoomOut() { setZoom(zoom.value / 1.2); }
function resetView() { zoom.value = 1; offset.value = { x: 0, y: 0 }; }
function fitToScreen() {
  if (!modalImg.value) return;
  const img = modalImg.value;
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  const scaleW = viewportWidth.value / naturalW;
  const scaleH = viewportHeight.value / naturalH;
  const fit = Math.min(scaleW, scaleH, 1);
  setZoom(fit);
  offset.value = { x: 0, y: 0 };
}
function setZoom(v) { zoom.value = Math.max(0.1, Math.min(v, 8)); }

function onPointerDown(e) {
  if (!modalVisible.value) return;
  dragging.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
  offsetStart.value = { ...offset.value };
  (e.target).setPointerCapture?.(e.pointerId);
}
function onPointerMove(e) {
  if (!dragging.value) return;
  const dx = e.clientX - dragStart.value.x;
  const dy = e.clientY - dragStart.value.y;
  offset.value = { x: offsetStart.value.x + dx, y: offsetStart.value.y + dy };
}
function onPointerUp(e) {
  dragging.value = false;
  try { e.target.releasePointerCapture?.(e.pointerId); } catch {}
}
function onWheelZoom(e) {
  const delta = -e.deltaY;
  const factor = delta > 0 ? 1.12 : 1 / 1.12;
  const oldZoom = zoom.value;
  const newZoom = Math.max(0.1, Math.min(oldZoom * factor, 8));
  if (modalImg.value && viewport.value) {
    const rect = viewport.value.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const prevX = (cx - rect.width / 2 - offset.value.x) / oldZoom;
    const prevY = (cy - rect.height / 2 - offset.value.y) / oldZoom;
    const newOffsetX = cx - rect.width / 2 - prevX * newZoom;
    const newOffsetY = cy - rect.height / 2 - prevY * newZoom;
    offset.value = { x: newOffsetX, y: newOffsetY };
  }
  zoom.value = newZoom;
}

const imgStyle = computed(() => ({
  transform: `translate(${offset.value.x}px, ${offset.value.y}px) scale(${zoom.value})`,
  transformOrigin: "center center",
  transition: dragging.value ? "none" : "transform 120ms ease-out",
  cursor: dragging.value ? "grabbing" : "grab",
  maxWidth: "none",
  maxHeight: "none",
}));

function onKeydown(e) {
  if (e.key === "Escape") closeModal();
  if (e.key === "+" || e.key === "=") zoomIn();
  if (e.key === "-") zoomOut();
}

// On mount: always clear screenshots so Timer page starts fresh
onMounted(async () => {
  try {
    if (window.api?.clearScreenshots) {
      await window.api.clearScreenshots();
    }
  } catch (err) {
    console.error('Failed to clear screenshots on mount:', err);
  } finally {
    screenshots.value = [];
  }

  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
img[draggable="false"] {
  -webkit-user-drag: none;
  -webkit-user-select: none;
  user-select: none;
}
</style>

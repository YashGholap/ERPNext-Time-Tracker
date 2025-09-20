<template>
  <div class="min-h-screen p-6 bg-white relative">
    <!-- Header with Back button -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <button
          @click="onBack"
          :disabled="isUploading || elapsedSeconds !== 0"
          :class="[
            'flex items-center gap-2 px-3 py-2 rounded transition',
            (isUploading || elapsedSeconds !== 0)
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
          ]"
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
          :disabled="isTracking || isUploading"
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
          :disabled="!activityName || (!isTracking && elapsedSeconds > 0) || isUploading"
          class="px-6 py-3 rounded bg-black text-white shadow flex items-center gap-2 hover:bg-gray-800 transition disabled:opacity-50"
        >
          <component :is="isTracking ? Square : Play" class="w-5 h-5" />
          <span>{{ isTracking ? "Stop" : "Start" }}</span>
        </button>

        <button
          @click="toggleBreak"
          :disabled="!isTracking || isUploading"
          class="px-6 py-3 rounded bg-black text-white shadow flex items-center gap-2 hover:bg-gray-800 transition disabled:opacity-50"
        >
          <Coffee class="w-5 h-5" />
          <span>{{ isOnBreak ? "End Break" : "Break" }}</span>
        </button>

        <button
          @click="resetTimer"
          :disabled="isTracking || elapsedSeconds === 0 || isUploading"
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
            :key="screenshot.name || index"
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

    <!-- Upload overlay (loader) -->
    <div
      v-if="isUploading"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40"
    >
      <div class="bg-white rounded p-6 flex flex-col items-center gap-4 shadow-lg">
        <div class="loader w-12 h-12"></div>
        <div class="text-lg font-medium">Uploading timesheet and screenshots...</div>
        <div class="text-sm text-gray-600">Please wait — do not close the app.</div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <div
        v-if="uploadStatus === 'success'"
        class="bg-green-600 text-white px-4 py-2 rounded shadow"
      >
        Upload succeeded.
      </div>

      <div v-if="uploadStatus === 'failed'" class="bg-red-600 text-white px-4 py-2 rounded shadow flex items-center gap-3">
        <div>Upload failed: {{ uploadErrorMessage }}</div>
        <div class="ml-3">
          <button @click="retryUpload" class="px-3 py-1 bg-white text-black rounded shadow">Retry</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Play, Square, Coffee, RotateCcw, ChevronLeft } from "lucide-vue-next";

const router = useRouter();
const route = useRoute();

// state
const activityName = ref("");
const lastStartedActivity = ref("");
const isTracking = ref(false);
const isOnBreak = ref(false);
const elapsedSeconds = ref(0);
const screenshots = ref([]);
let screenshotTimeout = null;
const interval = ref(null);
let startTimestamp = null;
let stopTimestamp = null;

// modal + zoom
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

// upload state & retry
const isUploading = ref(false);
const uploadStatus = ref("idle"); // 'idle' | 'uploading' | 'success' | 'failed'
const uploadErrorMessage = ref("");
let lastUploadPayload = null;

// helper: format Date to Frappe datetime "YYYY-MM-DD HH:mm:ss" in local timezone
function toFrappeDatetime(d) {
  if (!d) return null;
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

// ------------ Navigation ------------
function onBack() {
  // enforce "only allowed when time is 00:00"
  if (isUploading.value) return; // extra safety
  if (elapsedSeconds.value !== 0) {
    window.alert("Please reset the timer to 00:00 before going back to the dashboard.");
    return;
  }
  router.push("/dashboard");
}

// ------------ Timer controls ------------
function toggleTracking() {
  if (isTracking.value) {
    stopAndUpload();
  } else {
    startTimer();
  }
}

function startTimer() {
  // prevent restarting from stopped time — require reset
  if (elapsedSeconds.value > 0) return;

  // mark start
  startTimestamp = new Date();
  isTracking.value = true;
  isOnBreak.value = false;
  interval.value = setInterval(() => {
    if (!isOnBreak.value) elapsedSeconds.value++;
  }, 1000);

  scheduleNextScreenshot();
  // load screenshots (should be empty usually)
  loadScreenshots();
}

function stopTimer() {
  isTracking.value = false;
  clearInterval(interval.value);
  clearTimeout(screenshotTimeout);
  stopTimestamp = new Date();
}

// stop + upload flow
async function stopAndUpload() {
  // set stop time and stop capturing further screenshots immediately
  stopTimestamp = new Date();
  isTracking.value = false;
  clearInterval(interval.value);
  clearTimeout(screenshotTimeout);

  // gather route query params for timesheet/task/project
  const taskName = route.query.task || route.query.task_name || "";
  const timesheetName = route.query.timesheet || route.query.timesheet_name || "";
  const projectName = route.query.project || route.query.project_name || "";

  // prepare payload
  const payload = {
    timesheet_name: timesheetName,
    task_name: taskName,
    project_name: projectName,
    activity_name: activityName.value || "",
    from_time: toFrappeDatetime(startTimestamp),
    to_time: toFrappeDatetime(stopTimestamp),
    screenshots: []
  };

  // fetch screenshots from main
  try {
    const files = await window.api.getScreenshots(); // expects [{ name, fullData, ... }]
    if (Array.isArray(files)) {
      for (const f of files) {
        const name = f.name || f.fileSaved || `screenshot-${Date.now()}.png`;
        let data = f.fullData || f.filePath || ""; // fullData is expected to be data URL
        if (!data) continue;
        const commaIndex = data.indexOf(",");
        if (commaIndex !== -1) data = data.slice(commaIndex + 1);
        payload.screenshots.push({ filename: name, data });
      }
    }
  } catch (err) {
    console.error("Failed to read screenshots before upload:", err);
    // continue with empty screenshots
  }

  // store last payload for retry
  lastUploadPayload = payload;

  // perform upload
  await performUpload(payload);
}

// core upload function (handles state)
async function performUpload(payload) {
  isUploading.value = true;
  uploadStatus.value = "uploading";
  uploadErrorMessage.value = "";

  try {
    // Frappe RPC handler expects a named parameter `data`.
    // Wrap our JSON payload into an URL-encoded form field named `data`.
    const body = new URLSearchParams();
    body.append("data", JSON.stringify(payload));

    const res = await window.api.fetchAPI(
      "/api/method/time_tracker.time_tracker.api.save_timesheet_with_screenshots",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        // ipcMain fetch-api forwards this to axios, which will send the body string
        data: body.toString(),
      }
    );

    // Consider response a success if we got here without throwing
    uploadStatus.value = "success";

    // clear screenshots on success (best-effort)
    try {
      if (window.api.clearScreenshots) {
        await window.api.clearScreenshots();
      }
    } catch (err) {
      console.error("Failed to clear screenshots after upload:", err);
    } finally {
      screenshots.value = [];
    }

    // mark upload finished
    isUploading.value = false;

    // briefly show success then reset status
    setTimeout(() => {
      uploadStatus.value = "idle";
    }, 2500);

    return res;
  } catch (err) {
    // extract a friendly message from various possible error shapes
    let message = "";
    if (!err) message = "Unknown error";
    else if (typeof err === "string") message = err;
    else if (err.exception) message = err.exception;
    else if (err.message) message = err.message;
    else if (err.error) message = err.error;
    else message = JSON.stringify(err);

    console.error("Upload failed:", err);
    uploadStatus.value = "failed";
    uploadErrorMessage.value = message;
    isUploading.value = false;

    // keep lastUploadPayload for retry (handled elsewhere)
    throw err; // rethrow if caller wants to handle
  }
}

// retry uses lastUploadPayload
async function retryUpload() {
  if (!lastUploadPayload) return;
  await performUpload(lastUploadPayload);
}

function toggleBreak() {
  if (!isTracking.value) return;
  isOnBreak.value = !isOnBreak.value;
  if (!isOnBreak.value) scheduleNextScreenshot();
  else clearTimeout(screenshotTimeout);
}

function resetTimer() {
  if (isTracking.value || isUploading.value) return;
  clearInterval(interval.value);
  clearTimeout(screenshotTimeout);
  elapsedSeconds.value = 0;
  isOnBreak.value = false;
  startTimestamp = null;
  stopTimestamp = null;
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
  const min =  60 * 1000;
  const max = 1 * 60 * 1000;
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

/* loader */
.loader {
  border: 4px solid rgba(0,0,0,0.08);
  border-left-color: #111827;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

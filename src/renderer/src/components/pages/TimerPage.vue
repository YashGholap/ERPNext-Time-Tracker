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
          list="activity-options"
          type="text"
          :disabled="isTracking || isUploading"
          class="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-200"
          placeholder="Enter or select activity"
          @focus="fetchActivities"
        />
        <datalist id="activity-options">
          <option v-for="act in activities" :key="act" :value="act" />
        </datalist>
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
          @click="resetAndCleanup"
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

        <!-- Go to Timesheet button -->
        <div class="w-full flex justify-center mt-4">
          <button
            v-if="showTimesheetLink && timesheetUrl"
            @click="goToTimesheet"
            class="px-6 py-3 bg-black text-white rounded shadow flex items-center gap-2 hover:bg-gray-800 transition"
          >
            Go to Timesheet
          </button>
        </div>
      </div>

      <!-- Modal -->
      <div v-if="modalVisible" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black bg-opacity-80" @click="closeModal"></div>
        <div
          class="relative z-10 bg-transparent p-4 rounded max-w-[96vw] max-h-[96vh] flex flex-col items-center"
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
            class="relative bg-black flex items-center justify-center overflow-hidden rounded max-w-full max-h-[80vh]"
            @wheel.prevent="onWheelZoom"
          >
            <img
              v-if="modalImage"
              :src="modalImage"
              class="select-none max-h-[80vh] max-w-full transition-transform"
              :style="{ transform: `scale(${zoom})` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Upload overlay -->
    <div v-if="isUploading" class="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
      <div class="bg-white rounded p-6 flex flex-col items-center gap-4 shadow-lg">
        <div class="loader w-12 h-12"></div>
        <div class="text-lg font-medium">Uploading timesheet and screenshots...</div>
        <div class="text-sm text-gray-600">Please wait — do not close the app.</div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <div v-if="uploadStatus === 'success'" class="bg-green-600 text-white px-4 py-2 rounded shadow flex items-center justify-between gap-4">
        <div>Upload succeeded.</div>
        <button @click="dismissToast" class="px-2 py-1 bg-white text-black rounded shadow">Cancel</button>
      </div>
      <div v-if="uploadStatus === 'failed'" class="bg-red-600 text-white px-4 py-2 rounded shadow flex items-center gap-3">
        <div>Upload failed: {{ uploadErrorMessage }}</div>
        <div class="ml-3">
          <button @click="retryUpload" class="px-3 py-1 bg-white text-black rounded shadow">Retry</button>
          <button @click="dismissToast" class="px-3 py-1 bg-white text-black rounded shadow ml-2">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Play, Square, Coffee, RotateCcw, ChevronLeft } from "lucide-vue-next";
import { v4 as uuidv4 } from "uuid";

const router = useRouter();
const route = useRoute();

// ---------------------- STATE ----------------------
const activityName = ref("");
const activities = ref([]); // <-- newly added
const isTracking = ref(false);
const isOnBreak = ref(false);
const elapsedSeconds = ref(0);
const screenshots = ref([]);
const intervals = ref([]);
let screenshotTimeout = null;
let timerInterval = null;
let currentInterval = null;
const sessionId = ref(null);

// upload states
const isUploading = ref(false);
const uploadStatus = ref("idle");
const uploadErrorMessage = ref("");
const showTimesheetLink = ref(false);

// modal states
const modalVisible = ref(false);
const modalImage = ref(null);
const zoom = ref(1);

// timesheet url
const timesheetUrl = ref("");

// ---------------------- COMPUTED ----------------------
const formattedTime = computed(() => {
  const hrs = String(Math.floor(elapsedSeconds.value / 3600)).padStart(2, "0");
  const mins = String(Math.floor((elapsedSeconds.value % 3600) / 60)).padStart(2, "0");
  const secs = String(elapsedSeconds.value % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
});

// ---------------------- NAVIGATION ----------------------
function onBack() { router.push("/"); }

// ---------------------- ACTIVITY FETCHER (NEW) ----------------------
async function fetchActivities() {
  // avoid refetching if already loaded
  if (activities.value.length) return;
  try {
    // Using the REST resource endpoint you confirmed
    const res = await window.api.fetchAPI("/api/resource/Activity%20Type?limit_page_length=200");
    // response shape: { data: [ { name: "Planning" }, ... ] }
    const items = res?.data || res?.message || res || [];
    // safely map to names (strings). Deduplicate.
    const names = Array.isArray(items)
      ? items.map(i => (typeof i === "string" ? i : i?.name)).filter(Boolean)
      : [];
    activities.value = Array.from(new Set(names));
  } catch (err) {
    console.error("Failed to fetch activities:", err);
  }
}

// prefetch activities once on mount so the datalist is ready
onMounted(() => {
  fetchActivities();
});

// ---------------------- TIMER ----------------------
function startTimer() {
  if (elapsedSeconds.value > 0) return;
  isTracking.value = true;
  isOnBreak.value = false;
  sessionId.value = uuidv4();
  currentInterval = { from: new Date().toISOString(), to: null, completed: false };
  timerInterval = setInterval(() => { if (!isOnBreak.value) elapsedSeconds.value++; }, 1000);
  scheduleNextScreenshot();
}

function endCurrentInterval() {
  if (!currentInterval) return;
  currentInterval.to = new Date().toISOString();
  currentInterval.completed = true;
  intervals.value.push(currentInterval);
  currentInterval = null;
}

function stopTimer() {
  endCurrentInterval();
  isTracking.value = false;
  clearInterval(timerInterval);
  clearTimeout(screenshotTimeout);
}

async function stopAndUpload() {
  stopTimer();
  const completedIntervals = intervals.value.filter(i => i.completed);
  const payload = {
    timesheet_name: route.query.timesheet || "",
    task_name: route.query.task || "",
    project_name: route.query.project || "",
    activity_name: activityName.value || "",
    intervals: completedIntervals,
    session_id: sessionId.value,
  };
  await finalizeUpload(payload);
}

async function finalizeUpload(payload) {
  isUploading.value = true;
  uploadStatus.value = "uploading";
  showTimesheetLink.value = false;
  try {
    const body = new URLSearchParams();
    body.append("data", JSON.stringify(payload));
    const response = await window.api.fetchAPI("/api/method/time_tracker.time_tracker.api.finalize_timesheet_with_screenshots", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: body.toString(),
    });

    // Frappe usually wraps response inside "message"
    const responseData = response?.message || response;

    timesheetUrl.value = responseData?.timesheet_url || "";
    uploadStatus.value = "success";
    isUploading.value = false;
    showTimesheetLink.value = !!timesheetUrl.value; // show button if URL exists
  } catch (err) {
    uploadStatus.value = "failed";
    uploadErrorMessage.value = err?.message || String(err);
    isUploading.value = false;
  }
}

function resetTimer(cleanupSession = true) {
  if (isTracking.value || isUploading.value) return;
  clearInterval(timerInterval);
  clearTimeout(screenshotTimeout);

  if (cleanupSession && sessionId.value) {
    window.api.fetchAPI("/api/method/time_tracker.time_tracker.api.cleanup_session", {
      method: "POST",
      data: { session_id: sessionId.value },
    }).catch(err => console.error("Cleanup failed:", err));
  }

  elapsedSeconds.value = 0;
  isOnBreak.value = false;
  intervals.value = [];
  screenshots.value = [];
  showTimesheetLink.value = false;
  currentInterval = null;
  sessionId.value = null;
}

function resetAndCleanup() { resetTimer(true); }

// ---------------------- BREAK ----------------------
function toggleBreak() {
  if (!isTracking.value) return;
  if (!isOnBreak.value) {
    endCurrentInterval();
    isOnBreak.value = true;
  } else {
    currentInterval = { from: new Date().toISOString(), to: null, completed: false };
    isOnBreak.value = false;
  }
}

// ---------------------- SCREENSHOTS ----------------------
function scheduleNextScreenshot() {
  const delay = Math.floor(Math.random() * (60 - 10 + 1) + 10) * 1000;
  screenshotTimeout = setTimeout(async () => {
    await takeScreenshot();
    if (isTracking.value) scheduleNextScreenshot();
  }, delay);
}

async function takeScreenshot() {
  if (!isTracking.value || isOnBreak.value) return;
  try {
    const file = await window.api.takeScreenshot();
    if (!file) return;
    let data = file.fullData || file.filePath || "";
    if (!data) return;
    const commaIndex = data.indexOf(",");
    if (commaIndex !== -1) data = data.slice(commaIndex + 1);
    const filename = `screenshot_${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    await window.api.fetchAPI("/api/method/time_tracker.time_tracker.api.upload_screenshot", {
      method: "POST",
      data: { file_name: filename, file_data: data, session_id: sessionId.value },
    });
    screenshots.value.push({
      name: filename,
      thumbnail: file.thumbnail || file.fullData,
      fullData: file.fullData,
    });
  } catch (err) { console.error("Screenshot failed:", err); }
}

// ---------------------- MODAL ----------------------
function openModal(img) { modalImage.value = img; modalVisible.value = true; }
function closeModal() { modalVisible.value = false; modalImage.value = null; zoom.value = 1; }
function zoomIn() { zoom.value *= 1.2; }
function zoomOut() { zoom.value /= 1.2; }
function fitToScreen() { zoom.value = 1; }
function resetView() { zoom.value = 1; }
function onWheelZoom(e) {
  zoom.value *= e.deltaY < 0 ? 1.1 : 0.9;
}

// ---------------------- CONTROLS ----------------------
function toggleTracking() { if (isTracking.value) stopAndUpload(); else startTimer(); }
function retryUpload() { stopAndUpload(); }
function dismissToast() { uploadStatus.value = "idle"; }

// ---------------------- NAVIGATION TO TIMESHEET ----------------------
function goToTimesheet() {
  if (!timesheetUrl.value) return;
  window.open(timesheetUrl.value, "_blank");
}
</script>

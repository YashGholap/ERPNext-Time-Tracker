<template>
  <div class="min-h-screen p-6 bg-white relative">
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
        <div v-if="!activityName && !isTracking && elapsedSeconds > 0" class="mt-2 text-sm text-red-500">
          Please select an activity before uploading.
        </div>
      </div>

      <div
        class="text-5xl font-mono mb-2"
        :class="isOnBreak ? 'text-yellow-500' : 'text-black'"
      >
        {{ formattedTime }}
      </div>
      <div v-if="isOnBreak" class="mb-6 text-yellow-600 font-semibold">
        ☕ On Break
      </div>

      <div class="flex gap-6 mb-10">
        <button
          @click="toggleTracking"
          :disabled="!activityName || isUploading"
          class="px-6 py-3 rounded bg-black text-white shadow flex items-center gap-2 hover:bg-gray-800 transition disabled:opacity-50"
        >
          <component :is="isTracking ? Square : Play" class="w-5 h-5" />
          <span>{{ isTracking ? "Stop" : elapsedSeconds > 0 ? "Upload" : "Start" }}</span>
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
          v-if="isTracking"
          @click="openConfirmCancel"
          :disabled="isUploading"
          class="px-6 py-3 rounded bg-red-600 text-white shadow flex items-center gap-2 hover:bg-red-700 transition disabled:opacity-50"
        >
          <RotateCcw class="w-5 h-5" />
          <span>Cancel</span>
        </button>

        <button
          v-else
          @click="resetAndCleanup"
          :disabled="isTracking || elapsedSeconds === 0 || isUploading"
          class="px-6 py-3 rounded bg-black text-white shadow flex items-center gap-2 hover:bg-gray-800 transition disabled:opacity-50"
        >
          <RotateCcw class="w-5 h-5" />
          <span>Reset</span>
        </button>
      </div>

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
            @mousedown.prevent="onMouseDown"
          >
            <img
              v-if="modalImage"
              :src="modalImage"
              class="select-none max-h-[80vh] max-w-full"
              :style="imageTransformStyle"
              @load="onImageLoad"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Toasts (success / failure) -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <div v-if="uploadStatus === 'success'" class="bg-green-600 text-white px-4 py-2 rounded shadow flex items-center justify-between gap-4">
        <div>Upload succeeded.</div>
        <button @click="dismissToast" class="px-2 py-1 bg-white text-black rounded shadow">Dismiss</button>
      </div>
      <div v-if="uploadStatus === 'failed'" class="bg-red-600 text-white px-4 py-2 rounded shadow flex items-center gap-3">
        <div>Upload failed: {{ uploadErrorMessage }}</div>
        <div class="ml-3">
          <button @click="retryUpload" class="px-3 py-1 bg-white text-black rounded shadow">Retry</button>
          <button @click="dismissToast" class="px-3 py-1 bg-white text-black rounded shadow ml-2">Dismiss</button>
        </div>
      </div>
    </div>

    <div v-if="confirmCancelVisible" class="fixed inset-0 z-60 flex items-center justify-center">
      <div class="absolute inset-0 bg-black bg-opacity-60" @click="closeConfirmCancel"></div>
      <div class="relative z-70 bg-white rounded p-6 w-[90%] max-w-md shadow-lg">
        <h3 class="text-lg font-semibold mb-3">Cancel tracking?</h3>
        <p class="text-sm text-gray-700 mb-4">
          This will stop tracking and delete any captured screenshots for this session. No data will be sent to the server.
        </p>
        <div class="flex justify-end gap-3">
          <button @click="closeConfirmCancel" class="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">Dismiss</button>
          <button
            @click="confirmCancel"
            :disabled="isUploading"
            class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Yes, cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Play, Square, Coffee, RotateCcw, ChevronLeft } from "lucide-vue-next";
import { v4 as uuidv4 } from "uuid";
import { showLoader, hideLoader } from '../../stores/loader' // adjust path if your store is elsewhere

const router = useRouter();
const route = useRoute();

// cleanup of timers/listeners on unmount
onBeforeUnmount(() => {
  clearInterval(timerInterval)
  clearTimeout(screenshotTimeout)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

// ---------------------- STATE ----------------------
const activityName = ref("");
const activities = ref([]);
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
const uploadStatus = ref("idle"); // 'idle' | 'uploading' | 'success' | 'failed'
const uploadErrorMessage = ref("");
const showTimesheetLink = ref(false);

// modal states
const modalVisible = ref(false);
const modalImage = ref(null);
const zoom = ref(1);

// NEW: Drag and Pan State
const panX = ref(0);
const panY = ref(0);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const initialPanX = ref(0);
const initialPanY = ref(0);
const imageOriginalWidth = ref(0); // For potential future use
const imageOriginalHeight = ref(0); // For potential future use

// timesheet url
const timesheetUrl = ref("");

// confirm cancel modal
const confirmCancelVisible = ref(false);

// ---------------------- COMPUTED ----------------------
const formattedTime = computed(() => {
  const hrs = String(Math.floor(elapsedSeconds.value / 3600)).padStart(2, "0");
  const mins = String(Math.floor((elapsedSeconds.value % 3600) / 60)).padStart(2, "0");
  const secs = String(elapsedSeconds.value % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
});

// NEW: Combined transform style for the image
const imageTransformStyle = computed(() => {
  return {
    transform: `scale(${zoom.value}) translate(${panX.value}px, ${panY.value}px)`,
    cursor: zoom.value > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'default',
    transition: isDragging.value ? 'none' : 'transform 0.2s ease-out',
    transformOrigin: 'center center'
  };
});

// ---------------------- NAVIGATION ----------------------
function onBack() { router.push("/"); }

// ---------------------- ACTIVITY FETCHER ----------------------
async function fetchActivities() {
  if (activities.value.length) return;
  showLoader()
  try {
    const res = await window.api.fetchAPI("/api/resource/Activity%20Type?limit_page_length=200");
    const items = res?.data || res?.message || res || [];
    const names = Array.isArray(items)
      ? items.map(i => (typeof i === "string" ? i : i?.name)).filter(Boolean)
      : [];
    activities.value = Array.from(new Set(names));
  } catch (err) {
    console.error("Failed to fetch activities:", err);
  } finally {
    hideLoader()
  }
}

onMounted(() => {
  // fetch activities on mount (splash handled inside fetchActivities)
  fetchActivities();
});

/**
 * Call server cleanup for session_id, then clear local screenshots on disk.
 * Always swallows errors (but logs them) so UI flow isn't blocked.
 */
async function cleanupSessionAndLocalScreens(sessionIdArg) {
  if (!sessionIdArg) return;

  showLoader()
  try {
    // 1) Ask server to cleanup (best-effort)
    try {
      await window.api.fetchAPI('/api/method/time_tracker.time_tracker.api.cleanup_session', {
        method: 'POST',
        data: { session_id: sessionIdArg }
      });
    } catch (err) {
      console.error('cleanup_session failed:', err);
      // continue to local cleanup even if server call fails
    }

    // 2) Clear local on-disk screenshots via main process (best-effort)
    try {
      if (window.api?.clearScreenshots) {
        await window.api.clearScreenshots();
      } else {
        console.warn('clearScreenshots IPC not exposed in preload');
      }
    } catch (err) {
      console.error('clearScreenshots failed:', err);
    }
  } finally {
    hideLoader()
  }
}

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

/**
 * Finalize upload: use global splash, reset local state on success,
 * show retry toast on failure.
 */
async function finalizeUpload(payload) {
  showLoader();
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

    const responseData = response?.message || response;

    // success: update UI and clear local tracking state
    timesheetUrl.value = responseData?.timesheet_url || "";
    uploadStatus.value = "success";
    showTimesheetLink.value = !!timesheetUrl.value;

    // Reset local tracking state so UI returns to "Start"
    elapsedSeconds.value = 0;
    intervals.value = [];
    screenshots.value = [];
    currentInterval = null;
    sessionId.value = null;
    isTracking.value = false;

  } catch (err) {
    // failure: keep state so user can retry, show toast
    uploadStatus.value = "failed";
    uploadErrorMessage.value = err?.message || String(err);
  } finally {
    isUploading.value = false;
    hideLoader();
  }
}

// ---------------------- CANCEL ----------------------
function openConfirmCancel() {
  confirmCancelVisible.value = true;
}

function closeConfirmCancel() {
  confirmCancelVisible.value = false;
}

async function confirmCancel() {
  // hide modal first to avoid double-click issues
  confirmCancelVisible.value = false;
  // run cancel logic
  await cancelTracking();
}

// existing cancel logic (keeps behavior exactly as before)
async function cancelTracking() {
  if (!isTracking.value) return;

  // Stop local timers and screenshot scheduling
  clearInterval(timerInterval);
  clearTimeout(screenshotTimeout);

  // Ask server to clean up any unlinked screenshots for this session (no finalize)
  if (sessionId.value) {
    await cleanupSessionAndLocalScreens(sessionId.value);
  }

  // Reset local state — do not call finalize/upload
  elapsedSeconds.value = 0;
  isTracking.value = false;
  isOnBreak.value = false;
  intervals.value = [];
  screenshots.value = [];
  currentInterval = null;
  sessionId.value = null;
  showTimesheetLink.value = false;
}

// ---------------------- RESET ----------------------
async function resetTimer(cleanupSession = true) {
  if (isTracking.value || isUploading.value) return;
  clearInterval(timerInterval);
  clearTimeout(screenshotTimeout);

  if (cleanupSession && sessionId.value) {
    await cleanupSessionAndLocalScreens(sessionId.value);
  }

  elapsedSeconds.value = 0;
  isOnBreak.value = false;
  intervals.value = [];
  screenshots.value = [];
  showTimesheetLink.value = false;
  currentInterval = null;
  sessionId.value = null;
}

async function resetAndCleanup() { await resetTimer(true); }

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
  const delay = Math.floor(Math.random() * (10 - 1 + 1) + 1) * 60 * 1000;
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

// ---------------------- MODAL / IMAGE ----------------------
function openModal(img) {
  modalImage.value = img;
  modalVisible.value = true;
  // Reset view state when opening a new image
  zoom.value = 1;
  panX.value = 0;
  panY.value = 0;
  imageOriginalWidth.value = 0;
  imageOriginalHeight.value = 0;
}

function closeModal() {
  modalVisible.value = false;
  modalImage.value = null;
  zoom.value = 1;
  panX.value = 0;
  panY.value = 0;
  imageOriginalWidth.value = 0;
  imageOriginalHeight.value = 0;
}

function zoomIn() {
  const oldZoom = zoom.value;
  zoom.value = Math.min(zoom.value * 1.2, 5); // Limit max zoom
  // Adjust pan to keep center relatively stable (simple zoom to center)
  panX.value = panX.value * (zoom.value / oldZoom);
  panY.value = panY.value * (zoom.value / oldZoom);
}

function zoomOut() {
  const oldZoom = zoom.value;
  zoom.value = Math.max(zoom.value / 1.2, 1); // Limit min zoom to 1
  // Adjust pan
  panX.value = panX.value * (zoom.value / oldZoom);
  panY.value = panY.value * (zoom.value / oldZoom);
  // Reset pan if zoomed out to minimum
  if (zoom.value === 1) {
    panX.value = 0;
    panY.value = 0;
  }
}

function fitToScreen() {
  zoom.value = 1;
  panX.value = 0;
  panY.value = 0;
}

function resetView() {
  zoom.value = 1;
  panX.value = 0;
  panY.value = 0;
}

// NEW: Zoom to Cursor functionality
function onWheelZoom(e) {
  e.preventDefault();
  const container = e.currentTarget;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const oldZoom = zoom.value;
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  let newZoom = oldZoom * zoomFactor;

  // Clamp zoom
  newZoom = Math.max(1, Math.min(5, newZoom)); // Min 1, Max 5

  if (newZoom === oldZoom) return; // No change

  // Calculate cursor position relative to the container center
  const centerToCursorX = e.clientX - rect.left - rect.width / 2;
  const centerToCursorY = e.clientY - rect.top - rect.height / 2;

  // Calculate the required pan adjustment to keep the point under the cursor
  const mouseInImageX = centerToCursorX / oldZoom - panX.value;
  const mouseInImageY = centerToCursorY / oldZoom - panY.value;

  const newPanX = panX.value + mouseInImageX * (1 - newZoom / oldZoom);
  const newPanY = panY.value + mouseInImageY * (1 - newZoom / oldZoom);

  zoom.value = newZoom;
  panX.value = newPanX;
  panY.value = newPanY;

  if (zoom.value === 1) {
    panX.value = 0;
    panY.value = 0;
  }
}

// NEW: Dragging handlers (Pan)
function onMouseDown(e) {
  // Only start dragging if zoomed in
  if (zoom.value === 1) return;

  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;
  initialPanX.value = panX.value;
  initialPanY.value = panY.value;

  // Use window listeners to keep tracking even if mouse leaves the container
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
  if (!isDragging.value) return;
  e.preventDefault(); // Prevent text selection while dragging

  const dx = e.clientX - dragStartX.value;
  const dy = e.clientY - dragStartY.value;

  panX.value = initialPanX.value + dx / zoom.value;
  panY.value = initialPanY.value + dy / zoom.value;
}

function onMouseUp() {
  isDragging.value = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}

function onImageLoad(e) {
  imageOriginalWidth.value = e.target.naturalWidth;
  imageOriginalHeight.value = e.target.naturalHeight;
}

// ---------------------- CONTROLS ----------------------
function toggleTracking() {
  // If currently tracking, stop and upload. If not tracking and time is recorded, upload. Otherwise, start.
  if (isTracking.value || elapsedSeconds.value > 0) {
    stopAndUpload();
  } else {
    startTimer();
  }
}
function retryUpload() { 
  // only retry if we have captured intervals or a session
  if (elapsedSeconds.value > 0 || intervals.value.length > 0 || sessionId.value) {
    stopAndUpload();
  } else {
    // nothing to upload — just dismiss
    uploadStatus.value = "idle";
  }
}
function dismissToast() { uploadStatus.value = "idle"; }

// ---------------------- NAVIGATION TO TIMESHEET ----------------------
function goToTimesheet() {
  if (!timesheetUrl.value) return;
  window.open(timesheetUrl.value, "_blank");
}
</script>

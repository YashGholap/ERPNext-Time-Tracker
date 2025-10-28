<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { UserRoundCog } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { showLoader, hideLoader } from '../../stores/loader'

const router = useRouter()
const userName = ref('User')
const projects = ref([])
const tasks = ref([])
const timesheets = ref([])
const selectedProject = ref('')
const selectedTask = ref('')
const selectedTimesheet = ref('')
// activityName moved to Timer Page - not needed here

// Navigation to Settings
const goToSettings = () => router.push('/settings')

// --- Helpers to extract data safely from various API response shapes ---
const extractArrayFromResponse = (res) => {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.message)) return res.message
  if (res.data && Array.isArray(res.data.data)) return res.data.data
  if (res.message && Array.isArray(res.message.data)) return res.message.data
  return []
}

const extractUserFromResponse = (res) => {
  // Assuming the new API returns { "message": "John" } or similar
  if (res?.message && typeof res.message === 'string' && res.message.length > 0) {
    return res.message
  }
  // Fallback in case of an object { "data": { "first_name": "John" } }
  if (res?.data?.first_name) {
    return res.data.first_name
  }
  // The ultimate fallback
  return 'User'
}
// --- end helpers ---

// Fetch logged-in username
onMounted(async () => {
  showLoader()
  try {
    const user = await window.api.fetchAPI('/api/method/time_tracker.time_tracker.api.get_user_first_name')
    userName.value = extractUserFromResponse(user)
  } catch (err) {
    console.error('Failed to fetch logged-in user:', err)
    userName.value = 'User'
  }finally {
    hideLoader()
  }
})

// Fetch projects
const fetchProjects = async () => {
  try {
    const res = await window.api.fetchAPI('/api/v2/method/time_tracker.time_tracker.api.get_projects')
    projects.value = extractArrayFromResponse(res)
  } catch (err) {
    console.error('Failed to fetch projects:', err)
  }
}

// Fetch tasks for a project
const fetchTasks = async (projectName) => {
  if (!projectName) {
    tasks.value = []
    selectedTask.value = ''
    return
  }

  try {
    const res = await window.api.fetchAPI(
      `/api/v2/method/time_tracker.time_tracker.api.get_tasks?project=${encodeURIComponent(projectName)}`
    )
    tasks.value = extractArrayFromResponse(res)
  } catch (err) {
    console.error('Failed to fetch tasks:', err)
  }
}

// Fetch only Draft timesheets linked to a task
const fetchTimesheets = async (taskName) => {
  if (!taskName) {
    timesheets.value = []
    selectedTimesheet.value = ''
    return
  }

  try {
    const res = await window.api.fetchAPI(
      `/api/v2/method/time_tracker.time_tracker.api.get_timesheets?project=${encodeURIComponent(selectedProject.value)}&task=${encodeURIComponent(taskName)}`
    )
    timesheets.value = extractArrayFromResponse(res)
  } catch (err) {
    console.error('Failed to fetch timesheets:', err)
  }
}

// Watch project changes → fetch tasks
watch(selectedProject, (newProject) => {
  fetchTasks(newProject)
  selectedTask.value = ''
  timesheets.value = []
  selectedTimesheet.value = ''
})

// Watch task changes → fetch timesheets
watch(selectedTask, (newTask) => {
  fetchTimesheets(newTask)
  selectedTimesheet.value = ''
})

// computed: allow tracking only when all three are selected
const canTrack = computed(() => {
  return selectedProject.value && selectedTask.value && selectedTimesheet.value
})

// Handle Start Timer (clear screenshots then navigate)
const goToTimerPage = async () => {
  if (!canTrack.value) return
  showLoader()
  try {
    // Clear screenshots folder via main process so TimerPage starts fresh
    if (window.api?.clearScreenshots) {
      await window.api.clearScreenshots()
    }

    setTimeout(()=>{
      hideLoader()
      router.push({
      path: '/timer',
      query:{
          project: selectedProject.value,
          task: selectedTask.value,
          timesheet: selectedTimesheet.value
      }
    });
    }, 1200)
  } catch (err) {
    console.error('Failed to clear screenshots before navigation:', err)
    hideLoader()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 font-sans">
    <!-- Header -->
    <div class="flex justify-between items-center p-4 bg-white border-b">
      <h1 class="text-lg font-semibold text-gray-800">Welcome, {{ userName }}</h1>
      <UserRoundCog class="w-6 h-6 cursor-pointer text-gray-600 hover:text-gray-800" @click="goToSettings" />
    </div>

    <!-- Dashboard Content -->
    <div class="p-6 space-y-4 max-w-2xl mx-auto">
      <!-- Project Dropdown -->
      <div>
        <label class="block mb-1 text-sm font-medium text-gray-700">Project</label>
        <select
          v-model="selectedProject"
          class="w-full border rounded px-3 py-2 text-gray-800 focus:ring-2 focus:ring-black focus:outline-none"
          @focus="fetchProjects"
        >
          <option value="">Select a project</option>
          <option v-for="project in projects" :key="project.name" :value="project.name">
            {{ project.project_name || project.name }}
          </option>
        </select>
      </div>

      <!-- Task Dropdown -->
      <div>
        <label class="block mb-1 text-sm font-medium text-gray-700">Task</label>
        <select
          v-model="selectedTask"
          class="w-full border rounded px-3 py-2 text-gray-800 focus:ring-2 focus:ring-black focus:outline-none"
          :disabled="!selectedProject"
        >
          <option value="">Select a task</option>
          <option v-for="task in tasks" :key="task.name" :value="task.name">
            {{ task.subject || task.name }}
          </option>
        </select>
      </div>

      <!-- Timesheet Dropdown -->
      <div v-if="tasks.length > 0">
        <label class="block mb-1 text-sm font-medium text-gray-700">Timesheet</label>
        <select
          v-model="selectedTimesheet"
          class="w-full border rounded px-3 py-2 text-gray-800 focus:ring-2 focus:ring-black focus:outline-none"
          :disabled="!selectedTask"
        >
          <option value="">Select a timesheet</option>
          <option v-for="ts in timesheets" :key="ts.name" :value="ts.name">
            {{ ts.name }} (Draft)
          </option>
        </select>
      </div>

      <!-- Start Timer Button (centered) -->
      <div class="flex justify-center pt-4">
        <button
          @click="goToTimerPage"
          :disabled="!canTrack"
          :class="[
            'px-6 py-2 rounded focus:ring-2 focus:ring-gray-700 focus:outline-none',
            canTrack ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          ]"
        >
          Track Time
        </button>
      </div>
    </div>
  </div>
</template>

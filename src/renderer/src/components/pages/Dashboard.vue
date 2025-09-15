<script setup>
import { ref, onMounted, watch } from 'vue'
import { UserRoundCog } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
const userName = ref('User')
const projects = ref([])
const tasks = ref([])
const timesheets = ref([])
const selectedProject = ref('')
const selectedTask = ref('')
const selectedTimesheet = ref('')
const activityName = ref('')

// Navigation to Settings
const goToSettings = () => router.push('/settings')

// --- Helpers to extract data safely from various API response shapes ---
const extractArrayFromResponse = (res) => {
  if (!res) return []
  // If the response itself is an array
  if (Array.isArray(res)) return res
  // Common shapes
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.message)) return res.message
  // Defensive: nested .data.data (some wrappers)
  if (res.data && Array.isArray(res.data.data)) return res.data.data
  if (res.message && Array.isArray(res.message.data)) return res.message.data
  // If server returned an object with keys that look like a list (rare)
  return []
}

const extractUserFromResponse = (res) => {
  if (!res) return 'User'
  // plain string
  if (typeof res === 'string') return res
  // message as string
  if (typeof res.message === 'string') return res.message
  // message as array
  if (Array.isArray(res.message) && res.message.length) {
    const first = res.message[0]
    if (typeof first === 'string') return first
    if (first?.full_name) return first.full_name
    if (first?.name) return first.name
    return JSON.stringify(first)
  }
  // data as string
  if (typeof res.data === 'string') return res.data
  // data as array
  if (Array.isArray(res.data) && res.data.length) {
    const first = res.data[0]
    if (typeof first === 'string') return first
    if (first?.full_name) return first.full_name
    if (first?.name) return first.name
    return JSON.stringify(first)
  }
  return 'User'
}
// --- end helpers ---

// Fetch logged-in username
onMounted(async () => {
  try {
    const user = await window.api.fetchAPI('/api/method/frappe.auth.get_logged_user')
    userName.value = extractUserFromResponse(user) || 'User'
  } catch (err) {
    console.error('Failed to fetch logged-in user:', err)
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
  // tasks.value = []
  selectedTask.value = ''
  timesheets.value = []
  selectedTimesheet.value = ''
})

// Watch task changes → fetch timesheets
watch(selectedTask, (newTask) => {
  fetchTimesheets(newTask)
  selectedTimesheet.value = ''
})

// Handle Start Timer
const goToTimerPage = () => {
  router.push('/timer')   // route name/path for TimerPage.vue
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
          class="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 focus:ring-2 focus:ring-gray-700 focus:outline-none"
        >
          Track Time
        </button>
      </div>
    </div>
  </div>
</template>

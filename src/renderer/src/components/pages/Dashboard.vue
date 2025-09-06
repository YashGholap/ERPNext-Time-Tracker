<script setup>
import { ref, onMounted, watch } from 'vue'
import { UserRoundCog } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
const userName = ref('User')
const projects = ref([])
const tasks = ref([])
const selectedProject = ref('')
const selectedTask = ref('')
const activityName = ref('')

// Navigation to Settings
const goToSettings = () => router.push('/settings')

// Fetch logged-in username
onMounted(async () => {
  try {
    const user = await window.api.fetchAPI('/api/method/frappe.auth.get_logged_user')
    userName.value = user.message || 'User'
  } catch (err) {
    console.error('Failed to fetch logged-in user:', err)
  }
})

// Fetch projects
const fetchProjects = async () => {
  try {
    const res = await window.api.fetchAPI('/api/resource/Project')
    projects.value = res.data || []
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
      `/api/resource/Task?filters=[["project","=","${projectName}"]]`
    )
    tasks.value = res.data || []
  } catch (err) {
    console.error('Failed to fetch tasks:', err)
  }
}

// Watch project changes → fetch tasks
watch(selectedProject, (newProject) => {
  fetchTasks(newProject)
})

// Handle Start Timer
const startTimer = () => {
  console.log("=== Timer Started ===")
  console.log("Project:", selectedProject.value)
  console.log("Task:", selectedTask.value)
  console.log("Activity Name:", activityName.value)
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

      <!-- Activity Name -->
      <div>
        <label class="block mb-1 text-sm font-medium text-gray-700">Activity Name</label>
        <input
          type="text"
          v-model="activityName"
          placeholder="Enter activity name"
          class="w-full border rounded px-3 py-2 text-gray-800 focus:ring-2 focus:ring-black focus:outline-none"
        />
      </div>

      <!-- Start Timer Button (centered) -->
      <div class="flex justify-center pt-4">
        <button
          @click="startTimer"
          class="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 focus:ring-2 focus:ring-gray-700 focus:outline-none"
        >
          Start Timer
        </button>
      </div>
    </div>
  </div>
</template>

import { createRouter, createWebHashHistory } from "vue-router"
import Settings from '../components/pages/Settings.vue'
import Dashboard from '../components/pages/Dashboard.vue'

const routes = [
      { path: "/", redirect: "/initial" }, // temporary redirect
    { path: "/initial", name: "Initial" }, // used only for initial check
    {path:"/settings",name: "Settings", component:Settings},
    {path:"/dashboard",name: "Dashboard",  component:Dashboard}
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})


router.beforeEach(async (to, from, next) => {
  const creds = await window.api.getCredentials()

  // Initial load route
  if (to.name === "Initial") {
    if (creds && creds.serverUrl && creds.apiKey && creds.apiSecret) {
      next({ name: "Dashboard" }) // creds exist → dashboard
    } else {
      next({ name: "Settings" }) // no creds → settings
    }
    return
  }

  // Allow access to settings anytime
  if (to.name === "Settings") {
    next()
    return
  }

  // For dashboard or other routes, check credentials
  if (creds && creds.serverUrl && creds.apiKey && creds.apiSecret) {
    next()
  } else {
    // No creds → force settings
    next({ name: "Settings" })
  }
})

export default router
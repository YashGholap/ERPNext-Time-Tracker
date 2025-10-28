# 🕒 ERPNext Time Tracker Client

<p align="center">
  <img src="https://img.shields.io/badge/ERPNext-Time%20Automation-blue?style=flat-square" alt="ERPNext Time Automation">
  <img src="https://img.shields.io/badge/Platform-Electron%20%7C%20Vue.js-42b883?style=flat-square" alt="Built with Electron and Vue.js">
</p>

## Introduction

The **ERPNext Time Tracker Client** is a robust desktop application designed to eliminate manual time entry and streamline the timesheet process within your ERPNext instance.

This client runs locally on your desktop, acting as a direct bridge between your focused work activity and your ERPNext Timesheets. It's built for professionals who need accurate, verifiable time logs without the distraction of constantly managing timers in a browser.

**Say goodbye to manual time entry and tedious data transcription!**

---

## 🌟 Key Features

The Time Tracker Client is engineered for accuracy, efficiency, and accountability:

### 1. Zero-Click Timesheet Automation

* **Seamless Integration:** Automatically track time spent on your selected **Projects** and **Tasks** in real-time.
* **Draft Logging:** Instantly logs activity against a designated **Draft Timesheet** in ERPNext.
* **Focus-Oriented:** Once tracking is started, the app runs in the background, allowing you to concentrate on your work without constantly managing a timer.

### 2. Optional Proof of Work (Screenshots)

* **Verifiable Activity:** The client automatically captures periodic **screenshots** of your desktop activity.
* **Secure & Private:** Screenshots are handled locally first and can be attached directly to your ERPNext Timesheet for verifiable proof of work, if required by your organizational policies.
* **Clean Start:** The app ensures that the screenshot folder is cleared before starting a new tracking session to maintain privacy and organization.

### 3. Compact & Secure Desktop Experience

* **Non-Intrusive UI:** Features a compact window size, similar to utility applications, designed to be present but not distracting.
* **Secure Connection:** Connects securely to your ERPNext server using the recommended API Key and API Secret, ensuring only authorized actions are performed.

---

## 💾 Installation (For Windows Users)

### ⚠️ IMPORTANT: Windows Only

**This is an initial release and is currently only built and tested for the Windows operating system.** Support for macOS and Linux is planned for future releases.

1.  **Go to the [Releases Page](https://github.com/YashGholap/ERPNext-Time-Tracker/releases):** Click the **Releases** tab on this GitHub repository.
2.  **Download the Installer:** Find the latest release and download the `.exe` installer file (e.g., `ERPNext-Time-Tracker-Setup-v1.0.0.exe`).
3.  **Run the Installer:** Execute the downloaded file and follow the on-screen instructions to install the application.

---

## 🚀 Usage Guide

### Step 1: Configuration

1.  On first launch, you will be prompted to enter your ERPNext server URL, API Key, and API Secret in the **Settings** view (accessible via the gear icon **<UserRoundCog />**).
2.  Click **Save** to authenticate and connect to your ERPNext instance.

### Step 2: Start Tracking

1.  **Select a Project:** Choose the relevant project from the "Project" dropdown.
2.  **Select a Task:** Once a project is chosen, select the specific task you are working on from the "Task" dropdown.
3.  **Select a Timesheet:** Choose a **Draft** Timesheet that the time entries will be logged against.
4.  **Click "Track Time":** Once all three fields are selected, the **Track Time** button will become enabled. This starts the background timer and screenshot process.

### Step 3: Stop Tracking

(Instructions will be added here once the Timer page implementation is complete, typically involving a "Stop" button that pushes the final time log to ERPNext.)

---

## 🛠️ Development Setup (For Contributors)

### Prerequisites

* [Node.js](https://nodejs.org/en/) (LTS version recommended)
* npm (installed with Node.js)

### Setup Instructions

```bash
# 1. Clone the repository
git clone [https://github.com/YashGholap/ERPNext-Time-Tracker.git](https://github.com/YashGholap/ERPNext-Time-Tracker.git)
cd ERPNext-Time-Tracker

# 2. Install dependencies
npm install

# 3. Run in development mode
# This command starts the Vue renderer and the Electron main process
npm run dev
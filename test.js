
const serverUrl = "http://timetracker.erp:8000";
const username = "Administrator";
const password = "yash@admin";

(async () => {
  try {
    // 1️⃣ Login
    const loginRes = await fetch(`${serverUrl}/api/method/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usr: username, pwd: password }),
      credentials: "include"  // ✅ important: let cookie be set
    });

    const loginData = await loginRes.json();
    console.log("Login response:", loginData);

    // // 2️⃣ Get logged-in user
    const userRes = await fetch(`${serverUrl}/api/resource/item`, {
      credentials: "include"  // ✅ automatically sends the SID cookie
    });

    const userData = await userRes.json();
    console.log("Logged-in user:", userData);

  } catch (err) {
    console.error("Error:", err);
  }
})();

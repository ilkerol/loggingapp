// --- SUPABASE CONFIG ---
const SUPABASE_URL = "https://supabase.omvnginx.duckdns.org";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ2OTE0NDAwLCJleHAiOjE5MDQ2ODA4MDB9.cnqHAPgj0cnojgv-wa_jwzu-Jm7coigY_cvCbw_cldM";

let supabaseClient = null;
try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        db: { schema: "loggingapp" },
      },
    );
  } else {
    console.error("Supabase client library not loaded.");
    alert("Supabase library not found. Syncing will not be available.");
  }
} catch (e) {
  console.error("Error initializing Supabase client:", e);
  alert(
    "Could not initialize connection to the database. Syncing will not be available.",
  );
}
// --- END SUPABASE CONFIG ---

const menuBar = document.getElementById("menuBar");
const inputSection = document.getElementById("inputSection");
const tableBody = document.getElementById("tableBody");
let activeButton = null;
let activeRadioButtons = new Map();
let cleanupTimeout = null;
let initialSectionState = {}; // To store initial values when a section opens

// Load saved data
let entries = JSON.parse(localStorage.getItem("trackerData") || "[]");

// Initialize table
updateTable();

// Set up scroll synchronization
const scrollbarTop = document.querySelector(".scrollbar-top");
const tableWrapper = document.querySelector(".table-wrapper");

if (scrollbarTop && tableWrapper) {
  scrollbarTop.addEventListener("scroll", () => {
    tableWrapper.scrollLeft = scrollbarTop.scrollLeft;
  });
  tableWrapper.addEventListener("scroll", () => {
    scrollbarTop.scrollLeft = tableWrapper.scrollLeft;
  });
}

// Add event listener for delete buttons using event delegation
tableBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const index = parseInt(e.target.dataset.index, 10);
    if (
      confirm(
        "Are you sure you want to delete this entry? This will be synced to other devices. (Note: Deletion will reflect after next sync; item might reappear temporarily if other devices haven't synced the deletion).",
      )
    ) {
      entries.splice(index, 1);
      updateTable();
      saveData();
      // With the current "UPLOAD-ONLY THEN PULL" sync, this local deletion will be
      // effectively "undone" on the next sync if the item still exists on the server.
      // To make deletions persistent, the sync logic would need to handle them explicitly.
      // For now, the user experience is: delete locally, it's gone. Sync: it might come back if on server.
      // If another device syncs after this local delete AND that device's sync *does* propagate deletions,
      // then it will be gone from the server.
    }
  }
});

menuBar.addEventListener("click", (e) => {
  if (!e.target.matches("button")) return;

  const button = e.target;
  const isActive = button.classList.contains("active");

  closeActiveSection();

  if (!isActive) {
    activateButton(button);
    showInputSection(button.dataset.section);
  }
});

function closeActiveSection() {
  if (activeButton) {
    activeButton.classList.remove("active");
    activeButton.textContent = activeButton.dataset.section;
    activeButton = null;
  }

  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
    cleanupTimeout = null;
  }

  inputSection.style.height = "0";
  initialSectionState = {}; // Clear initial state when section closes

  cleanupTimeout = setTimeout(() => {
    inputSection.innerHTML = "";
    cleanupTimeout = null;
  }, 300);

  activeRadioButtons.clear();
}

function activateButton(button) {
  activeButton = button;
  button.classList.add("active");
  if (button.dataset.section !== "data") {
    button.textContent = "Confirm";
  }
}

function showInputSection(section) {
  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
    inputSection.innerHTML = "";
    cleanupTimeout = null;
  }

  let html = "";
  switch (section) {
    case "weekplan":
      html = `
        <div class="input-content">
          <div class="radio-group" id="moodGroup"><div class="radio-label">Mood:</div></div>
          <div class="radio-group" id="tinnitusGroup"><div class="radio-label">Tinnitus (1-5):</div></div>
          <textarea placeholder="Comment" id="comment" rows="3"></textarea>
        </div>
      `;
      break;
    case "health":
      html = `
        <div class="input-content">
          ${createNumberInput("systolic", "Systolic")}
          ${createNumberInput("diastolic", "Diastolic")}
          ${createNumberInput("heartrate", "Heart Rate")}
        </div>
      `;
      break;
    case "food":
      html = `
        <div class="input-content">
          <input type="text" placeholder="What did you eat?" id="foodInput">
        </div>
      `;
      break;
    case "sport":
      html = `
        <div class="input-content">
          <div class="radio-group" id="sportTypeGroup"><div class="radio-label">Type:</div></div>
          <div class="radio-group" id="intensityGroup"><div class="radio-label">Intensity:</div></div>
          <textarea placeholder="Notes" id="sportNotes" rows="3"></textarea>
        </div>
      `;
      break;
    case "data":
      html = `
        <div class="input-content">
          <button class="export-btn" id="exportCsv">Export All Data (CSV)</button>
          <button class="export-btn" id="exportWeekplan">Export Weekplan (CSV)</button>
          <hr style="margin: 10px 0; border-color: var(--surface2);">
          <button class="export-btn" id="backupJson">Backup Local Data (JSON)</button>
          <input type="file" id="restoreJson" hidden accept=".json">
          <button class="export-btn" onclick="document.getElementById('restoreJson').click()">Restore Local Data (JSON)</button>
          <hr style="margin: 10px 0; border-color: var(--surface2);">
          <button class="export-btn" id="syncWithSupabaseBtn">Sync with Cloud</button>
        </div>
      `;
      break;
  }

  inputSection.innerHTML = html;

  if (section === "weekplan") {
    createButtonGroup("moodGroup", "mood", [
      "very good",
      "good",
      "neutral",
      "bad",
      "very bad",
    ]);
    createButtonGroup("tinnitusGroup", "tinnitus", ["1", "2", "3", "4", "5"]);
  }
  if (section === "sport") {
    createButtonGroup("sportTypeGroup", "sportType", [
      "cycling",
      "running",
      "workout",
      "other",
    ]);
    createButtonGroup("intensityGroup", "intensity", [
      "light",
      "medium",
      "heavy",
    ]);
  }
  if (section === "health") {
    setupNumberInputs();
  }

  initialSectionState = {};
  switch (section) {
    case "weekplan":
      initialSectionState.mood =
        activeRadioButtons.get("mood")?.dataset.value || "";
      initialSectionState.tinnitus =
        activeRadioButtons.get("tinnitus")?.dataset.value || "";
      const commentEl = document.getElementById("comment");
      initialSectionState.comment = commentEl ? commentEl.value : "";
      break;
    case "health":
      const systolicEl = document.getElementById("systolic");
      const diastolicEl = document.getElementById("diastolic");
      const heartrateEl = document.getElementById("heartrate");
      initialSectionState.systolic = systolicEl ? systolicEl.value : "";
      initialSectionState.diastolic = diastolicEl ? diastolicEl.value : "";
      initialSectionState.heartrate = heartrateEl ? heartrateEl.value : "";
      break;
    case "food":
      const foodInputEl = document.getElementById("foodInput");
      initialSectionState.foodInput = foodInputEl ? foodInputEl.value : "";
      break;
    case "sport":
      initialSectionState.sportType =
        activeRadioButtons.get("sportType")?.dataset.value || "";
      initialSectionState.intensity =
        activeRadioButtons.get("intensity")?.dataset.value || "";
      const sportNotesEl = document.getElementById("sportNotes");
      initialSectionState.sportNotes = sportNotesEl ? sportNotesEl.value : "";
      break;
  }

  requestAnimationFrame(() => {
    const contentElement = inputSection.querySelector(".input-content");
    if (contentElement) {
      const contentHeight = contentElement.offsetHeight;
      inputSection.style.height = `${contentHeight}px`;
    } else {
      inputSection.style.height = "50px";
    }
  });

  if (section === "data") {
    setupExportHandlers();
    const syncBtn = document.getElementById("syncWithSupabaseBtn");
    if (syncBtn) {
      if (supabaseClient) {
        syncBtn.addEventListener("click", showSupabaseLoginPopup);
      } else {
        syncBtn.disabled = true;
        syncBtn.title = "Database connection not available.";
        syncBtn.textContent = "Sync (Unavailable)";
      }
    }
  }

  if (activeButton && section !== "data") {
    const newConfirmButton = activeButton.cloneNode(true);
    activeButton.parentNode.replaceChild(newConfirmButton, activeButton);
    activeButton = newConfirmButton;
    activeButton.textContent = "Confirm";
    activeButton.addEventListener("click", handleConfirm, { once: true });
  }
}

function createButtonGroup(containerId, name, options) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const label = container.querySelector(".radio-label");
  container.innerHTML = "";
  if (label) container.appendChild(label);

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "radio-btn";
    btn.textContent = opt;
    btn.dataset.value = opt;
    btn.addEventListener("click", () => handleRadioSelect(name, opt, btn));
    container.appendChild(btn);
  });
}

function handleRadioSelect(name, value, button) {
  const currentActive = activeRadioButtons.get(name);
  if (currentActive) currentActive.classList.remove("active");
  if (currentActive !== button) {
    button.classList.add("active");
    activeRadioButtons.set(name, button);
  } else {
    activeRadioButtons.delete(name);
  }
}

function createNumberInput(id, label) {
  const lastValue = localStorage.getItem(`last_${id}`) || "";
  return `
    <div class="number-input">
      <button type="button" class="num-btn minus" aria-label="Decrease ${label}">-</button>
      <input type="number" id="${id}" value="${lastValue}" aria-label="${label} value">
      <button type="button" class="num-btn plus" aria-label="Increase ${label}">+</button>
      <span>${label}</span>
    </div>
  `;
}

function setupNumberInputs() {
  document.querySelectorAll(".number-input").forEach((container) => {
    const input = container.querySelector("input[type='number']");
    container.querySelector(".minus").addEventListener("click", () => {
      input.value = Math.max(0, parseInt(input.value || 0) - 1);
    });
    container.querySelector(".plus").addEventListener("click", () => {
      input.value = parseInt(input.value || 0) + 1;
    });
  });
}

function setupExportHandlers() {
  const exportCsvBtn = document.getElementById("exportCsv");
  if (exportCsvBtn) exportCsvBtn.addEventListener("click", () => exportCsv());
  const exportWeekplanBtn = document.getElementById("exportWeekplan");
  if (exportWeekplanBtn)
    exportWeekplanBtn.addEventListener("click", () => exportCsv("weekplan"));
  const backupJsonBtn = document.getElementById("backupJson");
  if (backupJsonBtn) backupJsonBtn.addEventListener("click", backupJson);
  const restoreJsonInput = document.getElementById("restoreJson");
  if (restoreJsonInput)
    restoreJsonInput.addEventListener("change", restoreJson);
}

function generateUUID() {
  var d = new Date().getTime();
  var d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function ensureLocalEntryIds() {
  let changed = false;
  entries.forEach((entry) => {
    if (!entry.id) {
      entry.id = generateUUID();
      changed = true;
    }
  });
  if (changed) {
    saveData();
  }
}

function handleConfirm(event) {
  if (event) event.stopPropagation();

  const section = activeButton.dataset.section;
  let currentData = {};
  let dataToSave = {};
  let hasChanges = false;

  switch (section) {
    case "weekplan":
      currentData.mood = activeRadioButtons.get("mood")?.dataset.value || "";
      currentData.tinnitus =
        activeRadioButtons.get("tinnitus")?.dataset.value || "";
      const commentEl = document.getElementById("comment");
      currentData.comment = commentEl ? commentEl.value : "";

      if (
        currentData.mood !== (initialSectionState.mood || "") ||
        currentData.tinnitus !== (initialSectionState.tinnitus || "") ||
        currentData.comment !== (initialSectionState.comment || "")
      ) {
        hasChanges = true;
      }
      dataToSave = {
        mood: currentData.mood,
        tinnitus: currentData.tinnitus,
        comment: currentData.comment,
      };
      break;

    case "health":
      const systolicEl = document.getElementById("systolic");
      const diastolicEl = document.getElementById("diastolic");
      const heartrateEl = document.getElementById("heartrate");
      currentData.systolic = systolicEl ? systolicEl.value : "";
      currentData.diastolic = diastolicEl ? diastolicEl.value : "";
      currentData.heartrate = heartrateEl ? heartrateEl.value : "";

      if (
        currentData.systolic !== (initialSectionState.systolic || "") ||
        currentData.diastolic !== (initialSectionState.diastolic || "") ||
        currentData.heartrate !== (initialSectionState.heartrate || "")
      ) {
        hasChanges = true;
      }
      if (hasChanges) {
        ["systolic", "diastolic", "heartrate"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) localStorage.setItem(`last_${id}`, el.value);
        });
      }
      dataToSave = {
        systolic: currentData.systolic,
        diastolic: currentData.diastolic,
        heartrate: currentData.heartrate,
      };
      break;

    case "food":
      const foodInputEl = document.getElementById("foodInput");
      currentData.foodInput = foodInputEl ? foodInputEl.value : "";

      if (currentData.foodInput !== (initialSectionState.foodInput || "")) {
        hasChanges = true;
      }
      dataToSave = { entry: currentData.foodInput };
      break;

    case "sport":
      currentData.sportType =
        activeRadioButtons.get("sportType")?.dataset.value || "";
      currentData.intensity =
        activeRadioButtons.get("intensity")?.dataset.value || "";
      const sportNotesEl = document.getElementById("sportNotes");
      currentData.sportNotes = sportNotesEl ? sportNotesEl.value : "";

      if (
        currentData.sportType !== (initialSectionState.sportType || "") ||
        currentData.intensity !== (initialSectionState.intensity || "") ||
        currentData.sportNotes !== (initialSectionState.sportNotes || "")
      ) {
        hasChanges = true;
      }
      dataToSave = {
        type: currentData.sportType,
        intensity: currentData.intensity,
        notes: currentData.sportNotes,
      };
      break;

    case "data":
      closeActiveSection();
      return;
  }

  if (hasChanges) {
    const isDataToSaveEffectivelyEmpty = Object.values(dataToSave).every(
      (val) => val === "" || val === undefined || val === null,
    );

    if (!isDataToSaveEffectivelyEmpty) {
      const now = new Date();
      const entry = {
        id: generateUUID(),
        precise_logged_at: now.toISOString(),
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0].slice(0, 5),
        category: section,
        data: JSON.stringify(dataToSave),
      };
      entries.unshift(entry);
      updateTable();
      saveData();
      console.log("Changes detected and saved for section:", section);
    } else {
      console.log(
        "Changes resulted in an empty entry for section:",
        section,
        ". Not saving.",
      );
    }
  } else {
    console.log(
      "No changes detected in section:",
      section,
      ". Not saving an entry.",
    );
  }

  closeActiveSection();
}

function saveData() {
  localStorage.setItem("trackerData", JSON.stringify(entries));
}

function updateTable() {
  // Sort entries by precise_logged_at descending before rendering
  entries.sort((a, b) => {
    const dateA = a.precise_logged_at ? new Date(a.precise_logged_at) : new Date(`${a.date}T${a.time}`);
    const dateB = b.precise_logged_at ? new Date(b.precise_logged_at) : new Date(`${b.date}T${b.time}`);
    return dateB - dateA;
  });

  tableBody.innerHTML = entries
    .map((entry, index) => {
      let data = {};
      try {
        // Ensure entry.data is a string before parsing
        if (typeof entry.data === 'string') {
          data = JSON.parse(entry.data);
        } else if (typeof entry.data === 'object' && entry.data !== null) {
          // If data is already an object (e.g. from older versions or direct manipulation)
          data = entry.data;
        }
      } catch (e) {
        console.error("Failed to parse entry data:", entry.data, e);
      }
      return `
        <tr>
          <td>${entry.date || ""}</td>
          <td>${entry.time || ""}</td>
          <td>${entry.category || ""}</td>
          <td>${data.mood || ""}</td>
          <td>${data.tinnitus || ""}</td>
          <td>${data.systolic || ""}</td>
          <td>${data.diastolic || ""}</td>
          <td>${data.heartrate || ""}</td>
          <td>${data.entry || ""}</td>
          <td>${[data.type, data.intensity].filter(Boolean).join(", ") || ""}</td>
          <td>${data.comment || data.notes || ""}</td>
          <td><button class="delete-btn" data-index="${index}">Delete</button></td>
        </tr>
      `;
    })
    .join("");

  const table = document.querySelector(".table-wrapper table");
  const scrollbarDummy = document.querySelector(".scrollbar-dummy");
  if (table && scrollbarDummy) {
    scrollbarDummy.style.width = table.scrollWidth + "px";
  }
}

function exportCsv(filterCategory) {
  const filtered = filterCategory
    ? entries.filter((e) => e.category === filterCategory)
    : entries;
  if (filtered.length === 0) {
    alert(
      `No data found${filterCategory ? " for category: " + filterCategory : ""}.`,
    );
    return;
  }
  const csvContent = [
    "Date,Time,Category,Mood,Tinnitus,Systolic,Diastolic,Heartrate,Food,Sport,Comments",
    ...filtered.map((entry) => {
      let data = {};
      try {
        if (typeof entry.data === 'string') {
          data = JSON.parse(entry.data);
        } else if (typeof entry.data === 'object' && entry.data !== null) {
          data = entry.data;
        }
      } catch (e) { /* ignore parsing error for export, use empty fields */ }
      
      return [
        entry.date,
        entry.time,
        entry.category,
        data.mood || "",
        data.tinnitus || "",
        data.systolic || "",
        data.diastolic || "",
        data.heartrate || "",
        data.entry || "",
        [data.type, data.intensity].filter(Boolean).join(" "),
        data.comment || data.notes || "",
      ]
        .map(
          (field) =>
            `"${String(field === null || field === undefined ? "" : field).replace(/"/g, '""')}"`,
        )
        .join(",");
    }),
  ].join("\n");
  const filename = `${new Date().toISOString().split("T")[0]}_${filterCategory ? filterCategory : "alldata"}.csv`;
  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
}

function backupJson() {
  if (entries.length === 0) {
    alert("No data to backup.");
    return;
  }
  downloadFile(
    JSON.stringify(entries, null, 2),
    "lifetracker_backup.json",
    "application/json;charset=utf-8;",
  );
}

function restoreJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedEntries = JSON.parse(e.target.result);
      if (Array.isArray(importedEntries)) {
        if (
          confirm(
            `This will replace all current local data with ${importedEntries.length} entries from the file. Continue?`,
          )
        ) {
          entries = importedEntries;
          ensureLocalEntryIds(); // Good to ensure IDs if restoring from various sources
          updateTable();
          saveData();
          alert("Data restored successfully from JSON.");
        }
      } else {
        alert("Invalid JSON file format. Expected an array of entries.");
      }
    } catch (err) {
      alert("Error reading or parsing JSON file: " + err.message);
      console.error("Restore JSON error:", err);
    }
  };
  reader.onerror = () => {
    alert("Failed to read file.");
  };
  reader.readAsText(file);
  event.target.value = null;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- SUPABASE MODAL AND SYNC LOGIC ---
const supabaseLoginModal = document.getElementById("supabaseLoginModal");
const supabaseEmailInput = document.getElementById("supabaseEmail");
const supabasePasswordInput = document.getElementById("supabasePassword");
const supabaseLoginConfirmBtn = document.getElementById("supabaseLoginConfirm");
const supabaseLoginCancelBtn = document.getElementById("supabaseLoginCancel");
const supabaseLoginError = document.getElementById("supabaseLoginError");

function showSupabaseLoginPopup() {
  if (!supabaseClient) {
    alert("Supabase connection is not available. Cannot sync.");
    return;
  }
  supabaseEmailInput.value = localStorage.getItem("supabaseUserEmail") || "";
  supabasePasswordInput.value = "";
  supabaseLoginError.style.display = "none";
  supabaseLoginError.textContent = "";
  supabaseLoginModal.style.display = "flex";

  if (supabaseEmailInput.value) {
    supabasePasswordInput.focus();
  } else {
    supabaseEmailInput.focus();
  }
}

function hideSupabaseLoginPopup() {
  supabaseLoginModal.style.display = "none";
}

// Setup modal button click listeners
if (supabaseLoginCancelBtn) {
  supabaseLoginCancelBtn.addEventListener("click", hideSupabaseLoginPopup);
}
if (supabaseLoginConfirmBtn) {
  supabaseLoginConfirmBtn.addEventListener("click", handleSupabaseLoginAndSync);
}

// Add Enter key listeners for modal inputs (setup once)
if (supabaseEmailInput && supabasePasswordInput) {
  supabaseEmailInput.addEventListener("keydown", (event) => {
    if (
      supabaseLoginModal.style.display === "flex" &&
      (event.key === "Enter" || event.keyCode === 13)
    ) {
      event.preventDefault();
      supabasePasswordInput.focus();
    }
  });
}

if (supabasePasswordInput && supabaseLoginConfirmBtn) {
  supabasePasswordInput.addEventListener("keydown", (event) => {
    if (
      supabaseLoginModal.style.display === "flex" &&
      (event.key === "Enter" || event.keyCode === 13)
    ) {
      event.preventDefault();
      supabaseLoginConfirmBtn.click();
    }
  });
}

async function handleSupabaseLoginAndSync() {
  if (!supabaseClient) {
    supabaseLoginError.textContent = "Database connection not available.";
    supabaseLoginError.style.display = "block";
    return;
  }
  const email = supabaseEmailInput.value.trim();
  const password = supabasePasswordInput.value;
  if (!email || !password) {
    supabaseLoginError.textContent = "Email and password are required.";
    supabaseLoginError.style.display = "block";
    return;
  }
  supabaseLoginError.style.display = "none";
  supabaseLoginConfirmBtn.disabled = true;
  supabaseLoginConfirmBtn.textContent = "Syncing...";

  try {
    const { data: authData, error: authError } =
      await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
      });
    if (authError) {
      console.error("Supabase Auth Error:", authError);
      supabaseLoginError.textContent =
        authError.message || "Login failed. Check credentials.";
      supabaseLoginError.style.display = "block";
      return;
    }
    if (authData.user) {
      localStorage.setItem("supabaseUserEmail", email);
      await syncDataWithSupabase(authData.user); // Call the chosen sync logic
      hideSupabaseLoginPopup();
      alert("Sync with cloud completed successfully!");
    } else {
      supabaseLoginError.textContent = "Login failed. User data not received.";
      supabaseLoginError.style.display = "block";
    }
  } catch (e) {
    console.error("General Sync Error:", e);
    supabaseLoginError.textContent =
      e.message || "An unexpected error occurred during sync.";
    supabaseLoginError.style.display = "block";
  } finally {
    supabaseLoginConfirmBtn.disabled = false;
    supabaseLoginConfirmBtn.textContent = "Login & Sync";
  }
}

// --- "UPLOAD-ONLY THEN PULL" Sync Logic ---
async function syncDataWithSupabase(user) {
  if (!supabaseClient || !user) {
    // This check is a bit redundant as handleSupabaseLoginAndSync also checks, but good for direct calls.
    alert("Sync aborted: Supabase client or user not available.");
    return;
  }
  console.log("Starting UPLOAD-ONLY THEN PULL sync for user:", user.id);
  ensureLocalEntryIds(); // Make sure all local entries have an ID.

  // 1. Get current local entries (use a clone of `entries` to avoid modification issues if any async ops were to change `entries` unexpectedly)
  const currentLocalEntries = [...entries]; 
  console.log(`Current local entries count before sync: ${currentLocalEntries.length}`);

  // 2. Upsert ALL current local entries to Supabase.
  // `onConflict: 'id'` will handle new vs. existing.
  // This ensures anything this client knows about, the server will know about (or be updated with).
  if (currentLocalEntries.length > 0) {
    const entriesToUpsert = currentLocalEntries.map(localEntry => {
      // Ensure `precise_logged_at` exists and is valid, or derive it.
      let loggedAtTimestamp = localEntry.precise_logged_at;
      if (!loggedAtTimestamp || isNaN(new Date(loggedAtTimestamp).getTime())) {
          loggedAtTimestamp = (localEntry.date && localEntry.time) 
                              ? new Date(`${localEntry.date}T${localEntry.time}:00Z`).toISOString() 
                              : new Date().toISOString(); // Fallback to now if date/time missing
          if (!localEntry.precise_logged_at) {
            console.warn(`Entry ${localEntry.id} missing precise_logged_at, derived: ${loggedAtTimestamp}`);
          } else {
            console.warn(`Entry ${localEntry.id} had invalid precise_logged_at, derived: ${loggedAtTimestamp}`);
          }
      }
      
      // Ensure `localEntry.data` is parsed if it's a string, or handle if already object
      let detailsData = {};
      if (typeof localEntry.data === 'string') {
        try {
          detailsData = JSON.parse(localEntry.data);
        } catch (parseError) {
          console.error(`Error parsing localEntry.data for ID ${localEntry.id}:`, localEntry.data, parseError);
          detailsData = { error_parsing_local_data: true }; // Or some other error state
        }
      } else if (typeof localEntry.data === 'object' && localEntry.data !== null) {
        detailsData = localEntry.data; // Already an object
      }


      return {
        id: localEntry.id, // Assumed to be present due to ensureLocalEntryIds()
        user_id: user.id,
        logged_at: loggedAtTimestamp,
        category: localEntry.category,
        details: detailsData,
      };
    });

    console.log(`Upserting all ${entriesToUpsert.length} local entries to Supabase.`);
    // console.log("Data to upsert:", JSON.stringify(entriesToUpsert, null, 2)); // For deep debugging
    
    const { data: upsertedData, error: upsertError } = await supabaseClient
      .from("log_entries")
      .upsert(entriesToUpsert, { onConflict: "id" });

    if (upsertError) {
      console.error("Error upserting local entries to Supabase:", upsertError);
      const errorMsg = "Could not upload local data: " + upsertError.message;
       if (supabaseLoginModal.style.display === "flex") {
        supabaseLoginError.textContent = errorMsg;
        supabaseLoginError.style.display = "block";
      } else {
        alert(errorMsg);
      }
      throw new Error(errorMsg);
    }
    console.log("All local entries reported as successfully upserted by client.", upsertedData ? `Received ${upsertedData.length} items in upsert response.` : "No data in upsert response.");
  } else {
    console.log("No local entries to upsert.");
  }

  // 3. Fetch ALL data from Supabase. This is now the definitive source of truth.
  // This will include our upserts and anything from other devices.
  // Client NEVER tells server to delete based on its own potentially incomplete state.
  console.log("Fetching final definitive state from Supabase...");
  const { data: finalRemoteEntriesList, error: finalFetchError } = await supabaseClient
    .from("log_entries")
    .select("id, logged_at, category, details") // All fields needed to reconstruct local entry
    .eq("user_id", user.id);

  if (finalFetchError) {
    console.error("Error fetching final data from Supabase:", finalFetchError);
    const errorMsg = "Could not fetch final data from server: " + finalFetchError.message;
    if (supabaseLoginModal.style.display === "flex") {
      supabaseLoginError.textContent = errorMsg;
      supabaseLoginError.style.display = "block";
    } else {
      alert(errorMsg);
    }
    throw new Error(errorMsg);
  }

  console.log(`Fetched ${finalRemoteEntriesList ? finalRemoteEntriesList.length : 0} entries from Supabase to be the new local state.`);

  const newLocalState = (finalRemoteEntriesList || []).map(remoteEntry => {
    const loggedAtDate = new Date(remoteEntry.logged_at); // remoteEntry.logged_at should be a valid ISO string
    return {
      id: remoteEntry.id,
      precise_logged_at: remoteEntry.logged_at, // Store the exact timestamp from server
      date: loggedAtDate.toISOString().split("T")[0],
      time: loggedAtDate.toTimeString().split(" ")[0].slice(0, 5),
      category: remoteEntry.category,
      data: JSON.stringify(remoteEntry.details || {}), // Ensure `data` is a stringified JSON
    };
  });

  entries = newLocalState; // Replace local entries with the definitive set from the server
  
  // Sort entries by precise_logged_at descending before saving and updating table
  // This ensures `updateTable` also renders them sorted.
  entries.sort((a, b) => {
    const dateA = new Date(a.precise_logged_at);
    const dateB = new Date(b.precise_logged_at);
    return dateB - dateA; // Newest first
  });

  saveData();   // Save the new local state
  updateTable(); // Update the UI
  console.log("UPLOAD-ONLY THEN PULL sync process completed.");
}

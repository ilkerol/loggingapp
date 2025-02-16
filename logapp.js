// Theme Toggle
const themeToggle = document.getElementById("theme-toggle");
const body = document.body;

// Set dark theme as default
document.addEventListener("DOMContentLoaded", () => {
  body.classList.add("dark-theme");
  themeToggle.checked = true;
});

themeToggle.addEventListener("change", () => {
  body.classList.toggle("dark-theme");
});

// Load saved data from localStorage
let dataTable = JSON.parse(localStorage.getItem("dataTable")) || [];

// Function to save data to localStorage
function saveData() {
  localStorage.setItem("dataTable", JSON.stringify(dataTable));
}

// Function to add a row to the data table
function addDataToTable(date, weekday, time, mood, systolic, diastolic, tinnitus, heartRate) {
  dataTable.push({ date, weekday, time, mood, systolic, diastolic, tinnitus, heartRate });
  saveData();
  renderDataTable();
}

// Function to render the data table
function renderDataTable() {
  const tableBody = document.querySelector("#data-table tbody");
  tableBody.innerHTML = "";
  dataTable.forEach((entry, index) => {
    const newRow = tableBody.insertRow();
    newRow.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.weekday}</td>
      <td>${entry.time}</td>
      <td>${entry.mood || ""}</td>
      <td>${entry.systolic || ""}</td>
      <td>${entry.diastolic || ""}</td>
      <td>${entry.tinnitus || ""}</td>
      <td>${entry.heartRate || ""}</td>
      <td><button onclick="deleteEntry(${index})">Delete this entry</button></td>
    `;
  });
}

// Function to delete an entry
function deleteEntry(index) {
  dataTable.splice(index, 1);
  saveData();
  renderDataTable();
}

// Initialize data table on page load
renderDataTable();

// Toggle sections
const weekPlanBtn = document.getElementById("week-plan-btn");
const healthDataBtn = document.getElementById("health-data-btn");
const showLogBtn = document.getElementById("show-log-btn");
const manageDataBtn = document.getElementById("manage-data-btn");

const weekPlanSection = document.getElementById("week-plan-section");
const healthDataSection = document.getElementById("health-data-section");
const dataTableSection = document.getElementById("data-table-section");
const manageDataSection = document.getElementById("manage-data-section");

weekPlanBtn.addEventListener("click", () => {
  toggleSection(weekPlanSection, weekPlanBtn);
});

healthDataBtn.addEventListener("click", () => {
  toggleSection(healthDataSection, healthDataBtn);
});

showLogBtn.addEventListener("click", () => {
  toggleSection(dataTableSection, showLogBtn);
});

manageDataBtn.addEventListener("click", () => {
  toggleSection(manageDataSection, manageDataBtn);
});

function toggleSection(section, button) {
  section.classList.toggle("collapsed");
  if (section.classList.contains("collapsed")) {
    button.textContent = button.textContent.replace("Hide", "Show");
    button.classList.remove("hide");
    button.classList.add("section-toggle-button");
  } else {
    button.textContent = button.textContent.replace("Show", "Hide");
    button.classList.remove("section-toggle-button");
    button.classList.add("hide");
  }
}

// Week Plan Functionality
const moodButtons = ["very-good", "good", "neutral", "bad", "very-bad"];
let selectedMood = null;

moodButtons.forEach((id) => {
  document.getElementById(id).addEventListener("click", () => {
    selectedMood = id.replace("-", " ");
    moodButtons.forEach((btnId) => {
      document.getElementById(btnId).classList.remove("selected");
    });
    document.getElementById(id).classList.add("selected");
  });
});

document.getElementById("confirm-week-plan").addEventListener("click", () => {
  if (!selectedMood) {
    alert("Please select a mood before confirming.");
    return;
  }
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" });
  addDataToTable(currentDate, weekday, currentTime, selectedMood, null, null, null, null);
  // Reset selection after confirming
  moodButtons.forEach((btnId) => {
    document.getElementById(btnId).classList.remove("selected");
  });
  selectedMood = null;
});

// Health Data Functionality
let selectedTinnitus = null;
const tinnitusButtons = ["tinnitus-1", "tinnitus-2", "tinnitus-3", "tinnitus-4", "tinnitus-5"];

tinnitusButtons.forEach((id) => {
  document.getElementById(id).addEventListener("click", () => {
    selectedTinnitus = id.split("-")[1];
    tinnitusButtons.forEach((btnId) => {
      document.getElementById(btnId).classList.remove("selected");
    });
    document.getElementById(id).classList.add("selected");
  });
});

document.getElementById("confirm-health-data").addEventListener("click", () => {
  const systolic = document.getElementById("systolic").value;
  const diastolic = document.getElementById("diastolic").value;
  const heartRate = document.getElementById("heart-rate").value;

  // Check if at least one field has a value
  if (!systolic && !diastolic && !heartRate && !selectedTinnitus) {
    alert("Please fill at least one field before confirming.");
    return;
  }

  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" });
  addDataToTable(currentDate, weekday, currentTime, null, systolic, diastolic, selectedTinnitus, heartRate);

  // Reset fields after confirming
  document.getElementById("systolic").value = "";
  document.getElementById("diastolic").value = "";
  document.getElementById("heart-rate").value = "";
  tinnitusButtons.forEach((btnId) => {
    document.getElementById(btnId).classList.remove("selected");
  });
  selectedTinnitus = null;
});

// Manage Data Functionality
document.getElementById("export-data").addEventListener("click", () => {
  const rows = document.querySelectorAll("#data-table tbody tr");
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Date,Weekday,Time,Mood,Systolic,Diastolic,Tinnitus,Heart Rate\n";
  rows.forEach((row) => {
    const rowData = Array.from(row.children)
      .slice(0, -1) // Exclude the "Action" column
      .map((cell) => cell.textContent);
    csvContent += rowData.join(",") + "\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${new Date().toISOString().split("T")[0]}-datatable.csv`);
  document.body.appendChild(link);
  link.click();
});

document.getElementById("mail-data").addEventListener("click", () => {
  const rows = document.querySelectorAll("#data-table tbody tr");
  let mailContent = "Date,Weekday,Time,Mood,Systolic,Diastolic,Tinnitus,Heart Rate\n";
  rows.forEach((row) => {
    const rowData = Array.from(row.children)
      .slice(0, -1) // Exclude the "Action" column
      .map((cell) => cell.textContent);
    mailContent += rowData.join(",") + "\n";
  });
  const mailtoLink = `mailto:ilker.berlin@gmail.com?subject=Data Table&body=${encodeURIComponent(mailContent)}`;
  window.location.href = mailtoLink;
});

document.getElementById("delete-data").addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all data?")) {
    dataTable = [];
    saveData();
    renderDataTable();
  }
});

// Store Data as JSON
document.getElementById("store-json").addEventListener("click", () => {
  const dataStr = JSON.stringify(dataTable);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.json";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
});

// Restore Data from JSON
document.getElementById("restore-json").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      dataTable = JSON.parse(e.target.result);
      saveData(); // Save to localStorage
      renderDataTable();
      alert("Data restored successfully!");
    } catch (error) {
      alert("Invalid JSON file. Please select a valid data.json file.");
    }
  };
  reader.readAsText(file);
});

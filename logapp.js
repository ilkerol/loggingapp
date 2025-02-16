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
    button.textContent = button

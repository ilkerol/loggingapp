document.addEventListener('DOMContentLoaded', () => {
  // Theme Management
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  
  // Set initial theme
  body.classList.add('dark-theme');
  themeToggle.checked = true;

  themeToggle.addEventListener('change', () => {
    body.classList.toggle('dark-theme');
    body.classList.toggle('light-theme');
  });

  // Number Controls
  document.querySelectorAll('.number-control').forEach(button => {
    button.addEventListener('click', (e) => {
      const input = e.target.parentElement.querySelector('input[type="number"]');
      const step = e.target.classList.contains('plus') ? 1 : -1;
      input.value = Math.min(
        Math.max(parseInt(input.value) + step, parseInt(input.min)),
        parseInt(input.max)
      );
    });
  });

  // Mood Button Selection
  let selectedMood = null;
  document.querySelectorAll('.mood-button').forEach(button => {
    button.addEventListener('click', (e) => {
      // Clear previous selection
      document.querySelectorAll('.mood-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      // Set new selection
      e.target.classList.add('selected');
      selectedMood = e.target.dataset.value;
    });
  });

  // Tinnitus Button Selection
  let selectedTinnitus = null;
  document.querySelectorAll('.tinnitus-button').forEach(button => {
    button.addEventListener('click', (e) => {
      // Clear previous selection
      document.querySelectorAll('.tinnitus-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      // Set new selection
      e.target.classList.add('selected');
      selectedTinnitus = e.target.dataset.value;
    });
  });

  // Data Storage
  let dataTable = JSON.parse(localStorage.getItem('dataTable')) || [];

  // Section Toggle
  document.querySelectorAll('.section-button').forEach(button => {
    button.addEventListener('click', () => {
      const section = button.nextElementSibling;
      section.classList.toggle('collapsed');
      button.classList.toggle('hide');
      button.textContent = section.classList.contains('collapsed') 
        ? button.textContent.replace('Hide', 'Show') 
        : button.textContent.replace('Show', 'Hide');
    });
  });

  // Confirm Week Plan
  document.getElementById('confirm-week-plan').addEventListener('click', () => {
    if (!selectedMood) {
      alert('Please select a mood');
      return;
    }

    const newEntry = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      mood: selectedMood,
      comment: document.getElementById('week-comment').value,
      timestamp: new Date().getTime()
    };

    dataTable.unshift(newEntry);
    saveData();
    renderTable();
    resetWeekPlan();
  });

  // Confirm Health Data
  document.getElementById('confirm-health-data').addEventListener('click', () => {
    const entry = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      systolic: document.getElementById('systolic').value,
      diastolic: document.getElementById('diastolic').value,
      heartRate: document.getElementById('heart-rate').value,
      tinnitus: selectedTinnitus,
      comment: document.getElementById('health-comment').value,
      timestamp: new Date().getTime()
    };

    if (!entry.systolic && !entry.diastolic && !entry.heartRate && !entry.tinnitus) {
      alert('Please enter at least one health metric');
      return;
    }

    dataTable.unshift(entry);
    saveData();
    renderTable();
    resetHealthData();
  });

  // Data Management
  function saveData() {
    localStorage.setItem('dataTable', JSON.stringify(dataTable));
  }

  function renderTable() {
    const tbody = document.querySelector('#data-table tbody');
    tbody.innerHTML = dataTable.map(entry => `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.time}</td>
        <td>${entry.mood || ''}</td>
        <td>${entry.systolic || ''}</td>
        <td>${entry.diastolic || ''}</td>
        <td>${entry.heartRate || ''}</td>
        <td>${entry.tinnitus || ''}</td>
        <td>${entry.comment || ''}</td>
        <td><button class="delete-btn" data-timestamp="${entry.timestamp}">Delete</button></td>
      </tr>
    `).join('');

    // Add delete handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const timestamp = parseInt(btn.dataset.timestamp);
        dataTable = dataTable.filter(entry => entry.timestamp !== timestamp);
        saveData();
        renderTable();
      });
    });
  }

  // Initial render
  renderTable();

  // Reset Functions
  function resetWeekPlan() {
    document.querySelectorAll('.mood-button').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('week-comment').value = '';
    selectedMood = null;
  }

  function resetHealthData() {
    document.getElementById('systolic').value = '120';
    document.getElementById('diastolic').value = '80';
    document.getElementById('heart-rate').value = '75';
    document.querySelectorAll('.tinnitus-button').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('health-comment').value = '';
    selectedTinnitus = null;
  }

  // Data Export/Import
  document.getElementById('export-data').addEventListener('click', () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Date,Time,Mood,Systolic,Diastolic,Heart Rate,Tinnitus,Comment\n' +
      dataTable.map(entry => 
        Object.values(entry)
          .slice(0, 8)
          .map(value => `"${value}"`)
          .join(',')
      ).join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `health-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  });

  document.getElementById('restore-json').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        dataTable = JSON.parse(event.target.result);
        saveData();
        renderTable();
        alert('Data restored successfully!');
      } catch (error) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('delete-data').addEventListener('click', () => {
    if (confirm('Delete ALL data permanently?')) {
      dataTable = [];
      saveData();
      renderTable();
    }
  });
});

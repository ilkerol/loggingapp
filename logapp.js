document.addEventListener('DOMContentLoaded', () => {
  // Theme Management
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  body.classList.add('dark-theme');
  themeToggle.checked = true;

  themeToggle.addEventListener('change', () => {
    body.classList.toggle('dark-theme');
    body.classList.toggle('light-theme');
  });

  // Section Toggle Logic
  document.querySelectorAll('.section-button').forEach(button => {
    // Initialize button text and state
    const section = button.nextElementSibling;
    button.textContent = section.classList.contains('collapsed') 
      ? button.textContent.replace('Hide', 'Show')
      : button.textContent.replace('Show', 'Hide');
    
    button.addEventListener('click', function() {
      section.classList.toggle('collapsed');
      this.classList.toggle('hide');
      
      // Update button text
      if (section.classList.contains('collapsed')) {
        this.textContent = this.textContent.replace('Hide', 'Show');
      } else {
        this.textContent = this.textContent.replace('Show', 'Hide');
      }
    });
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

  // Selection Handling
  function setupSelection(selector, groupClass) {
    document.querySelectorAll(selector).forEach(button => {
      button.addEventListener('click', (e) => {
        document.querySelectorAll(`${selector}.selected`).forEach(btn => 
          btn.classList.remove('selected'));
        e.target.classList.add('selected');
      });
    });
  }

  setupSelection('.mood-button', 'mood');
  setupSelection('.tinnitus-button', 'tinnitus');
  setupSelection('.sport-button', 'sport');
  setupSelection('.intensity-button', 'intensity');

  // Data Storage
  let dataTable = JSON.parse(localStorage.getItem('dataTable')) || [];

  // Confirm Health Data
  document.querySelector('.confirm-health').addEventListener('click', () => {
    const entry = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      mood: document.querySelector('.mood-button.selected')?.dataset.value,
      systolic: document.getElementById('systolic').value,
      diastolic: document.getElementById('diastolic').value,
      heartRate: document.getElementById('heart-rate').value,
      tinnitus: document.querySelector('.tinnitus-button.selected')?.dataset.value,
      comment: document.getElementById('health-comment').value,
      timestamp: Date.now()
    };

    if (!entry.mood && !entry.systolic && !entry.diastolic && !entry.heartRate && !entry.tinnitus) {
      alert('Please enter at least one health data point');
      return;
    }

    dataTable.unshift(entry);
    saveData();
    renderTable();
    resetSection('health');
  });

  // Confirm Food
  document.querySelector('.confirm-food').addEventListener('click', () => {
    const food = document.getElementById('food-input').value.trim();
    if (!food) {
      alert('Please enter food information');
      return;
    }

    dataTable.unshift({
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      food: food,
      timestamp: Date.now()
    });

    saveData();
    renderTable();
    document.getElementById('food-input').value = '';
  });

  // Confirm Sport
  document.querySelector('.confirm-sport').addEventListener('click', () => {
    const sport = document.querySelector('.sport-button.selected');
    const intensity = document.querySelector('.intensity-button.selected');
    
    if (!sport || !intensity) {
      alert('Please select both sport and intensity');
      return;
    }

    dataTable.unshift({
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      sport: `${sport.dataset.sport} (${intensity.dataset.intensity})`,
      comment: document.getElementById('sport-comment').value.trim(),
      timestamp: Date.now()
    });

    saveData();
    renderTable();
    resetSection('sport');
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
        <td>${entry.food || ''}</td>
        <td>${entry.sport || ''}</td>
        <td>${entry.comment || ''}</td>
        <td><button class="delete-btn" data-timestamp="${entry.timestamp}">Delete</button></td>
      </tr>
    `).join('');

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        dataTable = dataTable.filter(e => e.timestamp !== parseInt(btn.dataset.timestamp));
        saveData();
        renderTable();
      });
    });
  }

function resetSection(section) {
  if (section === 'health') {
    // Clear mood and tinnitus selections
    document.querySelectorAll('.mood-button, .tinnitus-button').forEach(btn => 
      btn.classList.remove('selected'));
    
    // Clear the comment field
    document.getElementById('health-comment').value = '';
    
    // Keep the current values for:
    // - Systolic (stays as is)
    // - Diastolic (stays as is)
    // - Heart Rate (stays as is)
  }
  if (section === 'sport') {
    document.querySelectorAll('.sport-button, .intensity-button').forEach(btn => 
      btn.classList.remove('selected'));
    document.getElementById('sport-comment').value = '';
  }
}

  // Initial Render
  renderTable();

  // Data Export/Import
document.getElementById('export-data').addEventListener('click', () => {
  const dateString = new Date().toISOString().split('T')[0].replace(/-/g, '_');
  const csvContent = 'data:text/csv;charset=utf-8,' +
    'Date,Time,Mood,Systolic,Diastolic,Heart Rate,Tinnitus,Food,Sport,Comments\n' +
    dataTable.map(e => [
      e.date, e.time, e.mood, e.systolic, e.diastolic, 
      e.heartRate, e.tinnitus, e.food, e.sport, e.comment
    ].map(v => `"${v || ''}"`).join(',')).join('\n');

  const link = document.createElement('a');
  link.href = encodeURI(csvContent);
  link.download = `${dateString}_datalog.csv`;
  link.click();
});

  document.getElementById('delete-data').addEventListener('click', () => {
    if (confirm('Delete ALL data permanently?')) {
      dataTable = [];
      saveData();
      renderTable();
    }
  });

  // Backup/Restore
document.getElementById('store-json').addEventListener('click', () => {
  const dateString = new Date().toISOString().split('T')[0].replace(/-/g, '_');
  const dataStr = JSON.stringify(dataTable);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${dateString}_datalog.json`;
  a.click();
  URL.revokeObjectURL(url);
});

  document.getElementById('restore-json').addEventListener('change', function(e) {
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
});

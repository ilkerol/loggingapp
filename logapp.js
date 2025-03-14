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
    const section = button.nextElementSibling;
    button.textContent = section.classList.contains('collapsed') 
      ? button.textContent.replace('Hide', 'Show')
      : button.textContent.replace('Show', 'Hide');
    
    button.addEventListener('click', function() {
      section.classList.toggle('collapsed');
      this.classList.toggle('hide');
      
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
  function setupSelection(selector) {
    document.querySelectorAll(selector).forEach(button => {
      button.addEventListener('click', (e) => {
        document.querySelectorAll(`${selector}.selected`).forEach(btn => 
          btn.classList.remove('selected'));
        e.target.classList.add('selected');
      });
    });
  }

  setupSelection('.mood-button');
  setupSelection('.tinnitus-button');
  setupSelection('.sport-button');
  setupSelection('.intensity-button');

  // Data Storage
  let dataTable = JSON.parse(localStorage.getItem('dataTable')) || [];

  // Week Plan Confirmation (Fixed)
  document.querySelector('.confirm-weekplan').addEventListener('click', () => {
    const entry = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      mood: document.querySelector('.mood-button.selected')?.dataset.value,
      tinnitus: document.querySelector('.tinnitus-button.selected')?.dataset.value,
      comment: document.getElementById('weekplan-comment').value,
      timestamp: Date.now()
    };

    if (!entry.mood && !entry.tinnitus && !entry.comment) {
      alert('Please enter at least one week plan data point');
      return;
    }

    dataTable.unshift(entry);
    saveData();
    renderTable();
    resetSection('weekplan');
  });

  // Health Confirmation (Fixed)
  document.querySelector('.confirm-health').addEventListener('click', () => {
    const entry = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      systolic: document.getElementById('systolic').value,
      diastolic: document.getElementById('diastolic').value,
      heartRate: document.getElementById('heart-rate').value,
      timestamp: Date.now()
    };

    if (!entry.systolic && !entry.diastolic && !entry.heartRate) {
      alert('Please enter at least one health data point');
      return;
    }

    dataTable.unshift(entry);
    saveData();
    renderTable();
    resetSection('health');
  });

  // Food Confirmation
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

  // Sport Confirmation
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

  // Reset Sections (Updated)
  function resetSection(section) {
    if (section === 'health') {
      document.getElementById('systolic').value = 120;
      document.getElementById('diastolic').value = 80;
      document.getElementById('heart-rate').value = 75;
    }
    if (section === 'weekplan') {
      document.querySelectorAll('.mood-button, .tinnitus-button').forEach(btn => 
        btn.classList.remove('selected'));
      document.getElementById('weekplan-comment').value = '';
    }
    if (section === 'sport') {
      document.querySelectorAll('.sport-button, .intensity-button').forEach(btn => 
        btn.classList.remove('selected'));
      document.getElementById('sport-comment').value = '';
    }
  }

  // Export Week Plan (New)
  document.getElementById('export-weekplan').addEventListener('click', () => {
    const weekPlanData = dataTable.filter(entry => entry.mood || entry.tinnitus);
    if (weekPlanData.length === 0) {
      alert('No Week Plan data to export');
      return;
    }
    
    const dateString = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Date,Time,Mood,Tinnitus,Comments\n' +
      weekPlanData.map(e => [
        e.date, e.time, 
        e.mood || '', 
        e.tinnitus || '', 
        e.comment || ''
      ].map(v => `"${v}"`).join(',')).join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `${dateString}_weekplan.csv`;
    link.click();
  });

  // Keep the rest of your existing export/import code below...
  // [Rest of your existing code for other exports/imports]
});

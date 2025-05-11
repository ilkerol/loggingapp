
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

  // Confirm Week Plan
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

  // Confirm Health Data
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

  // Export CSV
  document.getElementById('export-data').addEventListener('click', () => {
    if (dataTable.length === 0) {
      alert('No data to export');
      return;
    }
    
    const dateString = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      'Date,Time,Mood,Systolic,Diastolic,Heart Rate,Tinnitus,Food,Sport,Comments\n' +
      dataTable.map(e => [
        `"${e.date}"`,
        `"${e.time}"`,
        `"${e.mood || ''}"`,
        `"${e.systolic || ''}"`,
        `"${e.diastolic || ''}"`,
        `"${e.heartRate || ''}"`,
        `"${e.tinnitus || ''}"`,
        `"${e.food || ''}"`,
        `"${e.sport || ''}"`,
        `"${e.comment || ''}"`
      ].join(',')).join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `${dateString}_full_export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Export Week Plan
  document.getElementById('export-weekplan').addEventListener('click', () => {
    const weekPlanData = dataTable.filter(entry => entry.mood || entry.tinnitus);
    if (weekPlanData.length === 0) {
      alert('No Week Plan data to export');
      return;
    }
    
    const dateString = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      'Date,Time,Mood,Tinnitus,Comments\n' +
      weekPlanData.map(e => [
        `"${e.date}"`,
        `"${e.time}"`, 
        `"${e.mood || ''}"`, 
        `"${e.tinnitus || ''}"`, 
        `"${e.comment || ''}"`
      ].join(',')).join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `${dateString}_weekplan_export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Email Data
  document.getElementById('mail-data').addEventListener('click', () => {
    if (dataTable.length === 0) {
      alert('No data to email');
      return;
    }
    
    const csvData = 'Date,Time,Mood,Systolic,Diastolic,Heart Rate,Tinnitus,Food,Sport,Comments\n' +
      dataTable.map(e => [
        `"${e.date}"`,
        `"${e.time}"`,
        `"${e.mood || ''}"`,
        `"${e.systolic || ''}"`,
        `"${e.diastolic || ''}"`,
        `"${e.heartRate || ''}"`,
        `"${e.tinnitus || ''}"`,
        `"${e.food || ''}"`,
        `"${e.sport || ''}"`,
        `"${e.comment || ''}"`
      ].join(',')).join('\n');

    const mailtoLink = `mailto:ilker.berlin@googlemail.com?subject=Health%20Data%20Export&body=${encodeURIComponent(csvData)}`;
    window.location.href = mailtoLink;
  });

  // Delete All Functionality
  const modal = document.getElementById('confirmation-modal');
  
  document.getElementById('delete-data').addEventListener('click', () => {
    modal.style.display = 'block';
  });

  document.getElementById('confirm-delete').addEventListener('click', () => {
    dataTable = [];
    saveData();
    renderTable();
    modal.style.display = 'none';
    alert('All data has been permanently deleted!');
  });

  document.getElementById('cancel-delete').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
    }
  });

  // Backup/Restore
  document.getElementById('store-json').addEventListener('click', () => {
    if (dataTable.length === 0) {
      alert('No data to backup');
      return;
    }
    
    const dateString = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    const dataStr = JSON.stringify(dataTable);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dateString}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('restore-json').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        dataTable = importedData;
        saveData();
        renderTable();
        alert(`Successfully imported ${dataTable.length} entries from JSON!`);
      } catch (error) {
        alert('Invalid JSON file: ' + error.message);
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('restore-csv').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/ /g, ''));
        
        dataTable = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => 
            v.trim().replace(/^"(.*)"$/, '$1')
          );
          
          return {
            date: values[headers.indexOf('date')] || '',
            time: values[headers.indexOf('time')] || '',
            mood: values[headers.indexOf('mood')] || '',
            systolic: values[headers.indexOf('systolic')] || '',
            diastolic: values[headers.indexOf('diastolic')] || '',
            heartRate: values[headers.indexOf('heartrate')] || '',
            tinnitus: values[headers.indexOf('tinnitus')] || '',
            food: values[headers.indexOf('food')] || '',
            sport: values[headers.indexOf('sport')] || '',
            comment: values[headers.indexOf('comments')] || '',
            timestamp: Date.now()
          };
        });

        saveData();
        renderTable();
        alert(`Successfully imported ${dataTable.length} entries from CSV!`);
      } catch (error) {
        alert('Error parsing CSV file: ' + error.message);
      }
    };
    reader.readAsText(file);
  });

  // Initial Render
  renderTable();
});

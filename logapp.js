document.addEventListener('DOMContentLoaded', () => {
  // ... (keep all previous code until export functions)

  // Export CSV (Fixed)
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

  // Export Week Plan (Fixed)
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

  // ... (keep all other existing code)
});

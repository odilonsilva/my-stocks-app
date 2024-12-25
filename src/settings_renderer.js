function saveSettings() {
  const refreshInterval = document.getElementById('refresh-interval').value;
  const updateOnStartup = document.getElementById('update-on-startup').checked;
  const analyzeCustomColor = document.getElementById('analyze-custom-color').checked;

  const settings = {
    refreshInterval: parseInt(refreshInterval),
    updateOnStartup: updateOnStartup,
    analyzeCustomColor: analyzeCustomColor
  };

  window.electronAPI.saveSettings(settings);
  window.close();
}

// Load settings on startup
window.onload = async function () {
  let settings = await window.electronAPI.loadSettings();

  if (!settings) {
    settings = {
      refresh_interval: 10,
      update_on_startup: false,
      analyze_custom_color: false
    };
  }

  document.getElementById('refresh-interval').value = settings.refresh_interval;
  document.getElementById('update-on-startup').checked = settings.update_on_startup;
  document.getElementById('analyze-custom-color').checked = settings.analyze_custom_color;
};
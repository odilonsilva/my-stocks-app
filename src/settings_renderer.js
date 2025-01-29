function saveSettings() {
  const refreshInterval = document.getElementById("refresh-interval").value;
  const updateOnStartup = document.getElementById("update-on-startup").checked;
  const analyzeCustomColor = document.getElementById(
    "analyze-custom-color"
  ).checked;

  const settings = {
    refreshInterval: parseInt(refreshInterval),
    updateOnStartup: updateOnStartup,
    analyzeCustomColor: analyzeCustomColor,
  };

  window.electronAPI.saveSettings(settings);
  window.close();
}

function cancelSettings() {
  window.electronAPI.saveSettings(null);
  window.close();
}

function openLogs() {
  window.electronAPI.openLogs();
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Load settings on startup
window.onload = async function () {
  let settings = await window.electronAPI.loadSettings();

  if (!settings) {
    settings = {
      refresh_interval: 10,
      update_on_startup: false,
      analyze_custom_color: false,
      dbSize: "0KB",
      logSize: "0KB",
    };
  }
  document.getElementById("db-size").innerText = formatBytes(settings.dbSize);
  document.getElementById("log-size").innerText = formatBytes(settings.logSize);
  document.getElementById("refresh-interval").value = settings.refresh_interval;
  document.getElementById("update-on-startup").checked =
    settings.update_on_startup;
  document.getElementById("analyze-custom-color").checked =
    settings.analyze_custom_color;
};

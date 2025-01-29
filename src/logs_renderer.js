function getLogs() {
  window.electronAPI.getLogs().then((logs) => {
    const logsTextarea = document.getElementById("logs");
    logsTextarea.value = logs.replaceAll(/\r\n/g, "\n");
    logsTextarea.scrollTop = logsTextarea.scrollHeight; // Force scroll to the bottom
  });
}

let nextUpdateAt = 60;
const intervalUpdate = setInterval(() => {
  document.title = `Logs - Next update in ${nextUpdateAt}s`;
  nextUpdateAt--;
  if (nextUpdateAt === 0) {
    getLogs();
    nextUpdateAt = 60;
  }
}, 1000);

window.onload = async () => getLogs();
window.onclose = () => clearInterval(intervalUpdate);

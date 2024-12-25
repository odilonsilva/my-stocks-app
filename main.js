const { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain } = require('electron');
const path = require('node:path');
const puppeteer = require('./src/puppeteer-browser');
const { 
  saveStock, 
  startDb,
  getStocks,
  saveStockValue,
  deleteStockById,
  getStock,
  loadSettings,
  saveSettings
 } = require('./src/repository');

let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  const boundX = width - 400

  mainWindow = new BrowserWindow({
    width: 400,
    height: height,
    alwaysOnTop: false,
    frame: false,
    x: boundX,
    y: 0,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js')
    }
  })

  startDb();
  mainWindow.loadFile(path.join(__dirname, 'screens', 'index.html'));
}

function createAnalyzeWindow(id) {
  analyzeWindow = new BrowserWindow({
    width: 600,
    height: 600,
    frame: true,
    parent: mainWindow, // Define a janela principal como pai
    modal: true, // Faz a janela secundária modal
    webPreferences: {
      // nodeIntegration: true, 
      preload: path.join(__dirname, 'src', 'preload.js')
    },
  });

  analyzeWindow.loadFile(path.join(__dirname, 'screens', 'analyze.html')); // Carrega o arquivo secundário

  // Evento para fechar a janela secundária
  analyzeWindow.on('closed', () => {
    analyzeWindow = null;
  });

  setTimeout(() => {
    analyzeWindow.webContents.send(`selected-stock`, id);
  }, 400);
}

function createSettingWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  const boundX = width - 400

  settingWindow = new BrowserWindow({
    width: 400,
    height: height,
    alwaysOnTop: false,
    frame: false,
    movable: false,
    modal: true,
    x: boundX,
    y: 0,
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js')
    }
  })

  settingWindow.loadFile(path.join(__dirname, 'screens', 'settings.html'));
}

app.whenReady().then(() => {
  const icon = nativeImage.createFromPath('assets/images/ganho-icon.png');
  icon.resize({
    height: 32,
    width: 32,
    quality: 'better'
  })
  const tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Sair', type: 'normal', toolTip: 'Fecha o programa', click: () => app.quit() },
  ])

  tray.setTitle('My Money')
  tray.setToolTip('My Money')
  tray.setContextMenu(contextMenu)
  tray.addListener('click', () => {
    mainWindow.show()
  })

  // Menu.setApplicationMenu(null);
  createWindow()
  mainWindow.hide()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('open-settings', (event) => {
  createSettingWindow();
});

ipcMain.handle('load-settings', async (event) => {
  return await loadSettings();
});

ipcMain.handle('save-settings', (event, settings) => {
  return saveSettings(settings);
});

ipcMain.handle('open-analyze', (event, id) => {
  createAnalyzeWindow(id);
});

ipcMain.handle('get-stock', async (event, data) => {
  return await getStock(data.id, data.startDate, data.endDate);
});

ipcMain.handle('find-stock', async (event, url) => {
  const result = await puppeteer.findStock(url);

  if (!result) return false;

  storeStock(result);

  updateList(result);

  return true;
});

ipcMain.handle('load-stocks', () => {
  return loadStocks();
});

ipcMain.handle('remove-stock', (event, id) => {
  deleteStock(id)
});

ipcMain.handle('update-data', async () => {
  const stocks = await loadStocks();
  let result = null;

  for (const stock of stocks) {
    result = await puppeteer.findStock(stock.url);

    if (result) {
      result.id = stock.id;
      saveStockValue(result);
    }
  }
});

function storeStock(stock) {
  saveStock(stock);
}

function loadStocks() {
  return getStocks();
}

function updateList(stock) {
  mainWindow.webContents.send('update-list', stock);
}

function deleteStock(id) {
  deleteStockById(id);
}
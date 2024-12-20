const { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain } = require('electron')
const path = require('node:path')
const puppeteer = require('./src/puppeteer-browser')
const { saveStock, startDb, getStocks, saveStockValue, deleteStockById } = require('./src/repository');

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

  mainWindow.loadFile('index.html')
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
  const stocks = await getStoredStocks();
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

function getStoredStocks() {
  startDb();
  return getStocks();
}

function loadStocks() {
  return getStoredStocks();
}

function updateList(stock) {
  mainWindow.webContents.send('update-list', stock);
}

function deleteStock(id) {
  deleteStockById(id);
}
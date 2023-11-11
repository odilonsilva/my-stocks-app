const { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain } = require('electron')
const path  =  require('node:path')
const puppeteer = require('./src/puppeteer-browser')
const fs = require('fs');
const lodash = require('lodash')
const databaseName = 'data/data.json';
let mainWindow;

function createWindow () {
  const primaryDisplay = screen.getPrimaryDisplay()
  const {width, height} = primaryDisplay.workAreaSize
  const boundX = width - 390
  
  mainWindow = new BrowserWindow({
    width: 400,
    height: height,
    alwaysOnTop: true,
    x: boundX,
    y: 0,
    webPreferences: {
      preload: path.join(__dirname, 'src','preload.js')
    }
  })

  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  const icon = nativeImage.createFromPath('assets/images/ganho.png')
  const tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Item1', type: 'normal', toolTip: 'item 1 aqui'},
    {label: 'Item2', type: 'checkbox', toolTip: 'item 2 aqui'},
    {label: 'Item3', type: 'radio', toolTip: 'item 3 aqui'}
  ])
  tray.setTitle('My Money')
  tray.setToolTip('App toolTip')
  tray.setContextMenu(contextMenu)
  
  createWindow()
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

ipcMain.handle('load-stocks', (event) => {
  loadStocks();
});

ipcMain.handle('remove-stock', (event, id) => {
  deleteStock(id)
})

function storeStock(stock) {
  let fileNotFound = false;
  let file = null;
  let lastId = 0;

  try {
    file = fs.readFileSync(databaseName, 'utf-8');
  } catch(error) {
    fileNotFound = true;
  }
  
  let stocks = [];
  if (!fileNotFound) {
    stocks = JSON.parse(file);
    lastId = stocks[stocks.length -1].id
  }

  stock.id = lastId + 1;
  stocks.push(stock);

  try {
    fs.writeFileSync(databaseName, JSON.stringify(stocks));
  } catch (error) {
    console.log('write file failed');
  }
}

function getStoredStocks() {
  let fileNotFound = false;
  let file = null;
  
  try {
    file = fs.readFileSync(databaseName, 'utf-8');
  } catch(error) {
    fileNotFound = true;
  }

  if (!fileNotFound) {
    return JSON.parse(file);
  }
  return [];
}

function loadStocks() {
  const stocks = getStoredStocks();
  for(const stock of stocks) {
    updateList(stock);
  }
}

function updateList(stock) {
  mainWindow.webContents.send('update-list', stock);
}

function deleteStock(id) {
  let stocks = getStoredStocks();
  const index = lodash.findIndex(stocks,{id: id});

  if (index > -1) {
    delete stocks[index]
    stocks = stocks.filter((item) => item != null)
    fs.writeFileSync(databaseName, JSON.stringify(stocks));
  }
}
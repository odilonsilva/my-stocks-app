const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  screen,
  ipcMain,
} = require("electron");
const path = require("node:path");
const { logger } = require("./src/logger");
require("dotenv").config();
const puppeteer = require(path.join(__dirname, "src", "puppeteer-browser"));
const {
  saveStock,
  startDb,
  getStocks,
  saveStockValue,
  deleteStockById,
  getStock,
  loadSettings,
  saveSettings,
} = require(path.join(__dirname, "src", "repository"));
const fs = require("fs");

let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const boundX = width - 400;

  mainWindow = new BrowserWindow({
    id: "mainWindow",
    width: 400,
    height: height,
    alwaysOnTop: false,
    frame: false,
    x: boundX,
    y: 0,
    webPreferences: {
      preload: path.join(__dirname, "src", "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "screens", "index.html"));
}

function createAnalyzeWindow(id) {
  analyzeWindow = new BrowserWindow({
    id: "analyzeWindow",
    width: 680,
    height: 600,
    frame: true,
    parent: mainWindow, // Define a janela principal como pai
    modal: true, // Faz a janela secundária modal
    webPreferences: {
      // nodeIntegration: true,
      preload: path.join(__dirname, "src", "preload.js"),
    },
  });

  analyzeWindow.loadFile(path.join(__dirname, "screens", "analyze.html")); // Carrega o arquivo secundário

  // Evento para fechar a janela secundária
  analyzeWindow.on("closed", () => {
    analyzeWindow = null;
  });

  setTimeout(() => {
    analyzeWindow.webContents.send(`selected-stock`, id);
  }, 400);
}

function createSettingWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const boundX = width - 400;

  settingWindow = new BrowserWindow({
    id: "settingWindow",
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
      preload: path.join(__dirname, "src", "preload.js"),
    },
  });

  settingWindow.loadFile(path.join(__dirname, "screens", "settings.html"));
}

function createLogWindow(id) {
  logWindow = new BrowserWindow({
    id: "logWindow",
    width: 800,
    height: 600,
    frame: true,
    parent: mainWindow, // Define a janela principal como pai
    modal: true, // Faz a janela secundária modal
    webPreferences: {
      // nodeIntegration: true,
      preload: path.join(__dirname, "src", "preload.js"),
    },
  });

  logWindow.loadFile(path.join(__dirname, "screens", "logs.html")); // Carrega o arquivo secundário

  // Evento para fechar a janela secundária
  logWindow.on("closed", () => {
    logWindow = null;
  });
}

app.whenReady().then(async () => {
  await startDb();
  const icon = nativeImage.createFromPath(
    path.join(__dirname, "src", "images", "ganho-icon.png")
  );
  icon.resize({
    height: 32,
    width: 32,
    quality: "better",
  });
  const tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Sair",
      type: "normal",
      toolTip: "Fecha o programa",
      click: () => app.quit(),
    },
  ]);

  tray.setTitle("My Money");
  tray.setToolTip("My Money");
  tray.setContextMenu(contextMenu);
  tray.addListener("click", () => {
    mainWindow.show();
  });

  createWindow();
  mainWindow.hide();

  app.on("browser-window-blur", () => {
    const windowOpened = BrowserWindow.getAllWindows().some((window) => {
      return window.isVisible() && window.id !== mainWindow.id;
    });

    if (!windowOpened) mainWindow.hide();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("open-settings", (event) => {
  createSettingWindow();
});

ipcMain.handle("load-settings", async () => {
  const dbSize = (await fs.promises.stat("./data/database.db")).size || 0;
  const logSize = (await fs.promises.stat("./app.log")).size || 0;
  const settings = await loadSettings();
  return { ...settings, dbSize, logSize };
});

ipcMain.handle("save-settings", (event, settings) => {
  if (!settings) return;
  mainWindow.webContents.send("update-interval", settings.refreshInterval);
  mainWindow.show();
  saveSettings(settings);
});

ipcMain.handle("open-analyze", (event, id) => {
  createAnalyzeWindow(id);
});

ipcMain.handle("get-stock", async (event, data) => {
  return await getStock(data.id, data.startDate, data.endDate);
});

ipcMain.handle("find-stock", async (event, url) => {
  const result = await puppeteer.findStock(url);

  if (!result) return false;

  storeStock(result);

  updateList(result);

  return true;
});

ipcMain.handle("load-stocks", () => {
  return loadStocks();
});

ipcMain.handle("remove-stock", (event, id) => {
  deleteStock(id);
});

ipcMain.handle("update-data", async () => {
  const stocks = await loadStocks();
  const result = await puppeteer.findStock(stocks);

  if (result.length === 0) {
    logger("No stocks found to update");
    return;
  }

  for (const stock of result) {
    saveStockValue(stock);
  }
  logger("Stocks updated");
});

ipcMain.handle("open-logs", () => {
  createLogWindow();
});

ipcMain.handle("get-logs", async () => {
  return await fs.promises.readFile("./app.log", "utf-8");
});

function storeStock(stock) {
  saveStock(stock);
}

function loadStocks() {
  return getStocks();
}

function updateList(stock) {
  mainWindow.webContents.send("update-list", stock);
}

function deleteStock(id) {
  deleteStockById(id);
}

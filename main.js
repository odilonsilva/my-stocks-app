const { app, BrowserWindow, Tray, Menu, nativeImage, screen } = require('electron')
const path = require('node:path')

function createWindow () {
  const primaryDisplay = screen.getPrimaryDisplay()
  const {width, height} = primaryDisplay.workAreaSize
  const boundX = width - 340
  
  const win = new BrowserWindow({
    width: 350,
    height: height,
    alwaysOnTop: true,
    x: boundX,
    y: 0,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  const icon = nativeImage.createFromPath('images/ganho.png')
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
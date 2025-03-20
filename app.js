const { app, BrowserWindow, Tray } = require('electron')
const path = require('node:path')


const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#74b1be',
      height: 30
    },
    frame: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'index.html'))
}
/* devTools: false */

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'

let mainWindow: BrowserWindow

function createWindow(): void {
  // 检查是否为开发环境
  const isDev = process.env.NODE_ENV === 'development'

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000/')
    // mainWindow.webContents.openDevTools()  // 注释掉这行以避免显示开发者工具
  } else {
    // 在生产环境中，我们需要使用 file:// 协议加载应用
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null as any
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC handlers
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result
})

ipcMain.handle('save-file', async (event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'note.pdf',
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'Word Documents', extensions: ['docx'] }
    ]
  })
  return result
})

// 添加音频录制相关的IPC处理
ipcMain.handle('start-recording', async () => {
  // 这里可以添加音频录制的逻辑
  return { success: true }
})

ipcMain.handle('stop-recording', async () => {
  // 这里可以添加停止录制的逻辑
  return { success: true }
})

// 添加文件处理相关的IPC处理
ipcMain.handle('process-pdf', async (event, filePath) => {
  // 这里可以添加PDF处理的逻辑
  return { success: true, content: 'PDF内容已处理' }
})

ipcMain.handle('process-video', async (event, videoUrl) => {
  // 这里可以添加视频处理的逻辑
  return { success: true, content: '视频内容已处理' }
})
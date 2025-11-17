"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
let mainWindow;
function createWindow() {
    // 检查是否为开发环境
    const isDev = process.env.NODE_ENV === 'development';
    mainWindow = new electron_1.BrowserWindow({
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
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000/');
        // mainWindow.webContents.openDevTools()  // 注释掉这行以避免显示开发者工具
    }
    else {
        // 在生产环境中，我们需要使用 file:// 协议加载应用
        mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// IPC handlers
electron_1.ipcMain.handle('select-file', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    return result;
});
electron_1.ipcMain.handle('save-file', async (event, data) => {
    const result = await electron_1.dialog.showSaveDialog(mainWindow, {
        defaultPath: 'note.pdf',
        filters: [
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'Word Documents', extensions: ['docx'] }
        ]
    });
    return result;
});
// 添加音频录制相关的IPC处理
electron_1.ipcMain.handle('start-recording', async () => {
    // 这里可以添加音频录制的逻辑
    return { success: true };
});
electron_1.ipcMain.handle('stop-recording', async () => {
    // 这里可以添加停止录制的逻辑
    return { success: true };
});
// 添加文件处理相关的IPC处理
electron_1.ipcMain.handle('process-pdf', async (event, filePath) => {
    // 这里可以添加PDF处理的逻辑
    return { success: true, content: 'PDF内容已处理' };
});
electron_1.ipcMain.handle('process-video', async (event, videoUrl) => {
    // 这里可以添加视频处理的逻辑
    return { success: true, content: '视频内容已处理' };
});

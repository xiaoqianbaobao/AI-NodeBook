"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    selectFile: () => electron_1.ipcRenderer.invoke('select-file'),
    saveFile: (data) => electron_1.ipcRenderer.invoke('save-file', data),
    startRecording: () => electron_1.ipcRenderer.invoke('start-recording'),
    stopRecording: () => electron_1.ipcRenderer.invoke('stop-recording'),
    processPdf: (filePath) => electron_1.ipcRenderer.invoke('process-pdf', filePath),
    processVideo: (videoUrl) => electron_1.ipcRenderer.invoke('process-video', videoUrl),
    platform: process.platform
});

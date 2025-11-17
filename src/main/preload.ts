import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFile: (data: any) => ipcRenderer.invoke('save-file', data),
  startRecording: () => ipcRenderer.invoke('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  processPdf: (filePath: string) => ipcRenderer.invoke('process-pdf', filePath),
  processVideo: (videoUrl: string) => ipcRenderer.invoke('process-video', videoUrl),
  platform: process.platform
})

declare global {
  interface Window {
    electronAPI: {
      selectFile: () => Promise<any>
      saveFile: (data: any) => Promise<any>
      startRecording: () => Promise<any>
      stopRecording: () => Promise<any>
      processPdf: (filePath: string) => Promise<any>
      processVideo: (videoUrl: string) => Promise<any>
      platform: string
    }
  }
}
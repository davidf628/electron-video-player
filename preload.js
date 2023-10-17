const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    getVersion: () => ipcRenderer.invoke('get-version'),
    get_video_data: () => ipcRenderer.invoke('get-video-data'),
    getIntervalsWatched: (video) => ipcRenderer.invoke('get-intervals-watched', video),
    getDefaultSettings: () => ipcRenderer.invoke('get-default-settings'),
    saveVideo: (data) => ipcRenderer.send('save-video-data', data),
    setUserData: (username, id) => ipcRenderer.send('set-user-data', username, id),
    createNewFile: () => ipcRenderer.send('create-new-video-database'),
    openExistingFile: () => ipcRenderer.send('open-video-database'),
    invokeSaveAction: (callback) => ipcRenderer.on('request-save-action', callback),
    getAppdataFolder: () => ipcRenderer.invoke('get-appdata-folder'),
});
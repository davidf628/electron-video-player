const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    getVersion: () => ipcRenderer.invoke('get-version'),
    get_video_data: () => ipcRenderer.invoke('get-video-data'),
    getIntervalsWatched: (video) => ipcRenderer.invoke('get-intervals-watched', video),
    get_user_data: () => ipcRenderer.invoke('get-user-data'),

    // Send the current view data from the frontend to the backend for saving
    save_video_data: (data) => ipcRenderer.send('save-video-data', data),

    setUserData: (username, id) => ipcRenderer.send('set-user-data', username, id),

    // Asks the front-end to make a request for the backend to save the data
    request_save_action: (callback) => ipcRenderer.on('request-save-action', callback),
    getAppdataFolder: () => ipcRenderer.invoke('get-appdata-folder'),
    showMessageDialog: (title, message) => ipcRenderer.send('show-message-dialog', title, message),
});
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    getVersion: () => ipcRenderer.invoke('get-version'),
    get_video_data: () => ipcRenderer.invoke('get-video-data'),
    getIntervalsWatched: (video) => ipcRenderer.invoke('get-intervals-watched', video),
    get_user_data: () => ipcRenderer.invoke('get-user-data'),

    // Gets the date for when a video was fully completed
    get_completion_date: (video) => ipcRenderer.invoke('get-completion-date', video),

    // Send the current view data from the frontend to the backend for saving
    save_video_data: (data) => ipcRenderer.send('save-video-data', data),

    // Takes the user data provided at the start screen and sends it to the backend
    set_user_data: (student) => ipcRenderer.send('set-user-data', student),

    // Copies the current video results to the ~/Downloads folder to send to instructor
    send_video_results: () => ipcRenderer.send('send-video-results'),

    // Asks the front-end to make a request for the backend to save the data
    request_save_action: (callback) => ipcRenderer.on('request-save-action', callback),
    getAppdataFolder: () => ipcRenderer.invoke('get-appdata-folder'),
    showMessageDialog: (title, message) => ipcRenderer.send('show-message-dialog', title, message),
});
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  
  'api', {
      send: (channel, data) => {
        // whitelist channels
        let validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data)
        }
      },
      receive: (channel, func) => {
        let validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
          // Deliberatly strip event as it includes 'sender'
          ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
      },
      saveVideo: (data) => ipcRenderer.send('save-video-data', data),
      openDirectory: () => ipcRenderer.send('open-directory'),

      handleEditorEvent: (callback) => ipcRenderer.on('editor-event', callback),
    
});
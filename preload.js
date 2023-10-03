const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  
  'api', {
      send: (channel, data) => {
        // whitelist channels
        //let validChannels = ['toMain', 'send-version'];
        //if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data)
        //}
      },
      receive: (channel, func) => {
        //let validChannels = ['fromMain', 'get-version'];
        //if (validChannels.includes(channel)) {
          // Deliberatly strip event as it includes 'sender'
          ipcRenderer.on(channel, (event, ...args) => func(...args));
        //}
      },
      getVersion: () => ipcRenderer.invoke('get-version'),
      get_video_data: () => ipcRenderer.invoke('get-video-data'),
      saveVideo: (data) => ipcRenderer.send('save-video-data', data),
      openDirectory: () => ipcRenderer.send('open-directory'),

      handleEditorEvent: (callback) => ipcRenderer.on('editor-event', callback),
    
});
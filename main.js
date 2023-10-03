// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('fs')

const version = "0.4.2";

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
 
  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  ipcMain.on('set-title', (event, title) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    win.setTitle(title);
  })

  ipcMain.on('toMain', (event, args) => {
    fetch('https://davidf628.github.io/video_data_104.json')
      .then(data => data.json())
      .then(data => mainWindow.webContents.send('fromMain', JSON.stringify(data)))
    
  });

  ipcMain.handle('get-version', async () => {
    console.log('i am getting version');
    return version;
  })

  const window = BrowserWindow.getFocusedWindow();
  mainWindow.webContents.send('editor-event', { action: 'set-version', data: version });

  ipcMain.on('save-video-data', (event, data) => {
      console.log(`VIDEO ID == ${data.video_id}`);
      let payload = `${JSON.stringify(data)}\n${btoa(JSON.stringify(data))}`
      fs.writeFile('./output.data', payload, (err) => {
          if (err) {
              console.error(`An error occured while writing to the file ...`);
          } else {
              console.log(`... was written successfully!`);
          }
      })


    // mjAPI.typeset({
    //     math: options.equation_str,
    //     format: options.render_engine, // or "inline-TeX", "MathML", "AsciiMath", "TeX"
    //     svg:true,      // or svg:true, or html:true, or mml:true
    // }, function (data) {
    //     if (!data.errors) {
    //         const window = BrowserWindow.getFocusedWindow();
    //         const filepath = path.join(options.filepath, options.filename);
    //         window.webContents.send('editor-event', { action: 'load-svg', data: data.svg });
    //         fs.writeFile(filepath, data.svg, (err) => {
    //             if (err) {
    //               console.error(`An error occurred while writing the file: ${filepath}`);
    //             } else {
    //               console.log(`${filepath} has been written successfully!`);
    //             }
    //           });
    //     } else {
    //         const window = BrowserWindow.getFocusedWindow();
    //         window.webContents.send('editor-event', { action: 'load-svg', data: data.errors });
    //     }
    //   });

});

  ipcMain.on('create-new-video-database', async (event) => {
      const window = BrowserWindow.getFocusedWindow();
      const options = {
          title: 'Open a Directory',
          properties: ['openDirectory']
      };
      const result = await dialog.showOpenDialog(window, options);
      if (result.filePaths && result.filePaths.length > 0) {
          window.webContents.send('editor-event', { 
              action: 'set-directory', 
              data: result.filePaths[0]
          })
      }
  });

  ipcMain.on('open-video-database', async (event) => {
    const window = BrowserWindow.getFocusedWindow();
    const options = {
        title: 'Open a Video DataFile',
        properties: ['openDirectory']
    };
    const result = await dialog.showOpenDialog(window, options);
    if (result.filePaths && result.filePaths.length > 0) {
        window.webContents.send('editor-event', { 
            action: 'open-file', 
            data: result.filePaths[0]
        })
    }
  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
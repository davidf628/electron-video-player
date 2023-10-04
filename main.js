// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('fs');
const fsPromises = require('fs').promises;

const version = "0.4.3";

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





  ipcMain.on('save-video-data', (event, data) => {
      console.log(`VIDEO ID == ${data.video_id}`);
      let payload = `${JSON.stringify(data)}`
      fs.appendFile('./output.data', payload, (err) => {
          if (err) {
              console.error(`An error occured while writing to the file ...`);
          } else {
              console.log(`... was written successfully!`);
          }
      });

});

  ipcMain.on('create-new-video-database', async (event) => {
      const window = BrowserWindow.getFocusedWindow();
      const options = {
          title: 'Create a New File',
          properties: ['openFile']
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

    ipcMain.handle('get-video-data', fetch_video_data);
    ipcMain.handle('get-intervals-watched', get_intervals_watched);
    ipcMain.handle('get-version', get_version_number);

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/******************************************************************************
 * This function calls my website for a hosted file that contains links to all
 *  the math 104 youtube vidoes my students can be tracked on
 */
async function fetch_video_data() {
    let data = await fetch('https://davidf628.github.io/video_data_104.json')
    let payload = await data.json();
    return payload;
}

/******************************************************************************
 * Reads through a data file and pulls all the intervals that qualify for a
 *  specific video.
 */
async function get_intervals_watched(event, video) {

    // read the data file - will need to change this to student selected file
    const data = await fsPromises.readFile('./output.data')
        .catch((err) => console.error('Failed to read file', err));

    // convert the raw data into lines of text
    let lines = data.toString().split('\n');
    let view_data = [];

    // go through the lines and pick the ones that match the given video_id
    for (let line of lines) {
        let obj = JSON.parse(line);
        console.log(obj);
        console.log(`looking for == ${JSON.stringify(video)}`);
        if (video === obj.video_id) {
            view_data.push(obj.intervals_watched);
            console.log(obj.intervals_watched);
        }
    }

    // return the intervals found, or an empty set if none were found
    // this will need to be updated to combine multiple read results
    if (view_data.length === 0) {
        return [ [0, 0] ]
    } else {
        return view_data[0].intervals_watched;
    }

    
}


/******************************************************************************
 * Get the current version number and passes it over to the main program
 */
async function get_version_number () {
    return version;
}
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



  ipcMain.handle('get-version', async () => {
    return version;
  })

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
  //app.quit()
})

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

async function get_intervals_watched(video) {

    const data = await fsPromises.readFile('./output.data')
        .catch((err) => console.error('Failed to read file', err));

    let lines = data.toString().split('\n');
    let view_data = [];

    for (let line of lines) {
        view_data.push(JSON.parse(line));
    }

    return view_data[0].intervals_watched;
}
      

    // fs.readFileSync('./output.data', 'utf-8'), (err, data) => {
    //     if (err) {
    //         console.log('Error reading data file output.data.');
    //     } else {
    //         let lines = data.split('\n');
    //         let dump = ''
    //         for (let line of lines) {
    //             dump = JSON.parse(line);
    //         }
    //         console.log(dump);
    //         console.log(dump.intervals_watched);
    //         //return dump.intervals_watched;
    //         return [ [0, 55.82], [105.8, 205.1 ]];
    //     }
    // });
    // return [ [0, 25] ];

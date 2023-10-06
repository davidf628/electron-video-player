// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs');
const fsPromises = require('node:fs').promises;
const os = require('node:os');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const misc = require('./js/misc.js');

const version = "0.6.0";

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 650,
        webPreferences: {
        preload: path.join(__dirname, 'preload.js')
        }
    });
 
    // and load the index.html of the app.
    mainWindow.loadFile('index.html');
    console.log(app.getPath('userData'));

};

//   ipcMain.on('create-new-video-database', async (event) => {
//       const window = BrowserWindow.getFocusedWindow();
//       const options = {
//           title: 'Create a New File',
//           properties: ['openFile']
//       };
//       const result = await dialog.showOpenDialog(window, options);
//       if (result.filePaths && result.filePaths.length > 0) {
//           window.webContents.send('editor-event', { 
//               action: 'set-directory', 
//               data: result.filePaths[0]
//           })
//       }
//   });

//   ipcMain.on('open-video-database', async (event) => {
//     const window = BrowserWindow.getFocusedWindow();
//     const options = {
//         title: 'Open a Video DataFile',
//         properties: ['openDirectory']
//     };
//     const result = await dialog.showOpenDialog(window, options);
//     if (result.filePaths && result.filePaths.length > 0) {
//         window.webContents.send('editor-event', { 
//             action: 'open-file', 
//             data: result.filePaths[0]
//         })
//     }
//   });


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

    ipcMain.handle('get-video-data', fetch_video_data);
    ipcMain.handle('get-intervals-watched', get_intervals_watched);
    ipcMain.handle('get-version', get_version_number);
    ipcMain.on('save-video-data', save_progress_to_disk);

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
    try {
        let data = await fetch('https://davidf628.github.io/video_data_104.json')
        let payload = await data.json();
        return payload;
    } catch(error) {
        console.log('There was an error accessing video database.')
    }
}

/******************************************************************************
 * Reads through a data file and pulls all the intervals that qualify for a
 *  specific video.
 */
async function get_intervals_watched(event, video) {

    let view_data = [];

    // read the data file - will need to change this to student selected file
    let data = read_data_from_disk('./output.data')

    console.log(`DATA == ${data}`);
    
    if (data.trim().length > 0) {
        let lines = data.split('\n');
        // go through the lines and pick the ones that match the given video_id
        for (let line of lines) {
            if (line.trim().length > 0) {
                let obj = JSON.parse(line);
                if (video === obj.video_id) {
                    view_data = misc.union_intervals(obj.intervals_watched, view_data);
                }
            }
        }
    }

    return view_data;

}


/******************************************************************************
 * Saves user progress to disk
 */

function save_progress_to_disk (event, data) {

    let mainWindow = BrowserWindow.getFocusedWindow();

    data.username = os.userInfo().username;
    data.fingerprint = crypto.createHash('md5').update(`${data.timestamp}${data.student_id}`).digest('hex');
    let payload = `${JSON.stringify(data)}\n`;

    // Combine the new data with the data already saved on disk
    let current_data = read_data_from_disk('./output.data');

    let buffer = `${current_data}${payload}`;

    // Zip the data up to save space and encode it in base64
    buffer = encode_data(buffer);

    try {
        fs.writeFileSync('./output.data', buffer);
        dialog.showMessageBoxSync(mainWindow, { message: "File saved." });
    } catch (error) {
        dialog.showErrorBox("Error writing file", "An error occurred while attempting to save data.");
    }
}

function read_data_from_disk(filename) {

    // Read data from disk which is in base64 encoding
    let data = fs.readFileSync(filename).toString();
    data = decode_data(data);

    return data;
}

/******************************************************************************
 * Decodes data written to disk. The buffer is assumed to be a base64 string 
 *  and contains a zlib zip encoding scheme
 */
function decode_data(buffer) {
    let data_uncompressed = '';

    if (buffer.trim().length > 0) {
        // Decode the base64 string to binary
        let data_compressed = new Buffer.from(buffer, 'base64');

        // Unzip the binary string
        data_uncompressed = zlib.inflateSync(data_compressed).toString();
    }
    return data_uncompressed;
}

/******************************************************************************
 * Encodes data so that it is ready to be written to disk. It first uses zlib
 *  to compress the data into a smaller chunk and then converts it into 
 *  base64.
 */

function encode_data(buffer) {

    let compressed_data = zlib.deflateSync(buffer);
    let encoded_data = new Buffer.from(compressed_data).toString('base64');

    // Zip the data up to save space and encode it in base64
    return encoded_data;
}

/******************************************************************************
 * Get the current version number and passes it over to the main program
 */
async function get_version_number () {
    return version;
}
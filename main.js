// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsPromises = require('node:fs').promises;
const os = require('node:os');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const misc = require('./js/misc.js');

const version = "1.0.0";
let pref_file = 'video_player_prefs.json';
let backup_filename = 'userdata.backup';
let user_prefs = {};

const createWindow = () => {

    // Load user preferences
    user_prefs = load_preferences(pref_file);

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: user_prefs.width,
        height: user_prefs.height,
        webPreferences: {
        preload: path.join(__dirname, 'preload.js')
        }
    });
 
    // and load the index.html of the app.
    mainWindow.loadFile('index.html');

    return mainWindow;

};

const menu = new Menu()
menu.append(new MenuItem({
    label: 'Application Data',
    submenu: [{
        role: 'help',
        visible: false,
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+F' : 'Alt+Shift+F',
        click: () => { 
            dialog.showMessageBoxSync(null, { 
                message: `${app.getPath('appData')}`,
                title: 'Applicaiton Data Folder'
            });
        }
    },
    {
        role: 'help',
        visible: false,
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+P' : 'Alt+Shift+P',
        click: () => { 
            dialog.showMessageBoxSync(null, { 
                message: `${JSON.stringify(user_prefs)}`,
                title: 'Applicaiton Data Folder'
            });
        }
    },
    {
        role: 'help',
        visible: false,
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+B' : 'Alt+Shift+B',
        click: () => {
            let backup_src = path.join(app.getPath('userData'), backup_filename);
            let backup_dest = path.join(app.getPath('downloads'), backup_filename);
            try {
                fs.copyFileSync(backup_src, backup_dest);
            } catch (error) {
                dialog.showErrorBox('Copy File Error', 'There was an error trying to copy the backup file to your downloads folder.');
            }
            dialog.showMessageBoxSync(null, { 
                message: 'Backup file copied to downloads folder.',
                title: 'File Copied'
            });
        }
    },
    {
        role: 'help',
        click: () => { 
            dialog.showMessageBoxSync(null, { 
                message: `If you're running into issues, please take a screenshot of any errors you are experiencing and send those along with a description of the issue to your instructor.`,
                title: 'Help'
            });
        }
    }]
}));

Menu.setApplicationMenu(menu);



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

    ipcMain.handle('get-video-data', fetch_video_data);
    ipcMain.handle('get-intervals-watched', get_intervals_watched);
    ipcMain.handle('get-version', get_version_number);
    ipcMain.handle('get-default-settings', get_default_settings);
    ipcMain.on('save-video-data', save_progress_to_disk);
    ipcMain.on('set-user-data', set_user_data);
    ipcMain.on('create-new-video-database', create_new_database);
    ipcMain.on('open-video-database', open_video_database);

    let mainWindow = createWindow();
    mainWindow.on('close', () => {

        // Get the current view and save it in case it hasn't been saved 
        //  by the user
        mainWindow.webContents.send('request-save-action');

        // Write the current user preferences to disk
        user_prefs.width = mainWindow.getSize()[0];
        user_prefs.height = mainWindow.getSize()[1];
        save_preferences(pref_file, user_prefs);

    });

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
 * Sends the user_preferences that were saved to disk over to the front end
 */
async function get_default_settings() {
    return user_prefs;
}

async function create_new_database (event) {
    
    const window = BrowserWindow.getFocusedWindow();
    let default_path = '';

    if (user_prefs.data_file === '' || !fs.existsSync(user_prefs.data_file)) {
        default_path = app.getPath('documents');
    } else {
        default_path = user_prefs.data_file;
    }
    const options = {
        title: 'Create a New File',
        defaultPath: default_path,
        properties: ['createDirectory'],
        filters: [{
            name: 'Video Database Files',
            extensions: ['vdb']
          }]
    };
    const result = await dialog.showSaveDialogSync(window, options);
    if (result) {
        user_prefs.data_file = result;
        fs.writeFileSync(user_prefs.data_file, '');
    } else {
        process.exit(0);
    }
}
    

function open_video_database(event) {

    const window = BrowserWindow.getFocusedWindow();
    let default_path = '';
    if (user_prefs.data_file === '' || !fs.existsSync(user_prefs.data_file)) {
        default_path = app.getPath('documents');
    } else {
        default_path = user_prefs.data_file;
    }

    const options = {
        title: 'Open a Video Data File',
        defaultPath: default_path,
        properties: ['openFile'],
        filters: [{
            name: 'Video Database Files',
            extensions: ['vdb']
          }]
    };

    const result = dialog.showOpenDialogSync(window, options);
    if (result) {
        try {
            let data = read_data_from_disk(result[0]);
        } catch (error) {
            dialog.showErrorBox('File format error', 'Selected file is the wrong format.');
            process.exit(-1);
        }
        user_prefs.data_file = result[0];
    }
}


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
        dialog.showErrorBox('Network Error', 'There was an error accessing required video information, please check your internet connection and run the program again.');
        process.exit(-1);
    }
}

/******************************************************************************
 * Reads through a data file and pulls all the intervals that qualify for a
 *  specific video.
 */
async function get_intervals_watched(event, video) {

    let view_data = [];

    // read the data file - will need to change this to student selected file
    let data = read_data_from_disk(user_prefs.data_file)
    
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
 * Saves the current user data in a object in order to save the information to
 *  disk later for simplicity
 */
function set_user_data(event, username, id) {
    user_prefs.user_name = username;
    user_prefs.student_id = id;
}

/******************************************************************************
 * Saves user progress to disk
 */

function save_progress_to_disk (event, data) {

    let mainWindow = BrowserWindow.getFocusedWindow();

    data.username = os.userInfo().username;
    data.fingerprint = crypto.createHash('md5').update(`${data.timestamp}${data.student_id}`).digest('hex');
    let payload = `${JSON.stringify(data)}\n`;

    let backup_file = path.join(app.getPath('userData'), backup_filename);

    try {
        fs.appendFileSync(backup_file, payload);

    } catch (err) {

    }

    // Combine the new data with the data already saved on disk
    let current_data = read_data_from_disk(user_prefs.data_file);

    let buffer = `${current_data}${payload}`;

    // Zip the data up to save space and encode it in base64
    buffer = encode_data(buffer);

    try {
        fs.writeFileSync(user_prefs.data_file, buffer);
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
 * Get the current version number and passes it over to the main program. 
 *  Checks it against the latest version stated in Github and indicates to
 *  user to obtain the latest version if necessary.
 */
async function get_version_number () {

    // Get the current version number stated on GitHub:
    try {
        let data = await fetch('https://davidf628.github.io/versions.txt')
        let payload = await data.text();
        let lines = payload.split('\n');
        for (let line of lines) {
            let [program, curversion] = line.split(':');
            if (program === 'youtube-video-player') {
                [curmajor, curminor, curinc] = curversion.split('.');
                [thismajor, thisminor, thisinc] = version.split('.');
                if (thismajor < curmajor) {
                    dialog.showErrorBox('New Version Available', 'There is a new version of this software available which is different enough that you need to downlaod and install the latest available in OAKS.');
                    process.exit(0);
                } else if ((thismajor == curmajor) && ((thisminor != curminor) || (thisinc != curinc))) {
                    dialog.showErrorBox('New Version Available', 'There is a new version of this software available, you should download it and install the new version when you get a chance.');
                }
            }
        }
    } catch(error) {
        dialog.showErrorBox('Network Error', 'Could not read current version information online. No big deal, but you should check your internet connection before proceeding.');
    }

    return version;
}


/******************************************************************************
 * Loads user preferences from disk, currently this is the window width and
 *  height, the location of the data file, and the username and student id,
 *  chooses defaults for each item if they were not saved
 */

function load_preferences(filename) {
    let path_name = path.join(app.getPath('userData'), filename);

    if (fs.existsSync(path_name)) {
        let data = fs.readFileSync(path_name).toString();
        let saved_prefs = JSON.parse(data);
        let prefs = {
            height: saved_prefs.height ? saved_prefs.height : 800,
            width: saved_prefs.width ? saved_prefs.width : 650,
            user_name: saved_prefs.user_name ? saved_prefs.user_name : '',
            student_id: saved_prefs.student_id ? saved_prefs.student_id : '',
            data_file: saved_prefs.data_file ? saved_prefs.data_file : '',
        }
        return prefs;
    } else {
        const prefs = {
            height: 650,
            width: 800,
            user_name: '',
            student_id: '',
            data_file: ''
        }
        return prefs;
    }
}

/******************************************************************************
 * Saves user preferences to disk, currently this is the username, student id,
 *  path to the user data file, and the current window dimensions
 */
function save_preferences(filename, prefs) {
    
    let path_name = path.join(app.getPath('userData'), filename);
    let data = JSON.stringify(prefs);
    try {
        fs.writeFileSync(path_name, data);
    } catch (err) {
        dialog.showErrorBox('Disk Write Error', 'There was an error writing preferences');
    }

}
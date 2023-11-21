// main.js

// User Preference Object:
//   user_prefs = {
//       height: integer = 650,
//       width: integer = 800,
//       user_name: string = 'David Flenner',
//       student_id: string = '20125179',
//       email: string = 'flennerdr@cofc.edu',
//       ignored_versions: array = '[ "1.0.0", "1.0.1" ]
//   }

// Saved Video Data
//   video_data = {
//      video_id: string = "pKdi1Kz0eJU",
//      video_title: string = "1-1 Lecture",
//      student_name: string = "David Flenner",
//      student_id: string = "20125179",
//      score: integer = 10,
//      intervals_watched: Array of Arrays = [ [0, 10.3], [86.7, 97.6] ],
//      timestamp: datetime = "2023-11-19T22:06:10.955Z",
//      completion_date: datetime = "2023-11-19T23:30:05.054Z"
//   }


// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const zlib = require('node:zlib');
const misc = require('./js/misc.js');

const version = app.getVersion();
let pref_file = 'video_player_prefs.json';
let data_filename = path.join(app.getPath('userData'), 'userdata.vdb');
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

    ipcMain.handle('get-video-data', fetch_video_data);
    ipcMain.handle('get-intervals-watched', get_intervals_watched);
    ipcMain.handle('get-version', get_version_number);
    ipcMain.handle('get-user-data', get_user_data);
    ipcMain.handle('get-appdata-folder', get_appdata_folder);
    ipcMain.handle('get-completion-date', get_completion_date);
    ipcMain.handle('get-view-data', get_view_data);
    ipcMain.on('send-video-results', send_video_results);
    ipcMain.on('save-video-data', save_progress_to_disk);
    ipcMain.on('set-user-data', set_user_data);
    ipcMain.on('show-message-dialog', show_message_dialog);

    let mainWindow = createWindow();


    ipcMain.handle('send-init-data', send_init_data);

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

async function send_init_data() {

    let buffer = {};

    // Get user preferences
    buffer.user_prefs = user_prefs;

    // Get video data
    buffer.video_data = await fetch_video_data();

    // Get current view data

    // Get application version

    // Get video data for first video:
       // video id
       // video module
       // video lesson
       // video length
       // video completion date
       // video intervals_watched
       // video title

    return buffer;
}

/******************************************************************************
 * Sends the user_preferences that were saved to disk over to the front end
 */
async function get_user_data() {
    return user_prefs;
}

async function get_appdata_folder() {
    return app.getPath('appData');
}   

/******************************************************************************
 * Sends the current view result data to the front end to display to the 
 *  student so they know how much they have watched
 */
async function get_view_data() {
    let current_data = read_data_from_disk(data_filename);
    if (current_data !== null) {
        return JSON.parse(current_data);
    }
    return '';
}

/******************************************************************************
 * Determines the date that a video was completed and returns that to the
 *  front end
 */

async function get_completion_date(event, video) {
    let completion_date = '';

    // read the data file - will need to change this to student selected file
    let data = read_data_from_disk(data_filename);
    
    if (data != null) {

        let json_data = JSON.parse(data);

        for (let view of json_data) {
            if (view.video_id === video) {
                return view.completion_date;
            }
        }
   
    } 
    
    return completion_date;
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
    let data = read_data_from_disk(data_filename);
    
    if (data != null) {

        let json_data = JSON.parse(data);

        for (let view of json_data) {
            if (view.video_id === video) {
                return view.intervals_watched;
            }
        }
   
    } 
    
    return view_data;

}

/******************************************************************************
 * Saves the current user data in a object in order to save the information to
 *  disk later for simplicity
 */
function set_user_data(event, student) {
    user_prefs.user_name = student.name;
    user_prefs.student_id = student.id;
    user_prefs.email = student.email;
}

/******************************************************************************
 * Saves user progress to disk
 */

function save_progress_to_disk (event, data) {

    if (data_filename !== '') {
        let current_data = read_data_from_disk(data_filename);
        let video_previously_viewed = false;
        let json_views = [];
        if (current_data !== null) {
            json_views = JSON.parse(current_data);
            for (let view of json_views) {
                if (view.video_id === data.video_id) {
                    video_previously_viewed = true;
                    view.intervals_watched = misc.union_intervals(data.intervals_watched, view.intervals_watched);
                    view.score = data.score;
                    if (data.score > 95) {
                        let completion_date = view.completion_date ? view.completion_date : data.timestamp;
                        view.completion_date = completion_date;
                    }
                }
            }
        } 

        if (!video_previously_viewed) {
            if (data.score > 95) {
                let completion_date = data.completion_date ? data.completion_date : data.timestamp;
                data.completion_date = completion_date;
            }
            json_views.push(data);
        }

        try {

            // Write the data to disk
            let buffer = `${JSON.stringify(json_views)}`;

            // Zip the data up to save space and encode it in base64
            buffer = encode_data(buffer);
            fs.writeFileSync(data_filename, buffer);

            let tmp_filename = path.join(app.getPath('userData'), 'userdata.json');
            fs.writeFileSync(tmp_filename, JSON.stringify(json_views));

        } catch (error) {
            dialog.showErrorBox("Error writing file", "An error occurred while attempting to save data.");
        }

    }

}

function read_data_from_disk(filename) {

    // Read data from disk which is in base64 encoding
    if (fs.existsSync(filename)) {
        let data = fs.readFileSync(filename).toString();
        data = decode_data(data);

        return data;
    } else {
        return null;
    }
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
                    dialog.showErrorBox('New Version Available', `There is a new major version of this software available (version ${curversion}) and you need to downlaod and install the latest available in OAKS.`);
                    process.exit(0);
                } else if ((thismajor == curmajor) && ((thisminor != curminor) || (thisinc != curinc))) {
                    if (!user_prefs.ignored_versions.includes(curversion)) {
                        let buttonPressed = dialog.showMessageBoxSync(null, { 
                            title: 'New Version Available', 
                            message: `There is a new minor version of this software available (version ${curversion}), you should download it and install the new version when you get a chance, but it is not necessary.`,
                            buttons: [ 'Remind me Later', 'Ignore this version' ],
                            cancelId: 0,
                        });
                        if (buttonPressed == 1) {
                            user_prefs.ignored_versions.push(curversion);
                        }
                    }
                }
            }
        }
    } catch(error) {
        dialog.showErrorBox('Network Error', `Could not read current version information online. No big deal, but you should check your internet connection before proceeding. \n\nError\n\n${error}`);
    }

    return version;
}

/******************************************************************************
 * Shows a message dialog that is prompted from the browser window
 */

function show_message_dialog(event, title, message) {

    dialog.showMessageBoxSync(null, { title: title, message: message });
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
            email: saved_prefs.email ? saved_prefs.email : '',
            ignored_versions: saved_prefs.ignored_versions ? saved_prefs.ignored_versions : [],
        }
        return prefs;
    } else {
        const prefs = {
            height: 650,
            width: 800,
            user_name: '',
            student_id: '',
            email: '',
            ignored_versions: []
        }
        return prefs;
    }
}

/******************************************************************************
 * Saves user preferences to disk, currently this is the username, student id,
 *  path to the user data file, and the current window dimensions
 */
function save_preferences(filename, prefs) {
    
    if (prefs.data_file) {
        delete prefs.data_file;
    }

    let path_name = path.join(app.getPath('userData'), filename);
    let data = JSON.stringify(prefs);
    try {
        fs.writeFileSync(path_name, data);
    } catch (err) {
        dialog.showErrorBox('Disk Write Error', 'There was an error writing preferences');
    }

}

/******************************************************************************
 * Copies the video database to the ~/Downloads folder and opens a finder 
 *  window to that path to make it easy for students to locate the file they
 *  need to send to their instructor.
 */
function send_video_results() {

    // Make a file name that uses a persons email address (if possible)
    let newfilename = '';
    if (user_prefs.email !== '') {
        let atloc = user_prefs.email.indexOf('@');
        if (atloc == -1) {
            newfilename = user_prefs.email;
        } else {
            newfilename = user_prefs.email.substring(0, atloc);
        }
        newfilename.replace(/[^A-Za-z]/g, '');
        if (newfilename.length == 0) {
            newfilename = 'userdata';
        }
    } else {
        newfilename = 'userdata';
    }

    newfilename = `${newfilename}.vdb`;
    let new_filepath = path.join(app.getPath('downloads'), newfilename)


    if (fs.existsSync(new_filepath)) {
        fs.unlinkSync(new_filepath);
    }

    // Copy the vdb file to the ~/Downloads folder
    fs.copyFile(data_filename, new_filepath, (err) => {
        if (err) {
            dialog.showMessageBoxSync(null, { 
                message: err.message,
                title: 'Error'
            });
        } else {
            // Open a finder window to the folder
            shell.showItemInFolder(new_filepath);

            // Indicate to them that they need to now upload this file to
            //  the assignments area in OAKS
            dialog.showMessageBoxSync(null, { 
                message: `The file "${newfilename}" was copied to your Downloads folder, please upload this file into the Assignments area of OAKS for your professor to update your grade.`,
                title: 'Upload File to OAKS'
            });
        }
    });
}

/******************************************************************************
 * Below here is the application menu definition
 */

const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Send Professor My Grades',
                accelerator: process.platform === 'darwin' ? 'Alt+Cmd+S' : 'Alt+Shift+S',
                click: () => {
                    send_video_results();                   
                }
            },
            {
                label: 'Show vdb File Location',
                accelerator: process.platform === 'darwin' ? 'Alt+Cmd+L' : 'Alt+Shift+L',
                click: () => {
                    if (fs.existsSync(data_filename)) {
                        shell.showItemInFolder(data_filename);
                    } else {
                        dialog.showMessageBoxSync(null, { 
                            message: 'The video database file could not be located, have you created it already? If not, press the "New Video Database" button at the start of the program',
                            title: 'File Not Found'
                        });
                    }
                    
                }
            }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Help',
                click: () => { 
                    dialog.showMessageBoxSync(null, { 
                        message: `If you're running into issues, please take a screenshot of any errors you are experiencing and send those along with a description of the issue to your instructor.`,
                        title: 'Help'
                    });
                }
                   
            },
            {
                label: 'Copy Backup',
                visible: true,
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
                label: 'View User Preferences',
                visible: true,
                accelerator: process.platform === 'darwin' ? 'Alt+Cmd+P' : 'Alt+Shift+P',
                click: () => { 
                    dialog.showMessageBoxSync(null, { 
                        message: `${JSON.stringify(user_prefs)}`,
                        title: 'User Prefrences'
                    });
                }
            
            },
            {
                label: 'App Data Folder',
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
                role: 'toggleDevTools',
                visible: false,
            }
        ]
    }
];

if (process.platform === 'darwin') {
    template.unshift({
        label: app.getName(),
        submenu: [
            {
                role: 'about',
            },
            {
                type: 'separator',
            },
            {
                role: 'quit',
            }
        ]
    })
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
'use strict';

import {app, BrowserWindow, ipcMain} from "electron";

const db = require('./db');
const kafka = require('./kafka');

db.init();

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:${require('../../../config').port}`
  : `file://${__dirname}/index.html`;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800
  });

  kafka.init(mainWindow);

  mainWindow.loadURL(winURL);

  mainWindow.on('closed', () => {
    mainWindow = null
  });

  console.log('mainWindow opened')
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

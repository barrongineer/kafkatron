import {app, ipcMain} from "electron";

const Datastore = require('nedb');
const appPath = app.getPath('userData');
const db = new Datastore({filename: `${appPath}/connections.db`, autoload: true});

module.exports = {
  init: function () {
    ipcMain.on('FIND_ALL_CONNECTIONS', function (event) {
      db.find({}, function (err, connections) {
        event.sender.send('FIND_ALL_CONNECTIONS', connections);
      });
    });

    ipcMain.on('SAVE_CONNECTION', function (event, connection) {
      console.log('saving the connection to nedb: ' + connection.name);
      db.insert(connection, function (err, newConnection) {
        console.log('id: ' + newConnection._id);
      });
    });

    ipcMain.on('UPDATE_CONNECTION', function (event, connection) {
      console.log('updating the connection to nedb: ' + connection.name);
      db.update({_id: connection._id}, connection, {}, function (err, numReplaced) {
        console.log(`updated ${numReplaced} documents.`);
      });
    });

    ipcMain.on('DELETE_CONNECTION', function (event, connection) {
      console.log('deleting id: ' + connection._id);
      db.remove({_id: connection._id}, {}, function (err, numRemoved) {
        console.log('num removed: ' + numRemoved);
      });
    });
  }
};

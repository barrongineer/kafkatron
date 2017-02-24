'use strict';

import {app, BrowserWindow, ipcMain} from "electron";

const Datastore = require('nedb');
const appPath = app.getPath('userData');
const db = new Datastore({filename: `${appPath}/connections.db`, autoload: true});

const kafka = require('kafka-node');
const Producer = kafka.Producer;
const Consumer = kafka.Consumer;
var client, myConsumer, myProducer, myOffset;

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

ipcMain.on('ZK_CONNECT', function (event, connection) {
    let connectionString = `${connection.zkHost}:${connection.zkPort}/`;
    console.log(`Connnecting to zookeeper: ${connectionString}`);

    client = new kafka.Client(connectionString);
    myProducer = new Producer(client);

    myProducer.on('ready', function () {
        console.log('The producer is ready.');

        myOffset = new kafka.Offset(client);

        mainWindow.webContents.send('PRODUCER_READY');
    });

    myProducer.on('error', function (err) {
        console.log('The producer encountered an error connecting to Zookeeper');
        console.log(err);
    });
});

ipcMain.on('CLOSE_CONNECTION', function (event) {
    if (myConsumer) {
        myConsumer.close(function () {
            client.close(function () {
                event.sender.send('CONNECTION_CLOSED');
            });
        });
    } else {
        event.sender.send('CONNECTION_CLOSED');
    }
});

ipcMain.on('LIST_TOPICS', function (event) {
    client.loadMetadataForTopics([], function (err, results) {
        if (err) {
            console.log(err);
        }

        console.log(results);
        event.sender.send('LIST_TOPICS', {results: results, error: err});
    });
});

ipcMain.on('CREATE_TOPIC', function (event, topic) {
    myProducer.createTopics([topic], false, function (err, data) {
        event.sender.send('TOPIC_CREATED', {data: data, err: err});
    });
});

ipcMain.on('SEND_MESSAGE', function (event, message) {
    var payloads = [{
        topic: message.topic,
        messages: message.payload,
        partition: 0
    }];

    myProducer.send(payloads, function (err) {
        if (err) {
            console.log('Error: ' + err);
        }
    });
});

ipcMain.on('CREATE_CONSUMER', function (event, topic) {
    myProducer.createTopics([topic], false, function (err, data) {
        console.log(`Error: ${err}`)
    });

    myOffset.fetchLatestOffsets([topic], function (err, offsets) {
        if (err) {
            console.log(`There was an error fetching the latest offsets: ${err}`);
            return;
        }

        let partition = 0;
        let offset = offsets[topic][partition];
        if (offset > 0) {
            offset = offset - 1;
        }

        console.log(`OFFSET: ${offset}`);

        myConsumer = new Consumer(client, [{topic: topic, offset: offset, partition: partition}], {fromOffset: true});

        myConsumer.on('message', function (message) {
            mainWindow.webContents.send('MESSAGE_CONSUMED', message);
        });
    });
});

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
        createWindow()
    }
});

import {app, ipcMain} from "electron";

const kafka = require('kafka-node');
const Producer = kafka.Producer;
const Consumer = kafka.Consumer;
var client, myConsumer, myProducer, myOffset;

module.exports = {
  init: function (mainWindow) {
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
  }
};
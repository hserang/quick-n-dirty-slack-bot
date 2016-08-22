'use strict';

const APP_PORT = 3000;
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const io = require('socket.io')(server);

// rtm stuff
const process = require('process');
const {
  RtmClient,
  CLIENT_EVENTS,
  RTM_EVENTS,
  MemoryDataStore
} = require('@slack/client');

const token = process.env.SLACK_API_TOKEN || '';
const rtm = new RtmClient(token, {
  logLevel: 'error',
  dataStore: new MemoryDataStore()
});

/* eslint-disable max-len */
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, rtmStartData => {
  console.log(
    `Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});


rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReactionAdded(reaction) {
  console.log('Reaction added:', reaction);
});

rtm.on(RTM_EVENTS.REACTION_REMOVED, function handleRtmReactionRemoved(reaction) {
  console.log('Reaction removed:', reaction);
});
/* eslint-enable */

app.use(express.static('public'));

// todo clean up all the dirs
// and related configs

rtm.start();

server.listen(APP_PORT, () => {
  console.log('listening on port' + APP_PORT);
});

io.on('connection', socket => {
  console.log('socket connection');

  rtm.on(RTM_EVENTS.MESSAGE, message => {

    // Listens to all `message` events from the team
    console.log(
      'User %s posted a message: %s in %s channel of ts: %s',
      rtm.dataStore.getUserById(message.user).name,
      message.text,
      rtm.dataStore.getChannelGroupOrDMById(message.channel).name,
      message.ts
    );

    const slackMessage = {
      username: rtm.dataStore.getUserById(message.user).name,
      group_name: rtm.dataStore.getChannelGroupOrDMById(message.channel).name,
      text: message.text,
      timestamp: message.ts
    };

    console.log('this is the message obj', slackMessage);

    socket.emit('message', slackMessage);
  });

});

app.get('/', (req, res) => {
  res.sendFile('/index.html');
});


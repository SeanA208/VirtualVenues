// Imports
var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , tcp_server = require('net').createServer(tcp_handler)
  , io = require('socket.io').listen(server)
  , fs = require('fs')
  , net = require('net')
;

// State variables
var SCORE_DELTAS = {"illinois" : 0, "irvine" : 0};
var HISTOGRAM_DELTAS = [0, 0, 0, 0, 0, 0, 0, 0];
var SCORE_CLIENT_SOCKET = null;
var ACTIVE_LEVEL = 0;
var LEVEL_SETTING = {
  "TotalDancers" : 2,
  "EffortsPerDancer" : 1,
  "DancerEfforts" : { 
    0 : [0], 
    1 : [2]}
};

// TEST
// Hard coded settings per level
var LEVEL_SETTINGS = [
  {"TotalDancers" : 2, "EffortsPerDancer" : 1, 
    "DancerEfforts" : {0 : [0], 2 : [2]}},
  {"TotalDancers" : 3, " EffortsPerDancer" : 2, 
    "DancerEfforts" : {0 : [6, 7], 1 : [2, 3], 2: [1, 2]}},
  {"TotalDancers" : 4, "EfforsPerDancer" : 2,
    "DancerEfforts" : {0 : [0, 1], 1 : [2, 3], 2 : [4, 5], 3 : [6,7]}}
];

// Message Type Definitions
var ServerMessage = { 
  LevelSetting : "levelsetting",
  Quiz : "quiz"
};

var ClientMessage = {
  QuizAnswer : "quizanswer"
};

var ScoreClientMessage = {
  Connection : "scoreconnection",
  ScoreDeltas : "scoredeltas",
  EffortDeltas : "effortdeltas" 
};

// Used ports and IP addresses
var HTTP_PORT = 8080
  , TCP_PORT  = 8081
  , MAX_CLIENT_RECEIVER_PORT = 6001
  , MAX_CLIENT_IP = null
;

// Start listening to connections in Debug Mode
server.listen(HTTP_PORT);
tcp_server.listen(TCP_PORT);
io.set('log level', 2);

// Use express to serve statics 
// Statics are everything in '/res' as well as index.html (in /public)
// /res
//    /images
//    /js
//    /css
app.configure(function(){
  app.use('/res', express.static(__dirname + '/res'));
  app.use(express.static(__dirname + '/public'));
})

// Handle a TCP request to server coming from Max
function tcp_handler(socket) {
  console.log('tcp handler: request received');
};


// Calculates correct quiz answer matches
// NOTE: Doesn't consider previous answer yet
function getScoreChange(message) {
  var count = 0;
  if (message && message.Answer) {
    // If Server and Client levels are the same
    if (message.Answer.Level == ACTIVE_LEVEL) {
      // Loop through each dancer
      for (var dancerId in message.Answer.DancerEfforts) {
        // Check if the dancer is actually dancing this level
        if (dancerId in LEVEL_SETTING["DancerEfforts"]) {
          // Check if the effort guess is correct
          for (var effortId in message.Answer.DancerEfforts[dancerId]) {
            for (var correctEffortId in LEVEL_SETTING["DancerEfforts"][dancerId]) {
              if (effortId === correctEffortId) {
                count += 1;
              }
            }
          }
        }
      }
    }
  }
  return count;
};

/* 
  Handle client events
*/
io.sockets.on('connection', function (socket) {
  console.log('server: established a connection');

  // Notify client of the current level
  console.log('server: sending level setting');
  socket.emit(ServerMessage.LevelSetting, {
    "Level" : ACTIVE_LEVEL,
    "TotalDancers" : LEVEL_SETTING.TotalDancers,
    "EffortsPerDancer" : LEVEL_SETTING.EffortsPerDancer
  });

  // Client Handlers
  socket.on(ClientMessage.QuizAnswer, function(data) {  
    console.log('server: quiz answer');
    console.log(data);  
    var scoreChange = getScoreChange(data);
    if (scoreChange !== 0) {
      SCORE_DELTAS[data.Team] += scoreChange;   
      SCORE_CLIENT_SOCKET.emit(ScoreClientMessage.ScoreDeltas, 
        { "Deltas" : SCORE_DELTAS });   
    }

    HISTOGRAM_DELTAS[data.Answer] += 1;
    if (data.PreviousAnswer === -1) {
      console.log('no previous answer'); 
    }
    else {
      HISTOGRAM_DELTAS[data.PreviousAnswer] -= 1;
    }
    if (SCORE_CLIENT_SOCKET){
      SCORE_CLIENT_SOCKET.emit(ScoreClientMessage.HistogramDeltas, { "Deltas" : HISTOGRAM_DELTAS });
      HISTOGRAM_DELTAS = [0, 0, 0, 0, 0, 0, 0, 0];  
    }
    
  });

  // Score Client Handlers
  socket.on(ScoreClientMessage.Connection, function() {
    console.log("server: score client connected");
    SCORE_CLIENT_SOCKET = socket;
  });
});

var levelUpInterval = setInterval(function () {
  if (ACTIVE_LEVEL < LEVEL_SETTINGS.length - 1) {
    ACTIVE_LEVEL++;
    LEVEL_SETTING = LEVEL_SETTINGS[ACTIVE_LEVEL];
    console.log(LEVEL_SETTING);
    console.log('server: sending level setting');
    io.sockets.emit(ServerMessage.LevelSetting, { 
      "Level" : ACTIVE_LEVEL,
      "TotalDancers" : LEVEL_SETTING.TotalDancers,
      "EffortsPerDancer" : LEVEL_SETTING.EffortsPerDancer
    });
  }
}, 7000);

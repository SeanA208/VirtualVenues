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
var SCORE_CLIENT_SOCKET_UIUC = new Array();
var SCORE_CLIENT_SOCKET_IRVINE = new Array();
var ADMIN_SOCKET = null;
var ACTIVE_LEVEL = 0;
var LEVEL_SETTING = {
  "TotalDancers" : 2,
  "EffortsPerDancer" : 1,
  "DancerEfforts" : { 
    '1' : [0], 
    '2' : [2]}
};


//TODO(sean): Clean this up, time permitting. Currently hardcoded.
var full_histogram = {
  Illinois : 
    // Per level
    [
      // Histogram per dancer
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 1, Dancers 1 and 2
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 2, Dancers 1, 2, 3, 4
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 3, Dancers 1, 2
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ] // Level 4, Dancers 1, 2, 3, 4
    ],
  Irvine :
   // Per level
    [
      // Histogram per dancer
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 1, Dancers 1 and 2
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 2, Dancers 1, 2, 3, 4
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 3, Dancers 1, 2
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ] // Level 4, Dancers 1, 2, 3, 4
    ]
}

// TEST
// Hard coded settings per level
var LEVEL_SETTINGS = [
  {"TotalDancers" : 2, "EffortsPerDancer" : 1, 
    "DancerEfforts" : {'1' : [0], '2' : [2]}},
  {"TotalDancers" : 3, "EffortsPerDancer" : 2, 
    "DancerEfforts" : {'1' : [6, 7], '2' : [2, 3], '3': [1, 2]}},
  {"TotalDancers" : 4, "EffortsPerDancer" : 2,
    "DancerEfforts" : {'1' : [0, 1], '2' : [2, 3], '3' : [4, 5], '4' : [6,7]}}
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
  EffortDeltas : "effortdeltas",
  ChangeLevel : "scorechangelevel"
};

var AdminClientMessage = {
  Connection : "adminconnection",
  ChangeLevel : "adminchangelevel"
}

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
function getScoreChange(answer) {
  console.log("Calculating score for quiz answer");
  var count = 0;
  if (answer) {
    // Loop through each dancer
    for (var dancerId in answer.DancerEfforts) {
      // Check if the dancer is actually dancing this level
      if (dancerId in LEVEL_SETTING["DancerEfforts"]) {
        console.log("\t Guess for dancer: " + dancerId);
        // Check if the effort guess is correct
        for (var i = 0; i < answer.DancerEfforts[dancerId].length; i += 1) {
          var effortId = answer.DancerEfforts[dancerId][i];
          console.log("\t Effort: " + effortId);
          if (LEVEL_SETTING.DancerEfforts[dancerId].indexOf(parseInt(effortId)) > -1) {
            count += 1;
          } else {
            console.log("\t Incorrect effort guess: " + effortId); 
          }
        }
      } else {
        console.log("\t Dancer not in current level: " + dancerId);
      }
    }
  }
  console.log('\t Answer score: ' + count);
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

    if (data.Answer.Level != ACTIVE_LEVEL) {
      console.log("\t quiz answer level is different from current");
      return;
    }

    if (data.Team == 'illinois' && SCORE_CLIENT_SOCKET_UIUC.length == 0) {
      console.log ("\t score client not connected for UIUC");
      return;
    }
    else if(data.Team == 'irvine' && !SCORE_CLIENT_SOCKET_IRVINE.length == 0) {
      console.log ("\t score client not connected for Irvine");
      return;
    }

    var currentScore = getScoreChange(data.Answer);
    var previousScore = getScoreChange(data.PreviousAnswer);
    var scoreChange = currentScore - previousScore;
    console.log('scoreChange:' + scoreChange);
    if (scoreChange != 0) {
      SCORE_DELTAS[data.Team] = scoreChange;
      console.log('Score Deltas: ');   
      console.log(SCORE_DELTAS);

      if(SCORE_CLIENT_SOCKET_UIUC) {
        console.log('server: Illinois Score emit');
        for(var i=0; i<SCORE_CLIENT_SOCKET_UIUC.length; i++) {
          SCORE_CLIENT_SOCKET_UIUC[i].emit(ScoreClientMessage.ScoreDeltas, 
          { "Deltas" : SCORE_DELTAS }); 
        }
      }
      
      if(SCORE_CLIENT_SOCKET_IRVINE ) {
        console.log('server: irvine Score emit');
        for (var i = 0; i <SCORE_CLIENT_SOCKET_IRVINE.length; i++) {
          SCORE_CLIENT_SOCKET_IRVINE[i].emit(ScoreClientMessage.ScoreDeltas, 
          { "Deltas" : SCORE_DELTAS });
        }
      }  
    }

    for (var dancerId in data.Answer.DancerEfforts) {
      for (var i = 0; i < data.Answer.DancerEfforts[dancerId].length; i += 1) {
        HISTOGRAM_DELTAS[data.Answer.DancerEfforts[dancerId][i]] += 1;    
      }
    }

    if (data.PreviousAnswer) {
      for (var dancerId in data.PreviousAnswer.DancerEfforts) {
        for (var i = 0; i < data.PreviousAnswer.DancerEfforts[dancerId].length; i += 1) {
          HISTOGRAM_DELTAS[data.PreviousAnswer.DancerEfforts[dancerId][i]] -= 1;
        }
      }
    }
    else {
      console.log('\t no previous answer');
    }
    
    if (data.Team == 'illinois' && SCORE_CLIENT_SOCKET_UIUC.length > 0 ){
      console.log('UIUC HistogramDeltas');
      console.log(HISTOGRAM_DELTAS);
      for ( var i=0; i < SCORE_CLIENT_SOCKET_UIUC.length; i++ ) {
        SCORE_CLIENT_SOCKET_UIUC[i].emit(ScoreClientMessage.HistogramDeltas, { "Deltas" : HISTOGRAM_DELTAS, "Team": data.Team });
      }
      HISTOGRAM_DELTAS = [0, 0, 0, 0, 0, 0, 0, 0];  
    }
    else if (data.Team == 'irvine' && SCORE_CLIENT_SOCKET_IRVINE.length > 0){
      console.log('Irvine HistogramDeltas');
      console.log(HISTOGRAM_DELTAS);
      for( var i=0; i < SCORE_CLIENT_SOCKET_IRVINE.length; i++ ) {
        SCORE_CLIENT_SOCKET_IRVINE[i].emit(ScoreClientMessage.HistogramDeltas, { "Deltas" : HISTOGRAM_DELTAS, "Team": data.Team });
      }
      HISTOGRAM_DELTAS = [0, 0, 0, 0, 0, 0, 0, 0];  
    }
  });

  // Score Client Handlers
  socket.on(ScoreClientMessage.Connection, function (data) {
    console.log("server: score client connected");
    if (data.Team == 'illinois')
    {
      console.log("server: score client set for UIUC");
      SCORE_CLIENT_SOCKET_UIUC.push(socket);
    }
    else if (data.Team == 'irvine') {
      console.log("server: score client set for Irvine");
      SCORE_CLIENT_SOCKET_IRVINE.push(socket);
    }
  });

  socket.on('disconnect', function() {
    console.log('disconnect!!!');
    for (var indexNum = SCORE_CLIENT_SOCKET_UIUC.length - 1; indexNum >= 0; indexNum--) 
    {
      if ( SCORE_CLIENT_SOCKET_UIUC[indexNum] === socket ) {
        console.log('disconnect for UIUC scoreboard');
        SCORE_CLIENT_SOCKET_UIUC.splice(indexNum, 1);
      }
    }
    for (var indexNum = SCORE_CLIENT_SOCKET_IRVINE.length - 1; indexNum >= 0; indexNum--) 
    {
      if ( SCORE_CLIENT_SOCKET_IRVINE[indexNum] === socket ) {
        console.log('disconnect for irvine scoreboard');
        SCORE_CLIENT_SOCKET_IRVINE.splice(indexNum, 1);
      }
    }
  });
  
  // Admin Client Handlers
  socket.on(AdminClientMessage.Connection, function() {
    console.log("server: admin client connected");
    ADMIN_SOCKET = socket;
  });

  socket.on(AdminClientMessage.ChangeLevel, function(data) {
    console.log("server: admin supplying new level information");
    if (data.level)
      ACTIVE_LEVEL = data.level;
    if (data.totalDancers)
      LEVEL_SETTING.TotalDancers = data.totalDancers;
    if (data.effortsPerDancer)
      LEVEL_SETTING.EffortsPerDancer = data.effortsPerDancer;

    sendLevelUpdates();
  })
});

function sendLevelUpdates() {
  console.log('server: sending level setting with level ' + ACTIVE_LEVEL);
  io.sockets.emit(ServerMessage.LevelSetting, { 
    "Level" : ACTIVE_LEVEL,
    "TotalDancers" : LEVEL_SETTING.TotalDancers,
    "EffortsPerDancer" : LEVEL_SETTING.EffortsPerDancer
  });

  var levelChange = {
    "Level" : ACTIVE_LEVEL,
    "EffortsPerDancer" : LEVEL_SETTING.EffortsPerDancer,
    "TotalDancers" : LEVEL_SETTING.TotalDancers
  };

  if (SCORE_CLIENT_SOCKET_IRVINE) {
    for (var i=0; i < SCORE_CLIENT_SOCKET_IRVINE.length; i++ ) {
      SCORE_CLIENT_SOCKET_IRVINE[i].emit(ScoreClientMessage.ChangeLevel, levelChange);
    }
  }

  if (SCORE_CLIENT_SOCKET_UIUC) {
    for (var i=0; i < SCORE_CLIENT_SOCKET_UIUC.length; i++ ) {
      SCORE_CLIENT_SOCKET_UIUC[i].emit(ScoreClientMessage.ChangeLevel, levelChange);
    }
  }
};

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
var ACTIVE_LEVEL = 0
  , CURRENT_QUIZ_ANSWER = 0
  , SCORE_DELTAS = {"illinois" : 0, "irvine" : 0}
  , HISTOGRAM_DELTAS = [0, 0, 0, 0, 0, 0, 0, 0]
  , SCORE_CLIENT_SOCKET = null 
;

// Message Type Definitions
var ServerMessage = {
  ActiveLevel : "activelevel",  
  LevelUp : "levelup",
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
io.set('log level', 1);

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

/* 
  Handle client events
*/
io.sockets.on('connection', function (socket) {
  console.log('server: established a connection');
  // Notify client of the current level
  var message = {};

  socket.emit(ServerMessage.ActiveLevel, 
    { "Level" : ACTIVE_LEVEL });

  // Client Handlers
  socket.on(ClientMessage.QuizAnswer, function(data) {  
    console.log('server: quiz answer');
    console.log(data);  
    if (data.Answer === CURRENT_QUIZ_ANSWER) {
      SCORE_DELTAS[data.Team] += 1;      
    }

    HISTOGRAM_DELTAS[data.Answer] += 1;
    if (data.PreviousAnswer === -1) {
      console.log('no previous answer'); 
    }
    else {
      HISTOGRAM_DELTAS[data.PreviousAnswer] -= 1;
    }
  });

  // Score Client Handlers
  socket.on(ScoreClientMessage.Connection, function() {
    console.log("server: score client connected");
    SCORE_CLIENT_SOCKET = socket;
  });

  /* 
    Timer Actions
  */
  var totalScoreInterval = setInterval(function () {    
    if (!SCORE_CLIENT_SOCKET) {
      // console.log("score client not found");
    }
    else {
      console.log("score deltas, illinois - " + SCORE_DELTAS["illinois"] + 
        ", irvine - " + SCORE_DELTAS["irvine"]);
      SCORE_CLIENT_SOCKET.emit(ScoreClientMessage.ScoreDeltas, 
        { "Deltas" : SCORE_DELTAS });
      SCORE_DELTAS = {"illinois" : 0, "irvine" : 0};
    }
  }, 5000);

  var histogramInterval = setInterval(function () {
    if (!SCORE_CLIENT_SOCKET) {
      // console.log("score client not found");
    }
    else {
      SCORE_CLIENT_SOCKET.emit(ScoreClientMessage.HistogramDeltas,
        { "Deltas" : HISTOGRAM_DELTAS });
      HISTOGRAM_DELTAS = [0, 0, 0, 0, 0, 0, 0, 0];
    }
  }, 5000);

  var levelUpInterval = setInterval(function () {
    ACTIVE_LEVEL++;
    io.sockets.emit(ClientMessage.LevelUp, 
      { "Level" : ACTIVE_LEVEL });
  }, 30000);
});
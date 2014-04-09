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
  , SCORE_DELTAS = [0, 0]
  , HISTOGRAM_DELTAS = [0, 0, 0, 0, 0, 0, 0, 0]
  , SCORE_CLIENT_SOCKET = null 
;

// Message Type Definitions
var Server = {
  ActiveLevelMessage : { Event: "activelevel", Level: "level" },  
  LevelUpMessage : { Event: "levelup", Level: "level" },
  QuizMessage : { Event: "quiz" }
};

var Client = {
  QuizAnswerMessage : 
    { Event : "quizanswer", Team : "team", 
    Answer : "answer", PreviousAnswer : "prevanswer"}
};

var ScoreClient = {
  ConnectionMessage : { Event : "scoreconnection" },
  ScoreDeltasMessage : { Event : "scoredeltas", Deltas : "deltas" },
  EffortDeltasMessage : { Event : "effortdeltas", Deltas : "deltas" } 
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
io.set('log level', NodeLogLevel.DEBUG);

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
  socket.emit(Server.ActiveLevelMessage.Event, 
    { Server.ActiveLevelMessage.Level : ACTIVE_LEVEL });

  // Client Handlers
  socket.on(Client.QuizAnswerMessage.Event, function(data) {    
    var fields = Client.QuizAnswerMessage;
    if (data[fields.Answer] == CURRENT_QUIZ_ANSWER) {
      SCORE_DELTAS[data[fields.Team]]++;      
    }

    HISTOGRAM_DELTAS[fields.Answer]++;
    if (data[fields.PreviousAnswer]) {
      HISTOGRAM_DELTAS[fields.PreviousAnswer]--;
    }
  });

  // Score Client Handlers
  socket.on(ScoreClientMessage.Connection.Event) {
    console.log("server: score client connected");
    SCORE_CLIENT_SOCKET = socket;
  };


  /* 
    Timer Actions
  */
  var totalScoreInterval = setInterval(function () {
    SCORE_CLIENT_SOCKET.emit(ScoreClient.ScoreDeltasMessage.Event, 
      { ScoreClient.ScoreDeltasMessage.Deltas : SCORE_DELTAS });
    SCORE_DELTAS = [0, 0];
  }, 2500);

  var histogramInterval = setInterval(function () {
    SCORE_CLIENT_SOCKET.emit(ScoreClient.HistogramDeltasMessage.Event,
      { ScoreClient.HistogramDeltasMessage.Deltas : HISTOGRAM_DELTAS });
    HISTOGRAM_DELTAS = [0, 0, 0, 0, 0, 0, 0, 0];
  }, 2500);

  var levelUpInterval = setInterval(function () {
    ACTIVE_LEVEL++;
    sockets.emit(Client.LevelUpMessage.Event, 
      { Client.LevelUpMessage.Level : ACTIVE_LEVEL });
  }, 10000);
});
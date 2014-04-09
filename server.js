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
var ServerMessage = {
  ACTIVE_LEVEL : "activelevel",  
  LEVEL_UP : "levelup",
  QUIZ : "quiz"
};

var ClientMessage = {
  QUIZ_ANSWER : "quizanswer"
};

var ScoreClientMessage = {
  CONNECTION : "scoreconnection",
  SCORE_DELTA : "scoredelta",
  EFFORT_DELTA : "effortdelta"
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
app.configure(function(){
  app.use('/res', express.static(__dirname + '/res'));
  app.use('/css', express.static(__dirname + '/css'));
  app.use('/js', express.static(__dirname + '/js'));
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
  socket.emit(ServerMessage.ACTIVE_LEVEL, 
    {"activeLevel" : ACTIVE_LEVEL});

  // Client Handlers
  socket.on(ClientMessage.QUIZ_ANSWER, function(data) {    
    if (data.answer == CURRENT_QUIZ_ANSWER) {
      SCORE_DELTAS[data.team]++;      
    }

    HISTOGRAM_DELTAS[data.answer]++;
    if (data.prevAnswer) {
      HISTOGRAM_DELTAS[data.prevAnswer]--;
    }
  });

  // Score Client Handlers
  socket.on(ScoreClientMessage.CONNECTION) {
    console.log("server: score client connected");
    SCORE_CLIENT_SOCKET = socket;
  };

  
});

// Timer Actions
var totalScoreInterval = setInterval(function () {
  SCORE_CLIENT_SOCKET.emit(ScoreClientMessage.SCORE_DELTA, 
    SCORE_DELTAS);
  SCORE_DELTAS = [0, 0];
}, 2500);

var histogramInterval = setInterval(function () {
  SCORE_CLIENT_SOCKET.emit(ScoreClientMessage.HISTOGRAM_DELTAS,
      HISTOGRAM_DELTAS);
  HISTOGRAM_DELTAS = [0, 0, 0, 0, 0, 0, 0, 0];
}, 2500);
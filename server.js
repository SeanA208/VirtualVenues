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
var SCORES = {"illinois" : 0, "irvine" : 0};
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

// TEST
// Hard coded settings per level
var LEVEL_SETTINGS = [
  { "TotalDancers" : 2, "EffortsPerDancer" : 1, 
    "DancerEfforts" : {'1' : [0], '2' : [2]}},
  { "TotalDancers" : 3, "EffortsPerDancer" : 2, 
    "DancerEfforts" : {'1' : [6, 7], '2' : [2, 3], '3': [1, 2]}},
  { "TotalDancers" : 4, "EffortsPerDancer" : 2,
    "DancerEfforts" : {'1' : [0, 1], '2' : [2, 3], '3' : [4, 5], '4' : [6,7]}}
];

var RUBRIC = JSON.parse(fs.readFileSync('rubric.json', 'utf8'));

var all_scores = {
  "illinois" : 
    // Per level
    [
      // Histogram per dancer
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 1, Dancers 1 and 2
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 2, Dancers 1, 2, 3, 4
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 3, Dancers 1, 2
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ] // Level 4, Dancers 1, 2, 3, 4
    ],

  "irvine" : 
    // Per level
    [
      // Histogram per dancer
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 1, Dancers 1 and 2
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 2, Dancers 1, 2, 3, 4
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ], // Level 3, Dancers 1, 2
      [ [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0] ] // Level 4, Dancers 1, 2, 3, 4
    ],
}


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
  ChangeLevel : "scorechangelevel",
  InitialConfig : "scoreinitialconfig"
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


//To be called at the end of level finishedLevel (int)
//Sends updated team scores to respective scoreboard clients based on all data so far
function updateScores(finishedLevel) {
  var totalResponses = {}
  var correctResponses = {}
  for (team in all_scores) {
    totalResponses[team] = 0;
    correctResponses[team] = 0;
    var current_level = all_scores[team][finishedLevel];
    for (var dancer_id = 0; dancer_id < current_level.length; dancer_id += 1) {
      var dancer_histogram = current_level[dancer_id];
      for (var effort_id = 0; effort_id < dancer_histogram.length; effort_id += 1) {
        var effort_score = dancer_histogram[effort_id];
        totalResponses[team] += effort_score;
        
        //Array of correct responses for a given dancer at a given level
        var correct_answers = RUBRIC["scores"][finishedLevel][dancer_id];

        if (correct_answers.indexOf(effort_id) != -1) {
          // This is the right answer!
          correctResponses[team] += effort_score;
        }
      }
    }
  }

  //Send out updates
  console.log("totalResponses " + JSON.stringify(totalResponses));
  console.log("correctResponses " + JSON.stringify(correctResponses));
  
  var score_updates = {"illinois" : 0, "irvine" : 0};
  console.log("Before SCORES are " + JSON.stringify(SCORES));
  for (team in totalResponses) {
    if (totalResponses[team] > 0) {
      score_updates[team] = Math.round(100 * correctResponses[team] / totalResponses[team]);
    }
    SCORES[team] += score_updates[team];
  }
  console.log("After SCORES are " + JSON.stringify(SCORES));

  console.log("new scores are " + JSON.stringify(score_updates));
  if(SCORE_CLIENT_SOCKET_UIUC) {
      console.log('server: Illinois Score emit');
      for(var i=0; i<SCORE_CLIENT_SOCKET_UIUC.length; i++) {
        SCORE_CLIENT_SOCKET_UIUC[i].emit(ScoreClientMessage.ScoreDeltas, 
        { "Deltas" : score_updates }); 
      }
    }
    
    if(SCORE_CLIENT_SOCKET_IRVINE) {
      console.log('server: irvine Score emit');
      for (var i = 0; i <SCORE_CLIENT_SOCKET_IRVINE.length; i++) {
        SCORE_CLIENT_SOCKET_IRVINE[i].emit(ScoreClientMessage.ScoreDeltas, 
        { "Deltas" : score_updates });
      }
    }  
}

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
    else if(data.Team == 'irvine' && SCORE_CLIENT_SOCKET_IRVINE.length == 0) {
      console.log ("\t score client not connected for Irvine");
      return;
    }

    //Format of data object returned
    // data
    //    - Level
    //      + int            
    //    - DancerEfforts
    //      + [1, 2] // Dancer 0, Efforts 1 and 2
    //      + [0, 1] // Dancer 1, Efforts 0 and 1


    if (data.PreviousAnswer) {
    //TODO(sean): Clean this up, time permitting
      
      // Update all scores
      for (var dancerId in data.PreviousAnswer.DancerEfforts) {
        var currentEfforts = data.PreviousAnswer.DancerEfforts[dancerId];
        for (var i = 0; i < currentEfforts.length; i += 1) {
          all_scores[data.Team][data.Answer.Level][(dancerId - 1)][currentEfforts[i]] -= 1;
          HISTOGRAM_DELTAS[currentEfforts[i]] -= 1;
        }
      }
    } else {
      console.log('\t no previous answer');
    }

    // Update all scores
    console.log("level is " + data.Answer.Level);
    for (var dancerId in data.Answer.DancerEfforts) {
      console.log("dancerId is " + dancerId);
      var currentEfforts = data.Answer.DancerEfforts[dancerId];
      console.log("currentEfforts is " + currentEfforts);
      for (var i = 0; i < currentEfforts.length; i += 1) {
        console.log("currentEffort at i is " + currentEfforts[i]);
        all_scores[data.Team][data.Answer.Level][(dancerId - 1)][currentEfforts[i]] += 1;
        HISTOGRAM_DELTAS[currentEfforts[i]] += 1;    
      }
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
    var initialHistogram = [0, 0, 0, 0, 0, 0, 0, 0];
    
    if (data.Team == 'illinois')
    {
      console.log("server: score client set for UIUC");
      SCORE_CLIENT_SOCKET_UIUC.push(socket);
      console.log("All Scores before initial are " + JSON.stringify(all_scores));

      for (var j = 0; j < all_scores[data.Team][ACTIVE_LEVEL].length; j+= 1) {
        var effortsPerDancer = all_scores[data.Team][ACTIVE_LEVEL][j];
        for (var i = 0; i < effortsPerDancer.length; i+= 1) {
          initialHistogram[i] += effortsPerDancer[i];
        } 
      }
      console.log("initialHistogram are " + initialHistogram);
      // console.log("SCORES are " + JSON.stringify(SCORES));
      socket.emit(ScoreClientMessage.InitialConfig, {
        "initialHistogram" : initialHistogram,
        "teamScores" : SCORES
      })
    }
    else if (data.Team == 'irvine') {
      console.log("server: score client set for Irvine");
      SCORE_CLIENT_SOCKET_IRVINE.push(socket);

      for (var j = 0; j < all_scores[data.Team][ACTIVE_LEVEL].length; j+= 1) {
        var effortsPerDancer = all_scores[data.Team][ACTIVE_LEVEL][j];
        for (var i = 0; i < effortsPerDancer.length; i+= 1) {
          initialHistogram[i] += effortsPerDancer[i];
        } 
      }

      console.log("initialHistogram are " + initialHistogram);
      socket.emit(ScoreClientMessage.InitialConfig, {
        "initialHistogram" : initialHistogram,
        "teamScores" : SCORES
      })
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
    if (data.level) {
      updateScores(ACTIVE_LEVEL);
      ACTIVE_LEVEL = data.level;
    }
    if (data.totalDancers) {
      LEVEL_SETTING.TotalDancers = data.totalDancers;
    }
    if (data.effortsPerDancer) {
      LEVEL_SETTING.EffortsPerDancer = data.effortsPerDancer;
    }

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

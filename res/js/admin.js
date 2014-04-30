// Connect to the server
var LOCAL_DEBUG = true; 
var HOST = LOCAL_DEBUG ? 
	'localhost' : 
	'ec2-54-83-22-126.compute-1.amazonaws.com';
var socket = io.connect(HOST);

// Message Type Definitions
var ServerMessage = { 
  	LevelSetting : "levelsetting",
  	Quiz : "quiz"
};

var ScoreClientMessage = {
	Connection : "scoreconnection",
	ScoreDeltas : "scoredeltas",
	EffortDeltas : "effortdeltas"
};

var AdminClientMessage = {
  Connection : "adminconnection",
  ChangeLevel : "adminchangelevel",
  ResetScores : "adminresetscores",
  GameOver: "admingameover"
}

// State Variables
var ACTIVE_LEVEL = 0;
var SCORES = {"illinois" : 0, "irvine" : 0};
var EFFORT_SCORES = [0, 0, 0, 0, 0, 0, 0, 0];
var CURRENT_TEAM = "illinois";

$(document).ready(function() {
	// Notify the server you're the scoreboard
	socket.emit(AdminClientMessage.Connection);

	socket.on(ServerMessage.ActiveLevel, function (data) {
		console.log('admin: active level message');
		//TODO(sean): Update active level display
	});

	$("#update-button").click(function(e) {
		e.preventDefault();
		//TODO(sean): Fix this, it's very hacky!! 

		// changeLevel(
		// 	$("#level-select").val().substring(6) - 1, 
		// 	$("#dancer-select").val().substring(0,1), 
		// 	$("#effort-select").val().substring(0,1)
		// ); 
		changeLevel($("#level-select").val().substring(6) - 1);
	});

	$("#reset-button").click(function(e) {
		e.preventDefault();
		console.log("resetting scores");
		socket.emit(AdminClientMessage.ResetScores);
		//TODO: Save scores?
	});

	$("#game-over-button").click(function(e) {
		e.preventDefault();
		console.log("ending the game");
		socket.emit(AdminClientMessage.GameOver);
		//TODO: Save scores?
	});
});	

function changeLevel(newLevel)	{
	var newDancerNumber = 0;
	var newEffortNumber = 0;
	if ( newLevel == 0 ) {
		//Level 1
		newDancerNumber = 2;
		newEffortNumber = 1;
	}
	else if ( newLevel == 1 ) {
		//Level 2
		newDancerNumber = 4;
		newEffortNumber = 1;
	}
	else if ( newLevel == 2 ) {
		//Level 3
		newDancerNumber = 2;
		newEffortNumber = 2;
	}
	else if ( newLevel == 3 ) {
		//Level 4
		newDancerNumber = 4;
		newEffortNumber = 2;
	}
	console.log("admin: trying to updatelevel to " + newLevel + " with dancers " + newDancerNumber + " and efforts " + newEffortNumber);
	
	socket.emit(AdminClientMessage.ChangeLevel, {
		level : newLevel,
		totalDancers : newDancerNumber,
		effortsPerDancer : newEffortNumber
	});
}
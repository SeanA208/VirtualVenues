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
  ChangeLevel : "adminchangelevel"
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
		changeLevel($("#level-select").val().substring(6) - 1, $("#dancer-select").val().substring(0,1), $("#effort-select").val().substring(0,1));
	});
});	


function changeLevel(newLevel, newDancerNumber, newEffortNumber)	{
	console.log("admin: trying to updatelevel to " + newLevel + " with dancers " + newDancerNumber + " and efforts " + newEffortNumber);
	socket.emit(AdminClientMessage.ChangeLevel, {
		level : newLevel,
		totalDancers : newDancerNumber,
		effortsPerDancer : newEffortNumber
	});
}
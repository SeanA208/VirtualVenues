// Connect to the server
var LOCAL_DEBUG = true; 
var HOST = LOCAL_DEBUG ? 
	'localhost' : 
	'ec2-54-83-22-126.compute-1.amazonaws.com';
var socket = io.connect(HOST);

// Message Type Definitions
var ServerMessage = {
	ActiveLevel : "activelevel",  
	LevelUp : "levelup",
	Quiz : "quiz"
};

var ScoreClientMessage = {
	Connection : "scoreconnection",
	ScoreDeltas : "scoredeltas",
	EffortDeltas : "effortdeltas" 
};

// State Variables
var ACTIVE_LEVEL = 0;
var SCORES = {"illinois" : 0, "irvine" : 0};
var EFFORT_SCORES = [0, 0, 0, 0, 0, 0, 0, 0];
var CURRENT_TEAM = "illinois";

$(document).ready(function() {
	var ctx = $("#bar_canvas")[0].getContext("2d");
	
	var graph = new BarGraph(ctx);
	graph.width = screen.availWidth / 2;
	graph.height = 450;
	graph.maxValue = 20;
	graph.margin = 2;
	graph.colors = ["green", "red", "blue", "yellow"];

	// Effort order taken from index.html
	graph.xAxisLabelArr = 
		["Flick", "Dab", "Float", "Glide", "Press", "Slash", "Thrust", "Wring"];
	graph.update([0, 0, 0, 0, 0, 0, 0, 0]);

	$("#bar_canvas").css(
		"color", "white", 
		"background-color", "black"
	);

	// Get team name from the url
	var parametersString = window.location.search.substr(1);
	var parameters = {};
    var parametersArray = parametersString.split("&");
    for (var i = 0; i < parametersArray.length; i += 1) {
        var tmparr = parametersArray[i].split("=");
        parameters[tmparr[0]] = tmparr[1];
    }
    CURRENT_TEAM = parameters.team;
	socket.emit(ScoreClientMessage.Connection, {'Team' : parameters.team });

	socket.on(ServerMessage.ActiveLevel, function (data) {
		console.log('scoreboard: active level message');
		ACTIVE_LEVEL = data.Level;
	});

	socket.on(ServerMessage.LevelUp, function (data) {
		console.log('scoreboard: level up message');
		ACTIVE_LEVEL = data.Level;
		// May want to do some checks here
	});

	socket.on(ScoreClientMessage.ScoreDeltas, function (data) {
		console.log('scoreboard: score deltas message');
		console.log(data.Deltas);
		for (var team in data.Deltas) {
			SCORES[team] += data.Deltas[team];
		}
		var animationUpdates = 0;
		var resetLoop = setInterval(function() {
			if (animationUpdates >= SCORES[CURRENT_TEAM]) {
				clearInterval(resetLoop);
			}
			reset();
			animationUpdates += 1;
		}, 500);
		$('#illinois-score').text(SCORES['illinois']);
		$('#irvine-score').text(SCORES['irvine']);
	});	

	socket.on(ScoreClientMessage.HistogramDeltas, function (data) {
		console.log('scoreboard: histogram deltas message');
		console.log(data.Deltas);

		if (!data.Deltas || !data.Deltas.length) {
			return;
		}
		else {
			var NEW_SCORES = [0, 0, 0, 0, 0, 0, 0, 0];
			for (var i = 0; i < data.Deltas.length; i += 1) {
				EFFORT_SCORES[i] += data.Deltas[i];
				NEW_SCORES[i] = (EFFORT_SCORES[i] < 0 ? 0 : EFFORT_SCORES[i]);
			}
			console.log("new histogram values");
			if (CURRENT_TEAM == data.Team) {
				console.log("YEP! They are the same");
				graph.update(NEW_SCORES);
				console.log(NEW_SCORES);
			}
			else{
				console.log("Sorry they are not equal");
			}
		}
	});
});	
/* 
 * NOTE: 
 * 	(PRESERVE THE SCRIPT REFERENCE ORDER)
 * 	demo.js script is included in index.html before this file
 * 	so global variables and methods are  accessible in this file
 *
 * Wait for everything to load
 */
$(document).ready(function() {
	console.log('client: connected');

	//Use the proper host
	var LOCAL_DEBUG = false; 
	// Connect to the server
	var HOST;
	if (LOCAL_DEBUG) {
		HOST = 'localhost';
	}
	else {
		HOST = 'ec2-54-83-22-126.compute-1.amazonaws.com';
	}
	var socket = io.connect(HOST);

	// Message Type Definitions (copy from server.js)
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
	
	// State Variables
	var ACTIVE_LEVEL = 0;

	/* 
		Handlers
	*/
	socket.on(Server.ActiveLevelMessage.Event, function (data) {
		console.log('client: active level message');
		ACTIVE_LEVEL = data[Server.ActiveLevelMessage.Level];
	});

	socket.on(Server.LevelUpMessage.Event, function (data) {
		console.log('client: level up message');
		ACTIVE_LEVEL = data[Server.LevelUpMessage.Level];
		// May want to do some checks here
	});

	socket.on(Server.QuizMessage.Event, function (data) {
		console.log('client: quiz message');
		// TODO
	});

	// TODO: send QuizAnswerMessage on effort click
});

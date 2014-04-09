/* 
 * NOTE: 
 * 	(PRESERVE THE SCRIPT REFERENCE ORDER)
 * 	demo.js script is included in index.html before this file
 * 	so global variables and methods are  accessible in this file
 *
 * Wait for everything to load
 */

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
var ServerMessage = {
  ActiveLevel : "activelevel",  
  LevelUp : "levelup",
  Quiz : "quiz"
};

var ClientMessage = {
  QuizAnswer : "quizanswer"
};

// State Variables
var ACTIVE_LEVEL = 0;

/* 
	Handlers
*/
socket.on(ServerMessage.ActiveLevel, function (data) {
	console.log('client: active level message');
	ACTIVE_LEVEL = data.Level;
});

socket.on(ServerMessage.LevelUp, function (data) {
	console.log('client: level up message');
	ACTIVE_LEVEL = data.Level;
	// May want to do some checks here
});

socket.on(ServerMessage.Quiz, function (data) {
	console.log('client: quiz message');
	// TODO
});

// TODO: send QuizAnswerMessage on effort click

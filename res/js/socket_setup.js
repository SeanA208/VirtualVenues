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
var HOST =  LOCAL_DEBUG ?
	'localhost' :
	'ec2-54-83-22-126.compute-1.amazonaws.com';
var socket = io.connect(HOST);

// Message Type Definitions (copy from server.js)
var ServerMessage = {
  LevelSetting : "levelsetting",
  Quiz : "quiz"
};

var ClientMessage = {
  QuizAnswer : "quizanswer"
};

// State Variables
var ACTIVE_LEVEL = null;
var LEVEL_SETTING = null;

/* 
	Handlers
*/
socket.on(ServerMessage.LevelSetting, function (data) {
	console.log('client: level up message');
	ACTIVE_LEVEL = data.Level;
	LEVEL_SETTING = data.Setting;
	changeLevelSetting(LEVEL_SETTING);
});

socket.on(ServerMessage.Quiz, function (data) {
	console.log('client: quiz message');
});

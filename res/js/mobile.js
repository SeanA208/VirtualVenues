/* 
 * NOTE: 
 *  (PRESERVE THE SCRIPT REFERENCE ORDER)
 *  demo.js script is included in index.html before this file
 *  so global variables and methods are  accessible in this file
 *
 * Wait for everything to load
 */

//Use the proper host
var LOCAL_DEBUG = true; 
var HOST =  LOCAL_DEBUG ?
    'localhost' :
    'ec2-54-83-22-126.compute-1.amazonaws.com';
var socket = io.connect(HOST);
var teamName = null; 
var previousAnswer = null;
var numDancers = 1;
var numEfforts = 1;
var currDancerID=null;
var currEffortsNum=0;
// Message Type Definitions (copy from server.js)
var ServerMessage = {
  LevelSetting : "levelsetting",
  Quiz : "quiz"
};

var ClientMessage = {
  QuizAnswer : "quizanswer"
};

// State Variables
var LEVEL_SETTING = null;

/* 
    Handlers
*/
socket.on(ServerMessage.LevelSetting, function (data) {
    console.log(data);
    console.log("recieved message from client")
    numDancers = data.TotalDancers;
    numEfforts = data.EffortsPerDancer;
    console.log("dancers: "+numDancers+", efforts: "+numEfforts);
    $("#titleinfo").text("Pick "+numEfforts+" efforts for each dancer");
    loadDancerButtons(numDancers);

});

socket.on(ServerMessage.Quiz, function (data) {
    console.log('client: quiz message');
});

function loadDancerButtons(num){
    $("#dancerbar").empty();
    for (i=1;i<=num;i++){
        $("#dancerbar").append("<a class =\"btn btn-default\" role =\"button\" id=\"dancer"+i+"\">"+i+"</a>");
    }

    $(".btn-default").click(function(){
        console.log("clicked dancer");
        currDancerID=$(this).attr("id");
        alert(currDancerID);
    });
};

function sendQuizAnswer() {
    var currentAnswer = {
        "Level" : LEVEL_SETTING.Level,
        "DancerEfforts" : {}
    };
    for (var i = 0; i < LEVEL_SETTING.TotalDancers; i += 1) {
        currentAnswer["DancerEfforts"]; // TODO: Add here
    };
};

$(document).ready(function() {

    console.log("an image is clicked!");
   

    if (getCookieValue('team') != false) {
        teamName = getCookieValue('team');
        console.log("Previous Value:"+teamName);
        $("#teaminfo").hide();
        $("#effortsinfo").show();
    }

    $(".team").click(function() {
    	console.log("an image of a team is clicked!");
        $(this).css("border", "2px #f33 solid");
       
        teamName = $(this).attr('team');
        console.log(teamName);
        writeSessionCookie('team',teamName);
        
        $("#teaminfo").hide();
        $("#effortsinfo").show();
    });

    $(".effort").click(function() {
        currEffortsNum+=1;
    	console.log("an image of an effort is clicked!");
        $("*").css("border", "none");
        $(this).css("border", "2px #f33 solid");
        var answer = parseInt($(this).attr("effortid"));
        if (answer != previousAnswer) {
            socket.emit(ClientMessage.QuizAnswer, 
                { "Team" : teamName, "Answer" : answer, "PreviousAnswer" : previousAnswer });
            previousAnswer = answer;
        }

    });
        

});
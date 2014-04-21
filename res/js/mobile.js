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
var numDancers = 0;
var numEfforts = 1;
var currDancerID=null;
var currLevel= null;
var currentAnswer = {
    "Level" : null,
    "DancerEfforts" : {}
};

// State Variables
var LEVEL_SETTING = {
};

// Message Type Definitions (copy from server.js)
var ServerMessage = {
  LevelSetting : "levelsetting",
  Quiz : "quiz"
};

var ClientMessage = {
  QuizAnswer : "quizanswer"
};


/* 
    Handlers
*/
socket.on(ServerMessage.LevelSetting, function (data) {
    console.log(data);
    console.log("recieved message from client")
    LEVEL_SETTING = data;
    numDancers = LEVEL_SETTING.TotalDancers;
    numEfforts = LEVEL_SETTING.EffortsPerDancer;
    currLevel = LEVEL_SETTING.Level;    
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
        $("#dancerbar").append("<a class =\"btn btn-primary\" role =\"button\" id=\""+i+"\">"+i+"</a>");
    }

    $(".btn-primary").click(function(){
        currDancerID=$(this).attr("id");
        if (!(currDancerID in currentAnswer.DancerEfforts)){
            currentAnswer.DancerEfforts[currDancerID]=[]
        };
        console.log("clicked dancerID = "+currDancerID);
        
        //empty borders and check marks from the previous dancer       
        $(".effort").each(function(){
            $(this).css("border", "none");
            $(this).data("clicked","0");
        });
    });
};

$(document).ready(function() {

    console.log("an image is clicked!");
    loadDancerButtons(numDancers);

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
    
    /*one click add it to the complete answer*/
    $(".effort").click(function() {
        //set border
        var answer = parseInt($(this).attr("effortid"));
            
        if ($(this).data("clicked") == "0"){
            console.log("first click")
            //check if the efforts array is full already
            if (currentAnswer.DancerEfforts[currDancerID].length != numEfforts){
                //add border
                $(this).css("border", "2px #f33 solid");
            
                //add answer to the dictionary
                if (jQuery.inArray(answer, currentAnswer.DancerEfforts[currDancerID])== -1){
                    currentAnswer.DancerEfforts[currDancerID].push(answer);
                }
                console.log(currDancerID+":"+currentAnswer.DancerEfforts[currDancerID].join());
                
                //check clicked
                $(this).data("clicked","1")
            }
            else{
                alert("You have checked "+numEfforts+" efforts already");
            }
        }
        else{
            //remove border
            $(this).css("border", "none");
            console.log("second click")   
            
            //remove from the dictionary
            var index = currentAnswer.DancerEfforts[currDancerID].indexOf(answer);
            currentAnswer.DancerEfforts[currDancerID].splice(index, 1);
            console.log(currDancerID+":"+currentAnswer.DancerEfforts[currDancerID].join());
            
            //mark as unchecked
            $(this).data("clicked","0")
        }
        /*
        if (answer != previousAnswer) {
            socket.emit(ClientMessage.QuizAnswer, 
                { "Team" : teamName, "Answer" : answer, "PreviousAnswer" : previousAnswer });
            previousAnswer = answer;
        }
        */
    });

     /* call this function when the answer is complete*/
    $("#sendInfo").click(function(){
        currentAnswer.Level = currLevel;
        socket.emit(ClientMessage.QuizAnswer,currentAnswer)
    });    

});
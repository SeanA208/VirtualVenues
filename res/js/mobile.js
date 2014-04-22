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
var currDancerID = null;
var currLevel = null;
var previousDancer = null;
var currentAnswer = {
    "Level" : null,
    "DancerEfforts" : {}
};

// State Variables
var LEVEL_SETTING = null;

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
    currentAnswer.Level = LEVEL_SETTING.Level; 

    console.log("dancers: "+numDancers+", efforts: "+numEfforts);
    $("#titleinfo").text("Pick "+numEfforts+" per dancer");
    $("#titleinfo").css({
        //"font-family" : "Chicago, Verdana, sans-seriff",
        "font-size" : "medium"
    });
    cleanUpEfforts();
    loadDancerButtons(numDancers);
});

socket.on(ServerMessage.Quiz, function (data) {
    console.log('client: quiz message');
});

function cleanUpEfforts(){
    $(".effort").each(function(){
        $(this).css("border", "none");
        $(this).data("clicked",0);        
    });
}
function loadDancerButtons(num){
    $("#dancerbar").empty();
    for (i=0;i<num;i++){
        $("#dancerbar").append("<a class =\"btn btn-primary\" data-clicked =0 role =\"button\" id="+i+">"+(i+1)+"</a>");
    }

    $(".btn-primary").click(function(){
        currDancerID = parseInt($(this).attr("id"));
        if (!(currDancerID in currentAnswer.DancerEfforts)){
            currentAnswer.DancerEfforts[currDancerID]=[];
        }


        if ($(this).data('clicked')==0) {
            console.log("clicked dancerID = "+currDancerID);
            //look checked
            if(previousDancer!=null){
                previousDancer.removeClass('active');
                previousDancer.data('clicked',0);
            }
            $(this).addClass('active');
            $(this).data('clicked',1);
            previousDancer = $(this);
            //show all checked efforts
            $(".effort").each(function(){
                
                var currEffortID = parseInt($(this).attr("effortid"));
                
                if (jQuery.inArray(currEffortID, currentAnswer.DancerEfforts[currDancerID]) != -1){
                    $(this).css("border", "2px #f33 solid");
                    $(this).data("clicked",1);
                }
                else {
                    $(this).css("border", "none");
                    $(this).data("clicked",0);
                }
            });
        }
        else{
            console.log("unclicked dancerID = "+currDancerID);
            $(this).removeClass('active');
            $(this).data('clicked',0);
        }
    });
};

function showDangerAlert(text){
    $("#alertTextID").text(text);
    $(".alert").show()
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
    
    /* one click add it to the complete answer */
    $(".effort").click(function() {
        //set border
        var answer = parseInt($(this).attr("effortid"));
            
        if ($(this).data("clicked") == 0){
            console.log("first click")
            //check if the efforts array is full already
            if (!currentAnswer.DancerEfforts[currDancerID]) {
                showDangerAlert("Pick a dancer first");
                return;
            }
            if (currentAnswer.DancerEfforts[currDancerID].length != numEfforts){
            //add border
                $(this).css("border", "2px #f33 solid");
            
                //add answer to the dictionary
                if (jQuery.inArray(answer, currentAnswer.DancerEfforts[currDancerID]) == -1){
                    currentAnswer.DancerEfforts[currDancerID].push(answer);
                }
                console.log(currDancerID + ":" + currentAnswer.DancerEfforts[currDancerID].join());
                
                //check clicked
                $(this).data("clicked", 1);
            }
            else{
                showDangerAlert("You have checked " + numEfforts + " efforts already");
                return;
            }
        }
        else{
            //remove border
            $(this).css("border", "none");
            console.log("second click");   
            
            //remove from the dictionary
            var index = currentAnswer.DancerEfforts[currDancerID].indexOf(answer);
            currentAnswer.DancerEfforts[currDancerID].splice(index, 1);
            console.log(currDancerID + ":" + currentAnswer.DancerEfforts[currDancerID].join());
            
            //mark as unchecked
            $(this).data("clicked", 0);
        }
    });

     /* call this function when the answer is complete*/
    $("#sendInfo").click(function(){
        currentAnswer.Level = currLevel;
        console.log(currentAnswer);
        socket.emit(ClientMessage.QuizAnswer,currentAnswer)
    });    
    $(".close").click(function(){
        $(".alert").hide();
    });
});
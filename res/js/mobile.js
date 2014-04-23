/* 
 * NOTE: 
 *  (PRESERVE THE SCRIPT REFERENCE ORDER)
 *  demo.js script is included in index.html before this file
 *  so global variables and methods are  accessible in this file
 *
 * Wait for everything to load
 */
var LOCAL_DEBUG = false;
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
var previousAnswer = null;
var COLORS = ["crimson", "indigo", "yellowgreen", "teal", "salmon", "plum", "lavender", "aqua"];

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
    LEVEL_SETTING = data;
    numDancers = LEVEL_SETTING.TotalDancers;
    numEfforts = LEVEL_SETTING.EffortsPerDancer;
    currLevel = LEVEL_SETTING.Level;    
    currentAnswer.Level = LEVEL_SETTING.Level; 

    console.log("dancers: " + numDancers + ", efforts: " + numEfforts);
    $("#titleinfo").text("Pick " + numEfforts + " per dancer");
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
    $(".effort").each(function() {
        $(this).css("border", "none");
        $(this).data("clicked", 0);        
    });
}

function loadDancerButtons(num) {
    // Clear all previous dancer buttons
    $("#dancerbar").empty();

    // Clear answers
    currentAnswer.DancerEfforts = {};

    // Clear box highlights for all efforts
    $(".effort").css("box-shadow", "");

    // Apend an appropriate number of dancer buttons for this level
    // Start an empty list of effort guesses for each dancer
    var boxShadows = [];
    for (i = 1; i <= num; i += 1) {
        $("#dancerbar").append(
            "<a class =\"btn btn-primary\" data-clicked=0 role=\"button\"" +
                "id=\"" + i + "\">" + i + 
            "</a>"
        );
        var color = COLORS[(i - 1) % COLORS.length];
        $("#" + i).css({
            "background-color" : color,
            "border-color" : color
        });
        currentAnswer.DancerEfforts[i] = [];
        
        // Generate black box around each effort for each dancer
        boxShadows.push("black 0px 0px 0px " + (2 * i) + "px");
    }

    // Set up the black boxes for all efforts
    $(".effort").css({
        "box-shadow" : boxShadows.join(),
        'margin' : (num * 2) + "px"
    });

    // Set the button dancer click handlers
    $(".btn-primary").click(function() {
        // Get the ID of the clicked dancer
        currDancerID = parseInt($(this).attr("id"));

        // If switching from another dancer (or none), lookup previous effort guesses
        if ($(this).data('clicked') === 0) {
            console.log("clicked dancerID = " + currDancerID);
            
            // Deactivate previous dancer button
            if(previousDancer != null){
                previousDancer.removeClass('active');
                previousDancer.data('clicked', 0);
            }

            // Activate the button for the current dancer
            $(this).addClass('active');
            $(this).data('clicked', 1);
            previousDancer = $(this);

            // Highlight all already chosen efforts
            // $(".effort").each(function(){
            //     var currEffortID = parseInt($(this).attr("effortid"));
            //     if (jQuery.inArray(currEffortID, currentAnswer.DancerEfforts[currDancerID]) > -1){
            //         $(this).css("border", "2px #f33 solid");
            //         $(this).data("clicked", 1);
            //     }
            //     else {
            //         $(this).css("border", "none");
            //         $(this).data("clicked", 0);
            //     }
            // });
        }
    });
};

function showDangerAlert(text){
    $("#alertTextID").text(text);
    $(".alert").show()
};

$(document).ready(function() {
    console.log("an image is clicked!");

    // Check cookies if a team has already been chosen
    if (getCookieValue('team') != false) {
        teamName = getCookieValue('team');
        console.log("Previous Value:"+teamName);
        $("#teaminfo").hide();
        $("#effortsinfo").show();
    }

    // Set the chosen team and store it in cookies for 30 minutes
    $(".team").click(function() {
    	console.log("an image of a team is clicked!");
        $(this).css("border", "2px #f33 solid");
       
        teamName = $(this).attr('team');
        console.log(teamName);
        writeSessionCookie('team', teamName);
        
        $("#teaminfo").hide();
        $("#effortsinfo").show();
    });
    
    // Add or remove the effort guess for the selected dancer (if any)
    $(".effort").click(function() {
        var answer = parseInt($(this).attr("effortid"));
            
        // If the effort hasn't been clicked
        if ($(this).data("clicked") == 0) {

            // Check if the max number of efforts has already been chosen
            if (!currDancerID || !currentAnswer.DancerEfforts[currDancerID]) {
                showDangerAlert("Pick a dancer first!");
                return;
            }

            if (currentAnswer.DancerEfforts[currDancerID].length != numEfforts) {
                var color = COLORS[(currDancerID - 1) % COLORS.length];

                // Add border
                var boxShadows = $(this).css("box-shadow");
                var boxShadowRegex = /rgb\((\d*),\s(\d)*,(\s\d*)\)\s\dpx\s\dpx\s\dpx\s\dpx/g;
                var boxShadowsArray = boxShadows.match(boxShadowRegex);
                var dancerBoxShadow = boxShadowsArray[currDancerID - 1];
                dancerBoxShadow = dancerBoxShadow.replace(/rgb\((\d*),\s(\d*),\s(\d*)\)/, color);
                boxShadowsArray[currDancerID - 1] = dancerBoxShadow;
                $(this).css("box-shadow", boxShadowsArray.join(','));
            
                // Add answer to the dictionary if it's not already there
                if (jQuery.inArray(answer, currentAnswer.DancerEfforts[currDancerID]) === -1) {
                    currentAnswer.DancerEfforts[currDancerID].push(answer);
                }
                console.log(currDancerID + ":" + currentAnswer.DancerEfforts[currDancerID].join());
                
                // check clicked
                $(this).data("clicked", 1);
            }
            else {
                showDangerAlert("You have checked " + numEfforts + " efforts already");
                return;
            }
        }
        // If effort already clicked, unclick it
        else {
            // Remove border
            var boxShadows = $(this).css("box-shadow");
            var boxShadowRegex = /rgb\((\d*),\s(\d)*,(\s\d*)\)\s\dpx\s\dpx\s\dpx\s\dpx/g;
            var boxShadowsArray = boxShadows.match(boxShadowRegex);
            var dancerBoxShadow = boxShadowsArray[currDancerID - 1];
            dancerBoxShadow = dancerBoxShadow.replace(/rgb\((\d*),\s(\d*),\s(\d*)\)/, "black");
            boxShadowsArray[currDancerID - 1] = dancerBoxShadow;
            $(this).css("box-shadow", boxShadowsArray.join(','));
            
            // Remove from the answer
            var index = currentAnswer.DancerEfforts[currDancerID].indexOf(answer);
            currentAnswer.DancerEfforts[currDancerID].splice(index, 1);
            console.log(currDancerID + ":" + currentAnswer.DancerEfforts[currDancerID].join());
            
            // Unclick
            $(this).data("clicked", 0);
        }
    });

    // User sends an answer to the server
    $("#sendInfo").click(function() {
        var data = {};
        currentAnswer.Level = currLevel;
        data.Team = teamName;
        data.Answer = currentAnswer;
        data.PreviousAnswer = previousAnswer;
        console.log(data);
        socket.emit(ClientMessage.QuizAnswer, data);
        // Make a deep copy of the current answer as previous
        previousAnswer = jQuery.extend(true, {}, currentAnswer);
    });   

    $(".close").click(function(){
        $(".alert").hide();
    });
});

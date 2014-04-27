/* 
 * NOTE: 
 *  (PRESERVE THE SCRIPT REFERENCE ORDER)
 *  demo.js script is included in index.html before this file
 *  so global variables and methods are  accessible in this file
 *
 * Wait for everything to load
 */
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
var COLORS = ["crimson", "yellowgreen", "indigo", "teal", "salmon", "plum", "lavender", "aqua"];

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
    loadDancerButtons();
});

socket.on(ServerMessage.Quiz, function (data) {
    console.log('client: quiz message');
});

function loadDancerButtons() {
    // Clear all previous dancer buttons
    $("#dancerbar").empty();

    // Clear answers
    currentAnswer.DancerEfforts = {};

    // Clear box highlights for all efforts
    $(".effort").css("box-shadow", "");

    // Apend an appropriate number of dancer buttons for this level
    // Start an empty list of effort guesses for each dancer
    var boxShadows = [];
    for (i = 1; i <= numDancers; i += 1) {
        $("#dancerbar").append(
            "<a class =\"btn btn-warning\" data-clicked=0 role=\"button\"" +
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
        "border": "1px white solid",
        "box-shadow" : boxShadows.join(),
        'margin' : (numDancers * 2) + "px",
        "border-radius": "10px"
    });

    // Set the button dancer click handlers
    $(".btn-warning").click(function() {
        // Get the ID of the clicked dancer
        currDancerID = parseInt($(this).attr("id"));

        // If switching from another dancer (or none), lookup previous effort guesses
        if ($(this).data('clicked') === 0) {
            console.log("clicked dancerID = " + currDancerID);
            
            // Deactivate previous dancer button
            if(previousDancer != null){
                previousDancer.removeClass('active');
                //previousDancer.css("font-size", "100%")
                previousDancer.data('clicked', 0);
                previousDancer.css("border", "none");
            }

            // Activate the button for the current dancer
            $(this).addClass('active');
            $(this).css("border", "2px white solid");
            $(this).data('clicked', 1);
            previousDancer = $(this);
        }
    });
};

function showAlert(text){
    $("#modal-alert").text(text);
    $('#alertModal').modal('show');
    console.log("Calling from mobile.js");
    setTimeout(function(){$('#alertModal').modal('hide')},1500);

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
        var color = COLORS[(currDancerID - 1) % COLORS.length];

        // Check if a dancer has been selected
        if (!currDancerID || !currentAnswer.DancerEfforts[currDancerID]) {
            showAlert("Pick a dancer first!");
            return;
        }

        // Add or remove the border depending on the current border color
        // If black, color it, else blacken it
        var boxShadows = $(this).css("box-shadow");
        var boxShadowRegex = /rgb\((\d*),\s(\d)*,(\s\d*)\)\s\dpx\s\dpx\s\dpx\s\dpx/g;
        var boxShadowsArray = boxShadows.match(boxShadowRegex);
        var dancerBoxShadow = boxShadowsArray[currDancerID - 1];
        if (dancerBoxShadow.match(/rgb\(0,\s0,\s0\)/) != null) { // black check
            if (currentAnswer.DancerEfforts[currDancerID].length != numEfforts) {
                dancerBoxShadow = dancerBoxShadow.replace(/rgb\((\d*),\s(\d*),\s(\d*)\)/, color);

                // Add answer to the dictionary if it's not already there
                if (jQuery.inArray(answer, currentAnswer.DancerEfforts[currDancerID]) === -1) {
                    currentAnswer.DancerEfforts[currDancerID].push(answer);
                }
            } else { 
                showAlert("You have checked \n"+ numEfforts + " efforts already");
                return;
            }
        } else {
            
            dancerBoxShadow = dancerBoxShadow.replace(/rgb\((\d*),\s(\d*),\s(\d*)\)/, 'black');
            var index = currentAnswer.DancerEfforts[currDancerID].indexOf(answer);
            currentAnswer.DancerEfforts[currDancerID].splice(index, 1);
            console.log(currDancerID + ":" + currentAnswer.DancerEfforts[currDancerID].join());
        }
        boxShadowsArray[currDancerID - 1] = dancerBoxShadow;
        $(this).css("box-shadow", boxShadowsArray.join(','));
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
        // Make a deep copy of the current answer, save it as previous
        previousAnswer = jQuery.extend(true, {}, currentAnswer);
    });   

    //User wants to reset his current answer
    $("#clear").click(function(){
        console.log("Cleaning up");
        currentAnswer.DancerEfforts = {};
        currDancerID = null;
        loadDancerButtons();
        console.log("DancerEfforts: "+currentAnswer.DancerEfforts+"Level: "+currentAnswer.Level);
    });
    

});

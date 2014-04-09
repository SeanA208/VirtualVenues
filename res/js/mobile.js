var teamId = null;
var teamName = null; 
var previousAnswer = null;

$(document).ready(function() {
    console.log("an image is clicked!");
    $(".team").click(function() {
    	console.log("an image of a team is clicked!");
        $(this).css("border", "2px #f33 solid");
       
        var src = $(this).attr('src');
        if (src.toLowerCase().indexOf("illinois") >= 0){
        	teamName="illinois"
        }
        else{ 
        	teamName="irvine"
        }
        console.log(teamName);
        
        $("#teaminfo").hide();
        $("#effortsinfo").show();
    });

    $(".effort").click(function() {
    	console.log("an image of an effort is clicked!");
        $("*").css("border", "none");
        $(this).css("border", "2px #f33 solid");

        var answer = $(this).attr("effortid")
        if (answer != previousAnswer) {
            socket.emit(ClientMessage.QuizAnswer, 
                { "Team" : teamName, "Answer" : answer, "PreviousAnswer" : previousAnswer });
            previousAnswer = answer;
        }
    });

});
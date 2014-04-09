var teamName = null; 
var previousAnswer = null;

$(document).ready(function() {
    console.log("an image is clicked!");
    $(".team").click(function() {
    	console.log("an image of a team is clicked!");
        $(this).css("border", "2px #f33 solid");
       
        teamName = $(this).attr('team');
        console.log(teamName);
        
        $("#teaminfo").hide();
        $("#effortsinfo").show();
    });

    $(".effort").click(function() {
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
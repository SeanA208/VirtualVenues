var teamName = null; 
var previousAnswer = null;
var numDancers=5;
var numEfforts =1;

function changeLevelSetting(LEVEL_SETTING){
    console.log("recieved message from client")
    numDancers = LEVEL_SETTING.TotalDancers;
    numEfforts = LEVEL_SETTING.EffortsPerDancer;
    console.log=("dancers: "+numDancers+", efforts: "+numEfforts);
};

function loadDancerButtons(num){
    $("#dancerbar").empty();
    for (i=1;i<=num;i++){
        $("#dancerbar").append("<a class =\"btn btn-default\" role =\"button\" id=\"dancer"+i+"\">"+i+"</a>");
    }
};

$(document).ready(function() {

    console.log("an image is clicked!");
    $("#titleinfo").text("Pick "+numEfforts+" efforts for each dancer");
  
    loadDancerButtons(numDancers); 
  
    if (getCookieValue('team') != false) {
        teamName = getCookieValue('team');
        console.log("Previous Value:"+teamName);
        $("#teaminfo").hide();
        $("#effortsinfo").show();
    }

    $(".btn-default").click(function(){
        console.log("clicked dancer1");
        alert("hi");
    });

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
    	console.log("an image of an effort is clicked!");
        $("*").css("border", "none");
        $(this).css("border", "2px #f33 solid");
//      $("#dancerbar").empty();
        var answer = parseInt($(this).attr("effortid"));
        if (answer != previousAnswer) {
            socket.emit(ClientMessage.QuizAnswer, 
                { "Team" : teamName, "Answer" : answer, "PreviousAnswer" : previousAnswer });
            previousAnswer = answer;
        }

    });
});
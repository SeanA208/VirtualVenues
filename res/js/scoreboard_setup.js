// Connect to the server
var LOCAL_DEBUG = true; 
var HOST = LOCAL_DEBUG ? 
	'localhost' : 
	'ec2-54-83-22-126.compute-1.amazonaws.com';
var socket = io.connect(HOST);

// Message Type Definitions
var ServerMessage = {
	Quiz : "quiz",
	LevelSetting : "levelsetting"
};

var ScoreClientMessage = {
	Connection : "scoreconnection",
	ScoreDeltas : "scoredeltas",
	EffortDeltas : "effortdeltas",
	ChangeLevel : "scorechangelevel"
};

// State Variables
var ACTIVE_LEVEL = 0;
var SCORES = {"illinois" : 0, "irvine" : 0};
var EFFORT_SCORES = [0, 0, 0, 0, 0, 0, 0, 0];
var CURRENT_TEAM = "illinois";
var ANIMATION_RATIO = 3 / 4;
var BAR_GRAPH_RATIO = 1 - ANIMATION_RATIO;

function $i(id) { return document.getElementById(id); }
function $c(code) { return String.fromCharCode(code); }

function get_screen_size() {
	var w=document.documentElement.clientWidth;
	var h=document.documentElement.clientHeight;
	// var w = screen.availWidth;
	// var h = screen.availHeight;
	return Array(w,h);
}

var canvas_x=0;
var canvas_y=0;
var canvas_w=0;
var canvas_h=0;
var context;
var margin=4;

var x,y;
var p_x,p_y;
var a=0;
var b=0;
var angle=Math.PI/180*8;
var color=0;
var limit1=Math.PI*1.5;
var limit2=Math.PI*1.79;
var c=new Array(6);
var d=new Array(6);
var r,e;
var fade;
var prv_x,prv_y,prv_x2,prv_y2;

var timeout;
var pause=false;
var fps=10;

document.onkeypress=key_manager;

function init()	{
	var screen=$i('screen');
	screen.style.display='block';
	screen.style.position='absolute';
	screen.style.left=canvas_x+'px';
	screen.style.top=canvas_y/2  + 'px';
	screen.style.width=canvas_w+'px';
	screen.style.height=canvas_h+'px';
	var shadebob=$i('shadebob');
	shadebob.style.position='absolute';
	shadebob.style.left=canvas_x+'px';
	shadebob.style.top=canvas_y+'px';
	shadebob.width=canvas_w;
	shadebob.height=canvas_h;
	context=shadebob.getContext('2d');
	document.body.style.width=(canvas_x+canvas_w)+'px';
	document.body.style.height=(canvas_y+canvas_h+60+margin*2)+'px';
	reset();
}

function reset() {
	clearTimeout(timeout);
	a=Math.random(0,1)*angle;
	b=Math.random(0,1)*angle;
	r=0;
	fade=32;
	for(var i=0;i<6;i++)
	{
		c[i]=Math.random(0,1)/2;
		d[i]=Math.random(0,1)/2;
	}
	radius=Math.round((canvas_w+canvas_h)/8);
	e=radius*0.2; /* 0.15 */
	p_x=Math.round(canvas_w/2);
	p_y=Math.round(canvas_h/2);
	x=(radius*c[0])*Math.cos(a*d[1])+(radius*c[2])*Math.sin(a*d[3])+(radius*c[4])*Math.sin(a*d[5]);
	y=(radius*c[5])*Math.sin(a*d[4])+(radius*c[3])*Math.cos(a*d[2])+(radius*c[1])*Math.cos(a*d[0]);
	anim();
}

function anim()	{
	var a1=Math.cos(a*2);
	var a2=Math.cos(a*4);
	var a3=Math.cos(a);
	var a4=Math.sin(a);
	if(b>limit1&&b<limit2)
	{	
		r+=radius*0.02*a1;
		prv_x=x;
		prv_y=y;
		x=prv_x2+r*a3;
		y=prv_y2+r*a4;
	}
	else
	{
		prv_x=x;
		prv_y=y;
		prv_x2=x;
		prv_y2=y;
		x=(radius*c[0])*Math.cos(a*d[1])+(radius*c[2])*Math.sin(a*d[3])+(radius*c[4])*Math.sin(a*d[5]);
		y=(radius*c[5])*Math.sin(a*d[4])+(radius*c[3])*Math.cos(a*d[2])+(radius*c[1])*Math.cos(a*d[0]);
	}
	var c3=16*Math.cos(a*10);
	var c1=Math.floor(56*Math.cos(a*angle*4)+c3);
	var c2=Math.floor(56*Math.sin(a*angle*4)-c3);
	context.lineCap='round';
	context.strokeStyle='rgba('+(192+c1)+','+(192+c2)+','+(192-c1)+','+(0.01-0.005*-a1)+')';
	context.lineWidth=e*1.4+e*0.8*a3;
	draw_line(p_x,p_y,prv_x,prv_y,x,y);
	context.lineWidth=e+e*0.8*a3;
	draw_line(p_x,p_y,prv_x,prv_y,x,y);
	context.strokeStyle='rgba('+(192+c1)+','+(192+c2)+','+(192-c1)+','+(0.06-0.03*-a1)+')';
	context.lineWidth=e*0.6+e*0.35*a3;
	draw_line(p_x,p_y,prv_x,prv_y,x,y);
	context.strokeStyle='rgba(0,0,0,0.06)';
	context.lineWidth=e*0.4+e*0.225*a3;
	draw_line(p_x,p_y,prv_x,prv_y,x,y);
	context.strokeStyle='rgba('+(192+c1)+','+(192+c2)+','+(192-c1)+','+(0.1-0.075*-a1)+')';
	context.lineWidth=e*0.2+e*0.1*a3;
	draw_line(p_x,p_y,prv_x,prv_y,x,y);
	context.strokeStyle='rgba(255,255,255,0.4)';
	context.lineWidth=e*(0.1-0.05*-a2);
	draw_line(p_x,p_y,prv_x,prv_y,x,y);
	a+=angle*Math.cos(b);
	b+=angle*0.1;
	if(b>limit1)
	{
		context.fillStyle='rgba(0,0,0,0.08)';
		context.fillRect(0,0,canvas_w,canvas_h);
	}
	if(b<limit2) timeout=setTimeout('anim()',fps); else reset();
}

function draw_line(x,y,x1,y1,x2,y2)	{
	context.beginPath();
	context.moveTo(x+x1,y+y1);
	context.lineTo(x+x2,y+y2);
	context.moveTo(x-x1,y+y1);
	context.lineTo(x-x2,y+y2);
	context.moveTo(x-x1,y-y1);
	context.lineTo(x-x2,y-y2);
	context.moveTo(x+x1,y-y1);
	context.lineTo(x+x2,y-y2);
	context.moveTo(x+y1,y+x1);
	context.lineTo(x+y2,y+x2);
	context.moveTo(x-y1,y+x1);
	context.lineTo(x-y2,y+x2);
	context.moveTo(x-y1,y-x1);
	context.lineTo(x-y2,y-x2);
	context.moveTo(x+y1,y-x1);
	context.lineTo(x+y2,y-x2);
	context.moveTo(x,y+x2);
	context.lineTo(x,y+x1);
	context.moveTo(x,y-x2);
	context.lineTo(x,y-x1);
	context.moveTo(x+x2,y);
	context.lineTo(x+x1,y);
	context.moveTo(x-x2,y);
	context.lineTo(x-x1,y);
	context.stroke();
	context.closePath();
}

function draw_dot(x,y) {
	context.beginPath();
	context.moveTo(x,y);
	context.lineTo(x+0.001,y);
	context.stroke();
	context.closePath();
}

function resize() {	
	canvas_w=get_screen_size()[0];
	canvas_h=get_screen_size()[1] * ANIMATION_RATIO;
	init();
}	

function key_manager(evt) {
	evt=evt||event;
	var key=evt.which||evt.keyCode;
	var ctrl=evt.ctrlKey;
	switch(key)
	{
		case 27: case 13:
			pause=pause?false:true;
			if(pause) clearTimeout(timeout); else anim();
			break;
		case 32:
			reset();
			break;
	}
	top.status='$'+key+'='+$c(key);
}

$(document).ready(function() {
	var ctx = $("#bar_canvas")[0].getContext("2d");
	var graph = new BarGraph(ctx);
	graph.width = get_screen_size()[0] * 8 / 10;
	graph.height = get_screen_size()[1] * BAR_GRAPH_RATIO;
	graph.maxValue = 10;
	graph.margin = 2;
	graph.colors = ["red", "orangered", "goldenrod", "green", "deepskyblue", "blue", "purple", "fuchsia"];

	// Effort order taken from index.html
	graph.xAxisLabelArr = 
		["Flick", "Dab", "Float", "Glide", "Press", "Slash", "Punch", "Wring"];
	graph.update([0, 0, 0, 0, 0, 0, 0, 0]);

	$("#bar_canvas").css(
		"color", "white", 
		"background-color", "black"
	);

	// Get team name from the url
	var parametersString = window.location.search.substr(1);
	var parameters = {};
    var parametersArray = parametersString.split("&");
    for (var i = 0; i < parametersArray.length; i += 1) {
        var tmparr = parametersArray[i].split("=");
        parameters[tmparr[0]] = tmparr[1];
    }
    CURRENT_TEAM = parameters.team;
	socket.emit(ScoreClientMessage.Connection, {'Team' : parameters.team });

	socket.on(ScoreClientMessage.ScoreDeltas, function (data) {
		console.log('scoreboard: score deltas message');
		console.log(data.Deltas);
		for (var team in data.Deltas) {
			SCORES[team] += data.Deltas[team];
		}
		var animationUpdates = 0;
		var resetLoop = setInterval(function() {
			if (animationUpdates >= SCORES[CURRENT_TEAM]) {
				clearInterval(resetLoop);
			}
			reset();
			animationUpdates += 1;
		}, 500);
		$('#illinois-score').text(SCORES['illinois']);
		$('#irvine-score').text(SCORES['irvine']);
	});	

	socket.on(ScoreClientMessage.HistogramDeltas, function (data) {
		console.log('scoreboard: histogram deltas message');
		console.log(data.Deltas);

		if (!data.Deltas || !data.Deltas.length) {
			return;
		}
		else {
			var NEW_SCORES = [0, 0, 0, 0, 0, 0, 0, 0];
			for (var i = 0; i < data.Deltas.length; i += 1) {
				EFFORT_SCORES[i] += data.Deltas[i];
				NEW_SCORES[i] = (EFFORT_SCORES[i] < 0 ? 0 : EFFORT_SCORES[i]);
				if (NEW_SCORES[i] > graph.maxValue) {
					graph.maxValue += graph.maxValue;
				}
			}
			console.log("new histogram values");
			if (CURRENT_TEAM == data.Team) {
				console.log("YEP! They are the same");
				graph.update(NEW_SCORES);
				console.log(NEW_SCORES);
			}
			else{
				console.log("Sorry they are not equal");
			}
		}
	});

	socket.on(ServerMessage.LevelSetting, function (data) {
		console.log(ServerMessage.LevelSetting);
		console.log(data);
		graph.maxValue = data.TotalDancers * data.EffortsPerDancer;
		EFFORT_SCORES = [0, 0, 0, 0, 0, 0, 0, 0];
		graph.update(scores);
	});

	socket.on(ScoreClientMessage.ChangeLevel, function (data) {
		console.log(ScoreClientMessage.ChangeLevel);
		console.log(data);
		graph.maxValue = data.TotalDancers * data.EffortsPerDancer;
		EFFORT_SCORES = [0, 0, 0, 0, 0, 0, 0, 0];
		graph.update(EFFORT_SCORES);
	});
});	
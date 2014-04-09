/* 
 * NOTE: 
 * 	(PRESERVE THE SCRIPT REFERENCE ORDER)
 * 	demo.js script is included in index.html before this file
 * 	so global variables and methods are  accessible in this file
 *
 * Wait for everything to load
 */
$(document).ready(function() {
	console.log('client: connected');

	//Use the proper host
	var LOCAL_DEBUG = false; 
	// Connect to the server
	var HOST;
	if (LOCAL_DEBUG) {
		HOST = 'localhost';
	}
	else {
		HOST = 'ec2-54-83-22-126.compute-1.amazonaws.com';
	}
	var socket = io.connect(HOST);
	
	// Handle message from server
	socket.on('news', function (data) {
		console.log('client: receieved data ' + data.toString());
	});
		
	// Start countdown
	socket.on('start-countdown', function (data) {
		console.log('client: start countdown');
		showCountdown(data.ticks);
	});

	// Show and play the video
	socket.on('play-video', function (data) {
		console.log('client: play video');	
		showVideo();
	});

	// Pause the video
	socket.on('stop-video', function (data) {
	 	console.log('client: stop video');
	 	video.pause(); 
	});
	
	// Handle the interrup message from Max
	socket.on('start-interrupt-pattern', function (data) {
		console.log('client: start interrupt pattern');
		changeVideoSource("res/test_pattern");
		showVideo();;
		bindVideoEnded(function() {
			showCountdown(data.ticks, function() {
				changeVideoSource("res/videoE");
				showVideo();
				bindVideoEnded(function() {
					startColorMode();
				});
			});	
		});	
	});
});

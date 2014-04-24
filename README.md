VirtualVenues
=============

Server and Client for Virtual Venues application

Run this on a fresh EC2 instance for external port 80 to hit interal port 8080
(i.e. Node instance)

sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080


TODO
-----

### Server
	* Proper scoring mechanism
		* Team scoring + Effort scoring
	* Aggregate scoring on the server -- storage
		* Replay 
	* Level changing mechanics // Manual Level Changing
	
### Admin
	* Better admin panel

### Scoreboard
	* Kaleidoscope cuts of bars

### Mobile
	* Better buttons
	* Bigger text
	* Clear button
	* Wide text
	* Highlight selected dancer
	* Save state on mobile screen
		* Popup alert
	* Clear on new level
	* (low priority) Store answers per level in cookies






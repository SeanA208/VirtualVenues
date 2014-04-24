VirtualVenues
=============

Server and Client for Virtual Venues application

Run this on a fresh EC2 instance for external port 80 to hit interal port 8080
(i.e. Node instance)

sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080


TODO
-----

### Server [Sean + Neel]
	* Make sure scoring works as intended 
		* Team scoring + Effort scoring
	* Aggregate scoring on the server
		* Storage mechanism per level, per team, per effort
		* Level changing mechanics
			* Clearing state on mobile and clearing histogram
		* Replay on histogram
	
### Admin [Sean]
	* Better admin panel

### Scoreboard [Ashwin + Timur]
	* Kaleidoscope resizing
	* Styling + Position (relative)
		* For portrait AND landscape

### Mobile -- [Jatin + Madina]
	* Better buttons 
	* Bigger text 
	* Clear button 
	* Wide text 
	* Highlight selected dancer 
	* Save state on mobile screen 
		* Popup alert
	* Clear on new level
	* (low priority) Store answers per level in cookies 






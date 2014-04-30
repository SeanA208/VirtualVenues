VirtualVenues
=============

Server and Client for Virtual Venues application

Run this on a fresh EC2 instance for external port 80 to hit interal port 8080
(i.e. Node instance)

sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080


TODO:
-----
1. End of level display correct answers (mobile and scoreboard)
2. Put level on scoreboard
3. Clean up mobile UI on smaller screens
4. Let user re-pick his team (or reduce cookie expiration to a few minutes)
5. Kaleidescope Animation
6. Better admin 
..*Clear all scores in the game, save them to file as well
..*Only specify level (preset configurations)

Nice to have:
--------------
- Fix effort button greying out
- Bottom padding for submit/clear buttons (and in between?)





VirtualVenues
=============

Server and Client for Virtual Venues application

Run this on a fresh EC2 instance for external port 80 to hit interal port 8080
(i.e. Node instance)

sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080


TODO:
-----
- End of level display correct answers (mobile and scoreboard)
- Put level on scoreboard
- Clean up mobile UI on smaller screens
- Let user re-pick his team (or reduce cookie expiration to a few minutes)
- Kaleidescope Animation
- Better admin 
  ..* Clear all scores in the game, save them to file as well
  ..* Only specify level (preset configurations)

Nice to have:
--------------
- Fix effort button greying out
- Bottom padding for submit/clear buttons (and in between?)





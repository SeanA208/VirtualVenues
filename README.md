VirtualVenues
=============

Server and Client for Virtual Venues application

Run this on a fresh EC2 instance for external port 80 to hit interal port 8080
(i.e. Node instance)

sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080


TODO
-----

  Put level on scoreboard

  End of level display correct answers (mobile and scoreboard)

  Kaleidescope Animation

  Better admin - Clear all scores in the game, save them to file as well, only specify level




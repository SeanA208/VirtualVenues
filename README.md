VirtualVenues
=============

Server and Client for Virtual Venues application

Run this on a fresh EC2 instance for external port 80 to hit interal port 8080
(i.e. Node instance)

sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080

TODO:
-----
0. Add modal to scoreboard.html to shop the game over message 
  1. Handle the modal in scoreboard_setup.html. 
  2. Show the winning team.
1. End of level display correct answers (mobile and scoreboard)
2. ~~Put level on scoreboard~~
3. ~~Clean up mobile UI on smaller screens~~ **need to check iPhone 4**
4. ~~Reduce cookie expiration to a few minutes~~ **changed to 2.5 minutes**
5. ~~Kaleidoscope Animation~~
6. Better admin 
  1. Clear all scores in the game, save them to file as well
  2. Only specify level (preset configurations)

Nice to have:
--------------
- ~~Fix effort buttons greying out~~
- ~~Bottom padding for submit/clear buttons (and in between?)~~
- Let client repick his team





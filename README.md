
# twitter-query-processor

A cloud-based query processor based on Twitter messages. 
It’s aim is to allow the ability visualise the sentiment of tweets based upon a live filter which is modified upon user query. 

This application is to be deployed on AWS load balancer auto-scaling group. As per specifications of the university project.


 EC2 instance deployment instructions
    
1.  sudo apt-get update
    
2.  sudo apt-get install git
    
3.  sudo apt-get install npm
    
4.  sudo npm install npm -g
    
5.  curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    
6.  sudo apt-get install -y nodejs
    
7.  git clone https://github.com/Ariit0/twitter-query-processor.git
    
8.  cd twitter-query-processor
    
9.  git fetch --all (pull latest changes)
    
10.  mkdir config
    
11.  touch config/twitterconfig.json
    
12.  nano config/twitterconfig.json
    
13.  Input twitter api keys  
    { "CONSUMER_KEY":"XXXXXXXXXXXXXXXX", "CONSUMER_SECRET":"XXXXXXXXXXXXXXXX",  
    "ACCESS_TOKEN":"XXXXXXXXXXXXXXXX", "ACCESS_TOKEN_SECRET":"XXXXXXXXXXXXXXXX"}
    
14.  npm install
    
15.  sudo npm install pm2 -g
    
16.  sudo pm2 start npm -- start
    
17.  sudo pm2 startup (start npm when instance starts up)
    
18.  sudo pm2 unstartup (shut down npm start)

Open port 3000 for Node.js

Note there's a mongodb server which you will need to setup and change the IP address connection in the app.js file

MongoDB Installation: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/


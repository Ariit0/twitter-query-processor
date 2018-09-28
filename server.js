/**
 * This file handles server initialisation
 */
const  express = require('express');
const https = require('https');
const app = express();
const client = express.Router();


const path = __dirname + '/views/';

const hostname = '127.0.0.1';
const port = 3000;


/**
 * Mounts specifed middleware function of specifid path
 */
client.use((req, res, next) => {
  console.log("/" + req.method);
  next();
});

/**
 * Gets HTML index page 
 */
client.get("/", (req,res) => {
  res.sendFile(path + "index.html");
});

/**
 * Gets HTML about page
 */
client.get("/about", (req,res) => {
  res.sendFile(path + "about.html");
});

app.use("/",client);

app.use("*", (req,res) => {
  res.sendFile(path + "404.html");
});

/**
 * Stars a UNIX socket and listens for connections on the given path.
 */
app.listen(port, () => {
    console.log(`Express app listening at http://${hostname}:${port}/`);
});

var  express = require('express');
const https = require('https');
var app = express();

const hostname = '127.0.0.1';
const port = 3000;

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(port, function () {
    console.log(`Express app listening at http://${hostname}:${port}/`);
});

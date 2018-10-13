var express = require('express');
var router = express.Router();
var Twit = require('twit');
var MongoClient = require('mongodb').MongoClient;

const twitcfg = require('../config/twitterconfig.json');

var uri = "mongodb://34.209.5.212:27017/CAB432-MongoDB";

var api = new Twit ({
	consumer_key: twitcfg.CONSUMER_KEY,
	consumer_secret: twitcfg.CONSUMER_SECRET,
	access_token: twitcfg.ACCESS_TOKEN,
	access_token_secret: twitcfg.ACCESS_TOKEN_SECRET,
	timeout_ms: 60*1000
})

router.use(function (req, res, next) {
	console.log("Index page: /" + req.method);
	next();
});

/**
 * Occurs when the user sends a POST request (search bar)
 */
router.post('/', function (req, res) {
	var input = req.body.query;
	input.split();

	// make sures theres a # in the query, otherwise append to start of input
	if (input[0] !== '#') {
		input = `#${input}`;
		console.log(input);
	}
	console.log('INPUT QUERY: ' + input);

	/**
	 * Establish connection to mongodb 
	 */
	try {
		MongoClient.connect(uri, { useNewUrlParser: true }, function(err, db) {
			if (!err) {
				console.log('Connected to MongoDB');

				// Make calls to the DB first before performing a get request to twitter endpoint
				// Store get query (the tag) + feed to the DB
				// If a tag is not on the db yet add it along with the feed

				api.get('search/tweets', {q: input, count: 1}, function(err, data, response) {
				data.statuses.forEach(function(data) {
						console.log(data);
					});
				});

				res.render('index');

			} else { // redirect to error page 
				console.log('Connection to MongoDB Failed');
				res.writeHead(500, {'Content-Type': 'text/plain'});
				res.write("500: Internal Server Error");
				res.end();
			}
		});
	} catch (e) {
		console.log(e);
	}	
});

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index');
});

module.exports = router;

var express = require('express');
var router = express.Router();
var Twit = require('twit');
var MongoClient = require('mongodb').MongoClient;

const twitcfg = require('../config/twitterconfig.json');

var uri = "mongodb://34.209.5.212:27017/CAB432-MongoDB";

// store twitter feed
var twitterFeed = []; 

var api = new Twit ({
	consumer_key: twitcfg.CONSUMER_KEY,
	consumer_secret: twitcfg.CONSUMER_SECRET,
	access_token: twitcfg.ACCESS_TOKEN,
	access_token_secret: twitcfg.ACCESS_TOKEN_SECRET,
	timeout_ms: 60*1000
});

// router.use(function (req, res, next) {
// 	console.log("Index page: /" + req.method);
// 	next();
// });
// 
// 
/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {title: 'Twitter Querier'});
});

router.get('/twitter-results', function(req, res, next) {
  res.json(twitterFeed);
});

// router.post('/twitter-results', function(req, res, next) {
//   let msg = {
//   	ip: req.ip,
//   	timestamp: new Date(),
//   	text: req.body.text
//   }

//   twitterFeed.push(msg);
//   res.json(msg);
// });

/**
 * Occurs when the user sends a POST request (search bar)
 */
router.post('/twitter-results', function (req, res) {
	var myInput = req.body.text;
	if (myInput == '') {
		console.log('INPUT QUERY: <EMTPY>');
		res.render('index');
		res.end();
	}
	myInput.split();

	// make sures theres a # in the query, otherwise append to start of input
	if (myInput[0] !== '#') {
		myInput = `#${myInput}`;
		console.log(myInput);
	}
	console.log('INPUT QUERY: ' + myInput);

	api.get('search/tweets', {q: myInput, count: 1, result_type: 'recent', lang: 'en', tweet_mode: 'extended'}, function(err, data, response) {
		data.statuses.forEach(function(data) {
				// id: data.id_str,
				// userName: data.user.name, // set name
				// screenName: data.user.screen_name, // twitter account name
				// profileUrl: `https://twitter.com/${data.user.screen_name}`,
				// createdAt: data.created_at,
				// 
			if (data.hasOwnProperty('retweeted_status')) {
				var tweet = `${data.user.name} @${data.user.screen_name}: RT @ ${data.retweeted_status.user.screen_name}: ${data.retweeted_status.full_text}`;
			} else {
				var tweet = `${data.user.name} @${data.user.screen_name}: ${data.full_text}`;
			}

			let twitterObject = {
				input: myInput,
				text: tweet
			}

			twitterFeed.push(twitterObject);
			res.json(twitterObject);
		});
	});


	/**
	 * Establish connection to mongodb 
	 */
	// try {
	// 	MongoClient.connect(uri, { useNewUrlParser: true }, function(err, db) {
	// 		if (!err) {
	// 			console.log('Connected to MongoDB');

	// 			// Make calls to the DB first before performing a get request to twitter endpoint
	// 			// Store get query (the tag) + feed to the DB
	// 			// If a tag is not on the db yet add it along with the feed
	// 			// 

	// 			res.json(twitterFeed);
	// 		} else { // redirect to error page 
	// 			console.log('Connection to MongoDB Failed');
	// 			res.writeHead(500, {'Content-Type': 'text/plain'});
	// 			res.write("500: Internal Server Error");
	// 			res.end();
	// 		}
	// 	});
	// } catch (e) {
	// 	console.log(e);
	// }	
});

module.exports = router;

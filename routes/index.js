var express = require('express');
var router = express.Router();
var Twit = require('twit');


const twitcfg = require('../config/twitterconfig.json');

// sets number of search results to be displayed (remove once stream is implemented)
var queryCount = 5;
// store twitter feed
var twitterFeed = []; 
// store trending tags
var trendingTags = [];

var api = new Twit ({
	consumer_key: twitcfg.CONSUMER_KEY,
	consumer_secret: twitcfg.CONSUMER_SECRET,
	access_token: twitcfg.ACCESS_TOKEN,
	access_token_secret: twitcfg.ACCESS_TOKEN_SECRET,
	timeout_ms: 60*1000
});

router.use(function (req, res, next) {
	console.log("Index page: /" + req.method);
	next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {title: 'Twitter Querier'});
});

router.get('/trending-tags', function(req, res, next) {
	res.json(trendingTags);
});

router.get('/twitter-results', function(req, res, next) {
  res.json(twitterFeed);
});

/**
 * This post request is called on the onload event and is run once per session
 */
router.post('/trending-tags', function(req, res, next) {
	api.get('trends/place', {id: '23424748'},  function(err, data, response) {
		// get trending hash tags
		for (var i = 0; i < data[0].trends.length; i++) {
			console.log(JSON.stringify(data[0].trends[i].name, undefined, 2));
			let tag = data[0].trends[i].name;
			tag.split();
			if (tag[0] === '#') {
				trendingTags.push(tag);
			}
		}
	});
	res.json(trendingTags);
});

/**
 * Occurs when the user sends a POST request (search bar)
 */
router.post('/twitter-results', function (req, res) {
	var myInput = req.body.text;
	myInput.split();
	if (myInput !== '') { // must have input (should be handled on client end already)
		// make sures theres a # in the query, otherwise append to start of input
		if (myInput[0] !== '#') {
			myInput = `#${myInput}`;
		}
		console.log('INPUT QUERY: ' + myInput);

		//TODO: CONVERT TO STREAM INSTEAD
		// save output to twitter object (json)-> push to array -> pass json
		// var stream = api.stream('statuses/filter', {track: myInput});

		// stream.on('tweet', function(tweet) {
		// 	console.log(tweet);
		// });
		api.get('search/tweets', {q: myInput, count: queryCount, result_type: 'recent', lang: 'en', tweet_mode: 'extended'}, function(err, data, response) {
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

				var twitterObject = {
					input: myInput,
					text: tweet
				}

				twitterFeed.push(twitterObject);
			});
			res.json(twitterFeed);
			res.end();
		});
	}
});

module.exports = router;

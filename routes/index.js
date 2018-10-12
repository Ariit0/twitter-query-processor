var express = require('express');
var router = express.Router();
var Twit = require('twit');

const twitcfg = require('../config/twitterconfig.json');

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

	console.log('INPUT QUERY: ' + req.body.query);

	api.get('search/tweets', {q: req.body.query, count: 10}, function(err, data, response) {
	data.statuses.forEach(function(data) {
			console.log('tweet: ' + data.text);
		});
	});
	
	res.render('index');
});

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index');
});

module.exports = router;

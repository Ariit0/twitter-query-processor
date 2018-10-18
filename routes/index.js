module.exports = function (io) {
	const express = require('express');
	const router = express.Router();
	const Twit = require('twit');

	const twitcfg = require('../config/twitterconfig.json');

	const Tweet = require('../models/tweetmodel');

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

	/**
	 * This post request is called on the onload event and is run once per session
	 */
	router.post('/trending-tags', function(req, res, next) {
		// ID 23424748 tracks trending tags in australia
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
	 * Socket.io connection which handles twitterfeed streaming
	 */
	io.on('connection', function (socket) {
		socket.emit('welcome', {data: 'welcome'});

		socket.on('keyword', function(data) {
			var keyword = data.keyword;
			keyword.split();

			// make sures theres a # in the query, otherwise append to start of input
			if (keyword[0] !== '#') {
				keyword = `#${keyword}`;
			}
			console.log('INPUT QUERY: ' + keyword);

			// clear records from mongodb on each query
			try {
				Tweet.collection.drop();
			} catch (e) {
				console.log(e);
			}
			// establish keyword tracking stream
			var stream = api.stream('statuses/filter', {track: keyword, language: 'en'});

			stream.on('tweet', function(data) { // reading stream
				console.log(data);

				// Get the full length of a tweet
				if (data.hasOwnProperty('extended_tweet')) { 
					//console.log(JSON.stringify(data.extended_tweet.full_text));
					var tweetTxt = data.extended_tweet.full_text;
				} else if (data.hasOwnProperty('retweeted_status')) {
					//console.log(JSON.stringify(data.retweeted_status.extended_tweet.full_text));
					if (data.retweeted_status.truncated == true) {
						var tweetTxt = data.retweeted_status.extended_tweet.full_text;
					} else {
						var tweetTxt = data.retweeted_status.text;
					}
				} else {
					var tweetTxt = data.text;
				}

				// twitter content which fills the established mongodb model 
				var tweetContent = {
					query: keyword,
					id: data.id_str,
					userName: data.user.name,
					screenName: data.user.screen_name,
					profileUrl: `https://twitter.com/${data.user.screen_name}`,
					profileImgUrl: data.user.profile_image_url,
					createdTime: data.createdAt,
					text: tweetTxt
				};

				var twitterObject = new Tweet(tweetContent);

				// store twitterobject to database
				twitterObject.save(function (err) {
					if (err) { // failure
						console.log(err);
					} else {
						console.log('SUCCESS: Stored JSON to DB');
						socket.emit('livetweets', {data: tweetContent});
					}

					console.log('SAVED BOYS');
				});

				socket.on('stop', function(data) {
					connection.release();
				});
			});

			stream.on('error', function(err) {
				console.log(err);
			});
		});
	});

	return router;
}

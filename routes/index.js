module.exports = function (io) {
	const express = require('express');
	const router = express.Router();
	const Twit = require('twit');

	const twitcfg = require('../config/twitterconfig.json');

	const Tweet = require('../models/tweetmodel');

	// sets number of search results to be displayed (remove once stream is implemented)
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

			// clear records from mongodb on each query
			try {
				Tweet.collection.drop();
			} catch (e) {
				console.log(e);
			}

			var stream = api.stream('statuses/filter', {track: myInput, language: 'en'});

			stream.on('tweet', function(data) { // reading stream
				console.log(data);

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


				// 	if (data.truncated == false) {
				// 		console.log(JSON.stringify(data.retweeted_status.extended_tweet.full_text));
				// 		var tweet = `${data.user.name} @${data.user.screen_name}: RT @ ${data.retweeted_status.user.screen_name}: ${JSON.stringify(data.retweeted_status.full_text)}`;

				// 	} else {
				// 		console.log(JSON.stringify(data.retweeted_status.text));
				// 		var tweet = `${data.user.name} @${data.user.screen_name}: RT @ ${data.retweeted_status.user.screen_name}: ${JSON.stringify(data.retweeted_status.full_text)}`;
				// 	}


				// 	var tweet = `${data.user.name} @${data.user.screen_name}: RT @ ${data.retweeted_status.user.screen_name}: ${JSON.stringify(data.retweeted_status.full_text)}`;

				// } else {
				// 	console.log(JSON.stringify(data.extended_tweet.full_text));
				// 	var tweet = `${data.user.name} @${data.user.screen_name}: ${JSON.stringify(data.extended_tweet.full_text)}`;

				// }

				var twitterObject = new Tweet({
					query: myInput,
					id: data.id_str,
					userName: data.user.name,
					screenName: data.user.screen_name,
					profileUrl: `https://twitter.com/${data.user.screen_name}`,
					profileImgUrl: data.user.profile_image_url,
					createdTime: data.createdAt,
					text: tweetTxt
				});

				twitterObject.save(function (err) {
					if (err) { // failure
						console.log(err);
					} else {
						console.log('SUCCESS: Stored JSON to DB');
					}

					console.log('SAVED BOYS');
				});
			});

			// api.get('search/tweets', {q: myInput, count: queryCount, result_type: 'recent', lang: 'en', tweet_mode: 'extended'}, function(err, data, response) {
			// 	data.statuses.forEach(function(data) {
			// 			// id: data.id_str,
			// 			// userName: data.user.name, // set name
			// 			// screenName: data.user.screen_name, // twitter account name
			// 			// profileUrl: `https://twitter.com/${data.user.screen_name}`,
			// 			// createdAt: data.created_at,
			// 			// 
			// 		if (data.hasOwnProperty('retweeted_status')) {
			// 			var tweet = `${data.user.name} @${data.user.screen_name}: RT @ ${data.retweeted_status.user.screen_name}: ${data.retweeted_status.full_text}`;
			// 		} else {
			// 			var tweet = `${data.user.name} @${data.user.screen_name}: ${data.full_text}`;
			// 		}

			// 		var twitterObject = {
			// 			input: myInput,
			// 			text: tweet
			// 		}

			// 		twitterFeed.push(twitterObject);
			// 	});
			// 	res.json(twitterFeed);
			// 	res.end();
			// });
		}
	});

	return router;
}

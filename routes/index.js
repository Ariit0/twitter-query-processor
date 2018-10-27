const express = require('express');
const router = express.Router();
const Twit = require('twit');
const twitcfg = require('../config/twitterconfig.json');
const mongoose = require('mongoose');
const TweetSchema = require('../models/tweetmodel');

// Natural Packages
var natural = require('natural');
var Analyzer = natural.SentimentAnalyzer;
var stemmer = natural.PorterStemmer;
var analyzer = new Analyzer("English", stemmer, "afinn"); // afinn, senticon, and pattern (types of vocab)
var tokenizer = new natural.WordTokenizer();

// store trending tags
var trendingTags = [];
var trackedTags = [];

// twitter stream
var stream = null;

var api = new Twit ({
	consumer_key: twitcfg.CONSUMER_KEY,
	consumer_secret: twitcfg.CONSUMER_SECRET,
	access_token: twitcfg.ACCESS_TOKEN,
	access_token_secret: twitcfg.ACCESS_TOKEN_SECRET,
	timeout_ms: 60*1000
});


module.exports = function (io) {

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
		// ID 2459115 for new york (for more traffic)
		api.get('trends/place', {id: '2459115'},  function(err, data, response) {
			// get trending hash tags
			for (var i = 0; i < data[0].trends.length; i++) {
				console.log(JSON.stringify(data[0].trends[i].name, undefined, 2));
				let tag = data[0].trends[i].name;
				tag.split();
				//if (tag[0] === '#') {
					trendingTags.push(tag);
				//}
			}
		});
		res.json(trendingTags);
	});

	/**
	 * Socket.io connection which handles twitterfeed streaming
	 */
	io.on('connection', function (socket) {

		socket.on('keyword', function(data) {
			var query = data.keyword;

			// store query into array for tracking 
			if (query.indexOf(',') > -1) { // multi-tag query
				var res = query.split(',');

				for (var i = 0; i < res.length; i++) {
					trackedTags[i] = `#${res[i]}`;
				}
				console.log(trackedTags);
			} else { // single tag query
				trackedTags[0] = `#${query}`;
				console.log(trackedTags);
			}

			console.log('INPUT QUERY: ' + trackedTags);

			// checks for existing stream and closes it before establishing a new connection
			if (stream != null) {
				stream.stop();
				stream = api.stream('statuses/filter', {track: trackedTags, language: 'en'});
			} else {
				stream = api.stream('statuses/filter', {track: trackedTags, language: 'en'});
			}

			stream.on('tweet', function(data) { // reading stream
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
				
				var tokenized_text = tokenizer.tokenize(data.text);
				// console.log(tokenized_text);
				var senti_score = analyzer.getSentiment(tokenized_text);
				// console.log(senti_score);

				// twitter content which fills the established mongodb model 
				var tweetContent = {
					query: trackedTags, // remove later
					id: data.id_str,
					userName: data.user.name,
					screenName: data.user.screen_name,
					profileUrl: `https://twitter.com/${data.user.screen_name}`,
					profileImgUrl: data.user.profile_image_url,
					createdTime: data.createdAt,
					text: tweetTxt,
					score: senti_score
				};

				// create an instance of model Tweet
				const Tweet = mongoose.model(trackedTags[0], TweetSchema);

				var twitterObject = new Tweet(tweetContent);
				// store twitterobject to database
				twitterObject.save(function (err) {
					if (err) { // failure
						console.log(err);
					} else {
						console.log('SUCCESS: Stored JSON to DB');
						socket.emit('livetweets', {data: tweetContent});
					}
				});

				socket.on('stop', function(data) {
					connection.release();
				});
			});

			stream.on('connect', function(req) {
				console.log('Connected to twitter stream');
			});

			stream.on('disconnect', function(req) {
				console.log('Disconnected from twitter stream');
			});

			stream.on('error', function(err) {
				console.log(err);
			});
		});
	});

	return router;
}

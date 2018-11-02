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

// Connected clients
var socketInfo = {};

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
				//console.log(JSON.stringify(data[0].trends[i].name, undefined, 2));
				let tag = data[0].trends[i].name;
				tag.split();
				if (tag[0] === '#') {
					trendingTags.push(tag);
				} else { // convert non-tags to tags
					trendingTags.push(`#${tag.replace(/\s+/g,'')}`);
				}
			}
		});
		res.json(trendingTags);
	});

	/**
	 * Socket.io connection which handles twitterfeed streaming
	 */
	io.on('connection', function (socket) {

		socketInfo[socket.id] = [];
		socketInfo[socket.id].socket = socket;
		socketInfo[socket.id].tags = []; // Store tags here

		//console.log(socketInfo);


		socket.on('disconnect', function() {
			console.log(`${socketInfo[socket.id].socket} Disconnected`); // [object object] ??

			if (stream != null) stream.stop(); // this stops the stream for all users (we dont want that)
		});
		
		socket.on('keyword', function(data) {
			var query = data.keyword;
			socketInfo[socket.id].tags = []; // Clean the current tags
			// socketInfo[socket.id].tags = (data.keyword.split(',')); // Add tag/keyword to socket info
			// console.log(socket.id + "has" + socketInfo[socket.id].tags);
			
			//query = query.trim();
			// store query into array for tracking 
			if (query.indexOf(',') > -1) { // multi-tag query
				var res = query.split(',');
				// ensures # is at the start of a query
				for (var i = 0; i < res.length; i++) {
					if (res[i].charAt(0) !== '#') {
						// trackedTags[i] = `#${res[i]}`;
						trackedTags.push(`#${res[i]}`);
						socketInfo[socket.id].tags.push(`#${res[i]}`);
					} else {
						// trackedTags[i] = `${res[i]}`;
						trackedTags.push(`${res[i]}`);
						socketInfo[socket.id].tags.push(`${res[i]}`);
					}
				}
				//console.log(trackedTags);
			} else { // single tag query
				if (query.charAt(0) !== '#') {
					// trackedTags[0] = `#${query}`;
					trackedTags.push(`#${query}`);
					socketInfo[socket.id].tags.push(`#${query}`);
				} else {
					// trackedTags[0] = `${query}`;
					trackedTags.push(`${query}`);
					socketInfo[socket.id].tags.push(`${query}`);
				}
				//console.log(trackedTags);
			}
			
			trackedTags = trackedTags.filter((v, i, a) => a.indexOf(v) === i);
			console.log('INPUT QUERY: ' + trackedTags);

			// checks for existing stream and closes it before establishing a new connection
			if (stream != null) {
				stream.stop();
				stream = api.stream('statuses/filter', {track: trackedTags, language: 'en'});
			} else {
				stream = api.stream('statuses/filter', {track: trackedTags, language: 'en'});
			}

			stream.on('tweet', function(data) { // reading stream
				var index = 0;

				// Get the full length of a tweet
				if (data.hasOwnProperty('extended_tweet')) { 
					//console.log(JSON.stringify(data.extended_tweet.full_text));
					var tweetTxt = data.extended_tweet.full_text;
				} else if (data.hasOwnProperty('retweeted_status')) {
					//console.log(JSON.stringify(data.retweeted_status.extended_tweet.full_text));
					if (data.retweeted_status.truncated == true) {
						var tweetTxt = data.retweeted_status.extended_tweet.full_text;
						//console.log(data);
					} else {
						var tweetTxt = data.retweeted_status.text;
						//console.log(data);
					}
				} else {
					var tweetTxt = data.text;
				}
				
				var tokenized_text = tokenizer.tokenize(data.text);
				// console.log(tokenized_text);
				var senti_score = analyzer.getSentiment(tokenized_text);
				// console.log(senti_score);

				/**
				 * Establishes what tag belongs to the tweet content to save to database
				 */
				for (var i = 0; i < trackedTags.length; i++) {
					// insert ? at the 2nd character positon of the tracked tag for regex expression: 0 or 1
					var tmp = [trackedTags[i].slice(0, 1),"?",trackedTags[i].slice(1)].join('');
					var regex = new RegExp(`${tmp.toLowerCase()}`);

					if (regex.test(tweetTxt.toLowerCase()) === true) { // matches -> break out of loop
						index = i;
						break;
					} else {
						// in the event where the retweet does not contain the tracked tag, check the quoted message
						// this happens when the quoted tweet is being tracked and not the retweet message
						if (data.hasOwnProperty('retweeted_status') && data.hasOwnProperty('quoted_status')) { 
							if (data.quoted_status.truncated == true) {
								var quoteExTxt = data.quoted_status.extended_tweet.full_text;
								if (regex.test(quoteExTxt.toLowerCase()) === true) {
									break;
								}
							} else {
								var quoteTxt = data.quoted_status.text;
								if (regex.test(quoteTxt.toLowerCase()) === true) {
									break;
								}
							}
						}
					}
				}

				// twitter content which fills the established mongodb model 
				var tweetContent = {
					query: trackedTags[index], // remove later
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
				// different tags are stored in different collections
				const Tweet = mongoose.model(`${trackedTags[index]}`, TweetSchema);
				//try {
					// get list of collections on mongodb server
					// mongoose.connection.db.listCollections().toArray(function (err, names) {
					// 	for (var i = 0; i < names.length; i++) {
					// 		console.log(names[i]['name']);
					// 		//if (trackedTags == names[i]['name']) 
					// 	}
					// });


					// Tweet.find({}).then(res => {
					// 	console.log(typeof(res));
					// 	console.log(res.length);
						
					// 	if (res.length <= 0) {
					// 		console.log('Tag does not exist on DB, creating new collection...');
					// 	} else {
					// 		console.log('Tag already exists...');
					// 	}
					// });
				// } catch (e) {
				// 	console.log(e);
				// }

				var twitterObject = new Tweet(tweetContent);
				// store twitterobject to database
				twitterObject.save(function (err) {
					if (err) { // failure
						console.log(err);
					} else {
						//console.log('SUCCESS: Stored JSON to DB');
						for(var sock in socketInfo) {
							// console.log(socketInfo[sock].tags); // Tags of the client
							for(var i = 0; i < socketInfo[sock].tags.length; i++) {
								// console.log("The query is ", tweetContent.query);
								// console.log("The tag is ", socketInfo[sock].tags[i]);
								if(tweetContent.query == socketInfo[sock].tags[i]) {
									socketInfo[sock].socket.emit('livetweets', {data: tweetContent});
									// console.log("Client contains tag	");
								}
							}
						}
						// socket.emit('livetweets', {data: tweetContent});
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

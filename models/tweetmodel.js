const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Generate tweet schema and model
const TweetSchema = new Schema ({
	query: String,
	id: String,
	userName: String,
	screenName: String,
	profileUrl: String,
	profileImgUrl: String,
	createdTime: Date,
	text: String
});

const Tweet = mongoose.model('TwitterFeed', TweetSchema);

module.exports = Tweet;
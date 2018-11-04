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
	text: String,
	score: Number
});

module.exports = TweetSchema;
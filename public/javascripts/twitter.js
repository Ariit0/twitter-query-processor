onload = function twitterFeed() {
	// Execute function once onload
	// Sends a post request to twitter API to get trending tags and store results in middleware
	if (sessionStorage.getItem('oneTime') === null) {
		$.post('/trending-tags', function (data) {
			readTags(data);
		});
		sessionStorage.setItem('oneTime', 'no');
	}
	// Sends a get request for trending tags from middleware
	$.get('/trending-tags', function (data) {
		readTags(data);
	});

	// Refresh page after all requests have been completed (1000ms to process)
	if (sessionStorage.getItem('once') === null) {
		setTimeout(function() {location.reload();}, 1000);
		sessionStorage.setItem('once', 'no');
	}
}

/**
 * Establish socket.io connetion once the webpage is ready
 */
$('document').ready(function() {
	console.log('Loaded');
	// connect socket client
	var socket = io();
	$('#sub').click(function() {
		$('#twitter-results').empty();
		socket.emit('keyword', {keyword: $('#keyword').val()});
	});
	// create twitter feed table
	socket.on('livetweets', function(data) {
		var tweet = data.data;
		let output = '<tr>';
		output += '<td class="tweetProfileImage"><img src="'+ tweet.profileImgUrl +'"alt="pfp"></td>'
		output += '<td class="tweetText"><div class="outer"><div class="innerTweetContent" id="tweetUserName"><a href="'+tweet.profileUrl+'" target="_blank">'+tweet.userName+' @'+tweet.screenName+'</a></div><div class="innerTweetContent">' + tweet.text + '</div></div></td>';
		output += '<td class="sentRes">' + emojifyScore(tweet.score) + '</td>';
		output += '</tr>';
		$('#overall-feeling').empty().append(`<tr><td>${CalcOverallFeeling(tweet.score)}</td></tr>`);
		$('#twitter-results').prepend(output);
	});
});


/**
 * Calculates the overall sentiment
 */
var totalSenti = 0;
var tweetCount = 0;
function CalcOverallFeeling(score) {
	tweetCount++;
	totalSenti += score;
	var overallFeelling = totalSenti / tweetCount

	$('#tweet-counter').empty().append(`${tweetCount}`);

	return emojifyScore(overallFeelling);
}

/**
 * Generates HTML ouput for trending tags
 */
function readTags(data) {
	var output = '<tr>';

	data.forEach(function (tag) {
		output += '<td class="text"><button type="button" value="'+ tag +'" class="btn btn-outline-dark btn-sm" onClick="autoFill(this);">' + tag + '</button></td>';
	});
	output += '</tr>';
	$("#trending-tags").prepend(output);
}

function emojifyScore(score) {
	var emoji;

	if(score < 0) {
		emoji = "😰";
	} else if(score > 0) {
		emoji = "🙂";
	} else {
		emoji = "😑";
	}
	return emoji;
}

function autoFill(buttonObject) {
	if(!$("#keyword").val()) {
		$("#keyword").val(buttonObject.value);
	} else {
		$("#keyword").val($("#keyword").val() + "," + buttonObject.value);
	}
}